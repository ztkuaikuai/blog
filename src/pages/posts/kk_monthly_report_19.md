---
layout: ../../layouts/post.astro
title: "欢迎来找我聊天 - 筷筷月报#19"
pubDate: 2025-06-12
description: "欢迎来找我聊天 - 筷筷月报#19"
author: "筷筷"
excerpt: 欢迎读者与作者进行一对一的交流。作者在博客中新增了“关于我”页面，介绍了自己，并提供了与读者一对一聊天的方式，希望借此与他人建立联系并享受沟通的乐趣。开源动态部分报道了GSAP动画库宣布免费以及Rolldown-Vite的推出。工具推荐介绍了DeepWiki，一个将源码一键转换为文档的工具。视频推荐包括polebug的学习vlog、让编程再次伟大系列、前端杂谈系列，以及关于前端页面渲染方案和复杂度的讨论。文章推荐涵盖了事件循环可视化、AI交互的未来以及React内部原理。播客推荐聚焦于Vue 3.6的响应式系统演进、晒太阳App的成功经验、独立开发的酸甜苦辣、前端自救指南以及性别平等议题。句子部分分享了关于教育、性别平等、AI依赖以及语言表达的思考。
image:  
  src:
  alt:
tags: ["筷筷月报", "筷筷小报"]
---

> 这次的月报并没有复盘，原因是我最近怠惰加上写毕设和论文导致复盘被我搁置了，在下一期会补上！

