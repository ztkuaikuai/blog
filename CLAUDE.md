# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack
- **Framework**: Astro 4.0.7 (Static Site Generator)
- **Styling**: Tailwind CSS with dark mode support
- **Language**: TypeScript
- **Deployment**: Vercel (Static adapter)
- **Package Manager**: pnpm

## Project Structure
```
src/
├── assets/           # Static assets (images, fonts)
├── components/       # Reusable Astro components
│   ├── Card.astro    # Post card component
│   ├── Hero.astro    # Homepage hero section
│   └── LatestPosts.astro  # Latest posts display
├── layouts/          # Page layouts
│   └── Base.astro    # Base layout with navbar/footer
├── pages/            # File-based routing
│   ├── posts/        # Blog posts (MD files)
│   ├── tags/         # Tag-based post filtering
│   └── about/        # About page
├── utils/            # Utility functions
│   ├── AppConfig.ts  # Site configuration
│   ├── data.util.ts  # Date formatting and sorting
│   └── readingTime.ts # Reading time calculation
```

## Key Configuration Files
- `astro.config.mjs`: Astro configuration with Vercel deployment, Tailwind, React, and sitemap
- `tailwind.config.mjs`: Tailwind configuration with dark mode and typography plugin
- `src/utils/AppConfig.ts`: Site metadata and configuration

## Development Commands
```bash
# Install dependencies
pnpm i

# Development server with auto-open
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Astro CLI commands
pnpm astro dev
pnpm astro build
```

## Content Management
- Blog posts are written in Markdown and stored in `src/pages/posts/`
- Frontmatter includes: title, description, pubDate, tags, heroImage
- Posts are automatically sorted by publication date
- RSS feed is generated at `/rss.xml`
- Sitemap is generated at `/sitemap-index.xml`

## Features
- **Dark mode**: Toggle with localStorage persistence
- **Syntax highlighting**: Using rehype-pretty-code
- **Reading time**: Calculated for each post
- **Responsive design**: Mobile-first with Tailwind
- **SEO**: Meta tags, sitemap, and RSS feed
- **Analytics**: Vercel Web Analytics enabled