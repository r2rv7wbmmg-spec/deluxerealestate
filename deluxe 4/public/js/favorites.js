/* Pronat e ruajtura (ruhen në shfletues) */
(() => {
  const { $, api, card, skeletons, favs, toast, esc } = DL;
  async function render() {
    const ids = favs();
    $('#fav-actions').hidden = !ids.length;
    if (!ids.length) {
      $('#grid').innerHTML = '<div class="empty"><h3>Nuk keni ruajtur asnjë pronë</h3><p>Shtypni zemrën te çdo pronë për ta ruajtur këtu dhe për t’i krahasuar më vonë.</p><p><a class="btn" href="/properties.html">Shikoni pronat</a></p></div>';
      return;
    }
    $('#grid').innerHTML = skeletons(Math.min(ids.length, 6));
    try {
      const r = await api('/api/properties?limit=48&ids=' + ids.join(','));
      $('#grid').innerHTML = r.items.length ? r.items.map(card).join('') : '<div class="empty"><h3>Pronat e ruajtura nuk janë më në ofertë</h3><p><a class="btn" href="/properties.html">Shikoni pronat aktuale</a></p></div>';
      const text = 'Përshëndetje, më interesojnë këto prona:\n' + r.items.map(p => `${p.code} – ${p.title} (${location.origin}/property.html?id=${p.id})`).join('\n');
      $('#fav-wa').href = DL.waLink(text);
    } catch (e) { $('#grid').innerHTML = `<div class="empty"><h3>Gabim</h3>${esc(e.message)}</div>`; }
  }
  $('#fav-clear').addEventListener('click', () => {
    if (!confirm('Të hiqen të gjitha pronat e ruajtura?')) return;
    try { localStorage.setItem('dl_favs', '[]'); } catch {}
    document.querySelectorAll('.fav-count').forEach(b => { b.textContent = ''; b.dataset.n = 0; });
    toast('Lista u pastrua.'); render();
  });
  document.addEventListener('favs:change', () => setTimeout(render, 150));
  DL.meta().finally(render);
})();
