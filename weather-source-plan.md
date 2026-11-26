# 天气源接入计划

更新日期：2026-10-21

## 已经可运行

- Open-Meteo：当前地点可返回数据的 12 个多国数值模式，包括 ECMWF、NOAA GFS、DWD ICON、CMA GRAPES、JMA、MET Norway、UKMO、Météo-France、Canada GEM、KNMI、DMI、GeoSphere。
- 7Timer：辅助平台行，底层仍为 NOAA GFS；没有降雨概率字段时保持缺失。
- MET Norway：官方 Locationforecast 平台行，服务端带上合法 User-Agent 并缓存。
- wttr.in：社区平台行，通常只有 3 天；第 4–7 天明确显示缺失。

## 无需登录、可继续补

当前本机没有发现其他稳定、合法且无需账号的公共接口。公开网页抓取类接口不纳入，以避免接口频繁失效和许可风险。

## 需要免费账号或 API Key

只接入永久免费或明确长期免费额度的方案：

1. Visual Crossing：免费 1,000 records/day，无需信用卡，每次可查未来 7 天。
2. Weatherbit：免费 50 次/日，每次可查未来 7 天，仅限非商用。
3. 心知天气：永久免费版，每次可查未来 3 天、城市级、10 万次/月。
4. WeatherAPI.com：试用后自动进入免费计划，每次可查未来 3 天、10 万次/月。

这里的 7 天 / 3 天是预报范围，不是免费账户有效期。

具体获取步骤见 `FREE-KEY-GUIDE.md`。

## 需要开发者/企业账号

- 和风天气：当前官方定价为按量计费，不纳入免费版。
- 彩云天气：未确认到稳定的长期免费额度，不纳入免费版。
- Apple WeatherKit、Azure Maps、Xweather / AerisWeather：需要付费或高门槛开发者账号，不纳入。

## 安全接入方式

密钥只放服务端 `.env` 或本机环境变量，前端只能看到“已配置/未配置”的状态。正式上线前逐项确认：

- 商用许可和调用额度。
- API Host 与所在区域。
- 缓存策略、User-Agent 和来源标注。
- 速率限制与失败降级。
- 是否允许把数据二次展示给终端用户。

免费 Key 的注册、控制台位置、`.env` 写入和验证方法见 `FREE-KEY-GUIDE.md`。
