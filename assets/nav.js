// Moves between the site's own pages without a full reload, so the background
// music keeps playing. The new page's content and background are swapped in
// place and the address bar is updated. Anything this can't handle falls back
// to a normal page load. Other scripts listen for `page:load` to rebind.
(() => {
  const siteRoot = new URL('..', document.currentScript.src).href;

  // Nav hover: the other items shrink while one is hovered.
  const bindNav = () => {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const items = nav.querySelectorAll('.interactive');
    items.forEach((item) => {
      item.addEventListener('mouseenter', () => {
        items.forEach((el) => el.classList.toggle('shrink', el !== item));
      });
      item.addEventListener('mouseleave', () => {
        items.forEach((el) => el.classList.remove('shrink'));
      });
    });
  };
  bindNav();
  document.addEventListener('page:load', bindNav);

  if (!('fetch' in window && 'DOMParser' in window && history.pushState)) return;

  // The browser rechecks the tab icon on every address change, so pin the
  // icon links to absolute URLs before moving into or out of articles/.
  document.querySelectorAll('head link[rel~="icon"], head link[rel="apple-touch-icon"]')
    .forEach((link) => { link.href = link.href; });

  const withoutHash = (href) => href.split('#')[0];
  const isPage = (url) =>
    url.href.startsWith(siteRoot) && (url.pathname.endsWith('.html') || url.pathname.endsWith('/'));

  let current = withoutHash(location.href);
  let latest = 0;

  const swap = async (href, push) => {
    const id = ++latest;
    let doc;
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(String(res.status));
      doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    } catch {
      location.href = href;
      return;
    }
    if (id !== latest) return; // a newer click took over
    const next = doc.querySelector('.site');
    if (!next) {
      location.href = href;
      return;
    }

    // Update the address first so relative links and images in the new
    // content resolve against the new page.
    if (push) {
      history.replaceState({ scroll: scrollY }, '');
      history.pushState({}, '', href);
    }
    current = withoutHash(href);

    document.title = doc.title;
    const desc = doc.querySelector('meta[name="description"]');
    const here = document.querySelector('meta[name="description"]');
    if (desc && here) here.content = desc.content;
    document.body.className = doc.body.className;
    document.querySelector('.site').replaceWith(document.adoptNode(next));

    const hash = new URL(href).hash;
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) target.scrollIntoView();
    else scrollTo(0, push ? 0 : (history.state && history.state.scroll) || 0);

    document.dispatchEvent(new Event('page:load'));
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (!isPage(url)) return;
    if (url.hash && withoutHash(url.href) === current) return; // jump within this page
    e.preventDefault();
    swap(url.href, true);
  });

  addEventListener('popstate', () => {
    if (withoutHash(location.href) === current) return; // only the hash changed
    swap(location.href, false);
  });
})();
