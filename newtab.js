// Страховка волны появления (см. revealWhenWallpaperReady): волна стартует
// только после готовности фона, поэтому если проверка почему-то не случится,
// таймер всё равно раскроет страницу. Первый оператор файла: ошибки ниже
// не должны оставлять пустой экран.
setTimeout(() => document.body.classList.add("assets-ready"), 2000);

const DEFAULTS = {
  bookmarks: [
    { name: "YouTube", url: "https://youtube.com", color: "#d34b4b" },
    { name: "Spotify", url: "https://open.spotify.com", color: "#4e946b" },
    { name: "Reddit", url: "https://reddit.com", color: "#bd654e" },
    { name: "Twitch", url: "https://twitch.tv", color: "#7662a8" },
    { name: "GitHub", url: "https://github.com", color: "#59606b" },
    { name: "X", url: "https://x.com", color: "#4e535b" }
  ],
  engine: "google",
  city: "Tokyo",
  cityLocation: null,
  units: "celsius",
  timeFormat: "24",
  brightness: 76,
  shade: 27,
  scale: 100,
  position: "center",
  accent: "snow",
  surfaceStyle: "metal",
  customWallpaper: "",
  customVideo: "",
  hasCustomVideo: false,
  videoEnabled: false,
  parallaxEnabled: false,
  widgetSizes: { weather: 100, bookmarks: 100, date: 100, clock: 100 },
  hiddenWidgets: [],
  faviconEnabled: true,
  iconStyle: "color",
  layoutMode: "free",
  widgetLayout: {
    weather: { x: 1, y: 1, w: 2, h: 0 },
    bookmarks: { x: 1, y: 3, w: 1, h: 0 },
    date: { x: 22, y: 1, w: 2, h: 0 },
    clock: { x: 22, y: 3, w: 2, h: 0 },
    search: { x: 8, y: 10, w: 10, h: 0 }
  },
  clockDisplay: "both",
  showCaption: true,
  snowEnabled: false,
  snowAccumulation: true,
  snowDensity: 45,
  snowWind: 20,
  snowSchedule: false,
  themeMode: "manual",
  idleClockDelay: 120,
  focusNote: "",
  focusTasks: []
};

const ENGINES = {
  google: { label: "Google", mark: "G", url: "https://www.google.com/search?q=" },
  duckduckgo: { label: "DuckDuckGo", mark: "D", url: "https://duckduckgo.com/?q=" },
  bing: { label: "Bing", mark: "b", url: "https://www.bing.com/search?q=" }
};

// Короткие спокойные образы: без советов, оценок и призывов.
const SEARCH_CAPTIONS = [
  "Мягкий свет и немного тишины",
  "Тихое начало нового дня",
  "Шелест листвы за открытым окном",
  "Тёплый свет в знакомом окне",
  "Небо отражается в воде",
  "Лёгкий ветер в кронах деревьев",
  "Тихий вечер у окна",
  "Солнечные пятна на полу",
  "Капли дождя на стекле",
  "Свет сквозь тонкие шторы",
  "Запах свежего воздуха после дождя",
  "Медленные облака над городом",
  "Прохлада утра и тёплая чашка",
  "Далёкий шум моря",
  "Мягкие тени в вечернем свете",
  "Тихий сад после дождя",
  "Последние лучи на крышах",
  "Тёплый плед и открытая книга",
  "Свет фонарей на мокрой улице",
  "Тишина между волнами",
  "Ахули нет то?)"
];

const CAPTION_ROTATE_MS = 5 * 60 * 1000;
let captionIndex = 0;
let captionTimer = 0;

const WEATHER_SYMBOLS = {
  clearsky: ["☀", "Ясно"], fair: ["🌤", "Преимущественно ясно"],
  partlycloudy: ["⛅", "Переменная облачность"], cloudy: ["☁", "Облачно"], fog: ["🌫", "Туман"],
  lightrain: ["🌦", "Небольшой дождь"], rain: ["🌧", "Дождь"], heavyrain: ["🌧", "Сильный дождь"],
  lightrainshowers: ["🌦", "Кратковременный дождь"], rainshowers: ["🌧", "Ливень"], heavyrainshowers: ["🌧", "Сильный ливень"],
  lightsleet: ["🌧", "Небольшой дождь со снегом"], sleet: ["🌨", "Дождь со снегом"], heavysleet: ["🌨", "Сильный дождь со снегом"],
  lightsnow: ["🌨", "Небольшой снег"], snow: ["❄", "Снег"], heavysnow: ["❄", "Сильный снег"],
  lightsnowshowers: ["🌨", "Небольшой снегопад"], snowshowers: ["❄", "Снегопад"], heavysnowshowers: ["❄", "Сильный снегопад"],
  rainandsnow: ["🌨", "Дождь со снегом"], heavyrainandsnow: ["🌨", "Сильный дождь со снегом"],
  lightrainandthunder: ["⛈", "Дождь с грозой"], rainandthunder: ["⛈", "Дождь с грозой"],
  heavyrainandthunder: ["⛈", "Сильная гроза"], thunderstorm: ["⛈", "Гроза"]
};

function weatherPresentation(symbol) {
  const normalized = String(symbol || "cloudy").replace(/_(day|night|polartwilight)$/, "");
  if (WEATHER_SYMBOLS[normalized]) return WEATHER_SYMBOLS[normalized];
  if (normalized.includes("thunder")) return ["⛈", "Гроза"];
  if (normalized.includes("snow")) return ["❄", "Снег"];
  if (normalized.includes("sleet")) return ["🌨", "Дождь со снегом"];
  if (normalized.includes("rain")) return ["🌧", "Дождь"];
  return ["☁", "Облачно"];
}

function weatherSvg(icon) {
  const cloud = '<path d="M6 17h11a4 4 0 0 0 .2-8A5.5 5.5 0 0 0 6.6 8 4.5 4.5 0 0 0 6 17Z"/>';
  const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>';
  const snow = '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3"/>';
  let paths = cloud;
  if (icon === "☀") paths = sun;
  else if (icon === "❄") paths = snow;
  else if (icon === "⛈") paths += '<path d="m12 14-3 5h4l-2 4"/>';
  else if (["🌧", "🌦", "🌨"].includes(icon)) paths += '<path d="m7 20-1 2m6-2-1 2m6-2-1 2"/>';
  else if (icon === "🌫") paths += '<path d="M4 20h16M7 23h10"/>';
  else if (["🌤", "⛅"].includes(icon)) paths = '<path d="M5 2v2M1 6h2m5-3L7 4"/><path d="M3 10a4 4 0 1 1 7-3"/>' + cloud;
  return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg>';
}

async function fetchWeatherJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Ошибка сервиса погоды: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

const ACCENT_PALETTES = {
  snow: { color: "#f5f1e9", edge: "rgba(255,255,255,.30)" },
  ice: { color: "#cce9f4", edge: "rgba(204,233,244,.36)" },
  lavender: { color: "#ded0f4", edge: "rgba(222,208,244,.34)" },
  rose: { color: "#f0cad9", edge: "rgba(240,202,217,.34)" },
  moss: { color: "#d6e4d0", edge: "rgba(214,228,208,.34)" }
};

let settings = structuredClone(DEFAULTS);
let drawerKind = "general";
let toastTimer;
let weatherRequest = 0;
let snowContext;
let snowflakes = [];
let snowFrame = 0;
let snowLastFrame = 0;
let snowResizeFrame = 0;
const snowSpriteCache = new Map();
let draggedBookmarkIndex = null;
let parallaxFrame = 0;
let focusNoteSaveTimer;
let videoObjectUrl = "";
let videoObjectSource = "";
let videoLoadingSource = "";
let videoLoadingPromise = null;
let videoLoadGeneration = 0;
let idleTimer = 0;
let lastIdleResetAt = 0;
let wallpaperObjectUrl = "";
let wallpaperObjectSource = "";
let wallpaperLoadingSource = "";
let wallpaperLoadingPromise = null;
let wallpaperLoadGeneration = 0;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let savedSettings = {};
let saveQueue = Promise.resolve();
const pendingStorageKeys = new Map();

async function loadSettings() {
  let readFailed = false;
  try {
    let stored;
    if (globalThis.chrome?.storage?.local) {
      stored = await chrome.storage.local.get([...Object.keys(DEFAULTS).filter(key => key !== "customVideo"), "snowIntensity"]);
      if (stored.videoEnabled && stored.hasCustomVideo) Object.assign(stored, await chrome.storage.local.get("customVideo"));
    } else stored = JSON.parse(localStorage.getItem("yunagi-settings") || localStorage.getItem("yukinagi-settings") || "{}");
    settings = normalizeImportedSettings(stored);
    // Disabled video is kept in storage without loading its large data URL.
    if (!stored.videoEnabled && stored.hasCustomVideo) settings.hasCustomVideo = true;
  } catch (error) {
    readFailed = true;
    console.warn("yunagi: using default settings", error);
    settings = structuredClone(DEFAULTS);
    showToast("Не удалось прочитать настройки. Исходные данные не изменены.");
  }
  savedSettings = structuredClone(settings);
  if (!readFailed && migrateWidgetLayout(settings.widgetLayout)) saveSettings();
}

// Прежний дефолт держал правый столбец в колонке 22 — колонка 24 оставалась пустой,
// и правый край виджетов не совпадал с отступом слева. Сдвигаем только нетронутый макет.
function migrateWidgetLayout(layout) {
  const dateCell = layout?.date;
  const clockCell = layout?.clock;
  if (!dateCell || !clockCell) return false;
  const untouched =
    dateCell.x === 22 && dateCell.w === 2 && dateCell.y === 1 &&
    clockCell.x === 22 && clockCell.w === 2 && clockCell.y === 3;
  if (!untouched) return false;
  dateCell.x = 23;
  clockCell.x = 23;
  return true;
}

function saveSettings(options = {}) {
  const patch = {};
  for (const [key, value] of Object.entries(settings)) {
    if (!options.includeMedia && ["customWallpaper", "customVideo"].includes(key)) continue;
    if (JSON.stringify(value) !== JSON.stringify(savedSettings[key])) patch[key] = structuredClone(value);
  }
  if (!Object.keys(patch).length) return saveQueue.then(result => result !== false);
  Object.assign(savedSettings, structuredClone(patch));
  for (const key of Object.keys(patch)) pendingStorageKeys.set(key, (pendingStorageKeys.get(key) || 0) + 1);
  const write = async () => {
    try {
      if (globalThis.chrome?.storage?.local) await chrome.storage.local.set(patch);
      else localStorage.setItem("yunagi-settings", JSON.stringify(settings));
      return true;
    } catch (error) {
      for (const key of Object.keys(patch)) delete savedSettings[key];
      console.error("Could not save yunagi settings", error);
      showToast("Не удалось сохранить настройку");
      return false;
    } finally {
      for (const key of Object.keys(patch)) {
        const count = pendingStorageKeys.get(key) - 1;
        if (count) pendingStorageKeys.set(key, count);
        else pendingStorageKeys.delete(key);
      }
    }
  };
  saveQueue = saveQueue.then(write, write);
  return saveQueue;
}

function refreshSettingsView() {
  renderAppearance();
  renderBookmarks();
  updateEngineButton();
  updateClock();
  $("#focusNote").value = settings.focusNote || "";
  renderFocusTasks();
  setSnowEffect(isSnowEffectActive());
  resetIdleTimer(true);
}

function setupSettingsSync() {
  globalThis.chrome?.storage?.onChanged?.addListener(async (changes, area) => {
    if (area !== "local") return;
    let changed = false;
    let weatherChanged = false;
    for (const [key, change] of Object.entries(changes)) {
      if (!Object.hasOwn(DEFAULTS, key) || pendingStorageKeys.has(key)) continue;
      // Keep edits that this tab has not saved yet.
      if (JSON.stringify(settings[key]) !== JSON.stringify(savedSettings[key])) continue;
      const value = change.newValue ?? structuredClone(DEFAULTS[key]);
      if (JSON.stringify(settings[key]) === JSON.stringify(value)) continue;
      settings[key] = structuredClone(value);
      savedSettings[key] = structuredClone(value);
      changed = true;
      if (["city", "cityLocation", "units"].includes(key)) weatherChanged = true;
    }
    if (!changed) return;
    if (settings.videoEnabled && settings.hasCustomVideo && !settings.customVideo) {
      const media = await chrome.storage.local.get("customVideo");
      settings.customVideo = media.customVideo || "";
      savedSettings.customVideo = settings.customVideo;
    }
    refreshSettingsView();
    if (weatherChanged) updateWeather();
    if (document.body.classList.contains("drawer-open")) {
      const focused = document.activeElement;
      const controls = [...$("#settingsDrawer").querySelectorAll("input, select, button, textarea")];
      const index = controls.indexOf(focused);
      renderDrawer();
      $("#settingsDrawer").querySelectorAll("input, select, button, textarea")[index]?.focus();
    }
  });
}

let widgetLayoutFrame = 0;
let pendingSaveTimer = 0;

function scheduleWidgetLayout() {
  if (widgetLayoutFrame) return;
  widgetLayoutFrame = requestAnimationFrame(() => { widgetLayoutFrame = 0; renderWidgetLayout(); });
}

function scheduleSaveSettings() {
  clearTimeout(pendingSaveTimer);
  pendingSaveTimer = setTimeout(() => { pendingSaveTimer = 0; saveSettings(); }, 350);
}

function flushPendingSave() {
  if (!pendingSaveTimer && !focusNoteSaveTimer) return;
  clearTimeout(pendingSaveTimer);
  clearTimeout(focusNoteSaveTimer);
  pendingSaveTimer = 0;
  focusNoteSaveTimer = 0;
  saveSettings();
}

// Дешёвая часть внешнего вида — только CSS-переменные и класс параллакса.
// Вызывается на каждый тик слайдера (input): перетаскивание яркости не должно
// дергать обои, видео и тему — для этого есть полная renderAppearance().
function applyAppearanceVars() {
  document.documentElement.dataset.surface = ["metal", "frosted", "clear"].includes(settings.surfaceStyle) ? settings.surfaceStyle : "metal";
  const brightness = Number(settings.brightness) || DEFAULTS.brightness;
  const shade = Number(settings.shade) || 0;
  const scale = Number(settings.scale) || 100;
  const parallaxActive = Boolean(settings.parallaxEnabled) && !reducedMotion.matches;
  document.documentElement.style.setProperty("--wallpaper-brightness", String(brightness / 100));
  document.documentElement.style.setProperty("--wallpaper-shade", String(shade / 100));
  document.documentElement.style.setProperty("--wallpaper-scale", String((scale / 100) * (parallaxActive ? 1.025 : 1)));
  document.body.classList.toggle("parallax-enabled", parallaxActive);
  if (!parallaxActive) {
    document.documentElement.style.setProperty("--parallax-x", "0px");
    document.documentElement.style.setProperty("--parallax-y", "0px");
  }
  applyIconStyle();
}

function renderAppearance() {
  applyAppearanceVars();
  updateTheme();
  scheduleWidgetLayout();
  for (const widget of ["weather", "bookmarks", "date", "clock"]) {
    const size = Number(settings.widgetSizes?.[widget]) || 100;
    document.documentElement.style.setProperty(`--widget-${widget}-scale`, String(size / 100));
  }
  updateWallpaperImage();
  scheduleWallpaperVideo();
  applyCaptionVisibility();
}

// Стиль значков закладок: color — обычные цветные, mono — обесцвеченные,
// Режимы рисуются CSS по классам на body, разметка значков не меняется.
function applyIconStyle() {
  const mode = settings.iconStyle === "mono" ? settings.iconStyle : "color";
  document.body.classList.toggle("icons-mono", mode === "mono");
}

