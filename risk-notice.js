(() => {
  const notice = document.getElementById('riskNotice');
  const checkbox = document.getElementById('riskAcknowledgement');
  const button = document.getElementById('riskContinue');
  if (!notice || !checkbox || !button) return;
  const key = 'kindo.riskAcknowledged.v1';
  try {
    if (window.localStorage.getItem(key) === 'true') return;
  } catch {
    // Storage can be unavailable; acknowledgement still works for this visit.
  }
  checkbox.checked = false;
  button.disabled = true;
  notice.hidden = false;
  checkbox.addEventListener('change', () => {
    button.disabled = !checkbox.checked;
  });
  button.addEventListener('click', () => {
    if (!checkbox.checked) return;
    try {
      window.localStorage.setItem(key, 'true');
    } catch {
      // Do not block access when browser storage is disabled.
    }
    notice.hidden = true;
    const homeLink = document.querySelector('.site-header .brand');
    if (homeLink) homeLink.focus({ preventScroll: true });
  });
})();
