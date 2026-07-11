# /now 页面（"此刻"）

## 问题陈述

博主想记录和分享短小的生活动态（此刻在做什么、想什么、关注什么），但当前博客只有长篇"文章"一种内容形式。每次发内容要走 git commit → build → deploy 流程，摩擦太大，不适合随手记录。

## 解决方案

新增 `/now` 路由，受 nownownow.com 的 /now 页面运动启发。内容不来自仓库 Markdown 文件，而是从博主已有的 Telegram 频道中拉取带 `#now` 标签的消息。通过 Vercel Serverless Function 代理 Telegram API，浏览器不直接访问 Telegram（兼顾国内可访问性和 Bot Token 安全）。

## 用户故事

### 博主（内容生产者）
1. 作为博主，我想在 Telegram 频道里发一条带 `#now` 标签的消息（文字+图片），博客自动展示在 /now 页面，无需任何额外操作
2. 作为博主，我想通过删除 Telegram 消息或移除 `#now` 标签来撤回 /now 页面的内容
3. 作为博主，我不想每次发"此刻"动态时重新构建部署博客

### 访客（内容消费者）
4. 作为访客，我想在 /now 页面看到博主最新的生活动态，按时间倒叙排列
5. 作为访客，我想在浏览 /now 页面时能够滚动加载更多历史动态（无限滚动）
6. 作为访客，我所在地区可能无法访问 Telegram，但 /now 页面仍能正常显示内容
7. 作为访客，我想点击"此刻"消息上的链接跳转到 Telegram 查看原始消息上下文
8. 作为访客，如果 /now 有附带图片，我想直接在页面上看到这些图片
9. 作为访客，当博主 48 小时内有新"此刻"更新时，我想在导航栏的"此刻"链接上看到一个小圆点提示
10. 作为访客，如果 /now 页面还没有任何内容，我想看到一个友好的空状态提示
11. 作为访客，如果 API 暂时不可用但我之前访问过，我希望能看到缓存的最后一份数据

## 实施决策

### API 端点 `/api/now.json`
- **方法**: `GET`，查询参数 `limit`（默认 20）、`offset`（分页偏移）
- **行为**: 服务端调用 Telegram Bot API，获取频道历史消息，筛选带 `#now` 标签的消息，去除 `#now` 文字，解析图片为下载 URL
- **缓存**: 服务端内存缓存，TTL 60 秒。仅缓存首页（无 offset 的请求），分页请求穿透缓存
- **返回结构**:
  ```json
  {
    "messages": [
      {
        "id": "消息唯一标识",
        "text": "去除 #now 标签后的文字内容",
        "images": ["https://api.telegram.org/file/bot<TOKEN>/<file_path>"],
        "timestamp": "2026-07-11T12:30:00Z",
        "link": "https://t.me/channel_username/message_id"
      }
    ],
    "hasRecentUpdate": true
  }
  ```
- **错误处理**: 有缓存但 Telegram API 请求失败时，返回缓存数据 + `stale: true` 标记。无缓存时返回错误信息 + 建议访客稍后重试

### /now 页面
- 客户端 JS 在页面加载时调 `/api/now.json` 获取首页数据
- 以倒叙时间线渲染消息卡片（最新在顶部）
- 滚动到底部自动加载下一页（每次 20 条），直到无更多数据
- 复用 API 数据时展示"数据可能不是最新的"提示
- **卡片 UI 风格**: 极简日志式（原型变体 C）——左侧日期列 + 右侧内容列，条目间以分割线隔开，最新条目标橙色小圆点。无卡片边框，高密度排版，适合快速扫读
- **图片展示**: 横向滚动缩略图，点击通过 Viewer.js（v1.11.6）放大预览。单图直接初始化在 `<img>`；多图以容器为画廊，支持左右切换。Viewer.js 配置与博客文章一致（仅保留 zoom in/out/oneToOne/rotate，隐藏按钮和导航栏）
- **空状态**: 极简型（原型变体 C）——居中一行"暂无记录"

### Navbar "此刻"链接
- 导航链接列表新增"此刻"项，指向 `/now`
- 非 /now 页面：在页面就绪后延迟（如 2 秒后）请求 `/api/now.json`，根据 `hasRecentUpdate` 决定是否显示小圆点
- /now 页面本身：不显示圆点（或直接从页面数据中读取，无需额外请求）
- `hasRecentUpdate` 判断逻辑：最新消息的 `timestamp` 距离当前时间 ≤ 48 小时
- 圆点为简单 CSS 实现（如红色小圆点，位于链接文字右上角）

### 环境变量
- `TELEGRAM_BOT_TOKEN` — Telegram Bot 的 API Token
- `TELEGRAM_CHANNEL_ID` — 频道 ID（如 `@channel_username` 或数字 ID）

### SEO
- 加入 sitemap（自动由 `@astrojs/sitemap` 覆盖 `/now` 路由）
- 不加入 RSS（RSS 仅包含文章）
- 页面 meta: title="此刻", description="记录我此刻正在做什么、想什么、关注什么"

## 测试决策

### 测试切面
- **主要切面**: `/api/now.json` 端点 — mock Telegram Bot API 响应，验证：
  - `#now` 标签消息被正确筛选和解析
  - 分页参数（`limit`/`offset`）行为正确
  - 缓存命中/过期/刷新逻辑
  - 错误场景：Telegram API 超时/返回错误，有缓存/无缓存两种路径
  - `hasRecentUpdate` 字段在 48h 内外返回 true/false

### 测试标准
- 测试 API 的外部契约（输入→输出），不测实现细节
- 不 mock 内部模块，只 mock 外部边界（Telegram API 的 HTTP 调用）
- Astro API 端点的测试模式参考 Astro 官方文档的 `app.render()` 模式，或通过 HTTP 请求测试运行的 dev server

## 不在范围内
- 任何需要登录或管理员认证的功能——/now 是纯展示页面，无后台管理
- "此刻"内容的编辑/修改/删除界面——通过 Telegram 自身完成
- 博主的 Telegram 身份验证——Bot Token 已隐式认证
- 多语言支持
- 评论功能（/now 页面不带 Giscus）
- 推送通知或 WebSocket 实时更新

## 补充说明
- 架构决策详见 `docs/adr/0001-now-telegram-cms.md`
- 领域术语详见 `CONTEXT.md`
- UI 细节（卡片样式、空状态）由后续原型技能确定

## 已知限制
- **图片直链问题**：图片 URL 指向 `api.telegram.org`，国内访客可能无法加载。当前图片通过 Telegram 文件服务器直链，未经过 Vercel 代理。后续可通过新增图片代理端点 `/api/now/image` 解决，由 Vercel 服务端中转图片数据。
