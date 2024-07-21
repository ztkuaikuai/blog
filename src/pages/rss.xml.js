import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';

export async function GET(context) {
  const postImportResult = import.meta.glob('./posts/*.md', { eager: true });
  const posts = Object.values(postImportResult);
  return rss({
    title: '筷筷的博客',
    description: '我的人类使用说明书',
    site: context.site,
    items: posts.map((post) => ({
      link: post.url,
      content: post.compiledContent(),
      ...post.frontmatter,
    })),
    stylesheet: '/rss/styles.xsl',
    customData: `<language>zh-cn</language>`,
  });
}