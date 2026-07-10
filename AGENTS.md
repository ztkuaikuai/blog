# 筷筷的博客

## 项目概览
- 基于 **Astro 6**（`astro@^6.0.8`）的博客，使用基于文件的路由。
- 样式使用 **Tailwind CSS 3** + typography 插件 + 自定义全局 CSS。
- 语言：**TypeScript**（`astro/tsconfigs/strict`），路径别名 `@/* -> src/*`。
- 部署目标：**Vercel** 静态输出（`output: 'static'`，`@astrojs/vercel` 适配器）。
- 包管理器：**pnpm**。
- 运行时要求：**Node >= 22.12.0**。

## 当前架构
```text
src/
  components/                # UI 组件层（卡片、导航、文章展示等）
  layouts/                   # 页面布局层（全局布局、文章布局）
  pages/                     # 路由层（首页、文章、标签、关于、友链、RSS）
    posts/*.md               # 内容层（Markdown 文章）
  styles/                    # 全局样式入口
  utils/                     # 配置与数据处理工具
```

## 内容与数据流
- 文章是 `src/pages/posts/*.md` 中的 Markdown 文件。
- 列表页（`/`、`/posts`、`/tags`、`/tags/[tag]`）使用 `import.meta.glob(..., { eager: true })`。
- 排序由 `src/utils/data.util.ts` 中的 `sortPostsByDate` 完成。
- `remarkReadingTime`（位于 `src/utils/readingTime.ts`）在 markdown 处理期间将 `minutesRead` 注入到 frontmatter 中。
- 布局/组件使用的典型 frontmatter 字段：
  - `layout`、`title`、`pubDate`、`description`、`author`、`excerpt`、`tags`、`image.src`、`image.alt`。

## 重要集成
- `astro.config.mjs`
  - `rehype-pretty-code` 用于代码高亮（已禁用 Astro 内置高亮）。
  - 已启用 `remarkReadingTime`。
  - 已启用 `@astrojs/react`、`@astrojs/sitemap`、`@astrojs/vercel`。
- `src/layouts/post.astro`
  - Giscus 评论（主题与本地暗色模式同步）。
  - Viewer.js 用于文章内图片预览。
- `src/pages/rss.xml.js`
  - 从所有 markdown 文章生成 RSS。
  - 文章 HTML 使用 `sanitize-html` 进行清理（明确允许 `img` 标签）。

## 样式与主题
- 全局样式入口在 `src/layouts/Base.astro` 中导入：`@/styles/global.css`。
- 暗色模式状态键：`localStorage['dark-mode']`。
- 主题切换逻辑位于 `src/components/Navbar.astro`，同时也会更新 giscus iframe 主题。

## 常用命令
```bash
pnpm i
pnpm dev
pnpm build
pnpm preview
pnpm astro check
```

## 维护注意事项
- 保持 `src/components/Navbar.astro` 中的导航链接与页面路由同步。
- 除非布局策略发生变化，新文章应继续使用 `../../layouts/post.astro`。
- 如果元数据（网站标题/描述/作者）发生变化，请更新 `src/utils/AppConfig.ts`。

## Agent skills

### Issue tracker

Issue 以 GitHub Issues 形式管理，仓库 `ztkuaikuai/blog`，使用 `gh` CLI 操作。详见 `docs/agents/issue-tracker.md`。

### Domain docs

单上下文布局：一个 `CONTEXT.md` + `docs/adr/` 位于仓库根目录。详见 `docs/agents/domain.md`。
