import http from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const designsRoot = path.resolve(__dirname, "..");
const projectPath = "/hiking-weather-tool/";

loadEnvFile(path.join(__dirname, ".env"));

const port = Number(process.env.PORT || 4311);
const cacheLifetimeMs = 10 * 60 * 1000;
const forecastCache = new Map();
const providerRuntime = new Map();

const models = [
  {
    id: "ecmwf_ifs025",
    name: "ECMWF",
    org: "欧洲中期天气预报中心",
    model: "IFS"
  },
  {
    id: "gfs_seamless",
    name: "NOAA GFS",
    org: "美国国家海洋和大气管理局",
    model: "GFS Seamless"
  },
  {
    id: "icon_seamless",
    name: "DWD ICON",
    org: "德国气象局",
    model: "ICON Seamless"
  },
  {
    id: "cma_grapes_global",
    name: "CMA GRAPES",
    org: "中国气象局",
    model: "GRAPES Global"
  },
  {
    id: "jma_seamless",
    name: "JMA GSM",
    org: "日本气象厅",
    model: "GSM / MSM"
  },
  {
    id: "metno_seamless",
    name: "MET Norway",
    org: "挪威气象研究所",
    model: "MEPS / ECMWF"
  },
  {
    id: "ukmo_seamless",
    name: "UKMO",
    org: "英国气象局",
    model: "UKMO Seamless"
  },
  {
    id: "meteofrance_seamless",
    name: "Météo-France",
    org: "法国气象局",
    model: "AROME / ARPEGE"
  },
  {
    id: "gem_seamless",
    name: "Canada GEM",
    org: "加拿大环境与气候变化部",
    model: "GEM Seamless"
  },
  {
    id: "bom_access_global",
    name: "BOM ACCESS",
    org: "澳大利亚气象局",
    model: "ACCESS Global"
  },
  {
    id: "knmi_seamless",
    name: "KNMI",
    org: "荷兰皇家气象研究所",
    model: "HARMONIE / ECMWF"
  },
  {
    id: "dmi_seamless",
    name: "DMI",
    org: "丹麦气象研究所",
    model: "HARMONIE / ECMWF"
  },
  {
    id: "geosphere_seamless",
    name: "GeoSphere",
    org: "奥地利气象与地球动力学中心",
    model: "AROME / ECMWF"
  },
  {
    id: "kma_seamless",
    name: "KMA",
    org: "韩国气象厅",
    model: "UM / LDAPS"
  },
  {
    id: "ecmwf_aifs025",
    name: "ECMWF AIFS",
    org: "欧洲中期天气预报中心",
    model: "AI Forecast"
  }
];

const sevenTimerSource = {
  id: "7timer_gfs",
  name: "7Timer / GFS",
  org: "NOAA GFS · 社区服务",
  model: "3 小时间隔"
};

const metNorwaySource = {
  id: "metno_direct",
  name: "MET Norway",
  org: "挪威气象研究所",
  model: "Locationforecast"
};

const wttrSource = {
  id: "wttr_in",
  name: "wttr.in / WWO",
  org: "社区实例 · World Weather Online",
  model: "3 天预报"
};

const weatherApiSource = {
  id: "weatherapi_key",
  name: "WeatherAPI.com",
  org: "免费额度 · 未来 3 天",
  model: "Forecast API"
};

const weatherbitSource = {
  id: "weatherbit_key",
  name: "Weatherbit",
  org: "免费额度 · 未来 7 天",
  model: "Daily Forecast"
};

const visualCrossingSource = {
  id: "visual_crossing_key",
  name: "Visual Crossing",
  org: "免费额度 · 未来 7 天",
  model: "Timeline API"
};

