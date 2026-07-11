---
status: accepted
---

# 以 Webhook 持久化“此刻”消息

“此刻”继续以 Telegram 频道作为发布入口，但不再在访客访问时通过 `getUpdates` 拉取内容。Telegram 将频道的新消息推送到 Webhook；服务端筛选目标频道内带 `#now` 标签的消息并全部持久化，`/now` 页面通过博客 API 从数据库分页读取。这样可以可靠展示 Webhook 启用后收到的内容，同时不需要使用风险更高的 Telegram 用户账号 Session。

项目部署在 Vercel 免费计划上，预计每日访客少于 100 人，持久化方案的月成本必须保持为零。选型不追求高吞吐，但要有覆盖这一低流量规模的免费额度；同时应优先支持硬用量上限或超额停用，避免流量异常时自动产生账单，并避免低活跃数据库被自动暂停而中断 Webhook。

持久化使用 Turso Free（libSQL）。Vercel Functions 通过仅依赖 `fetch` 的服务端 SDK 访问数据库；项目不绑定信用卡、不启用 Turso overage，免费额度耗尽时允许接口降级，并定期导出数据库备份。

## 后果

- Webhook 与 `getUpdates` 方案互斥，现有访问时拉取逻辑将被替换
- 只保证保存 Webhook 成功接收的消息，不回填启用前的频道历史
- Webhook 必须校验 Telegram `secret_token`，并按频道 ID 与消息 ID 幂等写入
- 所有接收到的 `#now` 消息均持久保存，不设置“最近 100 条”保留上限
- 收到 `edited_channel_post` 时更新同一条记录；若编辑后移除了 `#now` 标签，则从博客数据库删除该记录
- Telegram 中直接删除消息不自动同步，必要时从博客数据库人工删除
- 没有 `media_group_id` 的 Telegram 消息各自形成一条“此刻”；具有相同 `media_group_id` 的相册消息合并为一条多图“此刻”
- 相册采用其中非空且带 `#now` 的 caption，图片按 Telegram 消息顺序排列，原文链接指向相册中的第一条消息
- 相册片段即使自身不含 `#now` 也先暂存；同组任一片段出现标签后整组发布，始终不匹配标签的片段不向前端展示
- 超过 24 小时仍未匹配标签的相册片段，在后续 Webhook 请求中惰性清理，不额外运行定时任务
- `/now` 页面和分页 API 只读取数据库；访客访问不会触发 Telegram 请求
- 数据库只保存 Telegram 图片的 `file_id`，不保存图片二进制或含 Token 的下载地址
- 浏览器按博客图片记录 ID 请求图片代理；代理先校验数据库记录，再用服务端 Bot Token 解析并转发 Telegram 文件，同时设置长期 CDN 缓存
- Bot Token 不得进入 API 响应或浏览器请求，图片代理不得接受任意 Telegram URL 或任意 `file_id`
- 博客页面继续静态生成；只有 Telegram Webhook、消息分页 API 和图片代理以 Vercel Functions 按需运行
