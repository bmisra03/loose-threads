export const TITLE = 'Loose Threads';
export const SUBTITLE = 'Unfinished thoughts on how things work.';
export const DESCRIPTION = 'An independent technical blog exploring operating systems, networking, distributed systems, cloud infrastructure, and the ideas underneath them.';

// Use for public assets and routes in Astro templates.
export function withBase(path = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(date);
}