const seniverseSource = {
  id: "seniverse_key",
  name: "心知天气",
  org: "永久免费版 · 未来 3 天",
  model: "Daily Forecast"
};

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function getProviderConfigStatus() {
  return [
    {
      id: "weatherapi",
      name: weatherApiSource.name,
      configured: Boolean(process.env.WEATHERAPI_KEY),
      sourceId: weatherApiSource.id
    },
    {
      id: "weatherbit",
      name: weatherbitSource.name,
      configured: Boolean(process.env.WEATHERBIT_KEY),
      sourceId: weatherbitSource.id
    },
    {
      id: "visual-crossing",
      name: visualCrossingSource.name,
      configured: Boolean(process.env.VISUAL_CROSSING_KEY),
      sourceId: visualCrossingSource.id
    },
    {
      id: "seniverse",
      name: seniverseSource.name,
      configured: Boolean(process.env.SENIVERSE_KEY),
      sourceId: seniverseSource.id
    }
  ].map((provider) => ({
    ...provider,
    verified: providerRuntime.get(provider.id)?.verified === true,
    lastError: providerRuntime.get(provider.id)?.lastError || null
  }));
}

function recordProviderResult(providerId, verified, error = null) {
  providerRuntime.set(providerId, {
    verified,
    lastError: error,
    checkedAt: new Date().toISOString()
  });
}

const dailyVariables = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "precipitation_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max"
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  response.end(body);
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function readDailyArray(daily, variable, modelId) {
  const key = `${variable}_${modelId}`;
  if (Array.isArray(daily?.[key])) return daily[key];
  if (Array.isArray(daily?.[variable])) return daily[variable];
  return [];
}

function parseForecast(raw, requestedElevation) {
  const dates = raw?.daily?.time;
  if (!Array.isArray(dates) || !dates.length) {
    throw new Error("Open-Meteo 响应中没有 daily.time");
  }

  const days = dates.map((date, index) => {
    const sources = models.map((model) => {
      const values = {
        high: readDailyArray(raw.daily, "temperature_2m_max", model.id)[index],
        low: readDailyArray(raw.daily, "temperature_2m_min", model.id)[index],
        rain: readDailyArray(raw.daily, "precipitation_probability_max", model.id)[index],
        precip: readDailyArray(raw.daily, "precipitation_sum", model.id)[index],
        wind: readDailyArray(raw.daily, "wind_speed_10m_max", model.id)[index],
        gust: readDailyArray(raw.daily, "wind_gusts_10m_max", model.id)[index],
        code: readDailyArray(raw.daily, "weather_code", model.id)[index]
      };

      return {
        id: model.id,
        name: model.name,
        org: model.org,
        model: model.model,
        high: normalizeNumber(values.high),
        low: normalizeNumber(values.low),
        rain: normalizeNumber(values.rain),
        precip: normalizeNumber(values.precip),
        wind: normalizeNumber(values.wind),
        gust: normalizeNumber(values.gust),
        code: normalizeNumber(values.code)
      };
    });

    return { date, sources };
  });

  const activeModels = models.filter((model) =>
    days.some((day) => {
      const source = day.sources.find((item) => item.id === model.id);
      return source && (source.high !== null || source.low !== null || source.rain !== null);
    })
  );
  const activeIds = new Set(activeModels.map((model) => model.id));
  const filteredDays = days.map((day) => ({
    ...day,
    sources: day.sources.filter((source) => activeIds.has(source.id))
  }));

  return {
    mode: "live",
    provider: "山候多源聚合",
    primaryProvider: "Open-Meteo",
    upstreamProviders: ["Open-Meteo"],
    providerUrl: "https://open-meteo.com/",
    generatedAt: new Date().toISOString(),
    requestedElevation,
    location: {
      latitude: raw.latitude,
      longitude: raw.longitude,
      elevation: raw.elevation,
      timezone: raw.timezone
    },
    models: activeModels.map((model) => model.id),
    sources: activeModels,
    days: filteredDays,
    notes: [
      "温度与风使用请求点位海拔进行统计降尺度。",
      "CMA GRAPES 和部分模式的长时段字段可能缺失，缺失值保持 null。",
      "Open-Meteo 的四行是同一接口下的底层数值模式，不是四个独立观测平台。"
    ]
  };
}

function getShanghaiDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function beaufortToKmh(level) {
  const representative = {
    0: 1,
    1: 4,
    2: 9,
    3: 16,
    4: 24,
    5: 34,
    6: 44,
    7: 55,
    8: 67,
    9: 80,
    10: 94,
    11: 108,
    12: 120
  };
  return representative[Number(level)] ?? null;
}

function mapSevenTimerCode(weather) {
  const value = String(weather || "").toLowerCase();
  if (!value) return null;
  if (value.includes("thunder") || value.includes("ts")) return 95;
  if (value.includes("snow") || value.includes("flurr")) return 71;
  if (value.includes("torrential") || value.includes("orain") || value.includes("rain")) {
    if (value.includes("light")) return 61;
    if (value.includes("prain")) return 80;
    if (value.includes("heavy") || value.includes("orain")) return 65;
    return 63;
  }
  if (value.includes("humid") || value.includes("fog")) return 45;
  if (value.includes("mcloudy") || value.includes("cloudy")) return 3;
  if (value.includes("pcloudy")) return 2;
  if (value.includes("clear")) return 1;
  return null;
}

async function getSevenTimerSource(lat, lon, elevation) {
  const url = new URL("https://www.7timer.info/bin/api.pl");
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("product", "civil");
  url.searchParams.set("output", "json");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TrailWeatherPrototype/0.1 (weather comparison prototype)"
    },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`7Timer ${response.status}`);
  const raw = await response.json();
  const init = String(raw.init || "");
  if (!/^\d{10}$/.test(init) || !Array.isArray(raw.dataseries)) {
    throw new Error("7Timer 响应结构异常");
  }

  const initDate = new Date(Date.UTC(
    Number(init.slice(0, 4)),
    Number(init.slice(4, 6)) - 1,
    Number(init.slice(6, 8)),
    Number(init.slice(8, 10))
  ));

  const byDate = new Map();
  for (const item of raw.dataseries) {
    const pointDate = new Date(initDate.getTime() + Number(item.timepoint) * 60 * 60 * 1000);
    const date = getShanghaiDate(pointDate);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(item);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => {
      const lapseAdjustment = Math.max(0, elevation) * 0.0065;
      const temps = items
        .map((item) => item.temp2m)
        .filter(Number.isFinite)
        .map((temperature) => Number((temperature - lapseAdjustment).toFixed(1)));
      const wind = items.map((item) => beaufortToKmh(item.wind10m?.speed)).filter(Number.isFinite);
      const precip = items.map((item) => item.prec_amount).filter(Number.isFinite);
      const codes = items.map((item) => mapSevenTimerCode(item.weather)).filter(Number.isFinite);
      return {
        date,
        source: {
          ...sevenTimerSource,
          high: temps.length ? Math.max(...temps) : null,
          low: temps.length ? Math.min(...temps) : null,
          rain: null,
          precip: precip.length ? Number(precip.reduce((sum, value) => sum + value, 0).toFixed(1)) : null,
          wind: wind.length ? Math.max(...wind) : null,
          gust: null,
          code: codes.length ? codes.sort((a, b) => b - a)[0] : null
        }
      };
    });
}

function mapMetSymbol(symbolCode) {
  const code = String(symbolCode || "").toLowerCase();
  if (!code) return null;
  if (code.includes("thunder")) return 95;
  if (code.includes("heavysnow") || code.includes("snow")) return 71;
  if (code.includes("sleet") || code.includes("freezing")) return 66;
  if (code.includes("heavyrain")) return 65;
  if (code.includes("lightrain") || code.includes("drizzle")) return 51;
  if (code.includes("rain")) return 61;
  if (code.includes("fog")) return 45;
  if (code.includes("cloudy")) return 3;
  if (code.includes("partlycloudy") || code.includes("fair")) return 2;
  if (code.includes("clearsky")) return 1;
  return null;
}

function symbolSeverity(code) {
  if (!Number.isFinite(code)) return -1;
  if (code >= 95) return 100;
  if (code >= 71) return 65;
  if (code >= 61) return 55;
  if (code >= 51) return 35;
  if (code === 45) return 30;
  return code;
}

