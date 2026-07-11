---
status: superseded by ADR-0002
---

# 以 Telegram 频道作为 /now 页面的内容源

/now 页面（"此刻"）的内容不由仓库内的 Markdown 文件管理，而是在访客打开页面时，由 Vercel Serverless Function 从 Telegram Bot API 拉取带 `#now` 标签的近期消息。当前阶段不引入 Telegram Webhook 或持久存储：页面展示的是 Telegram 当时仍可提供的近期更新，不承诺完整历史，也不保证 Telegram 中的删除或标签移除会同步撤回博客内容。

所有包含 Bot Token 的 Telegram 请求都必须停留在服务端。消息图片通过博客自己的图片代理端点返回，API 响应和浏览器请求中不得出现 Bot Token。

## 决策动因

博主需要低摩擦的记录体验——随手用 Telegram 发一条带 `#now` 的消息，无需走 git commit → build → deploy 流程。

## 考虑的方案

| 方案 | 发布摩擦 | Token 暴露 | 国内访问 | 需要构建 |
|---|---|---|---|---|
| Markdown 文件 | 高（编辑代码库） | 不适用 | ✅ | 是 |
| 客户端直调 Telegram API | 低 | 暴露在前端 | ❌（被墙） | 否 |
| **访问时服务端代理（采用）** | **低** | **仅服务端** | **✅** | **否** |
| Webhook + 持久存储 | 低 | 仅服务端 | ✅ | 否 |
| 构建时拉取 | 低 | 仅构建时 | ✅ | 是 |

## 后果

- `/api/now.json` 是一个 Vercel Serverless Function，作为 Telegram API 的唯一调用方
- 不使用 Webhook 或持久存储；数据完整性受 Telegram Bot API 近期更新窗口限制
- 不承诺完整历史，也不自动同步 Telegram 消息删除或 `#now` 标签移除
- 需要配置 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHANNEL_ID` 两个环境变量
- 服务端 60 秒内存缓存，避免频繁触发 Telegram API 频率限制
- 图片由服务端代理，Bot Token 不得下发到浏览器
- /now 页面是静态 Astro 页面 + 客户端 JS 拉取 `/api/now.json` 渲染，无限滚动每次加载 20 条