// Появление страницы ждёт готовности фона. Пока класс assets-ready не стоит,
// CSS держит все анимации появления на паузе в нулевой точке (см. styles.css):
// вкладка остаётся тёмной, а потом фон и интерфейс проступают вместе —
// картинка не догружается уже поверх «появившейся» страницы и не выскакивает
// куском. Страховочный таймер в начале файла гарантирует, что волна стартует
// даже если эта функция почему-то не выполнится.
function revealWhenWallpaperReady() {
  if (document.body.classList.contains("assets-ready")) return;
  if (reducedMotion.matches) { document.body.classList.add("assets-ready"); return; }
  let waiting = 0;
  const ready = () => {
    waiting = Math.max(0, waiting - 1);
    if (!waiting) document.body.classList.add("assets-ready");
  };
  const track = (promise) => { waiting += 1; promise.then(ready, ready); };

  const wallpaper = $(".wallpaper");
  const background = wallpaper ? getComputedStyle(wallpaper).backgroundImage : "";
  const match = background.match(/url\((['"]?)(.*?)\1\)/);
  if (match && match[2]) {
    const image = new Image();
    track(new Promise((resolve) => { image.addEventListener("load", resolve); image.addEventListener("error", resolve); image.src = match[2]; }));
    if (image.complete) ready();
  }
  // Свои обои подставляются отдельным blob-объектом — дожидаемся и их.
  if (settings.customWallpaper && wallpaperLoadingPromise) track(wallpaperLoadingPromise);
  if (!waiting) document.body.classList.add("assets-ready");
}

const WIDGET_LAYOUT_DEFAULTS = {
  weather: { x: 1, y: 1, w: 2, h: 0 },
  bookmarks: { x: 1, y: 3, w: 1, h: 0 },
  date: { x: 23, y: 1, w: 2, h: 0 },
  clock: { x: 23, y: 3, w: 2, h: 0 },
  search: { x: 8, y: 10, w: 10, h: 0 }
};

// Размеры закладок — должны совпадать с CSS (.bookmarks-card, .bookmark-grid):
// колонка не уже 48px, отступ 15+15 и бордюр 1+1, колоночный gap 8px.
// Три колонки дают ровно 192px — как у погоды, даты и часов.
const BOOKMARK_COL = 48;
const BOOKMARK_GAP = 8;
const BOOKMARK_PAD = 32;
// Небольшой допуск, чтобы карточка могла чуть вылезти за ячейку сетки,
// вместо того чтобы сжиматься из-за пары пикселей.
const BOOKMARK_COL_TOLERANCE = 8;

function renderWidgetLayout() {
  const mode = ["free", "stack", "custom"].includes(settings.layoutMode) ? settings.layoutMode : "free";
  document.body.dataset.layoutMode = mode;
  const clock = $("#clockCard");
  if (clock) clock.dataset.display = ["analog", "digital", "both"].includes(settings.clockDisplay) ? settings.clockDisplay : "both";
  const bookmarkWidth = Number(settings.widgetLayout?.bookmarks?.w) || 3;
  const widgetScale = (key) => Math.max(0.75, Math.min(1.4, (Number(settings.widgetSizes?.[key]) || 100) / 100));
  const canvas = $(".canvas");
  const padding = getComputedStyle(canvas);
  const padLeft = parseFloat(padding.paddingLeft) || 0;
  const padRight = parseFloat(padding.paddingRight) || 0;
  const padTop = parseFloat(padding.paddingTop) || 0;
  const padBottom = parseFloat(padding.paddingBottom) || 0;
  const canvasWidth = canvas.clientWidth - padLeft - padRight;
  const canvasHeight = canvas.clientHeight - padTop - padBottom;
  const bookmarkCount = Math.min(24, Array.isArray(settings.bookmarks) ? settings.bookmarks.length : 0);
  const bookmarkScale = widgetScale("bookmarks");
  const columnsFor = (px) => Math.max(1, Math.floor((px + BOOKMARK_COL_TOLERANCE - (BOOKMARK_PAD - BOOKMARK_GAP)) / (BOOKMARK_COL + BOOKMARK_GAP)));
  const widthFor = (cols) => cols * BOOKMARK_COL + (cols - 1) * BOOKMARK_GAP + BOOKMARK_PAD;
  // Справа всегда стоит столбец с календарём и часами — широкой карточке
  // оставляем под него место, иначе на узких окнах виджеты налезут друг на друга.
  const bookmarkWidthLimit = Math.max(widthFor(1), canvasWidth - (Math.max(...["date", "clock"].map((key) => settings.hiddenWidgets?.includes(key) ? 0 : 192 * widgetScale(key)))) - 16);
  const bookmarkMaxCols = Math.max(1, Math.min(6, columnsFor(bookmarkWidthLimit / bookmarkScale)));
  // Форму блока задаёт пользователь в редакторе раскладки: ширина ячейки (w) — это
  // и есть ширина карточки, а колонки просто влезают в неё. Хочешь список на 6 в
  // высоту — тяни w до одной ячейки; хочешь широкий блок — тяни вправо. Высота
  // всегда по содержимому: добавил сайт — карточка подросла, удалил — сократилась.
  const bookmarkCellWidth = bookmarkWidth === 1
    ? widthFor(1)
    : Math.min(bookmarkWidthLimit, Math.max(widthFor(1), (bookmarkWidth / 24) * canvasWidth));
  const bookmarkColumns = mode === "stack"
    ? 3
    : Math.max(1, Math.min(bookmarkMaxCols, columnsFor(bookmarkCellWidth / bookmarkScale), Math.max(1, bookmarkCount)));
  document.documentElement.style.setProperty("--bookmark-columns", String(bookmarkColumns));
  const bookmarkNaturalWidth = Math.max(widthFor(bookmarkColumns), bookmarkCellWidth);
  const positionedItems = [];
  $$('[data-layout-item]').forEach((item) => {
    const key = item.dataset.layoutItem;
    item.hidden = Array.isArray(settings.hiddenWidgets) && settings.hiddenWidgets.includes(key);
    if (item.hidden) return;
    const layout = settings.widgetLayout?.[key] || WIDGET_LAYOUT_DEFAULTS[key];
    if (!layout) return;
    item.classList.toggle("is-single-column", key === "bookmarks" && bookmarkColumns === 1);
    const scale = key === "search" ? 1 : widgetScale(key);
    // Погода, дата и часы живут в одной сеточной ячейке — одинаковая ширина
    // (192px совпадает с карточкой закладок из трёх колонок) даёт ровные колонки
    // вместо лесенки по краям.
    const naturalWidth = key === "weather" || key === "date" || key === "clock" ? 192 : 84;
    const minimumWidth = key === "search" ? Math.min(260, canvasWidth) : key === "bookmarks" ? bookmarkNaturalWidth * scale : naturalWidth * scale;
    const width = key === "search" && mode === "free"
      ? Math.min(540, canvasWidth)
      : key === "bookmarks" && mode !== "stack"
        // Ширина закладок — ровно та, что задана ячейкой (w): меньше закладок —
        // колонки становятся уже, но ширину пользователь контролирует сам.
        ? Math.min(canvasWidth, bookmarkWidthLimit, bookmarkNaturalWidth * scale)
        : Math.min(canvasWidth, Math.max((layout.w / 24) * canvasWidth, minimumWidth));
    const height = layout.h ? (layout.h / 12) * canvasHeight : 0;
    item.style.setProperty("--layout-scale", String(scale));
    item.style.width = `${width / scale}px`;
    // Высота закладок всегда по содержимому: и переполнение при добавлении,
    // и пустота при малом числе исчезают — ручками дотягивать не нужно.
    const fixedHeight = key === "bookmarks" ? "" : height ? `${height / scale}px` : "";
    item.style.height = fixedHeight;
    item.style.minHeight = "";
    if (key === "bookmarks") item.style.maxHeight = "";
    const desiredTop = padTop + ((layout.y - 1) / 12) * canvasHeight;
    const cellLeft = padLeft + ((layout.x - 1) / 24) * canvasWidth;
    const cellRight = padLeft + ((layout.x - 1 + layout.w) / 24) * canvasWidth;
    // Если карточка шире своей ячейки, прижимаем её к тому краю сетки, рядом с которым она стоит:
    // правый столбец тогда выравнивается по правому краю, а не уходит лесенкой.
    const anchorRight = width > cellRight - cellLeft && (cellLeft + cellRight) / 2 >= padLeft + canvasWidth / 2;
    const rawLeft = key === "search" && mode === "free"
      ? padLeft + (canvasWidth - width) / 2
      : anchorRight ? cellRight - width : cellLeft;
    const left = Math.min(Math.max(rawLeft, padLeft), padLeft + canvasWidth - width);
    item.style.left = `${left}px`;
    positionedItems.push({ item, desiredTop, padTop, canvasHeight });
  });
  // Apply all size writes before reading dimensions, so layout is calculated only once.
  // Берём фактическую высоту из layout: у закладок она может быть больше заданной
  // (высота задана как минимум, сверху — ограничение по низу холста).
  const finalPositions = positionedItems.map(({ item, desiredTop, padTop: top, canvasHeight: availableHeight }) => {
    const visibleHeight = item.getBoundingClientRect().height;
    const maxTop = Math.max(top, top + availableHeight - visibleHeight);
    return { item, top: Math.max(top, Math.min(desiredTop, maxTop)) };
  });
  for (const { item, top } of finalPositions) item.style.top = `${top}px`;
  updateLayoutGuides();
  $("#leftStack").dataset.layoutMode = mode;
  $("#layoutEditBar")?.setAttribute("aria-hidden", String(!document.body.classList.contains("layout-editing")));
  $("#toggleLayoutEdit")?.classList.toggle("is-active", document.body.classList.contains("layout-editing"));
}

// Free mode uses a fixed search width; transfer its actual geometry to the grid.
function preserveSearchGeometry() {
  if (settings.layoutMode !== "free") return;
  const search = $('[data-layout-item="search"]');
  const canvas = $(".canvas");
  if (!search || search.hidden || !canvas) return;
  // Layout dimensions exclude the temporary scale/translate of the entrance animation.
  const rect = { left: search.offsetLeft, top: search.offsetTop, width: search.offsetWidth };
  const style = getComputedStyle(canvas);
  const left = parseFloat(style.paddingLeft) || 0;
  const right = parseFloat(style.paddingRight) || 0;
  const top = parseFloat(style.paddingTop) || 0;
  const bottom = parseFloat(style.paddingBottom) || 0;
  const width = canvas.clientWidth - left - right;
  const height = canvas.clientHeight - top - bottom;
  if (width <= 0 || height <= 0 || rect.width <= 0) return;
  settings.widgetLayout.search = {
    ...settings.widgetLayout.search,
    x: 1 + (rect.left - left) / width * 24,
    y: 1 + (rect.top - top) / height * 12,
    w: rect.width / width * 24
  };
}

function setLayoutMode(mode) {
  if (mode === "custom") preserveSearchGeometry();
  settings.layoutMode = mode;
  if (mode === "stack") {
    settings.widgetLayout.weather = { ...settings.widgetLayout.weather, x: 2, y: 3, h: 0 };
    settings.widgetLayout.bookmarks = { ...settings.widgetLayout.bookmarks, x: 2, y: 5, h: 0 };
  }
  document.body.classList.remove("layout-editing");
  renderWidgetLayout();
  saveSettings();
}

let layoutEditorSnapshot = null;
let layoutHistory = [];
function rememberLayout() {
  layoutHistory.push(structuredClone(settings.widgetLayout));
  if (layoutHistory.length > 40) layoutHistory.shift();
  const undo = $("#undoLayoutEdit"); if (undo) undo.disabled = false;
}
function undoLayout() {
  const previous = layoutHistory.pop();
  if (!previous) return;
  settings.widgetLayout = previous;
  $("#undoLayoutEdit").disabled = !layoutHistory.length;
  renderWidgetLayout(); saveSettings();
}
function updateLayoutGuides() {
  const active = $(".is-layout-selected");
  const vertical = $("#layoutGuideX"), horizontal = $("#layoutGuideY");
  if (!vertical || !horizontal) return;
  vertical.hidden = horizontal.hidden = true;
  if (!active || !document.body.classList.contains("layout-editing")) return;
  const cell = settings.widgetLayout[active.dataset.layoutItem];
  if (cell) $("#editorSelection").textContent = LAYOUT_LABELS[active.dataset.layoutItem] + " · " + cell.w + " × " + (cell.h || "авто") + " · колонка " + cell.x + ", ряд " + cell.y;
  const rect = active.getBoundingClientRect();
  for (const other of document.querySelectorAll('[data-layout-item]:not([hidden])')) {
    if (other === active) continue;
    const r = other.getBoundingClientRect();
    for (const x of [rect.left, rect.left + rect.width / 2, rect.right]) {
      if ([r.left, r.left + r.width / 2, r.right].some(v => Math.abs(x-v) < 3)) { vertical.hidden = false; vertical.style.left = x + "px"; }
    }
    for (const y of [rect.top, rect.top + rect.height / 2, rect.bottom]) {
      if ([r.top, r.top + r.height / 2, r.bottom].some(v => Math.abs(y-v) < 3)) { horizontal.hidden = false; horizontal.style.top = y + "px"; }
    }
  }
}
const LAYOUT_LABELS = { weather: "Погода", bookmarks: "Избранное", date: "Дата", clock: "Часы", search: "Поиск" };

function toggleLayoutEditor(enabled = !document.body.classList.contains("layout-editing")) {
  if (enabled && !document.body.classList.contains("layout-editing")) {
    layoutHistory = [];
    $("#undoLayoutEdit").disabled = true;
    layoutEditorSnapshot = { layoutMode: settings.layoutMode, widgetLayout: structuredClone(settings.widgetLayout) };
    preserveSearchGeometry();
    toggleWeatherPanel(false);
    hideIdleClock();
    clearTimeout(idleTimer);
  }
  document.body.classList.toggle("layout-editing", enabled);
  $("#layoutEditBar").inert = !enabled;
  if (enabled) settings.layoutMode = "custom";
  else {
    $$(".is-layout-selected").forEach((item) => item.classList.remove("is-layout-selected"));
    $("#editorSelection").textContent = "Выбери блок и перетащи на новое место";
    resetIdleTimer(true);
  }
  for (const handle of document.querySelectorAll(".layout-drag-handle")) handle.tabIndex = enabled ? 0 : -1;
  renderWidgetLayout();
  saveSettings();
}

function setupWidgetEditor() {
  $$('[data-layout-item]').forEach((item) => {
    const label = LAYOUT_LABELS[item.dataset.layoutItem];
    const drag = el("span", "layout-drag-handle");
    drag.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01"/></svg>';
    drag.append(el("span", "", label));
    const resize = el("span", "layout-resize-handle");
    resize.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 17 10-10M7 11v6h6M11 7h6v6"/></svg>';
    drag.title = "Переместить: " + label;
    resize.title = "Изменить размер: " + label;
    drag.setAttribute("aria-label", "Переместить " + label + ". Стрелки — движение по сетке");
    drag.setAttribute("role", "button");
    drag.tabIndex = -1;
    resize.setAttribute("aria-label", "Изменить размер блока");
    item.append(drag, resize);
    const start = (event, resizeMode) => {
      if (!document.body.classList.contains("layout-editing") || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const key = item.dataset.layoutItem;
      const rect = item.getBoundingClientRect();
      const initial = { ...settings.widgetLayout[key] };
      rememberLayout();
      const pointerX = event.clientX;
      const pointerY = event.clientY;
      const canvas = $(".canvas");
      const canvasStyle = getComputedStyle(canvas);
      const contentWidth = canvas.clientWidth - parseFloat(canvasStyle.paddingLeft) - parseFloat(canvasStyle.paddingRight);
      const contentHeight = canvas.clientHeight - parseFloat(canvasStyle.paddingTop) - parseFloat(canvasStyle.paddingBottom);
      const col = contentWidth / 24;
      const row = contentHeight / 12;
      $$(".is-layout-selected").forEach((other) => other.classList.remove("is-layout-selected"));
      item.classList.add("is-layout-active", "is-layout-selected");
      document.body.classList.add("layout-dragging");
      const describe = () => { const cell = settings.widgetLayout[key]; $("#editorSelection").textContent = LAYOUT_LABELS[key] + " · " + cell.w + " × " + (cell.h || "авто") + " · колонка " + cell.x + ", ряд " + cell.y; };
      describe();
      const move = (pointer) => {
        const dx = Math.round((pointer.clientX - pointerX) / col);
        const dy = Math.round((pointer.clientY - pointerY) / row);
        const layout = settings.widgetLayout[key];
        const before = `${layout.x}:${layout.y}:${layout.w}:${layout.h}`;
        if (resizeMode) {
          layout.w = Math.max(1, Math.min(25 - initial.x, initial.w + dx));
          layout.h = Math.max(1, Math.min(13 - initial.y, (initial.h || Math.max(1, Math.round(rect.height / row))) + dy));
        } else {
          layout.x = Math.max(1, Math.min(25 - initial.w, initial.x + dx));
          layout.y = Math.max(1, Math.min(13 - (initial.h || 1), initial.y + dy));
        }
        if (`${layout.x}:${layout.y}:${layout.w}:${layout.h}` !== before) { scheduleWidgetLayout(); describe(); }
      };
      const finish = () => {
        item.classList.remove("is-layout-active");
        document.body.classList.remove("layout-dragging");
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
        saveSettings();
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", finish, { once: true });
      document.addEventListener("pointercancel", finish, { once: true });
    };
    drag.addEventListener("focus", () => {
      for (const other of document.querySelectorAll(".is-layout-selected")) other.classList.remove("is-layout-selected");
      item.classList.add("is-layout-selected"); updateLayoutGuides();
    });
    item.addEventListener("click", (event) => {
      if (!document.body.classList.contains("layout-editing")) return;
      event.preventDefault(); drag.focus();
    });
    drag.addEventListener("pointerdown", (event) => start(event, false));
    resize.addEventListener("pointerdown", (event) => start(event, true));
  });
}

// Что последний раз реально записано в стиль обоев — чтобы renderAppearance
// на каждый тик слайдера не перезаписывала backgroundImage всего экрана.
let appliedWallpaperImage = "";
let appliedWallpaperPosition = "";

async function optimizeWallpaper(source) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const ratio = Math.min(1, 2560 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  const optimized = canvas.toDataURL("image/webp", .88);
  return optimized.length < source.length || ratio < 1 ? optimized : source;
}

function applyWallpaperImage(wallpaper, value) {
  if (appliedWallpaperImage === value) return;
  appliedWallpaperImage = value;
  wallpaper.style.backgroundImage = value;
}

function updateWallpaperImage() {
  const wallpaper = $(".wallpaper");
  const position = settings.position || "center";
  if (appliedWallpaperPosition !== position) {
    appliedWallpaperPosition = position;
    wallpaper.style.backgroundPosition = position;
  }
  const source = settings.customWallpaper;
  if (!source) {
    wallpaperLoadGeneration++;
    wallpaperLoadingSource = "";
    wallpaperLoadingPromise = null;
    if (wallpaperObjectUrl) URL.revokeObjectURL(wallpaperObjectUrl);
    wallpaperObjectUrl = "";
    wallpaperObjectSource = "";
  applyWallpaperImage(wallpaper, "url(\"Image.webp\")");
    return;
  }
  if (wallpaperObjectSource === source) {
    applyWallpaperImage(wallpaper, `url("${wallpaperObjectUrl}")`);
    return;
  }
  if (wallpaperLoadingSource === source && wallpaperLoadingPromise) return;
  const generation = ++wallpaperLoadGeneration;
  wallpaperLoadingSource = source;
  const loadPromise = (async () => {
    const response = await fetch(source);
    if (!response.ok) throw new Error("Не удалось открыть обои");
    const objectUrl = URL.createObjectURL(await response.blob());
    if (generation !== wallpaperLoadGeneration || settings.customWallpaper !== source) {
      URL.revokeObjectURL(objectUrl);
      return;
    }
    if (wallpaperObjectUrl) URL.revokeObjectURL(wallpaperObjectUrl);
    wallpaperObjectUrl = objectUrl;
    wallpaperObjectSource = source;
    applyWallpaperImage(wallpaper, `url("${objectUrl}")`);
  })();
  wallpaperLoadingPromise = loadPromise.catch((error) => showToast(error.message || "Не удалось открыть обои")).finally(() => {
    if (generation === wallpaperLoadGeneration) { wallpaperLoadingSource = ""; wallpaperLoadingPromise = null; }
  });
}

function updateTheme() {
  const now = new Date();
  let theme = Object.hasOwn(ACCENT_PALETTES, settings.accent) ? settings.accent : "snow";
  if (settings.themeMode === "time") {
    const hour = now.getHours();
    theme = hour < 6 || hour >= 21 ? "lavender" : hour < 10 ? "rose" : hour < 17 ? "ice" : "moss";
  } else if (settings.themeMode === "season") {
    const month = now.getMonth();
    theme = month === 11 || month <= 1 ? "ice" : month <= 4 ? "moss" : month <= 7 ? "snow" : "rose";
  }
  const palette = ACCENT_PALETTES[theme];
  document.documentElement.dataset.theme = settings.themeMode === "manual" ? theme : settings.themeMode;
  document.documentElement.style.setProperty("--accent", palette.color);
  document.documentElement.style.setProperty("--glass-edge", palette.edge);
}

let wallpaperVideoScheduled = false;
let firstPaintDone = false;

// Тяжёлое видеофои не грузим в первый кадр — иначе вкладка подлагивает при открытии.
function scheduleWallpaperVideo() {
  if (firstPaintDone) { updateWallpaperVideo(); return; }
  if (wallpaperVideoScheduled) return;
  wallpaperVideoScheduled = true;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    wallpaperVideoScheduled = false;
    firstPaintDone = true;
    updateWallpaperVideo();
  }));
}

async function updateWallpaperVideo() {
  const video = $("#wallpaperVideo");
  if (!video) return;
  const shouldPlay = Boolean(settings.videoEnabled && settings.customVideo);
  if (!shouldPlay) {
    videoLoadGeneration++;
    videoLoadingSource = "";
    videoLoadingPromise = null;
    video.pause();
    if (video.getAttribute("src")) { video.removeAttribute("src"); video.load(); }
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    videoObjectUrl = "";
    videoObjectSource = "";
    video.classList.remove("is-active");
    return;
  }
  const source = settings.customVideo;
  if (videoObjectSource === source) {
    video.classList.add("is-active");
    if (video.paused) {
      const playRequest = video.play();
      if (playRequest?.catch) playRequest.catch(() => { video.classList.remove("is-active"); showToast("Не удалось запустить видеообои"); });
    }
    return;
  }
  if (videoLoadingSource === source && videoLoadingPromise) {
    try { await videoLoadingPromise; } catch { /* the first loader reports the error */ }
    return;
  }
  const generation = ++videoLoadGeneration;
  videoLoadingSource = source;
  if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
  videoObjectUrl = "";
  videoObjectSource = "";
  video.pause();
  video.removeAttribute("src");
  video.load();
  video.classList.remove("is-active");
  videoLoadingPromise = (async () => {
    const response = await fetch(source);
    if (!response.ok) throw new Error("Не удалось прочитать видеообои");
    const objectUrl = URL.createObjectURL(await response.blob());
    if (generation !== videoLoadGeneration || !settings.videoEnabled || settings.customVideo !== source) {
      URL.revokeObjectURL(objectUrl);
      return;
    }
    videoObjectUrl = objectUrl;
    videoObjectSource = source;
    video.src = objectUrl;
    video.load();
    video.classList.add("is-active");
    try { await video.play(); }
    catch { video.classList.remove("is-active"); showToast("Не удалось запустить видеообои"); }
  })();
  try { await videoLoadingPromise; }
  catch (error) { video.classList.remove("is-active"); showToast(error.message || "Не удалось загрузить видеообои"); }
  finally {
    if (generation === videoLoadGeneration) { videoLoadingSource = ""; videoLoadingPromise = null; }
  }
}

function isWinterSeason() {
  const month = new Date().getMonth();
  return month === 11 || month <= 1;
}

function isSnowEffectActive() {
  return Boolean(settings.snowEnabled || (settings.snowSchedule && isWinterSeason()));
}

// Фавикон сайта по домену. Адреса бывают без протокола и с путём — вытаскиваем
// только хост, остальное сервису не нужно.
function bookmarkFavicon(url) {
  try {
    const host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
    return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : "";
  } catch {
    return "";
  }
}

function editBookmark(index) {
  openDrawer("bookmarks");
  const items = $("#drawerContent").querySelectorAll(".bookmark-edit-item");
  const field = items[index]?.querySelector("input");
  field?.focus(); field?.select();
}
function addBookmark() {
  if (settings.bookmarks.length >= 24) { showToast("Можно добавить до 24 сайтов"); return; }
  settings.bookmarks.push({ name: "Новый сайт", url: "", color: "#667a82" });
  saveSettings(); renderBookmarks(); editBookmark(settings.bookmarks.length - 1);
}
function removeBookmark(index) {
  const removed = settings.bookmarks.splice(index, 1)[0];
  if (!removed) return;
  renderBookmarks(); saveSettings();
  if (document.body.classList.contains("drawer-open")) renderDrawer();
  const toast = $("#toast");
  clearTimeout(toastTimer); toast.replaceChildren(el("span", "", "Сайт удалён"));
  const undo = el("button", "toast-undo", "Вернуть"); undo.type = "button";
  undo.addEventListener("click", () => {
    if (settings.bookmarks.length >= 24) { showToast("Нет места: уже 24 сайта"); return; }
    settings.bookmarks.splice(Math.min(index, settings.bookmarks.length), 0, removed);
    renderBookmarks(); saveSettings();
    if (document.body.classList.contains("drawer-open")) renderDrawer();
    showToast("Сайт восстановлен");
  }, { once: true });
  toast.append(undo); toast.classList.add("visible");
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 8000);
}
function closeBookmarkMenu() { $("#bookmarkMenu")?.remove(); }
function openBookmarkMenu(event, index) {
  event.preventDefault(); closeBookmarkMenu();
  const menu = el("div", "bookmark-context-menu"); menu.id = "bookmarkMenu";
  menu.setAttribute("role", "menu");
  for (const [label, action] of [["Редактировать", () => editBookmark(index)], ["Добавить сайт", addBookmark], ["Удалить", () => removeBookmark(index)]]) {
    const button = el("button", "", label); button.type = "button"; button.setAttribute("role", "menuitem");
    button.addEventListener("click", () => { closeBookmarkMenu(); action(); }); menu.append(button);
  }
  document.body.append(menu);
  const target = event.target.getBoundingClientRect();
  const x = event.clientX || target.left, y = event.clientY || target.bottom;
  menu.style.left = Math.max(8, Math.min(x, window.innerWidth - menu.offsetWidth - 8)) + "px";
  menu.style.top = Math.max(8, Math.min(y, window.innerHeight - menu.offsetHeight - 8)) + "px";
  menu.querySelector("button").focus();
  menu.addEventListener("keydown", e => {
    const buttons = Array.from(menu.querySelectorAll("button"));
    const index = buttons.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); buttons[(index + (e.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length].focus(); }
    if (e.key === "Escape") { e.stopPropagation(); closeBookmarkMenu(); event.target.focus(); }
  });
}

function renderBookmarks() {
  const grid = $("#bookmarkGrid");
  const heading = $(".bookmarks-card .card-heading");
  if (heading && !heading.querySelector("button")) {
    const add = el("button", "bookmark-add-shortcut", "+"); add.type = "button"; add.title = "Добавить сайт"; add.setAttribute("aria-label", "Добавить сайт");
    add.addEventListener("click", event => { event.stopPropagation(); if (!document.body.classList.contains("layout-editing")) addBookmark(); }); heading.append(add);
  }
  grid.replaceChildren();
  const bookmarks = Array.isArray(settings.bookmarks) ? settings.bookmarks : [];
  if (!bookmarks.length) {
    const empty = document.createElement("p");
    empty.className = "empty-bookmarks";
    empty.textContent = "Здесь будут твои сайты";
    const add = el("button", "drawer-button bookmark-empty-add", "Добавить сайт"); add.type = "button"; add.addEventListener("click", addBookmark); grid.append(add);
    grid.append(empty);
    scheduleWidgetLayout();
    return;
  }
  bookmarks.slice(0, 24).forEach((bookmark, index) => {
    const button = document.createElement(bookmark.url ? "a" : "button");
    if (bookmark.url) {
      try {
        const url = new URL(/^https?:\/\//i.test(bookmark.url) ? bookmark.url : "https://" + bookmark.url);
        if (["https:", "http:"].includes(url.protocol)) button.href = url.href;
      } catch { /* An invalid bookmark opens its settings. */ }
    } else button.type = "button";
    button.className = "bookmark-item";
    button.draggable = true;
    button.dataset.bookmarkIndex = String(index);
    button.setAttribute("aria-label", `${bookmark.name}: ${bookmark.url}`);
    const icon = document.createElement("span");
    icon.className = "bookmark-icon";
    icon.style.setProperty("--bookmark-color", bookmark.color || "#667a82");
    if (typeof bookmark.icon === "string" && bookmark.icon.startsWith("data:image/")) {
      const image = document.createElement("img");
      image.src = bookmark.icon;
      image.alt = "";
      image.className = "bookmark-custom-image";
      icon.append(image);
    } else {
      const fallback = bookmark.icon || (bookmark.name || "?").trim().charAt(0).toUpperCase();
      // Свой символ или эмодзи пользователя всегда важнее фавикона.
      const faviconUrl = bookmark.icon ? "" : settings.faviconEnabled === false ? "" : bookmarkFavicon(bookmark.url);
      if (faviconUrl) {
        // Фавикон подтягиваем с сервиса Google по домену. Если картинка не
        // загрузилась (сайт без фавикона, нет сети) — возвращаем букву.
        const image = document.createElement("img");
        image.src = faviconUrl;
        image.alt = "";
        image.loading = "lazy";
        image.className = "bookmark-favicon";
        image.addEventListener("error", () => {
          icon.replaceChildren();
          icon.textContent = fallback;
        }, { once: true });
        icon.append(image);
      } else {
        icon.textContent = fallback;
      }
    }
    const name = document.createElement("span");
    name.className = "bookmark-name";
    name.textContent = bookmark.name || "Сайт";
    button.append(icon, name);
    button.addEventListener("contextmenu", event => { if (!document.body.classList.contains("layout-editing")) openBookmarkMenu(event, index); });
    grid.append(button);
  });
  // Блок подстраивается под количество закладок — пересчитываем размер после отрисовки.
  scheduleWidgetLayout();
}

// Drag-and-drop перестановки слушаются один раз на гриде: renderBookmarks()
// перестраивает карточки, и вешать 6 обработчиков на каждую из 24 — лишняя
// работа на каждую перерисовку.
function setupBookmarkDragAndDrop() {
  const grid = $("#bookmarkGrid");
  const itemFrom = (target) => target instanceof Element ? target.closest(".bookmark-item") : null;
  grid.addEventListener("dragstart", (event) => {
    const item = itemFrom(event.target);
    if (!item) return;
    draggedBookmarkIndex = Number(item.dataset.bookmarkIndex);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(draggedBookmarkIndex));
    item.classList.add("is-dragging");
  });
  grid.addEventListener("dragover", (event) => {
    const item = itemFrom(event.target);
    if (!item) return;
    event.preventDefault();
    if (draggedBookmarkIndex !== Number(item.dataset.bookmarkIndex)) item.classList.add("is-drop-target");
  });
  grid.addEventListener("dragleave", (event) => {
    const item = itemFrom(event.target);
    // relatedTarget пуст при уходе за окно — в этом случае тоже гасим подсветку.
    if (item && !item.contains(event.relatedTarget)) item.classList.remove("is-drop-target");
  });
  grid.addEventListener("drop", async (event) => {
    const item = itemFrom(event.target);
    if (!item) return;
    event.preventDefault();
    const from = Number(event.dataTransfer.getData("text/plain"));
    const to = Number(item.dataset.bookmarkIndex);
    if (Number.isInteger(from) && from !== to && settings.bookmarks[from]) {
      const [moved] = settings.bookmarks.splice(from, 1);
      settings.bookmarks.splice(to, 0, moved);
      await saveSettings();
      renderBookmarks();
    }
  });
  grid.addEventListener("dragend", () => {
    draggedBookmarkIndex = null;
    $$(".bookmark-item").forEach((item) => item.classList.remove("is-dragging", "is-drop-target"));
  });
}

let clockDateFormatter;
let clockTimeFormatter;
let clockTickTimer = 0;

// Часы показывают только часы и минуты, поэтому пересчитываем их ровно на границе минуты,
// а не каждую секунду.
function scheduleClockTick() {
  clearTimeout(clockTickTimer);
  const now = new Date();
  const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 25;
  clockTickTimer = setTimeout(() => { updateClock(); scheduleClockTick(); }, delay);
}

function setText(selector, value) {
  const node = $(selector);
  if (node && node.textContent !== value) node.textContent = value;
}
function updateClock() {
  const now = new Date();
  const is12 = settings.timeFormat !== "24";
  if (!clockDateFormatter) clockDateFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
  if (!clockTimeFormatter || clockTimeFormatter.__is12 !== is12) {
    clockTimeFormatter = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: is12 });
    clockTimeFormatter.__is12 = is12;
  }
  const dateParts = clockDateFormatter.formatToParts(now);
  const part = (type) => dateParts.find((item) => item.type === type)?.value || "";
  setText("#weekday", part("weekday").replace(/\.$/, "").toLocaleUpperCase("ru-RU"));
  setText("#day", part("day"));
  setText("#month", part("month").replace(/\.$/, "").toLocaleUpperCase("ru-RU"));
  setText("#year", part("year"));
  const time = clockTimeFormatter.format(now);
  setText("#digitalTime", time);
  setText("#idleTime", time);
  const hour = now.getHours() % 12;
  const minute = now.getMinutes();
  $("#hourHand").style.transform = `translateX(-50%) rotate(${hour * 30 + minute / 2}deg)`;
  $("#minuteHand").style.transform = `translateX(-50%) rotate(${minute * 6}deg)`;
}

