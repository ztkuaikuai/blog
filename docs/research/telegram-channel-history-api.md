# Telegram 频道 `#now` 历史数据 API 调研

日期：2026-07-11

> 状态说明：本报告记录了历史 API 的调研结论；其“继续使用 `getUpdates`”推荐已被后续决策取代。当前采用的 Webhook + Turso 持久化方案以 ADR-0002 和正式规格为准。

## 结论

Telegram **有能力查询频道历史消息，但不在 HTTP Bot API 中**。

- 现有 Bot Token + `getUpdates` 方案只能消费近期更新，不能查询频道历史，也不能保证取得全部 `#now` 消息。
- 若要按指定频道搜索 `#now` 的可见历史，应使用 Telegram Core API（MTProto）的 `messages.search`，或基于它封装的 TDLib `searchChatMessages`，并以 **Telegram 用户账号**登录；这两个官方接口都支持指定 chat、查询文本和分页。
- 即使采用 MTProto，也不应对产品承诺数学意义上的“所有历史”：已删除、因权限不可见、受自动删除/内容保护或 Telegram 服务端限制影响的消息无法保证返回。更准确的承诺是“分页读取该账号当前有权访问、Telegram 当前仍保留并可搜索到的 `#now` 历史”。

## 1. Bot API：`getUpdates` 是更新队列，不是历史查询

