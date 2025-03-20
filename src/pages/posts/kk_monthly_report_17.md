---
layout: ../../layouts/post.astro
title: "借助 AI 做开源丨开始养植物丨新时代下程序员的核心价值 - 筷筷月报#17"
pubDate: 2025-03-19
description: "借助 AI 做开源丨开始养植物丨新时代下程序员的核心价值 - 筷筷月报#17"
author: "筷筷"
excerpt: 筷筷月报#17 分享了作者在二月的经历和思考。作者借助 AI 的能力，成功为 AntD X 提交了 PR 并上线，体验到了前所未有的成就感。同时，作者开始养植物，从购买发财树到种植牵牛花，感受到了生命的成长和不确定性带来的乐趣。开源动态部分介绍了 D2 终端技术大会和 TypeScript 宣布将移植到 Go 语言的消息。工具推荐包括适用于 React、Vue 和 Svelte 的动画数字组件 number-flow，以及受 Dieter Rams 设计原则启发的 Framer 组件 Drams。视频推荐涵盖了前端技术、程序员核心价值、代码质量取舍以及 TypeScript 重写等多个主题。文章推荐则涉及 JavaScript 中分解长任务的方法、AI 对程序员的影响、CSS 属性的使用等。播客推荐聚焦于 AI、创业、技术演进等话题。句子部分分享了关于感激、成功和时间的思考。
image:  
  src:
  alt:
tags: ["筷筷月报", "筷筷小报"]
---

> 三月太忙了咕了很久，我最喜欢的 up 主 polebug 也好久没有更新视频了😭😭

# 二月复盘

### 1 借助 AI 给 AntD X 提交了 PR