const WEATHER_CACHE_KEY = "yunagi-weather-cache-v1";
const WEATHER_TTL = 10 * 60 * 1000;

function readWeatherCache() {
  try { return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || "null"); }
  catch { return null; }
}

function paintWeather(data, stale = false) {
  const current = data.timeseries[0]?.data;
  const temp = current?.instant?.details?.air_temperature;
  if (typeof temp !== "number") throw new Error("В ответе сервиса нет температуры");
  const symbol = current.next_1_hours?.summary?.symbol_code || current.next_6_hours?.summary?.symbol_code || current.next_12_hours?.summary?.symbol_code;
  const [icon, description] = weatherPresentation(symbol);
  $("#weatherIcon").innerHTML = weatherSvg(icon);
  $("#weatherTemp").textContent = displayTemperature(temp);
  $("#weatherCity").textContent = data.place.name;
  $("#weatherDescription").textContent = description;
  const age = new Date(data.at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const status = (stale ? "Последний прогноз: " : "Обновлено: ") + age;
  $(".weather-card").title = status;
  $(".weather-card").setAttribute("aria-label", description + ", " + displayTemperature(temp) + ", " + data.place.name + (stale ? ". " + status : ""));
  updateIdleWeather(icon, displayTemperature(temp) + " · " + data.place.name, status);
  storeWeatherDetails({ place: data.place.name, tempCelsius: temp, current, timeseries: data.timeseries });
  Object.assign(weatherDetails, { icon, description, status });
  if (weatherPanelOpen) renderWeatherPanel();
}

let weatherLoading = false;

async function updateWeather(force = false) {
  force = force === true;
  const request = ++weatherRequest;
  const city = (settings.city || "Tokyo").trim();
  const cache = readWeatherCache();
  const matching = cache?.city === city && Array.isArray(cache.timeseries) && cache.timeseries.length && cache.place && (!settings.cityLocation || (cache.place.latitude === settings.cityLocation.latitude && cache.place.longitude === settings.cityLocation.longitude));
  let cached = false;
  if (matching) {
    try { paintWeather(cache, Date.now() - cache.at >= WEATHER_TTL); cached = true; } catch { /* Refetch invalid cache. */ }
    if (cached && !force && Date.now() - cache.at < WEATHER_TTL) {
      weatherLoading = false; if (weatherPanelOpen) renderWeatherPanel(); return;
    }
  }
  weatherLoading = true;
  if (weatherPanelOpen) renderWeatherPanel();
  if (!cached) {
    weatherDetails = null;
    $("#weatherDescription").textContent = "Обновляем прогноз";
    $("#weatherCity").textContent = city;
    $("#weatherTemp").textContent = "—°";
    $("#weatherIcon").innerHTML = weatherSvg("☁");
    updateIdleWeather("☁", "Загружаем погоду…", city);
    if (weatherPanelOpen) renderWeatherPanel();
  }
  try {
    let place = settings.cityLocation || (matching ? cache.place : null);
    if (!place) {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.search = new URLSearchParams({ name: city, count: "1", language: "ru", format: "json" });
      place = (await fetchWeatherJson(url)).results?.[0];
      if (!place) throw new Error("Город не найден");
    }
    const url = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
    url.search = new URLSearchParams({ lat: place.latitude, lon: place.longitude });
    const forecast = await fetchWeatherJson(url);
    if (request !== weatherRequest || city !== settings.city.trim()) return;
    const data = { city, place, at: Date.now(), timeseries: (forecast.properties?.timeseries || []).slice(0, 8) };
    paintWeather(data);
    try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data)); } catch { /* Cache is optional. */ }
  } catch (error) {
    if (request !== weatherRequest) return;
    if (cached) paintWeather(cache, true);
    else {
      $("#weatherDescription").textContent = "Нет подключения";
      $(".weather-card").title = "Погода недоступна. Проверь город и подключение.";
      updateIdleWeather("☁", "Погода недоступна · " + city, "Погода недоступна");
    }
    console.info("yunagi weather:", error.message);
  } finally {
    if (request === weatherRequest) { weatherLoading = false; if (weatherPanelOpen) renderWeatherPanel(); }
  }
}

