# “此刻”生产上线与运维

本流程从空 Turso 数据库开始，仅保存 Webhook 启用后收到的内容。注册 Webhook 是本地人工操作，**不属于 `build` 或 Vercel deploy**；Preview Deployment 因而不会抢占生产 Webhook。

## 1. 零成本与秘密基线

- Turso 保持 Free 计划，不绑定信用卡、不启用 overage；Vercel 保持个人非商业博客适用的 Hobby 计划。额度耗尽时接受 API/Functions 暂时降级，不升级付费计划。Vercel Hobby 通常在免费额度耗尽后暂停相应能力，而不是产生按量账单，仍应每月检查 Usage。参考 [Vercel Hobby limits](https://vercel.com/docs/plans/hobby)。
- 仅在 Vercel **Production** 配置运行时变量，不给 Preview 配置生产 Bot Token、生产数据库 Token 或 Webhook Secret。Vercel 的 Production 与 Preview 环境彼此独立，参考 [Vercel environments](https://vercel.com/docs/environment-variables)。
- `TELEGRAM_WEBHOOK_SECRET` 与 `NOW_CURSOR_SECRET` 分别运行 `openssl rand -hex 32` 生成，不复用；Bot Token 由 BotFather 生成，Turso Token 由 Turso CLI 生成。秘密不进入 shell 命令参数、Git、截图或工单。
- 固定分页最大 50、Webhook 1 MB 请求体限制、数据库校验后的不可猜测图片 ID、图片上游超时/大小限制与 CDN 缓存共同限制异常流量；同时保留 Vercel 平台的 DDoS/滥用防护。

## 2. 环境配置

复制示例并只在本机填写：

```bash
cp .env.production.example .env.production.local
chmod 600 .env.production.local
```

Vercel Production 必需：

| 变量 | 用途 |
| --- | --- |
| `TURSO_DATABASE_URL` | libSQL 数据库 URL |
| `TURSO_AUTH_TOKEN` | 数据库认证 Token |
| `TELEGRAM_BOT_TOKEN` | 图片代理调用 Telegram |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook 请求认证 |
| `TELEGRAM_CHANNEL_ID` | 唯一允许的频道数值 ID（如 `-100…`，也支持 `@username`） |
| `NOW_CURSOR_SECRET` | 分页游标签名密钥 |

本地 `.env.production.local` 额外需要 `NOW_WEBHOOK_URL=https://<生产域名>/api/telegram/webhook`，供注册 CLI 使用。该文件已被 `.gitignore` 排除。可在 Dashboard 逐项添加，或使用 `vercel env add <NAME> production --sensitive`；变量更新只对之后的部署生效。

## 3. 首次上线

1. 安装并登录 Turso CLI，确认账户是 Free，然后创建空库与 Token：

   ```bash
   turso db create kkblog-now
   turso db show kkblog-now --url
   turso db tokens create kkblog-now
   ```

   将 URL 和 Token 写入本地文件与 Vercel Production，不把命令输出保存到仓库。

2. 从本机执行 migration。runner 创建 `schema_migrations` 并记录文件版本，重复运行只应用新增版本：

   ```bash
   pnpm now:migrate .env.production.local
   ```

   可核对：`turso db shell kkblog-now "SELECT version, applied_at FROM schema_migrations ORDER BY version"`。

3. 在 Vercel Production 配齐上表变量，执行 `pnpm test && pnpm build`，再通过生产分支或 `vercel --prod` 部署。不要把 Webhook 命令加入 Vercel Build Command。

4. 部署完成并确认生产 URL 后，从本机注册与检查：

   ```bash
   pnpm now:webhook set .env.production.local
   pnpm now:webhook info .env.production.local
   ```

   `allowed_updates` 必须只有 `channel_post`、`edited_channel_post`，URL 必须是生产域名，pending 与 last error 应正常。随后在生产频道发布一条唯一正文的 `#now production smoke <日期时间>` 测试消息，确认 Webhook 的 pending 归零、`/api/now.json` 返回该正文、`/now` 显示它且原文链接可打开；保留该条作为上线记录，或编辑移除 `#now` 并确认撤回。需要停用时运行 `pnpm now:webhook delete .env.production.local`；删除不会丢弃 Telegram 已 pending 的更新。

## 4. 隔离环境验收

先对独立 Turso Free 数据库和测试频道重复上述流程，不得指向生产 Webhook。逐项记录消息 ID、预期和结果：

- 发布纯文字、单图、乱序到达的三图相册；确认倒序、图片顺序与原文链接。
- 重发同一 update 不重复；编辑正文会更新；编辑移除 `#now` 会删除条目和级联片段。
- 发布超过 20 条，确认游标分页无重复/遗漏；插入新内容后继续旧游标仍稳定。
- 确认其他页面 48 小时导航圆点、`/now` 自身无圆点；断开数据库分别验证首次加载和加载更多重试。
- 检查 API JSON、图片 URL/响应/重定向和 Vercel Runtime Logs，不得出现 Bot Token、Webhook Secret、Turso Token；生产构建后再运行：

  ```bash
  pnpm now:security-check .env.production.local dist
  ```

自动化测试使用真实临时 SQLite/libSQL migration，覆盖上述端点行为。真实 Telegram 乱序投递、Vercel Logs 与生产平台防护仍必须人工验收。

本次本地隔离验收结果记录在 [`now-acceptance.md`](./now-acceptance.md)。

## 5. 备份、恢复与人工删除

至少每月及每次 migration 前建立带日期的离线 SQL dump，并复制到仓库之外的第二位置：

```bash
mkdir -p backups
turso db shell kkblog-now .dump > "backups/kkblog-now-$(date +%F).sql"
test -s "backups/kkblog-now-$(date +%F).sql"
```

定期用新库验证恢复：`turso db create kkblog-now-restore-test --from-dump backups/<文件>.sql`。命令依据 [Turso database dump/restore](https://docs.turso.tech/cli/db/shell)。免费层可能提供的恢复窗口会变化，也覆盖不了误删发现过晚、账户故障或供应商迁移，因此不能代替长期离线备份。

低频人工删除使用 Turso 控制台或 CLI，不建设管理后台。先查条目，再在事务中删除；外键会级联删除 Telegram 片段：

```sql
SELECT id, telegram_link, display_text FROM now_entries ORDER BY published_at DESC LIMIT 20;
PRAGMA foreign_keys = ON;
BEGIN;
DELETE FROM now_entries WHERE id = <确认过的 id>;
COMMIT;
```

删除后复查两个表并留存操作记录。已被 CDN 缓存的图片最多仍可能保留约 7 天。

## 6. 明确限制

- 不回填 Webhook 注册前历史。
- Telegram 直接删除不会同步；只能编辑移除 `#now` 或人工删库。
- 只支持文字与照片（含相册），不支持视频、GIF、音频、文件等媒体。
- 圆点仅表示 48 小时内有发布，不提供已读状态。
