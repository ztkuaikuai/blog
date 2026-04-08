# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project Overview
- Blog based on **Astro 6** (`astro@^6.0.8`) with file-based routing.
- Styling uses **Tailwind CSS 3** + typography plugin + custom global CSS.
- Language: **TypeScript** (`astro/tsconfigs/strict`), with path alias `@/* -> src/*`.
- Deployment target: **Vercel** static output (`output: 'static'`, `@astrojs/vercel` adapter).
- Package manager: **pnpm**.
- Runtime requirement: **Node >= 22.12.0**.

## Current Architecture
```text
src/
  components/                # UI 组件层（卡片、导航、文章展示等）
  layouts/                   # 页面布局层（全局布局、文章布局）
  pages/                     # 路由层（首页、文章、标签、关于、友链、RSS）
    posts/*.md               # 内容层（Markdown 文章）
  styles/                    # 全局样式入口
  utils/                     # 配置与数据处理工具
```

## Content and Data Flow
- Posts are Markdown files in `src/pages/posts/*.md`.
- Listing pages (`/`, `/posts`, `/tags`, `/tags/[tag]`) use `import.meta.glob(..., { eager: true })`.
- Sorting is done by `sortPostsByDate` from `src/utils/data.util.ts`.
- `remarkReadingTime` (in `src/utils/readingTime.ts`) injects `minutesRead` into frontmatter during markdown processing.
- Typical frontmatter fields used by layouts/components:
  - `layout`, `title`, `pubDate`, `description`, `author`, `excerpt`, `tags`, `image.src`, `image.alt`.

## Important Integrations
- `astro.config.mjs`
  - `rehype-pretty-code` for code highlighting (Astro built-in highlighting disabled).
  - `remarkReadingTime` enabled.
  - `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/vercel` enabled.
- `src/layouts/post.astro`
  - Giscus comments (theme synchronized with local dark mode).
  - Viewer.js for in-post image preview.
- `src/pages/rss.xml.js`
  - RSS generated from all markdown posts.
  - Post HTML is sanitized with `sanitize-html` (explicitly allows `img` tags).

## Styling and Theme
- Global style entry is imported in `src/layouts/Base.astro`: `@/styles/global.css`.
- Dark mode state key: `localStorage['dark-mode']`.
- Theme toggle logic is in `src/components/Navbar.astro` and also updates giscus iframe theme.

## Common Commands
```bash
pnpm i
pnpm dev
pnpm build
pnpm preview
pnpm astro check
```

## Maintenance Notes
- Keep navigation links in `src/components/Navbar.astro` in sync with page routes.
- New posts should continue using `../../layouts/post.astro` unless layout strategy changes.
- If metadata changes (site title/description/author), update `src/utils/AppConfig.ts`.