let weatherDetails = null;
let weatherPanelOpen = false;

// Ощущаемая температура (Steadman): учитывает ветер и влажность — то, что человек
// реально чувствует на улице, а не сухое число из сервиса.
function apparentTemperature(tempCelsius, humidity, windSpeed) {
  if (typeof tempCelsius !== "number") return null;
  const humidityPct = typeof humidity === "number" ? humidity : 60;
  const windMs = typeof windSpeed === "number" ? windSpeed : 0;
  const vapor = (humidityPct / 100) * 6.105 * Math.exp((17.27 * tempCelsius) / (237.7 + tempCelsius));
  return tempCelsius + 0.33 * vapor - 0.7 * windMs - 4;
}

function displayTemperature(celsius) {
  if (typeof celsius !== "number") return "—";
  const value = settings.units === "fahrenheit" ? celsius * 9 / 5 + 32 : celsius;
  return `${Math.round(value)}°`;
}

// met.no отдаёт почасовой ряд: берём ближайшие шесть часов, плюс ветер, влажность
// и ощущаемую температуру из текущего среза. Всё, что сервис реально позволяет.
function storeWeatherDetails({ place, tempCelsius, current, timeseries }) {
  const details = current?.instant?.details || {};
  const hours = timeseries.slice(1, 7).map((entry) => {
    const hourData = entry?.data || {};
    const hourDetails = hourData.instant?.details || {};
    const symbol = hourData.next_1_hours?.summary?.symbol_code || hourData.next_6_hours?.summary?.symbol_code;
    const [hourIcon, hourDescription] = weatherPresentation(symbol);
    const time = new Date(entry.time);
    return {
      label: `${String(time.getHours()).padStart(2, "0")}:00`,
      icon: hourIcon,
      description: hourDescription,
      temp: displayTemperature(hourDetails.air_temperature)
    };
  }).filter((hour) => hour.temp !== "—");
  weatherDetails = {
    place,
    temp: displayTemperature(tempCelsius),
    feelsLike: displayTemperature(apparentTemperature(tempCelsius, details.relative_humidity, details.wind_speed)),
    wind: typeof details.wind_speed === "number" ? `${Math.round(details.wind_speed * 3.6)} км/ч` : "—",
    humidity: typeof details.relative_humidity === "number" ? `${Math.round(details.relative_humidity)}%` : "—",
    hours
  };
}

function renderWeatherPanel() {
  const panel = $("#weatherPanel");
  const focusedId = panel.contains(document.activeElement) ? document.activeElement.id : "";
  panel.replaceChildren();
  const head = el("div", "weather-dialog-header");
  const title = el("h2", "weather-dialog-title", "Погода"); title.id = "weatherDialogTitle";
  const actions = el("div", "weather-dialog-actions");
  for (const [id, label, path, action] of [
    ["refreshWeather", "Обновить прогноз", '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>', () => updateWeather(true)],
    ["weatherSettings", "Настройки погоды", '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>', () => { toggleWeatherPanel(false); openDrawer("weather"); }],
    ["closeWeather", "Закрыть прогноз", '<path d="m6 6 12 12M18 6 6 18"/>', () => toggleWeatherPanel(false)]
  ]) {
    const button = el("button", "weather-dialog-button");
    button.id = id; button.type = "button";
    if (id === "refreshWeather") { button.disabled = weatherLoading; button.classList.toggle("is-refreshing", weatherLoading); } button.title = label; button.setAttribute("aria-label", label);
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
    button.addEventListener("click", action); actions.append(button);
  }
  head.append(title, actions); panel.append(head);
  if (!weatherDetails) panel.append(el("p", "weather-panel-empty", weatherLoading ? "Загружаем прогноз…" : "Прогноз пока недоступен. Попробуй обновить или проверь город в настройках."));
  else {
    const hero = el("div", "weather-dialog-hero");
    const copy = el("div", "weather-dialog-copy");
    copy.append(el("span", "weather-panel-place", weatherDetails.place), el("span", "weather-dialog-temp", weatherDetails.temp), el("span", "weather-dialog-description", weatherDetails.description || ""));
    const icon = el("span", "weather-dialog-icon"); icon.innerHTML = weatherSvg(weatherDetails.icon);
    hero.append(copy, icon); panel.append(hero);
    if (weatherDetails.hours.length) {
      panel.append(el("h3", "weather-section-title", "В ближайшие часы"));
      const hours = el("div", "weather-panel-hours");
      weatherDetails.hours.forEach((hour) => {
        const row = el("div", "weather-panel-hour");
        const icon = el("span", "weather-panel-hour-icon"); icon.innerHTML = weatherSvg(hour.icon);
        row.append(el("span", "weather-panel-hour-time", hour.label), icon, el("span", "weather-panel-hour-temp", hour.temp));
        row.title = hour.description; hours.append(row);
      });
      panel.append(hours);
    }
    const stats = el("div", "weather-panel-stats");
    for (const [label, value] of [["Ощущается", weatherDetails.feelsLike], ["Ветер", weatherDetails.wind], ["Влажность", weatherDetails.humidity]]) {
      const stat = el("div", "weather-panel-stat");
      stat.append(el("span", "weather-panel-stat-label", label), el("span", "weather-panel-stat-value", value)); stats.append(stat);
    }
    panel.append(stats, el("p", "weather-dialog-status", weatherLoading ? "Обновляем прогноз…" : weatherDetails.status || ""));
  }
  if (focusedId) panel.querySelector('#' + focusedId)?.focus();
}

// The native modal stays centered and manages keyboard focus and its backdrop.
function positionWeatherPanel() {}

function toggleWeatherPanel(force) {
  const panel = $("#weatherPanel");
  const next = typeof force === "boolean" ? force : !weatherPanelOpen;
  if (next === weatherPanelOpen) return;
  weatherPanelOpen = next;
  if (next) {
    hideIdleClock(); clearTimeout(idleTimer);
    renderWeatherPanel();
    panel.setAttribute("aria-hidden", "false");
    panel.showModal();
    panel.classList.add("is-open");
    $("#closeWeather").focus();
  } else {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    panel.close();
    resetIdleTimer(true);
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2300);
}

function updateIdleWeather(icon, text, description) {
  $("#idleWeatherIcon").innerHTML = weatherSvg(icon);
  $("#idleWeatherText").textContent = text;
  $("#idleWeather").title = description;
}

function hideIdleClock() {
  document.body.classList.remove("idle-mode");
  $("#idleOverlay").setAttribute("aria-hidden", "true");
}

function resetIdleTimer(force = false) {
  const now = Date.now();
  if (document.body.classList.contains("idle-mode")) { hideIdleClock(); force = true; }
  if (!force && now - lastIdleResetAt < 300) return;
  clearTimeout(idleTimer);
  idleTimer = 0;
  if (weatherPanelOpen || document.body.classList.contains("layout-editing") || !settings.idleClockDelay || document.hidden || document.body.classList.contains("focus-mode") || document.body.classList.contains("drawer-open")) return;
  lastIdleResetAt = now;
  idleTimer = setTimeout(() => {
    if (document.hidden || document.body.classList.contains("focus-mode") || document.body.classList.contains("drawer-open")) return;
    document.body.classList.add("idle-mode");
    $("#idleOverlay").setAttribute("aria-hidden", "false");
  }, Number(settings.idleClockDelay) * 1000);
}

let focusReturnElement = null;

function toggleFocusMode(force) {
  const enabled = force ?? !document.body.classList.contains("focus-mode");
  if (enabled) {
    focusReturnElement = document.activeElement;
    if (document.body.classList.contains("layout-editing")) toggleLayoutEditor(false);
    toggleWeatherPanel(false);
  }
  document.body.classList.toggle("focus-mode", enabled);
  for (const item of document.querySelectorAll("[data-layout-item], .brand-mark")) item.inert = enabled;
  if (enabled) $("#focusNote").focus({ preventScroll: true });
  else if (focusReturnElement?.isConnected) focusReturnElement.focus({ preventScroll: true });
  $("#focusPanel").setAttribute("aria-hidden", String(!enabled));
  $("#toggleFocusMode").setAttribute("aria-label", enabled ? "Выйти из режима фокуса" : "Включить режим фокуса");
  $("#toggleFocusMode").title = enabled ? "Выйти из фокуса · F" : "Режим фокуса · F";
  $("#toggleFocusMode").classList.toggle("is-active", enabled);
  resetIdleTimer(true);
}

