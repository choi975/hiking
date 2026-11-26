window.WEATHER_PROVIDERS = [
  {
    "id": "open-meteo",
    "name": "Open-Meteo",
    "category": "全球",
    "status": "live",
    "statusLabel": "当前已接入",
    "auth": "无需 Key（非商用）",
    "horizon": "7 天，默认；可申请至 16 天",
    "strength": "一个接口可拆分 ECMWF、NOAA GFS、DWD ICON、CMA GRAPES 等模式，最适合做首版交叉对比。",
    "caution": "免费层面向非商用，文档标注 10,000 次/日、600 次/分；生产环境需评估许可与缓存。",
    "docs": "https://open-meteo.com/en/docs",
    "endpoint": "https://api.open-meteo.com/v1/forecast?latitude=23.27&longitude=114.07&models=ecmwf_ifs025,gfs_seamless,icon_seamless,cma_grapes_global&daily=weather_code,temperature_2m_max,precipitation_probability_max&timezone=Asia%2FShanghai",
    "live": true
  },
  {
    "id": "qweather",
    "name": "和风天气 QWeather",
    "category": "国内优先",
    "status": "key",
    "statusLabel": "需 Key / 项目",
    "auth": "API Key 或 JWT",
    "horizon": "常用 7 / 15 天，按产品而定",
    "strength": "中文地名、灾害预警、生活指数、空气质量、潮汐等国内徒步场景信息完整。",
    "caution": "需注册并创建项目；API Host、额度与商用权限以控制台和套餐为准。",
    "docs": "https://developer.qweather.com/",
    "endpoint": "https://devapi.qweather.com/v7/weather/7d?location=101280301&key=YOUR_KEY",
    "live": false
  },
  {
    "id": "caiyun",
    "name": "彩云天气 Caiyun",
    "category": "国内优先",
    "status": "key",
    "statusLabel": "需 Token",
    "auth": "Token",
    "horizon": "逐分钟至逐日，按接口",
    "strength": "1 km 空间精度、未来 2 小时逐分钟降水，适合判断出发前突发的短时强降雨。",
    "caution": "强项是临近降水，不是长周期山脊风的唯一依据；额度与商用权限按套餐。",
    "docs": "https://docs.caiyunapp.com/weather-api/",
    "endpoint": "https://api.caiyunapp.com/v2.6/YOUR_TOKEN/114.07,23.27/daily?alert=true",
    "live": false
  },
  {
    "id": "seniverse",
    "name": "心知天气 Seniverse",
    "category": "国内优先",
    "status": "key",
    "statusLabel": "需免费 Key",
    "auth": "私钥 key（普通请求）",
    "horizon": "永久免费 · 每次可查未来 3 天",
    "strength": "中文天气现象与生活数据齐全，适合补充国内用户熟悉的文字预报。",
    "caution": "永久免费版每次可查未来 3 天，提供城市级数据；需使用私钥 key，而不是公钥 uid。",
    "docs": "https://seniverse.yuque.com/books/share/7ed1f34a-ec7f-4f56-8f69-4c5bd9507ca3",
    "endpoint": "https://api.seniverse.com/v3/weather/daily.json?key=YOUR_KEY&location=huizhou&language=zh-Hans&unit=c&start=0&days=3",
    "live": false
  },
  {
    "id": "amap",
    "name": "高德地图天气",
    "category": "国内优先",
    "status": "key",
    "statusLabel": "需 Key",
    "auth": "高德开放平台 Key",
    "horizon": "当前与未来数日，按行政区",
    "strength": "和 POI、逆地理编码、路线规划联动方便，适合做地点搜索与导航入口。",
    "caution": "天气通常按行政区返回，山顶点位需理解其空间分辨率，不能当作山顶实测。",
    "docs": "https://lbs.amap.com/api/webservice/guide/api/weatherinfo",
    "endpoint": "https://restapi.amap.com/v3/weather/weatherInfo?key=YOUR_KEY&city=441300&extensions=all",
    "live": false
  },
  {
    "id": "7timer",
    "name": "7Timer!",
    "category": "开源试验",
    "status": "live",
    "statusLabel": "当前已接入",
    "auth": "无需 Key",
    "horizon": "7 天，3 小时间隔",
    "strength": "基于 NOAA GFS 的免费数值预报，适合做轻量备用或气象可视化。",
    "caution": "本次作为辅助来源接入。它没有降雨概率字段，且不要把 GFS 二次封装误当成独立气象来源。",
    "docs": "https://www.7timer.info/doc.php",
    "endpoint": "https://www.7timer.info/bin/api.pl?lon=114.07&lat=23.27&product=civil&output=json",
    "live": true
  },
  {
    "id": "met-no",
    "name": "MET Norway",
    "category": "开源试验",
    "status": "live",
    "statusLabel": "当前已接入",
    "auth": "合法 User-Agent + 引用",
    "horizon": "全球逐小时，约 9 天",
    "strength": "免费全球逐小时预报，适合作为海外或备用交叉源。",
    "caution": "必须设置有效 User-Agent、遵守缓存规则；当前已由服务端代理接入，且未提供降雨概率字段。",
    "docs": "https://api.met.no/weatherapi/documentation",
    "endpoint": "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=23.27&lon=114.07",
    "live": true
  },
  {
    "id": "wttr",
    "name": "wttr.in",
    "category": "开源试验",
    "status": "live",
    "statusLabel": "当前已接入 · 3 天",
    "auth": "无需 Key",
    "horizon": "3 天",
    "strength": "curl 友好的 JSON / 文本输出，适合调试和快速查看。",
    "caution": "非正式公共实例，缺少生产 SLA；预报只有 3 天，不满足首版 7 天目标。",
    "docs": "https://github.com/chubin/wttr.in",
    "endpoint": "https://wttr.in/Huizhou?format=j1",
    "live": true
  },
  {
    "id": "weatherapi",
    "name": "WeatherAPI.com",
    "category": "全球商业",
    "status": "key",
    "statusLabel": "需 Key",
    "auth": "API Key",
    "horizon": "免费计划：每次可查未来 3 天",
    "strength": "接口简单，免费额度 100K 次/月，含实时、逐日、逐小时和空气质量。",
    "caution": "试用结束后自动进入长期免费计划；未来 3 天指单次预报范围，不是免费有效期。",
    "docs": "https://www.weatherapi.com/pricing.aspx",
    "endpoint": "https://api.weatherapi.com/v1/forecast.json?key=YOUR_KEY&q=23.27,114.07&days=3&aqi=no&alerts=no",
    "live": false
  },
  {
    "id": "visual-crossing",
    "name": "Visual Crossing",
    "category": "全球商业",
    "status": "key",
    "statusLabel": "需 Key",
    "auth": "API Key",
    "horizon": "免费额度每日重置，可查未来 7 天",
    "strength": "历史、当前与未来统一接口，免费 1,000 records/day，适合做回看与地点气候基线。",
    "caution": "免费额度按“天气记录”而非纯请求数计费，批量查询前要看计算方式。",
    "docs": "https://www.visualcrossing.com/weather-api/",
    "endpoint": "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/23.27,114.07?key=YOUR_KEY&include=days",
    "live": false
  },
  {
    "id": "weatherbit",
    "name": "Weatherbit",
    "category": "全球商业",
    "status": "key",
    "statusLabel": "需 Key",
    "auth": "API Key",
    "horizon": "免费计划：每次可查未来 7 天",
    "strength": "免费层提供未来 7 天逐日预报，适合做长期对照。",
    "caution": "免费层 50 次/日且限非商用，1 req/s；本工具使用 10 分钟缓存控制请求量。",
    "docs": "https://www.weatherbit.io/pricing",
    "endpoint": "https://api.weatherbit.io/v2.0/forecast/daily?lat=23.27&lon=114.07&days=7&key=YOUR_KEY",
    "live": false
  },
  {
    "id": "tomorrow",
    "name": "Tomorrow.io",
    "category": "全球商业",
    "status": "key",
    "statusLabel": "需 Key",
    "auth": "API Key",
    "horizon": "逐小时 / 逐日，按套餐",
    "strength": "概率型预报、微气候和高级图层丰富，可补雷电、洪水和土壤等户外风险。",
    "caution": "免费额度会变化，生产前确认商用条款；高级图层价格和可用区域需核对。",
    "docs": "https://docs.tomorrow.io/reference/welcome",
    "endpoint": "https://api.tomorrow.io/v4/weather/forecast?location=23.27,114.07&apikey=YOUR_KEY",
    "live": false
  },
  {
    "id": "openweather",
    "name": "OpenWeatherMap",
    "category": "全球商业",
    "status": "key",
    "statusLabel": "需 Key",
    "auth": "API Key",
    "horizon": "免费 5 天 / 3 小时",
    "strength": "开发者生态成熟、文档和样例多，适合快速接天气图标和基本要素。",
    "caution": "免费 5 Day / 3 Hour Forecast 不是 7 天逐日；国内高精度并不一定是其强项。",
    "docs": "https://openweathermap.org/api",
    "endpoint": "https://api.openweathermap.org/data/2.5/forecast?lat=23.27&lon=114.07&appid=YOUR_KEY&units=metric",
    "live": false
  },
  {
    "id": "azure-maps",
    "name": "Azure Maps Weather",
    "category": "全球商业",
    "status": "key",
    "statusLabel": "需 Azure Key",
    "auth": "Azure Maps 订阅 Key",
    "horizon": "逐日、逐小时，按 API",
    "strength": "企业级地图能力与天气、路线、严重天气图层可以统一使用。",
    "caution": "账单、区域可用性和 API 版本需按 Azure 门户核对；对小产品可能偏重。",
    "docs": "https://learn.microsoft.com/en-us/rest/api/maps/weather/get-daily-forecast",
    "endpoint": "https://atlas.microsoft.com/weather/forecast/daily/json?api-version=1.1&query=23.27,114.07&subscription-key=YOUR_KEY",
    "live": false
  },
  {
    "id": "weatherkit",
    "name": "Apple WeatherKit",
    "category": "平台定向",
    "status": "key",
    "statusLabel": "需 Apple 开发者",
    "auth": "JWT / Apple Developer",
    "horizon": "逐小时 / 逐日，按 REST 产品",
    "strength": "适合 Apple 生态产品，天气、分钟级降水和预警接口较完整。",
    "caution": "需要 Apple Developer 账号、证书与服务令牌，接入门槛高于普通 API Key。",
    "docs": "https://developer.apple.com/documentation/weatherkitrestapi",
    "endpoint": "WeatherKit REST：使用 Apple Developer 账号签发 JWT 后请求 forecast 端点",
    "live": false
  },
  {
    "id": "xweather",
    "name": "Xweather / AerisWeather",
    "category": "全球商业",
    "status": "key",
    "statusLabel": "需 Key",
    "auth": "Client ID + Secret",
    "horizon": "逐小时、逐日与专题图层",
    "strength": "面向专业气象应用，长期提供细化预报、地图图层和严重天气数据。",
    "caution": "价格和文档入口随品牌更名变化，适合有明确专业需求时询价。",
    "docs": "https://docs.aerisweather.com/weather-api/reference",
    "endpoint": "使用 Xweather 控制台签发的 Client ID / Secret 请求 forecast API",
    "live": false
  }
];