async function getMetNorwaySource(lat, lon, elevation) {
  const url = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TrailWeather/0.2 (local hiking weather comparison; contact unavailable)"
    },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`MET Norway ${response.status}`);
  const raw = await response.json();
  const series = raw?.properties?.timeseries;
  if (!Array.isArray(series)) throw new Error("MET Norway 响应结构异常");

  const byDate = new Map();
  for (const entry of series) {
    const date = getShanghaiDate(new Date(entry.time));
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(entry);
  }

  const lapseAdjustment = Math.max(0, elevation) * 0.0065;
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => {
      const temperatures = entries
        .map((entry) => entry.data?.instant?.details?.air_temperature)
        .filter(Number.isFinite)
        .map((value) => Number((value - lapseAdjustment).toFixed(1)));
      const winds = entries
        .map((entry) => entry.data?.instant?.details?.wind_speed)
        .filter(Number.isFinite)
        .map((value) => Number((value * 3.6).toFixed(1)));
      const precipitation = entries
        .map((entry) => entry.data?.next_1_hours?.details?.precipitation_amount)
        .filter(Number.isFinite);
      const symbols = entries
        .map((entry) =>
          mapMetSymbol(
            entry.data?.next_1_hours?.summary?.symbol_code ||
            entry.data?.next_6_hours?.summary?.symbol_code ||
            entry.data?.next_12_hours?.summary?.symbol_code
          )
        )
        .filter(Number.isFinite)
        .sort((a, b) => symbolSeverity(b) - symbolSeverity(a));

      return {
        date,
        source: {
          ...metNorwaySource,
          high: temperatures.length ? Math.max(...temperatures) : null,
          low: temperatures.length ? Math.min(...temperatures) : null,
          rain: null,
          precip: precipitation.length
            ? Number(precipitation.reduce((sum, value) => sum + value, 0).toFixed(1))
            : null,
          wind: winds.length ? Math.max(...winds) : null,
          gust: null,
          code: symbols[0] ?? null
        }
      };
    });
}

function mapWeatherOnlineCode(code) {
  const value = Number(code);
  if ([200, 386, 389, 392, 395].includes(value)) return 95;
  if ([179, 182, 185, 281, 284, 311, 314].includes(value)) return 66;
  if ([230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377].includes(value)) return 71;
  if ([143, 248, 260].includes(value)) return 45;
  if ([113].includes(value)) return 1;
  if ([116].includes(value)) return 2;
  if ([119, 122].includes(value)) return 3;
  if ([176, 263, 266, 293, 296, 353].includes(value)) return 61;
  if ([299, 302, 305, 308, 356, 359].includes(value)) return 63;
  return 61;
}

async function getWttrSource(lat, lon, elevation) {
  const url = new URL(`https://wttr.in/${lat},${lon}`);
  url.searchParams.set("format", "j1");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "curl/8.0"
    },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`wttr.in ${response.status}`);
  const raw = await response.json();
  if (!Array.isArray(raw.weather)) throw new Error("wttr.in 响应结构异常");

  const lapseAdjustment = Math.max(0, elevation) * 0.0065;
  return raw.weather.map((day) => {
    const hourly = Array.isArray(day.hourly) ? day.hourly : [];
    const chance = hourly.map((entry) => Number(entry.chanceofrain)).filter(Number.isFinite);
    const precip = hourly.map((entry) => Number(entry.precipMM)).filter(Number.isFinite);
    const wind = hourly.map((entry) => Number(entry.windspeedKmph)).filter(Number.isFinite);
    const gust = hourly.map((entry) => Number(entry.WindGustKmph)).filter(Number.isFinite);
    const codes = hourly.map((entry) => mapWeatherOnlineCode(entry.weatherCode)).filter(Number.isFinite);
    const max = Number(day.maxtempC);
    const min = Number(day.mintempC);
    return {
      date: day.date,
      source: {
        ...wttrSource,
        high: Number.isFinite(max) ? Number((max - lapseAdjustment).toFixed(1)) : null,
        low: Number.isFinite(min) ? Number((min - lapseAdjustment).toFixed(1)) : null,
        rain: chance.length ? Math.max(...chance) : null,
        precip: precip.length ? Number(precip.reduce((sum, value) => sum + value, 0).toFixed(1)) : null,
        wind: wind.length ? Math.max(...wind) : null,
        gust: gust.length ? Math.max(...gust) : null,
        code: codes.length ? codes.sort((a, b) => symbolSeverity(b) - symbolSeverity(a))[0] : null
      }
    };
  });
}

