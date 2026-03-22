import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
	return function (tree: any, { data }: any) {
		const textOnPage = toString(tree);
		const readingTime = getReadingTime(textOnPage);
		const minutes = Math.max(1, Math.ceil(readingTime.minutes));
		data.astro.frontmatter.minutesRead = `预计阅读时间 ${minutes} 分钟`;
	};
}