Bot API 官方文档把 `getUpdates` 定义为长轮询获取 incoming updates；单次 `limit` 为 1–100。`offset` 一旦越过某个 `update_id`，此前更新即被确认并不再返回；负 offset 还会让更早更新被遗忘。[Bot API：getUpdates](https://core.telegram.org/bots/api#getupdates)

更关键的是，Telegram 只在服务器保存尚未取走的 incoming updates **最多 24 小时**，且 `getUpdates` 与 webhook 互斥。[Bot API：Getting updates](https://core.telegram.org/bots/api#getting-updates)

频道新帖可以作为 `channel_post` update 到达，已知帖子的编辑可作为 `edited_channel_post` 到达；这说明 Bot API 提供的是“从 Bot 开始接收后产生的事件流”，不是对既有频道内容的查询接口。[Bot API：Update](https://core.telegram.org/bots/api#update)

因此：

- 不能用 `getUpdates` 回溯 Bot 加入频道前的消息；
- 不能把 `offset` 当作频道消息分页游标；
- 访问页面时临时调用它，可能因为 24 小时窗口、更新已确认或超过队列页数而漏数据；
- Bot API 方法列表没有“按频道获取历史”或“在频道内服务端搜索消息”的对应 HTTP 方法。[Bot API：Available methods](https://core.telegram.org/bots/api#available-methods)

## 2. Core API / MTProto：可以查询和分页频道历史

### `messages.search`：最贴近本需求

`messages.search` 接收目标 `peer`、文本查询 `q`、日期/消息 ID 边界、`offset_id`、`add_offset` 和 `limit`，返回匹配消息。因此可将目标频道作为 `peer`，以 `#now` 作为 `q`，再用消息 ID 游标向旧消息分页。[messages.search](https://core.telegram.org/method/messages.search)；[Telegram API 分页](https://core.telegram.org/api/offsets)

但官方明确标注该方法 **Only users can use this method**。也就是说，用 `auth.importBotAuthorization` 把 Bot Token 登录到 MTProto，仍不能调用它。[messages.search](https://core.telegram.org/method/messages.search)；[MTProto bots](https://core.telegram.org/api/bots)

### `messages.getHistory`：可遍历历史，再自行筛选

`messages.getHistory` 可按 peer 获取倒序历史，并支持 `offset_id`、日期、最大/最小消息 ID 和 limit；但它同样被官方标注为 **Only users can use this method**。[messages.getHistory](https://core.telegram.org/method/messages.getHistory)

它适合顺序扫描后在应用侧判断 hashtag，但比服务端 `messages.search` 消耗更多请求。官方更新文档还指出，频道 message box 通常约 100,000，但这是服务端实现细节，不能依赖；非常旧的频道消息仍可能不可访问。因此它也不是“绝对完整历史”的契约。[Working with Updates：very old messages](https://core.telegram.org/api/updates#recovering-gaps-for-very-old-messages)

### TDLib：官方客户端库封装

TDLib 的 `searchChatMessages` 可指定 `chat_id` 与 `query`，按 `from_message_id` 分页，单次最多 100 条；它要求启用本地 message database，而且实际返回数可能小于 limit。[TDLib：searchChatMessages](https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1search_chat_messages.html)

TDLib 会处理 MTProto 网络、加密和本地存储，并保证更新顺序；代价是引入原生库、持久化数据库和长期客户端状态。[TDLib 官方文档](https://core.telegram.org/tdlib/docs/)

### `channels.searchPosts`：不推荐用于指定频道

Core API 还有 `channels.searchPosts`，可按 hashtag 全局搜索公开频道帖子，且只允许用户调用。[channels.searchPosts](https://core.telegram.org/method/channels.searchPosts)

它的搜索域是所有公开频道，接口没有“限定某一个频道”的参数；只能分页后在客户端过滤目标频道。官方还定义了搜索额度、等待时间和可能的 Stars 付费机制。因此它不如 `messages.search(peer=目标频道)` 直接，也不适合作为每位博客访客触发的后端请求。[Search and filters](https://core.telegram.org/api/search#global-hashtag-search)

## 3. 认证与频道权限

使用 MTProto 必须先在 `my.telegram.org` 创建应用，取得 `api_id` 和 `api_hash`；官方说明这些参数用于用户授权，并要求使用自己的 API ID。[Creating your Telegram Application](https://core.telegram.org/api/obtaining_api_id)

要调用 `messages.search` / `messages.getHistory`，需完成用户登录（手机号验证码，启用 2FA 时还需密码），并安全保存生成的长期 `auth_key`/session。之后的 API 调用以该用户身份执行。[User Authorization](https://core.telegram.org/api/auth)

该用户还必须能访问目标 peer：私有频道未加入会产生 `CHANNEL_PRIVATE`，无效或无权限 peer 也会失败。公开频道通常可访问，但若内容或账号受到限制，实际可见性仍以该账号为准。[messages.search errors](https://core.telegram.org/method/messages.search#possible-errors)

仅有 Bot Token 不够：MTProto 虽支持 Bot 登录，且还要求 `api_id`/`api_hash`，但本需求所需的 history/search 方法是 user-only。[Working with bots：Login](https://core.telegram.org/api/bots#login)

## 4. “所有历史”与删除消息的边界

Core API 能把频道内当前可搜索的历史逐页读完，但不能保证返回曾经存在过的每一条消息：

- 删除后的消息不再是可读取历史。Core API 会发送 `updateDeleteChannelMessages`，其中只有频道 ID 和被删除的 message IDs；这可用于删除本地副本，不能恢复正文。[updateDeleteChannelMessages](https://core.telegram.org/constructor/updateDeleteChannelMessages)
- 若客户端没在线，正确的 MTProto 实现要维护 `pts` 并通过 difference 补齐更新；过旧的更新差异可能已不可取，需要重新抓取当前状态。[Working with Updates](https://core.telegram.org/api/updates)
- 官方明确说非常旧的频道/超级群消息仍可能 inaccessible，且 message box 大小是不可依赖的实现细节。[Working with Updates：very old messages](https://core.telegram.org/api/updates#recovering-gaps-for-very-old-messages)

本项目已决定不追求“删除后自动撤回”，所以无需长期消费删除 update。页面每次搜索得到的是 Telegram 的**当前视图**：已删除消息自然不会再出现，但若本站另有缓存，缓存失效策略仍由本站负责。

## 5. 在 Astro + Vercel Serverless 中的代价

以下是根据上述官方协议约束对本项目部署形态作出的工程推论：

- `api_id`、`api_hash`、用户 session/auth key 都必须仅存服务端；后两者等同于用户账号长期凭证，泄露风险高于普通 Bot Token。
- 首次用户登录包含验证码/可能的 2FA，不适合在无状态请求中完成；应离线生成 session，再以 Vercel secret 注入。
- MTProto 客户端通常需要长连接、数据中心迁移处理、速率限制处理及持久 session。Serverless 实例会冷启动、并发扩容且本地磁盘不持久，容易重复建立 session、放大 Telegram 请求并触发 FLOOD 类限制。
- TDLib 依赖原生二进制和本地 message database，不适合直接塞进轻量 Vercel Function；若选 TDLib，更自然的是独立常驻服务。
- 纯 JavaScript MTProto 客户端虽然可降低部署难度，但仍需要可靠保存 session、限制并发、设置超时与短 TTL 缓存，并承担第三方库维护风险。
- 图片仍应由服务端代理；无论 Bot API file URL 还是 MTProto session，都不能把 Token/session 暴露给浏览器。

## 6. 可选方案与推荐

### A. 继续 Bot API `getUpdates`

优点：现有代码改动最少，只需补图片代理、频道过滤和明确缓存语义。

缺点：只能尽力展示 24 小时更新队列内、尚可取得的数据；不支持真正的频道历史查询或可靠分页。

适用：接受“近期动态窗口”，不要求历史。

### B. 用户账号 MTProto + `messages.search`（技术上最匹配）

优点：可限定频道、服务端搜索 `#now`、按 message ID 分页，能覆盖该用户当前可见且仍可搜索的历史。

缺点：需 `api_id`/`api_hash`、用户账号 session、额外安全治理和请求限流；在 Vercel Serverless 内直接运行有明显运维摩擦。

适用：历史分页确实是核心产品需求，并愿意接受用户账号自动化与凭证风险。

### C. 独立同步服务使用 MTProto/TDLib，博客读取同步结果

优点：最符合 MTProto/TDLib 的有状态运行方式，可统一处理分页、限流和 session。

缺点：事实上引入了常驻服务与持久存储，超出当前“不使用 webhook + 持久存储”的约束。

适用：未来对可靠历史、搜索或同步的要求上升。

## 推荐

**当前推荐 A，而不是为了历史直接把用户 MTProto session 放进 Vercel。** 原因是项目已经明确不追求完整历史，方案 B 带来的账号凭证、长连接、限流与无状态部署复杂度，不匹配当前需求。

应将产品契约写成：“展示 Telegram Bot 当前可取得的近期 `#now` 更新，不保证完整历史”，并删除无限历史分页的承诺；同时实施服务端图片代理，确保 Bot Token 不出现在客户端。

如果产品重新确认“按频道分页查看现存的全部 `#now` 历史”是必要功能，再选择 B，并把承诺限定为“该服务账号当前可见、Telegram 当前仍保留且可搜索的消息”，而非无条件的“所有历史”。
