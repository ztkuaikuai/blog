# “此刻”本地隔离验收记录

- 日期：2026-07-11（Asia/Shanghai）
- 代码：`4c99090`，以及审查修正工作区
- 环境：Node 22+、Vitest 临时 file:// libSQL；每个端点测试从空数据库执行真实 `0001`、`0002` migration
- 命令：`pnpm test`、`pnpm astro check`、`pnpm build`、`pnpm now:security-check .env.production.example dist`

## 结果

| 票据验收项 | 本地隔离证据 | 结果 |
| --- | --- | --- |
| migration 版本与重复执行 | `tests/scripts/now-migrate.test.ts` 从空库连续执行两次并查询 `schema_migrations` | 通过 |
| 文字、单图、乱序相册、幂等、编辑与移除标签 | `tests/pages/api/telegram-webhook.test.ts` 使用真实数据库验证持久化和级联删除 | 通过 |
| 稳定分页、固定上限、48 小时状态、数据库降级 | `tests/pages/api/now.json.test.ts` 覆盖插入新消息后的游标窗口、50 上限和 503 | 通过 |
| 图片代理约束、缓存、上游失败、Token 不外泄 | `tests/pages/api/now-image.test.ts` 覆盖未知 ID、大小、Content-Type、缓存和 Telegram 错误 | 通过 |
| 首次/加载更多错误重试 | `tests/utils/now-feed.test.ts` 验证重试回调与保留已有内容 | 通过 |
| Webhook CLI 范围与脱敏 | `tests/scripts/telegram-webhook-cli.test.ts` 验证两个 allowed updates、三条命令、原始/URL 编码秘密脱敏 | 通过 |
| 构建产物秘密扫描 | `tests/scripts/security-check.test.ts` 验证原始/URL 编码匹配；对 `dist` 实跑无命中 | 通过 |
| 静态页面、Functions 与导航产物 | `pnpm build` 成功生成 `/now`、三个 API Functions 及全站静态路由 | 通过 |
| 导航 48 小时圆点 | 用迁移后的空本地 libSQL 插入一条当前记录，以浏览器验收：首页 `#now-dot` 为 `display:block` 且无 `hidden`；`/now` 为 `display:none` 且有 `hidden` | 通过 |

全量结果：7 个测试文件、25 个测试通过，Astro 类型检查 0 error，生产构建通过。现有 `about/index.astro` 有 1 个“构造函数可改为 class”的 hint，与本票据无关。

## 生产门禁

本记录证明本地/隔离数据库验收，不声称已操作真实生产凭证。正式上线仍须按 `now-production.md` 完成测试频道或生产频道 smoke message，并人工核对真实 Telegram 乱序投递、Vercel Runtime Logs 无秘密、Production/Preview 环境隔离和平台 Usage；任一未通过都不得宣告生产上线。
