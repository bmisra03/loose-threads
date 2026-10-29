import { renderMermaidSVG } from 'beautiful-mermaid';
import { createHash } from 'node:crypto';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Convert before syntax highlighting. Unsupported syntax fails the build.
export default function remarkMermaid() {
  return tree => {
    function visit(node) {
      if (node.type === 'code' && node.lang === 'mermaid') {
        const title = node.value.match(/^\s*accTitle:\s*(.+)$/m)?.[1];
        const description = node.value.match(/^\s*accDescr:\s*(.+)$/m)?.[1];
        if (!title || !description) throw new Error('Mermaid diagrams require accTitle and accDescr for accessibility.');
        const source = node.value.replace(/^\s*acc(?:Title|Descr):.*$/gm, '');
        const id = `diagram-${createHash('sha256').update(node.value).digest('hex').slice(0, 12)}`;
        let svg = renderMermaidSVG(source, {
          bg: '#f8f6f0', fg: '#292c29', line: '#777d72', accent: '#52664b',
          muted: '#666b62', surface: '#eeece5', border: '#777d72',
          font: 'Georgia', transparent: true,
        });
        // Scope marker IDs so multiple diagrams can share a page safely.
        svg = svg.replace(/id="([^"]+)"/g, (_, value) => `id="${id}-${value}"`)
          .replace(/url\(#([^)]+)\)/g, (_, value) => `url(#${id}-${value})`);
        svg = svg.replace(/<svg\b([^>]*)>/, `<svg$1 role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${escape(title)}</title><desc id="${id}-desc">${escape(description)}</desc>`);
        node.type = 'html';
        node.value = `<figure class="diagram" tabindex="0" aria-label="${escape(title)}">${svg}</figure>`;
        delete node.lang;
        delete node.meta;
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
