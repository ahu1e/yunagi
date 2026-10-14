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
  units: "celsius",
  timeFormat: "24",
  brightness: 76,
  shade: 27,
  scale: 100,
  position: "center",
  accent: "snow",
  customWallpaper: "",
  customVideo: "",
  hasCustomVideo: false,
  videoEnabled: false,
  parallaxEnabled: false,
  widgetSizes: { weather: 100, bookmarks: 100, date: 100, clock: 100 },
  faviconEnabled: true,
  layoutMode: "free",
  widgetLayout: {
    weather: { x: 1, y: 1, w: 2, h: 0 },
    bookmarks: { x: 1, y: 3, w: 3, h: 0 },
    date: { x: 22, y: 1, w: 2, h: 0 },
    clock: { x: 22, y: 3, w: 2, h: 0 },
    search: { x: 8, y: 10, w: 10, h: 0 }
  },
  clockDisplay: "both",
  showCaption: true,
  seasonalMode: "auto",
  snowEnabled: false,
  snowIntensity: "normal",
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

// Подпись под строкой поиска задаёт тон вкладки — тихий, пассивный, добрый.
// Без приказов («соберись», «дыши медленнее») и без намёков на вину («мир ждёт
// вне экрана»): вкладка не должна ни к чему понуждать, только быть местом,
// куда можно вернуться. Сравнительно короткие фразы — подпись мелкая
// (letter-spacing .16em), длинные начинают переноситься на мобильных.
const SEARCH_CAPTIONS = [
  "ТИШИНА. ТВОЁ ПРОСТРАНСТВО.",
  "СВЕТ ТИХО ПАДАЕТ НА СТЕНЫ.",
  "ЗДЕСЬ НЕ НУЖНО СПЕШИТЬ.",
  "ВСЁ УСПЕЕТСЯ. ЧУТЬ-ЧУТЬ ПОЗЖЕ.",
  "ОДНА МЫСЛЬ. ЭТО ДОСТАТОЧНО.",
  "ГЛАВНОЕ ОДНО. ОСТАЛЬНОЕ ЖДЁТ.",
  "ТЁПЛЫЙ ШУМ ДОМА.",
  "ОКНО СМОТРИТ НА ОСЕНЬ.",
  "ЛЕГКО. ПРОСТО. БЕЗ ЛИШНЕГО.",
  "ПАУЗА ТОЖЕ РАБОТА.",
  "СЕГОДНЯ ДОСТАТОЧНО ОДНОГО ШАГА.",
  "УТРО ЕЩЁ НИКУДА НЕ СПЕШИТ.",
  "ВОЗДУХ ТИХИЙ, СВЕТ МЯГКИЙ.",
  "ЗА ОКНОМ СВОЁ ВРЕМЯ.",
  "ДЕНЬ МЕДЛЕННО НАЧИНАЕТСЯ.",
  "ВСЁ НА СВОИХ МЕСТАХ.",
  "ЧАСЫ ИДУТ РОВНО.",
  "ДОМ ДЕРЖИТ СВОЁ ТЕПЛО.",
  "КОФЕ ОСТЫВАЕТ В ТИШИНЕ.",
  "ПОЛДЕНЬ ПАХНЕТ ТЕСТОМ.",
  "ЛАМПА ГРЕЕТ МЯГКИМ СВЕТОМ.",
  "ОБЛАКА ИДУТ НА СЕВЕР.",
  "ГДЕ-ТО ТОЧНО ИДЁТ ДОЖДЬ.",
  "ТЕНИ МЕДЛЕННО ДВИГАЮТСЯ.",
  "ВЕЧЕР УЖЕ СМОТРИТ В ОКНО.",
  "СЕГОДНЯ НИЧЕГО НЕ ГОРИТ.",
  "ПЫЛЬ СВЕТИТСЯ В ЛУЧЕ СВЕТА.",
  "ПТИЦЫ ГДЕ-ТО РЯДОМ.",
  "ЗДЕСЬ МОЖНО НЕ СТАРАТЬСЯ.",
  "СРОЧНОГО НЕТ. ПОЧТИ НИКОГДА.",
  "УТРО ПАХНЕТ ТЕПЛЫМ ХЛЕБОМ.",
  "СВЕТ ЛЕЖИТ НА СТОЛЕ РОВНО."
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

let settings = { ...DEFAULTS };
let drawerKind = "general";
let toastTimer;
let pendingNavigation;
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

async function loadSettings() {
  try {
    if (globalThis.chrome?.storage?.local) {
      const regularKeys = Object.keys(DEFAULTS).filter((key) => key !== "customVideo");
      const stored = await chrome.storage.local.get(regularKeys);
      settings = { ...DEFAULTS, ...stored, widgetSizes: { ...DEFAULTS.widgetSizes, ...(stored.widgetSizes || {}), date: stored.widgetSizes?.date ?? stored.widgetSizes?.clock ?? DEFAULTS.widgetSizes.date }, widgetLayout: { ...DEFAULTS.widgetLayout, ...(stored.widgetLayout || {}) } };
      if (settings.videoEnabled && settings.hasCustomVideo) {
        const media = await chrome.storage.local.get("customVideo");
        settings.customVideo = media.customVideo || "";
        if (!settings.customVideo) settings.videoEnabled = false;
      }
    } else {
      const stored = JSON.parse(localStorage.getItem("yunagi-settings") || localStorage.getItem("yukinagi-settings") || "{}");
      settings = { ...DEFAULTS, ...stored, widgetSizes: { ...DEFAULTS.widgetSizes, ...(stored.widgetSizes || {}), date: stored.widgetSizes?.date ?? stored.widgetSizes?.clock ?? DEFAULTS.widgetSizes.date }, widgetLayout: { ...DEFAULTS.widgetLayout, ...(stored.widgetLayout || {}) } };
    }
  } catch (error) {
    console.warn("yunagi: using default settings", error);
    settings = { ...DEFAULTS, widgetLayout: { ...DEFAULTS.widgetLayout } };
  }
  migrateWidgetLayout(settings.widgetLayout);
}

// Прежний дефолт держал правый столбец в колонке 22 — колонка 24 оставалась пустой,
// и правый край виджетов не совпадал с отступом слева. Сдвигаем только нетронутый макет.
function migrateWidgetLayout(layout) {
  const dateCell = layout?.date;
  const clockCell = layout?.clock;
  if (!dateCell || !clockCell) return;
  const untouched =
    dateCell.x === 22 && dateCell.w === 2 && dateCell.y === 1 &&
    clockCell.x === 22 && clockCell.w === 2 && clockCell.y === 3;
  if (!untouched) return;
  dateCell.x = 23;
  clockCell.x = 23;
}

async function saveSettings(options = {}) {
  try {
    if (globalThis.chrome?.storage?.local) {
      const storedSettings = { ...settings };
      delete storedSettings.customWallpaper;
      delete storedSettings.customVideo;
      await chrome.storage.local.set(storedSettings);
      if (options?.includeMedia) await chrome.storage.local.set({ customWallpaper: settings.customWallpaper, customVideo: settings.customVideo });
    }
    else localStorage.setItem("yunagi-settings", JSON.stringify(settings));
  } catch (error) {
    console.error("Could not save yunagi settings", error);
    showToast("Не удалось сохранить настройку");
  }
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
  if (!pendingSaveTimer) return;
  clearTimeout(pendingSaveTimer);
  pendingSaveTimer = 0;
  saveSettings();
}

function renderAppearance() {
  const brightness = Number(settings.brightness) || DEFAULTS.brightness;
  const shade = Number(settings.shade) || 0;
  const scale = Number(settings.scale) || 100;
  const parallaxActive = Boolean(settings.parallaxEnabled) && !reducedMotion.matches;
  document.documentElement.style.setProperty("--wallpaper-brightness", String(brightness / 100));
  document.documentElement.style.setProperty("--wallpaper-shade", String(shade / 100));
  document.documentElement.style.setProperty("--wallpaper-scale", String((scale / 100) * (parallaxActive ? 1.025 : 1)));
  updateTheme();
  scheduleWidgetLayout();
  for (const widget of ["weather", "bookmarks", "date", "clock"]) {
    const size = Number(settings.widgetSizes?.[widget]) || 100;
    document.documentElement.style.setProperty(`--widget-${widget}-scale`, String(size / 100));
  }
  updateWallpaperImage();
  scheduleWallpaperVideo();
  applyCaptionVisibility();
  document.body.classList.toggle("parallax-enabled", parallaxActive);
  if (!parallaxActive) {
    document.documentElement.style.setProperty("--parallax-x", "0px");
    document.documentElement.style.setProperty("--parallax-y", "0px");
  }
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
  bookmarks: { x: 1, y: 3, w: 3, h: 0 },
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
  const bookmarkWidthLimit = Math.max(widthFor(1), canvasWidth - 192 * Math.max(widgetScale("date"), widgetScale("clock")) - 16);
  const bookmarkMaxCols = Math.max(1, Math.min(6, columnsFor(bookmarkWidthLimit / bookmarkScale)));
  // Форму блока задаёт пользователь в редакторе раскладки: ширина ячейки (w) — это
  // и есть ширина карточки, а колонки просто влезают в неё. Хочешь список на 6 в
  // высоту — тяни w до одной ячейки; хочешь широкий блок — тяни вправо. Высота
  // всегда по содержимому: добавил сайт — карточка подросла, удалил — сократилась.
  const bookmarkCellWidth = Math.min(bookmarkWidthLimit, Math.max(widthFor(1), (bookmarkWidth / 24) * canvasWidth));
  const bookmarkColumns = mode === "stack"
    ? 3
    : Math.max(1, Math.min(bookmarkMaxCols, columnsFor(bookmarkCellWidth / bookmarkScale), Math.max(1, bookmarkCount)));
  document.documentElement.style.setProperty("--bookmark-columns", String(bookmarkColumns));
  const bookmarkNaturalWidth = Math.max(widthFor(bookmarkColumns), bookmarkCellWidth);
  const positionedItems = [];
  $$('[data-layout-item]').forEach((item) => {
    const key = item.dataset.layoutItem;
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
  $("#leftStack").dataset.layoutMode = mode;
  document.body.classList.toggle("season-halloween", isHalloweenActive());
  $("#layoutEditBar")?.setAttribute("aria-hidden", String(!document.body.classList.contains("layout-editing")));
  $("#toggleLayoutEdit")?.classList.toggle("is-active", document.body.classList.contains("layout-editing"));
}

function isHalloweenActive() {
  if (settings.seasonalMode === "halloween") return true;
  if (settings.seasonalMode !== "auto") return false;
  const now = new Date();
  return (now.getMonth() === 9 && now.getDate() >= 20) || (now.getMonth() === 10 && now.getDate() <= 2);
}

function setLayoutMode(mode) {
  settings.layoutMode = mode;
  if (mode === "stack") {
    settings.widgetLayout.weather = { ...settings.widgetLayout.weather, x: 2, y: 3, h: 0 };
    settings.widgetLayout.bookmarks = { ...settings.widgetLayout.bookmarks, x: 2, y: 5, h: 0 };
  }
  document.body.classList.remove("layout-editing");
  renderWidgetLayout();
  saveSettings();
}

function toggleLayoutEditor(enabled = !document.body.classList.contains("layout-editing")) {
  document.body.classList.toggle("layout-editing", enabled);
  if (enabled) settings.layoutMode = "custom";
  renderWidgetLayout();
  saveSettings();
}

function setupWidgetEditor() {
  $$('[data-layout-item]').forEach((item) => {
    const drag = el("span", "layout-drag-handle", "⠿");
    const resize = el("span", "layout-resize-handle", "↘");
    drag.setAttribute("aria-label", "Перетащить блок");
    resize.setAttribute("aria-label", "Изменить размер блока");
    item.append(drag, resize);
    const start = (event, resizeMode) => {
      if (!document.body.classList.contains("layout-editing") || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const key = item.dataset.layoutItem;
      const rect = item.getBoundingClientRect();
      const initial = { ...settings.widgetLayout[key] };
      const pointerX = event.clientX;
      const pointerY = event.clientY;
      const canvas = $(".canvas");
      const canvasStyle = getComputedStyle(canvas);
      const contentWidth = canvas.clientWidth - parseFloat(canvasStyle.paddingLeft) - parseFloat(canvasStyle.paddingRight);
      const contentHeight = canvas.clientHeight - parseFloat(canvasStyle.paddingTop) - parseFloat(canvasStyle.paddingBottom);
      const col = contentWidth / 24;
      const row = contentHeight / 12;
      item.classList.add("is-layout-active");
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
        if (`${layout.x}:${layout.y}:${layout.w}:${layout.h}` !== before) scheduleWidgetLayout();
      };
      const finish = () => {
        item.classList.remove("is-layout-active");
        document.removeEventListener("pointermove", move);
        saveSettings();
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", finish, { once: true });
    };
    drag.addEventListener("pointerdown", (event) => start(event, false));
    resize.addEventListener("pointerdown", (event) => start(event, true));
  });
}

function updateWallpaperImage() {
  const wallpaper = $(".wallpaper");
  wallpaper.style.backgroundPosition = settings.position || "center";
  const source = settings.customWallpaper;
  if (!source) {
    wallpaperLoadGeneration++;
    wallpaperLoadingSource = "";
    wallpaperLoadingPromise = null;
    if (wallpaperObjectUrl) URL.revokeObjectURL(wallpaperObjectUrl);
    wallpaperObjectUrl = "";
    wallpaperObjectSource = "";
  wallpaper.style.backgroundImage = "url(\"Image.png\")";
    return;
  }
  if (wallpaperObjectSource === source) {
    wallpaper.style.backgroundImage = `url("${wallpaperObjectUrl}")`;
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
    wallpaper.style.backgroundImage = `url("${objectUrl}")`;
  })();
  wallpaperLoadingPromise = loadPromise.catch((error) => showToast(error.message || "Не удалось открыть обои")).finally(() => {
    if (generation === wallpaperLoadGeneration) { wallpaperLoadingSource = ""; wallpaperLoadingPromise = null; }
  });
}

function updateTheme() {
  const now = new Date();
  const halloween = isHalloweenActive();
  document.body.classList.toggle("season-halloween", halloween);
  if (halloween) {
    // Сезонный акцент ставим последним: инлайн-переменная на :root иначе
    // перекрывает правило body.season-halloween из таблицы стилей.
    document.documentElement.dataset.theme = "halloween";
    document.documentElement.style.setProperty("--accent", "#f0c09a");
    document.documentElement.style.setProperty("--glass-edge", "rgba(240, 192, 154, .40)");
    return;
  }
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

function renderBookmarks() {
  const grid = $("#bookmarkGrid");
  grid.replaceChildren();
  const bookmarks = Array.isArray(settings.bookmarks) ? settings.bookmarks : [];
  if (!bookmarks.length) {
    const empty = document.createElement("p");
    empty.className = "empty-bookmarks";
    empty.textContent = "Добавь первый сайт в настройках";
    grid.append(empty);
    scheduleWidgetLayout();
    return;
  }
  bookmarks.slice(0, 24).forEach((bookmark, index) => {
    const button = document.createElement("button");
    button.type = "button";
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
    button.addEventListener("dragstart", (event) => {
      draggedBookmarkIndex = index;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      button.classList.add("is-dragging");
    });
    button.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (draggedBookmarkIndex !== index) button.classList.add("is-drop-target");
    });
    button.addEventListener("dragleave", () => button.classList.remove("is-drop-target"));
    button.addEventListener("drop", async (event) => {
      event.preventDefault();
      const from = Number(event.dataTransfer.getData("text/plain"));
      const to = index;
      if (Number.isInteger(from) && from !== to && settings.bookmarks[from]) {
        const [moved] = settings.bookmarks.splice(from, 1);
        settings.bookmarks.splice(to, 0, moved);
        await saveSettings();
        renderBookmarks();
      }
    });
    button.addEventListener("dragend", () => {
      draggedBookmarkIndex = null;
      $$(".bookmark-item").forEach((item) => item.classList.remove("is-dragging", "is-drop-target"));
    });
    grid.append(button);
  });
  // Блок подстраивается под количество закладок — пересчитываем размер после отрисовки.
  scheduleWidgetLayout();
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

async function updateWeather() {
  const request = ++weatherRequest;
  const city = (settings.city || "Tokyo").trim();
  $("#weatherCity").textContent = city;
  $("#weatherTemp").textContent = "—°";
  $("#weatherIcon").textContent = "☁";
  updateIdleWeather("☁", "Загружаем погоду…", city);
  try {
    const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodeUrl.search = new URLSearchParams({ name: city, count: "1", language: "ru", format: "json" });
    const geo = await fetchWeatherJson(geocodeUrl);
    const place = geo.results?.[0];
    if (!place) throw new Error("Город не найден");
    const forecastUrl = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
    forecastUrl.search = new URLSearchParams({ lat: place.latitude, lon: place.longitude });
    const forecast = await fetchWeatherJson(forecastUrl);
    if (request !== weatherRequest) return;
    const current = forecast.properties?.timeseries?.[0]?.data;
    const tempCelsius = current?.instant?.details?.air_temperature;
    if (typeof tempCelsius !== "number") throw new Error("В ответе сервиса нет температуры");
    const symbol = current.next_1_hours?.summary?.symbol_code || current.next_6_hours?.summary?.symbol_code || current.next_12_hours?.summary?.symbol_code;
    const [icon, description] = weatherPresentation(symbol);
    const temperature = settings.units === "fahrenheit" ? Math.round(tempCelsius * 9 / 5 + 32) : Math.round(tempCelsius);
    $("#weatherIcon").textContent = icon;
    $("#weatherTemp").textContent = `${temperature}°`;
    $("#weatherCity").textContent = place.name;
    $(".weather-card").setAttribute("aria-label", `${description}, ${temperature} градусов в городе ${place.name}. Нажми, чтобы увидеть прогноз, дважды — чтобы настроить`);
    updateIdleWeather(icon, `${temperature}° · ${place.name}`, description);
    storeWeatherDetails({ place: place.name, tempCelsius, current, timeseries: forecast.properties?.timeseries || [] });
  } catch (error) {
    if (request !== weatherRequest) return;
    $("#weatherIcon").textContent = "☁";
    $("#weatherTemp").textContent = "—°";
    $("#weatherCity").textContent = city;
    $(".weather-card").title = "Не удалось загрузить погоду. Нажмите дважды, чтобы проверить город.";
    updateIdleWeather("☁", `Погода недоступна · ${city}`, "Погода недоступна");
    console.info("yunagi weather:", error.message);
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
  if (weatherPanelOpen) renderWeatherPanel();
}

function renderWeatherPanel() {
  const panel = $("#weatherPanel");
  panel.replaceChildren();
  if (!weatherDetails) {
    panel.append(el("p", "weather-panel-empty", "Прогноз пока недоступен"));
    return;
  }
  const head = el("div", "weather-panel-head");
  head.append(el("span", "weather-panel-place", weatherDetails.place), el("span", "weather-panel-now", `сейчас ${weatherDetails.temp}`));
  panel.append(head);
  const stats = el("div", "weather-panel-stats");
  [["Ощущается", weatherDetails.feelsLike], ["Ветер", weatherDetails.wind], ["Влажность", weatherDetails.humidity]].forEach(([label, value]) => {
    const stat = el("span", "weather-panel-stat");
    stat.append(el("span", "weather-panel-stat-label", label), el("span", "weather-panel-stat-value", value));
    stats.append(stat);
  });
  panel.append(stats);
  if (weatherDetails.hours.length) {
    const hours = el("div", "weather-panel-hours");
    weatherDetails.hours.forEach((hour) => {
      const row = el("span", "weather-panel-hour");
      row.append(el("span", "weather-panel-hour-time", hour.label), el("span", "weather-panel-hour-icon", hour.icon), el("span", "weather-panel-hour-temp", hour.temp));
      row.title = hour.description;
      hours.append(row);
    });
    panel.append(hours);
  }
}

// Панель раскрывается от карточки и не должна уезжать за край экрана.
function positionWeatherPanel() {
  const panel = $("#weatherPanel");
  const card = $(".weather-card");
  const rect = card.getBoundingClientRect();
  const panelWidth = panel.offsetWidth || 260;
  const panelHeight = panel.offsetHeight || 160;
  let left = rect.left;
  let top = rect.bottom + 10;
  if (left + panelWidth > window.innerWidth - 12) left = window.innerWidth - panelWidth - 12;
  if (top + panelHeight > window.innerHeight - 12) top = Math.max(12, rect.top - panelHeight - 10);
  panel.style.left = `${Math.max(12, left)}px`;
  panel.style.top = `${top}px`;
}

function toggleWeatherPanel(force) {
  const panel = $("#weatherPanel");
  const next = typeof force === "boolean" ? force : !weatherPanelOpen;
  if (next === weatherPanelOpen) return;
  weatherPanelOpen = next;
  if (weatherPanelOpen) {
    renderWeatherPanel();
    panel.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => { panel.classList.add("is-open"); positionWeatherPanel(); });
  } else {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
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
  $("#idleWeatherIcon").textContent = icon;
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
  if (!settings.idleClockDelay || document.hidden || document.body.classList.contains("focus-mode") || document.body.classList.contains("drawer-open")) return;
  lastIdleResetAt = now;
  idleTimer = setTimeout(() => {
    if (document.hidden || document.body.classList.contains("focus-mode") || document.body.classList.contains("drawer-open")) return;
    document.body.classList.add("idle-mode");
    $("#idleOverlay").setAttribute("aria-hidden", "false");
  }, Number(settings.idleClockDelay) * 1000);
}

function toggleFocusMode(force) {
  const enabled = force ?? !document.body.classList.contains("focus-mode");
  document.body.classList.toggle("focus-mode", enabled);
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

function openDrawer(kind = "general") {
  clearTimeout(idleTimer);
  idleTimer = 0;
  hideIdleClock();
  drawerKind = kind;
  renderDrawer();
  document.body.classList.add("drawer-open");
  $("#settingsDrawer").setAttribute("aria-hidden", "false");
  setTimeout(() => $("#closeDrawer").focus(), 60);
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
  $("#settingsDrawer").setAttribute("aria-hidden", "true");
  resetIdleTimer(true);
}

function renderDrawer() {
  const content = $("#drawerContent");
  content.replaceChildren();
  if (drawerKind === "weather") renderWeatherSettings(content);
  else if (drawerKind === "clock") renderClockSettings(content);
  else if (drawerKind === "bookmarks") renderBookmarkSettings(content);
  else renderGeneralSettings(content);
  const generalButton = el("button", "drawer-button", drawerKind === "general" ? "Готово" : "⚙  Все настройки");
  generalButton.type = "button";
  generalButton.addEventListener("click", () => drawerKind === "general" ? closeDrawer() : openDrawer("general"));
  const footer = el("div", "button-row");
  footer.append(generalButton);
  if (drawerKind !== "general") {
    const done = el("button", "drawer-button primary", "Готово");
    done.type = "button";
    done.addEventListener("click", closeDrawer);
    footer.append(done);
  }
  content.append(footer);
}

function renderGeneralSettings(content) {
  content.append(...drawerHeading("Твоё пространство", "Настрой новую вкладку так, чтобы она ощущалась именно твоей."));

  const visual = makeSection("ФОН И АТМОСФЕРА");
  const brightness = document.createElement("input");
  brightness.type = "range"; brightness.min = "35"; brightness.max = "120"; brightness.value = String(settings.brightness);
  const brightnessValue = el("span", "setting-value", `${settings.brightness}%`);
  brightness.addEventListener("input", () => { settings.brightness = Number(brightness.value); brightnessValue.textContent = `${brightness.value}%`; renderAppearance(); scheduleSaveSettings(); });
  const brightnessControl = el("span", "setting-control"); brightnessControl.append(brightness, brightnessValue);
  const brightnessRow = makeRow("Яркость", "Настрой читаемость фонового изображения.", document.createElement("span"));
  brightnessRow.lastElementChild.replaceWith(brightnessControl);
  visual.append(brightnessRow);

  const shade = document.createElement("input");
  shade.type = "range"; shade.min = "0"; shade.max = "60"; shade.value = String(settings.shade);
  const shadeValue = el("span", "setting-value", `${settings.shade}%`);
  shade.addEventListener("input", () => { settings.shade = Number(shade.value); shadeValue.textContent = `${shade.value}%`; renderAppearance(); scheduleSaveSettings(); });
  const shadeControl = el("span", "setting-control"); shadeControl.append(shade, shadeValue);
  const shadeRow = makeRow("Затемнение", "Мягкая вуаль для контраста виджетов.", document.createElement("span"));
  shadeRow.lastElementChild.replaceWith(shadeControl);
  visual.append(shadeRow);

  const scale = document.createElement("input");
  scale.type = "range"; scale.min = "85"; scale.max = "130"; scale.value = String(settings.scale);
  const scaleValue = el("span", "setting-value", `${settings.scale}%`);
  scale.addEventListener("input", () => { settings.scale = Number(scale.value); scaleValue.textContent = `${scale.value}%`; renderAppearance(); scheduleSaveSettings(); });
  const scaleControl = el("span", "setting-control"); scaleControl.append(scale, scaleValue);
  const scaleRow = makeRow("Масштаб", "Подстрой кадрирование обоев.", document.createElement("span"));
  scaleRow.lastElementChild.replaceWith(scaleControl);
  visual.append(scaleRow);

  const position = makeSelect([["center", "По центру"], ["center 35%", "Выше"], ["center 65%", "Ниже"], ["left center", "Слева"], ["right center", "Справа"]], settings.position);
  position.addEventListener("change", () => { settings.position = position.value; renderAppearance(); saveSettings(); });
  visual.append(makeRow("Положение", "Точка фокуса фонового изображения.", position));

  const halloweenMode = makeSelect([["off", "Без спецэффектов"], ["halloween", "Хэллоуин · тыквы и янтарный свет"], ["auto", "Автоматически в сезон"]], settings.seasonalMode || "off");
  halloweenMode.addEventListener("change", async () => { settings.seasonalMode = halloweenMode.value; renderWidgetLayout(); await saveSettings(); });
  visual.append(makeRow("Сезонный прикол", "Хэллоуин автоматически включается с 20 октября по 2 ноября.", halloweenMode));

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
      settings.customWallpaper = String(reader.result);
      renderAppearance(); await saveSettings({ includeMedia: true }); showToast("Новые обои установлены");
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

  const intensity = makeSelect([["soft", "Редкий"], ["normal", "Обычный"], ["dense", "Плотный"]], settings.snowIntensity);
  intensity.disabled = !isSnowEffectActive();
  intensity.addEventListener("change", async () => {
    settings.snowIntensity = intensity.value;
    await saveSettings();
    if (isSnowEffectActive()) setSnowEffect(true);
  });
  seasonal.append(makeRow("Интенсивность", "Частота и количество снежинок.", intensity));
  seasonal.append(el("p", "setting-help", "Эффект работает только в новой вкладке, не использует сеть и автоматически становится статичным при включённом в системе уменьшении анимации."));
  snowToggle.addEventListener("change", async () => {
    settings.snowEnabled = snowToggle.checked;
    intensity.disabled = !isSnowEffectActive();
    await saveSettings();
    setSnowEffect(isSnowEffectActive());
  });
  const snowSchedule = makeToggle(settings.snowSchedule, "Автоматически включать снег зимой");
  snowSchedule.input.addEventListener("change", async () => {
    settings.snowSchedule = snowSchedule.input.checked;
    intensity.disabled = !isSnowEffectActive();
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
  privacy.append(el("p", "setting-help", "Настройки и собственные обои остаются в хранилище Chrome. Для погоды yunagi запрашивает прогноз Open-Meteo по выбранному городу — геолокация не используется."));
  content.append(privacy);
}

async function exportSettingsBackup() {
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
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
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
  const clamp = (value, min, max, fallback) => Math.max(min, Math.min(max, Number(value) || fallback));
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
    units: input.units === "fahrenheit" ? "fahrenheit" : "celsius",
    timeFormat: input.timeFormat === "12" ? "12" : "24",
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
    seasonalMode: ["off", "halloween", "auto"].includes(input.seasonalMode) ? input.seasonalMode : DEFAULTS.seasonalMode,
    brightness: clamp(input.brightness, 35, 120, DEFAULTS.brightness),
    shade: clamp(input.shade, 0, 60, DEFAULTS.shade),
    scale: clamp(input.scale, 85, 130, DEFAULTS.scale),
    position: positionOptions.includes(input.position) ? input.position : DEFAULTS.position,
    accent: accents.includes(input.accent) ? input.accent : DEFAULTS.accent,
    themeMode: themes.includes(input.themeMode) ? input.themeMode : "manual",
    idleClockDelay: [0, 30, 60, 120, 300, 600].includes(Number(input.idleClockDelay)) ? Number(input.idleClockDelay) : DEFAULTS.idleClockDelay,
    customWallpaper: image,
    customVideo: video,
    hasCustomVideo: Boolean(video),
    videoEnabled: Boolean(input.videoEnabled && video),
    parallaxEnabled: Boolean(input.parallaxEnabled),
    faviconEnabled: input.faviconEnabled !== false,
    widgetSizes: {
      weather: clamp(sizes.weather, 75, 140, 100),
      bookmarks: clamp(sizes.bookmarks, 75, 140, 100),
      date: clamp(sizes.date, 75, 140, clamp(sizes.clock, 75, 140, 100)),
      clock: clamp(sizes.clock, 75, 140, 100)
    },
    snowEnabled: Boolean(input.snowEnabled),
    snowSchedule: Boolean(input.snowSchedule),
    snowIntensity: ["soft", "normal", "dense"].includes(input.snowIntensity) ? input.snowIntensity : "normal",
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
      settings = normalizeImportedSettings(parsed.settings);
      await saveSettings({ includeMedia: true });
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

function renderWeatherSettings(content) {
  content.append(...drawerHeading("Небо сегодня", "Погода загружается для указанного города. Геолокация не нужна."));
  const section = makeSection("ПОГОДА");
  const city = document.createElement("input"); city.type = "text"; city.value = settings.city; city.placeholder = "Например, Токио"; city.maxLength = 70;
  city.addEventListener("change", async () => { settings.city = city.value.trim() || DEFAULTS.city; city.value = settings.city; await saveSettings(); updateWeather(); });
  section.append(makeRow("Город", "Название города на любом языке.", city));
  const units = makeSelect([["celsius", "Цельсий · °C"], ["fahrenheit", "Фаренгейт · °F"]], settings.units);
  units.addEventListener("change", async () => { settings.units = units.value; await saveSettings(); updateWeather(); });
  section.append(makeRow("Единицы", "Температура в виджете.", units));
  const refresh = el("button", "drawer-button", "↻  Обновить погоду"); refresh.type = "button"; refresh.addEventListener("click", updateWeather);
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
  section.append(makeRow("Расположение", "В режиме колонки погода и каждый сайт идут отдельной строкой.", layoutMode));
  const favicons = makeToggle(settings.faviconEnabled !== false, "Показывать иконки сайтов");
  favicons.input.addEventListener("change", async () => {
    settings.faviconEnabled = favicons.input.checked;
    renderBookmarks();
    await saveSettings();
  });
  section.append(makeRow("Иконки сайтов", "Фавикон с сайта вместо буквы. Свой символ или картинка всегда важнее.", favicons.label));
  const editLayout = el("button", "drawer-button", "⌗  Растянуть и расставить по сетке");
  editLayout.type = "button";
  editLayout.addEventListener("click", () => { closeDrawer(); toggleLayoutEditor(true); });
  section.append(editLayout);
  const list = el("div", "bookmark-edit-list");
  const bookmarks = Array.isArray(settings.bookmarks) ? settings.bookmarks : [];
  if (!bookmarks.length) list.append(el("p", "empty-bookmarks", "Здесь пока тихо. Добавь первый сайт."));
  bookmarks.forEach((bookmark, index) => {
    const editItem = el("div", "bookmark-edit-item");
    const row = el("div", "bookmark-edit-row");
    const name = document.createElement("input"); name.type = "text"; name.value = bookmark.name || ""; name.placeholder = "Название"; name.maxLength = 24; name.setAttribute("aria-label", "Название закладки");
    const url = document.createElement("input"); url.type = "url"; url.value = bookmark.url || ""; url.placeholder = "https://…"; url.setAttribute("aria-label", "Адрес закладки");
    const remove = el("button", "remove-bookmark", "×"); remove.type = "button"; remove.setAttribute("aria-label", `Удалить ${bookmark.name || "закладку"}`);
    const customize = el("div", "bookmark-edit-tools");
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
        catch { showToast("Проверь адрес сайта"); return; }
      }
      const oldIcon = settings.bookmarks[index].icon || "";
      const nextIcon = replaceIcon ? icon.value.trim() : oldIcon.startsWith("data:image/") ? oldIcon : icon.value.trim();
      settings.bookmarks[index] = { ...settings.bookmarks[index], name: name.value.trim() || "Сайт", url: nextUrl, color: color.value, icon: nextIcon };
      url.value = nextUrl;
      renderBookmarks(); await saveSettings();
    };
    name.addEventListener("change", () => commit()); url.addEventListener("change", () => commit());
    icon.addEventListener("change", () => commit(true)); color.addEventListener("change", () => commit());
    uploadIcon.addEventListener("change", () => {
      const file = uploadIcon.files?.[0];
      if (!file) return;
      if (file.size > 256 * 1024) { showToast("Иконка должна быть меньше 256 КБ"); uploadIcon.value = ""; return; }
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { showToast("Поддерживаются PNG, JPG и WebP"); uploadIcon.value = ""; return; }
      const reader = new FileReader();
      reader.onload = async () => {
        settings.bookmarks[index].icon = String(reader.result);
        icon.value = "";
        renderBookmarks();
        await saveSettings();
        showToast("Иконка обновлена");
      };
      reader.readAsDataURL(file);
    });
    resetIcon.addEventListener("click", async () => {
      settings.bookmarks[index].icon = "";
      icon.value = "";
      renderBookmarks();
      await saveSettings();
    });
    remove.addEventListener("click", async () => { settings.bookmarks.splice(index, 1); renderBookmarks(); renderDrawer(); await saveSettings(); });
    const moveUp = el("button", "bookmark-tool-button", "↑"); moveUp.type = "button"; moveUp.title = "Переместить выше"; moveUp.disabled = index === 0;
    const moveDown = el("button", "bookmark-tool-button", "↓"); moveDown.type = "button"; moveDown.title = "Переместить ниже"; moveDown.disabled = index === bookmarks.length - 1;
    const move = async (direction) => {
      const target = index + direction;
      if (target < 0 || target >= settings.bookmarks.length) return;
      [settings.bookmarks[index], settings.bookmarks[target]] = [settings.bookmarks[target], settings.bookmarks[index]];
      await saveSettings(); renderBookmarks(); renderDrawer();
    };
    moveUp.addEventListener("click", () => move(-1)); moveDown.addEventListener("click", () => move(1));
    customize.append(icon, color, uploadButton, resetIcon, moveUp, moveDown, uploadIcon);
    row.append(name, url, remove);
    editItem.append(row, customize);
    list.append(editItem);
  });
  section.append(list);
  const add = el("button", "drawer-button", "＋  Добавить сайт"); add.type = "button";
  add.disabled = bookmarks.length >= 24;
  add.addEventListener("click", async () => {
    if (settings.bookmarks.length >= 24) return;
    settings.bookmarks.push({ name: "Новый сайт", url: "", color: "#667a82" });
    await saveSettings(); renderBookmarks(); renderDrawer();
    const inputs = $$(".bookmark-edit-row input", $("#drawerContent")); inputs.at(-2)?.focus(); inputs.at(-2)?.select();
  });
  const actions = el("div", "button-row"); actions.append(add);
  section.append(actions);
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
    renderAppearance();
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
// Ветки гоняем обе (релизы живут в main, разработка — в dev), результат
// кэшируем, чтобы новая вкладка не дёргала сеть каждый раз.
const UPDATE_BRANCHES = ["main", "dev"];
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
    const response = await fetch(`https://raw.githubusercontent.com/ahu1e/yunagi/${branch}/manifest.json`, { cache: "no-cache" });
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

function createSnowflakeSprite(size, crystalline, variant) {
  const spriteSize = snowSpriteSize(size);
  const cacheKey = `${crystalline ? "crystal" : "soft"}-${spriteSize}-${variant}`;
  const cached = snowSpriteCache.get(cacheKey);
  if (cached) return cached;

  const padding = 3;
  const side = spriteSize + padding * 2;
  const ratio = 2;
  const sprite = document.createElement("canvas");
  sprite.width = Math.ceil(side * ratio);
  sprite.height = Math.ceil(side * ratio);
  const context = sprite.getContext("2d");
  if (!context) return sprite;
  context.scale(ratio, ratio);

  const center = side / 2;
  const radius = spriteSize * 0.43;
  const glow = context.createRadialGradient(center, center, 0, center, center, spriteSize * 0.72);
  glow.addColorStop(0, "rgba(255,255,255,.32)");
  glow.addColorStop(.3, "rgba(226,240,255,.13)");
  glow.addColorStop(1, "rgba(226,240,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, side, side);

  if (crystalline) {
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "rgba(244, 250, 255, .78)";
    context.lineWidth = Math.max(.32, spriteSize * .045);
    context.shadowColor = "rgba(216, 236, 255, .9)";
    context.shadowBlur = spriteSize * .15;

    for (let arm = 0; arm < 6; arm++) {
      const angle = arm * Math.PI / 3;
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const tip = radius * (.88 + Math.random() * .12);
      context.beginPath();
      context.moveTo(center - ux * radius * .13, center - uy * radius * .13);
      context.lineTo(center + ux * tip, center + uy * tip);
      context.stroke();

      for (const position of [.38, .59, .77]) {
        const branchLength = radius * (.27 - position * .1) * (.78 + Math.random() * .4);
        const branchX = center + ux * radius * position;
        const branchY = center + uy * radius * position;
        for (const sideSign of [-1, 1]) {
          const branchAngle = angle + sideSign * (.76 + Math.random() * .16);
          const endX = branchX + Math.cos(branchAngle) * branchLength;
          const endY = branchY + Math.sin(branchAngle) * branchLength;
          context.beginPath();
          context.moveTo(branchX, branchY);
          context.lineTo(endX, endY);
          context.stroke();
          context.beginPath();
          context.moveTo(branchX + (endX - branchX) * .48, branchY + (endY - branchY) * .48);
          context.lineTo(branchX + Math.cos(branchAngle + sideSign * .85) * branchLength * .47, branchY + Math.sin(branchAngle + sideSign * .85) * branchLength * .47);
          context.stroke();
        }
      }
    }

    const core = context.createRadialGradient(center - radius * .1, center - radius * .1, 0, center, center, radius * .24);
    core.addColorStop(0, "rgba(255,255,255,.98)");
    core.addColorStop(1, "rgba(211,232,255,.62)");
    context.fillStyle = core;
    context.beginPath();
    context.arc(center, center, Math.max(.45, radius * .16), 0, Math.PI * 2);
    context.fill();

    // Fine ice-grain catches light and keeps the crystals from reading as flat glyphs.
    context.shadowBlur = 0;
    for (let grain = 0; grain < Math.round(spriteSize * 2.2); grain++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * .9;
      const grainSize = .12 + Math.random() * .28;
      context.fillStyle = `rgba(255,255,255,${.18 + Math.random() * .48})`;
      context.beginPath();
      context.arc(center + Math.cos(angle) * distance, center + Math.sin(angle) * distance, grainSize, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  } else {
    // Near flakes catch the light as soft, imperfect clusters rather than sharp stars.
    for (let grain = 0; grain < 9; grain++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.pow(Math.random(), 1.7) * radius * .55;
      const grainSize = .25 + Math.random() * Math.max(.45, spriteSize * .095);
      const x = center + Math.cos(angle) * distance;
      const y = center + Math.sin(angle) * distance;
      const particle = context.createRadialGradient(x, y, 0, x, y, grainSize * 2.8);
      particle.addColorStop(0, "rgba(255,255,255,.8)");
      particle.addColorStop(.45, "rgba(237,246,255,.34)");
      particle.addColorStop(1, "rgba(237,246,255,0)");
      context.fillStyle = particle;
      context.fillRect(x - grainSize * 3, y - grainSize * 3, grainSize * 6, grainSize * 6);
    }
  }

  snowSpriteCache.set(cacheKey, sprite);
  return sprite;
}

function createSnowflakes() {
  if (!snowContext) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const density = { soft: 0.55, normal: 0.9, dense: 1.3 }[settings.snowIntensity] || 0.9;
  const count = Math.min(150, Math.max(22, Math.round((width * height / 13000) * density)));
  snowflakes = Array.from({ length: count }, () => {
    const size = 1.5 + Math.pow(Math.random(), 1.8) * 11.5;
    const crystalline = size > 5 && Math.random() < .7;
    const variant = Math.floor(Math.random() * 6);
    const spriteSize = snowSpriteSize(size);
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      sprite: createSnowflakeSprite(size, crystalline, variant),
      spriteSide: (spriteSize + 6) * (size / spriteSize),
      speed: .16 + size / 12 * .5 + Math.random() * .25,
      drift: .08 + Math.random() * .36 + size / 40,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - .5) * .012,
      alpha: .24 + Math.random() * .5
    };
  });
}

function resizeSnowCanvas() {
  const canvas = $("#snowCanvas");
  if (!canvas || !snowContext) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);
  snowContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  createSnowflakes();
  if (isSnowEffectActive() && reducedMotion.matches) drawSnowflakes(0, true);
}

function drawSnowflakes(delta, stationary = false) {
  if (!snowContext) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  snowContext.clearRect(0, 0, width, height);
  for (const flake of snowflakes) {
    if (!stationary) {
      flake.phase += 0.009 * delta;
      flake.y += flake.speed * delta;
      flake.x += (Math.sin(flake.phase) * flake.drift + 0.035) * delta;
      flake.rotation += flake.rotationSpeed * delta;
      if (flake.y > height + flake.size) { flake.y = -flake.size; flake.x = Math.random() * width; }
      if (flake.x > width + flake.size) flake.x = -flake.size;
    }

    snowContext.save();
    snowContext.translate(flake.x, flake.y);
    snowContext.rotate(flake.rotation);
    snowContext.globalAlpha = flake.alpha;
    snowContext.drawImage(flake.sprite, -flake.spriteSide / 2, -flake.spriteSide / 2, flake.spriteSide, flake.spriteSide);
    snowContext.restore();
  }
}

function animateSnow(timestamp) {
  if (!isSnowEffectActive() || reducedMotion.matches || document.hidden) { snowFrame = 0; snowLastFrame = 0; return; }
  if (snowLastFrame && timestamp - snowLastFrame < 1000 / 30) {
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
  $("#searchForm").addEventListener("submit", startSearch);
  $("#engineButton").addEventListener("click", toggleEngineMenu);
  $("#openGeneralSettings").addEventListener("click", () => openDrawer("general"));
  $("#toggleLayoutEdit").addEventListener("click", () => toggleLayoutEditor());
  $("#finishLayoutEdit").addEventListener("click", () => toggleLayoutEditor(false));
  $("#resetWidgetLayout").addEventListener("click", () => {
    settings.widgetLayout = JSON.parse(JSON.stringify(WIDGET_LAYOUT_DEFAULTS));
    settings.layoutMode = "free";
    renderWidgetLayout();
    saveSettings();
  });
  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; renderWidgetLayout(); });
  }, { passive: true });
  $("#toggleFocusMode").addEventListener("click", () => toggleFocusMode());
  $("#taskForm").addEventListener("submit", addFocusTask);
  $("#focusNote").addEventListener("input", (event) => {
    settings.focusNote = event.target.value.slice(0, 240);
    clearTimeout(focusNoteSaveTimer);
    focusNoteSaveTimer = setTimeout(saveSettings, 250);
  });
  $("#closeDrawer").addEventListener("click", closeDrawer);
  $("#drawerScrim").addEventListener("click", closeDrawer);
  $$('[data-open-settings]').forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); openDrawer(button.dataset.openSettings); }));
  $$(".widget[data-widget]").forEach((widget) => {
    widget.addEventListener("dblclick", (event) => { if (document.body.classList.contains("layout-editing")) return; clearTimeout(pendingNavigation); event.preventDefault(); if (widget.dataset.widget === "weather") toggleWeatherPanel(false); openDrawer(widget.dataset.widget); });
    widget.addEventListener("keydown", (event) => { if (event.key === "Enter" && !document.body.classList.contains("layout-editing")) openDrawer(widget.dataset.widget); });
  });
  // Клик по погоде раскрывает прогноз на ближайшие часы. Двойной клик всё равно
  // откроет настройки (см. выше), поэтому панель просто закрывается перед этим.
  $(".weather-card").addEventListener("click", (event) => {
    if (document.body.classList.contains("layout-editing") || document.body.classList.contains("drawer-open")) return;
    if (event.detail > 1) return;
    pendingNavigation = setTimeout(() => toggleWeatherPanel(), 220);
  });
  document.addEventListener("click", (event) => {
    if (weatherPanelOpen && !event.target.closest("#weatherPanel") && !event.target.closest(".weather-card")) toggleWeatherPanel(false);
  });
  $("#bookmarkGrid").addEventListener("click", (event) => {
    if (document.body.classList.contains("layout-editing")) return;
    const button = event.target.closest("[data-bookmark-index]");
    if (!button) return;
    clearTimeout(pendingNavigation);
    const bookmark = settings.bookmarks[Number(button.dataset.bookmarkIndex)];
    if (!bookmark?.url) { openDrawer("bookmarks"); return; }
    pendingNavigation = setTimeout(() => {
      let url = bookmark.url.trim();
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      try { if (/^https?:$/.test(new URL(url).protocol)) location.href = url; }
      catch { showToast("Проверь адрес закладки в настройках"); }
    }, 240);
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
      if (snowFrame) cancelAnimationFrame(snowFrame);
      snowFrame = 0;
      snowLastFrame = 0;
    } else {
      resetIdleTimer(true);
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
    if (event.key === "Escape") {
      const hadDrawer = document.body.classList.contains("drawer-open");
      toggleWeatherPanel(false);
      closeDrawer(); $(".engine-menu")?.remove();
      if (document.body.classList.contains("layout-editing")) toggleLayoutEditor(false);
      else if (!hadDrawer && document.body.classList.contains("focus-mode")) toggleFocusMode(false);
    }
    if (event.key === "/" && !event.ctrlKey && !event.metaKey && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault(); $("#searchInput").focus();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === ",") { event.preventDefault(); openDrawer("general"); }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === "f" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      toggleFocusMode();
    }
  });
}

async function init() {
  // Класс снимаем только когда вся волна появления отыграна:
  // последний блок стартует с задержкой .42s и живёт .95s — 1600ms с запасом.
  setTimeout(() => document.body.classList.remove("page-enter"), 1600);
  checkForUpdates(); // статус версии для метки GitHub — не ждём, пусть летит фоном
  await loadSettings();
  renderAppearance();
  revealWhenWallpaperReady();
  renderBookmarks();
  updateEngineButton();
  startCaptionRotation();
  updateClock();
  updateWeather();
  $("#focusNote").value = settings.focusNote || "";
  renderFocusTasks();
  setupEvents();
  initializeSnowEffect();
  updateTheme();
  resetIdleTimer(true);
  scheduleClockTick();
  setInterval(() => {
    updateTheme();
    const shouldSnow = isSnowEffectActive();
    if ($("#snowCanvas").classList.contains("is-active") !== shouldSnow) setSnowEffect(shouldSnow);
    document.body.classList.toggle("season-halloween", isHalloweenActive());
  }, 60 * 1000);
  setInterval(updateWeather, 10 * 60 * 1000);
}

init();
