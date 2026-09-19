(() => {
  const key = 'kindo.riskAcknowledged.v1';
  function acknowledged() {
    try { return window.localStorage.getItem(key) === 'true'; }
    catch { return false; }
  }
  // Block interaction immediately, before the page finishes parsing.
  if (!acknowledged()) document.documentElement.classList.add('risk-locked');
  function init() {
    const notice = document.getElementById('riskNotice');
    const checkbox = document.getElementById('riskAcknowledgement');
    const button = document.getElementById('riskContinue');
    if (!notice || !checkbox || !button) return;
    function sync() {
      if (acknowledged()) {
        if (notice.open) notice.close();
        document.documentElement.classList.remove('risk-locked');
        return;
      }
      document.documentElement.classList.add('risk-locked');
      checkbox.checked = false;
      button.disabled = true;
      notice.hidden = false;
      if (!notice.open) notice.showModal();
    }
    notice.addEventListener('cancel', event => event.preventDefault());
    checkbox.addEventListener('change', () => { button.disabled = !checkbox.checked; });
    button.addEventListener('click', () => {
      if (!checkbox.checked) return;
      try { window.localStorage.setItem(key, 'true'); } catch { /* Unlock this visit if storage is blocked. */ }
      notice.close();
      document.documentElement.classList.remove('risk-locked');
      document.querySelector('.brand')?.focus({ preventScroll: true });
    });
    window.addEventListener('pageshow', event => { if (event.persisted) sync(); });
    window.addEventListener('storage', event => { if (event.key === key || event.key === null) sync(); });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