function mapWeatherApiCode(code) {
  const value = Number(code);
  if (!Number.isFinite(value)) return null;
  if (value === 1000) return 1;
  if (value === 1003) return 2;
  if ([1006, 1009].includes(value)) return 3;
  if ([1030, 1036, 1135, 1147].includes(value)) return 45;
  if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(value)) return 71;
  if ([1069, 1072, 1204, 1207, 1249, 1252].includes(value)) return 66;
  if ([1150, 1153, 1168, 1171].includes(value)) return 51;
  if ([1180, 1183, 1240].includes(value)) return 61;
  if ([1186, 1189, 1243].includes(value)) return 63;
  if ([1192, 1195, 1198, 1201, 1246].includes(value)) return 65;
  if ([1273, 1276, 1279, 1282].includes(value)) return 95;
  return null;
}

function mapWeatherbitCode(code) {
  const value = Number(code);
  if (!Number.isFinite(value)) return null;
  if (value >= 200 && value < 300) return 95;
  if (value >= 300 && value < 400) return 51;
  if (value >= 500 && value < 600) return value >= 502 ? 63 : 61;
  if (value >= 600 && value < 700) return 71;
  if (value >= 700 && value < 800) return 45;
  if (value === 800) return 1;
  if (value === 801) return 2;
  if (value >= 802 && value <= 804) return 3;
  return null;
}

function mapVisualCrossingCode(icon) {
  const value = String(icon || "").toLowerCase();
  if (value.includes("thunder")) return 95;
  if (value.includes("snow") || value.includes("ice")) return 71;
  if (value.includes("showers")) return 80;
  if (value.includes("rain")) return 61;
  if (value.includes("fog")) return 45;
  if (value.includes("partly-cloudy")) return 2;
  if (value.includes("cloudy") || value.includes("overcast")) return 3;
  if (value.includes("clear") || value.includes("sunny")) return 1;
  return null;
}

function mapSeniverseText(code, text) {
  const value = `${code ?? ""} ${text ?? ""}`;
  if (value.includes("雷")) return 95;
  if (value.includes("雪")) return 71;
  if (value.includes("雾") || value.includes("霾")) return 45;
  if (value.includes("雨")) return 61;
  if (value.includes("阴")) return 3;
  if (value.includes("云")) return 2;
  if (value.includes("晴")) return 1;
  return null;
}

function adjustedTemperature(value, elevation) {
  const temperature = Number(value);
  if (!Number.isFinite(temperature)) return null;
  return Number((temperature - Math.max(0, elevation) * 0.0065).toFixed(1));
}

async function getWeatherApiSource(lat, lon, elevation) {
  const key = process.env.WEATHERAPI_KEY;
  if (!key) return [];
  const url = new URL("https://api.weatherapi.com/v1/forecast.json");
  url.searchParams.set("key", key);
  url.searchParams.set("q", `${lat},${lon}`);
  url.searchParams.set("days", "3");
  url.searchParams.set("aqi", "no");
  url.searchParams.set("alerts", "no");

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`WeatherAPI ${response.status}: ${detail.slice(0, 160)}`);
  }
  const raw = await response.json();
  return (raw?.forecast?.forecastday || []).map((day) => {
    const details = day.day || {};
    return {
      date: day.date,
      source: {
        ...weatherApiSource,
        high: adjustedTemperature(details.maxtemp_c, elevation),
        low: adjustedTemperature(details.mintemp_c, elevation),
        rain: Number.isFinite(Number(details.daily_chance_of_rain))
          ? Number(details.daily_chance_of_rain)
          : null,
        precip: Number.isFinite(Number(details.totalprecip_mm))
          ? Number(Number(details.totalprecip_mm).toFixed(1))
          : null,
        wind: Number.isFinite(Number(details.maxwind_kph)) ? Number(details.maxwind_kph) : null,
        gust: null,
        code: mapWeatherApiCode(details.condition?.code)
      }
    };
  });
}