window.WEATHER_MODELS = {
  "ecmwf_ifs025": {
    "name": "ECMWF",
    "org": "欧洲中期天气预报中心",
    "model": "IFS",
    "short": "欧洲",
    "color": "#17664f"
  },
  "gfs_seamless": {
    "name": "NOAA GFS",
    "org": "美国国家海洋和大气管理局",
    "model": "GFS",
    "short": "美国",
    "color": "#2e6687"
  },
  "icon_seamless": {
    "name": "DWD ICON",
    "org": "德国气象局",
    "model": "ICON",
    "short": "德国",
    "color": "#c26b37"
  },
  "cma_grapes_global": {
    "name": "CMA GRAPES",
    "org": "中国气象局",
    "model": "GRAPES Global",
    "short": "中国",
    "color": "#7b5144"
  },
  "jma_seamless": {
    "name": "JMA GSM",
    "org": "日本气象厅",
    "model": "GSM / MSM",
    "short": "日本",
    "color": "#b06b3f"
  },
  "metno_seamless": {
    "name": "MET Norway",
    "org": "挪威气象研究所",
    "model": "MEPS / ECMWF",
    "short": "挪威",
    "color": "#437f9c"
  },
  "ukmo_seamless": {
    "name": "UKMO",
    "org": "英国气象局",
    "model": "UKMO Seamless",
    "short": "英国",
    "color": "#4a6e9d"
  },
  "meteofrance_seamless": {
    "name": "Météo-France",
    "org": "法国气象局",
    "model": "AROME / ARPEGE",
    "short": "法国",
    "color": "#596fc4"
  },
  "gem_seamless": {
    "name": "Canada GEM",
    "org": "加拿大环境与气候变化部",
    "model": "GEM Seamless",
    "short": "加拿大",
    "color": "#a64c52"
  },
  "bom_access_global": {
    "name": "BOM ACCESS",
    "org": "澳大利亚气象局",
    "model": "ACCESS Global",
    "short": "澳大利亚",
    "color": "#8b6b43"
  },
  "knmi_seamless": {
    "name": "KNMI",
    "org": "荷兰皇家气象研究所",
    "model": "HARMONIE / ECMWF",
    "short": "荷兰",
    "color": "#557f78"
  },
  "dmi_seamless": {
    "name": "DMI",
    "org": "丹麦气象研究所",
    "model": "HARMONIE / ECMWF",
    "short": "丹麦",
    "color": "#9d4f70"
  },
  "geosphere_seamless": {
    "name": "GeoSphere",
    "org": "奥地利气象与地球动力学中心",
    "model": "AROME / ECMWF",
    "short": "奥地利",
    "color": "#7b6a9c"
  },
  "kma_seamless": {
    "name": "KMA",
    "org": "韩国气象厅",
    "model": "UM / LDAPS",
    "short": "韩国",
    "color": "#477b7a"
  },
  "ecmwf_aifs025": {
    "name": "ECMWF AIFS",
    "org": "欧洲中期天气预报中心",
    "model": "AI Forecast",
    "short": "AI 模式",
    "color": "#2d8c70"
  },
  "metno_direct": {
    "name": "MET Norway",
    "org": "挪威气象研究所 · 官方接口",
    "model": "Locationforecast",
    "short": "挪威平台",
    "color": "#3d829d"
  },
  "wttr_in": {
    "name": "wttr.in / WWO",
    "org": "社区实例 · WWO 上游",
    "model": "3 天预报",
    "short": "社区平台",
    "color": "#8b7950"
  },
  "weatherapi_key": {
    "name": "WeatherAPI.com",
    "org": "免费额度 · 未来 3 天",
    "model": "Forecast API",
    "short": "免费 Key",
    "color": "#2c78c6"
  },
  "weatherbit_key": {
    "name": "Weatherbit",
    "org": "免费额度 · 未来 7 天",
    "model": "Daily Forecast",
    "short": "免费 Key",
    "color": "#a45a45"
  },
  "visual_crossing_key": {
    "name": "Visual Crossing",
    "org": "免费额度 · 未来 7 天",
    "model": "Timeline API",
    "short": "免费 Key",
    "color": "#4e7f63"
  },
  "seniverse_key": {
    "name": "心知天气",
    "org": "永久免费版 · 未来 3 天",
    "model": "Daily Forecast",
    "short": "免费 Key",
    "color": "#8b6d48"
  },
  "7timer_gfs": {
    "name": "7Timer / GFS",
    "org": "NOAA GFS · 社区服务",
    "model": "3 小时间隔",
    "short": "社区",
    "color": "#8a6d2d"
  }
};
