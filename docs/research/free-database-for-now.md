# `/now` 零成本数据库选型调研

> 调研日期：2026-07-11。仅引用厂商官方定价与文档。免费层会变化，实施前应再次核对链接。

## 结论

首选 **Turso（免费 Starter）**，备选 **Neon Postgres（Free）**。

- Turso 最贴合“个人博客、低流量、必须保持 $0”：无需信用卡，5 GB、每月 5 亿行读取/1000 万行写入，官方明确数据库不会休眠或冷启动；Vercel Function 可通过只依赖 `fetch` 的 SDK 访问。SQLite/libSQL 支持事务、复合唯一约束和索引游标分页，足够承载 Telegram 消息。
- Neon 的优势是标准 Postgres、迁移性最好；免费层也不需要信用卡，并在空闲 5 分钟后缩容到零，而非删除数据。但 0.5 GB、每月 100 CU-hours、5 GB 出站流量更紧，达到出站限额会暂停计算，因此作为保守备选。
- 如果“绝不产生账单”高于“继续全部运行”，应始终留在纯 Free 计划、不要添加付款方式/启用 overage。免费额度耗尽后宁可让接口失败或暂停，也不要自动升级。

这不是“免费服务永久不变”的承诺。任何托管免费层都可能调整条款；项目仍需定期导出数据。

## 需求基线

- Telegram Webhook 幂等写入 `channel_post`，按 `(telegram_channel_id, telegram_message_id)` 唯一。
- `edited_channel_post` 更新；编辑后移除 `#now` 时删除；不自动同步 Telegram 直接删除。
- 永久保存所有收到的消息，前端按 `(published_at, telegram_message_id)` 做游标分页。
- Astro 6 静态站继续部署在 Vercel，只有 Webhook、分页 API、图片代理是按需 Vercel Functions。
- 数据库必须能在不添加信用卡、不启用付费 overage 的前提下运行。

## 候选对比

| 候选 | 免费额度与闲置行为 | Vercel 访问 | 数据能力与迁移 | 超额与零成本确定性 | 判断 |
|---|---|---|---|---|---|
| **Turso / libSQL** | 100 个数据库；总计 5 GB；每月 5 亿行读、1000 万行写、3 GB sync；1 天 PITR。无需信用卡。官方说明免费数据库不休眠、无冷启动。 | 官方 `@tursodatabase/serverless` 只用 `fetch`，明确支持 Vercel Functions；也可用 `@libsql/client/web`。 | SQLite 语义：事务、复合 `UNIQUE`、索引和 keyset pagination 均可。可用标准 SQLite/libSQL 工具迁移，锁定低于专有 KV。 | 免费计划本身为 $0；不要启用 Overages。官方定价页区分“启用/禁用 Overages”，但当前可抓取正文未完整展示达到限额后的逐项行为，因此成本保护应以“不绑卡、不启用 overage”为硬条件。 | **首选**：额度最大、常驻、serverless 连接简单。风险是产品/SDK正在从 libSQL 客户端演进到新的 Turso SDK，应固定依赖版本。 |
| **Neon Postgres** | 每项目 0.5 GB、100 CU-hours/月、5 GB/月公网传输；空闲 5 分钟缩容到零；6 小时时间旅行/恢复。无需信用卡、无时间限制。 | `@neondatabase/serverless` 通过 HTTP/WebSocket；官方示例覆盖 Vercel Functions；也有 PgBouncer 池化连接。 | 完整 Postgres，事务、复合唯一约束、索引游标分页最成熟；`pg_dump`/标准 Postgres 生态使迁出最容易。 | Free 达到 5 GB 传输后会暂停 compute 到下个周期或升级；不会因流量直接产生账单。应留在 Free、限制 autoscaling 上限并启用 scale-to-zero。 | **备选**：标准化最好；小站容量足够，但免费额度和恢复窗口明显小于 Turso。 |
| **Supabase Postgres** | 2 个活跃免费项目；每项目 500 MB 数据库；5 GB egress、5 GB cached egress；API 请求不限。低活动项目可在 7 天后暂停，暂停后仅有 90 天可在控制台恢复。 | 可从 Vercel 用 Postgres 连接或 Supabase HTTP API；serverless 应使用连接池/事务池。 | 完整 Postgres；约束、事务、分页和 `pg_dump` 都很好。免费层不含付费计划的每日备份，但可自行导出。 | Free 超额后受限而非自动收费；无需升级即可保持 $0。但低流量博客恰好容易被暂停，恢复还需人工介入。 | 不推荐作为首选：功能足，但闲置暂停与个人低流量场景冲突。 |
| **Cloudflare D1** | Workers Free：每日 500 万行读、10 万行写；账户总存储 5 GB，但单库上限 500 MB；7 天 Time Travel；无 egress 费用，不按 compute 小时收费。 | D1 原生绑定面向 Cloudflare Workers；Vercel 只能通过 Cloudflare REST API 调用，需要把 Cloudflare Account API Token 放入 Vercel，且多一跳延迟。 | SQLite 语义，支持约束、事务/批处理、索引分页；可通过 API 导出 SQL，厂商锁定中等。 | Free 达到每日读写限额后 API 直接报错，次日 UTC 复位；达到存储上限后停止写入，不会自动收费。无需为 D1 Free 升级 Workers Paid。 | **成本最可预测，但架构不合拍**：若整个 API 搬到 Cloudflare Workers，它会很合适；仅为数据库跨云访问不值得。 |
| **Upstash Redis** | 1 个免费数据库；256 MB；每月 50 万 commands、10 GB 带宽；无需信用卡。免费数据库至少 14 天无活动会被归档，端点被移除，数据以备份保留、需人工恢复。 | REST API 天然适配 Vercel/Edge，无连接池问题。 | Redis 可持久化并支持事务性命令，但没有 SQL 外键/复合唯一约束；幂等、二级索引、稳定分页和数据迁移需自行维护。可导出 RDB，但并非关系数据的通用交换格式。 | Free 超限请求失败；升级 PAYG 后才可设置预算。留在 Free 可保证 $0，但归档会中断 Webhook。 | 不适合永久消息主库；更适合缓存、限流或短期状态。 |