function renderFocusTasks() {
  const list = $("#taskList");
  list.replaceChildren();
  const tasks = Array.isArray(settings.focusTasks) ? settings.focusTasks : [];
  tasks.forEach((task, index) => {
    const item = el("li", `focus-task${task.done ? " is-done" : ""}`);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.done);
    checkbox.setAttribute("aria-label", `Отметить задачу «${task.text}» выполненной`);
    checkbox.addEventListener("change", async () => {
      settings.focusTasks[index].done = checkbox.checked;
      renderFocusTasks();
      await saveSettings();
    });
    const text = el("span", "focus-task-text", task.text);
    const remove = el("button", "focus-task-remove", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Удалить задачу «${task.text}»`);
    remove.addEventListener("click", async () => {
      settings.focusTasks.splice(index, 1);
      renderFocusTasks();
      await saveSettings();
    });
    item.append(checkbox, text, remove);
    list.append(item);
  });
  const completed = tasks.filter((task) => task.done).length;
  $("#taskCount").textContent = tasks.length ? `${completed}/${tasks.length}` : "0";
}

function addFocusTask(event) {
  event.preventDefault();
  const input = $("#taskInput");
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  if (settings.focusTasks.length >= 12) { showToast("В фокусе удобно держать до 12 задач"); return; }
  settings.focusTasks.push({ text, done: false });
  input.value = "";
  renderFocusTasks();
  saveSettings();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function drawerHeading(title, description) {
  const heading = el("h1", "drawer-title", title);
  heading.id = "drawerTitle";
  const paragraph = el("p", "drawer-description", description);
  return [heading, paragraph];
}

function makeSection(label) {
  const section = el("section", "setting-section");
  section.append(el("h2", "section-label", label));
  return section;
}

function makeRow(label, help, control) {
  const row = el("div", "setting-row");
  const copy = el("span", "setting-label");
  copy.append(el("span", "", label));
  if (help) copy.append(el("span", "setting-help", help));
  if (["INPUT", "SELECT", "TEXTAREA"].includes(control.tagName) && !control.getAttribute("aria-label")) control.setAttribute("aria-label", label);
  const controlWrap = el("span", "setting-control");
  controlWrap.append(control);
  row.append(copy, controlWrap);
  return row;
}

function makeSelect(options, value) {
  const select = document.createElement("select");
  for (const [key, label] of options) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    select.append(option);
  }
  select.value = value;
  return select;
}

function makeToggle(checked, ariaLabel) {
  const label = document.createElement("label");
  label.className = "toggle-switch";
  label.setAttribute("aria-label", ariaLabel);
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.setAttribute("aria-label", ariaLabel);
  const track = el("span", "toggle-track");
  track.setAttribute("aria-hidden", "true");
  label.append(input, track);
  return { label, input };
}

let drawerReturnFocus = null;

function openDrawer(kind = "general") {
  if (!document.body.classList.contains("drawer-open")) drawerReturnFocus = document.activeElement;
  snowDrifts?.forgetPointer();
  $(".canvas").inert = true;
  $("#settingsDrawer").inert = false;
  clearTimeout(idleTimer);
  idleTimer = 0;
  hideIdleClock();
  drawerKind = kind;
  renderDrawer();
  document.body.classList.add("drawer-open");
  $("#settingsDrawer").setAttribute("aria-hidden", "false");
  setTimeout(() => { if (document.body.classList.contains("drawer-open")) $("#closeDrawer").focus(); }, 60);
}

function closeDrawer() {
  const wasOpen = document.body.classList.contains("drawer-open");
  $(".canvas").inert = false;
  $("#settingsDrawer").inert = true;
  if (wasOpen && drawerReturnFocus?.isConnected) drawerReturnFocus.focus();
  document.body.classList.remove("drawer-open");
  $("#settingsDrawer").setAttribute("aria-hidden", "true");
  resetIdleTimer(true);
}

// Разделы настроек: иконки — маленькие stroke-SVG, чтобы навигация смотрелась
// аккуратно в боковой панели. Порядок = порядок в панели.
const DRAWER_PAGES = [
  {
    kind: "general",
    label: "Общие",
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 3-.6 2.2-2 .9-2-.6-2 3.5 1.5 1.6v2.8L2.4 15l2 3.5 2-.6 2 .9L9 21h4l.6-2.2 2-.9 2 .6 2-3.5-1.5-1.6v-2.8L19.6 9l-2-3.5-2 .6-2-.9L13 3Z" transform="translate(1 0)"/><circle cx="12" cy="12" r="3.2"/></svg>'
  },
  { kind: "weather", label: "Погода", icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17.5h9.3a3.7 3.7 0 0 0 .6-7.35A5.4 5.4 0 0 0 6.3 11.6 3.4 3.4 0 0 0 7 17.5Z"></path></svg>' },
  { kind: "clock", label: "Часы и дата", icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"></circle><path d="M12 7.4V12l3.2 1.9"></path></svg>' },
  { kind: "bookmarks", label: "Избранное", icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4.6 2.2 4.7 5.1.65-3.75 3.55.95 5.05L12 16.1l-4.5 2.45.95-5.05L4.7 9.95l5.1-.65L12 4.6Z"></path></svg>' }
];

function renderDrawer() {
  const nav = $("#drawerNav");
  nav.replaceChildren();
  for (const page of DRAWER_PAGES) {
    const button = el("button", "drawer-nav-item");
    button.type = "button";
    const active = drawerKind === page.kind;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    const icon = el("span", "drawer-nav-icon");
    icon.innerHTML = page.icon;
    button.append(icon, el("span", "", page.label));
    button.addEventListener("click", () => {
      if (drawerKind === page.kind) return;
      drawerKind = page.kind;
      renderDrawer();
    });
    nav.append(button);
  }
  const content = $("#drawerContent");
  content.replaceChildren();
  content.scrollTop = 0;
  if (drawerKind === "weather") renderWeatherSettings(content);
  else if (drawerKind === "clock") renderClockSettings(content);
  else if (drawerKind === "bookmarks") renderBookmarkSettings(content);
  else renderGeneralSettings(content);
}

function renderGeneralSettings(content) {
  content.append(...drawerHeading("Твоё пространство", "Настрой новую вкладку так, чтобы она ощущалась именно твоей."));

  const presets = makeSection("БЫСТРАЯ НАСТРОЙКА");
  presets.append(el("p", "setting-help", "Пресет меняет видимость и оформление виджетов. Свои сайты и обои сохраняются."));
  const presetButtons = el("div", "button-row");
  const choices = [
    ["Минимализм", { hiddenWidgets: ["weather", "bookmarks", "date"], clockDisplay: "digital", showCaption: false, iconStyle: "mono" }],
    ["Рабочий стол", { hiddenWidgets: [], clockDisplay: "both", showCaption: true, iconStyle: "color" }],
    ["Только часы", { hiddenWidgets: ["weather", "bookmarks", "date", "search"], clockDisplay: "digital", showCaption: false, iconStyle: "mono" }]
  ];
  for (const [label, patch] of choices) {
    const button = el("button", "drawer-button", label);
    button.type = "button";
    button.addEventListener("click", () => {
      Object.assign(settings, structuredClone(patch));
      refreshSettingsView();
      saveSettings();
      renderDrawer();
      showToast("Пресет «" + label + "» применён");
    });
    presetButtons.append(button);
  }
  presets.append(presetButtons);
  const widgets = makeSection("ВИДЖЕТЫ НА ВКЛАДКЕ");
  for (const [key, label] of [["weather", "Погода"], ["bookmarks", "Избранное"], ["date", "Дата"], ["clock", "Часы"], ["search", "Поиск"]]) {
    const toggle = makeToggle(!settings.hiddenWidgets?.includes(key), "Показывать: " + label);
    toggle.input.addEventListener("change", () => {
      const hidden = new Set(Array.isArray(settings.hiddenWidgets) ? settings.hiddenWidgets : []);
      if (toggle.input.checked) hidden.delete(key);
      else hidden.add(key);
      settings.hiddenWidgets = [...hidden];
      if (key === "weather" && !toggle.input.checked) toggleWeatherPanel(false);
      renderWidgetLayout();
      saveSettings();
    });
    widgets.append(makeRow(label, "", toggle.label));
  }
  content.append(widgets);

  const visual = makeSection("ФОН И АТМОСФЕРА");
  const surfaces = el("div", "surface-options");
  surfaces.setAttribute("role", "group"); surfaces.setAttribute("aria-label", "Оформление виджетов");
  for (const [value, label, description] of [["metal", "Жидкий металл", "Тёмная поверхность и металлические блики"], ["frosted", "Матовое стекло", "Мягкое размытие и рассеянный свет"], ["clear", "Прозрачное стекло", "Лёгкая подложка, больше обоев"]]) {
    const button = el("button", "surface-option"); button.type = "button"; button.dataset.surfaceChoice = value;
    const sample = el("span", "surface-sample"); sample.setAttribute("aria-hidden", "true");
    sample.append(el("span", "surface-sample-clock", "09:41"));
    button.append(sample, el("strong", "", label), el("span", "surface-option-description", description));
    button.setAttribute("aria-pressed", String((settings.surfaceStyle || "metal") === value));
    button.addEventListener("click", () => {
      settings.surfaceStyle = value; applyAppearanceVars(); saveSettings();
      for (const choice of surfaces.children) choice.setAttribute("aria-pressed", String(choice === button));
    });
    surfaces.append(button);
  }
  visual.append(surfaces);
  const brightness = document.createElement("input");
  brightness.type = "range"; brightness.min = "35"; brightness.max = "120"; brightness.value = String(settings.brightness);
  const brightnessValue = el("span", "setting-value", `${settings.brightness}%`);
  brightness.addEventListener("input", () => { settings.brightness = Number(brightness.value); brightnessValue.textContent = `${brightness.value}%`; applyAppearanceVars(); scheduleSaveSettings(); });
  const brightnessControl = el("span", "setting-control"); brightnessControl.append(brightness, brightnessValue);
  const brightnessRow = makeRow("Яркость", "Настрой читаемость фонового изображения.", document.createElement("span"));
  brightnessRow.lastElementChild.replaceWith(brightnessControl);
  visual.append(brightnessRow);

  const shade = document.createElement("input");
  shade.type = "range"; shade.min = "0"; shade.max = "60"; shade.value = String(settings.shade);
  const shadeValue = el("span", "setting-value", `${settings.shade}%`);
  shade.addEventListener("input", () => { settings.shade = Number(shade.value); shadeValue.textContent = `${shade.value}%`; applyAppearanceVars(); scheduleSaveSettings(); });
  const shadeControl = el("span", "setting-control"); shadeControl.append(shade, shadeValue);
  const shadeRow = makeRow("Затемнение", "Мягкая вуаль для контраста виджетов.", document.createElement("span"));
  shadeRow.lastElementChild.replaceWith(shadeControl);
  visual.append(shadeRow);

  const scale = document.createElement("input");
  scale.type = "range"; scale.min = "85"; scale.max = "130"; scale.value = String(settings.scale);
  const scaleValue = el("span", "setting-value", `${settings.scale}%`);
  scale.addEventListener("input", () => { settings.scale = Number(scale.value); scaleValue.textContent = `${scale.value}%`; applyAppearanceVars(); scheduleSaveSettings(); });
  const scaleControl = el("span", "setting-control"); scaleControl.append(scale, scaleValue);
  const scaleRow = makeRow("Масштаб", "Подстрой кадрирование обоев.", document.createElement("span"));
  scaleRow.lastElementChild.replaceWith(scaleControl);
  visual.append(scaleRow);

  const position = makeSelect([["center", "По центру"], ["center 35%", "Выше"], ["center 65%", "Ниже"], ["left center", "Слева"], ["right center", "Справа"]], settings.position);
  position.addEventListener("change", () => { settings.position = position.value; renderAppearance(); saveSettings(); });
  visual.append(makeRow("Положение", "Точка фокуса фонового изображения.", position));

  const accent = makeSelect([["snow", "Снежный"], ["ice", "Ледяной"], ["lavender", "Лавандовый"], ["rose", "Розовый рассвет"], ["moss", "Мох" ]], settings.accent);
  accent.disabled = settings.themeMode !== "manual";
  accent.addEventListener("change", () => { settings.accent = accent.value; renderAppearance(); saveSettings(); });
  visual.append(makeRow("Оттенок интерфейса", "Тонкие акценты и детали.", accent));
  const themeMode = makeSelect([["manual", "Вручную"], ["time", "По времени суток"], ["season", "По сезону"]], settings.themeMode);
  themeMode.addEventListener("change", () => {
    settings.themeMode = themeMode.value;
    accent.disabled = settings.themeMode !== "manual";
    updateTheme();
    saveSettings();
  });
  visual.append(makeRow("Автоматическая тема", "Цветовые акценты меняются сами.", themeMode));
  content.append(visual);

  const wallpaperSection = makeSection("СВОИ ОБОИ");
  const fileInput = document.createElement("input");
  fileInput.type = "file"; fileInput.accept = "image/jpeg,image/png,image/webp"; fileInput.hidden = true;
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { showToast("Выбери изображение до 8 МБ"); fileInput.value = ""; return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { showToast("Поддерживаются JPG, PNG и WebP"); fileInput.value = ""; return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
      settings.customWallpaper = await optimizeWallpaper(String(reader.result));
      renderAppearance(); if (await saveSettings({ includeMedia: true })) { renderDrawer(); showToast("Новые обои установлены"); }
      } catch { showToast("Не удалось открыть изображение"); }
    };
    reader.onerror = () => showToast("Не удалось прочитать изображение");
    reader.readAsDataURL(file);
  });
  const upload = el("button", "drawer-button", "＋  Выбрать изображение");
  upload.type = "button"; upload.addEventListener("click", () => fileInput.click());
  const reset = el("button", "drawer-button", "Вернуть исходные обои");
  reset.type = "button"; reset.addEventListener("click", async () => { settings.customWallpaper = ""; renderAppearance(); await saveSettings({ includeMedia: true }); showToast("Исходные обои восстановлены"); });
  const wallpaperButtons = el("div", "button-row"); wallpaperButtons.append(upload, reset, fileInput);
  wallpaperSection.append(el("p", "setting-help", "Изображение хранится только в настройках расширения. Поддерживаются JPG, PNG и WebP."), wallpaperButtons);
  const preview = el("div", "wallpaper-preview");
  preview.setAttribute("role", "group");
  preview.setAttribute("aria-label", "Предпросмотр кадрирования обоев");
  preview.style.backgroundImage = settings.customWallpaper ? 'url("' + settings.customWallpaper + '")' : 'url("Image.webp")';
  preview.style.backgroundPosition = settings.position;
  const point = el("input", "wallpaper-position");
  point.type = "range"; point.min = "0"; point.max = "100";
  point.setAttribute("aria-label", "Вертикальная точка фокуса обоев");
  const match = /^50% (\d+)%$/.exec(settings.position);
  point.value = match ? match[1] : "50";
  const setPosition = (value) => {
    point.value = String(value);
    settings.position = "50% " + value + "%";
    preview.style.backgroundPosition = settings.position;
    renderAppearance();
    scheduleSaveSettings();
  };
  point.addEventListener("input", () => setPosition(Number(point.value)));
  preview.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    preview.setPointerCapture(event.pointerId);
    const move = (e) => { const rect = preview.getBoundingClientRect(); setPosition(Math.round(Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100)))); };
    move(event);
    preview.onpointermove = move;
    preview.onpointerup = preview.onpointercancel = () => { preview.onpointermove = null; };
  });
  wallpaperSection.append(preview, makeRow("Кадрирование", "Перетаскивай точку фокуса на превью или используй ползунок.", point));
  content.append(wallpaperSection);

  const motionSection = makeSection("ДВИЖЕНИЕ ФОНА");
  const parallax = makeToggle(settings.parallaxEnabled, "Включить лёгкий параллакс");
  parallax.input.addEventListener("change", async () => {
    settings.parallaxEnabled = parallax.input.checked;
    renderAppearance();
    await saveSettings();
  });
  motionSection.append(makeRow("Лёгкий параллакс", "Фон едва следует за курсором. Выключен по умолчанию.", parallax.label));

  const videoInput = document.createElement("input");
  videoInput.type = "file";
  videoInput.accept = "video/mp4,video/webm";
  videoInput.hidden = true;
  videoInput.addEventListener("change", () => {
    const file = videoInput.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { showToast("Выбери видео до 15 МБ"); videoInput.value = ""; return; }
    const videoType = file.type || (/\.webm$/i.test(file.name) ? "video/webm" : /\.mp4$/i.test(file.name) ? "video/mp4" : "");
    if (!["video/mp4", "video/webm"].includes(videoType)) {
      showToast("Поддерживаются только MP4 и WebM"); videoInput.value = ""; return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      settings.customVideo = String(reader.result);
      settings.hasCustomVideo = true;
      settings.videoEnabled = true;
      videoToggle.input.checked = true;
      videoToggle.input.disabled = false;
      clearVideo.disabled = false;
      renderAppearance();
      await saveSettings({ includeMedia: true });
      showToast("Видеообои готовы");
    };
    reader.onerror = () => showToast("Не удалось прочитать видео");
    reader.readAsDataURL(file.type ? file : new Blob([file], { type: videoType }));
  });
  const videoToggle = makeToggle(settings.videoEnabled && Boolean(settings.hasCustomVideo), "Использовать видеообои");
  videoToggle.input.disabled = !settings.hasCustomVideo;
  videoToggle.input.addEventListener("change", async () => {
    if (videoToggle.input.checked && !settings.customVideo && settings.hasCustomVideo && globalThis.chrome?.storage?.local) {
      const media = await chrome.storage.local.get("customVideo");
      settings.customVideo = media.customVideo || "";
    }
    if (videoToggle.input.checked && !settings.customVideo) {
      videoToggle.input.checked = false;
      showToast("Сначала выбери видеофайл");
      return;
    }
    settings.videoEnabled = videoToggle.input.checked;
    renderAppearance();
    await saveSettings();
  });
  motionSection.append(makeRow("Видеообои", "Фоновое видео без звука, до 15 МБ.", videoToggle.label));
  const chooseVideo = el("button", "drawer-button", "＋  Выбрать MP4 / WebM");
  chooseVideo.type = "button";
  chooseVideo.addEventListener("click", () => videoInput.click());
  const clearVideo = el("button", "drawer-button", "Удалить видео");
  clearVideo.type = "button";
  clearVideo.disabled = !settings.hasCustomVideo;
  clearVideo.addEventListener("click", async () => {
    settings.customVideo = "";
    settings.hasCustomVideo = false;
    settings.videoEnabled = false;
    videoToggle.input.checked = false;
    videoToggle.input.disabled = true;
    clearVideo.disabled = true;
    renderAppearance();
    await saveSettings({ includeMedia: true });
    showToast("Видеообои удалены");
  });
  const videoActions = el("div", "button-row");
  videoActions.append(chooseVideo, clearVideo, videoInput);
  motionSection.append(videoActions);
  content.append(motionSection);

  const behavior = makeSection("ПОИСК И ВРЕМЯ");
  const engine = makeSelect(Object.entries(ENGINES).map(([key, item]) => [key, item.label]), settings.engine);
  engine.addEventListener("change", () => { settings.engine = engine.value; updateEngineButton(); saveSettings(); });
  behavior.append(makeRow("Поисковая система", "Используется для поиска из строки на странице.", engine));
  const captionToggle = makeToggle(settings.showCaption !== false, "Показывать подпись под строкой поиска");
  captionToggle.input.addEventListener("change", async () => {
    settings.showCaption = captionToggle.input.checked;
    renderAppearance();
    await saveSettings();
  });
  behavior.append(makeRow("Подпись под поиском", "Нижняя строка со сменной фразой. Можно спрятать — поиск от этого не пострадает.", captionToggle.label));
  const timeFormat = makeSelect([["24", "24 часа"], ["12", "12 часов"]], settings.timeFormat);
  timeFormat.addEventListener("change", () => { settings.timeFormat = timeFormat.value; updateClock(); saveSettings(); });
  behavior.append(makeRow("Формат времени", "Выбери привычный формат часов.", timeFormat));
  const idleDelay = makeSelect([["0", "Выключено"], ["30", "30 секунд"], ["60", "1 минута"], ["120", "2 минуты"], ["300", "5 минут"], ["600", "10 минут"]], String(settings.idleClockDelay));
  idleDelay.addEventListener("change", async () => {
    settings.idleClockDelay = Number(idleDelay.value);
    await saveSettings();
    resetIdleTimer(true);
  });
  behavior.append(makeRow("Часы при бездействии", "По центру появятся время и погода.", idleDelay));
  content.append(behavior);

  const seasonal = makeSection("СЕЗОННОЕ НАСТРОЕНИЕ");
  const snowLabel = document.createElement("label");
  snowLabel.className = "toggle-switch";
  snowLabel.setAttribute("aria-label", "Включить снегопад");
  const snowToggle = document.createElement("input");
  snowToggle.type = "checkbox";
  snowToggle.checked = Boolean(settings.snowEnabled);
  snowToggle.setAttribute("aria-label", "Включить эффект снегопада");
  const snowTrack = el("span", "toggle-track");
  snowTrack.setAttribute("aria-hidden", "true");
  snowLabel.append(snowToggle, snowTrack);
  seasonal.append(makeRow("Снегопад", "Нежные снежинки поверх обоев.", snowLabel));
  const accumulation = makeToggle(settings.snowAccumulation !== false, "Снег на виджетах");
  accumulation.input.addEventListener("change", () => {
    settings.snowAccumulation = accumulation.input.checked;
    if (!settings.snowAccumulation) snowDrifts?.clear();
    saveSettings();
  });
  seasonal.append(makeRow("Снег на виджетах", "Снег собирается на виджетах. В центре мышь перемешивает его, у боковых краёв — сбрасывает вниз. Работает при включённом снегопаде.", accumulation.label));

  const snowSliders = [];
  for (const [key, label, help] of [
    ["snowDensity", "Плотность снега", "От нескольких снежинок до густого снегопада."],
    ["snowWind", "Сила ветра", "От штиля до сильных боковых порывов."],
  ]) {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = settings[key];
    slider.setAttribute("aria-label", label);
    slider.disabled = !isSnowEffectActive();
    const value = el("output", "", slider.value + "%");
    value.setAttribute("aria-hidden", "true");
    const control = el("span", "snow-slider");
    control.append(slider, value);
    slider.addEventListener("input", () => {
      settings[key] = slider.valueAsNumber;
      value.textContent = slider.value + "%";
      if (key === "snowDensity" && isSnowEffectActive()) {
        createSnowflakes(true);
        if (reducedMotion.matches) drawSnowflakes(0, true);
      }
      scheduleSaveSettings();
    });
    snowSliders.push(slider);
    seasonal.append(makeRow(label, help, control));
  }
  seasonal.append(el("p", "setting-help", "Эффект работает только в новой вкладке, не использует сеть и автоматически становится статичным при включённом в системе уменьшении анимации."));
  snowToggle.addEventListener("change", async () => {
    settings.snowEnabled = snowToggle.checked;
    for (const slider of snowSliders) slider.disabled = !isSnowEffectActive();
    await saveSettings();
    setSnowEffect(isSnowEffectActive());
  });
  const snowSchedule = makeToggle(settings.snowSchedule, "Автоматически включать снег зимой");
  snowSchedule.input.addEventListener("change", async () => {
    settings.snowSchedule = snowSchedule.input.checked;
    for (const slider of snowSliders) slider.disabled = !isSnowEffectActive();
    await saveSettings();
    setSnowEffect(isSnowEffectActive());
  });
  seasonal.append(makeRow("Снег зимой автоматически", "Включать с декабря по февраль.", snowSchedule.label));
  content.append(seasonal);

  const backup = makeSection("РЕЗЕРВНАЯ КОПИЯ");
  backup.append(el("p", "setting-help", "Экспортируй настройки, закладки и фон в JSON или восстанови их из резервной копии."));
  const exportButton = el("button", "drawer-button", "↓  Экспортировать настройки");
  exportButton.type = "button";
  exportButton.addEventListener("click", exportSettingsBackup);
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".json,application/json";
  importInput.hidden = true;
  importInput.addEventListener("change", () => importSettingsBackup(importInput));
  const importButton = el("button", "drawer-button", "↑  Импортировать настройки");
  importButton.type = "button";
  importButton.addEventListener("click", () => importInput.click());
  const backupActions = el("div", "button-row");
  backupActions.append(exportButton, importButton, importInput);
  backup.append(backupActions);
  content.append(backup);

  const privacy = makeSection("ПРИВАТНОСТЬ");
  privacy.append(el("p", "setting-help", "Настройки и собственные обои остаются в хранилище Chrome. Open-Meteo определяет координаты выбранного города, MET Norway отдаёт прогноз. Google получает домены сайтов для фавиконов (можно отключить), GitHub — запросы проверки обновлений. Геолокация и аналитика не используются."));
  content.append(privacy);
  const groups = [["Виджеты и поведение", [presets, widgets, behavior]], ["Внешний вид", [visual, wallpaperSection, motionSection, seasonal]], ["Данные и приватность", [backup, privacy]]];
  const tabs = el("div", "settings-tabs");
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-label", "Категории общих настроек");
  const panels = groups.map(([label, sections]) => {
    const panel = el("div", "settings-category");
    panel.append(...sections);
    const button = el("button", "drawer-button", label);
    button.type = "button";
    button.addEventListener("click", () => {
      panels.forEach(({ panel: other, button: control }) => {
        other.hidden = other !== panel;
        control.setAttribute("aria-pressed", String(other === panel));
      });
    });
    tabs.append(button);
    return { panel, button };
  });
  content.append(tabs);
  panels.forEach(({ panel, button }, index) => { panel.hidden = index !== 0; button.setAttribute("aria-pressed", String(index === 0)); content.append(panel); });
}

async function exportSettingsBackup() {
  try { await performExportSettingsBackup(); }
  catch (error) { console.error("yunagi: export failed", error); showToast("Не удалось создать копию. Попробуй ещё раз."); }
}

async function performExportSettingsBackup() {
  const backupSettings = { ...settings };
  if (settings.hasCustomVideo && !backupSettings.customVideo && globalThis.chrome?.storage?.local) {
    const media = await chrome.storage.local.get("customVideo");
    backupSettings.customVideo = media.customVideo || "";
  }
  const backup = {
    format: "yunagi-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: backupSettings
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `yunagi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Резервная копия сохранена");
}

function normalizeImportedSettings(source) {
  const input = source && typeof source === "object" ? source : {};
  const bookmarks = (Array.isArray(input.bookmarks) ? input.bookmarks : DEFAULTS.bookmarks).slice(0, 24).map((bookmark) => {
    const rawUrl = String(bookmark?.url || "").trim();
    let url = rawUrl;
    if (url && !/^https?:\/\//i.test(url)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^[^/:]+:\d+(?:\/|$)/.test(url)) url = "";
      else url = `https://${url}`;
    }
    try { if (url && !/^https?:$/.test(new URL(url).protocol)) url = ""; }
    catch { url = ""; }
    const possibleIcon = typeof bookmark?.icon === "string" ? bookmark.icon : "";
    const icon = /^data:image\/(png|jpeg|webp);base64,/i.test(possibleIcon) && possibleIcon.length <= 400_000
      ? possibleIcon
      : possibleIcon.length <= 6 && !possibleIcon.startsWith("data:") ? possibleIcon : "";
    return {
      name: String(bookmark?.name || "Сайт").trim().slice(0, 24) || "Сайт",
      url,
      color: /^#[\da-f]{6}$/i.test(bookmark?.color || "") ? bookmark.color : "#667a82",
      icon
    };
  });
  const image = typeof input.customWallpaper === "string" && /^data:image\/(png|jpeg|webp);base64,/i.test(input.customWallpaper) && input.customWallpaper.length <= 12_000_000
    ? input.customWallpaper : "";
  const video = typeof input.customVideo === "string" && /^data:video\/(mp4|webm);base64,/i.test(input.customVideo) && input.customVideo.length <= 22_000_000
    ? input.customVideo : "";
  const clamp = (value, min, max, fallback) => {
    const number = typeof value === "number" || (typeof value === "string" && value.trim()) ? Number(value) : NaN;
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  };
  const sizes = input.widgetSizes && typeof input.widgetSizes === "object" ? input.widgetSizes : {};
  const positionOptions = ["center", "center 35%", "center 65%", "left center", "right center"];
  const themes = ["manual", "time", "season"];
  const accents = Object.keys(ACCENT_PALETTES);
  const taskList = Array.isArray(input.focusTasks) ? input.focusTasks : [];
  return {
    ...DEFAULTS,
    bookmarks,
    engine: Object.hasOwn(ENGINES, input.engine) ? input.engine : DEFAULTS.engine,
    city: String(input.city || DEFAULTS.city).trim().slice(0, 70) || DEFAULTS.city,
    cityLocation: validCityLocation(input.cityLocation),
    units: input.units === "fahrenheit" ? "fahrenheit" : "celsius",
    timeFormat: input.timeFormat === "12" ? "12" : "24",
    showCaption: input.showCaption !== false,
    clockDisplay: ["analog", "digital", "both"].includes(input.clockDisplay) ? input.clockDisplay : DEFAULTS.clockDisplay,
    layoutMode: ["free", "stack", "custom"].includes(input.layoutMode) ? input.layoutMode : DEFAULTS.layoutMode,
    widgetLayout: Object.fromEntries(Object.entries(WIDGET_LAYOUT_DEFAULTS).map(([key, fallback]) => {
      const saved = input.widgetLayout?.[key] || {};
      const x = clamp(saved.x, 1, 24, fallback.x);
      const y = clamp(saved.y, 1, 12, fallback.y);
      const w = clamp(saved.w, 1, 25 - x, fallback.w);
      const h = clamp(saved.h, 0, 13 - y, fallback.h);
      return [key, { x, y, w, h }];
    })),
    brightness: clamp(input.brightness, 35, 120, DEFAULTS.brightness),
    shade: clamp(input.shade, 0, 60, DEFAULTS.shade),
    scale: clamp(input.scale, 85, 130, DEFAULTS.scale),
    position: positionOptions.includes(input.position) || /^50% (100|[1-9]?\d)%$/.test(input.position) ? input.position : DEFAULTS.position,
    accent: accents.includes(input.accent) ? input.accent : DEFAULTS.accent,
    surfaceStyle: ["metal", "frosted", "clear"].includes(input.surfaceStyle) ? input.surfaceStyle : DEFAULTS.surfaceStyle,
    themeMode: themes.includes(input.themeMode) ? input.themeMode : "manual",
    idleClockDelay: [0, 30, 60, 120, 300, 600].includes(Number(input.idleClockDelay)) ? Number(input.idleClockDelay) : DEFAULTS.idleClockDelay,
    customWallpaper: image,
    customVideo: video,
    hasCustomVideo: Boolean(video),
    videoEnabled: Boolean(input.videoEnabled && video),
    parallaxEnabled: Boolean(input.parallaxEnabled),
    hiddenWidgets: Array.isArray(input.hiddenWidgets) ? [...new Set(input.hiddenWidgets.filter((key) => Object.hasOwn(WIDGET_LAYOUT_DEFAULTS, key)))] : [],
    faviconEnabled: input.faviconEnabled !== false,
    iconStyle: ["color", "mono"].includes(input.iconStyle) ? input.iconStyle : DEFAULTS.iconStyle,
    widgetSizes: {
      weather: clamp(sizes.weather, 75, 140, 100),
      bookmarks: clamp(sizes.bookmarks, 75, 140, 100),
      date: clamp(sizes.date, 75, 140, clamp(sizes.clock, 75, 140, 100)),
      clock: clamp(sizes.clock, 75, 140, 100)
    },
    snowEnabled: Boolean(input.snowEnabled),
    snowAccumulation: input.snowAccumulation !== false,
    snowSchedule: Boolean(input.snowSchedule),
    snowDensity: Math.round(clamp(input.snowDensity, 0, 100,
      input.snowIntensity === "soft" ? 15 : input.snowIntensity === "dense" ? 82 : DEFAULTS.snowDensity)),
    snowWind: Math.round(clamp(input.snowWind, 0, 100, DEFAULTS.snowWind)),
    focusNote: String(input.focusNote || "").slice(0, 240),
    focusTasks: taskList.slice(0, 12).map((task) => ({ text: String(task?.text || "").trim().slice(0, 100), done: Boolean(task?.done) })).filter((task) => task.text)
  };
}

async function importSettingsBackup(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 40 * 1024 * 1024) { showToast("Резервная копия слишком большая"); input.value = ""; return; }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!["yunagi-backup", "yukinagi-backup"].includes(parsed.format) || !parsed.settings) throw new Error("Это не резервная копия yunagi");
      if (parsed.version !== 1) throw new Error("Версия резервной копии не поддерживается");
      const previous = settings;
      settings = normalizeImportedSettings(parsed.settings);
      if (!await saveSettings({ includeMedia: true })) { settings = previous; throw new Error("Не удалось сохранить резервную копию. Проверь свободное место и повтори импорт."); }
      renderAppearance();
      renderBookmarks();
      updateEngineButton();
      updateClock();
      updateWeather();
      $("#focusNote").value = settings.focusNote;
      renderFocusTasks();
      setSnowEffect(isSnowEffectActive());
      renderDrawer();
      showToast("Настройки восстановлены");
    } catch (error) {
      showToast(error instanceof SyntaxError ? "Файл резервной копии повреждён" : error.message || "Не удалось импортировать файл");
    }
    input.value = "";
  };
  reader.onerror = () => { showToast("Не удалось прочитать файл"); input.value = ""; };
  reader.readAsText(file);
}

