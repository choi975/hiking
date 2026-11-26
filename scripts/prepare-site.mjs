import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectDirectory, "_site");
const standaloneFiles = [
  "styles-a.css",
  "places.js",
  "providers.js",
  "app.js",
  "Free Key Guide.html",
  "free-key-guide.css",
  "free-key-guide.png"
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const fileName of standaloneFiles) {
  await cp(path.join(projectDirectory, fileName), path.join(outputDirectory, fileName));
}

await cp(path.join(projectDirectory, "fonts"), path.join(outputDirectory, "fonts"), {
  recursive: true
});
await cp(path.join(projectDirectory, "data"), path.join(outputDirectory, "data"), {
  recursive: true
});

const indexSource = await readFile(path.join(projectDirectory, "index.html"), "utf8");
const staticIndex = indexSource.replace(
  '<script src="places.js?v=4"></script>',
  '<script>window.HIKING_STATIC_MODE = true;</script>\n    <script src="places.js?v=4"></script>'
);

await writeFile(path.join(outputDirectory, "index.html"), staticIndex, "utf8");
await writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8");

console.log("已生成 GitHub Pages 静态站点目录 _site。");
