/* Snow accumulation uses the existing animation loop; this layer never captures input. */
(function (root) {
  'use strict';
  const STEP = 5;
  const MAX_HEIGHT = 14;
  const MAX_DEBRIS = 140;
  const MAX_PILE = 24;
  const BRUSH_RADIUS = 24;
  const MAX_DUST = 100;
  const DUST_SPEED = .85;
  const SETTLED_SLOPE = .65;
  const SPILL_DURATION = 21;
  const SPILL_GRAVITY = .105;
  const MAX_SPILLS = 12;
  const DEPOSIT_WEIGHTS = Array.from({ length: 5 }, (_, i) => Math.exp(-((i / 2) ** 2)));
  class SnowDrifts {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas?.getContext('2d', { alpha: true });
      this.surfaces = new Map();
      this.debris = [];
      this.spills = [];
      this.fragments = new Map();
      this.pointer = null;
    }
    resize(width, height, ratio = 1) {
      this.width = width; this.height = height;
      if (!this.canvas || !this.context) return;
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
      this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
      for (const surface of this.surfaces.values()) surface.fill = null;
    }
    sync(descriptors) {
      const next = new Map();
      for (const rect of [...descriptors].sort((a,b) => a.y-b.y)) {
        if (rect.width < 24 || rect.y < 0) continue;
        const inset = Math.min(18, rect.width * .12);
        const width = rect.width - inset * 2;
        const count = Math.max(3, Math.ceil(width / STEP) + 1);
        const previous = this.surfaces.get(rect.key);
        const y = rect.y + .5;
        if (previous?.heights.length === count) {
          if (previous.y !== y) previous.fill = null;
          Object.assign(previous, { x: rect.x + inset, y, width });
          next.set(rect.key, previous);
          continue;
        }
        const heights = new Float32Array(count);
        const caps = new Float32Array(count);
        const phase = Array.from(rect.key).reduce((sum, char) => sum + char.charCodeAt(0), 0) * .19;
        for (let i = 1; i < count - 1; i++) {
          const t = i / (count - 1);
          const oldIndex = t * ((previous?.heights.length ?? 1) - 1);
          const left = Math.floor(oldIndex);
          heights[i] = previous
            ? previous.heights[left] + (previous.heights[left + 1] - previous.heights[left]) * (oldIndex - left)
            : 0;
          caps[i] = this.capacity(t, phase);
        }
        next.set(rect.key, { x: rect.x + inset, y, width, heights, caps, scratch: new Float64Array(count) });
      }
      if (!next.size && this.surfaces.size) this.context?.clearRect(0, 0, this.width, this.height);
      this.surfaces = next;
    }
    capacity(t, phase) {
      return MAX_HEIGHT * Math.sin(Math.PI * t) ** .65 * (.79 + .14 * Math.sin(t * 11 + phase) + .07 * Math.cos(t * 23 + phase));
    }
    deposit(x, beforeY, afterY, size = 3, endX = x, source = null, volume = null) {
      const dy = afterY - beforeY;
      if (dy <= 0) return false;
      const dx = endX - x;
      let hit = null, hitTime = Infinity;
      for (const surface of this.surfaces.values()) {
        if (surface === source || afterY < surface.y - MAX_PILE || beforeY > surface.y) continue;
        if (Math.max(x, endX) <= surface.x || Math.min(x, endX) >= surface.x + surface.width) continue;
        const heights = surface.heights;
        const spacing = surface.width / (heights.length - 1);
        const start = (x - surface.x) / spacing;
        const velocity = dx / spacing;
        // Check each crossed section of the profile. The snow line within each cell is linear.
        const first = Math.max(0, Math.floor(Math.min(start, start + velocity)));
        const last = Math.min(heights.length - 2, Math.floor(Math.max(start, start + velocity)));
        for (let i = first; i <= last; i++) {
          const left = Math.min(MAX_PILE, heights[i]);
          const slope = Math.min(MAX_PILE, heights[i + 1]) - left;
          const relativeSpeed = dy + slope * velocity;
          if (relativeSpeed <= 0) continue;
          const time = (surface.y - left - slope * (start - i) - beforeY) / relativeSpeed;
          const cell = start + time * velocity;
          if (time < 0 || time > 1 || time >= hitTime || cell < i || cell > i + 1) continue;
          hitTime = time;
          hit = surface;
        }
      }
      if (!hit) return false;
      const index = Math.max(1, Math.min(hit.heights.length - 2,
        Math.round((x + dx * hitTime - hit.x) / hit.width * (hit.heights.length - 1))));
      const radius = size < 3 ? 1 : size < 6 ? 2 : 3;
      const first = Math.max(1, index - radius);
      const last = Math.min(hit.heights.length - 2, index + radius);
      let weight = 0;
      for (let i = first; i <= last; i++) weight += DEPOSIT_WEIGHTS[Math.abs(i - index)];
      const amount = (volume ?? Math.min(4.5, .4 + size * .58)) / weight;
      for (let i = first; i <= last; i++) {
        hit.heights[i] = Math.max(hit.heights[i],
          Math.min(hit.caps[i], hit.heights[i] + DEPOSIT_WEIGHTS[Math.abs(i - index)] * amount));
      }
      return true;
    }
    spill(surface, volume, direction, speed) {
      if (volume < .02) return;
      const edge = surface.x + (direction > 0 ? surface.width : 0);
      const width = Math.min(12, 1.5 + Math.sqrt(volume) * .95);
      const recent = this.spills.find(spill => spill.source === surface && spill.direction === direction && spill.age < 4);
      if (recent) {
        recent.volume += volume;
        recent.width = Math.max(recent.width, width);
        return;
      }
      if (this.spills.length >= MAX_SPILLS) return;
      this.spills.push({
        x: edge, y: surface.y, direction, source: surface, volume, width,
        speed: 1.05 + Math.min(.85, speed * .22), age: 0, emitted: 0,
      });
    }
    scatter(x, y, amount, direction, speed, dust, source, fall = 0) {
      if (amount <= 0) return;
      const limit = dust ? MAX_DUST : MAX_DEBRIS;
      const count = Math.min(limit - this.debris.length, dust ? 5 : 3, Math.ceil(amount * (dust ? 10 : .9)));
      for (let i = 0; i < count; i++) {
        const powder = dust || (i > 0 && Math.random() < .75);
        const size = powder ? 1.2 + Math.random() * 2.4 : 3 + Math.random() * Math.min(6, Math.sqrt(amount) * 1.5);
        this.debris.push({
          x: x + (Math.random() - .5) * (powder ? 7 : 3), y: y + (Math.random() - .5) * 3,
          vx: direction * (Math.min(3, speed) * (powder ? .42 : .78) + (Math.random() - .35) * (powder ? 2.2 : 1)),
          vy: fall * (powder ? .34 : .82) + (Math.random() - .7) * (powder ? 1.4 : .7),
          size, life: 1, powder, source, volume: amount / count,
          variant: Math.floor(Math.random() * 8), angle: Math.random() * Math.PI,
          spin: (Math.random() - .5) * (powder ? .24 : .17),
        });
      }
    }
    fragmentSprite(powder, variant) {
      const key = variant + (powder ? 8 : 0);
      if (this.fragments.has(key)) return this.fragments.get(key);
      const sprite = this.canvas.ownerDocument.createElement('canvas');
      sprite.width = sprite.height = 32;
      const ctx = sprite.getContext('2d');
      if (!ctx) return null;
      const shape = Array.from({ length: 12 }, (_, i) => {
        const angle = i * Math.PI / 6;
        const radius = 8 + (i * i * 7 + i * 3 + variant * (i + 5)) % 8;
        return [16 + Math.cos(angle) * radius, 16 + Math.sin(angle) * radius * (.49 + variant * .055)];
      });
      const fill = ctx.createLinearGradient(0, 6, 5, 27);
      fill.addColorStop(0, '#fff');
      fill.addColorStop(.58, '#e8f2fb');
      fill.addColorStop(1, powder ? 'rgba(211,227,244,.1)' : '#a0b8d0');
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo((shape[0][0] + shape[11][0]) / 2, (shape[0][1] + shape[11][1]) / 2);
      for (let i = 0; i < shape.length; i++) {
        const [x, y] = shape[i];
        const [nextX, nextY] = shape[(i + 1) % shape.length];
        ctx.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = powder ? .24 : .6;
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 15; i++) {
        const x = 6 + (i * 13 + variant * 7) % 21;
        const y = 9 + (i * 7 + variant * 5) % 14;
        ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1, 1);
      }
      this.fragments.set(key, sprite);
      return sprite;
    }
    brush(x, y, time = performance.now()) {
      const previous = this.pointer;
      this.pointer = { x, y, time };
      if (!previous) return 0;
      const dx = x - previous.x, dy = y - previous.y;
      const length2 = dx * dx + dy * dy;
      if (length2 < .0001) return 0;
      const length = Math.sqrt(length2);
      const speed = length / Math.max(1, time - previous.time);
      const horizontal = Math.abs(dx) > .00001 && Math.abs(dx) >= Math.abs(dy) * .5;
      const leftX = Math.min(x, previous.x) - BRUSH_RADIUS;
      const rightX = Math.max(x, previous.x) + BRUSH_RADIUS;
      const topY = Math.min(y, previous.y) - BRUSH_RADIUS;
      const bottomY = Math.max(y, previous.y) + BRUSH_RADIUS;
      let spilled = 0;
      for (const surface of this.surfaces.values()) {
        if (surface.x > rightX || surface.x + surface.width < leftX ||
            surface.y < topY || surface.y - MAX_PILE / 2 > bottomY) continue;
        const heights = surface.heights;
        const next = surface.scratch;
        const spacing = surface.width / (heights.length - 1);
        const first = Math.max(1, Math.ceil((leftX - surface.x) / spacing));
        const last = Math.min(heights.length - 2, Math.floor((rightX - surface.x) / spacing));
        let leftSpill = 0, rightSpill = 0;
        let dustAmount = 0, dustX = 0, dustY = 0;
        let firstChanged = heights.length, lastChanged = 0;
        const add = (index, amount) => {
          if (index <= 0 && x <= surface.x + 6) {
            leftSpill += amount;
            return;
          }
          if (index >= heights.length - 1 && x >= surface.x + surface.width - 6) {
            rightSpill += amount;
            return;
          }
          index = Math.max(1, Math.min(heights.length - 2, index));
          next[index] += amount;
          firstChanged = Math.min(firstChanged, index);
          lastChanged = Math.max(lastChanged, index);
        };
        for (let i = first; i <= last; i++) {
          const height = heights[i];
          if (height < .02) continue;
          const px = surface.x + i * spacing, py = surface.y - Math.min(MAX_PILE, height) * .5;
          const t = Math.max(0, Math.min(1, ((px - previous.x) * dx + (py - previous.y) * dy) / length2));
          const distance = Math.hypot(px - (previous.x + dx * t), py - (previous.y + dy * t));
          if (distance >= BRUSH_RADIUS) continue;
          if (horizontal && (dx > 0 ? px < previous.x - 2 : px > previous.x + 2)) continue;
          let amount = height * Math.min(1, (BRUSH_RADIUS - distance) / 8) * (horizontal ? 1 : Math.min(.85, length / 16));
          add(i, -amount);
          if (speed >= DUST_SPEED && distance < 12 && this.debris.length < MAX_DUST) {
            const dust = Math.min(amount * .025, .6 - dustAmount);
            if (dust > 0) {
              dustAmount += dust;
              dustX = px;
              dustY = py;
            }
            amount -= dust;
          }
          if (!horizontal) {
            add(i - 1, amount * .5);
            add(i + 1, amount * .5);
          } else {
            const front = dx > 0 ? Math.max(px + dx, x + 6) : Math.min(px + dx, x - 6);
            const target = (front - surface.x) / spacing, left = Math.floor(target), fraction = target - left;
            add(left, amount * (1 - fraction));
            add(left + 1, amount * fraction);
          }
        }
        if (dustAmount > 0) {
          this.scatter(dustX, dustY, dustAmount, Math.sign(dx), speed, true, surface);
        }
        this.spill(surface, leftSpill, -1, speed);
        this.spill(surface, rightSpill, 1, speed);
        spilled += leftSpill + rightSpill;
        for (let i = firstChanged; i <= lastChanged; i++) {
          heights[i] = Math.max(0, heights[i] + next[i]);
          next[i] = 0;
        }
      }
      return spilled;
    }
    forgetPointer() { this.pointer = null; }
    clear() {
      if (this.surfaces.size || this.debris.length || this.spills.length) this.context?.clearRect(0, 0, this.width, this.height);
      this.surfaces.clear(); this.debris.length = 0; this.spills.length = 0; this.pointer = null;
    }
    step(delta, wind = 0) {
      for (const { heights, width } of this.surfaces.values()) {
        const maxRise = width / (heights.length - 1) * SETTLED_SLOPE;
        for (let i = 1; i < heights.length - 2; i++) {
          const difference = heights[i] - heights[i + 1];
          if (Math.abs(difference) <= maxRise) continue;
          const transfer = (difference - Math.sign(difference) * maxRise) * Math.min(.25, delta * .075);
          heights[i] -= transfer;
          heights[i + 1] += transfer;
        }
      }
      const drag = Math.pow(.985, delta);
      let live = 0;
      for (const p of this.debris) {
        const previousX = p.x, previousY = p.y;
        p.angle += p.spin * delta;
        p.x += (p.vx + wind * (p.powder ? 1.3 : .18) + (p.powder ? Math.sin(p.angle) * .35 : 0)) * delta;
        p.y += p.vy * delta;
        if (this.deposit(previousX, previousY, p.y, p.size, p.x, p.source, p.volume)) continue;
        p.vy += (p.powder ? .035 : .15) * delta;
        p.vx *= drag;
        p.life -= (p.powder ? .026 : .009) * delta;
        if (p.life > 0 && p.y < this.height + 10) this.debris[live++] = p;
      }
      this.debris.length = live;
      live = 0;
      for (const spill of this.spills) {
        const before = spill.age;
        spill.age = Math.min(SPILL_DURATION, before + delta);
        const age = spill.age;
        const remaining = spill.volume - spill.emitted;
        const x = spill.x + spill.direction * spill.speed * age;
        const y = spill.y + SPILL_GRAVITY * age * age;
        if (this.deposit(spill.x + spill.direction * spill.speed * before,
          spill.y + SPILL_GRAVITY * before * before, y, spill.width, x, spill.source, remaining)) continue;
        if (age >= 4 && (Math.floor(age / 3) > Math.floor(before / 3) || age === SPILL_DURATION)) {
          const portion = Math.min(remaining, spill.volume * (age / SPILL_DURATION) ** 2 - spill.emitted);
          if (portion > 0) {
            this.scatter(x, y, portion, spill.direction, spill.speed, false, spill.source, age * SPILL_GRAVITY * 2);
            spill.emitted += portion;
          }
        }
        if (age < SPILL_DURATION) this.spills[live++] = spill;
      }
      this.spills.length = live;
    }
    draw(delta = 0, wind = 0) {
      const ctx = this.context;
      if (!ctx || (!this.surfaces.size && !this.debris.length && !this.spills.length)) return;
      if (delta) this.step(delta, wind);
      ctx.clearRect(0, 0, this.width, this.height);
      for (const surface of this.surfaces.values()) {
        const h = surface.heights;
        ctx.beginPath(); ctx.moveTo(surface.x, surface.y);
        for (let i = 0; i < h.length - 1; i++) {
          const x = surface.x + i / (h.length - 1) * surface.width;
          const nextX = surface.x + (i + 1) / (h.length - 1) * surface.width;
          ctx.quadraticCurveTo(x, surface.y - Math.min(MAX_PILE, h[i]), (x + nextX) / 2, surface.y - (Math.min(MAX_PILE, h[i]) + Math.min(MAX_PILE, h[i + 1])) / 2);
        }
        ctx.lineTo(surface.x + surface.width, surface.y); ctx.closePath();
        if (!surface.fill) {
          const fill = ctx.createLinearGradient(0, surface.y - MAX_HEIGHT, 0, surface.y + 1);
          fill.addColorStop(0, '#ffffff');
          fill.addColorStop(.65, '#f5f8fc');
          fill.addColorStop(1, 'rgba(200,217,233,.88)');
          surface.fill = fill;
        }
        ctx.fillStyle = surface.fill;
        ctx.fill();
      }
      for (const spill of this.spills) {
        const { x, y, age, direction, speed, width } = spill;
        const tail = Math.max(0, age * 1.5 - 14);
        const tailX = x + direction * (tail * speed - 5);
        const tailY = y + SPILL_GRAVITY * tail * tail;
        const tipX = x + direction * (age * speed + 3);
        const tipY = y + SPILL_GRAVITY * age * age;
        const bendX = x + direction * (age * speed * .82 + 3);
        const bendY = (tailY + tipY) / 2;
        const thickness = width * (1 - (age / SPILL_DURATION) ** 1.6);
        ctx.globalAlpha = .87;
        ctx.fillStyle = '#eaf3fb';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY - thickness * .65);
        ctx.quadraticCurveTo(bendX, bendY - thickness, tipX, tipY - thickness * .32);
        ctx.quadraticCurveTo(tipX + direction * thickness * .4, tipY + thickness * .55, tipX, tipY + thickness * .45);
        ctx.quadraticCurveTo(bendX - direction * thickness, bendY + thickness * .23, tailX, tailY + thickness * .2);
        ctx.quadraticCurveTo(tailX - direction * 3, tailY - thickness * .05, tailX, tailY - thickness * .65);
        ctx.fill();
        ctx.globalAlpha = .66;
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 8; i++) {
          const point = tail + (age - tail) * (i + 1) / 9;
          const offset = ((i * 7) % 5 - 2) * thickness * .14;
          const grainX = x + direction * (point * speed - 1);
          const grainY = y + SPILL_GRAVITY * point * point + offset;
          ctx.fillRect(grainX, grainY, i % 3 === 0 ? 1.4 : .7, .8);
        }
      }
      for (const p of this.debris) {
        const sprite = this.fragmentSprite(p.powder, p.variant);
        if (!sprite) continue;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life * (p.powder ? .65 : 2));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = SnowDrifts;
  else root.SnowDrifts = SnowDrifts;
})(globalThis);
