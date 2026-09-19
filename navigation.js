(() => {
  const header = document.querySelector('.kindo-header');
  if (!header) return;
  const nav = header.querySelector('.kindo-navigation');
  const toggle = header.querySelector('.kindo-menu-toggle');
  const groups = [...nav.querySelectorAll('details')];
  const closeGroups = () => groups.forEach(group => { group.open = false; });
  const closeMobile = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    toggle.textContent = '☰';
  };
  groups.forEach(group => group.querySelector('summary').addEventListener('click', () => {
    groups.forEach(other => { if (other !== group) other.open = false; });
  }));
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    toggle.textContent = open ? '×' : '☰';
    if (!open) closeGroups();
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) { closeGroups(); closeMobile(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = groups.find(group => group.open);
    if (open) { open.open = false; open.querySelector('summary').focus(); }
    else if (nav.classList.contains('is-open')) { closeMobile(); toggle.focus(); }
  });
  header.addEventListener('focusout', event => {
    if (!header.contains(event.relatedTarget)) { closeGroups(); closeMobile(); }
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { closeGroups(); closeMobile(); }));
  matchMedia('(max-width:800px)').addEventListener('change', () => { closeGroups(); closeMobile(); });
})();
