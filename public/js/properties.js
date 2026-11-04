/* Lista e pronave me filtra, renditje dhe faqosje */
(async () => {
  const { $, $$, esc, fmt, api, meta, card, skeletons, I } = DL;
  const form = $('#filters'), grid = $('#grid');
  const KEYS = ['deal', 'q', 'city', 'type', 'min', 'max', 'rooms', 'minArea', 'furnished', 'parking'];
  const LABEL = { deal: v => v === 'qira' ? 'Me qira' : 'Në shitje', q: v => `“${v}”`, city: v => v, type: v => v, min: v => `nga ${fmt(v)} €`, max: v => `deri ${fmt(v)} €`, rooms: v => `${v}+ dhoma`, minArea: v => `min. ${v} m²`, furnished: () => 'I mobiluar', parking: () => 'Me parkim' };
  let page = 1, timer;
  $('#f-close').innerHTML = I.close;

  let view = 'grid'; try { view = localStorage.getItem('dl_view') || 'grid'; } catch {}
  function setView(v) { view = v; $('#results-wrap').classList.toggle('list-view', v === 'list'); $$('.view-toggle button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v)); try { localStorage.setItem('dl_view', v); } catch {} }
  setView(view);

  const m = await meta().catch(() => null);
  if (m) {
    $('#f-city').innerHTML += m.cities.map(c => `<option>${esc(c.city)}</option>`).join('');
    $('#f-type').innerHTML += m.allTypes.map(t => `<option>${esc(t)}</option>`).join('');
  }

  const setField = (el, v) => {
    if (el instanceof RadioNodeList) [...el].forEach(r => r.checked = r.value === v);
    else if (el.type === 'checkbox') el.checked = v === '1';
    else el.value = v;
  };
  // Lexo filtrat nga adresa
  const url = new URLSearchParams(location.search);
  KEYS.forEach(k => {
    const v = url.get(k); if (v == null) return;
    const el = form.elements[k];
    if (el) setField(el, v);
  });
  $('#sort').value = url.get('sort') || '';
  page = Number(url.get('page')) || 1;

  function state() {
    const s = {};
    KEYS.forEach(k => {
      const el = form.elements[k];
      const v = el.type === 'checkbox' ? (el.checked ? '1' : '') : String(el.value || '').trim().replace(/\./g, '');
      if (v) s[k] = k === 'q' || k === 'city' || k === 'type' || k === 'deal' ? String(form.elements[k].value).trim() : v;
    });
    if ($('#sort').value) s.sort = $('#sort').value;
    return s;
  }

  async function load(scroll) {
    const s = state();
    const qs = new URLSearchParams({ ...s, ...(page > 1 ? { page } : {}) });
    history.replaceState(null, '', '/properties.html' + (qs.toString() ? '?' + qs : ''));
    $('#title').textContent = s.deal === 'qira' ? 'Prona me qira' : s.deal === 'shitje' ? 'Prona në shitje' : 'Të gjitha pronat';
    document.title = $('#title').textContent + (s.city ? ` në ${s.city}` : '') + ' – De Luxe Real Estate';
    $('#tags').innerHTML = Object.keys(s).filter(k => LABEL[k]).map(k => `<button type="button" data-clear="${k}" aria-label="Hiq filtrin">${esc(LABEL[k](s[k]))} <span aria-hidden="true">×</span></button>`).join('');
    grid.innerHTML = skeletons(6);
    try {
      const r = await api('/api/properties?' + new URLSearchParams({ ...s, page, limit: 12 }));
      page = r.page;
      $('#count').innerHTML = `<b>${r.total}</b> ${r.total === 1 ? 'pronë' : 'prona'}`;
      grid.innerHTML = r.items.length ? r.items.map(card).join('') :
        `<div class="empty"><h3>Nuk gjetëm asnjë pronë</h3><p>Provoni të hiqni disa filtra, ose na tregoni çfarë kërkoni dhe ju njoftojmë kur të dalë.</p>
         <p style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap"><button class="btn outline sm" type="button" id="empty-reset">Pastro filtrat</button><a class="btn sm" href="${DL.waLink('Përshëndetje, po kërkoj një pronë: ' + Object.values(s).join(', '))}" target="_blank" rel="noopener">Na shkruani në WhatsApp</a></p></div>`;
      $('#empty-reset')?.addEventListener('click', reset);
      pager(r.pages);
      if (scroll) $('#results-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      grid.innerHTML = `<div class="empty"><h3>Gabim gjatë ngarkimit</h3>${esc(e.message)}<p><button class="btn outline sm" type="button" onclick="location.reload()">Provo sërish</button></p></div>`;
      $('#count').textContent = '';
    }
  }
  function pager(pages) {
    if (pages <= 1) { $('#pager').innerHTML = ''; return; }
    const nums = [];
    for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
    $('#pager').innerHTML = `<button type="button" data-p="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Faqja e mëparshme">‹</button>` +
      nums.map(n => n === '…' ? '<button type="button" disabled>…</button>' : `<button type="button" data-p="${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`).join('') +
      `<button type="button" data-p="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Faqja tjetër">›</button>`;
  }
  function reset() { form.reset(); setField(form.elements.deal, ''); $('#sort').value = ''; page = 1; load(); }

  form.addEventListener('change', () => { page = 1; if (innerWidth > 960) load(); });
  form.addEventListener('input', e => { if (e.target.matches('input[type=text],input:not([type]),[inputmode]')) { clearTimeout(timer); timer = setTimeout(() => { page = 1; if (innerWidth > 960) load(); }, 450); } });
  form.addEventListener('submit', e => { e.preventDefault(); page = 1; load(); });
  $('#sort').addEventListener('change', () => { page = 1; load(); });
  $('#reset').addEventListener('click', reset);
  $('#pager').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.disabled) { page = Number(b.dataset.p); load(true); } });
  $('#tags').addEventListener('click', e => {
    const b = e.target.closest('[data-clear]'); if (!b) return;
    setField(form.elements[b.dataset.clear], '');
    page = 1; load();
  });
  $$('.view-toggle button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  const openF = on => { form.classList.toggle('open', on); document.body.style.overflow = on ? 'hidden' : ''; };
  $('#f-open').addEventListener('click', () => openF(true));
  $('#f-close').addEventListener('click', () => openF(false));
  $('#apply').addEventListener('click', () => { openF(false); page = 1; load(true); });

  load();
})();
