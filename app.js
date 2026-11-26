(() => {
  "use strict";

  const PLACES = window.HIKING_PLACES || [];
  const MODELS = window.WEATHER_MODELS || {};
  const PROVIDERS = window.WEATHER_PROVIDERS || [];
  const STATIC_MODE = Boolean(window.HIKING_STATIC_MODE);
  const FREE_PROVIDER_IDS = new Set([
    "open-meteo",
    "seniverse",
    "7timer",
    "met-no",
    "wttr",
    "weatherapi",
    "visual-crossing",
    "weatherbit"
  ]);
  const KEYED_PROVIDER_IDS = new Set(["seniverse", "weatherapi", "visual-crossing", "weatherbit"]);
  const root = document.getElementById("app");

  const RISK = {
    good: { label: "适合", className: "risk-good", color: "#2b765d", copy: "降雨与风都在相对舒适区。" },
    fair: { label: "可去", className: "risk-fair", color: "#356d83", copy: "有一项天气指标需要额外准备。" },
    caution: { label: "谨慎", className: "risk-caution", color: "#a66c19", copy: "出发前应再看临近回波和实时预警。" },
    unsafe: { label: "不建议", className: "risk-unsafe", color: "#a74436", copy: "存在明确的天气否决项。" }
  };

  const INITIAL_SELECTED = readStorage("trailweather.selected", PLACES[0]?.id || "");
  const INITIAL_STARRED = readStorage("trailweather.starred", []);
  const INITIAL_SIDEBAR_COLLAPSED = readStorage("trailweather.sidebarCollapsed", false);

  const state = {
    selectedId: INITIAL_SELECTED,
    starred: new Set(Array.isArray(INITIAL_STARRED) ? INITIAL_STARRED : []),
    city: "全部",
    search: "",
    sidebarCollapsed: Boolean(INITIAL_SIDEBAR_COLLAPSED),
    activeDay: 0,
    showAllSources: false,
    weather: null,
    loading: true,
    error: null,
    providerDrawerOpen: false,
    providerSearch: "",
    providerStatus: {},
    sidebarOpen: false,
    toast: "",
    requestController: null
  };

  let toastTimer = null;

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in a private preview; the UI still works for this session.
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function median(values) {
    const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    if (!clean.length) return null;
    const middle = Math.floor(clean.length / 2);
    return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
  }

  function spread(values) {
    const clean = values.filter((value) => Number.isFinite(value));
    return clean.length > 1 ? Math.max(...clean) - Math.min(...clean) : null;
  }

  function round(value, digits = 0) {
    if (!Number.isFinite(value)) return null;
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function formatMetric(value, suffix = "", digits = 0) {
    if (!Number.isFinite(value)) return "—";
    return `${round(value, digits)}${suffix}`;
  }

  function localIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDateOnly(dateString) {
    return new Date(`${dateString}T12:00:00+08:00`);
  }

  function formatWeekday(dateString) {
    return new Intl.DateTimeFormat("zh-CN", {
      weekday: "short",
      timeZone: "Asia/Shanghai"
    }).format(parseDateOnly(dateString));
  }

  function formatMonthDay(dateString) {
    const date = parseDateOnly(dateString);
    return {
      day: String(date.getDate()).padStart(2, "0"),
      month: `${date.getMonth() + 1}月`
    };
  }

  function weatherLabel(code) {
    if (!Number.isFinite(code)) return "数据缺失";
    if (code === 0) return "晴";
    if (code === 1) return "晴间多云";
    if (code === 2) return "多云";
    if (code === 3) return "阴";
    if (code === 45 || code === 48) return "有雾";
    if (code >= 51 && code <= 57) return "毛毛雨";
    if (code === 61) return "小雨";
    if (code === 63) return "中雨";
    if (code === 65) return "大雨";
    if (code === 66 || code === 67) return "冻雨";
    if (code >= 71 && code <= 77) return "降雪";
    if (code === 80) return "小阵雨";
    if (code === 81) return "阵雨";
    if (code === 82) return "强阵雨";
    if (code === 85 || code === 86) return "阵雪";
    if (code === 95) return "雷雨";
    if (code === 96 || code === 99) return "强雷雨";
    return "复杂天气";
  }

  function weatherSeverity(code) {
    if (!Number.isFinite(code)) return -1;
    if (code >= 95) return 100;
    if (code >= 80) return 70;
    if (code >= 61) return 55;
    if (code === 51 || code === 53 || code === 55) return 35;
    if (code === 45 || code === 48) return 32;
    if (code === 3) return 20;
    if (code === 2) return 12;
    if (code === 1) return 6;
    return code >= 71 && code <= 86 ? 65 : 0;
  }

  function getPlace() {
    return PLACES.find((place) => place.id === state.selectedId) || PLACES[0];
  }

  function getDay() {
    return state.weather?.days?.[state.activeDay] || null;
  }

  function getDayMetrics(day) {
    if (!day) {
      return {
        high: null,
        low: null,
        rain: null,
        gust: null,
        wind: null,
        precip: null,
        code: null,
        sourceCount: 0,
        hasThunder: false
      };
    }

    const sources = day.sources || [];
    const valid = sources.filter((source) => Number.isFinite(source.high) || Number.isFinite(source.rain));
    const codeCandidates = sources
      .map((source) => source.code)
      .filter(Number.isFinite)
      .sort((a, b) => weatherSeverity(b) - weatherSeverity(a));

    return {
      high: median(sources.map((source) => source.high)),
      low: median(sources.map((source) => source.low)),
      rain: median(sources.map((source) => source.rain)),
      gust: median(sources.map((source) => source.gust)),
      wind: median(sources.map((source) => source.wind)),
      precip: median(sources.map((source) => source.precip)),
      code: codeCandidates[0] ?? null,
      sourceCount: valid.length,
      hasThunder: codeCandidates.some((code) => code >= 95)
    };
  }

  function getDaySpreads(day) {
    if (!day) return { rain: null, gust: null, high: null };
    return {
      rain: spread(day.sources.map((source) => source.rain)),
      gust: spread(day.sources.map((source) => source.gust)),
      high: spread(day.sources.map((source) => source.high))
    };
  }

  function summarizeMetric(day, getter) {
    if (!day) return { min: null, max: null, average: null, median: null, count: 0 };
    const values = day.sources
      .map(getter)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    if (!values.length) return { min: null, max: null, average: null, median: null, count: 0 };
    return {
      min: values[0],
      max: values[values.length - 1],
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      median: median(values),
      count: values.length
    };
  }

  function metricScaleStyle(stats, maxScale) {
    if (!stats.count) return "";
    const left = clamp((stats.min / maxScale) * 100, 0, 98);
    const right = clamp((stats.max / maxScale) * 100, left + 2, 100);
    const marker = clamp((stats.median / maxScale) * 100, 0, 100);
    return `--range-left:${left.toFixed(1)}%;--range-right:${right.toFixed(1)}%;--median-left:${marker.toFixed(1)}%`;
  }

  function renderMetricCard({ label, value, unit, stats, averageUnit, rangeMax, color }) {
    const compactUnit = unit.trim();
    return `
      <div class="signal-card">
        <div class="signal-heading">
          <span>${escapeHtml(label)}</span>
          <strong>${formatMetric(value, unit, unit === "°" ? 0 : 0)}</strong>
        </div>
        <div class="signal-range" style="${metricScaleStyle(stats, rangeMax)}">
          <span class="signal-range-fill" style="--signal-color:${color}"></span>
          <span class="signal-median" style="--signal-color:${color}"></span>
        </div>
        <div class="signal-meta">
          <span>范围 ${formatMetric(stats.min)}–${formatMetric(stats.max, compactUnit)}</span>
          <span>均值 ${formatMetric(stats.average, averageUnit ?? unit, 1)}</span>
          <span>中位 ${formatMetric(stats.median, compactUnit, 1)}</span>
        </div>
      </div>
    `;
  }

  function renderHeroBrief(day, evaluation) {
    const rainStats = summarizeMetric(day, (source) => source.rain);
    const windStats = summarizeMetric(day, (source) => source.gust ?? source.wind);
    const highStats = summarizeMetric(day, (source) => source.high);
    const { min: rainMin, max: rainMax } = rainStats;
    const { min: windMin, max: windMax } = windStats;
    const { min: tempMin, max: tempMax } = highStats;

    return `
      <div class="hero-brief">
        <div class="hero-brief-head">
          <div>
            <span class="brief-date">${escapeHtml(formatWeekday(day.date))} · ${escapeHtml(formatMonthDay(day.date).month)}${escapeHtml(formatMonthDay(day.date).day)}日</span>
          </div>
          <span class="verdict-badge ${evaluation.className}">${escapeHtml(evaluation.label)}</span>
        </div>

        <div class="brief-weather">
          <div class="brief-temperature">
            <strong>${formatMetric(evaluation.metrics.high, "°")}</strong>
            <span>${escapeHtml(weatherLabel(evaluation.metrics.code))}</span>
          </div>
          <p>${escapeHtml(evaluation.copy)} 最高 ${formatMetric(evaluation.metrics.high, "°")}，最低 ${formatMetric(evaluation.metrics.low, "°")}，置信度 ${escapeHtml(evaluation.confidence)}。</p>
        </div>

        <div class="signal-grid">
          ${renderMetricCard({
            label: "降雨概率",
            value: evaluation.metrics.rain,
            unit: "%",
            stats: rainStats,
            rangeMax: 100,
            color: "#4f8fae"
          })}
          ${renderMetricCard({
            label: "最大风速",
            value: evaluation.metrics.gust ?? evaluation.metrics.wind,
            unit: " km/h",
            stats: windStats,
            rangeMax: 70,
            color: "#d58145"
          })}
          ${renderMetricCard({
            label: "最高温度",
            value: evaluation.metrics.high,
            unit: "°",
            stats: highStats,
            rangeMax: 40,
            color: "#2b8063"
          })}
        </div>

        <div class="brief-footer">
          <span>降雨跨度 ${formatMetric(rainMin === null ? null : rainMax - rainMin, " pp")}</span>
          <span>风速跨度 ${formatMetric(windMin === null ? null : windMax - windMin, " km/h")}</span>
          <span>温度跨度 ${formatMetric(tempMin === null ? null : tempMax - tempMin, "°C")}</span>
        </div>
      </div>
    `;
  }

  function evaluateDay(day, place = getPlace()) {
    const metrics = getDayMetrics(day);
    if (!metrics.sourceCount) {
      return { ...RISK.fair, level: "fair", score: null, confidence: "低", metrics, spreads: getDaySpreads(day) };
    }

    let score = 100;
    score -= (metrics.rain ?? 0) * 0.6;
    score -= Math.max(0, (metrics.gust ?? 20) - 20) * 0.8;
    score -= Math.max(0, (metrics.high ?? 27) - 28) * 4;
    score -= Math.max(0, 15 - (metrics.low ?? 15)) * 1.2;
    score -= Math.max(0, (metrics.precip ?? 0) - 12) * 2.2;
    if (metrics.hasThunder) score -= 35;
    if (place?.exposure === "高") score -= 4;
    score = Math.round(clamp(score, 0, 98));

    let level = "good";
    if (
      metrics.hasThunder ||
      (metrics.rain ?? 0) >= 65 ||
      (metrics.gust ?? 0) >= 55 ||
      (metrics.high ?? 0) >= 35
    ) {
      level = "unsafe";
    } else if ((metrics.rain ?? 0) >= 40 || (metrics.gust ?? 0) >= 45 || (metrics.high ?? 0) >= 33) {
      level = "caution";
    } else if ((metrics.rain ?? 0) >= 18 || (metrics.gust ?? 0) >= 32 || (metrics.high ?? 0) >= 29) {
      level = "fair";
    }

    const spreads = getDaySpreads(day);
    let confidence = "低";
    if (metrics.sourceCount >= 3) {
      const highConfidence =
        (spreads.rain ?? 99) <= 15 &&
        (spreads.gust ?? 99) <= 15 &&
        (spreads.high ?? 99) <= 2.5;
      const mediumConfidence =
        (spreads.rain ?? 99) <= 35 &&
        (spreads.gust ?? 99) <= 24 &&
        (spreads.high ?? 99) <= 4;
      confidence = highConfidence ? "高" : mediumConfidence ? "中" : "低";
    } else if (metrics.sourceCount >= 2 && (spreads.rain ?? 99) <= 30) {
      confidence = "中";
    }

    return { ...RISK[level], level, score, confidence, metrics, spreads };
  }

  function filteredPlaces() {
    const search = state.search.trim().toLowerCase();
    return PLACES.filter((place) => {
      if (state.city !== "全部" && place.city !== state.city) return false;
      if (search) {
        const haystack = `${place.name} ${place.area} ${place.city} ${place.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  function sourceMeta(source) {
    return MODELS[source.id] || {
      name: source.name || source.id,
      org: source.org || "天气模式",
      model: source.model || source.id,
      short: "模型",
      color: "#4f5e56"
    };
  }

  function providerStatus(provider) {
    if (!FREE_PROVIDER_IDS.has(provider.id)) {
      return { hidden: true, live: false, label: "需付费", statusClass: "key" };
    }
    if (provider.live) {
      return { hidden: false, live: true, label: provider.statusLabel, statusClass: "live" };
    }
    if (KEYED_PROVIDER_IDS.has(provider.id) && state.providerStatus[provider.id]?.configured) {
      const sourceId = state.providerStatus[provider.id]?.sourceId;
      const loaded = sourceId && state.weather?.models?.includes(sourceId);
      const lastError = state.providerStatus[provider.id]?.lastError;
      return loaded
        ? { hidden: false, live: true, label: "已配置 · 数据已接入", statusClass: "live" }
        : lastError
          ? { hidden: false, live: false, label: "Key 检查失败", statusClass: "community" }
          : { hidden: false, live: false, label: "已配置 · 待验证", statusClass: "ready" };
    }
    return { hidden: false, live: false, label: "需免费 Key", statusClass: "key" };
  }

  function liveProviderCount() {
    return PROVIDERS.filter((provider) => !providerStatus(provider).hidden && providerStatus(provider).live).length;
  }

  function providerErrorHint(provider) {
    const error = state.providerStatus[provider.id]?.lastError;
    if (!error) return "";
    if (provider.id === "seniverse" && error.includes("public key")) {
      return "填写的是公钥 uid。请在控制台产品详情中改用私钥 key，再重启服务。";
    }
    if (/invalid|401|403/i.test(error)) {
      return "Key 未通过验证，请重新复制对应平台的有效 Key。";
    }
    return "接口验证失败。请检查免费计划是否已启用，或稍后重试。";
  }

  function renderProviderWarning() {
    const failed = PROVIDERS.find((provider) => {
      const status = state.providerStatus[provider.id];
      return status?.lastError && !status?.verified;
    });
    if (!failed) return "";
    return `
      <button type="button" class="provider-warning" data-action="open-providers">
        <span class="provider-warning-mark" aria-hidden="true">!</span>
        <span>
          <strong>${escapeHtml(failed.name)} 尚未接入</strong>
          <small>${escapeHtml(providerErrorHint(failed))}</small>
        </span>
        <span class="provider-warning-link">查看修复方式 ↗</span>
      </button>
    `;
  }

  function renderChips(items, current, action) {
    return items
      .map(
        (item) => `
          <button
            type="button"
            class="chip ${current === item ? "active" : ""}"
            data-action="${action}"
            data-value="${escapeHtml(item)}"
            aria-pressed="${current === item}"
          >${escapeHtml(item)}</button>
        `
      )
      .join("");
  }

  function renderSidebar() {
    const places = filteredPlaces();
    const cities = ["全部", ...new Set(PLACES.map((place) => place.city))];

    return `
      <aside class="sidebar ${state.sidebarOpen ? "open" : ""} ${state.sidebarCollapsed ? "is-collapsed" : ""}" data-screen-label="地点筛选">
        <div class="sidebar-full">
        <div class="sidebar-scroll">
          <div class="sidebar-head">
            <div class="sidebar-title-row">
              <h2 class="sidebar-title">地点 <span>${PLACES.length}</span></h2>
              <button
                type="button"
                class="sidebar-collapse-button desktop-only"
                data-action="toggle-sidebar-collapse"
                aria-label="折叠地点栏"
              >‹</button>
            </div>
            <label class="search-box">
              <span class="search-icon" aria-hidden="true"></span>
              <span class="sr-only">搜索地点</span>
              <input
                type="search"
                value="${escapeHtml(state.search)}"
                placeholder="搜索山名、区域或标签"
                autocomplete="off"
                data-input="place-search"
              >
            </label>
          </div>

          <div class="filter-group">
            <p class="filter-label">City / 城市</p>
            <div class="chips">
              ${renderChips(cities, state.city, "filter-city")}
            </div>
          </div>

          <div class="place-list-wrap">
            <div class="place-list">
              ${
                places.length
                  ? places
                      .map(
                        (place) => `
                          <div
                            class="place-card ${place.id === state.selectedId ? "active" : ""}"
                            role="button"
                            tabindex="0"
                            data-action="select-place"
                            data-place-id="${escapeHtml(place.id)}"
                            aria-label="查看 ${escapeHtml(place.name)} 的天气"
                          >
                            <span class="place-name">${escapeHtml(place.name)}</span>
                            <span class="place-sub">
                              <span>${escapeHtml(place.area)}</span>
                              <span class="dot-sep"></span>
                              <span>${formatMetric(place.elevation, "m")}</span>
                            </span>
                            <button
                              type="button"
                              class="star-button ${state.starred.has(place.id) ? "active" : ""}"
                              data-action="star-place"
                              data-place-id="${escapeHtml(place.id)}"
                              aria-label="${state.starred.has(place.id) ? "取消标记" : "标记"}地点：${escapeHtml(place.name)}"
                              aria-pressed="${state.starred.has(place.id)}"
                            >
                              <span class="star-shape" aria-hidden="true"></span>
                            </button>
                          </div>
                        `
                      )
                      .join("")
                  : `<div class="empty-list">没有符合筛选条件的地点。<br>清空搜索或切换城市再试。</div>`
              }
            </div>
          </div>
        </div>
        </div>
        <div class="sidebar-mini">
          <button
            type="button"
            class="sidebar-expand-button"
            data-action="toggle-sidebar-collapse"
            aria-label="展开地点栏"
          >›</button>
          <span>地点</span>
          <small>${PLACES.length}</small>
        </div>
      </aside>
    `;
  }

  function renderHeader() {
    return `
      <header class="topbar">
        <button
          type="button"
          class="icon-button mobile-only mobile-menu"
          data-action="toggle-sidebar"
          aria-label="打开地点列表"
          aria-expanded="${state.sidebarOpen}"
        >
          <span aria-hidden="true">≡</span>
        </button>
        <div class="brand">
          <div class="brand-mark" aria-hidden="true"></div>
          <div class="brand-name">
            <strong>山候</strong>
          </div>
        </div>
        <div class="topbar-actions">
          <button type="button" class="top-action" data-action="open-providers">
            <span class="mobile-glyph" aria-hidden="true">源</span>
            <span class="button-label">天气源</span>
            <span class="button-meta">${liveProviderCount()} 在线</span>
          </button>
          <button type="button" class="top-action primary" data-action="refresh">
            <span class="mobile-glyph" aria-hidden="true">↻</span>
            <span class="button-label">刷新</span>
          </button>
        </div>
      </header>
    `;
  }

  function renderLoading(place) {
    return `
      <div class="fade-up">
        <div class="page-topline">
          <span class="live-state"><span class="live-dot loading"></span>正在拉取 ${escapeHtml(place.name)} 的多模型预报</span>
          <button type="button" class="subtle-action" data-action="open-providers">查看数据来源</button>
        </div>
        <div class="loading-hero skeleton"></div>
        <div class="loading-table skeleton" aria-hidden="true"></div>
      </div>
    `;
  }

  function renderError(place) {
    return `
      <div class="error-panel fade-up">
        <span class="error-kicker">Weather request failed</span>
        <h1 class="error-title">暂时没拿到山上的天气。</h1>
        <p class="error-copy">
          ${escapeHtml(state.error || "天气接口没有返回有效数据。")}
          如果你是在本地预览，请确认已通过 Node 服务启动，而不是直接打开 HTML 文件。
        </p>
        <div class="error-actions">
          <button type="button" class="primary-button" data-action="retry">重新请求</button>
          <button type="button" class="secondary-button" data-action="load-demo">用演示数据查看界面</button>
          <button type="button" class="secondary-button" data-action="open-providers">查看接口库</button>
        </div>
        <span class="live-state"><span class="live-dot demo"></span>${escapeHtml(place.name)} · 请求失败</span>
      </div>
    `;
  }

  function renderSourceMatrix() {
    const days = state.weather?.days || [];
    const allModelIds = state.weather?.models || Object.keys(MODELS);
    const defaultModelIds = allModelIds.slice(0, 4);
    if (allModelIds.includes("7timer_gfs")) defaultModelIds.push("7timer_gfs");
    Object.values(state.providerStatus)
      .filter((provider) => provider.configured && allModelIds.includes(provider.sourceId))
      .forEach((provider) => {
        if (!defaultModelIds.includes(provider.sourceId)) defaultModelIds.push(provider.sourceId);
      });
    const modelIds = state.showAllSources ? allModelIds : defaultModelIds;

    return `
      <div class="matrix-shell" role="region" aria-label="未来一周多模型天气对比" tabindex="0">
        <table class="weather-table">
          <thead>
            <tr>
              <th scope="col">天气来源</th>
              ${days
                .map(
                  (day, index) => `
                    <th scope="col" class="day-col ${index === state.activeDay ? "active" : ""}">
                      <button
                        type="button"
                        class="matrix-day-button"
                        data-action="select-day"
                        data-day-index="${index}"
                        aria-pressed="${index === state.activeDay}"
                      >
                        <span>${escapeHtml(formatWeekday(day.date))} · ${escapeHtml(formatMonthDay(day.date).month)}</span>
                        <strong>${escapeHtml(formatMonthDay(day.date).day)}</strong>
                        <em class="${evaluateDay(day).className}">${escapeHtml(evaluateDay(day).label)}</em>
                      </button>
                    </th>
                  `
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${modelIds
              .map((modelId) => {
                const meta = sourceMeta({ id: modelId });
                return `
                  <tr>
                    <th scope="row" class="source-cell">
                      <span class="source-name">
                        <span class="source-dot" style="--source-color:${escapeHtml(meta.color)}"></span>
                        ${escapeHtml(meta.name)}
                      </span>
                      <span class="source-org">${escapeHtml(meta.org)}<br>${escapeHtml(meta.model)}</span>
                    </th>
                    ${days
                      .map((day, index) => {
                        const source = day.sources.find((item) => item.id === modelId);
                        if (!source || !Number.isFinite(source.high)) {
                          return `
                            <td
                              class="matrix-cell clickable-day-cell ${index === state.activeDay ? "active" : ""}"
                              role="button"
                              tabindex="0"
                              data-action="select-day"
                              data-day-index="${index}"
                              aria-label="切换到${escapeHtml(formatWeekday(day.date))} ${escapeHtml(formatMonthDay(day.date).month)}${escapeHtml(formatMonthDay(day.date).day)}日"
                              aria-pressed="${index === state.activeDay}"
                            ><span class="missing-cell">暂无该时段</span></td>
                          `;
                        }
                        return `
                          <td
                            class="matrix-cell clickable-day-cell ${index === state.activeDay ? "active" : ""}"
                            role="button"
                            tabindex="0"
                            data-action="select-day"
                            data-day-index="${index}"
                            aria-label="切换到${escapeHtml(formatWeekday(day.date))} ${escapeHtml(formatMonthDay(day.date).month)}${escapeHtml(formatMonthDay(day.date).day)}日"
                            aria-pressed="${index === state.activeDay}"
                            title="${escapeHtml(meta.name)} · ${escapeHtml(weatherLabel(source.code))}"
                          >
                            <span class="matrix-weather">${escapeHtml(weatherLabel(source.code))}</span>
                            <span class="matrix-temp">${formatMetric(source.high, "°")} <small>/ ${formatMetric(source.low, "°")}</small></span>
                            <span class="matrix-stats">
                              <span class="rain">雨 ${formatMetric(source.rain, "%")}</span>
                              <span class="wind">风 ${formatMetric(source.gust ?? source.wind, "km/h")}</span>
                            </span>
                          </td>
                        `;
                      })
                      .join("")}
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderForecast() {
    const place = getPlace();
    const day = getDay();
    const evaluation = evaluateDay(day, place);
    const isDemo = state.weather.mode === "demo";

    if (!day) return renderError(place);

    return `
      <div class="fade-up">
        ${isDemo ? `<div class="demo-banner"><strong>DEMO</strong><span>当前是演示数据，只用于检查界面和交互；刷新时将重新请求实时预报。</span></div>` : ""}
        ${renderProviderWarning()}

        <section class="hero" data-screen-label="地点研判">
          <div class="hero-copy">
            <div class="hero-location">
              <span class="location-pin" aria-hidden="true"></span>
              <span>${escapeHtml(place.city)} · ${escapeHtml(place.area)}</span>
              <span>·</span>
              <span>${formatMetric(place.elevation, " m")}</span>
            </div>
            <h1>${escapeHtml(place.name)}</h1>
            <p class="hero-note">${escapeHtml(place.note)}</p>
            <div class="hero-tags">
              <span class="hero-tag">${escapeHtml(place.duration)}</span>
              <span class="hero-tag">暴露 ${escapeHtml(place.exposure)}</span>
              <span class="hero-tag">${escapeHtml(place.surface)}</span>
              <span class="hero-tag">${escapeHtml(place.access)}</span>
              ${place.companyAccess ? `<span class="hero-tag commute-tag" title="按道路距离估算，出发前请用地图复核实时路况">${escapeHtml(place.companyAccess)}</span>` : ""}
            </div>
          </div>
          ${renderHeroBrief(day, evaluation)}
        </section>

        <section class="section" data-screen-label="模式对比">
          <div class="section-head">
            <h2 class="section-title">天气</h2>
            <div class="section-head-actions">
              <button type="button" class="subtle-action" data-action="toggle-sources">
                ${state.showAllSources ? "收起常用来源" : `显示全部 ${state.weather.models.length} 个来源`}
              </button>
            </div>
          </div>
          ${renderSourceMatrix()}
        </section>
      </div>
    `;
  }

  function renderMain() {
    const place = getPlace();
    if (state.loading) return renderLoading(place);
    if (state.error) return renderError(place);
    return renderForecast();
  }

  function renderProviderDrawer() {
    if (!state.providerDrawerOpen) return "";
    const search = state.providerSearch.trim().toLowerCase();
    const providers = PROVIDERS.filter((provider) => {
      if (!FREE_PROVIDER_IDS.has(provider.id)) return false;
      if (!search) return true;
      return `${provider.name} ${provider.category} ${provider.strength} ${provider.caution} ${provider.auth}`
        .toLowerCase()
        .includes(search);
    });

    const grouped = new Map();
    providers.forEach((provider) => {
      const category = KEYED_PROVIDER_IDS.has(provider.id)
        ? "免费 Key"
        : provider.category === "国内优先"
          ? "国内免费"
          : provider.category;
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(provider);
    });

    return `
      <div class="drawer-backdrop" data-backdrop>
        <aside class="provider-drawer" role="dialog" aria-modal="true" aria-labelledby="provider-title">
          <div class="drawer-head">
            <div>
              <p class="eyebrow">Weather data catalogue</p>
              <h2 class="drawer-title" id="provider-title">免费天气源</h2>
              <p class="drawer-subtitle">这里只显示无需付费的天气来源。需要账号的接口只保留永久免费或明确免费额度方案；付费订阅、企业账号和只送短期试用的平台已隐藏。</p>
              <a class="drawer-guide-cta" href="Free%20Key%20Guide.html" target="_blank" rel="noreferrer">如何获取免费 Key ↗</a>
            </div>
            <button type="button" class="drawer-close" data-action="close-providers" aria-label="关闭接口库">×</button>
          </div>
          <div class="drawer-tools">
            <label class="drawer-search">
              <span class="search-icon" aria-hidden="true"></span>
              <span class="sr-only">搜索天气接口</span>
              <input
                type="search"
                value="${escapeHtml(state.providerSearch)}"
                placeholder="搜索平台、权限或能力"
                autocomplete="off"
                data-input="provider-search"
              >
            </label>
            <div class="drawer-status-key" aria-label="状态图例">
              <span class="status-pill live">已接入</span>
              <span class="status-pill ready">待验证</span>
              <span class="status-pill ready">免 Key</span>
              <span class="status-pill key">需授权</span>
            </div>
          </div>
          <div class="drawer-scroll">
            ${
              providers.length
                ? [...grouped.entries()]
                    .map(
                      ([category, items]) => `
                        <div class="provider-section-title">
                          <span>${escapeHtml(category)}</span>
                          <span>${items.length} sources</span>
                        </div>
                        <div class="provider-list">
                          ${items
                            .map((provider) => {
                              const effective = providerStatus(provider);
                              const errorHint = providerErrorHint(provider);
                              return `
                                <article class="provider-card">
                                  <div class="provider-id">
                                    <div class="provider-name-line">
                                      <span class="provider-name">${escapeHtml(provider.name)}</span>
                                      <span class="status-pill ${escapeHtml(effective.statusClass)}">${escapeHtml(effective.label)}</span>
                                    </div>
                                    <span class="provider-meta">${escapeHtml(provider.auth)}<br>${escapeHtml(provider.horizon)}</span>
                                  </div>
                                  <div class="provider-copy">
                                    <strong>${escapeHtml(provider.strength)}</strong>
                                    <span class="provider-caution">${escapeHtml(provider.caution)}</span>
                                    ${errorHint ? `<span class="provider-runtime-error">${escapeHtml(errorHint)}</span>` : ""}
                                  </div>
                                  <div class="provider-actions">
                                    <a class="provider-link" href="${escapeHtml(provider.docs)}" target="_blank" rel="noreferrer">查看文档</a>
                                    <button type="button" class="copy-button" data-action="copy-endpoint" data-provider-id="${escapeHtml(provider.id)}">复制示例</button>
                                  </div>
                                  <code class="endpoint-preview" title="${escapeHtml(provider.endpoint)}">${escapeHtml(provider.endpoint)}</code>
                                </article>
                              `;
                            })
                            .join("")}
                        </div>
                      `
                    )
                    .join("")
                : `<div class="drawer-empty">没有找到匹配的接口。</div>`
            }

            <div class="drawer-strategy">
              <h3>免费 Key 使用规则</h3>
              <p>优先申请 Visual Crossing、Weatherbit、心知天气和 WeatherAPI 的个人免费套餐。密钥写入项目根目录的 <code>.env</code>，不要发到聊天里；服务端只向页面返回“已配置/未配置”，不会把 Key 暴露给浏览器。</p>
              <a class="provider-link drawer-guide-link" href="Free%20Key%20Guide.html" target="_blank" rel="noreferrer">查看免费 Key 获取步骤</a>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  function renderToast() {
    return state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : "";
  }

  function renderApp() {
    const sidebarBackdrop =
      state.sidebarOpen && !state.providerDrawerOpen
        ? `<button type="button" class="sidebar-backdrop" data-action="close-sidebar" aria-label="关闭地点列表"></button>`
        : "";

    root.innerHTML = `
      <div class="app-shell ${state.sidebarCollapsed ? "sidebar-collapsed" : ""}">
        ${renderHeader()}
        <div class="workspace">
          ${renderSidebar()}
          ${sidebarBackdrop}
          <main class="main-pane">
            <div class="main-inner">
              ${renderMain()}
            </div>
          </main>
        </div>
        ${renderProviderDrawer()}
        ${renderToast()}
      </div>
    `;
  }

  function showToast(message) {
    state.toast = message;
    clearTimeout(toastTimer);
    renderApp();
    toastTimer = setTimeout(() => {
      state.toast = "";
      renderApp();
    }, 2200);
  }

  async function loadWeather(place = getPlace(), force = false) {
    if (!place) return;
    state.requestController?.abort();
    state.requestController = new AbortController();
    state.loading = true;
    state.error = null;
    renderApp();

    const query = new URLSearchParams({
      lat: String(place.lat),
      lon: String(place.lon),
      elevation: String(place.elevation),
      place: place.name
    });
    if (force) query.set("_", String(Date.now()));

    try {
      const weatherEndpoint = STATIC_MODE
        ? `data/weather/${encodeURIComponent(place.id)}.json`
        : `/api/weather?${query.toString()}`;
      if (force) {
        const separator = weatherEndpoint.includes("?") ? "&" : "?";
        weatherEndpoint += `${separator}_=${Date.now()}`;
      }

      const response = await fetch(weatherEndpoint, {
        signal: state.requestController.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || `天气服务返回 ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data.days) || !data.days.length) {
        throw new Error("天气服务返回的数据结构为空。");
      }
      state.weather = data;
      state.loading = false;
      state.error = null;
      state.activeDay = 0;
      renderApp();
      loadProviderStatus();
    } catch (error) {
      if (error.name === "AbortError") return;
      state.loading = false;
      state.error = error.message || "未知网络错误";
      state.weather = null;
      renderApp();
    }
  }

  function selectPlace(placeId) {
    if (state.selectedId === placeId) {
      if (window.innerWidth <= 940) {
        state.sidebarOpen = false;
        renderApp();
      }
      return;
    }
    state.selectedId = placeId;
    writeStorage("trailweather.selected", placeId);
    if (window.innerWidth <= 940) state.sidebarOpen = false;
    loadWeather(getPlace());
  }

  function toggleStar(placeId) {
    const place = PLACES.find((item) => item.id === placeId);
    if (!place) return;
    if (state.starred.has(placeId)) {
      state.starred.delete(placeId);
      showToast(`已取消标记「${place.shortName || place.name}」`);
    } else {
      state.starred.add(placeId);
      showToast(`已标记「${place.shortName || place.name}」`);
    }
    writeStorage("trailweather.starred", [...state.starred]);
    renderApp();
  }

  function buildDemoForecast(place) {
    const now = new Date();
    const base = [
      { code: 1, high: 27.4, low: 18.2, rain: 5, gust: 25, wind: 10, precip: 0 },
      { code: 2, high: 28.2, low: 19.4, rain: 14, gust: 30, wind: 12, precip: 0.8 },
      { code: 3, high: 27.1, low: 19.1, rain: 29, gust: 38, wind: 15, precip: 2.5 },
      { code: 61, high: 24.6, low: 18.5, rain: 61, gust: 46, wind: 19, precip: 14.8 },
      { code: 80, high: 26.2, low: 19.6, rain: 34, gust: 35, wind: 14, precip: 6.2 },
      { code: 1, high: 28.8, low: 20.1, rain: 7, gust: 24, wind: 10, precip: 0 },
      { code: 2, high: 27.9, low: 19.8, rain: 18, gust: 29, wind: 12, precip: 1.1 }
    ];
    const offsets = [
      { id: "ecmwf_ifs025", high: 0, low: 0.2, rain: 0, gust: 0, code: 0 },
      { id: "gfs_seamless", high: 1.1, low: -0.2, rain: 4, gust: 3, code: 0 },
      { id: "icon_seamless", high: -0.5, low: 0.5, rain: -2, gust: 2, code: 0 },
      { id: "cma_grapes_global", high: -0.2, low: -0.3, rain: 2, gust: -1, code: 0 }
    ];
    const days = base.map((day, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + index);
      return {
        date: localIsoDate(date),
        sources: offsets.map((offset) => ({
          id: offset.id,
          code: day.code,
          high: round(day.high + offset.high - place.elevation * 0.001, 1),
          low: round(day.low + offset.low - place.elevation * 0.001, 1),
          rain: clamp(day.rain + offset.rain, 0, 100),
          gust: Math.max(0, round(day.gust + offset.gust, 1)),
          wind: Math.max(0, round(day.wind + offset.gust * 0.2, 1)),
          precip: day.precip
        }))
      };
    });
    return {
      mode: "demo",
      provider: "演示数据",
      generatedAt: new Date().toISOString(),
      location: { elevation: place.elevation },
      models: offsets.map((offset) => offset.id),
      days
    };
  }

  function useDemoData() {
    state.weather = buildDemoForecast(getPlace());
    state.loading = false;
    state.error = null;
    state.activeDay = 0;
    renderApp();
  }

  async function copyEndpoint(providerId) {
    const provider = PROVIDERS.find((item) => item.id === providerId);
    if (!provider) return;
    try {
      await navigator.clipboard.writeText(provider.endpoint);
      showToast(`已复制 ${provider.name} 的示例请求`);
    } catch {
      showToast("浏览器没有授权剪贴板，请从接口库手动复制");
    }
  }

  async function loadProviderStatus() {
    try {
      const statusEndpoint = STATIC_MODE ? "data/provider-status.json" : "/api/provider-status";
      const response = await fetch(statusEndpoint, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) return;
      const payload = await response.json();
      state.providerStatus = Object.fromEntries(
        (payload.providers || []).map((provider) => [provider.id, provider])
      );
      renderApp();
    } catch {
      // The free keyless sources still work if status cannot be read.
    }
  }

  function selectDay(dayIndex) {
    const mainPane = document.querySelector(".main-pane");
    const matrix = document.querySelector(".matrix-shell");
    const scrollTop = mainPane?.scrollTop || 0;
    const scrollLeft = matrix?.scrollLeft || 0;
    state.activeDay = clamp(Number(dayIndex) || 0, 0, Math.max(0, (state.weather?.days?.length || 1) - 1));
    renderApp();
    const nextMainPane = document.querySelector(".main-pane");
    const nextMatrix = document.querySelector(".matrix-shell");
    if (nextMainPane) nextMainPane.scrollTop = scrollTop;
    if (nextMatrix) nextMatrix.scrollLeft = scrollLeft;
  }

  document.addEventListener("click", (event) => {
    const backdrop = event.target.closest("[data-backdrop]");
    if (backdrop && event.target === backdrop) {
      state.providerDrawerOpen = false;
      renderApp();
      return;
    }

    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;
    const action = trigger.dataset.action;

    if (action === "select-place") {
      selectPlace(trigger.dataset.placeId);
      return;
    }
    if (action === "star-place") {
      event.stopPropagation();
      toggleStar(trigger.dataset.placeId);
      return;
    }
    if (action === "filter-city") {
      state.city = trigger.dataset.value;
      renderApp();
      return;
    }
    if (action === "toggle-sidebar-collapse") {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      writeStorage("trailweather.sidebarCollapsed", state.sidebarCollapsed);
      renderApp();
      return;
    }
    if (action === "select-day") {
      selectDay(trigger.dataset.dayIndex);
      return;
    }
    if (action === "toggle-sources") {
      state.showAllSources = !state.showAllSources;
      renderApp();
      return;
    }
    if (action === "refresh") {
      loadWeather(getPlace(), true);
      return;
    }
    if (action === "retry") {
      loadWeather(getPlace(), true);
      return;
    }
    if (action === "load-demo") {
      useDemoData();
      return;
    }
    if (action === "open-providers") {
      state.providerDrawerOpen = true;
      state.sidebarOpen = false;
      renderApp();
      return;
    }
    if (action === "close-providers") {
      state.providerDrawerOpen = false;
      renderApp();
      return;
    }
    if (action === "toggle-sidebar") {
      state.sidebarOpen = !state.sidebarOpen;
      renderApp();
      return;
    }
    if (action === "close-sidebar") {
      state.sidebarOpen = false;
      renderApp();
      return;
    }
    if (action === "copy-endpoint") {
      copyEndpoint(trigger.dataset.providerId);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.providerDrawerOpen || state.sidebarOpen) {
        state.providerDrawerOpen = false;
        state.sidebarOpen = false;
        renderApp();
      }
      return;
    }

    const placeCard = event.target.closest(".place-card[role='button']");
    if (placeCard && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      selectPlace(placeCard.dataset.placeId);
      return;
    }

    const dayCell = event.target.closest(".clickable-day-cell[role='button']");
    if (dayCell && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      selectDay(dayCell.dataset.dayIndex);
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches('[data-input="place-search"]')) {
      state.search = event.target.value;
      renderApp();
      const next = document.querySelector('[data-input="place-search"]');
      next?.focus();
      next?.setSelectionRange(next.value.length, next.value.length);
      return;
    }
    if (event.target.matches('[data-input="provider-search"]')) {
      state.providerSearch = event.target.value;
      renderApp();
      const next = document.querySelector('[data-input="provider-search"]');
      next?.focus();
      next?.setSelectionRange(next.value.length, next.value.length);
    }
  });

  if (!PLACES.length) {
    root.innerHTML = `
      <div class="error-panel">
        <span class="error-kicker">Configuration error</span>
        <h1 class="error-title">地点清单没有加载。</h1>
        <p class="error-copy">请确认 places.js 与 index.html 位于同一目录。</p>
      </div>
    `;
  } else {
    if (!PLACES.some((place) => place.id === state.selectedId)) {
      state.selectedId = PLACES[0].id;
    }
    renderApp();
    loadProviderStatus();
    loadWeather(getPlace());
  }
})();
