# 01 — 完成文字“此刻”的持久化发布与浏览闭环

**What to build:** 博主在目标 Telegram 频道发布或编辑带 `#now` 标签的纯文字消息后，博客通过受保护的 Webhook 将内容幂等保存到 Turso；访客可以在“此刻”页面稳定分页浏览文字内容，并从导航栏看到 48 小时近期更新提示。这个切片用持久数据库全面替换访问时 `getUpdates` 与内存缓存，使纯文字“此刻”可以独立投入使用。

**Blocked by:** None — can start immediately

**Status:** done

**Completed:** 2026-07-11（commit `db76371`）

- [x] 使用 Turso Free 和手写 migration 建立“此刻条目”与“Telegram 消息片段”数据模型，包含唯一约束、级联删除和稳定分页索引
- [x] 数据访问集中在一个小型模块中，业务端点不散落 SQL，且不引入 ORM
- [x] Webhook 只接受受限大小的 POST 请求，并以常量时间比较 Telegram Secret Header
- [x] Webhook 只处理配置目标频道的 `channel_post` 与 `edited_channel_post`，合法但无关的更新返回 200
- [x] `#now` 标签大小写不敏感，展示内容移除标签；没有正文的空文字消息不发布
- [x] 相同频道和消息 ID 的重复推送不会创建重复记录
- [x] 数据库写入成功后 Webhook 返回 200，可重试的数据库失败返回 500
- [x] 编辑已发布文字消息会更新博客记录；编辑后移除 `#now` 会级联删除该记录
- [x] 直接删除 Telegram 消息不会自动同步，且不新增管理后台或删除 API
- [x] 保存原始文字与 Telegram entities，页面保留换行并安全渲染 HTTP/HTTPS 普通链接和文字链接
- [x] 分页 API 默认返回 20 条、最大 50 条，只返回 published 内容，并按发布时间与稳定 ID 倒序
- [x] 不透明游标支持稳定翻页；无效或被篡改的游标返回 400，末页明确返回无下一页
- [x] 数据库不可用时读取 API 返回 503；首次加载失败和加载更多失败均可重试，且加载更多失败保留已有内容
- [x] 页面正确展示最新内容、空状态、原文链接和“已加载全部”状态，不再使用 stale 响应或浏览器消息副本
- [x] Navbar 保持“文章、此刻、标签、友链、关于我”的顺序；非“此刻”页面按最新持久记录判断 48 小时圆点并使用会话缓存
- [x] “此刻”页面自身不显示圆点，也不为 Navbar 发起额外请求
- [x] 使用真实临时 libSQL/SQLite 数据库执行 migration，以 HTTP 端点为测试 seam；只 mock Telegram HTTP 边界
- [x] 测试覆盖鉴权、频道过滤、标签大小写、幂等、编辑撤回、游标边界、48 小时判断及前端错误重试
- [x] 旧的访问时 `getUpdates`、内存响应缓存和含 Token 图片 URL 主路径被移除，纯文字闭环通过类型检查、测试和生产构建

## 交付说明

- Migration：`migrations/0001_now.sql`
- 数据访问：`src/utils/now/database.ts`
- Telegram Webhook：`POST /api/telegram/webhook`
- 分页读取：`GET /api/now.json`
- 页面：`/now`
- 验证：12 项测试通过，`pnpm build` 通过

## 部署配置

Vercel 服务端环境变量：

- `TURSO_DATABASE_URL`：Turso 数据库 URL
- `TURSO_AUTH_TOKEN`：Turso 数据库访问 Token
- `TELEGRAM_WEBHOOK_SECRET`：Telegram Webhook Secret Token，使用高熵随机值
- `TELEGRAM_CHANNEL_ID`：目标频道的数值 chat ID、`@username` 或 username
- `NOW_CURSOR_SECRET`：分页游标签名密钥；建议独立配置高熵随机值。未配置时回退使用 `TELEGRAM_WEBHOOK_SECRET`

上线顺序：

1. 在 Turso 数据库执行 `migrations/0001_now.sql`。
2. 在 Vercel Production 环境配置上述变量并部署。
3. 将 Telegram Bot 加为目标频道管理员，确保能收到频道帖子更新。
4. 调用 Telegram Bot API `setWebhook`，URL 指向 `https://<博客域名>/api/telegram/webhook`，同时传入与 `TELEGRAM_WEBHOOK_SECRET` 完全一致的 `secret_token`，并将 `allowed_updates` 限定为 `channel_post`、`edited_channel_post`。
5. 在频道发布 `#now 测试内容`，确认 Webhook 返回成功且 `/now` 可看到记录；随后编辑文字、移除 `#now`，确认博客记录被撤回。