function validCityLocation(place) {
  if (!place || typeof place.latitude !== "number" || typeof place.longitude !== "number" || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude) || Math.abs(place.latitude) > 90 || Math.abs(place.longitude) > 180) return null;
  return { name: String(place.name || "").slice(0,70), latitude: place.latitude, longitude: place.longitude, admin1: String(place.admin1 || "").slice(0,100), country: String(place.country || "").slice(0,100) };
}

function renderWeatherSettings(content) {
  content.append(...drawerHeading("Небо сегодня", "Погода загружается для указанного города. Геолокация не нужна."));
  const section = makeSection("ПОГОДА");
  const cityControl = el("div", "city-control");
  const city = document.createElement("input"); city.type = "search"; city.value = settings.city; city.placeholder = "Начни вводить город…"; city.maxLength = 70; city.autocomplete = "off"; city.setAttribute("aria-label", "Найти город");
  const results = el("div", "city-results"); results.hidden = true;
  const status = el("span", "city-status", settings.cityLocation ? [settings.cityLocation.name, settings.cityLocation.admin1, settings.cityLocation.country].filter(Boolean).join(", ") : "Выбери город из результатов, чтобы не перепутать одноимённые места.");
  status.setAttribute("role", "status");
  let timer, generation = 0;
  city.addEventListener("input", () => {
    clearTimeout(timer); const request = ++generation; results.replaceChildren(); results.hidden = true;
    const query = city.value.trim();
    if (query.length < 2) { status.textContent = "Введи хотя бы две буквы."; return; }
    status.textContent = "Ищем города…";
    timer = setTimeout(async () => {
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.search = new URLSearchParams({ name: query, count: "6", language: "ru", format: "json" });
        const data = await fetchWeatherJson(url);
        if (request !== generation || !city.isConnected) return;
        const places = data.results || [];
        status.textContent = places.length ? "Выбери нужный город" : "Ничего не найдено. Попробуй другое название.";
        results.hidden = !places.length;
        places.forEach(place => {
          const button = el("button", "city-result"); button.type = "button";
          button.append(el("strong", "", place.name), el("span", "", [place.admin1, place.country].filter(Boolean).join(", ")));
          button.addEventListener("click", () => {
            generation++; settings.city = place.name; settings.cityLocation = validCityLocation(place);
            city.value = place.name; results.hidden = true;
            status.textContent = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
            saveSettings(); updateWeather(true); city.focus();
          }); results.append(button);
        });
      } catch { if (request === generation && city.isConnected) status.textContent = "Поиск недоступен. Проверь подключение и попробуй ещё раз."; }
    }, 300);
  });
  city.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" && !results.hidden) { event.preventDefault(); results.querySelector("button")?.focus(); }
    if (event.key === "Escape" && !results.hidden) { event.stopPropagation(); results.hidden = true; }
  });
  results.addEventListener("keydown", event => {
    const buttons = Array.from(results.querySelectorAll("button")); const index = buttons.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); buttons[(index + (event.key === "ArrowDown" ? 1 : buttons.length-1)) % buttons.length]?.focus(); }
    if (event.key === "Escape") { event.stopPropagation(); results.hidden = true; city.focus(); }
  });
  cityControl.append(city, status, results);
  section.append(cityControl);
  const units = makeSelect([["celsius", "Цельсий · °C"], ["fahrenheit", "Фаренгейт · °F"]], settings.units);
  units.addEventListener("change", async () => { settings.units = units.value; await saveSettings(); updateWeather(); });
  section.append(makeRow("Единицы", "Температура в виджете.", units));
  const refresh = el("button", "drawer-button", "↻  Обновить погоду"); refresh.type = "button"; refresh.addEventListener("click", () => updateWeather(true));
  const actions = el("div", "button-row"); actions.append(refresh); section.append(actions);
  content.append(section);
  renderWidgetSizeSetting(content, "weather", "Размер виджета погоды");
}

function renderClockSettings(content) {
  content.append(...drawerHeading("Время в своём ритме", "Настрой отображение часов и даты."));
  const section = makeSection("ЧАСЫ И ДАТА");
  const display = makeSelect([["analog", "Только аналоговые"], ["digital", "Только цифровые"], ["both", "Показывать оба вида"]], settings.clockDisplay);
  display.addEventListener("change", async () => { settings.clockDisplay = display.value; renderWidgetLayout(); await saveSettings(); });
  section.append(makeRow("Вид часов", "Выбери, какие часы показывать на экране.", display));
  const format = makeSelect([["24", "24 часа"], ["12", "12 часов"]], settings.timeFormat);
  format.addEventListener("change", async () => { settings.timeFormat = format.value; updateClock(); await saveSettings(); });
  section.append(makeRow("Формат времени", "Для цифровых часов и режима бездействия.", format));
  section.append(el("p", "setting-help", "Дата и время берутся из системных настроек компьютера."));
  content.append(section);
  renderWidgetSizeSetting(content, "date", "Размер календаря");
  renderWidgetSizeSetting(content, "clock", "Размер часов");
}

