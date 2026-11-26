# 山候 · 惠州周边徒步天气工具研究底稿

核验日期：2026-10-21  
工作范围：广东惠州及周边城市，以 1–3.5 小时车程内可当日往返或周末出行的山野点位为主。

## 一、天气接口清单

### 首版建议

| 接口 | 接入条件 | 预报长度 | 适合做什么 | 需要注意 |
| --- | --- | --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/en/docs) | 无需 Key，非商用免费层 | 默认 7 天，可请求至 16 天 | 首版多模型交叉对比；同一入口下可拆 ECMWF、NOAA GFS、DWD ICON、CMA GRAPES | 免费层文档标注 10,000 次/日、600 次/分；商业使用需许可 |
| [和风天气 QWeather](https://developer.qweather.com/) | API Key / JWT | 常用 7 / 15 天，按产品 | 国内地名、灾害预警、空气质量和生活指数 | 需注册项目，额度与 API Host 按控制台配置 |
| [彩云天气](https://docs.caiyunapp.com/weather-api/) | Token | 逐分钟至逐日，按接口 | 出发前 2 小时短临降水、1 km 空间精度 | 长周期山脊风不应只依赖彩云；额度和商用按套餐 |
| [心知天气 Seniverse](https://seniverse.yuque.com/books/share/7ed1f34a-ec7f-4f56-8f69-4c5bd9507ca3) | API Key / 签名 | 逐日、逐小时，长预报按套餐 | 中文文字天气、生活数据补充 | 不同套餐天数与商业许可不同 |
| [高德地图天气](https://lbs.amap.com/api/webservice/guide/api/weatherinfo) | 高德 Key | 当前与未来数日 | POI、逆地理编码、路线规划联动 | 通常按行政区返回，不能当作山顶点位实测 |

### 第二梯队与对照源

| 接口 | 接入条件 | 预报长度 | 备注 |
| --- | --- | --- | --- |
| [7Timer!](https://www.7timer.info/doc.php) | 无需 Key | 7 天，3 小时间隔 | 已接入为辅助平台行；基于 NOAA GFS 的社区/实验型服务，不应与 GFS 当作独立来源重复计算 |
| [MET Norway](https://api.met.no/weatherapi/documentation) | 合法 User-Agent，引用来源 | 全球逐小时，约 9 天 | 必须缓存并遵守条款；本次开发环境请求返回 403，需部署后复核 |
| [WeatherAPI.com](https://www.weatherapi.com/pricing.aspx) | API Key | 免费计划每次可查未来 3 天 | 免费 100K 次/月；这里的天数是预报范围，不是免费期限 |
| [Visual Crossing](https://www.visualcrossing.com/weather-api/) | API Key | 逐日长预报，按产品 | 免费 1,000 weather records/day；适合当前、历史和气候基线统一查询 |
| [Weatherbit](https://www.weatherbit.io/pricing) | API Key | 免费计划每次可查未来 7 天 | 免费 50 次/日、非商用；这里的天数是预报范围，不是免费期限 |
| [Tomorrow.io](https://docs.tomorrow.io/reference/welcome) | API Key | 逐小时 / 逐日，按套餐 | 概率预报及雷电、洪水、土壤等高级户外图层 |
| [OpenWeatherMap](https://openweathermap.org/api) | API Key | 免费 5 天 / 3 小时 | 生态成熟，但不满足免费 7 天逐日目标 |
| [Azure Maps Weather](https://learn.microsoft.com/en-us/rest/api/maps/weather/get-daily-forecast) | Azure 订阅 Key | 逐日、逐小时 | 适合企业地图与路线、严重天气图层统一使用 |
| [Apple WeatherKit REST](https://developer.apple.com/documentation/weatherkitrestapi) | Apple Developer + JWT | 逐小时 / 逐日 | Apple 生态方便，接入门槛高于普通 API Key |
| [Xweather / AerisWeather](https://docs.aerisweather.com/weather-api/reference) | Client ID + Secret | 逐小时、逐日与专题图层 | 专业气象产品，通常需要询价 |
| [wttr.in](https://github.com/chubin/wttr.in) | 无需 Key | 3 天 | JSON/文本调试方便；公共实例无生产 SLA，不建议作为正式数据源 |

结论：当前已接入 Open-Meteo 多国模式、7Timer、MET Norway 与 wttr.in。需要账号的来源只保留永久免费或明确长期免费额度的 Visual Crossing、Weatherbit、心知天气和 WeatherAPI；和风天气当前按量计费，彩云天气未确认稳定长期免费额度，均不纳入本工具。

## 二、候选徒步点

以下清单用于“先筛地点”，不是官方路线库。海拔、入口、开放状态、轨迹和强度仍需正式出发前复核。

### 惠州本地

| 地点 | 区域 | 海拔 | 类型 / 强度 | 首版筛选理由 |
| --- | --- | ---: | --- | --- |
| 罗浮山 · 飞云顶 | 博罗 | 1296 m | 山峰 / 高强度 | 惠州经典大爬升，检验高海拔降尺度与长上坡 |
| 南昆山 · 天堂顶 | 龙门 | 1228 m | 山峰 / 高强度 | 森林、云雾和湿滑风险突出 |
| 象头山 | 博罗 | 1023 m | 山峰 / 高强度 | 森林溪谷型，湿热和保护区开放状态需另核 |
| 白云嶂 | 惠阳 | 1003 m | 山脊 / 高强度 | 暴露山脊，适合检验阵风与热风险 |
| 大南山 | 惠东 | 1105 m | 山脊 / 高强度 | 草甸与日出路线，大风影响明显 |
| 银瓶嘴 | 惠阳 / 东莞交界 | 898 m | 山峰 / 高强度 | 深莞惠热门训练山，雨后岩石湿滑 |
| 九龙峰 | 惠东 | 681 m | 山峰 / 进阶 | 半日轻装训练 |
| 高榜山 | 惠城 | 229 m | 城市山 / 入门 | 下班后与新手路线 |
| 红花湖环湖线 | 惠城 | 48 m | 绿道 / 入门 | 家庭、恢复和日常天气参考 |
| 梁化国家森林公园 | 惠东 | 380 m | 森林路线 / 轻量 | 避晒型林道，雨后泥泞 |
| 黑排角海岸线 | 惠东 | 18 m | 海岸线 / 轻量 | 风向、浪涌和潮汐另需数据 |
| 双月湾 · 大星山 | 惠东 | 108 m | 海岬 / 入门 | 海景轻徒步与日落路线 |
| 酥醪观古道 | 博罗 | 520 m | 古道 / 轻量 | 罗浮山天气较差时的低风险替代 |
| 南昆山 · 中坪尾竹林 | 龙门 | 430 m | 竹林路线 / 轻量 | 亲子与避晒型轻徒步 |

### 周边城市

| 地点 | 城市 | 海拔 | 类型 / 强度 | 首版筛选理由 |
| --- | --- | ---: | --- | --- |
| 桂山 | 河源 | 1056 m | 山峰 / 高强度 | 河源经典大爬升 |
| 万绿湖环线 | 河源 | 116 m | 湖畔 / 轻量 | 湖景与周末轻徒步 |
| 白水寨 | 广州 | 828 m | 景区山 / 进阶 | 石阶、瀑布和景区天气 |
| 牛牯嶂 | 广州 | 1084 m | 山峰 / 高强度 | 野外路线与湿滑风险 |
| 银瓶山 | 东莞 | 898 m | 山峰 / 进阶 | 深莞惠热门训练山 |
| 观音山 | 东莞 | 488 m | 景区山 / 轻量 | 家庭与半日路线 |
| 梧桐山 | 深圳 | 944 m | 山峰 / 高强度 | 深圳最高峰，山顶风与城市热岛差异 |
| 七娘山 | 深圳 | 869 m | 山峰 / 高强度 | 海景山脊、局地天气快变 |
| 大雁顶 | 深圳 | 801 m | 山脊 / 高强度 | 草坡暴露、信号与撤离线 |
| 莲花山 | 汕尾 | 1337 m | 山峰 / 远线挑战 | 粤东高峰，适合作为高难度长线 |
| 丹霞山 | 韶关 | 409 m | 景区山地 / 轻量 | 距离较远的周末自驾备选 |

## 三、首版产品判断

1. 气温、降水概率、累计降水、最大风速和阵风必须分开显示。徒步决策里，“降雨概率 30%”与“累计 20 mm”不是同一件事。
2. 所有温度按山顶点位海拔降尺度；低海拔城市预报不能直接代表飞云顶或天堂顶。
3. 同一接口下的数值模式不是独立平台。界面必须明确标出这一点，避免制造“多个平台都同意”的错觉。
4. 缺失数据保留空白。CMA GRAPES 在长时段缺字段时不应补零。
5. 风险结论只采用启发式：雷暴、强阵风、高降雨和高温是主要否决项；真实出发还依赖路线暴露、队伍能力、撤离线、保护区开放和实时预警。

## 四、源码入口

- 前端原型：`designs/hiking-weather-tool/index.html`
- 实时取数代理：`designs/hiking-weather-tool/server.mjs`
- 地点候选项：`designs/hiking-weather-tool/places.js`
- 天气接口清单：`designs/hiking-weather-tool/providers.js`
