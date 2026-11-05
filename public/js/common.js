/* Pjesët e përbashkëta: koka, fundi, karta e pronës, favoritet, WhatsApp dhe asistenti */
const DL = (() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('de-DE');
  let META = null;

  const I = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    area: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 9h5V4"/></svg>',
    bed: '<svg viewBox="0 0 24 24"><path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3M7 11.5a1.5 1.5 0 1 0 0-.01"/></svg>',
    bath: '<svg viewBox="0 0 24 24"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z"/></svg>'
  };

  /* ---------- API ---------- */
  async function api(url, opts = {}) {
    const o = { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } };
    if (o.body && typeof o.body !== 'string') o.body = JSON.stringify(o.body);
    let r;
    try { r = await fetch(url, o); } catch { throw new Error('Nuk ka lidhje me serverin. Kontrolloni internetin.'); }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Ndodhi një gabim.'); e.status = r.status; throw e; }
    return data;
  }
  async function meta() { if (!META) META = await api('/api/meta'); return META; }

  /* ---------- njoftimet ---------- */
  function toast(msg, type = 'ok') {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
    const t = document.createElement('div'); t.className = 'toast' + (type === 'err' ? ' err' : ''); t.textContent = msg; box.append(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ---------- favoritet ---------- */
  const FKEY = 'dl_favs';
  const favs = () => { try { return JSON.parse(localStorage.getItem(FKEY) || '[]'); } catch { return []; } };
  function toggleFav(id) {
    id = Number(id); let f = favs();
    const on = !f.includes(id); f = on ? [...f, id] : f.filter(x => x !== id);
    try { localStorage.setItem(FKEY, JSON.stringify(f)); } catch {}
    $$(`[data-fav="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Hiqe nga të ruajturat' : 'Ruaje pronën'); });
    updateFavCount(); toast(on ? 'Prona u ruajt te të preferuarat.' : 'Prona u hoq nga të preferuarat.');
    document.dispatchEvent(new CustomEvent('favs:change', { detail: f }));
    return on;
  }
  function updateFavCount() { const n = favs().length; $$('.fav-count').forEach(b => { b.textContent = n || ''; b.dataset.n = n; }); }

  /* ---------- formatimi ---------- */
  function price(p, withLek = false) {
    const rate = META?.site?.eurToLek || 95;
    const main = `${fmt(p.price)} €${p.deal === 'qira' ? ' <small>/ muaj</small>' : ''}`;
    return withLek ? `${main}<br><small>≈ ${fmt(p.price * rate)} Lekë</small>` : main;
  }
  const FALLBACK = '/img/placeholder.svg';
  const imgTag = (src, alt, cls = '') => `<img src="${esc(src || FALLBACK)}" alt="${esc(alt)}" loading="lazy" ${cls ? `class="${cls}"` : ''} onerror="this.onerror=null;this.src='${FALLBACK}'">`;
  function roomsLabel(p) { return p.type === 'Zyrë' || p.type === 'Dyqan' ? 'ambiente' : 'dhoma'; }

  function card(p) {
    const fav = favs().includes(p.id);
    const specs = p.type === 'Tokë'
      ? `<span>${I.area}${fmt(p.area)} m²</span>`
      : `<span>${I.area}${fmt(p.area)} m²</span>${p.rooms ? `<span>${I.bed}${p.rooms} ${roomsLabel(p)}</span>` : ''}${p.bathrooms ? `<span>${I.bath}${p.bathrooms}</span>` : ''}`;
    const imgs = (p.images.length ? p.images : [FALLBACK]).slice(0, 10), many = imgs.length > 1;
    return `<article class="pcard">
      <div class="ph">
        ${many
          ? `<div class="slides" role="group" aria-roledescription="galeri" aria-label="Fotot e ${esc(p.title)}">${imgs.map((src, i) => `<span class="slide">${imgTag(src, `${p.title} – foto ${i + 1}`)}</span>`).join('')}</div>`
          : `<a href="/property.html?id=${p.id}" class="slides" aria-label="${esc(p.title)}" draggable="false"><span class="slide">${imgTag(imgs[0], p.title)}</span></a>`}
        <span class="tag ${p.deal}">${p.deal === 'shitje' ? 'Në shitje' : 'Me qira'}</span>
        ${many ? `<button type="button" class="sl-btn prev" data-slide="-1" aria-label="Fotoja e mëparshme">‹</button><button type="button" class="sl-btn next" data-slide="1" aria-label="Fotoja tjetër">›</button>
        ${imgs.length <= 6 ? `<span class="dots" aria-hidden="true">${imgs.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</span>` : `<span class="cnt"><b>1</b> / ${imgs.length}</span>`}` : ''}
      </div>
      <button class="fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Hiqe nga të ruajturat' : 'Ruaje pronën'}">${I.heart}</button>
      <a href="/property.html?id=${p.id}" class="info" style="text-decoration:none">
        <span class="price">${price(p)}</span>
        <h3>${esc(p.title)}</h3>
        <span class="loc">${esc(p.zone ? p.zone + ', ' : '')}${esc(p.city)}</span>
        <span class="specs">${specs}<span class="code">${esc(p.code)}</span></span>
      </a></article>`;
  }
  const skeletons = n => Array.from({ length: n }, () => '<div class="sk-card"><div class="ph skeleton"></div><div class="sk-line skeleton" style="width:40%"></div><div class="sk-line skeleton" style="width:85%"></div><div class="sk-line skeleton" style="width:60%"></div></div>').join('');

  /* ---------- WhatsApp ---------- */
  const waLink = (text = '') => `https://wa.me/${META?.site?.whatsapp || ''}${text ? '?text=' + encodeURIComponent(text) : ''}`;

  /* ---------- koka dhe fundi ---------- */
  function header() {
    const page = location.pathname, deal = new URLSearchParams(location.search).get('deal');
    const cur = (cond) => cond ? ' aria-current="page"' : '';
    return `<div class="topbar"><div class="wrap">
      <span class="tb-hide" data-site="hours"></span>
      <div class="tb-r"><a href="#" data-site="phone-link"><span data-site="phone"></span></a><a class="tb-hide" href="#" data-site="email-link"><span data-site="email"></span></a><a href="#" data-site="ig" target="_blank" rel="noopener">Instagram</a></div>
    </div></div>
    <header class="site-header"><div class="wrap nav">
      <a href="/" class="logo" aria-label="De Luxe Real Estate – faqja kryesore"><img class="logo-img" src="/img/logo-mark.png" alt="" width="60" height="46"><img class="logo-word" src="/img/logo-word.png" alt="De Luxe Real Estate" width="140" height="34"></a>
      <ul class="menu" id="menu">
        <li><a href="/properties.html?deal=shitje"${cur(page.includes('properties') && deal === 'shitje')}>Në shitje</a></li>
        <li><a href="/properties.html?deal=qira"${cur(page.includes('properties') && deal === 'qira')}>Me qira</a></li>
        <li><a href="/properties.html"${cur(page.includes('properties') && !deal)}>Të gjitha pronat</a></li>
        <li><a href="/#agjentet">Agjentët</a></li>
        <li><a href="/#vleresim">Vlerëso pronën</a></li>
      </ul>
      <div class="nav-r">
        <a href="/favorites.html" class="icon-btn" aria-label="Pronat e ruajtura">${I.heart}<span class="badge-count fav-count"></span></a>
        <a class="btn sm" href="#" data-site="phone-link">${I.phone}<span data-site="phone"></span></a>
        <button class="icon-btn burger" id="burger" aria-label="Hap menunë" aria-expanded="false">${I.menu}</button>
      </div>
    </div></header>`;
  }
  function footer() {
    return `<footer class="site-footer" id="kontakt"><div class="wrap">
      <div class="f-grid">
        <div><a href="/" aria-label="De Luxe Real Estate – faqja kryesore"><img class="logo-full" src="/img/logo-full.png" alt="De Luxe Real Estate – Live Beyond Ordinary." width="240" height="210"></a>
          <p style="max-width:34ch;margin-top:1.2rem">Shitje, blerje dhe qira pronash – me agjentë që e njohin çdo lagje dhe ju thonë të vërtetën për çmimin.</p></div>
        <div><h4>Pronat</h4><ul>
          <li><a href="/properties.html?deal=shitje">Në shitje</a></li><li><a href="/properties.html?deal=qira">Me qira</a></li>
          <li><a href="/properties.html?type=Vil%C3%AB">Vila</a></li><li><a href="/properties.html?type=Apartament">Apartamente</a></li>
          <li><a href="/properties.html?type=Zyr%C3%AB">Zyra</a></li><li><a href="/favorites.html">Të ruajturat</a></li></ul></div>
        <div><h4>Kontakt</h4><ul>
          <li><a href="#" data-site="phone-link"><span data-site="phone"></span></a></li>
          <li><a href="#" data-site="email-link"><span data-site="email"></span></a></li>
          <li><span data-site="address"></span></li><li><span data-site="hours"></span></li></ul></div>
        <div><h4>Pronat e reja në email</h4><p style="margin:0">Një email në javë, vetëm me pronat që sapo kemi marrë.</p>
          <form class="news" id="news-form" novalidate><label class="sr" for="news-email">Email</label><input class="input" id="news-email" type="email" placeholder="email@juaj.com" autocomplete="email"><button class="btn" type="submit">Regjistrohu</button></form>
          <p class="form-msg" id="news-msg" role="status"></p></div>
      </div>
      <div class="f-bottom"><span>© ${new Date().getFullYear()} De Luxe Real Estate</span><span><a href="/admin/">Hyrje për stafin</a></span></div>
    </div></footer>`;
  }
  function fillSite(s) {
    const tel = 'tel:' + s.phone.replace(/[^\d+]/g, '');
    $$('[data-site="phone"]').forEach(e => e.textContent = s.phone);
    $$('[data-site="email"]').forEach(e => e.textContent = s.email);
    $$('[data-site="address"]').forEach(e => e.textContent = s.address);
    $$('[data-site="hours"]').forEach(e => e.textContent = s.hours);
    $$('[data-site="phone-link"]').forEach(e => e.href = tel);
    $$('[data-site="email-link"]').forEach(e => e.href = 'mailto:' + s.email);
    $$('[data-site="ig"]').forEach(e => e.href = s.instagram);
    $$('[data-site="wa"]').forEach(e => e.href = waLink(e.dataset.text || 'Përshëndetje, ju shkruaj nga faqja e De Luxe Real Estate.'));
  }

  /* ---------- asistenti ---------- */
  function chatWidget() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <a class="wa-side" data-site="wa" href="#" target="_blank" rel="noopener" aria-label="Na shkruani në WhatsApp">${I.wa}<span>WhatsApp</span></a>
      <section class="chat" id="chat" aria-label="Asistenti" aria-hidden="true">
        <div class="chat-h"><span class="av"><img src="/img/logo-mark.png" alt=""></span><div><b>Agjenti virtual · De Luxe</b><small>● Online tani</small></div>
          <button class="icon-btn" id="chat-close" aria-label="Mbyll asistentin">${I.close}</button></div>
        <div class="chat-body" id="chat-body" aria-live="polite"></div>
        <div class="chips" id="chat-chips"></div>
        <form class="chat-f" id="chat-form"><label class="sr" for="chat-in">Pyetja juaj</label><input class="input" id="chat-in" placeholder="Shkruani mesazhin tuaj…" autocomplete="off" maxlength="400"><button class="btn" aria-label="Dërgo">${I.send}</button></form>
      </section>
      <button class="chat-fab" id="chat-fab" aria-controls="chat" aria-expanded="false"><span class="o">${I.chat}</span><span class="x">${I.close}</span><span class="lbl">Pyetje të shpejta</span></button>`;
    document.body.append(wrap);
    const body = $('#chat-body'), chips = $('#chat-chips'), input = $('#chat-in');
    let started = false;
    const add = (html, who) => { const m = document.createElement('div'); m.className = 'msg ' + who; m.innerHTML = html; body.append(m); body.scrollTop = body.scrollHeight; return m; };
    const setChips = list => { chips.innerHTML = (list || []).map(q => `<button type="button">${esc(q)}</button>`).join(''); };
    function open(v) {
      const on = v ?? !document.body.classList.contains('chat-open');
      document.body.classList.toggle('chat-open', on);
      $('#chat').setAttribute('aria-hidden', !on); $('#chat-fab').setAttribute('aria-expanded', on);
      if (on && !started) { started = true; const h = new Date().getHours(), g = h < 11 ? 'Mirëmëngjes' : h < 18 ? 'Mirëdita' : 'Mirëmbrëma';
        add(`${g}! 👋 Jam agjenti virtual i <b>De Luxe Real Estate</b>. Si mund t’ju ndihmoj sot? Më pyesni për prona, çmime, vizita apo dokumente – ose zgjidhni një nga pyetjet më poshtë. 😊`, 'bot'); api('/api/chat/quick').then(d => setChips(d.quick)).catch(() => {}); }
      if (on) setTimeout(() => input.focus(), 200);
    }
    async function ask(text) {
      text = text.trim(); if (!text) return;
      add(esc(text), 'me'); input.value = ''; setChips([]);
      const t = add('<span class="typing"><i></i><i></i><i></i></span>', 'bot'); t.style.padding = '0';
      try {
        const r = await api('/api/chat', { method: 'POST', body: { message: text } });
        await new Promise(res => setTimeout(res, 550 + Math.min(900, (r.reply || '').length * 4)));
        let html = esc(r.reply);
        (r.properties || []).forEach(p => { html += `<a class="mini" href="/property.html?id=${p.id}"><img src="${esc(p.image || FALLBACK)}" alt="" onerror="this.src='${FALLBACK}'"><span><b>${esc(p.title)}</b><span>${fmt(p.price)} €${p.deal === 'qira' ? ' / muaj' : ''} · ${esc(p.city)}</span></span></a>`; });
        if (r.after) html += `<p style="margin:.7rem 0 0">${esc(r.after)}</p>`;
        if (r.link) html += `<p style="margin:.5rem 0 0"><a href="${esc(r.link)}">Shikoni të gjitha rezultatet</a></p>`;
        if (r.whatsapp || r.link) html += `<p style="margin:.5rem 0 0"><a href="${waLink('Përshëndetje, ju shkruaj nga faqja juaj: ' + text)}" target="_blank" rel="noopener">💬 Fol me një agjent në WhatsApp</a></p>`;
        t.style.padding = ''; t.innerHTML = html; body.scrollTop = body.scrollHeight;
        setChips(r.quick); requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
      } catch (e) { t.style.padding = ''; t.textContent = e.message; }
    }
    $('#chat-fab').addEventListener('click', () => open());
    $('#chat-close').addEventListener('click', () => open(false));
    $('#chat-form').addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('chat-open')) open(false); });
    return { open, ask };
  }

  /* ---------- fotot me rrëshqitje te kartat ---------- */
  function syncSlider(box) {
    const ph = box.closest('.ph'); if (!ph) return;
    const n = box.children.length, i = Math.round(box.scrollLeft / Math.max(1, box.clientWidth));
    ph.querySelectorAll('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    const c = ph.querySelector('.cnt b'); if (c) c.textContent = i + 1;
  }
  let raf = 0;
  document.addEventListener('scroll', e => {
    const box = e.target.classList?.contains('slides') ? e.target : null; if (!box) return;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => syncSlider(box));
  }, true);
  const goSlide = (box, dir) => {
    const n = box.children.length, i = Math.round(box.scrollLeft / Math.max(1, box.clientWidth));
    const j = (i + dir + n) % n; // në fund kthehet te fotoja e parë
    box.scrollTo({ left: j * box.clientWidth, behavior: 'smooth' });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-slide]');
    if (b) { e.preventDefault(); e.stopPropagation(); goSlide(b.closest('.ph').querySelector('.slides'), Number(b.dataset.slide)); return; }
    // Shtypja mbi foto te listimi kalon foton (ana e majtë = mbrapa, e djathta = para), nuk e hap pronën
    const box = e.target.closest('div.slides');
    if (box) { const r = box.getBoundingClientRect(); goSlide(box, e.clientX - r.left < r.width / 3 ? -1 : 1); }
  }, true);

  /* ---------- lagjet ---------- */
  // Mbush listën e lagjeve sipas qytetit; zgjedhja e një lagjeje vendos vetë qytetin
  function bindZones(citySel, zoneSel, wrap, zones) {
    const fill = keep => {
      const city = citySel.value, cur = keep ?? zoneSel.value;
      const cities = city ? (zones[city] ? [city] : []) : Object.keys(zones);
      wrap.hidden = !cities.length;
      zoneSel.innerHTML = '<option value="">Të gjitha lagjet</option>' + cities.map(c => (cities.length > 1 ? `<optgroup label="${esc(c)}">` : '') + zones[c].map(z => `<option data-city="${esc(c)}" ${z === cur ? 'selected' : ''}>${esc(z)}</option>`).join('') + (cities.length > 1 ? '</optgroup>' : '')).join('');
      if (cur && zoneSel.value !== cur) zoneSel.value = '';
    };
    let syncing = false;
    citySel.addEventListener('change', () => { if (!syncing) fill(''); });
    zoneSel.addEventListener('change', () => {
      const c = zoneSel.selectedOptions[0]?.dataset.city;
      if (c && citySel.value !== c) { const z = zoneSel.value; citySel.value = c; fill(z); syncing = true; citySel.dispatchEvent(new Event('change', { bubbles: true })); syncing = false; }
    });
    return fill;
  }

  /* ---------- sugjerime lagjesh gjatë shkrimit ---------- */
  // Shkruani “bll”, “kom”, “tirana e”… dhe zgjidhni lagjen nga lista
  const normTxt = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  function zoneAutocomplete(input, zones, cities, onPick) {
    const items = [
      ...[...new Set([...(cities || []), ...Object.keys(zones || {})])].map(c => ({ label: c, city: c, zone: '', kind: 'Qytet' })),
      ...Object.entries(zones || {}).flatMap(([c, list]) => list.map(z => ({ label: z, city: c, zone: z, kind: `Zonë · ${c}` })))
    ].map(x => ({ ...x, key: normTxt(x.label) }));
    const wrap = input.parentElement; wrap.style.position = 'relative';
    const box = document.createElement('ul'); box.className = 'ac'; box.setAttribute('role', 'listbox'); box.hidden = true;
    wrap.append(box);
    input.setAttribute('autocomplete', 'off'); input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list');
    let list = [], active = -1;
    const mark = (label, q) => {
      const k = normTxt(label), i = k.indexOf(q);
      return i < 0 ? esc(label) : esc(label.slice(0, i)) + '<mark>' + esc(label.slice(i, i + q.length)) + '</mark>' + esc(label.slice(i + q.length));
    };
    const close = () => { box.hidden = true; active = -1; input.setAttribute('aria-expanded', 'false'); };
    const render = () => {
      const q = normTxt(input.value);
      if (q.length < 2) return close();
      const score = x => x.key.startsWith(q) ? 0 : x.key.split(/\s+/).some(w => w.startsWith(q)) ? 1 : x.key.includes(q) ? 2 : 9;
      list = items.map(x => ({ x, s: score(x) })).filter(o => o.s < 9).sort((a, b) => a.s - b.s || (a.x.zone ? 1 : 0) - (b.x.zone ? 1 : 0) || a.x.label.localeCompare(b.x.label, 'sq')).slice(0, 8).map(o => o.x);
      if (!list.length) return close();
      active = 0;
      box.innerHTML = list.map((x, i) => `<li role="option" data-i="${i}" class="${i === active ? 'on' : ''}"><span>${mark(x.label, q)}</span><small>${esc(x.kind)}</small></li>`).join('');
      box.hidden = false; input.setAttribute('aria-expanded', 'true');
    };
    const pick = i => { const x = list[i]; if (!x) return; close(); onPick(x); };
    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length; $$('li', box).forEach((li, k) => li.classList.toggle('on', k === active)); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape') close();
    });
    box.addEventListener('pointerdown', e => { const li = e.target.closest('li'); if (li) { e.preventDefault(); pick(Number(li.dataset.i)); } });
    input.addEventListener('blur', () => setTimeout(close, 150));
  }

  /* ---------- formularët e kërkesave ---------- */
  function bindInquiry(form, extra = {}) {
    const msg = form.querySelector('.form-msg'), btn = form.querySelector('[type=submit]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = { ...Object.fromEntries(new FormData(form)), ...(typeof extra === 'function' ? extra() : extra) };
      btn.classList.add('loading'); msg.className = 'form-msg'; msg.textContent = 'Po dërgohet…';
      try {
        const r = await api('/api/inquiries', { method: 'POST', body: data });
        msg.className = 'form-msg ok'; msg.textContent = r.message; form.reset(); toast(r.message);
      } catch (err) { msg.className = 'form-msg err'; msg.textContent = err.message; }
      finally { btn.classList.remove('loading'); }
    });
  }

  /* ---------- nisja ---------- */
  function init() {
    const h = $('#site-header'); if (h) h.outerHTML = header();
    const f = $('#site-footer'); if (f) f.outerHTML = footer();
    const chat = chatWidget();
    updateFavCount();
    document.addEventListener('click', e => {
      const fb = e.target.closest('[data-fav]'); if (fb) { e.preventDefault(); toggleFav(fb.dataset.fav); }
      const oc = e.target.closest('[data-open-chat]'); if (oc) { e.preventDefault(); chat.open(true); if (oc.dataset.openChat) chat.ask(oc.dataset.openChat); }
    });
    $('#burger')?.addEventListener('click', () => { const m = $('#menu'); const on = m.classList.toggle('open'); $('#burger').setAttribute('aria-expanded', on); $('#burger').innerHTML = on ? I.close : I.menu; });
    $('#menu')?.addEventListener('click', e => { if (e.target.tagName === 'A') { $('#menu').classList.remove('open'); $('#burger').innerHTML = I.menu; } });
    const nf = $('#news-form');
    nf?.addEventListener('submit', async e => {
      e.preventDefault(); const m = $('#news-msg');
      try { const r = await api('/api/subscribe', { method: 'POST', body: { email: $('#news-email').value } }); m.className = 'form-msg ok'; m.textContent = r.message; nf.reset(); }
      catch (err) { m.className = 'form-msg err'; m.textContent = err.message; }
    });
    window.addEventListener('storage', e => { if (e.key === FKEY) updateFavCount(); });
    meta().then(m => fillSite(m.site)).catch(() => toast('Nuk u ngarkuan të dhënat e kontaktit.', 'err'));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();

  return { bindZones, zoneAutocomplete, $, $$, esc, fmt, api, meta, toast, favs, toggleFav, card, skeletons, price, imgTag, I, waLink, bindInquiry, roomsLabel, FALLBACK };
})();
