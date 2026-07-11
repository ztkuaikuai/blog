# 03 — 完成零成本生产上线与验收

**What to build:** 博主可以按一套可重复、不会泄露秘密且不产生月度费用的流程，从空 Turso 数据库部署“此刻”、注册 Telegram Webhook、验证运行状态并备份数据。生产环境中的静态博客、三个 Vercel Functions 和所有回归测试均达到上线标准。

**Blocked by:** 02 — 完成图片与 Telegram 相册闭环

**Status:** ready-for-agent

- [ ] 提供可重复执行的 migration 命令，并记录已经应用的 migration 版本
- [ ] 提供 Webhook set、info、delete CLI，注册时仅允许 `channel_post` 与 `edited_channel_post`
- [ ] CLI 从本地未提交的环境配置读取秘密，不在命令、日志或错误信息中打印 Bot Token、Webhook Secret 或数据库 Token
- [ ] Webhook 不在 Vercel 部署过程中自动注册，Preview Deployment 不会抢占生产 Webhook
- [ ] 明确列出 Turso 与 Vercel Production 所需环境变量、本地环境配置和 Secret 生成要求
- [ ] 上线说明覆盖创建 Turso Free 数据库、执行 migration、配置 Vercel、生产部署、本地注册 Webhook、检查状态和发布测试消息
- [ ] 备份说明提供可执行的定期 Turso 导出流程，并说明免费层恢复窗口不能替代长期备份
- [ ] 成本保护说明要求保持 Turso Free 与 Vercel Hobby、不绑定付费 overage，并在额度耗尽时允许接口降级
- [ ] 人工删除说明覆盖使用 Turso 控制台或 CLI 删除条目及其级联数据，不引入管理后台
- [ ] 安全回归确认客户端响应、图片地址、重定向、构建产物和日志中均不存在 Bot Token 或数据库凭证
- [ ] 异常流量保护确认固定分页上限、受约束图片代理、CDN 缓存、请求体限制和平台防护有效
- [ ] 从空数据库完成一次本地或隔离环境验收：文字发布、单图、乱序相册、编辑、移除标签、分页、导航圆点和错误重试均符合规格
- [ ] 全部自动化测试、类型检查和生产构建通过，且不再依赖旧 `getUpdates` 行为
- [ ] 上线说明明确不回填旧消息、不自动同步 Telegram 直接删除、不支持非照片媒体和不提供已读状态
