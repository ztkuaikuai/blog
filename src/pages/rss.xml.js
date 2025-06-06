import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';

export async function GET(context) {
  const postImportResult = import.meta.glob('./posts/*.md', { eager: true });
  const posts = Object.values(postImportResult);
  return rss({
    title: '筷筷的博客',
    link: 'blog.kuaikuaitz.top',
    description: '我的人类使用说明书',
    author: "筷筷",
    commentsUrl: "https://github.com/ztkuaikuai",
    site: context.site,
    items: posts
      .map((post) => ({
        link: post.url,
        content: sanitizeHtml(post.compiledContent(), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
        }),
        ...post.frontmatter,
      }))
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)),
    stylesheet: '/rss/styles.xsl',
    customData: `<language>zh-cn</language>`,
  });
}