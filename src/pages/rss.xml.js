import rss, {pagesGlobToRssItems} from '@astrojs/rss';

export async function GET(context) {
  return rss({
    title: '筷筷的博客',
    description: '我的人类使用说明书',
    site: context.site,
    items: await pagesGlobToRssItems(
      import.meta.glob('./posts/*.{md,mdx}'),
    ),
    stylesheet: '/rss/styles.xsl',
    customData: `<language>zh-cn</language>`,
  });
}