async function getWeatherbitSource(lat, lon, elevation) {
  const key = process.env.WEATHERBIT_KEY;
  if (!key) return [];
  const url = new URL("https://api.weatherbit.io/v2.0/forecast/daily");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("days", "7");
  url.searchParams.set("units", "M");
  url.searchParams.set("key", key);

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Weatherbit ${response.status}: ${detail.slice(0, 160)}`);
  }
  const raw = await response.json();
  return (raw?.data || []).map((day) => ({
    date: day.datetime,
    source: {
      ...weatherbitSource,
      high: adjustedTemperature(day.max_temp, elevation),
      low: adjustedTemperature(day.min_temp, elevation),
      rain: Number.isFinite(Number(day.pop)) ? Number(day.pop) : null,
      precip: Number.isFinite(Number(day.precip)) ? Number(Number(day.precip).toFixed(1)) : null,
      wind: Number.isFinite(Number(day.wind_spd)) ? Number((Number(day.wind_spd) * 3.6).toFixed(1)) : null,
      gust: Number.isFinite(Number(day.wind_gust_spd)) ? Number((Number(day.wind_gust_spd) * 3.6).toFixed(1)) : null,
      code: mapWeatherbitCode(day.weather?.code)
    }
  }));
}

async function getVisualCrossingSource(lat, lon, elevation) {
  const key = process.env.VISUAL_CROSSING_KEY;
  if (!key) return [];
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 6);
  const startDate = getShanghaiDate(today);
  const endDate = getShanghaiDate(end);
  const url = new URL(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${startDate}/${endDate}`
  );
  url.searchParams.set("unitGroup", "metric");
  url.searchParams.set("include", "days");
  url.searchParams.set("elements", "datetime,tempmax,tempmin,precipprob,precip,windgust,windspeed,conditions,icon");
  url.searchParams.set("contentType", "json");
  url.searchParams.set("key", key);

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Visual Crossing ${response.status}: ${detail.slice(0, 160)}`);
  }
  const raw = await response.json();
  return (raw?.days || []).map((day) => ({
    date: day.datetime,
    source: {
      ...visualCrossingSource,
      high: adjustedTemperature(day.tempmax, elevation),
      low: adjustedTemperature(day.tempmin, elevation),
      rain: Number.isFinite(Number(day.precipprob)) ? Number(day.precipprob) : null,
      precip: Number.isFinite(Number(day.precip)) ? Number(Number(day.precip).toFixed(1)) : null,
      wind: Number.isFinite(Number(day.windspeed)) ? Number(day.windspeed) : null,
      gust: Number.isFinite(Number(day.windgust)) ? Number(day.windgust) : null,
      code: mapVisualCrossingCode(day.icon)
    }
  }));
}

async function getSeniverseSource(lat, lon, elevation) {
  const key = process.env.SENIVERSE_KEY;
  if (!key) return [];
  if (key.startsWith("P")) {
    throw new Error("Seniverse expects the private key (key), but the public key (uid) was provided");
  }
  const url = new URL("https://api.seniverse.com/v3/weather/daily.json");
  url.searchParams.set("key", key);
  url.searchParams.set("location", `${lat}:${lon}`);
  url.searchParams.set("language", "zh-Hans");
  url.searchParams.set("unit", "c");
  url.searchParams.set("start", "0");
  url.searchParams.set("days", "3");

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Seniverse ${response.status}: ${detail.slice(0, 160)}`);
  }
  const raw = await response.json();
  return (raw?.results?.[0]?.daily || []).map((day) => ({
    date: day.date,
    source: {
      ...seniverseSource,
      high: adjustedTemperature(day.high, elevation),
      low: adjustedTemperature(day.low, elevation),
      rain: null,
      precip: Number.isFinite(Number(day.rainfall)) ? Number(Number(day.rainfall).toFixed(1)) : null,
      wind: Number.isFinite(Number(day.wind_speed)) ? Number(day.wind_speed) : null,
      gust: null,
      code: mapSeniverseText(day.code_day, day.text_day)
    }
  }));
}

