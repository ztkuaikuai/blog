# “此刻”接入步骤

## 1. 创建 Turso 数据库

```bash
turso db create kkblog-now
turso db show kkblog-now --url
turso db tokens create kkblog-now
```

保存数据库 URL 和 Token。

## 2. 创建本地环境文件

```bash
cp .env.production.example .env.production.local
chmod 600 .env.production.local
openssl rand -hex 32
openssl rand -hex 32
```

填写 `.env.production.local`：

```dotenv
TURSO_DATABASE_URL=libsql://你的数据库地址
TURSO_AUTH_TOKEN=你的数据库Token
TELEGRAM_BOT_TOKEN=你的BotToken
TELEGRAM_WEBHOOK_SECRET=第一次生成的随机值
TELEGRAM_CHANNEL_ID=你的频道ID
NOW_CURSOR_SECRET=第二次生成的随机值
```

## 3. 初始化数据库

```bash
pnpm now:migrate .env.production.local
```

检查 migration：

```bash
turso db shell kkblog-now "SELECT version, applied_at FROM schema_migrations ORDER BY version"
```

## 4. 配置 Vercel Production 环境变量

添加以下变量：

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_CHANNEL_ID
NOW_CURSOR_SECRET
```

## 5. 测试并部署

```bash
pnpm test
pnpm build
vercel --prod
```

## 6. 注册 Telegram Webhook

```bash
pnpm now:webhook set .env.production.local
pnpm now:webhook info .env.production.local
```

Webhook 地址固定为：

```text
https://blog.kuaikuaitz.top/api/telegram/webhook
```

`info` 返回的 `allowed_updates` 应为：

```text
channel_post
edited_channel_post
```

## 7. 验证发布

在 Telegram 频道发送：

```text
#now production smoke
```

检查：

```text
https://blog.kuaikuaitz.top/api/now.json
https://blog.kuaikuaitz.top/now
```

## 8. 备份数据库

```bash
mkdir -p backups
turso db shell kkblog-now .dump > "backups/kkblog-now-$(date +%F).sql"
```

## 9. 删除 Webhook

```bash
pnpm now:webhook delete .env.production.local
```
