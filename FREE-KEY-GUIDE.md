# 免费天气 Key 获取指南

更新时间：2026-10-21

只使用永久免费或明确长期免费额度的接口。和风天气当前采用按量计费，彩云天气没有确认到稳定的长期免费额度，因此工具不会把它们作为免费来源展示。

“未来 7 天 / 未来 3 天”是每次查询能查看的预报范围，不是免费资格的有效期。免费账户和每日 / 每月额度不会因为这几天过去而失效。

> 不要把自己的 Key 发到聊天里。把 Key 写进项目根目录的 `.env` 文件即可，浏览器不会看到它。

## 推荐顺序

### 1. Visual Crossing — 最适合做主对照源

- 免费额度：每天 1,000 条 weather records。
- 预报长度：可以请求未来 7 天。
- 费用：注册无需信用卡。
- 获取入口：[Visual Crossing 免费注册](https://www.visualcrossing.com/sign-up)

步骤：

1. 打开注册页，填写邮箱和密码。
2. 完成邮箱验证并登录。
3. 进入 **Account / Manage Account** 或控制台首页，找到 **API Key**。
4. 复制这串 Key。
5. 在本项目目录创建 `.env`，加入：

```text
VISUAL_CROSSING_KEY=你的Key
```

### 2. Weatherbit — 额外未来 7 天对照

- 免费额度：每天 50 次请求。
- 预报长度：未来 7 天逐日预报。
- 限制：仅限非商业用途。
- 费用：免费账户不需要付款。
- 获取入口：[Weatherbit 免费注册](https://www.weatherbit.io/account/create)

步骤：

1. 注册并验证邮箱。
2. 登录后进入账户或 API 控制台。
3. 找到 **API Key**。
4. 写入 `.env`：

```text
WEATHERBIT_KEY=你的Key
```

### 3. 心知天气 — 永久免费、未来 3 天预报

- 免费额度：每月 10 万次，1 次/秒。
- 预报长度：3 天，城市级。
- 费用：永久免费版，0 元，不商用。
- 获取入口：[心知天气免费版](https://www.seniverse.com/pricing)

步骤：

1. 在免费版卡片点击“立即申请”。
2. 注册账号；如页面要求手机或实名验证，按平台提示完成。
3. 进入控制台并申请免费版。
4. 进入“产品管理 → 产品详情”；普通 API 请求要复制“**私钥 key**”，不要使用“公钥 uid”。
5. 写入：

```text
SENIVERSE_KEY=你的私钥key
```

注意：免费版只覆盖国内 370 个主要城市，山峰点位会被映射到附近城市，不能当作山顶实测。

### 4. WeatherAPI.com — 免费计划、未来 3 天预报

- 注册后先进入 7 天 Business 试用，试用结束后自动转为免费计划。
- 免费计划：每月 100,000 次请求，每次可查未来 3 天预报。
- 注册页明确无需立即付款。
- 获取入口：[WeatherAPI.com 注册](https://www.weatherapi.com/signup.aspx)

步骤：

1. 注册并确认邮箱。
2. 登录 Dashboard。
3. 在 API Keys 区域复制 Key。
4. 写入 `.env`：

```text
WEATHERAPI_KEY=你的Key
```

如果注册页要求填写银行卡，停止注册，不要继续。

## 一次性配置

1. 在 `E:\Codex_Workspace\hiking\designs\hiking-weather-tool` 中找到 `.env.example`。
2. 复制一份并改名为 `.env`。
3. 只填写你申请到的 Key。
4. 停止旧的 `node server.mjs`，重新运行：

```powershell
cd E:\Codex_Workspace\hiking\designs\hiking-weather-tool
node server.mjs
```

5. 刷新工具。天气源抽屉会显示“已配置 · 免费额度”，预报表会出现对应平台。

## 已排除

- 和风天气：当前官方页面为按量付费。
- 彩云天气：未确认到稳定的长期免费额度。
- Tomorrow.io、Azure Maps、Apple WeatherKit、Xweather：需要付费或高门槛开发者账号。
- OpenWeatherMap：免费接口为 5 天 / 3 小时，不满足完整 7 天目标。

免费额度和条款可能变化，正式长期使用前应再次核对官方页面。
