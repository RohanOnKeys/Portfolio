// Shows a darkened screenshot of a link's destination while hovering it.
// Screenshots live in assets/previews/, keyed by the link's href (external)
// or by its path from the site root (internal pages).
(() => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const PREVIEWS = {
    'https://github.com/RohanOnKeys': 'github-com-rohanonkeys-43c06e.jpg',
    'https://github.com/RohanOnKeys/bitcraft': 'github-com-rohanonkeys-bitcraft-4c0f44.jpg',
    'https://pypi.org/project/bitcraft/': 'pypi-org-project-bitcraft-dd68dc.jpg',
    'https://github.com/RohanOnKeys/cerebro': 'github-com-rohanonkeys-cerebro-f5ee6f.jpg',
    'https://cerebro-teams.vercel.app': 'cerebro-teams-vercel-app-78a50a.jpg',
    'https://github.com/RohanOnKeys/Ariadne': 'github-com-rohanonkeys-ariadne-e77960.jpg',
    'https://github.com/RohanOnKeys/Freight': 'github-com-rohanonkeys-freight-93a45d.jpg',
    'https://github.com/RohanOnKeys/yab': 'github-com-rohanonkeys-yab-804854.jpg',
    'https://github.com/RohanOnKeys/Visor': 'github-com-rohanonkeys-visor-06c5ee.jpg',
    'https://github.com/RohanOnKeys/Visor-V2': 'github-com-rohanonkeys-visor-v2-125b36.jpg',
    'https://github.com/RohanOnKeys/rustom': 'github-com-rohanonkeys-rustom-508bdb.jpg',
    'https://crates.io/crates/rustom': 'crates-io-crates-rustom-0ca942.jpg',
    'https://github.com/RohanOnKeys/mopper': 'github-com-rohanonkeys-mopper-6571be.jpg',
    'https://github.com/RohanOnKeys/Hammer-CLI': 'github-com-rohanonkeys-hammer-cli-e2577a.jpg',
    'https://github.com/RohanOnKeys/Hammer-MCP': 'github-com-rohanonkeys-hammer-mcp-afd618.jpg',
    'https://glama.ai/mcp/servers/RohanOnKeys/Hammer-MCP': 'glama-ai-mcp-servers-rohanonkeys-hammer-mcp-9a832c.jpg',
    'https://github.com/RohanOnKeys/crabbit': 'github-com-rohanonkeys-crabbit-4b5091.jpg',
    'https://github.com/RohanOnKeys/langX': 'github-com-rohanonkeys-langx.jpg',
    'https://github.com/RohanOnKeys/North-Star': 'github-com-rohanonkeys-north-star-add66a.jpg',
    'https://github.com/RohanOnKeys/Waterlily': 'github-com-rohanonkeys-waterlily-094295.jpg',
    'https://github.com/TheHPXProject/hpx/pulls?q=author:RohanOnKeys': 'github-com-thehpxproject-hpx-pulls-q-author-roha-20dd19.jpg',
    'https://github.com/checkpoint-restore/criu/pull/3164': 'github-com-checkpoint-restore-criu-pull-3164-38ddce.jpg',
    'https://github.com/Submitty/Submitty/pull/12947': 'github-com-submitty-submitty-pull-12947-8f6f41.jpg',
    // Hand-taken screenshots for sites that block automated capture.
    'https://www.linkedin.com/in/rohan-pattanayak-a142a1284': 'linkedin.jpg',
    'https://x.com/RohanOnTweets': 'x.jpg',
    'https://pypi.org/project/yab-ml/': 'pypi-yab-ml.jpg',
    'https://pypi.org/project/mopper/': 'pypi-mopper.jpg',
    'blog.html': 'blog-html-7d022d.jpg',
    'articles/quantum-transpiler.html': 'articles-quantum-transpiler-html-0d2f8b.jpg',
    'articles/browser-agents-dom.html': 'articles-browser-agents-dom-html-ea9a3d.jpg',
    'articles/frontend-interaction.html': 'articles-frontend-interaction-html-d2da8f.jpg',
    'articles/resumption-network-feature.html': 'articles-resumption-network-feature-html-3b39fb.jpg',
    'articles/context-compilers-preserve.html': 'articles-context-compilers-preserve-html-7ca30d.jpg',
  };

  const siteRoot = new URL('..', document.currentScript.src).href;
  const previewDir = new URL('previews/', document.currentScript.src).href;

  const previewFor = (link) => {
    const raw = link.getAttribute('href') || '';
    if (PREVIEWS[raw]) return previewDir + PREVIEWS[raw];
    if (link.href.startsWith(siteRoot)) {
      const local = PREVIEWS[link.href.slice(siteRoot.length).split('#')[0]];
      if (local) return previewDir + local;
    }
    return null;
  };

  const init = () => {
    const box = document.createElement('div');
    box.className = 'link-preview';
    box.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.alt = '';
    // A preview whose screenshot hasn't been added yet just stays hidden.
    img.addEventListener('error', () => box.classList.remove('is-visible'));
    box.appendChild(img);
    document.body.appendChild(box);

    const OFFSET = 18;
    const place = (x, y) => {
      const { width, height } = box.getBoundingClientRect();
      let left = x + OFFSET;
      let top = y + OFFSET;
      if (left + width > window.innerWidth - 8) left = x - OFFSET - width;
      if (top + height > window.innerHeight - 8) top = y - OFFSET - height;
      box.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
    };

    // Runs on first load and again whenever nav.js swaps in a new page.
    const bind = () => {
      box.classList.remove('is-visible');
      const links = [...document.querySelectorAll('a[href]')].filter((a) => !a.closest('.nav'));
      const sources = new Set();
      links.forEach((link) => {
        const src = previewFor(link);
        if (!src) return;
        sources.add(src);
        link.addEventListener('pointerenter', (e) => {
          img.src = src;
          place(e.clientX, e.clientY);
          box.classList.add('is-visible');
        });
        link.addEventListener('pointermove', (e) => place(e.clientX, e.clientY));
        link.addEventListener('pointerleave', () => box.classList.remove('is-visible'));
        link.addEventListener('click', () => box.classList.remove('is-visible'));
      });

      // Warm the cache so previews appear instantly on first hover.
      const warm = () => sources.forEach((src) => { new Image().src = src; });
      if ('requestIdleCallback' in window) requestIdleCallback(warm);
      else setTimeout(warm, 1200);
    };

    bind();
    document.addEventListener('page:load', bind);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
