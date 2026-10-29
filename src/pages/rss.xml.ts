import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/posts';
import { TITLE, SUBTITLE, withBase } from '../lib/site';
export async function GET(context: APIContext) {
  return rss({
    title: TITLE,
    description: SUBTITLE,
    site: context.site!,
    items: (await getPosts()).filter(post => !post.data.draft).map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: post.data.tags,
      link: withBase(`writing/${post.id}/`),
    })),
    customData: '<language>en</language>',
  });
}
