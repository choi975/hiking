# 山候 · 徒步天气研判台

面向广东惠州及周边的徒步天气对比工具。首屏先筛地点，再点击任一候选点查看未来 7 天预报。完成免费 Key 配置后，当前环境实测为 8 个平台、19 条预报来源。

## 本地运行

双击项目根目录的 `启动天气工具.cmd`，脚本会检查天气服务并在浏览器中打开正确地址。

也可以在 PowerShell 中手动启动：

```powershell
cd E:\Codex_Workspace\hiking\designs\hiking-weather-tool
node server.mjs
```

打开：

```text
http://localhost:4311/hiking-weather-tool/index.html
```

请使用上面的 `http://` 地址访问页面。直接双击 `index.html` 会通过 `file://` 打开，浏览器无法调用本地天气接口。

默认端口为 `4311`，可用环境变量 `PORT` 覆盖。

## GitHub Pages 部署

公开地址：

```text
https://choi975.github.io/hiking/
```

GitHub Pages 只能提供静态文件，因此线上版本由 GitHub Actions 在构建阶段调用天气接口，把 25 个地点的未来一周预报写成静态 JSON，再发布到 Pages。API Key 只保存在仓库的 Actions Secrets 中：

```text
VISUAL_CROSSING_KEY
WEATHERBIT_KEY
SENIVERSE_KEY
WEATHERAPI_KEY
```

部署工作流位于 `.github/workflows/pages.yml`。它会：

- 在每次推送到 `main` 时重新构建并发布。
- 按北京时间每天 08:20、20:20 自动更新天气快照。
- 构建期间调用本地聚合服务，发布目录中只包含前端资源和脱敏后的天气 JSON。

手动执行完整构建：

```powershell
npm run build
```

生成结果位于 `_site/`，该目录和天气数据缓存已加入 `.gitignore`。

## 已实现

- 25 个惠州及周边候选点位，可按城市和关键词筛选。
- 星标保存在本机 `localStorage`，用于标记候选地点。
- 「晴空」视觉系统：Noto Sans SC、Manrope、雾白 / 冰蓝配色和大圆角卡片。
- 地点候选栏可折叠，折叠后为中间天气表格腾出更多空间。
- 「天气」表头直接切换 7 天日期，温度按山顶点位海拔降尺度。
- 顶部摘要同步展示选中日期的天气、最高/最低温、降雨概率与风速的范围、均值和中位数。
- 当日研判和判断阈值合并进顶部天气摘要；地点提醒保留在页面底部。
- 免登录源：Open-Meteo 多国数值模式、7Timer、MET Norway、wttr.in。
- 免费 Key 源：Visual Crossing、Weatherbit、WeatherAPI、心知天气。
- 雷暴、降雨、阵风和高温的启发式风险判断。
- 缺失值保留、来源分歧、置信度和数据更新时间可见。
- 16 个天气接口的接入条件、能力、限制与示例请求。
- 桌面双栏、手机抽屉式响应布局。

## 数据说明

实时请求由本地 `server.mjs` 聚合 Open-Meteo、7Timer、MET Norway、wttr.in 与四个免费 Key 平台，避免前端跨域和密钥暴露。某一来源不可用时会保留其他来源；开放接口整体不可用时显示错误，不会自动伪装成实时数据；只有在用户主动点击后才加载演示数据。

需要账号的免费接口使用根目录 `.env` 配置，参考 `Free Key Guide.html`、`FREE-KEY-GUIDE.md` 和 `.env.example`。不要通过聊天发送 API Key。

当前版本只接入永久免费或明确免费额度的来源。正式发布前仍需复核各平台免费条款、专业预警、点位入口与路线开放状态。
