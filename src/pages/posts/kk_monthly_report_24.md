---
layout: ../../layouts/post.astro
title: "每天花1s记录生活丨几乎每个周末都和朋友出去玩的一个月丨新奇体验 - 筷筷月报#24"
pubDate: 2026-03-20
description: "每天花1s记录生活丨几乎每个周末都和朋友出去玩的一个月丨新奇体验 - 筷筷月报#24"
author: "筷筷"
excerpt: "这期记录了我用每天 1 秒的视频给生活留档、几乎每个周末都与朋友见面的充实一月，以及提休假、述职答辩、用 Python 探索 Agent 开发等第一次体验；同时整理了 Vite 8、Astro 6.0、React Doctor 等近期关注的技术动态与内容推荐。"
image:
  src:
  alt:
tags: ["筷筷月报", "筷筷小报"]
---

# 一月复盘

这个月主要记录一些流水账😇

### 每天花1s来记录生活

今年开始打算每天拍摄至少1s的视频来记录我的生活，设置为1s可以让门槛大大降低防止我中途放弃，目前发了三期视频：[12月](https://www.bilibili.com/video/BV1mkigBcE3B/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)、[1月](https://www.bilibili.com/video/BV1LV6bBBEFX/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)、[2月](https://www.bilibili.com/video/BV1CZPczTEae/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)😇

### 几乎每个周末都和朋友出去玩的一个月

这个月真的从宅男变成了现充！

第一周自己去了汤泉刷完了《伴生动物》；第二周和朋友一起打泡姆泡姆；

第三周末学校的方舟同好群友来北京玩，于是一起吃了来菜😋干煸藕丝和菜苔炒的太好吃了😭家乡的味道，其实本来是去浩海傣家菜的，结果排了两个小时都没排上😅😅；

第四周末和同为前端的朋友约着去吃山葵烤肉😋；

第五周大学同班同学还同是粥友来北京上班了，于是周六约着一起去了终末地快闪店美美购入周边，然后去吃了绿茶😋；周日还和另一个朋友一起去吃了鸡煲😋、在隆福寺看了书展然后在附近找了家主理人店点了咖啡蛋糕一起聊天~这几个周末真的是过得太充实了😇

| ![image.png](https://webp.kuaikuaitz.top/20260319225311468.png) | ![image.png](https://webp.kuaikuaitz.top/20260319230050864.png) |
| --------------------------------------------------------------- | --------------------------------------------------------------- |

这个月有很多不期而遇，有些周末本来没打算出门，想自己在家里回复能量，但总有些惊喜的人（或者对i人来说是惊吓？）突然的出现，告诉我要来北京了！在喜悦和惊吓的同时，我作为在北京的老资历（至少对朋友来说是的，嗯），自然要见个面聊聊天吃吃饭，于是被迫现充了😄当然链接他人的感觉很不错，在[2024：拥抱变化](https://blog.kuaikuaitz.top/posts/2024%EF%BC%9A%E6%8B%A5%E6%8A%B1%E5%8F%98%E5%8C%96)中我期望我能够在2025年有链接的勇气，现在我已经能够享受和他人聊天的过程了，我对自己的变化感到感动🥹。

### 新奇体验

一月的「第一次」和「新奇体验」：
- 🏖️ 第一次提休假，流程意外的简单
- 📄 第一次述职答辩，复牌后觉得自己写的答辩文档并不直观，因为**你述职面对的评委并不知道你做了什么**，不要一上来就讲细节
- 🐍 第一次使用Python探索Agent开发，真正上手后举步维艰，通过达克效应知道我在愚昧之巅，提醒我人对自己能力的判断常常不准确，尤其是能力越低的人越容易高估自己，要时刻保持谦逊
- ⏰ 某天8点10分醒了，我还以为9点10分了，是闹钟坏了没响。到公司发现才9点，久违地吃了早饭，感觉脑子很清爽
- 🛵🪫😅 去上班时**电动车骑半路上没电了**

---
# 开源动态

### 1 [Vite 8 正式版发布丨同时宣布 Vite+ Alpha](https://vite.dev/blog/announcing-vite8.html)

Vite 8 终于发正式版了🎉一句话说明更新内容：Vite 8 采用 Rolldown 作为其单一、统一的基于 Rust 的打包工具，在保持完全插件兼容性的同时，构建速度提升了 10 - 30 倍。

同时宣布了 [Vite+](https://voidzero.dev/posts/announcing-vite-plus-alpha) Alpha 版本，想要去整合一个统一的 Web 开发工具链，用于开发、测试、代码检查、格式化和构建生产项目，让研发专注于业务编写而不是配置工具链，现在只是雏形但未来可期。

同时还宣布了 [Void](https://void.cloud/)，专为 Vite 设计的部署平台。一款强大的后端 SDK，让你的 Vite 应用真正实现全栈开发。

### 2 [Chat SDK](https://vercel.com/changelog/chat-sdk)

Vercel 新出的，一个统一的 TypeScript SDK，用于跨 Slack、Microsoft Teams、Google Chat、Discord、Telegram、GitHub 和 Linear 等平台构建聊天机器人。

### 3 [Astro 6.0](https://astro.build/blog/astro-6/)

`astro dev` 现在正在使用 Vite 的 Environment API，因此你现在可以在开发期间运行与生产环境完全相同的运行时。此外，新的字体 API 可以处理自定义字体。

---
# 工具推荐

### 1 [React Doctor](https://www.react.doctor/)

让 Coding Agents 诊断并修复你的 React 代码，只需一个命令，即可扫描你的代码库，检查安全、性能、正确性和架构方面的问题，然后输出一个 0 - 100 的分数以及可操作的诊断结果。

### 2 [Superset](https://github.com/superset-sh/superset)

AI 时代的 IDE ——在你的机器上运行由 Claude Code、Codex 等 Agent 组成的集群。它可以导入多个项目同一管理，并且每个项目可以开多个 worktree 隔离，我觉得在并行开发时挺高效的。

![image.png](https://webp.kuaikuaitz.top/20260311213115409.png)

---
# 视频

### 1 [给电子丈夫的道别信](https://www.bilibili.com/video/BV1drcEzcEh6/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

在 AI 时代下和赛博生命结婚也挺好的不是嘛

### 2 [与 AI 共事：从工具到伙伴](https://www.bilibili.com/video/BV18SfBBzEtX/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

在 AI 时代下和赛博生命共事也挺好的不是嘛

### 3 [Lovart 创始人陈冕×罗永浩！且让我大闹一场，然后悄然离去](https://www.bilibili.com/video/BV14eiQBmEbN/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

---
# 文章

### 1 [浏览器如何工作](https://howbrowserswork.com/)

一份关于浏览器工作原理的交互式指南。

### 2 [我们如何在一周内用 AI 重构 Next.js](https://blog.cloudflare.com/vinext/?utm_campaign=cf_blog&utm_content=20260224&utm_medium=organic_social&utm_source=twitter/)

本文介绍了 [vinext](https://github.com/cloudflare/vinext) 这一由一名工程师借助 AI 模型在一周内从头构建的前端框架。它是基于 Vite 对 Next.js 的重新实现，可作为 Next.js 的直接替代品，通过简单命令即可部署到 Cloudflare Workers。早期基准测试显示，其生产构建速度比 Next.js 快 1.6 - 4.4 倍，客户端捆绑包小 56% - 57%。vinext 构建时未采用中间框架，几乎每行代码都由 AI 编写，并通过了严格质量检测。此外还介绍了他利用 AI 构建的过程、AI 适用于解决此问题的原因，最后指出这一项目对软件架构层面可能带来的影响。

### 3 [面向人类与人工智能的最快前端工具](https://cpojer.net/posts/fastest-frontend-tooling)

使用高效的前端工具链，可以提升人类与AI在代码开发中的效率，文章介绍了26年高效的JavaScript工具。

### 4 [驾驭工程：在以智能体为先的世界中利用 Codex](https://openai.com/index/harness-engineering/)

OpenAI 的团队做了一个实验，构建并交付一款软件产品的内部 beta 版，**其中没有一行代码是人工编写的**。该软件经历软件生命周期整个过程，并且全部由 Codex 编写。当软件工程团队的主要工作不再是编写代码，而是设计环境、明确意图和构建反馈回路，从而使 Codex 智能体能够可靠地工作时，会发生哪些变化。

这个帖子要说的是，在我们与智能体团队一起从零开始打造一款全新产品的过程中，所能学到的经验教训 — 哪些地方出了问题，哪些问题相互叠加，以及如何最大化利用我们唯一真正稀缺的资源：人类的时间和注意力。

### 5 [Claude Code 的默认技术选型](https://amplifying.ai/research/claude-code-picks)

我们让 Claude Code 处理了 2430 次真实仓库，并观察它的选择。任何提示中都未提及工具名称，仅使用开放性问题。

发现：Claude Code 倾向于构建而非依赖库。“自定义/自己动手做”是提取出的最常见单一标签，在 20 个类别中有 12 个类别出现了该标签（尽管它跨越多个类别，而单个工具则是特定类别的）。当被要求“添加功能开关”时，它会构建一个使用环境变量和基于百分比的发布配置系统，而不是推荐 LaunchDarkly。当在 Python 中被要求“添加身份验证”时，它会从头开始编写 JWT + bcrypt。当它选择工具时，会果断做出选择：GitHub Actions 的选择率为 94%，Stripe 为 91%，shadcn/ui 为 90%。

前端比较高频被选择的技术栈或平台有：vercel、next.js + react、Tailwind css 、 shadcn/ui、vitest、pnpm、zustand、react hook form

---
# 播客

最近几个月全是龙虾😇

### 1 [⭐异见房间丨2025年度性别事件盘点：共识消散之前，愿你我还能相连](https://www.xiaoyuzhoufm.com/episode/69512c472db086f89768d7bb)

### 2 [硬地骇客丨从 Prompt 到 Agent Skills，论 Anthropic 的野心与大模型应用的终极抽象](https://www.xiaoyuzhoufm.com/episode/6966778eef1cf272a73de3c8)

### 3 [硬地骇客丨从 Agent Skills 到 Clawdbot（OpenClaw），论 AI 助理的执行权与失控边界](https://www.xiaoyuzhoufm.com/episode/697f9a2ab4be4c149b85137c)

### 4 [三侠大爸丨从坐着尿尿到敞开心扉：关于男性改变的真实对话ft. Alex 绝对是个妞](https://www.xiaoyuzhoufm.com/episode/696259dce235ea65bc23e230)

### 5 [晚点聊丨阿里Qwen人事变动：误读、近况、伏笔和未来](https://www.xiaoyuzhoufm.com/episode/69a8b2fbfc6e08bca1ae83fb)

### 6 [⭐跨国串门计划丨揭秘 Anthropic 的 Agent 哲学：为什么 Bash 和文件系统才是 AI 的终极武器？](https://www.xiaoyuzhoufm.com/episode/695ce0d2c1e012a7aba64bc8)

### 7 [纵横四海丨《一间只属于自己的房间》：女人需要两样东西，钱，和自己的房间]([https://www.xiaoyuzhoufm.com/episode/69a2d63ca22480add67241a6](https://www.xiaoyuzhoufm.com/episode/69a2d63ca22480add67241a6))

### 8 [42章经丨AI + 游戏 + 社交的新演绎 | 对谈 Wanaka 创始人张阳](https://www.xiaoyuzhoufm.com/episode/69a0b34b66e2c303778cd3ce)

### 9 [硬地骇客丨当我们被 “小龙虾” （OpenClaw）接管日常 🦞](https://www.xiaoyuzhoufm.com/episode/69b04f0c2a2882aae761ee45)

---
# 句子

### 1

人没有办法在容纳过多东西后再有心理能量去应对生活。要去回收注意力，有足够的心理能量去做真正对自己有益处的和对社会有益处的事情。

——[不追求赢也不追求输，冷不丁梆梆就两拳【2025年终总结】](https://www.bilibili.com/video/BV146igBYEhx/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3&t=2657)

### 2

父权制传统教导男人在情感上应当禁欲，教导他们如果没有感情就更有阳刚之气，但如果他们偶然有了感情，而且感到了伤害，就应当把它们压制下去并且忘记，尽力让它们消失。

……

现实情况是，男人正在受到伤害，整个文化对他们的回应是：“请不要告诉我们你的感受。”

——《双向奔赴的改变》贝尔 · 胡克斯

### 3

如果你不是在为产品付费，你本身就是产品。