最近我在博客中添加了[关于我](https://blog.kuaikuaitz.top/about)页面，在其中简单的做了个自我介绍、列出了一些我做的玩具项目和常用的社交媒体账号，以及<mark style="background: #FFF3A3A6;">和我一对一聊天的方式</mark>：

我自觉是一个比较 i 的人，但我想做出改变，**去尝试链接他人并享受与他人沟通的感觉**，我还算擅长：

- 前端求职相关疑问
- 学生时期遇到的疑惑（例如对大学生活感到迷茫随波逐流等）
- 职业发展规划与建议（需要提前说明的是，目前我只有不到两年工作经历）
- 讨论游戏、番剧
- 讨论女性主义相关议题
- 其他任何闲聊

希望我能够在沟通中给到你一些新的角度，也欢迎和我交朋友！

如果你有兴趣的话，非常欢迎在[关于我](https://blog.kuaikuaitz.top/about)页面底部点击按钮「**与我预约沟通**」🥺

---

# 开源动态

### 1 [GSAP 动画库宣布免费](https://github.com/greensock/GSAP)

GSAP 是一个优秀且功能强大的动画库，现在之前的高级付费功能全部可以免费用了！

### 2 [推出 Rolldown-Vite](https://voidzero.dev/posts/announcing-rolldown-vite)

Rolldown-Vite 是基于 Rust 开发的下一代 Vite 打包工具，旨在通过性能优化大幅缩短构建时间。目前可通过 `rolldown-vite` 包直接替代原生 `vite` 包使用，未来将成为 Vite 的默认打包工具。早期测试显示，大型项目的生产构建时间可减少 3 到 16 倍，内存使用量最多降低 100 倍。

---
# 工具推荐

### 1 [⭐DeepWiki](https://deepwiki.com/)

将源码一键转换为文档。输入 GitHub 仓库链接，输出解释该仓库的文档，包含系统简介、发展历史、核心架构解释等。

我拿我最初独自开发的记账小程序[妙记](https://github.com/ztkuaikuai/MiaoJi)试了下，生成的[Wiki](https://deepwiki.com/ztkuaikuai/MiaoJi)质量很不错，能准确拆分模块，并提供细粒度的讲解。例如在[近期账单显示](https://deepwiki.com/ztkuaikuai/MiaoJi/2.1-home-page#recent-bills-display)下，就分析了显示逻辑，并附有直观的图表和参考来源：

![image.png](https://webp.kuaikuaitz.top/20250612210122296.png)

![image.png](https://webp.kuaikuaitz.top/20250519182823649.png)

---
# 视频

### 1 polebug 的学习 vlog

[vlog #92｜程序员下班后的日常学习记录｜在香港远程办公的历险记｜在学交易相关的技术｜读完《悲惨世界》第二卷｜减脂中｜保持思考与记录](https://www.bilibili.com/video/BV1f1LPzwE65/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

[vlog #93｜程序员下班后的日常学习记录｜四月复盘｜在学 Solana 智能合约｜读《当代占星入门》、《悲惨世界》｜保持思考与记录](https://www.bilibili.com/video/BV1FkGQzfENH/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

[vlog #94｜写写代码、爬爬山的快乐五一假期｜在学 Solana+Rust｜和朋友聚会｜《悲惨世界》收尾中｜保持学习与思考](https://www.bilibili.com/video/BV1vtVpzzEGJ/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

[vlog #95｜程序员的我关掉了 AI，重新找回写代码的心流和快乐｜在读《消失的多巴胺》，思考快感缺乏｜保持思考｜记录快乐的瞬间 😁](https://www.bilibili.com/video/BV1QxJGzQE1G/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

**立个flag**！等到下半年正式上班，我要像 polebug 一样试着拍拍学习 vlog！

### 2 让编程再次伟大系列

[大数据时代过去了，我很怀念它【让编程再次伟大#36】](https://www.bilibili.com/video/BV1JEL2zDEyL?spm_id_from=333.1245.0.0)

[区块链已成往事，但我并不怀念它【让编程再次伟大#37】](https://www.bilibili.com/video/BV1yk5VzwEdN/?spm_id_from=333.1387.homepage.video_card.click)

[元宇宙，生得幽默，死得滑稽【让编程再次伟大#38】](https://www.bilibili.com/video/BV1xQEWz6EbV/?spm_id_from=333.1387.homepage.video_card.click)

### 3 [【前端杂谈10】渲染页面的 N 种姿势 | 从模板引擎到新式服务端渲染](https://www.bilibili.com/video/BV1NW5NzVE5F?spm_id_from=333.1245.0.0)

**前端页面渲染方案的更迭，最终的目的都是为了更好的用户体验**。当然，我们知道技术是服务于业务的，最新的方案不一定能应用到所有的场景，找出最贴合业务场景的前端页面渲染方案，是我们前端工程师的职责。

### 4 [前端不放复杂计算？怎么定义这个复杂度？](https://www.bilibili.com/video/BV17bVLzdE1W/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

### 5 [⭐代码与工程之外【4】| 价值、自由、金钱：工作的不可能三角](https://www.bilibili.com/video/BV1SbJWzJEiN/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3)

---
# 文章

### 1 [Airing丨月刊#29：新生活](https://blog.ursb.me/posts/weekly-29/)

### 2 [⭐事件循环可视化](https://hromium.com/javascript-visualized-event-loop)

通过向下滚动页面可视化 JS 的事件循环机制，网页交互做的很🐮🍺。

### 3 [⭐AI 交互的未来：超越纯文本](https://www.epicai.pro/the-future-of-ai-interaction-beyond-just-text-w22ps)

与 AI 之间的交互不应只是文字或语音，而是通过符合用户直觉的 UI 界面。目前交互体验良好的 Agent 类产品都是通过内部约定来渲染 UI 界面的，目前还没有一个行业认同的统一规范。文章中解释了为什么与AI的交互需要UI界面，以及对一个通用的规范的讨论探索和期待。

### 4 [React 内部原理：哪个 useEffect 先运行？](https://frontendmasters.com/blog/react-internals-which-useeffect-runs-first/#commit-phase)

对 React 开发者来说基础且重要的知识，结合动图浅显易懂的解释了 React 组件渲染生命周期内的执行过程。

---
# 播客

### 1 [Web Worker丨前端技术深探：Alien Signals 与Vue 3.6 的响应式系统演进](https://www.xiaoyuzhoufm.com/episode/67ffc3a51f1db84a56b67526)

在这期播客中，我们邀请到了 Vue 核心贡献者 [Johnson](https://github.com/johnsoncodehk) 和 [Doctor Wu](https://doctorwu.me/)，围绕 Vue 3.6 中引入的全新响应式系统 Alien Signals 展开深入讨论。从 Signal 的概念起源到其与 Vue 2、Vue 3 响应式系统的对比，再到 Alien Signals 的算法优化与性能突破，嘉宾们分享了技术背后的设计哲学与实现细节。此外，我们还探讨了前端框架的未来趋势、TypeScript 的重写计划、开源项目的维护心得，以及 AI 对开发者工作的影响。无论你是前端开发者还是技术爱好者，这期内容都将为你带来启发与思考。

### 2 [硬地骇客丨对话Shawn：如何用一款晒太阳App，在健康赛道中脱颖而出？](https://www.xiaoyuzhoufm.com/episode/67f698cd623bc78c399a1ee8)

为什么一款小小的晒太阳APP，能获得苹果App Store的官方编辑推荐？为什么在竞争激烈的健康赛道，它却能脱颖而出？本期节目将分享SunAlly背后的故事。Shawn 带你深入了解健康类应用市场，他如何利用Apple Watch数据，结合用户情绪价值，打造一款高粘性、高盈利的应用？又是如何利用小红书等平台，巧妙地进行内容营销？

### 3 [硬地骇客丨100期了！硬地骇客和你聊聊独立开发的酸甜苦辣](https://www.xiaoyuzhoufm.com/episode/680f7d0f7a449ae85839741d)

### 4 [浪说播客丨前端自救指南vol.3-走进云谦大神，和他聊聊为什么要从前端基建转型AI开发](https://www.xiaoyuzhoufm.com/episode/67f52f43ff6ff2a40938dd24)

### 5 [异见房间丨女记者说：如何看待“山西订婚案”中的性同意争议？](https://www.xiaoyuzhoufm.com/episode/68065fcbcdd692da15ca6d7f)

---
# 句子

### 1 [关于教育的思考——听「周轶君 一席」播客](https://www.bilibili.com/video/BV1f1LPzwE65/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3&t=122)

1️⃣犯错是学习的必要环节

「如果一个人根本不犯错，说明他都没有尝试，又怎么能真正学到东西呢？」

我们从小都被教育要“避免犯错”，这种思想让我们产生了很大的心理负担。以至于我们逐渐变得不敢犯错，一旦犯了什么错就会觉得“天塌了”。

但回过头仔细想想，我每次在犯错之后，其实都会有特别快的成长。犯错也并不是一件非常可怕的事，更重要的是如何面对错误。

2️⃣学习是为了生活，而不是为了他人的评价

「老师鼓励我加入到课堂中，我谦虚地说，我不太会画画，老师却觉得我的说法很奇怪，她说：这些画不是拿来比较的，有人说过你的画不好吗？」

我们总是活在一个评价体系里，总觉得自己必须“够好”才有资格尝试，却忘了学习的初衷是探索和成长。

当这个老师说“这些画不是拿来比较的”，我心里感到一种震撼，因为我一直把老师当作是给学生打分的角色。

学习的本质并不是为了参加某个“考试”，也不是为了比别人更好，而是在过程中探索自我。

——polebug

### 2 

如果只有话语体系的改变，但是没有结构的调整，就不会实现性别平等。

——沈奕斐

### 3 [在 AI 盛行的当下，也别放弃思考和学习](https://www.bilibili.com/video/BV1vtVpzzEGJ/?share_source=copy_web&vd_source=27102c235ff3a9369a44716ba38084f3&t=237)

前几天看到有个频道的调查：“你现在日常的工作和生活可以离开 AI 工具么？”其中有 53% 的人都选了「不可以」。

在依赖 AI 的同时，我们也必须认真思考一个问题：“我们有没有在慢慢失去独立思考和学习的能力？”

又或者是，如果 AI 的回答是错的，我们该怎么办？我们还能靠自己去解决问题吗？

我最近在写 Rust，对这个问题感触颇深。

目前 AI 写 Rust 的水平还很低，写出来的东西很多是错的。这时候如果我不啃语法、自己读懂文档，根本无法解决实际的问题。

这让我意识到一个现实：

AI  可以给出建议，但它很难解决根本问题，尤其是在我“不懂”的时候。

AI 工具可以加速产出的速度，但并不能真正代替我去产出。

在 AI 渗透进我们生活之后，可能会产出一个分水岭：

一边是彻底依赖工具、渐渐失去思考与判断力的人；一边是把 AI 当成辅助，仍然坚持自我，持续思考和学习的人。

请继续享受学习的快乐，共勉~

### 4

语言表达并不总是必须用最精炼简洁的方式亮出观点或传达信息。语言表达往往也是为了建立联系，是为了让你自己被人理解，同时试着理解别人。

——《语言恶女》