function renderBookmarkSettings(content) {
  content.append(...drawerHeading("Твои места", "Добавляй любимые сайты и расставляй их в удобном порядке."));
  const section = makeSection("ИЗБРАННЫЕ САЙТЫ");
  const layoutMode = makeSelect([["free", "Блоки независимо"], ["stack", "Одна вертикальная колонка слева"], ["custom", "Мой макет по сетке"]], settings.layoutMode || "free");
  layoutMode.addEventListener("change", () => setLayoutMode(layoutMode.value));
  section.append(makeRow("Расположение", "Размещай блоки независимо, колонкой или в конструкторе.", layoutMode));
  const favicons = makeToggle(settings.faviconEnabled !== false, "Показывать иконки сайтов");
  favicons.input.addEventListener("change", async () => {
    settings.faviconEnabled = favicons.input.checked;
    renderBookmarks();
    await saveSettings();
  });
  section.append(makeRow("Иконки сайтов", "Фавикон с сайта вместо буквы. Свой символ или картинка всегда важнее.", favicons.label));
  const iconStyle = makeSelect([["color", "Обычные цветные"], ["mono", "Монохромные"]], settings.iconStyle || "color");
  iconStyle.addEventListener("change", async () => {
    settings.iconStyle = iconStyle.value;
    applyIconStyle();
    await saveSettings();
  });
  section.append(makeRow("Стиль значков", "Цветные значки сайтов или спокойный монохром.", iconStyle));
  const editLayout = el("button", "drawer-button", "⌗  Растянуть и расставить по сетке");
  editLayout.type = "button";
  editLayout.addEventListener("click", () => { closeDrawer(); toggleLayoutEditor(true); });
  section.append(editLayout);
  const list = el("div", "bookmark-edit-list");
  const listHeading = el("div", "bookmark-list-heading");
  listHeading.append(el("h2", "", "Твои сайты"), el("span", "", String(settings.bookmarks.length) + " / 24"));
  section.append(listHeading);
  const bookmarks = Array.isArray(settings.bookmarks) ? settings.bookmarks : [];
  if (!bookmarks.length) list.append(el("p", "empty-bookmarks", "Здесь пока тихо. Добавь первый сайт."));
  bookmarks.forEach((bookmark, index) => {
    const editItem = el("div", "bookmark-edit-item");
    const rebuildList = (focusIndex = index) => {
      const scroll = $("#drawerContent").scrollTop;
      renderDrawer();
      $("#drawerContent").scrollTop = scroll;
      const items = Array.from($("#drawerContent").querySelectorAll(".bookmark-edit-item"));
      items[Math.min(focusIndex, items.length - 1)]?.querySelector("input")?.focus({ preventScroll: true });
    };
    const row = el("div", "bookmark-edit-row");
    const preview = el("span", "bookmark-editor-preview");
    const refreshPreview = () => {
      const current = settings.bookmarks[index];
      if (!current) return;
      preview.replaceChildren();
      preview.style.setProperty("--bookmark-color", current.color || "#667a82");
      if (current.icon?.startsWith("data:image/")) {
        const image = el("img", "bookmark-custom-image"); image.src = current.icon; image.alt = ""; preview.append(image);
      } else if (current.icon) preview.textContent = current.icon;
      else {
        const favicon = settings.faviconEnabled === false ? "" : bookmarkFavicon(current.url);
        const fallback = (current.name || "?").trim().charAt(0).toUpperCase();
        if (favicon) {
          const image = el("img", "bookmark-favicon"); image.src = favicon; image.alt = "";
          image.addEventListener("error", () => { preview.textContent = fallback; }, { once: true }); preview.append(image);
        } else preview.textContent = fallback;
      }
    };
    refreshPreview();
    const name = document.createElement("input"); name.type = "text"; name.value = bookmark.name || ""; name.placeholder = "Название"; name.maxLength = 24; name.setAttribute("aria-label", "Название закладки");
    const url = document.createElement("input"); url.type = "url"; url.value = bookmark.url || ""; url.placeholder = "https://…"; url.setAttribute("aria-label", "Адрес закладки");
    const remove = el("button", "remove-bookmark", "×"); remove.type = "button"; remove.setAttribute("aria-label", `Удалить ${bookmark.name || "закладку"}`);
    const customize = el("div", "bookmark-edit-tools");
    const details = el("details", "bookmark-icon-details");
    const summary = el("summary", "", "Настроить значок");
    summary.append(el("span", "bookmark-details-hint", "Символ, цвет или изображение"));
    details.append(summary, customize);
    const icon = document.createElement("input"); icon.type = "text"; icon.value = bookmark.icon?.startsWith("data:image/") ? "" : bookmark.icon || ""; icon.placeholder = "❄"; icon.maxLength = 6; icon.setAttribute("aria-label", "Символ или эмодзи значка");
    const color = document.createElement("input"); color.type = "color"; color.value = /^#[\da-f]{6}$/i.test(bookmark.color || "") ? bookmark.color : "#667a82"; color.title = "Цвет значка"; color.setAttribute("aria-label", "Цвет значка закладки");
    const uploadIcon = document.createElement("input"); uploadIcon.type = "file"; uploadIcon.accept = "image/png,image/jpeg,image/webp"; uploadIcon.hidden = true;
    const uploadButton = el("button", "bookmark-tool-button", "Иконка"); uploadButton.type = "button"; uploadButton.title = "Загрузить изображение до 256 КБ"; uploadButton.addEventListener("click", () => uploadIcon.click());
    const resetIcon = el("button", "bookmark-tool-button", "Сброс"); resetIcon.type = "button"; resetIcon.title = "Сбросить значок";
    const commit = async (replaceIcon = false) => {
      let nextUrl = url.value.trim();
      if (nextUrl && !/^https?:\/\//i.test(nextUrl)) nextUrl = `https://${nextUrl}`;
      if (nextUrl) {
        try { const parsed = new URL(nextUrl); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); }
        catch { url.setCustomValidity("Проверь адрес сайта"); url.reportValidity(); return; }
      }
      url.setCustomValidity("");
      const oldIcon = settings.bookmarks[index].icon || "";
      const nextIcon = replaceIcon ? icon.value.trim() : oldIcon.startsWith("data:image/") ? oldIcon : icon.value.trim();
      settings.bookmarks[index] = { ...settings.bookmarks[index], name: name.value.trim() || "Сайт", url: nextUrl, color: color.value, icon: nextIcon };
      url.value = nextUrl;
      refreshPreview();
      renderBookmarks(); await saveSettings();
    };
    name.addEventListener("change", () => commit()); url.addEventListener("change", () => commit());
    url.addEventListener("input", () => url.setCustomValidity(""));
    icon.addEventListener("change", () => commit(true)); color.addEventListener("change", () => commit());
    uploadIcon.addEventListener("change", () => {
      const file = uploadIcon.files?.[0];
      if (!file) return;
      if (file.size > 256 * 1024) { showToast("Иконка должна быть меньше 256 КБ"); uploadIcon.value = ""; return; }
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { showToast("Поддерживаются PNG, JPG и WebP"); uploadIcon.value = ""; return; }
      const uploadTarget = settings.bookmarks[index];
      const reader = new FileReader();
      reader.onload = async () => {
        const currentIndex = settings.bookmarks.indexOf(uploadTarget);
        if (currentIndex === -1) { showToast("Сайт изменён. Выбери изображение ещё раз."); return; }
        settings.bookmarks[currentIndex].icon = String(reader.result);
        icon.value = "";
        renderBookmarks();
        await saveSettings();
        refreshPreview();
        showToast("Иконка обновлена");
      };
      reader.onerror = () => showToast("Не удалось прочитать значок");
      reader.readAsDataURL(file);
    });
    resetIcon.addEventListener("click", async () => {
      settings.bookmarks[index].icon = "";
      icon.value = "";
      refreshPreview();
      renderBookmarks();
      await saveSettings();
    });
    remove.addEventListener("click", () => removeBookmark(index));
    const moveUp = el("button", "bookmark-tool-button", "↑"); moveUp.type = "button"; moveUp.title = "Переместить выше"; moveUp.setAttribute("aria-label", "Переместить выше: " + bookmark.name); moveUp.disabled = index === 0;
    const moveDown = el("button", "bookmark-tool-button", "↓"); moveDown.type = "button"; moveDown.title = "Переместить ниже"; moveDown.setAttribute("aria-label", "Переместить ниже: " + bookmark.name); moveDown.disabled = index === bookmarks.length - 1;
    const move = async (direction) => {
      const target = index + direction;
      if (target < 0 || target >= settings.bookmarks.length) return;
      [settings.bookmarks[index], settings.bookmarks[target]] = [settings.bookmarks[target], settings.bookmarks[index]];
      await saveSettings(); renderBookmarks(); rebuildList(target);
    };
    moveUp.addEventListener("click", () => move(-1)); moveDown.addEventListener("click", () => move(1));
    const symbolField = el("label", "bookmark-icon-field"); symbolField.append(el("span", "", "Символ"), icon);
    const colorField = el("label", "bookmark-icon-field"); colorField.append(el("span", "", "Цвет"), color);
    customize.append(symbolField, colorField, uploadButton, resetIcon, uploadIcon);
    const fields = el("div", "bookmark-editor-fields");
    const nameField = el("label", "bookmark-editor-field"); nameField.append(el("span", "", "Название"), name);
    const urlField = el("label", "bookmark-editor-field"); urlField.append(el("span", "", "Адрес сайта"), url);
    fields.append(nameField, urlField);
    const controls = el("div", "bookmark-editor-controls"); controls.append(moveUp, moveDown, remove);
    row.append(preview, fields, controls);
    editItem.append(row, details);
    list.append(editItem);
  });
  const appearance = el("details", "bookmark-appearance-details");
  appearance.append(el("summary", "", "Вид и расположение избранного"));
  while (section.firstChild && section.firstChild !== listHeading) appearance.append(section.firstChild);
  section.append(list);
  const add = el("button", "drawer-button", "＋  Добавить сайт"); add.type = "button";
  add.disabled = bookmarks.length >= 24;
  add.addEventListener("click", async () => {
    if (settings.bookmarks.length >= 24) return;
    settings.bookmarks.push({ name: "Новый сайт", url: "", color: "#667a82" });
    await saveSettings(); renderBookmarks(); renderDrawer();
    const inputs = $$(".bookmark-edit-row input", $("#drawerContent")); inputs.at(-2)?.focus(); inputs.at(-2)?.select();
  });
  const actions = el("div", "button-row bookmark-add-row"); actions.append(add);
  section.insertBefore(actions, list);
  section.append(appearance);
  content.append(section);
  content.append(el("p", "setting-help", "Перетаскивай значки в карточке или используй стрелки для изменения порядка. Карточка растёт по числу закладок. Значок можно задать символом, цветом или своим изображением."));
  renderWidgetSizeSetting(content, "bookmarks", "Размер виджета закладок");
}

function renderWidgetSizeSetting(content, widget, label) {
  const section = makeSection("РАЗМЕР ВИДЖЕТА");
  const range = document.createElement("input");
  range.type = "range";
  range.min = "75";
  range.max = "140";
  range.step = "5";
  range.value = String(settings.widgetSizes?.[widget] || 100);
  const value = el("span", "setting-value", `${range.value}%`);
  range.addEventListener("input", () => {
    settings.widgetSizes[widget] = Number(range.value);
    value.textContent = `${range.value}%`;
    // На тике слайдера достаточно одной переменной и перераскладки —
    // полная renderAppearance() тут перезапускала бы обои и видео.
    document.documentElement.style.setProperty(`--widget-${widget}-scale`, String(Number(range.value) / 100));
    scheduleWidgetLayout();
  });
  range.addEventListener("change", saveSettings);
  const row = makeRow(label, "Изменение сразу видно на странице.", range);
  row.lastElementChild.append(value);
  section.append(row);
  content.append(section);
}

function updateEngineButton() {
  const engine = ENGINES[settings.engine] || ENGINES.google;
  $("#engineButton").textContent = engine.mark;
  $("#engineButton").title = `Поиск: ${engine.label}`;
}

// ---------- Проверка обновлений ----------
// Наведение на метку GitHub внизу слева показывает, отстала ли установленная
// версия от репозитория: сравниваем manifest.version локально и на GitHub.
// Проверяем только стабильную ветку main; результат кэшируем.
const UPDATE_BRANCHES = ["main"];
const UPDATE_CHECK_TTL_MS = 6 * 60 * 60 * 1000;
const UPDATE_CHECK_KEY = "yunagi-update-check";
let updateState = { state: "unknown", local: "", remote: "" };

// "1.2.10" свежее "1.2.9" — сравниваем по числовым частям, не строкой.
function compareVersions(a, b) {
  const left = String(a || "").split(".");
  const right = String(b || "").split(".");
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const difference = (Number(left[i]) || 0) - (Number(right[i]) || 0);
    if (difference) return difference > 0 ? 1 : -1;
  }
  return 0;
}

async function readLocalVersion() {
  if (globalThis.chrome?.runtime?.getManifest) return chrome.runtime.getManifest().version || "";
  try {
    const response = await fetch("manifest.json", { cache: "no-cache" });
    if (response.ok) return (await response.json()).version || "";
  } catch { /* файла может не быть — тогда просто не показываем статус */ }
  return "";
}

async function fetchRemoteVersion(branch) {
  try {
    const response = await fetch(`https://raw.githubusercontent.com/ahu1e/yunagi/${branch}/manifest.json`, { cache: "no-cache", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return "";
    return (await response.json()).version || "";
  } catch { /* офлайн — ветка просто пропадёт из сравнения */ }
  return "";
}

function readUpdateCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(UPDATE_CHECK_KEY) || "null");
    return cached && cached.state ? cached : null;
  } catch { return null; }
}

// Статус в нижней левой метке: «yunagi» — пока не проверили, иначе вердикт.
function renderBrandStatus() {
  const mark = $(".brand-mark");
  const latin = $(".brand-name-latin");
  if (!mark || !latin) return;
  const hasUpdate = updateState.state === "update";
  latin.textContent = hasUpdate
    ? "new update available"
    : updateState.state === "actual" ? "up to date" : "yunagi";
  mark.classList.toggle("is-outdated", hasUpdate);
  let hint = "";
  if (hasUpdate && updateState.remote) hint = ` · есть обновление ${updateState.remote} (у тебя ${updateState.local || "?"})`;
  else if (updateState.state === "actual" && updateState.local) hint = ` · версия ${updateState.local} актуальна`;
  mark.title = `Открыть GitHub${hint}`;
  mark.setAttribute("aria-label", `夕凪 — открыть репозиторий yunagi на GitHub${hint}`);
}

async function checkForUpdates() {
  const cached = readUpdateCache();
  if (cached) {
    updateState = { state: cached.state, local: cached.local || "", remote: cached.remote || "" };
    renderBrandStatus();
    if (Date.now() - (cached.at || 0) < UPDATE_CHECK_TTL_MS) return; // проверили недавно
  }
  const local = await readLocalVersion();
  let remote = "";
  for (const version of await Promise.all(UPDATE_BRANCHES.map(fetchRemoteVersion))) {
    if (version && (!remote || compareVersions(version, remote) > 0)) remote = version;
  }
  if (!local || !remote) { renderBrandStatus(); return; } // нет сети — остаёмся на кэше
  updateState = { state: compareVersions(remote, local) > 0 ? "update" : "actual", local, remote };
  try {
    localStorage.setItem(UPDATE_CHECK_KEY, JSON.stringify({ ...updateState, at: Date.now() }));
  } catch { /* приватный режим — просто не кэшируем */ }
  renderBrandStatus();
}

// Подпись под строкой поиска включается-выключается в настройках.
// Пока она скрыта — нечего ловить фокусом и крутить смену фраз.
function applyCaptionVisibility() {
  const caption = $("#searchCaption");
  const visible = settings.showCaption !== false;
  document.body.classList.toggle("hide-caption", !visible);
  if (!caption) return;
  caption.setAttribute("aria-hidden", String(!visible));
  caption.tabIndex = visible ? 0 : -1;
}

function setCaptionText(nextIndex) {
  const caption = $("#searchCaption");
  if (!caption) return;
  captionIndex = nextIndex;
  caption.classList.add("is-changing");
  window.setTimeout(() => {
    caption.textContent = SEARCH_CAPTIONS[captionIndex];
    caption.classList.remove("is-changing");
  }, 360);
}

// Следующая фраза — случайная, но никогда не повторяет текущую.
function pickCaptionIndex() {
  if (SEARCH_CAPTIONS.length < 2) return 0;
  let next = captionIndex;
  while (next === captionIndex) next = Math.floor(Math.random() * SEARCH_CAPTIONS.length);
  return next;
}

function startCaptionRotation() {
  const caption = $("#searchCaption");
  if (!caption) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // При открытии вкладки фраза тоже случайная — не первая из списка.
  captionIndex = Math.floor(Math.random() * SEARCH_CAPTIONS.length);
  caption.textContent = SEARCH_CAPTIONS[captionIndex];
  if (reduced || SEARCH_CAPTIONS.length < 2) return;
  clearInterval(captionTimer);
  captionTimer = window.setInterval(() => {
    if (document.hidden || document.body.classList.contains("focus-mode") || document.body.classList.contains("hide-caption")) return;
    setCaptionText(pickCaptionIndex());
  }, CAPTION_ROTATE_MS);
}

function snowSpriteSize(size) {
  return Math.max(3, Math.min(12, Math.round(size / 3) * 3));
}

function createSnowflakeSprite(size, kind, variant) {
  const spriteSize = snowSpriteSize(size);
  const cacheKey = kind + "-" + spriteSize + "-" + variant;
  if (snowSpriteCache.has(cacheKey)) return snowSpriteCache.get(cacheKey);
  const side = spriteSize + 6;
  const sprite = document.createElement("canvas"); sprite.width = sprite.height = side * 2;
  const context = sprite.getContext("2d");
  if (!context) return sprite;
  context.scale(2, 2);
  const center = side / 2, radius = spriteSize * .4;
  if (kind === "crystal") {
    context.strokeStyle = "rgba(245,252,255,.88)";
    context.lineWidth = .6;
    context.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + variant * .23;
      const length = radius * (1 + (i + variant) % 3 * .08);
      const x = Math.cos(angle), y = Math.sin(angle);
      context.moveTo(center, center);
      context.lineTo(center + x * length, center + y * length);
      for (const side of [-1, 1]) {
        context.moveTo(center + x * length * .57, center + y * length * .57);
        context.lineTo(center + (x * .82 - side * y * .24) * length,
          center + (y * .82 + side * x * .24) * length);
      }
    }
    context.stroke();
  } else {
    const lobes = kind === "tuft" ? 5 + variant % 4 : 2 + variant % 2;
    for (let i = 0; i < lobes; i++) {
      const angle = i * 2.39996 + variant * .73;
      const spread = kind === "tuft" ? .76 : .28;
      const offset = radius * (.12 + spread * ((i * 7 + variant * 3) % 11) / 10);
      const x = center + Math.cos(angle) * offset, y = center + Math.sin(angle) * offset;
      const grain = radius * (.43 + .18 * ((i + variant) % 3));
      const fade = context.createRadialGradient(x, y, 0, x, y, grain);
      fade.addColorStop(0, "rgba(253,255,255,.87)");
      fade.addColorStop(.5, "rgba(240,248,255,.47)");
      fade.addColorStop(1, "rgba(230,242,255,0)");
      context.fillStyle = fade;
      context.fillRect(x - grain, y - grain, grain * 2, grain * 2);
    }
  }
  snowSpriteCache.set(cacheKey, sprite);
  return sprite;
}

