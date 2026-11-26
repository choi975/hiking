import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(projectDirectory, "data");
const weatherDirectory = path.join(dataDirectory, "weather");
const port = Number(process.env.STATIC_BUILD_PORT || 4312);
const baseUrl = `http://127.0.0.1:${port}`;

const placesSource = await readFile(path.join(projectDirectory, "places.js"), "utf8");
const placesContext = { window: {} };
vm.runInNewContext(placesSource, placesContext, { filename: "places.js" });

const requestedLimit = Number(process.env.STATIC_BUILD_LIMIT || 0);
const places =
  requestedLimit > 0
    ? placesContext.window.HIKING_PLACES.slice(0, requestedLimit)
    : placesContext.window.HIKING_PLACES;

if (!Array.isArray(places) || !places.length) {
  throw new Error("places.js 中没有可用地点。");
}

const serverProcess = spawn(process.execPath, ["server.mjs"], {
  cwd: projectDirectory,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverLog = "";
serverProcess.stdout.on("data", (chunk) => {
  serverLog += chunk.toString();
});
serverProcess.stderr.on("data", (chunk) => {
  serverLog += chunk.toString();
});

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`天气服务提前退出。\n${serverLog}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // 服务启动期间连接失败是预期状态，下一轮继续检查。
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`等待天气服务启动超时。\n${serverLog}`);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || `请求失败：${response.status}`);
  }

  return payload;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  );
  return results;
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

try {
  await waitForServer();
  await rm(weatherDirectory, { recursive: true, force: true });
  await mkdir(weatherDirectory, { recursive: true });

  const generatedAt = new Date().toISOString();
  const manifestPlaces = await mapWithConcurrency(places, 3, async (place) => {
    const query = new URLSearchParams({
      lat: String(place.lat),
      lon: String(place.lon),
      elevation: String(place.elevation),
      place: place.name
    });
    const forecast = await fetchJson(`${baseUrl}/api/weather?${query.toString()}`);
    const sourceIds = new Set(
      (forecast.days || []).flatMap((day) => (day.sources || []).map((source) => source.id))
    );

    await writeJson(path.join(weatherDirectory, `${place.id}.json`), {
      ...forecast,
      placeId: place.id,
      placeName: place.name
    });

    return {
      id: place.id,
      name: place.name,
      dayCount: forecast.days?.length || 0,
      sourceCount: sourceIds.size,
      updatedAt: forecast.generatedAt || generatedAt
    };
  });

  const providerStatus = await fetchJson(`${baseUrl}/api/provider-status`);
  await writeJson(path.join(dataDirectory, "provider-status.json"), {
    ...providerStatus,
    generatedAt
  });
  await writeJson(path.join(dataDirectory, "manifest.json"), {
    generatedAt,
    placeCount: manifestPlaces.length,
    places: manifestPlaces
  });

  console.log(`已生成 ${manifestPlaces.length} 个地点的天气快照。`);
} finally {
  serverProcess.kill();
}