function mergeAuxiliarySource(forecast, source, items, note) {
  const dates = new Map(forecast.days.map((day) => [day.date, day]));
  let merged = 0;
  for (const item of items) {
    const day = dates.get(item.date);
    if (!day) continue;
    day.sources.push(item.source);
    merged += 1;
  }
  if (merged) {
    forecast.models.push(source.id);
    forecast.sources.push(source);
    forecast.notes.push(note);
  }
  return merged;
}

function mergeSevenTimer(forecast, sevenTimerDays) {
  const dates = new Set(forecast.days.map((day) => day.date));
  for (const item of sevenTimerDays) {
    if (!dates.has(item.date)) continue;
    const day = forecast.days.find((candidate) => candidate.date === item.date);
    day.sources.push(item.source);
  }
  if (sevenTimerDays.some((item) => dates.has(item.date))) {
    forecast.models.push(sevenTimerSource.id);
    forecast.sources.push(sevenTimerSource);
    forecast.notes.push("7Timer 是 GFS 的社区二次产品；温度按标准气温直减率修正到请求海拔，且没有降雨概率字段。");
  }
  return forecast;
}

async function getForecast(lat, lon, elevation) {
  const credentialSignature = getProviderConfigStatus()
    .map((provider) => (provider.configured ? "1" : "0"))
    .join("");
  const key = `${lat.toFixed(3)},${lon.toFixed(3)},${elevation}:${credentialSignature}`;
  const cached = forecastCache.get(key);
  if (cached && Date.now() - cached.createdAt < cacheLifetimeMs) {
    return { ...cached.value, cached: true };
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("elevation", String(elevation));
  url.searchParams.set("daily", dailyVariables.join(","));
  url.searchParams.set("models", models.map((model) => model.id).join(","));
  url.searchParams.set("timezone", "Asia/Shanghai");
  url.searchParams.set("forecast_days", "7");

  const upstream = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TrailWeatherPrototype/0.1 (local hiking comparison tool)"
    },
    signal: AbortSignal.timeout(20_000)
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    throw new Error(`Open-Meteo ${upstream.status}: ${detail.slice(0, 240)}`);
  }

  const raw = await upstream.json();
  const value = parseForecast(raw, elevation);

  const [sevenTimerResult, metNorwayResult, wttrResult] = await Promise.allSettled([
    getSevenTimerSource(lat, lon, elevation),
    getMetNorwaySource(lat, lon, elevation),
    getWttrSource(lat, lon, elevation)
  ]);
  if (sevenTimerResult.status === "fulfilled") {
    mergeSevenTimer(value, sevenTimerResult.value);
    value.upstreamProviders.push("7Timer");
  } else {
    console.warn("[7timer]", sevenTimerResult.reason?.message || sevenTimerResult.reason);
    value.notes.push("7Timer 本次请求失败，对比表保留已成功返回的其他来源。");
  }
  if (metNorwayResult.status === "fulfilled") {
    mergeAuxiliarySource(
      value,
      metNorwaySource,
      metNorwayResult.value,
      "MET Norway 由官方 Locationforecast 接入；温度按标准直减率修正，未提供降雨概率。"
    );
    value.upstreamProviders.push("MET Norway");
  } else {
    console.warn("[met-no]", metNorwayResult.reason?.message || metNorwayResult.reason);
  }
  if (wttrResult.status === "fulfilled") {
    mergeAuxiliarySource(
      value,
      wttrSource,
      wttrResult.value,
      "wttr.in 为社区实例，通常只覆盖 3 天，且上游为 World Weather Online。"
    );
    value.upstreamProviders.push("wttr.in");
  } else {
    console.warn("[wttr]", wttrResult.reason?.message || wttrResult.reason);
  }

  const optionalProviders = [
    {
      providerId: "weatherapi",
      source: weatherApiSource,
      task: getWeatherApiSource(lat, lon, elevation),
      note: "WeatherAPI.com 仅请求免费计划可用的 3 天预报。"
    },
    {
      providerId: "weatherbit",
      source: weatherbitSource,
      task: getWeatherbitSource(lat, lon, elevation),
      note: "Weatherbit 使用永久免费计划的 7 天逐日接口，限非商用。"
    },
    {
      providerId: "visual-crossing",
      source: visualCrossingSource,
      task: getVisualCrossingSource(lat, lon, elevation),
      note: "Visual Crossing 使用免费计划，每天 1,000 条天气记录额度。"
    },
    {
      providerId: "seniverse",
      source: seniverseSource,
      task: getSeniverseSource(lat, lon, elevation),
      note: "心知天气使用永久免费版，仅提供 3 天预报。"
    }
  ];
  const optionalResults = await Promise.allSettled(optionalProviders.map((provider) => provider.task));
  optionalResults.forEach((result, index) => {
    const provider = optionalProviders[index];
    if (result.status === "fulfilled") {
      const merged = mergeAuxiliarySource(value, provider.source, result.value, provider.note);
      if (merged) value.upstreamProviders.push(provider.source.name);
      recordProviderResult(provider.providerId, merged > 0, merged > 0 ? null : "接口返回成功，但没有可用日期");
    } else {
      console.warn(`[${provider.source.id}]`, result.reason?.message || result.reason);
      recordProviderResult(provider.providerId, false, result.reason?.message || "接口请求失败");
    }
  });

  forecastCache.set(key, { createdAt: Date.now(), value });
  return { ...value, cached: false };
}