let snowDrifts = null;
let snowSurfaceTime = 0;
function syncSnowSurfaces(force = false) {
  if (!snowDrifts) return;
  const suspended = !settings.snowAccumulation || reducedMotion.matches || document.body.classList.contains("layout-editing") || document.body.classList.contains("idle-mode") || weatherPanelOpen;
  if (suspended) { snowDrifts.clear(); return; }
  const now = performance.now();
  if (!force && now - snowSurfaceTime < 200) return;
  snowSurfaceTime = now;
  const focus = document.body.classList.contains("focus-mode");
  const selectors = focus ? ["#focusPanel"] : ['[data-layout-item="weather"]', '[data-layout-item="bookmarks"]', '[data-layout-item="date"]', '[data-layout-item="clock"]', '.search-area .search-box'];
  const surfaces = [];
  for (const selector of selectors) {
    const item = $(selector);
    if (!item || item.closest("[hidden]") || !item.getClientRects().length) continue;
    const rect = item.getBoundingClientRect();
    surfaces.push({ key: selector, x: rect.left, y: rect.top, width: rect.width });
  }
  snowDrifts.sync(surfaces);
}

let snowWindTime = 0;
function createSnowflakes(preserve = false) {
  if (!snowContext) return;
  const width = window.innerWidth, height = window.innerHeight;
  const scale = Math.max(.55, Math.min(1, Math.sqrt(width * height / 1_024_000)));
  const count = Math.round((12 + 178 * (settings.snowDensity / 100) ** 1.15) * scale);
  if (preserve && snowflakes.length > count) {
    // Keep the existing depth mix while thinning the field.
    const previous = snowflakes;
    snowflakes = Array.from({ length: count }, (_, i) => previous[Math.floor(i * previous.length / count)]);
  } else if (!preserve) {
    snowflakes = [];
  }
  while (snowflakes.length < count) {
    const layer = Math.random();
    const depth = layer < .59 ? .12 + Math.random() * .28 : layer < .88 ? .42 + Math.random() * .3 : .8 + Math.random() * .2;
    const kind = depth < .42 ? "grain" : Math.random() < .28 ? "crystal" : "tuft";
    const size = kind === "crystal" ? 5 + Math.random() * 4 : depth < .42 ? 1.2 + Math.random() * 1.8
      : depth < .8 ? 3 + Math.random() * 3.5 : 7 + Math.random() * 5;
    const spriteSize = snowSpriteSize(size);
    snowflakes.push({
      x: Math.random() * width, y: Math.random() * height, depth, size, kind,
      sprite: createSnowflakeSprite(size, kind, Math.floor(Math.random() * 6)),
      spriteSide: (spriteSize + 6) * (size / spriteSize),
      speed: (.46 + depth ** 2 * 1.8 + Math.random() * .27) * (kind === "crystal" ? .73 : 1),
      drift: .11 + depth * .65,
      phase: Math.random() * Math.PI * 2,
      phaseRate: .008 + Math.random() * .031,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - .5) * (.008 + depth * .029),
      alpha: kind === "grain" ? .37 + Math.random() * .28 : .53 + Math.random() * .28
    });
  }
  snowflakes.sort((a, b) => a.depth - b.depth);
}

function resizeSnowCanvas() {
  const canvas = $("#snowCanvas");
  if (!canvas || !snowContext) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);
  snowContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  createSnowflakes();
  snowDrifts?.resize(window.innerWidth, window.innerHeight, ratio);
  syncSnowSurfaces(true);
  if (isSnowEffectActive() && reducedMotion.matches) drawSnowflakes(0, true);
}

function drawSnowflakes(delta, stationary = false) {
  if (!snowContext) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  snowContext.clearRect(0, 0, width, height);
  syncSnowSurfaces();
  if (!stationary) snowWindTime += delta * .01667;
  const gust = Math.max(0, Math.sin(snowWindTime * .52 + .7));
  const wind = (settings.snowWind / 100) ** 1.3 * (2.2 + Math.sin(snowWindTime * .21) * 1.1 + gust * gust * 2.6);
  const canDeposit = snowDrifts?.surfaces.size && !document.body.classList.contains("drawer-open");
  for (const flake of snowflakes) {
    let landed = false;
    if (!stationary) {
      const previousX = flake.x;
      const previousY = flake.y;
      flake.phase += flake.phaseRate * delta;
      flake.y += flake.speed * (1 + Math.sin(flake.phase * .8) * (.08 + flake.depth * .1)) * delta;
      flake.x += (Math.sin(flake.phase) * flake.drift + wind * (.25 + flake.depth * 1.3)) * delta;
      if (flake.depth >= .42) flake.rotation += flake.rotationSpeed * delta;
      if (canDeposit) landed = snowDrifts.deposit(previousX, previousY, flake.y, flake.size, flake.x);
      if (flake.y > height + flake.size) { flake.y = -flake.size; flake.x = Math.random() * width; }
      if (flake.x > width + flake.spriteSide) flake.x = -flake.spriteSide;
      if (flake.x < -flake.spriteSide) flake.x = width + flake.spriteSide;
    }

    const edgeFade = stationary ? 1 : Math.max(0, Math.min(1, (flake.y + flake.size) / 28, (height + flake.size - flake.y) / 36));
    const halfSide = flake.spriteSide / 2;
    snowContext.globalAlpha = flake.alpha * edgeFade;
    if (flake.depth < .42) {
      snowContext.drawImage(flake.sprite, flake.x - halfSide, flake.y - halfSide, flake.spriteSide, flake.spriteSide);
    } else {
      snowContext.save();
      snowContext.translate(flake.x, flake.y);
      snowContext.rotate(flake.rotation + Math.sin(flake.phase) * .18);
      snowContext.drawImage(flake.sprite, -halfSide, -halfSide, flake.spriteSide, flake.spriteSide);
      snowContext.restore();
    }
    if (landed) { flake.y = -flake.spriteSide; flake.x = Math.random() * width; }
  }
  snowContext.globalAlpha = 1;
  snowDrifts?.draw(stationary || document.body?.classList.contains("drawer-open") ? 0 : delta, wind);
}

function animateSnow(timestamp) {
  if (!isSnowEffectActive() || reducedMotion.matches || document.hidden) { snowFrame = 0; snowLastFrame = 0; return; }
  if (snowLastFrame && timestamp - snowLastFrame < 1000 / 60 - 1) {
    snowFrame = requestAnimationFrame(animateSnow);
    return;
  }
  const delta = snowLastFrame ? Math.min((timestamp - snowLastFrame) / 16.67, 2.5) : 1;
  snowLastFrame = timestamp;
  drawSnowflakes(delta);
  snowFrame = requestAnimationFrame(animateSnow);
}

function setSnowEffect(enabled) {
  const canvas = $("#snowCanvas");
  if (!canvas) return;
  if (snowFrame) cancelAnimationFrame(snowFrame);
  snowFrame = 0;
  snowLastFrame = 0;
  if (!enabled) {
    canvas.classList.remove("is-active");
    snowDrifts?.clear();
    snowContext?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    return;
  }
  canvas.classList.add("is-active");
  if (document.hidden) return;
  resizeSnowCanvas();
  if (reducedMotion.matches) drawSnowflakes(0, true);
  else snowFrame = requestAnimationFrame(animateSnow);
}

function initializeSnowEffect() {
  const canvas = $("#snowCanvas");
  snowContext = canvas?.getContext("2d", { alpha: true });
  snowDrifts = new SnowDrifts($("#snowDriftCanvas"));
  document.addEventListener("pointermove", event => {
    if (isSnowEffectActive() && settings.snowAccumulation && !reducedMotion.matches && !document.hidden && !document.body.classList.contains("drawer-open")) snowDrifts.brush(event.clientX, event.clientY, event.timeStamp);
  }, { passive: true });
  document.addEventListener("pointerleave", () => snowDrifts.forgetPointer());
  if (!snowContext) return;
  window.addEventListener("resize", () => {
    if (!isSnowEffectActive() || snowResizeFrame) return;
    snowResizeFrame = requestAnimationFrame(() => {
      snowResizeFrame = 0;
      if (isSnowEffectActive()) resizeSnowCanvas();
    });
  }, { passive: true });
  const onMotionPreferenceChange = () => { renderAppearance(); setSnowEffect(isSnowEffectActive()); };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", onMotionPreferenceChange);
  else reducedMotion.addListener(onMotionPreferenceChange);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (isSnowEffectActive() && !document.hidden && !snowflakes.length) setSnowEffect(true);
  }));
}

function toggleEngineMenu() {
  const existing = $(".engine-menu");
  if (existing) { existing.remove(); return; }
  const menu = el("div", "engine-menu");
  menu.setAttribute("role", "listbox");
  for (const [key, engine] of Object.entries(ENGINES)) {
    const option = el("button", "", "");
    option.type = "button"; option.setAttribute("role", "option"); option.setAttribute("aria-selected", String(settings.engine === key));
    option.append(el("span", "", engine.mark), el("span", "", engine.label));
    if (settings.engine === key) option.append(el("span", "engine-check", "✓"));
    option.addEventListener("click", async () => { settings.engine = key; updateEngineButton(); await saveSettings(); menu.remove(); $("#searchInput").focus(); });
    menu.append(option);
  }
  $(".search-area").append(menu);
}

function startSearch(event) {
  event.preventDefault();
  const query = $("#searchInput").value.trim();
  if (!query) { $("#searchInput").focus(); return; }
  const engine = ENGINES[settings.engine] || ENGINES.google;
  location.href = `${engine.url}${encodeURIComponent(query)}`;
}

function setupEvents() {
  document.addEventListener("pointerdown", event => { if (!event.target.closest("#bookmarkMenu")) closeBookmarkMenu(); });
  $("#searchForm").addEventListener("submit", startSearch);
  $("#engineButton").addEventListener("click", toggleEngineMenu);
  $("#openGeneralSettings").addEventListener("click", () => openDrawer("general"));
  $("#toggleLayoutEdit").addEventListener("click", () => toggleLayoutEditor());
  $("#finishLayoutEdit").addEventListener("click", () => toggleLayoutEditor(false));
  $("#cancelLayoutEdit").addEventListener("click", () => {
    if (layoutEditorSnapshot) Object.assign(settings, structuredClone(layoutEditorSnapshot));
    toggleLayoutEditor(false);
  });
  $("#toggleEditorGrid").addEventListener("click", () => {
    const hidden = document.body.classList.toggle("editor-grid-hidden");
    $("#toggleEditorGrid").setAttribute("aria-pressed", String(!hidden));
  });
  $("#undoLayoutEdit").addEventListener("click", undoLayout);
  $("#resetWidgetLayout").addEventListener("click", () => {
    rememberLayout();
    settings.widgetLayout = JSON.parse(JSON.stringify(WIDGET_LAYOUT_DEFAULTS));
    settings.layoutMode = document.body.classList.contains("layout-editing") ? "custom" : "free";
    renderWidgetLayout();
    saveSettings();
  });
  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; renderWidgetLayout(); });
  }, { passive: true });
  $("#toggleFocusMode").addEventListener("click", () => toggleFocusMode());
  $("#closeFocusMode").addEventListener("click", () => toggleFocusMode(false));
  $("#taskForm").addEventListener("submit", addFocusTask);
  $("#focusNote").addEventListener("input", (event) => {
    settings.focusNote = event.target.value.slice(0, 240);
    clearTimeout(focusNoteSaveTimer);
    focusNoteSaveTimer = setTimeout(() => { focusNoteSaveTimer = 0; saveSettings(); }, 250);
  });
  $("#closeDrawer").addEventListener("click", closeDrawer);
  $("#drawerScrim").addEventListener("click", closeDrawer);
  $("#weatherPanel").addEventListener("cancel", (event) => { event.preventDefault(); toggleWeatherPanel(false); });
  $("#weatherPanel").addEventListener("click", (event) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) toggleWeatherPanel(false);
  });
  $(".weather-card").addEventListener("click", (event) => {
    if (document.body.classList.contains("layout-editing") || document.body.classList.contains("drawer-open")) return;
    if (event.detail > 1) return;
    toggleWeatherPanel();
  });
  document.addEventListener("click", (event) => {
    if (weatherPanelOpen && !event.target.closest("#weatherPanel") && !event.target.closest(".weather-card")) toggleWeatherPanel(false);
  });
  $("#bookmarkGrid").addEventListener("click", (event) => {
    const link = event.target.closest("[data-bookmark-index]");
    if (!link) return;
    if (document.body.classList.contains("layout-editing")) { event.preventDefault(); return; }
    if (!link.getAttribute("href")) { event.preventDefault(); openDrawer("bookmarks"); }
  });
  $("#bookmarkGrid").addEventListener("auxclick", (event) => {
    if (document.body.classList.contains("layout-editing")) event.preventDefault();
  });
  // Клик по подписи под поиском сразу меняет фразу.
  const caption = $("#searchCaption");
  caption.addEventListener("click", () => setCaptionText(pickCaptionIndex()));
  caption.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCaptionText(pickCaptionIndex()); }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-area") && $(".engine-menu")) $(".engine-menu").remove();
  });
  setupWidgetEditor();
  document.addEventListener("pointerdown", () => resetIdleTimer(true), { passive: true });
  document.addEventListener("wheel", () => resetIdleTimer(true), { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      flushPendingSave();
      clearTimeout(idleTimer);
      idleTimer = 0;
      hideIdleClock();
      $("#wallpaperVideo").pause();
      if (snowFrame) cancelAnimationFrame(snowFrame);
      snowFrame = 0;
      snowLastFrame = 0;
      snowDrifts?.forgetPointer();
    } else {
      resetIdleTimer(true);
      scheduleWallpaperVideo();
      updateWeather();
      if (isSnowEffectActive() && !reducedMotion.matches && !snowFrame) snowFrame = requestAnimationFrame(animateSnow);
    }
  });
  window.addEventListener("pagehide", flushPendingSave);
  document.addEventListener("pointermove", (event) => {
    resetIdleTimer();
    if (!settings.parallaxEnabled || reducedMotion.matches || event.pointerType !== "mouse" || document.body.classList.contains("drawer-open")) return;
    if (parallaxFrame) return;
    const x = event.clientX;
    const y = event.clientY;
    parallaxFrame = requestAnimationFrame(() => {
      const offsetX = ((x / window.innerWidth) - 0.5) * -13;
      const offsetY = ((y / window.innerHeight) - 0.5) * -13;
      document.documentElement.style.setProperty("--parallax-x", `${offsetX.toFixed(1)}px`);
      document.documentElement.style.setProperty("--parallax-y", `${offsetY.toFixed(1)}px`);
      parallaxFrame = 0;
    });
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    document.documentElement.style.setProperty("--parallax-x", "0px");
    document.documentElement.style.setProperty("--parallax-y", "0px");
  });
  document.addEventListener("keydown", (event) => {
    resetIdleTimer(true);
    const editingText = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
    if (document.body.classList.contains("layout-editing") && !editingText) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undoLayout(); return; }
      const selected = $(".is-layout-selected");
      if (selected && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault(); rememberLayout();
        const cell = settings.widgetLayout[selected.dataset.layoutItem];
        cell.x = Math.max(1, Math.min(25-cell.w, cell.x + (event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0)));
        cell.y = Math.max(1, Math.min(13-(cell.h || 1), cell.y + (event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0)));
        renderWidgetLayout(); saveSettings(); return;
      }
    }
    if (event.key === "Tab" && document.body.classList.contains("drawer-open")) {
      const controls = [...$("#settingsDrawer").querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter((item) => !item.disabled && item.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (event.key === "Escape") {
      closeBookmarkMenu();
      const hadDrawer = document.body.classList.contains("drawer-open");
      toggleWeatherPanel(false);
      closeDrawer(); $(".engine-menu")?.remove();
      if (document.body.classList.contains("layout-editing")) toggleLayoutEditor(false);
      else if (!hadDrawer && document.body.classList.contains("focus-mode")) toggleFocusMode(false);
    }
    if (event.key === "/" && !event.ctrlKey && !event.metaKey && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      if (settings.hiddenWidgets?.includes("search")) return;
      event.preventDefault(); $("#searchInput").focus();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === ",") { event.preventDefault(); openDrawer("general"); }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === "f" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      toggleFocusMode();
    }
  });
}

async function initializeApp() {
  // Класс снимаем только когда вся волна появления отыграна:
  // последний блок стартует с задержкой .42s и живёт .95s — 1600ms с запасом.
  setTimeout(() => document.body.classList.remove("page-enter"), 1600);
  checkForUpdates(); // статус версии для метки GitHub — не ждём, пусть летит фоном
  await loadSettings();
  renderAppearance();
  revealWhenWallpaperReady();
  setupBookmarkDragAndDrop();
  renderBookmarks();
  updateEngineButton();
  startCaptionRotation();
  updateClock();
  updateWeather();
  $("#focusNote").value = settings.focusNote || "";
  renderFocusTasks();
  setupEvents();
  setupSettingsSync();
  initializeSnowEffect();
  updateTheme();
  resetIdleTimer(true);
  scheduleClockTick();
  setInterval(() => {
    updateTheme();
    const shouldSnow = isSnowEffectActive();
    if ($("#snowCanvas").classList.contains("is-active") !== shouldSnow) setSnowEffect(shouldSnow);
  }, 60 * 1000);
  setInterval(() => { if (!document.hidden) updateWeather(); }, 10 * 60 * 1000);
}

async function init() {
  try { await initializeApp(); } catch (error) { reportInitializationError(error); }
}

function reportInitializationError(error) {
  console.error("yunagi: initialization failed", error);
  document.body.classList.add("assets-ready");
  showToast("Не удалось загрузить часть интерфейса. Попробуй открыть новую вкладку.");
}

init();