这个月给 [AntD X](https://github.com/ant-design/x) 提了 PR，最近也是成功上线了！看到我写的功能成功上线并被他人使用，成就感好高欸，我还是第一次给一个大的组件库提交 PR！

在之前，快速了解并上手修改一个复杂的项目对我来说是困难且不可想象的，现在我借助 AI 的能力，辅助了解项目的架构、功能模块等，我可以做到之前想象不到或成本很高的事情了。

![image.png](https://webp.kuaikuaitz.top/20250317225125143.png)

### 2 开始养植物🌳

这个月开始上班后，我买了一颗发财树，一开始送到的树已经奄奄一息了，我感觉我救不活就让商家补发了下：

| ![749df078a7b8a0189ad35ebacf94174.jpg](https://webp.kuaikuaitz.top/749df078a7b8a0189ad35ebacf94174.jpg) | ![e1cf7c67165afffb1013af86ef71311.jpg](https://webp.kuaikuaitz.top/e1cf7c67165afffb1013af86ef71311.jpg) |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |

> 左图：应该是去世了（悲）右图：补发的

由于之前发财树是土培的，直接泡在水里不太能活。咨询并听取了养花高手的意见，把发财树的根部切掉了一部分，并把大部分叶子都切掉了保存水分，之后根部避光两天让其痊愈😇，再把根部轻微接触水面，一个月过去后，已经长出很多新叶子了：

![img_v3_02kg_19b06f57-f02c-41e0-afef-84c6cd2eb99g.jpg](https://webp.kuaikuaitz.top/img_v3_02kg_19b06f57-f02c-41e0-afef-84c6cd2eb99g.jpg)

这个月收到了百度的校招礼盒，里面有一个牵牛花，于是又开始种花了：

| ![b96e0f317a54ddfb92f6d03a5303a3f.jpg](https://webp.kuaikuaitz.top/b96e0f317a54ddfb92f6d03a5303a3f.jpg)<br> | ![a9b6b48f3a6c8d1cd7f4b62bec20be7.jpg](https://webp.kuaikuaitz.top/a9b6b48f3a6c8d1cd7f4b62bec20be7.jpg)<br> | ![29361f3cf369e905f213a06dd455130.jpg](https://webp.kuaikuaitz.top/29361f3cf369e905f213a06dd455130.jpg)<br> |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |

看着它从一粒粒种子变成参天大树🌲（？），还是很有成就感的。每过一个周末，都会觉得它又长高了一些些，让我的日常生活增加了些我喜欢的不确定性。

最近它不怎么长高了，问了养花高手，可能是因为土太少了，这个小盆已经不足以支撑起它们的日常起居了。养花高手人美心善，帮我将牵牛花搬到了一个大盆里面🥺🥺，希望我可以见到它开花的一天。最新情况是牵牛花换到盆里面后好像不太适应环境，目前奄奄一息了😭😭，别似好吗：

![img_v3_02kg_255be001-f4aa-4f5d-857d-8f5e7e6a13ag.jpg](https://webp.kuaikuaitz.top/img_v3_02kg_255be001-f4aa-4f5d-857d-8f5e7e6a13ag.jpg)

---

# 开源动态

### 1 [D2 终端技术大会](https://d2.alibabatech.com/)

> D2 终端技术大会 ( Mobile Developer & Frontend Developer Technology Conference, 简称 D2 ）是由阿里巴巴终端技术委员会创办，面向全球终端开发领域（前端 & 客户端）技术人，立志于促进业内交流、引领终端技术发展。

本次主题是「热·AI」- 回归初心，热 AI 终端。我们一起来探讨，面对 AI 时代的冲击和机遇，终端人如何破局？这次会场中有没有你感兴趣的话题呢？

![image.png](https://webp.kuaikuaitz.top/20250310235030023.png)

这次大会邀请了很多重量级的嘉宾，例如尤雨溪在这次大会分享了[围绕 Vite 的前端统一工具链](https://www.bilibili.com/video/BV1WERGYDEix)，字节 Web Infra 团队负责人茅晓锋分享了近期很火的 AI 浏览器自动化测试工具 midscene.js 等等。

大会 PPT 可以点击[这里](https://github.com/d2forum/19th)获取😇

### 2 TypeScript 宣布将移植到 Go 语言

速度[有望提升 10 倍](https://devblogs.microsoft.com/typescript/typescript-native-port/)，并将在 TypeScript 7.0 中实现，为何选择使用 Go 语言移植，可以看「[视频.4](https://www.bilibili.com/video/BV1aqQdY2E1c/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)」快速了解。

![image.png](https://webp.kuaikuaitz.top/20250313123946748.png)

但 Go 在 WebAssembly 上的性能较差，在浏览器中不如基于 JavaScript 的 tsc，有关相关讨论可以查看该 [issue](https://github.com/microsoft/typescript-go/discussions/514)。

如果不加以改善的话，这将影响到诸如 TypeScript 在线编译器、在线 IDE 之类的网站。

---
# 工具推荐

### 1 [[number-flow](https://github.com/barvian/number-flow)](https://github.com/barvian/number-flow)

一个适用于 React、Vue 和 Svelte 的动画数字组件。

![20250228222153_rec_-convert.gif](https://webp.kuaikuaitz.top/20250228222153_rec_-convert.gif)

### 2 [Drams - Framer components inspired by Dieter Rams' design principles](https://drams.framer.website/)

受 Dieter Rams 设计原则启发的 Framer 组件，注重简约性、功能性和美学吸引力。每个元素都精心打造，以体现拉姆斯的十大优秀设计原则，力求在保持简约优雅美学的同时，兼具创新性、实用性和易懂性：

![20250309181138_rec_-convert.gif](https://webp.kuaikuaitz.top/20250309181138_rec_-convert.gif)

---
# 视频

### 1 前端杂谈系列

[【前端杂谈04】一次性搞懂 CDN、对象存储、反向代理、函数计算和边缘计算](https://www.bilibili.com/video/BV1T7NZeLE8M/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

[【前端杂谈06】一次性搞懂 NPM 版本号规则](https://www.bilibili.com/video/BV1qyPYedEAo/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

[⭐️【前端杂谈07】停止焦虑！AI 时代下的前端生存指南](https://www.bilibili.com/video/BV1So9dYSEXe/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

**技术始终都是为业务服务的**，而理解人的需求，创造优秀的用户体验，永远是前端工程师不可替代的价值。

![image.png](https://webp.kuaikuaitz.top/20250309180507758.png)

### 2 [⭐代码与工程之外【2】| 从CRUD到商业杠杆：重新理解程序员的核心价值](https://www.bilibili.com/video/BV1miAYeMEWY/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

程序员的核心价值，是技术吗？作为手段而非目的的技术，相对不重要吗？技术的价值又从哪里得来？作者聊了聊对上述问题的看法。

视频中作者提出技术价值传导链，帮助我们理清技术、业务、盈利的链条传导关系：

**技术价值 = 技术稀缺性 X 业务适配度 X 泡沫溢价率**

### 3 [程序员 请理直气壮的写出烂代码](https://www.bilibili.com/video/BV1MVQDYZEXy/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

**Worse is better**，要学会在交付速度和代码质量之间进行**取舍**（Trade-off）。我们<mark style="background: #FFF3A3A6;">对项目的优化是边际效应递减的</mark>，越是往深的优化，其花费的精力与时间越大，但收益却会越小。

### 4 [10倍提速！编程语言史上最强升级！TypeScript为何选择用Go重写【让编程再次伟大#33】](https://www.bilibili.com/video/BV1aqQdY2E1c/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

---
# 文章

### 1 [在 JavaScript 中多种分解长任务的方法（英）](https://macarthur.me/posts/long-tasks/)

### 2 [人工智能正在造就一代“文盲”程序员（英）](https://nmn.gl/blog/ai-illiterate-programmers)

原文摘录：<mark style="background: #FFF3A3A6;">每次我们让人工智能解决一个我们自己本可以解决的问题时，我们都是在以短期生产力换取长期理解。我们在以牺牲未来能力为代价来优化当下的代码提交</mark>。

### 3 [Overflow Clip（英）](https://ishadeed.com/article/overflow-clip/)

本文介绍 CSS 的 overflow `clip` 属性，并结合例子形象的说明 `clip` 属性的使用场景。

![image.png](https://webp.kuaikuaitz.top/20250221153734170.png)

### 4 [⭐Initial load performance for React developers: investigative deep dive（英）](https://www.developerway.com/posts/initial-load-performance)

文章图文结合浅显易懂的探索了核心网络指标、性能开发工具、什么是首次加载性能、用哪些指标来衡量它，以及缓存控制和不同的网络条件如何对其产生影响。

### 5 [有意结交亲密朋友](https://www.neelnanda.io/blog/43-making-friends)

看了全嘻嘻的[二月回信：不要止步于对男人失望](https://www.bilibili.com/video/BV1TbPxe9Eki/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)，我很喜欢这个系列，双方都很真诚，<mark style="background: #FFF3A3A6;">我喜欢这种暴露自己脆弱性，袒露自己内心，真诚说出自己内心的想法的对话</mark>。我虽对此有耻感，但我想我要有勇气去袒露自己，真诚待人。

### 6 [MCP 指南](https://guangzhengli.com/blog/zh/model-context-protocol/)

大体介绍了什么是 MCP，MCP 的工作原理，以及如何使用。

### 7 [LLM 对软件工程师的影响曲线（英）](https://serce.me/posts/2025-02-07-the-llm-curve-of-impact-on-software-engineers?ref=ghuntley.com)

原文摘录：

网上关于LLMs 的实用性有很多争论。有些人看到生产力有巨大飞跃，而另一些人则不明白这有什么好大惊小怪的。现在，HackerNews 上每一篇相关帖子下面都有一长串网友来回争论的跟帖。我称之为新的重大分歧。

关于这种差异，我有一个理论。这个理论是，平均而言，LLM 对某人日常工作的影响在很大程度上取决于其职位级别，而且呈现出一条非常有趣的曲线。在这篇文章中，我将解释这一观点背后的推理过程。

![image.png](https://webp.kuaikuaitz.top/20250228220615240.png)

### 8 [Async, Sync, in Between（英）](https://antfu.me/posts/async-sync-in-between)

### 9 [停止推荐和使用 React（英）](https://blog.lusito.info/stop-using-and-recommending-react.html)

是时候认真对待 React 中的缺陷了！

---
# 播客

### 1 [代码之外丨Anthony Fu 的成功密码｜六年级还认不全26个字母｜淡江大学的生活｜编程与摄影｜恋爱故事](https://www.xiaoyuzhoufm.com/episode/67b41df8606e5c594031b4e8)

### 2 [硬地骇客丨对话“一手撸算法，一手做视频”的知名UP主"朝发"- 每个人都应该公开表达？](https://www.xiaoyuzhoufm.com/episode/67bc6e1605a90dfd0d8decf1)

### 3 [硬地骇客丨对话字节 Trae 团队：探秘 AI IDE演进之路](https://www.xiaoyuzhoufm.com/episode/67c5744abf52a16cd1357d2d)

### 4 [纵横四海丨《厌女》：女人是一种范畴，男人是一种格式](https://www.xiaoyuzhoufm.com/episode/67cad0fae924d4525afb5324)

### 5 [WebWorkder丨年轻人的折腾史！和 00 后 的 Bonjour 初创团队，聊聊卡片社交产品创业摸爬心得](https://www.xiaoyuzhoufm.com/episode/67c8224d0766616acdcab0dd)

![image.png](https://webp.kuaikuaitz.top/20250313125346749.png)
### 6 [硬地骇客丨AI Agent：炒作还是革命？从实践+技术角度扒一扒](https://www.xiaoyuzhoufm.com/episode/67d8460a78103db3bd0a1c4e)

### 7 [代码时光机丨代码帝国 Google: Don't Be Evil](https://www.xiaoyuzhoufm.com/episode/67d6ae94e924d4525afa541f)

---
# 句子

### 1

曾经给予过我们温暖的人，并不一定还能有机会接受我们“迟到的“感激，但我们身边总有此刻正需要帮助的人。

——小熊猫

### 2

成功的背面不是失败，而是什么都不做。

——沈奕斐

### 3

时间是绝对公平，相对不公的。