function serveFile(pathname, response) {
  let relativePath = pathname === "/" ? `${projectPath}index.html` : pathname;
  try {
    relativePath = decodeURIComponent(relativePath);
  } catch {
    sendJson(response, 400, { error: "Bad path encoding" });
    return;
  }

  if (relativePath.endsWith("/")) relativePath += "index.html";
  if (relativePath.split("/").some((segment) => segment.startsWith("."))) {
    sendJson(response, 403, { error: "Hidden files are not served" });
    return;
  }
  const filePath = path.resolve(designsRoot, `.${relativePath}`);

  if (!filePath.startsWith(`${designsRoot}${path.sep}`)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  let stats;
  try {
    stats = statSync(filePath);
  } catch {
    sendJson(response, 404, { error: "Not found", path: relativePath });
    return;
  }
  if (!stats.isFile()) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Content-Length": stats.size,
    "Cache-Control": [".html", ".js", ".jsx", ".css"].includes(extension) ? "no-cache" : "public, max-age=60"
  });
  createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "trailweather-prototype",
      models: models.map((model) => model.id),
      time: new Date().toISOString()
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/provider-status") {
    sendJson(response, 200, {
      providers: getProviderConfigStatus(),
      freeOnly: true
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/weather") {
    const lat = Number(requestUrl.searchParams.get("lat"));
    const lon = Number(requestUrl.searchParams.get("lon"));
    const elevation = Number(requestUrl.searchParams.get("elevation") || 0);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      sendJson(response, 400, { error: "Invalid coordinates" });
      return;
    }
    if (!Number.isFinite(elevation) || elevation < -50 || elevation > 5000) {
      sendJson(response, 400, { error: "Invalid elevation" });
      return;
    }

    try {
      const forecast = await getForecast(lat, lon, Math.round(elevation));
      sendJson(response, 200, forecast);
    } catch (error) {
      console.error("[weather]", error);
      sendJson(response, 502, {
        error: "Weather upstream unavailable",
        detail: error.message || "Unknown upstream error"
      });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  if (requestUrl.pathname === "/") {
    response.writeHead(302, { Location: `${projectPath}index.html` });
    response.end();
    return;
  }

  serveFile(requestUrl.pathname, response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`TrailWeather prototype: http://localhost:${port}${projectPath}index.html`);
  console.log("API proxy: /api/weather?lat=23.268&lon=114.060&elevation=1296");
});