## 官方依据

### Turso

- [官方定价](https://turso.tech/pricing)：Free 为 $0、无需信用卡，100 DB、5 GB、每月 500M rows read、10M rows written、3 GB sync、1 天 PITR。
- [免费层调整公告](https://turso.tech/blog/turso-cloud-debuts-the-new-developer-plan)：自 2025-03-31 起免费数据库不再冷启动或休眠，并列出上述读取、写入与存储额度。
- [TypeScript SDK](https://docs.turso.tech/sdk/ts/reference)：`@tursodatabase/serverless` 明确用于 Node、Vercel Functions 和边缘运行时，仅使用 `fetch`。
- [Point-in-Time Recovery](https://docs.turso.tech/features/point-in-time-recovery)：每次 `COMMIT` 自动形成恢复数据，Free 可恢复到过去 24 小时内的时间点。

### Neon

- [官方定价](https://neon.com/pricing)：Free $0、无需信用卡且无时间限制；每项目 0.5 GB、100 CU-hours/月、空闲 5 分钟缩容、5 GB 网络传输、6 小时恢复窗口。
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)：HTTP/WebSocket 访问及 Vercel Serverless Function 示例。
- [网络传输限制](https://neon.com/docs/introduction/network-transfer)：Free 每月 5 GB，超限会暂停 compute 至下个账期或升级。

### Supabase

- [官方定价](https://supabase.com/pricing)：Free 的 500 MB 数据库、5 GB egress、无限 API 请求、2 个活跃项目及一周不活跃暂停。
- [免费项目暂停](https://supabase.com/docs/guides/platform/free-project-pausing)：低活动约 7 天后可暂停；暂停后 90 天内可恢复。
- [Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)：Free 超额会受到暂停、只读或 402 等限制；付费计划才涉及 spend cap/overage。

### Cloudflare D1

- [D1 定价](https://developers.cloudflare.com/d1/platform/pricing/)：Free 每日读写额度、5 GB 总存储、无 egress；超限后查询/写入停止而不是收费。
- [D1 限制](https://developers.cloudflare.com/d1/platform/limits/)：Free 单库 500 MB、账户 10 个库、7 天 Time Travel。
- [D1 REST API](https://developers.cloudflare.com/api/resources/d1/)：可从外部通过 Cloudflare API 查询、导入与导出 SQL，证明从 Vercel 访问技术上可行。
- [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)：自动开启、Free 保留 7 天；恢复不另收费。

### Upstash Redis

- [官方定价](https://upstash.com/pricing/redis)：Free 256 MB、50 万 commands/月、10 GB 带宽；创建 Free 无需信用卡，免费层没有付费 overage。
- [闲置归档 FAQ](https://upstash.com/docs/redis/help/faq)：Free 至少 14 天无活动会归档，保留备份但移除实例，需从控制台恢复。
- [持久化与 REST](https://upstash.com/docs/redis/overall/compare)：数据落盘且可作为主库，HTTP REST 可从 serverless 环境访问。
- [导入导出](https://upstash.com/docs/redis/howto/importexport)：可导入/导出 RDB；部分 Redis 数据结构不包含在 RDB 导出中。

## 推荐实现与成本保护

### 首选：Turso Free

1. 创建独立的 Free 数据库，不添加信用卡，不切换 Developer，不启用 Overages。
2. Vercel 仅配置 `TURSO_DATABASE_URL` 与最小权限的数据库 Token；用 `@tursodatabase/serverless`，凭据绝不进入客户端 bundle。
3. 消息表设置 `UNIQUE (telegram_channel_id, telegram_message_id)`；分页索引设置为 `INDEX (published_at DESC, telegram_message_id DESC)`。
4. Webhook 使用原子 UPSERT；分页固定 `LIMIT`，避免全表扫描；图片仍由 Vercel 代理，不把二进制图片存数据库，只存 Telegram `file_id`。
5. 每月观察 Turso 用量；达到 70% 时先限流/缩短页面 `limit`，不升级。
6. 每周或每月导出一份 SQLite/SQL 备份到本地或仓库外的个人备份位置。PITR 只有 24 小时，不能代替长期备份。

### 备选：Neon Free

1. 明确保持 Free，不加入 Launch；不添加付款方式。
2. 最小 compute 设为 0.25 CU、保留 5 分钟 scale-to-zero；使用 serverless HTTP driver 或 pooled URL。
3. API 做固定上限分页和短时 CDN 缓存，降低 CU-hours 与 egress；达到阈值时让读取降级，不自动升级。
4. 定期 `pg_dump`，因为 Free 的 6 小时恢复窗口非常短。

## 最终建议

本项目选择 **Turso Free**。它同时满足：不绑卡、无闲置暂停、免费额度宽裕、Vercel 连接简单、关系约束与游标分页够用。若更看重标准 Postgres 和未来迁移，则选择 **Neon Free**，接受容量/计算/出站限额更小以及空闲唤醒。

Cloudflare D1 的“超限即停止”成本行为最明确，但数据库原生运行时不在 Vercel；除非决定把 `/api/now/*` 一并迁到 Cloudflare Workers，否则不采用。Supabase 与 Upstash 都可能因低活动暂停/归档，不适合作为这个低流量 Webhook 的首选持久层。
