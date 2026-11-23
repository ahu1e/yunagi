(() => {
  // Some engines parse SVG backdrop filters without rendering them.
  const isChromium = navigator.userAgentData?.brands?.some(({ brand }) => brand === "Chromium")
    || /\b(?:Headless)?Chrome\/\d+/.test(navigator.userAgent);
  if (!isChromium || !CSS.supports("backdrop-filter", "blur(1px)")) return;

  const surfaceSelector = "[data-glass-lens]";
  const reduceTransparency = matchMedia("(prefers-reduced-transparency: reduce)");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.classList.add("glass-filter-definitions");
  svg.setAttribute("aria-hidden", "true");
  const defs = document.createElementNS(namespace, "defs");
  svg.append(defs);
  document.body.append(svg);

  const displacementScale = 56;
  const surfaces = new Map();
  let nextId = 0;

  function displacementImage(width, height, radius) {
    // The rim carries the displacement. The center stays neutral so the
    // wallpaper stays sharp there and the browser can use a smaller map.
    const resolution = Math.min(1, 560 / Math.max(width, height));
    canvas.width = Math.ceil(width * resolution);
    canvas.height = Math.ceil(height * resolution);
    const image = context.createImageData(canvas.width, canvas.height);
    const bevel = Math.min(24, height * .28, width * .28);
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    for (let row = 0; row < image.height; row++) {
      const y = (row + .5) * height / image.height - halfHeight;
      const dy = Math.abs(y) - (halfHeight - radius);
      for (let column = 0; column < image.width; column++) {
        const x = (column + .5) * width / image.width - halfWidth;
        const dx = Math.abs(x) - (halfWidth - radius);
        const cornerX = Math.max(dx, 0);
        const cornerY = Math.max(dy, 0);
        const cornerDistance = Math.sqrt(cornerX * cornerX + cornerY * cornerY);
        const depth = radius - (cornerDistance + Math.min(Math.max(dx, dy), 0));
        const blend = 1 - Math.max(0, Math.min(depth / bevel, 1));
        const strength = 255 * .46 * blend * blend;
        const normalX = cornerDistance ? cornerX / cornerDistance : Number(dx > dy);
        const normalY = cornerDistance ? cornerY / cornerDistance : Number(dy >= dx);
        const index = (row * image.width + column) * 4;

        // Red and green encode inward sampling along the rounded edge normal.
        image.data[index] = 127.5 - Math.sign(x) * normalX * strength;
        image.data[index + 1] = 127.5 - Math.sign(y) * normalY * strength;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  }

  function makeFilter() {
    const filter = document.createElementNS(namespace, "filter");
    filter.id = `glass-refraction-${++nextId}`;
    filter.setAttribute("x", "0%");
    filter.setAttribute("y", "0%");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");
    filter.setAttribute("color-interpolation-filters", "sRGB");

    const map = document.createElementNS(namespace, "feImage");
    map.setAttribute("preserveAspectRatio", "none");
    map.setAttribute("result", "displacement");

    const refraction = document.createElementNS(namespace, "feDisplacementMap");
    refraction.setAttribute("in", "SourceGraphic");
    refraction.setAttribute("in2", "displacement");
    refraction.setAttribute("scale", displacementScale);
    refraction.setAttribute("xChannelSelector", "R");
    refraction.setAttribute("yChannelSelector", "G");
    filter.append(map, refraction);
    defs.append(filter);
    return { filter, map, geometry: "" };
  }

  const resizeObserver = new ResizeObserver(entries => {
    for (const { target, borderBoxSize } of entries) {
      if (!surfaces.has(target)) continue;
      const { inlineSize, blockSize } = borderBoxSize[0];
      const width = Math.round(inlineSize);
      const height = Math.round(blockSize);
      if (width < 2 || height < 2) continue;
      const radius = Math.min(parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0, width / 2, height / 2);
      const geometry = `${width}:${height}:${radius}`;
      const surface = surfaces.get(target) ?? makeFilter();
      if (surface.geometry === geometry) continue;

      surface.map.setAttribute("href", displacementImage(width, height, radius));
      surface.geometry = geometry;
      surfaces.set(target, surface);
      target.style.setProperty("--glass-refraction", `url(#${surface.filter.id})`);
    }
  });

  function syncSurfaces() {
    const enabled = new Set(reduceTransparency.matches ? [] : document.querySelectorAll(surfaceSelector));
    for (const [surface, lens] of surfaces) {
      if (enabled.has(surface)) continue;
      resizeObserver.unobserve(surface);
      lens?.filter.remove();
      surfaces.delete(surface);
      surface.style.removeProperty("--glass-refraction");
    }
    for (const surface of enabled) {
      if (surfaces.has(surface)) continue;
      surfaces.set(surface, null);
      resizeObserver.observe(surface, { box: "border-box" });
    }
  }

  const changes = new MutationObserver(syncSurfaces);
  changes.observe(document.getElementById("drawerContent"), { childList: true, subtree: true });
  reduceTransparency.addEventListener("change", syncSurfaces);
  syncSurfaces();
})();
