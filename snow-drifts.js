/* Snow accumulation uses the existing animation loop; this layer never captures input. */
(function (root) {
  'use strict';
  const STEP = 5;
  const MAX_HEIGHT = 14;
  const MAX_DEBRIS = 140;
  const MAX_PILE = 24;
  class SnowDrifts {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas?.getContext('2d', { alpha: true });
      this.surfaces = new Map();
      this.debris = [];
      this.pointer = null;
    }
    resize(width, height, ratio = 1) {
      this.width = width; this.height = height;
      if (!this.canvas || !this.context) return;
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
      this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.width = width; this.height = height;
    }
    sync(descriptors) {
      const next = new Map();
      for (const rect of [...descriptors].sort((a,b) => a.y-b.y)) {
        if (rect.width < 24 || rect.y < 0) continue;
        const inset = Math.min(18, rect.width * .12);
        const width = rect.width - inset * 2;
        const count = Math.max(3, Math.ceil(width / STEP) + 1);
        const previous = this.surfaces.get(rect.key);
        let heights = previous?.heights;
        if (!heights || heights.length !== count) {
          heights = new Float32Array(count);
          for (let i = 1; i < count - 1; i++) {
            const t = i / (count - 1);
            const old = previous ? previous.heights[Math.round(t * (previous.heights.length - 1))] : 0;
            heights[i] = old || this.envelope(t) * (.45 + .4 * Math.sin(t * 12) ** 2);
          }
        }
        const phase = previous?.phase ?? Array.from(rect.key).reduce((sum, char) => sum + char.charCodeAt(0), 0) * .19;
        next.set(rect.key, { key: rect.key, x: rect.x + inset, y: rect.y + .5, width, heights, phase });
      }
      this.surfaces = next;
    }
    envelope(t) { return Math.min(1, Math.max(0, t * 8), Math.max(0, (1 - t) * 8)); }
    capacity(t, phase) {
      return MAX_HEIGHT * Math.sin(Math.PI * t) ** .65 * (.79 + .14 * Math.sin(t * 11 + phase) + .07 * Math.cos(t * 23 + phase));
    }
    deposit(x, beforeY, afterY, size = 3) {
      for (const surface of this.surfaces.values()) {
        const t = (x - surface.x) / surface.width;
        if (t <= 0 || t >= 1) continue;
        const index = Math.round(t * (surface.heights.length - 1));
        const top = surface.y - surface.heights[index];
        if (beforeY > top + 1 || afterY < top) continue;
        for (let i = Math.max(1, index - 4); i <= Math.min(surface.heights.length - 2, index + 4); i++) {
          const amount = Math.exp(-(((i - index) / 2) ** 2)) * Math.min(1.6, .45 + size * .12);
          surface.heights[i] = Math.max(surface.heights[i], Math.min(this.capacity(i / (surface.heights.length - 1), surface.phase), surface.heights[i] + amount));
        }
        return true;
      }
      return false;
    }
    spill(surface, amount, direction, speed) {
      if (amount < .02) return;
      const count = Math.min(8, Math.max(1, Math.ceil(amount * .6)));
      for (let i = 0; i < count && this.debris.length < MAX_DEBRIS; i++) {
        this.debris.push({ x: surface.x + (direction > 0 ? surface.width : 0), y: surface.y - Math.random() * 3,
          vx: direction * (.6 + Math.random() * .8) + Math.max(-2, Math.min(2, speed * .025)),
          vy: -Math.random() * .6, size: .8 + Math.random() * 1.6, life: 1 });
      }
    }
    brush(x, y) {
      const previous = this.pointer;
      if (!previous) { this.pointer = { x, y }; return 0; }
      const dx = x - previous.x, dy = y - previous.y;
      const length2 = dx * dx + dy * dy;
      if (length2 < .0001) return 0;
      this.pointer = { x, y };
      let spilled = 0;
      for (const surface of this.surfaces.values()) {
        const heights = surface.heights;
        const next = Float64Array.from(heights);
        const spacing = surface.width / (heights.length - 1);
        const add = (index, amount) => {
          if (index <= 0 || index >= heights.length - 1) {
            const left = index <= 0;
            const atEdge = left ? x <= surface.x + 6 : x >= surface.x + surface.width - 6;
            if (atEdge) { spilled += amount; this.spill(surface, amount, left ? -1 : 1, dx); }
            else next[left ? 1 : heights.length - 2] += amount;
          } else next[index] += amount;
        };
        for (let i = 1; i < heights.length - 1; i++) {
          const height = heights[i];
          if (height < .02) continue;
          const px = surface.x + i * spacing, py = surface.y - Math.min(MAX_PILE, height) * .5;
          const t = Math.max(0, Math.min(1, ((px - previous.x) * dx + (py - previous.y) * dy) / length2));
          const distance = Math.hypot(px - (previous.x + dx * t), py - (previous.y + dy * t));
          if (distance >= 24) continue;
          const horizontal = Math.abs(dx) > .00001 && Math.abs(dx) >= Math.abs(dy) * .5;
          // Touch only snow in front of the moving cursor; moving away never pulls it back.
          if (horizontal && (dx > 0 ? px < previous.x - 2 : px > previous.x + 2)) continue;
          const amount = height * Math.min(1, (24 - distance) / 8) * (horizontal ? 1 : Math.min(.85, Math.sqrt(length2) / 16));
          next[i] -= amount;
          if (!horizontal) {
            // Vertical stirring mixes neighboring grains without deleting them.
            add(i - 1, amount * .5); add(i + 1, amount * .5);
          } else {
            // Local contact impulse, without snapping snow to a point on the cursor.
            const front = dx > 0 ? Math.max(px + dx, x + 6) : Math.min(px + dx, x - 6);
            const target = (front - surface.x) / spacing, left = Math.floor(target), fraction = target - left;
            add(left, amount * (1 - fraction)); add(left + 1, amount * fraction);
          }
        }
        // Preserve compressed volume; limit only its visible height.
        heights.set(next);
      }
      return spilled;
    }
    forgetPointer() { this.pointer = null; }
    clear() {
      this.surfaces.clear(); this.debris.length = 0; this.pointer = null;
      this.context?.clearRect(0, 0, this.width || 0, this.height || 0);
    }
    step(delta) {
      for (const surface of this.surfaces.values()) {
        const h = surface.heights;
        // Fine flakes settle between visible crystals, keeping a soft continuous cap.
        for (let i = 1; i < h.length - 1; i++) {
          const t = i / (h.length - 1);
          const cap = this.capacity(t, surface.phase);
          h[i] += Math.max(0, Math.min(cap - h[i], delta * .0015 * this.envelope(t) * (.7 + .3 * Math.sin(t * 18) ** 2)));
        }
      }
      this.debris = this.debris.filter(p => {
        p.x += p.vx * delta; p.y += p.vy * delta;
        p.vy += .055 * delta; p.vx *= Math.pow(.985, delta); p.life -= .012 * delta;
        return p.life > 0 && p.y < this.height + 10;
      });
    }
    draw(delta = 0) {
      const ctx = this.context;
      if (!ctx) return;
      if (delta) this.step(delta);
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
        const fill = ctx.createLinearGradient(0, surface.y - MAX_HEIGHT, 0, surface.y + 2);
        fill.addColorStop(0, '#ffffff'); fill.addColorStop(.6, '#f3f7fb'); fill.addColorStop(1, 'rgba(184,204,222,.94)');
        ctx.shadowColor = 'rgba(20,35,49,.22)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
        ctx.fillStyle = fill; ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      }
      for (const p of this.debris) {
        ctx.globalAlpha = Math.min(1, p.life * 1.4); ctx.fillStyle = '#f6fbff';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = SnowDrifts;
  else root.SnowDrifts = SnowDrifts;
})(globalThis);
