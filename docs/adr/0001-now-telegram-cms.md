# 以 Telegram 频道作为 /now 页面的内容源

/now 页面（"此刻"）的内容不由仓库内的 Markdown 文件管理，而是从博主已有的 Telegram 频道中拉取带 `#now` 标签的消息。博客通过一个 Vercel Serverless Function（`/api/now.json`）代理 Telegram Bot API 请求，浏览器不直接访问 Telegram。

## 决策动因

博主需要低摩擦的记录体验——随手用 Telegram 发一条带 `#now` 的消息，无需走 git commit → build → deploy 流程。

## 考虑的方案

| 方案 | 发布摩擦 | Token 暴露 | 国内访问 | 需要构建 |
|---|---|---|---|---|
| Markdown 文件 | 高（编辑代码库） | 不适用 | ✅ | 是 |
| 客户端直调 Telegram API | 低 | 暴露在前端 | ❌（被墙） | 否 |
| **服务端代理（采用）** | **低** | **仅服务端** | **✅** | **否** |
| 构建时拉取 | 低 | 仅构建时 | ✅ | 是 |

## 后果

- `/api/now.json` 是一个 Vercel Serverless Function，作为 Telegram API 的唯一调用方
- 需要配置 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHANNEL_ID` 两个环境变量
- 服务端 60 秒内存缓存，避免频繁触发 Telegram API 频率限制
- /now 页面是静态 Astro 页面 + 客户端 JS 拉取 `/api/now.json` 渲染，无限滚动每次加载 20 条
