/* Paneli i administrimit – De Luxe Real Estate (administrator + agjentë) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('de-DE');
  const date = d => d ? new Date(d.replace(' ', 'T') + 'Z').toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const FALLBACK = '/img/placeholder.svg';
  const TYPES = ['Apartament', 'Vilë', 'Zyrë', 'Dyqan', 'Tokë'];
  const STATUS = { active: 'Aktive', sold: 'E shitur', rented: 'E dhënë me qira', hidden: 'E fshehur' };
  const APPROVAL = { pending: 'Në pritje', approved: 'E miratuar', rejected: 'E refuzuar' };
  const ISTATUS = { new: 'E re', contacted: 'Kontaktuar', closed: 'Mbyllur' };
  const LEVELS = { 10: 'Themelues & CEO', 9: 'Broker / Drejtor Agjencie', 8: 'Partner Menaxhues', 7: 'Agjent Partner', 6: 'Udhëheqës Ekipi', 5: 'Agjent Kryesor', 4: 'Agjent i Lartë', 3: 'Agjent i Licencuar', 2: 'Agjent', 1: 'Agjent Praktikant' };
  const STAGES = ['new', 'contacted', 'visit', 'offer', 'negotiation', 'won', 'lost'];
  const STAGE = { new: 'E re', contacted: 'Kontaktuar', visit: 'Vizitë', offer: 'Ofertë', negotiation: 'Negocim', won: 'Fituar', lost: 'Humbur' };
  const CTYPE = { bleres: 'Blerës', qiramarres: 'Qiramarrës', shites: 'Shitës', qiradhenes: 'Qiradhënës', investitor: 'Investitor' };
  const SOURCE = { website: 'Faqja', instagram: 'Instagram', facebook: 'Facebook', telefon: 'Telefon', whatsapp: 'WhatsApp', rekomandim: 'Rekomandim', zyra: 'Zyra', tjeter: 'Tjetër' };
  const LSTATUS = { active: 'Aktiv', cold: 'I ftohtë', closed: 'Mbyllur' };
  const ACT = { note: ['Shënim', 'note'], call: ['Telefonatë', 'phone'], whatsapp: ['WhatsApp', 'wa'], email: ['Email', 'mail'], visit: ['Vizitë', 'home'], meeting: ['Takim', 'users'], stage: ['Faza', 'arrow'], system: ['Sistemi', 'info'] };
  const SVG = {
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    wa: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
    note: '<path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"/>',
    home: '<path d="M4 11l8-7 8 7v9H4zM10 20v-6h4v6"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
  };
  const ti = n => `<svg class="si" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[n] || SVG.note}</svg>`;
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const day = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('sq-AL', { day: '2-digit', month: 'short' }) : '';
  const opts = (map, sel, blank) => (blank ? `<option value="">${blank}</option>` : '') + Object.entries(map).map(([k, v]) => `<option value="${k}" ${String(sel) === k ? 'selected' : ''}>${v}</option>`).join('');
  const stageTag = st => `<span class="sg sg-${st}">${STAGE[st]}</span>`;
  const dueTag = d => !d ? '' : d < todayStr() ? `<span class="due late">${day(d)} · vonesë</span>` : d === todayStr() ? `<span class="due now">Sot</span>` : `<span class="due">${day(d)}</span>`;
  const telOf = p => (p || '').replace(/[^\d+]/g, '');
  const waOf = p => { let d = (p || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('0')) d = '355' + d.slice(1); return d; };
  const KIND = { contact: 'Kontakt', property: 'Info për pronë', visit: 'Vizitë', valuation: 'Vlerësim' };
  const ic = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5 9-10"/></svg>',
    no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };
  let USER = null, agentsCache = [];
  const admin = () => USER?.role === 'admin';

  async function api(url, opts = {}) {
    const o = { ...opts, headers: { 'Content-Type': 'application/json' } };
    if (o.body && typeof o.body !== 'string') o.body = JSON.stringify(o.body);
    let r; try { r = await fetch(url, o); } catch { throw new Error('Nuk ka lidhje me serverin.'); }
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 && !url.endsWith('/login') && !url.endsWith('/password')) { USER = null; renderLogin('Sesioni mbaroi. Hyni sërish.'); throw new Error(d.error || 'Jo i autorizuar'); }
    if (!r.ok) throw new Error(d.error || 'Ndodhi një gabim.');
    return d;
  }
  function toast(msg, type) {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.append(box); }
    const t = document.createElement('div'); t.className = 'toast' + (type === 'err' ? ' err' : ''); t.textContent = msg; box.append(t);
    setTimeout(() => t.remove(), 3600);
  }
  const fileToData = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Skedari nuk u lexua.')); r.readAsDataURL(f); });
  async function upload(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(`${file.name}: lejohen vetëm JPG, PNG, WEBP.`);
    if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name}: më i madh se 8 MB.`);
    return (await api('/api/admin/upload', { method: 'POST', body: { data: await fileToData(file) } })).url;
  }
  const approvalTag = p => `<span class="ap ap-${p.approval}">${APPROVAL[p.approval] || ''}</span>`;

  /* ---------- hyrja ---------- */
  function renderLogin(note = '') {
    $('#app').innerHTML = `<div class="login"><form id="login" novalidate>
      <a href="/" style="justify-self:center"><img class="logo-full" src="/img/logo-full.png" alt="De Luxe Real Estate" style="width:200px;margin:0 auto"></a>
      <h1>Hyrje</h1>
      <p class="muted" style="margin:0;font-size:.92rem">Për administratorin dhe agjentët. Kodin e hyrjes jua jep administratori.</p>
      <div class="field"><label for="l-u">Përdoruesi</label><input class="input" id="l-u" name="username" autocomplete="username" autocapitalize="none" required></div>
      <div class="field"><label for="l-p">Fjalëkalimi</label><input class="input" id="l-p" name="password" type="password" autocomplete="current-password" required></div>
      <button class="btn block" type="submit">Hyr në panel</button>
      <p class="form-msg err" id="l-msg">${esc(note)}</p>
      <a href="/" class="text-link" style="justify-self:start;font-size:.9rem">Kthehu te faqja</a>
    </form></div>`;
    $('#l-u').focus();
    $('#login').addEventListener('submit', async e => {
      e.preventDefault(); const b = $('#login button'); b.classList.add('loading');
      try { USER = await api('/api/admin/login', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); renderShell(); }
      catch (err) { $('#l-msg').textContent = err.message; }
      finally { b.classList.remove('loading'); }
    });
  }

  /* ---------- skeleti ---------- */
  const ADMIN_VIEWS = { paneli: 'Paneli', leads: 'Leads', opportunitete: 'Opportunitete', raporti: 'Raporti', miratime: 'Miratime', pronat: 'Pronat', kerkesat: 'Kërkesat', agjentet: 'Agjentët', abonentet: 'Abonentët', faqja: 'Faqja', llogaria: 'Llogaria' };
  const AGENT_VIEWS = { paneli: 'Paneli', leads: 'Leads', opportunitete: 'Opportunitete', pronat: 'Pronat e mia', kerkesat: 'Kërkesat', llogaria: 'Llogaria' };
  let VIEWS = ADMIN_VIEWS;
  function renderShell() {
    VIEWS = admin() ? ADMIN_VIEWS : AGENT_VIEWS;
    const who = admin() ? `<b style="color:var(--text)">${esc(USER.username)}</b> · administrator` : `<b style="color:var(--text)">${esc(USER.agent?.name || USER.username)}</b> · agjent`;
    $('#app').innerHTML = `<div class="mob-top"><a href="/admin/" class="logo"><img class="logo-img" src="/img/logo-mark.png" alt="De Luxe" style="height:36px"></a><button class="icon-btn" id="mob-menu" aria-label="Menuja">☰</button></div>
    <div class="shell">
      <aside class="side-nav" id="sidenav">
        <a href="/" class="logo"><img class="logo-img" src="/img/logo-mark.png" alt="" width="60" height="46"><span class="logo-text"><img class="logo-word" src="/img/logo-word.png" alt="De Luxe Real Estate" width="140" height="34"><small>Paneli i stafit</small></span></a>
        <nav>${Object.entries(VIEWS).map(([k, v]) => `<a href="#${k}" data-v="${k}">${v}${k === 'kerkesat' ? '<span class="pill" id="new-count" hidden></span>' : ''}${k === 'miratime' ? '<span class="pill" id="pend-count" hidden></span>' : ''}${k === 'opportunitete' ? '<span class="pill" id="due-count" hidden></span>' : ''}</a>`).join('')}</nav>
        <div class="bottom"><span class="muted">${who}</span><a class="text-link" href="/" target="_blank" style="justify-self:start">Shiko faqen</a><button class="btn ghost sm" id="logout">Dil</button></div>
      </aside>
      <main class="main" id="view"></main>
    </div>`;
    $('#logout').addEventListener('click', async () => { await api('/api/admin/logout', { method: 'POST' }).catch(() => {}); USER = null; location.hash = ''; renderLogin(); });
    $('#mob-menu').addEventListener('click', () => $('#sidenav').classList.toggle('open'));
    $('#sidenav nav').addEventListener('click', () => $('#sidenav').classList.remove('open'));
    route(); refreshCounts();
  }
  function pill(id, n) { const p = $(id); if (p) { p.hidden = !n; p.textContent = n || ''; } }
  async function refreshCounts() { try { const s = await api('/api/admin/stats'); pill('#new-count', s.inquiries.new || 0); pill('#pend-count', s.properties.pending || 0); api('/api/admin/crm').then(c => pill('#due-count', c.todayList.length)).catch(() => {}); return s; } catch { return null; } }
  async function route() {
    if (!USER) return;
    const v = location.hash.slice(1) || 'paneli';
    const view = VIEWS[v] ? v : 'paneli';
    $$('#sidenav nav a').forEach(a => a.classList.toggle('on', a.dataset.v === view));
    $('#view').innerHTML = '<div class="skeleton" style="height:60vh"></div>';
    try { await ({ paneli, leads, opportunitete, raporti, miratime, pronat, kerkesat, agjentet, abonentet, faqja, llogaria })[view](); }
    catch (e) { if (USER) $('#view').innerHTML = `<div class="empty"><h3>Gabim</h3>${esc(e.message)}</div>`; }
  }
  window.addEventListener('hashchange', route);
  const go = v => { if (location.hash === '#' + v) route(); else location.hash = v; };

  /* ---------- paneli ---------- */
  async function paneli() {
    const [s0, c] = await Promise.all([refreshCounts(), api('/api/admin/crm')]);
    const s = s0 || await api('/api/admin/stats');
    const P = s.properties;
    const pipe = Object.fromEntries(c.pipeline.map(x => [x.stage, x]));
    const openN = STAGES.slice(0, 5).reduce((t, k) => t + (pipe[k]?.n || 0), 0), openV = STAGES.slice(0, 5).reduce((t, k) => t + (pipe[k]?.value || 0), 0);
    const cards = admin()
      ? [[P.active, 'Prona në faqe'], [P.pending, 'Në pritje miratimi', 'miratime'], [P.sold, 'Të shitura'], [P.rented, 'Të dhëna me qira'], [fmt(P.views), 'Shikime gjithsej'], [s.inquiries.new, 'Kërkesa të reja', 'kerkesat'], [s.subscribers, 'Abonentë']]
      : [[P.active, 'Në faqe'], [P.pending, 'Në pritje miratimi'], [P.rejected, 'Të refuzuara'], [fmt(P.views), 'Shikime'], [s.inquiries.new, 'Kërkesa të reja', 'kerkesat']];
    $('#view').innerHTML = `<div class="top"><h1>${admin() ? 'Mirë se erdhët' : 'Përshëndetje, ' + esc((USER.agent?.name || '').split(' ')[0])}</h1><button class="btn" id="add-p">Shto pronë</button></div>
      ${!admin() ? '<p class="note-box">Pronat që shtoni ose ndryshoni dalin në faqe pasi t’i miratojë administratori. Statusin e secilës e shihni te <a href="#pronat">Pronat e mia</a>.</p>' : ''}
      ${admin() && P.pending ? `<a class="note-box gold-box" href="#miratime"><b>${P.pending}</b> ${P.pending === 1 ? 'pronë pret' : 'prona presin'} miratimin tuaj – shikojini tani</a>` : ''}
      <div class="crm-top">
        <div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline"><h2>Për sot</h2><a class="text-link" href="#opportunitete">Opportunitete</a></div>
          <ul class="list-mini" id="today">${c.todayList.map(o => `<li data-opp="${o.id}" class="clickable"><span><b style="font-weight:500">${esc(o.next_action || 'Kontakto')}</b> · ${esc(o.lead_name)}<br><small class="muted">${esc(o.title)}${admin() && o.agent_name ? ' · ' + esc(o.agent_name) : ''}</small></span><span style="text-align:right">${dueTag(o.next_date)}${o.lead_phone ? `<br><a href="tel:${telOf(o.lead_phone)}" class="gold" style="font-size:.85rem">Telefono</a>` : ''}</span></li>`).join('') || '<li class="muted">Asgjë për sot. Vendosni “kontaktin e radhës” te opportunitetet që të mos humbisni asnjë klient.</li>'}</ul></div>
        <div class="crm-cards">
          <a href="#leads" class="stat"><b>${c.leads.total || 0}</b><span>Leads${c.leads.week ? ` · ${c.leads.week} të reja këtë javë` : ''}</span></a>
          <a href="#opportunitete" class="stat"><b>${openN}</b><span>Opportunitete të hapura · ${fmt(openV)} €</span></a>
          <div class="stat"><b>${c.month.won || 0}</b><span>Fituar këtë muaj</span></div>
          <div class="stat"><b>${fmt(c.month.commission)} €</b><span>Komision këtë muaj</span></div>
          ${admin() && c.leads.unassigned ? `<a href="#leads" data-unassigned class="stat warn"><b>${c.leads.unassigned}</b><span>Leads pa agjent – caktojini</span></a>` : ''}
        </div>
      </div>
      <div class="stats-grid">${cards.map(([n, l, link]) => `<${link ? `a href="#${link}"` : 'div'} class="stat"><b>${n || 0}</b><span>${l}</span></${link ? 'a' : 'div'}>`).join('')}</div>
      <div class="two">
        <div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline"><h2>Kërkesat e fundit</h2><a class="text-link" href="#kerkesat">Të gjitha</a></div>
          <ul class="list-mini">${s.recent.map(i => `<li><span><b style="font-weight:500">${esc(i.name)}</b> <small class="muted">· ${KIND[i.kind]}${i.property_code ? ' · ' + esc(i.property_code) : ''}</small><br><small class="muted">${esc((i.message || '').slice(0, 90))}</small></span><span style="text-align:right;white-space:nowrap"><small class="${i.status === 'new' ? 'gold' : 'muted'}">${ISTATUS[i.status]}</small><br><small class="muted">${date(i.created_at)}</small></span></li>`).join('') || '<li class="muted">Asnjë kërkesë ende.</li>'}</ul></div>
        <div class="panel"><h2>Më të shikuarat</h2><ul class="list-mini">${s.top.map(p => `<li><a href="/property.html?id=${p.id}" target="_blank">${esc(p.title)}</a><span class="gold">${fmt(p.views)}</span></li>`).join('') || '<li class="muted">Ende asnjë pronë.</li>'}</ul></div>
      </div>`;
    $('#add-p').addEventListener('click', () => openProperty());
    $('#today').addEventListener('click', e => { if (e.target.closest('a')) return; const li = e.target.closest('[data-opp]'); if (li) openOpp(Number(li.dataset.opp)); });
    $('[data-unassigned]')?.addEventListener('click', () => { lFilter.agent = 'none'; });
  }

  /* ---------- miratime (vetëm administratori) ---------- */
  async function miratime() {
    const rows = await api('/api/admin/properties?approval=pending');
    $('#view').innerHTML = `<div id="mv"><div class="top"><h1>Miratime</h1></div>
      <p class="muted" style="margin:-1rem 0 1.5rem">Pronat e shtuara ose të ndryshuara nga agjentët. Dalin në faqe vetëm pasi t’i miratoni.</p>
      ${rows.length ? rows.map(p => `<article class="appr">
        <img src="${esc(p.images[0] || FALLBACK)}" alt="" onerror="this.src='${FALLBACK}'">
        <div class="appr-b"><h3>${esc(p.title)}</h3>
          <div class="meta"><span>${esc(p.code)}</span><span>${esc(p.type)} · ${p.deal === 'qira' ? 'Qira' : 'Shitje'}</span><span>${esc([p.zone, p.city].filter(Boolean).join(', '))}</span><span class="gold">${fmt(p.price)} €${p.deal === 'qira' ? ' / muaj' : ''}</span></div>
          <div class="meta"><span>Agjenti: <b style="color:var(--text);font-weight:500">${esc(p.agent_name || '–')}</b></span><span>${p.images.length} foto</span><span>Përditësuar: ${date(p.updated_at)}</span></div>
          <div class="appr-acts">
            <button class="btn sm" data-approve="${p.id}">${ic.ok}Mirato</button>
            <button class="btn ghost sm" data-reject="${p.id}" data-code="${esc(p.code)}">${ic.no}Refuzo</button>
            <a class="btn ghost sm" href="/property.html?id=${p.id}" target="_blank">${ic.eye}Parapamje</a>
            <button class="btn ghost sm" data-edit="${p.id}">${ic.edit}Ndrysho</button>
          </div></div></article>`).join('') : '<div class="empty"><h3>Asgjë për të miratuar</h3>Kur një agjent shton ose ndryshon një pronë, ajo shfaqet këtu.</div>'}</div>`;
    $('#mv').addEventListener('click', approvalClick);
  }
  async function approvalClick(e) {
    const a = e.target.closest('[data-approve]'), r = e.target.closest('[data-reject]'), ed = e.target.closest('[data-edit]');
    if (ed) return openProperty(Number(ed.dataset.edit));
    if (a) {
      try { await api('/api/admin/properties/' + a.dataset.approve, { method: 'PATCH', body: { approval: 'approved' } }); toast('Prona u miratua dhe tani duket në faqe.'); refreshCounts(); route(); } catch (err) { toast(err.message, 'err'); }
    }
    if (r) {
      const note = await askReason(r.dataset.code); if (note === null) return;
      try { await api('/api/admin/properties/' + r.dataset.reject, { method: 'PATCH', body: { approval: 'rejected', review_note: note } }); toast('Prona u refuzua. Agjenti e sheh arsyen te pronat e tij.'); refreshCounts(); route(); } catch (err) { toast(err.message, 'err'); }
    }
  }
  function askReason(code) {
    return new Promise(res => {
      const d = $('#rmodal'); $('#r-code').textContent = code; $('#r-note').value = '';
      const done = v => { d.close(); res(v); };
      $('#r-ok').onclick = () => done($('#r-note').value.trim());
      $$('[data-rclose]', d).forEach(b => b.onclick = () => done(null));
      d.oncancel = e => { e.preventDefault(); done(null); };
      d.showModal(); $('#r-note').focus();
    });
  }

  /* ---------- pronat ---------- */
  let pFilter = { q: '', status: '', approval: '' };
  async function pronat() {
    $('#view').innerHTML = `<div class="top"><h1>${admin() ? 'Pronat' : 'Pronat e mia'}</h1><div class="toolbar">
      <input class="input" id="pq" placeholder="Kërko titull, kod, qytet" value="${esc(pFilter.q)}">
      <select class="select" id="pa"><option value="">Çdo miratim</option>${Object.entries(APPROVAL).map(([k, v]) => `<option value="${k}" ${pFilter.approval === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select class="select" id="ps"><option value="">Të gjitha statuset</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${pFilter.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <button class="btn" id="add-p">Shto pronë</button></div></div>
      <div class="table-wrap"><table><thead><tr><th></th><th>Prona</th><th>Qyteti</th><th>Çmimi</th><th>Miratimi</th><th>Statusi</th>${admin() ? '<th title="E përzgjedhur">★</th>' : ''}<th>Shikime</th><th>Veprime</th></tr></thead><tbody id="ptb"></tbody></table></div>`;
    let t;
    $('#pq').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { pFilter.q = e.target.value; loadP(); }, 300); });
    $('#ps').addEventListener('change', e => { pFilter.status = e.target.value; loadP(); });
    $('#pa').addEventListener('change', e => { pFilter.approval = e.target.value; loadP(); });
    $('#add-p').addEventListener('click', () => openProperty());
    $('#ptb').addEventListener('change', async e => {
      const s = e.target.closest('[data-status]'); if (!s) return;
      try { await api('/api/admin/properties/' + s.dataset.status, { method: 'PATCH', body: { status: s.value } }); toast('Statusi u ndryshua.'); } catch (err) { toast(err.message, 'err'); loadP(); }
    });
    $('#ptb').addEventListener('click', async e => {
      const st = e.target.closest('[data-star]'), ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (e.target.closest('[data-approve],[data-reject]')) { await approvalClick(e); return; }
      if (st) { const on = st.getAttribute('aria-pressed') !== 'true'; try { await api('/api/admin/properties/' + st.dataset.star, { method: 'PATCH', body: { featured: on } }); st.setAttribute('aria-pressed', on); toast(on ? 'U shtua te të përzgjedhurat.' : 'U hoq nga të përzgjedhurat.'); } catch (err) { toast(err.message, 'err'); } }
      if (ed) openProperty(Number(ed.dataset.edit));
      if (dl && confirm(`Të fshihet përgjithmonë prona ${dl.dataset.code}? Kjo nuk kthehet mbrapsht.`)) {
        try { await api('/api/admin/properties/' + dl.dataset.del, { method: 'DELETE' }); toast('Prona u fshi.'); loadP(); refreshCounts(); } catch (err) { toast(err.message, 'err'); }
      }
    });
    loadP();
  }
  async function loadP() {
    const rows = await api('/api/admin/properties?' + new URLSearchParams(pFilter));
    const cols = admin() ? 9 : 8;
    $('#ptb').innerHTML = rows.length ? rows.map(p => {
      const canDel = admin() || p.approval !== 'approved';
      return `<tr>
      <td><img class="thumb" src="${esc(p.images[0] || FALLBACK)}" alt="" onerror="this.src='${FALLBACK}'"></td>
      <td><span class="t">${esc(p.title)}</span><small>${esc(p.code)} · ${esc(p.type)} · ${p.deal === 'qira' ? 'Qira' : 'Shitje'}${admin() && p.agent_name ? ' · ' + esc(p.agent_name) : ''}</small></td>
      <td>${esc(p.city)}<br><small>${esc(p.zone)}</small></td>
      <td style="white-space:nowrap">${fmt(p.price)} €${p.deal === 'qira' ? '<small>/muaj</small>' : ''}</td>
      <td>${approvalTag(p)}${p.approval === 'rejected' && p.review_note ? `<small class="reason">${esc(p.review_note)}</small>` : ''}
        ${admin() && p.approval === 'pending' ? `<div class="row-acts" style="margin-top:.4rem"><button class="icon-btn ok" data-approve="${p.id}" aria-label="Mirato" title="Mirato">${ic.ok}</button><button class="icon-btn danger" data-reject="${p.id}" data-code="${esc(p.code)}" aria-label="Refuzo" title="Refuzo">${ic.no}</button></div>` : ''}</td>
      <td><select class="select" data-status="${p.id}" aria-label="Statusi">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
      ${admin() ? `<td><button class="star" data-star="${p.id}" aria-pressed="${p.featured}" aria-label="E përzgjedhur">★</button></td>` : ''}
      <td>${fmt(p.views)}</td>
      <td><div class="row-acts"><button class="icon-btn" data-edit="${p.id}" aria-label="Ndrysho" title="Ndrysho">${ic.edit}</button><a class="icon-btn" href="/property.html?id=${p.id}" target="_blank" aria-label="Shiko" title="${p.approval === 'approved' ? 'Shiko në faqe' : 'Parapamje'}">${ic.eye}</a>${canDel ? `<button class="icon-btn danger" data-del="${p.id}" data-code="${esc(p.code)}" aria-label="Fshi" title="Fshi">${ic.del}</button>` : ''}</div></td>
    </tr>`; }).join('') : `<tr><td colspan="${cols}" class="muted" style="padding:2rem;text-align:center">${admin() ? 'Asnjë pronë nuk përputhet.' : 'Nuk keni ende prona. Shtypni “Shto pronë” për të filluar.'}</td></tr>`;
  }

  /* forma e pronës */
  const pm = $('#pmodal'), pf = $('#pform');
  let editing = null, editingApproval = null, images = [];
  $('#p-type').innerHTML = TYPES.map(t => `<option>${t}</option>`).join('');
  $$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  function drawImgs() {
    $('#imgs').innerHTML = images.map((src, i) => `<figure>${i === 0 ? '<span class="cover">Kryesore</span>' : ''}<img src="${esc(src)}" alt="" onerror="this.src='${FALLBACK}'"><figcaption>
      <button type="button" data-mv="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Lëviz majtas">‹</button>
      ${i ? `<button type="button" data-cover="${i}">Bëje kryesore</button>` : '<span></span>'}
      <button type="button" data-mv="${i}" data-d="1" ${i === images.length - 1 ? 'disabled' : ''} aria-label="Lëviz djathtas">›</button>
      <button type="button" data-rm="${i}" aria-label="Hiq">✕</button></figcaption></figure>`).join('') || '<p class="muted" style="grid-column:1/-1;margin:0">Nuk ka foto ende. Prona me foto shikohet shumë më shpesh.</p>';
  }
  $('#imgs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.rm) images.splice(+b.dataset.rm, 1);
    if (b.dataset.cover) images.unshift(images.splice(+b.dataset.cover, 1)[0]);
    if (b.dataset.mv) { const i = +b.dataset.mv, j = i + +b.dataset.d; [images[i], images[j]] = [images[j], images[i]]; }
    drawImgs();
  });
  async function addFiles(files) {
    const msg = $('#pm-msg');
    for (const f of files) {
      msg.className = 'form-msg'; msg.textContent = `Po ngarkohet ${f.name}…`;
      try { images.push(await upload(f)); drawImgs(); } catch (e) { toast(e.message, 'err'); }
    }
    msg.textContent = '';
  }
  $('#p-files').addEventListener('change', e => { addFiles([...e.target.files]); e.target.value = ''; });
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));
  $('#p-url-add').addEventListener('click', () => { const u = $('#p-url').value.trim(); if (!/^https?:\/\//.test(u)) return toast('Lidhja duhet të fillojë me https://', 'err'); images.push(u); $('#p-url').value = ''; drawImgs(); });

  async function openProperty(id = null) {
    editing = id; editingApproval = null; pf.reset(); images = []; $('#pm-msg').textContent = '';
    $$('.admin-only', pm).forEach(el => el.hidden = !admin());
    if (admin()) {
      if (!agentsCache.length) agentsCache = await api('/api/admin/agents').catch(() => []);
      $('#p-agent').innerHTML = '<option value="">Pa agjent</option>' + agentsCache.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
    }
    $('#pm-title').textContent = id ? 'Ndrysho pronën' : 'Pronë e re';
    setTimeout(() => fillZoneList(pf.elements.city.value), 0);
    if (id) {
      try {
        const p = await api('/api/admin/properties/' + id);
        $('#pm-title').textContent = `Ndrysho ${p.code}`; editingApproval = p.approval;
        for (const [k, v] of Object.entries(p)) {
          const el = pf.elements[k]; if (!el || k === 'features') continue;
          if (el.type === 'checkbox') el.checked = !!v; else el.value = v ?? '';
        }
        pf.elements.features.value = p.features.join(', ');
        images = [...p.images];
      } catch (e) { return toast(e.message, 'err'); }
    }
    const note = $('#pm-note');
    note.hidden = admin();
    note.textContent = !id ? 'Pas ruajtjes, prona dërgohet për miratim te administratori dhe del në faqe pasi të miratohet.'
      : editingApproval === 'approved' ? 'Kujdes: pas ruajtjes, prona hiqet përkohësisht nga faqja derisa administratori të miratojë ndryshimet. Për të ndryshuar vetëm statusin (p.sh. E shitur), përdorni listën te tabela.'
      : 'Pas ruajtjes, prona dërgohet sërish për miratim.';
    drawImgs(); pm.showModal(); $('#p-title').focus();
  }
  pf.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(pf));
    f.furnished = pf.elements.furnished.checked; f.featured = pf.elements.featured.checked; f.images = images;
    f.features = String(f.features || '').split(',').map(s => s.trim()).filter(Boolean);
    const msg = $('#pm-msg'), btn = $('#pm-save'); btn.classList.add('loading');
    try {
      const p = await api('/api/admin/properties' + (editing ? '/' + editing : ''), { method: editing ? 'PUT' : 'POST', body: f });
      pm.close();
      toast(admin() ? (editing ? 'Ndryshimet u ruajtën.' : `Prona ${p.code} u shtua dhe duket në faqe.`) : (editing ? 'Ndryshimet u dërguan për miratim.' : `Prona ${p.code} u dërgua për miratim.`));
      refreshCounts();
      if (location.hash === '#pronat') loadP(); else if (location.hash === '#miratime') route(); else go('pronat');
    } catch (err) { msg.className = 'form-msg err'; msg.textContent = err.message; }
    finally { btn.classList.remove('loading'); }
  });

  /* ---------- leads (portofoli) ---------- */
  let lFilter = { q: '', client_type: '', source: '', status: 'active', agent: '' };
  async function leads() {
    if (admin() && !agentsCache.length) agentsCache = await api('/api/admin/agents').catch(() => []);
    $('#view').innerHTML = `<div id="lv"><div class="top"><h1>${admin() ? 'Leads' : 'Portofoli im'}</h1><button class="btn" id="add-l">Shto lead</button></div>
      <div class="toolbar" style="margin:-1rem 0 1.4rem">
        <input class="input" id="lq" placeholder="Kërko emër, telefon, qytet" value="${esc(lFilter.q)}">
        <select class="select" id="lt">${opts(CTYPE, lFilter.client_type, 'Çdo lloj klienti')}</select>
        <select class="select" id="ls">${opts(SOURCE, lFilter.source, 'Çdo burim')}</select>
        <select class="select" id="lst">${opts(LSTATUS, lFilter.status, 'Çdo status')}</select>
        ${admin() ? `<select class="select" id="la"><option value="">Të gjithë agjentët</option><option value="none" ${lFilter.agent === 'none' ? 'selected' : ''}>Pa agjent</option>${agentsCache.map(a => `<option value="${a.id}" ${String(lFilter.agent) === String(a.id) ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>` : ''}
      </div><div id="llist"></div></div>`;
    let t;
    $('#lq').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { lFilter.q = e.target.value; loadL(); }, 300); });
    [['#lt', 'client_type'], ['#ls', 'source'], ['#lst', 'status'], ['#la', 'agent']].forEach(([sel, k]) => $(sel)?.addEventListener('change', e => { lFilter[k] = e.target.value; loadL(); }));
    $('#add-l').addEventListener('click', () => openLead());
    $('#llist').addEventListener('click', e => { if (e.target.closest('a')) return; const c = e.target.closest('[data-lead]'); if (c) openLead(Number(c.dataset.lead)); });
    loadL();
  }
  async function loadL() {
    const rows = await api('/api/admin/leads?' + new URLSearchParams(lFilter));
    $('#llist').innerHTML = rows.length ? `<div class="lgrid">${rows.map(l => `<article class="lcard ${l.status !== 'active' ? 'dim' : ''}" data-lead="${l.id}">
      <div class="lc-h"><span class="av">${esc(l.name.split(' ').map(x => x[0]).join('').slice(0, 2))}</span><div><b>${esc(l.name)}</b><small>${esc(CTYPE[l.client_type])} · ${esc(SOURCE[l.source])}${l.status !== 'active' ? ' · ' + LSTATUS[l.status] : ''}</small></div></div>
      <div class="lc-m">${l.city || l.ptype ? `<span>${esc([l.ptype, l.city].filter(Boolean).join(', '))}</span>` : ''}${l.budget_max ? `<span>deri ${fmt(l.budget_max)} €</span>` : ''}${admin() ? `<span class="${l.agent_name ? '' : 'gold'}">${esc(l.agent_name || 'Pa agjent')}</span>` : ''}</div>
      <div class="lc-f"><span>${l.open_opps ? `${l.open_opps} opportunitet${l.open_opps > 1 ? 'e' : ''}` : '<span class="muted">Pa opportunitet</span>'} ${dueTag(l.next_date)}</span>
        <span class="lc-a">${l.phone ? `<a class="icon-btn" href="tel:${telOf(l.phone)}" aria-label="Telefono">${ti('phone')}</a><a class="icon-btn wa" href="https://wa.me/${waOf(l.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ti('wa')}</a>` : ''}</span></div>
    </article>`).join('')}</div>` : `<div class="empty"><h3>${lFilter.q || lFilter.client_type || lFilter.source ? 'Asnjë lead nuk përputhet' : 'Portofoli është bosh'}</h3>Kërkesat nga faqja shtohen këtu vetë. Klientët nga telefoni, Instagrami ose zyra i shtoni me “Shto lead”.</div>`;
  }

  const lm = $('#lmodal'), lf = $('#lform'); let curLead = null;
  async function openLead(id = null) {
    curLead = null; lf.reset(); $('#lm-msg').textContent = '';
    if (admin()) {
      if (!agentsCache.length) agentsCache = await api('/api/admin/agents').catch(() => []);
      $('#l-agent').innerHTML = '<option value="">Pa agjent</option>' + agentsCache.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
    }
    $$('.admin-only', lm).forEach(el => el.hidden = !admin());
    $('#l-type').innerHTML = opts(CTYPE); $('#l-source').innerHTML = opts(SOURCE); $('#l-status').innerHTML = opts(LSTATUS);
    if (id) {
      try { curLead = await api('/api/admin/leads/' + id); } catch (e) { return toast(e.message, 'err'); }
      for (const k of ['name', 'phone', 'email', 'client_type', 'source', 'status', 'budget_min', 'budget_max', 'city', 'ptype', 'notes', 'agent_id']) if (lf.elements[k]) lf.elements[k].value = curLead[k] ?? '';
    }
    drawLead();
    if (!lm.open) lm.showModal();
    if (!id) $('#l-name').focus();
  }
  function drawLead() {
    const l = curLead;
    $('#lm-title').textContent = l ? l.name : 'Lead i ri';
    $('#lm-sub').innerHTML = l ? `${esc(CTYPE[l.client_type])} · ${esc(SOURCE[l.source])} · ${esc(LSTATUS[l.status])}${l.agent_name ? ' · ' + esc(l.agent_name) : ''}` : 'Klient nga telefoni, Instagrami, zyra ose rekomandimi';
    $('#lm-quick').innerHTML = l && l.phone ? `<a class="btn ghost sm" href="tel:${telOf(l.phone)}" data-log="call">${ti('phone')}Telefono</a><a class="btn ghost sm wa" href="https://wa.me/${waOf(l.phone)}" target="_blank" rel="noopener" data-log="whatsapp">${ti('wa')}WhatsApp</a>${l.email ? `<a class="btn ghost sm" href="mailto:${esc(l.email)}" data-log="email">${ti('mail')}Email</a>` : ''}` : '';
    $('#lm-details').open = !l;
    $('#lm-crm').hidden = !l;
    $('#lm-del').hidden = !(l && admin());
    if (!l) return;
    $('#lm-opps').innerHTML = l.opportunities.length ? l.opportunities.map(o => `<li data-opp="${o.id}" class="clickable"><span><b style="font-weight:500">${esc(o.title)}</b><br><small class="muted">${o.value ? fmt(o.value) + ' €' : ''}${o.commission ? ' · komision ' + fmt(o.commission) + ' €' : ''}${o.next_action ? ' · ' + esc(o.next_action) : ''}</small></span><span style="text-align:right">${stageTag(o.stage)}<br>${['won', 'lost'].includes(o.stage) ? '' : dueTag(o.next_date)}</span></li>`).join('') : '<li class="muted">Asnjë ende. Krijoni një kur klienti interesohet për një pronë ose shërbim.</li>';
    $('#la-opp').innerHTML = '<option value="">Pa lidhje me opportunity</option>' + l.opportunities.filter(o => !['won', 'lost'].includes(o.stage)).map(o => `<option value="${o.id}">${esc(o.title)}</option>`).join('');
    $('#lm-acts').innerHTML = l.activities.map(a => `<li class="act act-${a.type}">${ti(ACT[a.type]?.[1] || 'note')}<div><div class="act-h"><b>${esc(ACT[a.type]?.[0] || a.type)}</b><small class="muted">${esc(a.author || '')} · ${date(a.created_at)}</small></div>${a.text ? `<p>${esc(a.text)}</p>` : ''}</div></li>`).join('') || '<li class="muted">Ende pa histori.</li>';
  }
  lf.addEventListener('submit', async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(lf));
    const btn = $('#lm-save'); btn.classList.add('loading');
    try {
      const r = await api('/api/admin/leads' + (curLead ? '/' + curLead.id : ''), { method: curLead ? 'PUT' : 'POST', body });
      toast(curLead ? 'Të dhënat u ruajtën.' : 'Lead-i u shtua në portofol.');
      await openLead(r.id); if (ADMIN_VIEW_NOW() === 'leads') loadL();
    } catch (err) { $('#lm-msg').className = 'form-msg err'; $('#lm-msg').textContent = err.message; }
    finally { btn.classList.remove('loading'); }
  });
  $('#lm-quick').addEventListener('click', e => {
    const a = e.target.closest('[data-log]'); if (!a || !curLead) return;
    const text = { call: 'Telefonatë me klientin', whatsapp: 'Mesazh në WhatsApp', email: 'Email për klientin' }[a.dataset.log];
    api(`/api/admin/leads/${curLead.id}/activities`, { method: 'POST', body: { type: a.dataset.log, text } }).then(() => setTimeout(() => openLead(curLead.id), 300)).catch(() => {});
  });
  $('#la-form').addEventListener('submit', async e => {
    e.preventDefault(); if (!curLead) return;
    const f = Object.fromEntries(new FormData(e.target));
    try { await api(`/api/admin/leads/${curLead.id}/activities`, { method: 'POST', body: f }); e.target.reset(); toast('U shtua në historik.'); openLead(curLead.id); }
    catch (err) { toast(err.message, 'err'); }
  });
  $('#lm-opps').addEventListener('click', e => { const li = e.target.closest('[data-opp]'); if (li) openOpp(Number(li.dataset.opp)); });
  $('#lm-addopp').addEventListener('click', () => curLead && openOpp(null, curLead.id));
  $('#lm-del').addEventListener('click', async () => {
    if (!curLead || !confirm(`Të fshihet ${curLead.name} me gjithë opportunitetet dhe historikun?`)) return;
    try { await api('/api/admin/leads/' + curLead.id, { method: 'DELETE' }); lm.close(); toast('Lead-i u fshi.'); route(); } catch (err) { toast(err.message, 'err'); }
  });
  const ADMIN_VIEW_NOW = () => (location.hash.slice(1) || 'paneli');

  /* ---------- opportunitete (kanban) ---------- */
  let oFilter = { q: '', agent: '' }, propsCache = null;
  async function opportunitete() {
    if (admin() && !agentsCache.length) agentsCache = await api('/api/admin/agents').catch(() => []);
    $('#view').innerHTML = `<div id="ov"><div class="top"><h1>Opportunitete</h1><button class="btn" id="add-o">Shto opportunity</button></div>
      <div class="toolbar" style="margin:-1rem 0 1rem"><input class="input" id="oq" placeholder="Kërko klient, pronë, kod" value="${esc(oFilter.q)}">
      ${admin() ? `<select class="select" id="oa"><option value="">Të gjithë agjentët</option><option value="none">Pa agjent</option>${agentsCache.map(a => `<option value="${a.id}" ${String(oFilter.agent) === String(a.id) ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>` : ''}</div>
      <p class="muted hint-k">Tërhiqni kartat nga një fazë te tjetra, ose përdorni shigjetat ‹ › në kartë.</p>
      <div class="kanban" id="kb"></div></div>`;
    let t;
    $('#oq').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { oFilter.q = e.target.value; loadO(); }, 300); });
    $('#oa')?.addEventListener('change', e => { oFilter.agent = e.target.value; loadO(); });
    $('#add-o').addEventListener('click', () => openOpp());
    const kb = $('#kb');
    kb.addEventListener('click', async e => {
      const mv = e.target.closest('[data-mv]');
      if (mv) { e.stopPropagation(); const i = STAGES.indexOf(mv.dataset.from) + Number(mv.dataset.mv); if (i >= 0 && i < STAGES.length) await moveStage(Number(mv.dataset.id), STAGES[i]); return; }
      if (e.target.closest('a')) return;
      const c = e.target.closest('[data-card]'); if (c) openOpp(Number(c.dataset.card));
    });
    kb.addEventListener('dragstart', e => { const c = e.target.closest('[data-card]'); if (c) { e.dataTransfer.setData('text/plain', c.dataset.card); c.classList.add('drag'); } });
    kb.addEventListener('dragend', e => e.target.closest('[data-card]')?.classList.remove('drag'));
    kb.addEventListener('dragover', e => { const col = e.target.closest('[data-col]'); if (col) { e.preventDefault(); $$('.kcol.over', kb).forEach(x => x !== col && x.classList.remove('over')); col.classList.add('over'); } });
    kb.addEventListener('dragleave', e => { const col = e.target.closest('[data-col]'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('over'); });
    kb.addEventListener('drop', async e => { const col = e.target.closest('[data-col]'); if (!col) return; e.preventDefault(); col.classList.remove('over'); const id = Number(e.dataTransfer.getData('text/plain')); if (id) await moveStage(id, col.dataset.col); });
    loadO();
  }
  async function moveStage(id, stage) {
    let lost_reason = '';
    if (stage === 'lost') { lost_reason = await askText('Pse u humb?', 'Arsyeja (p.sh. bleu diku tjetër, buxheti, ndryshoi mendje)', 'Shëno si të humbur'); if (lost_reason === null) return; }
    try { await api('/api/admin/opportunities/' + id, { method: 'PATCH', body: { stage, lost_reason } }); toast(stage === 'won' ? 'Urime! Opportunity-ja u fitua.' : `U kalua te “${STAGE[stage]}”.`); if ($('#kb')) loadO(); refreshCounts(); }
    catch (err) { toast(err.message, 'err'); }
  }
  async function loadO() {
    const rows = await api('/api/admin/opportunities?' + new URLSearchParams(oFilter));
    $('#kb').innerHTML = STAGES.map(st => {
      const list = rows.filter(o => o.stage === st), sum = list.reduce((t, o) => t + (o.value || 0), 0);
      return `<section class="kcol kc-${st}" data-col="${st}"><header><span>${STAGE[st]} <b>${list.length}</b></span><small>${sum ? fmt(sum) + ' €' : ''}</small></header>
        <div class="kcards">${list.map(o => `<article class="kcard" draggable="true" data-card="${o.id}">
          <b>${esc(o.title)}</b><span class="kc-l">${esc(o.lead_name)}${admin() ? ` · <span class="${o.agent_name ? '' : 'gold'}">${esc(o.agent_name || 'Pa agjent')}</span>` : ''}</span>
          <span class="kc-v">${o.value ? fmt(o.value) + ' €' : ''}${o.commission ? ` <small>· kom. ${fmt(o.commission)} €</small>` : ''}</span>
          ${['won', 'lost'].includes(o.stage) ? (o.stage === 'lost' && o.lost_reason ? `<small class="muted">${esc(o.lost_reason)}</small>` : '') : `<span class="kc-n">${o.next_action ? esc(o.next_action) + ' ' : ''}${dueTag(o.next_date)}</span>`}
          <div class="kc-a"><button type="button" data-mv="-1" data-from="${st}" data-id="${o.id}" ${st === 'new' ? 'disabled' : ''} aria-label="Faza e mëparshme">‹</button>
            ${o.lead_phone ? `<a href="tel:${telOf(o.lead_phone)}" aria-label="Telefono">${ti('phone')}</a><a href="https://wa.me/${waOf(o.lead_phone)}" target="_blank" rel="noopener" aria-label="WhatsApp" class="wa">${ti('wa')}</a>` : ''}
            <button type="button" data-mv="1" data-from="${st}" data-id="${o.id}" ${st === 'lost' ? 'disabled' : ''} aria-label="Faza tjetër">›</button></div>
        </article>`).join('') || '<p class="kempty">—</p>'}</div></section>`;
    }).join('');
  }

  const om = $('#omodal'), of = $('#oform'); let curOpp = null;
  async function openOpp(id = null, leadId = null) {
    curOpp = null; of.reset(); $('#om-msg').textContent = '';
    $$('.admin-only', om).forEach(el => el.hidden = !admin());
    if (!propsCache) {
      propsCache = [];
      for (let pg = 1; pg <= 5; pg++) { const r = await api(`/api/properties?limit=48&page=${pg}`).catch(() => null); if (!r) break; propsCache.push(...r.items); if (pg >= r.pages) break; }
      if (!admin()) { const own = await api('/api/admin/properties').catch(() => []); own.forEach(p => { if (!propsCache.some(x => x.id === p.id)) propsCache.push(p); }); }
    }
    $('#o-prop').innerHTML = '<option value="">Pa pronë të caktuar</option>' + propsCache.map(p => `<option value="${p.id}">${esc(p.code)} – ${esc(p.title)} (${fmt(p.price)} €)</option>`).join('');
    $('#o-stage').innerHTML = opts(STAGE);
    if (admin()) { if (!agentsCache.length) agentsCache = await api('/api/admin/agents').catch(() => []); $('#o-agent').innerHTML = '<option value="">Si lead-i</option>' + agentsCache.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join(''); }
    if (id) {
      try { curOpp = (await api('/api/admin/opportunities?closed=all')).find(o => o.id === id); } catch (e) { return toast(e.message, 'err'); }
      if (!curOpp) return toast('Opportunity-ja nuk u gjet.', 'err');
      leadId = curOpp.lead_id;
      for (const k of ['title', 'deal', 'stage', 'value', 'commission', 'next_action', 'next_date', 'lost_reason', 'property_id', 'agent_id']) if (of.elements[k]) of.elements[k].value = curOpp[k] ?? '';
    } else { of.elements.next_date.value = todayStr(); of.elements.stage.value = 'new'; }
    const leadSel = $('#o-lead');
    if (leadId) { leadSel.innerHTML = `<option value="${leadId}">${esc(curOpp?.lead_name || curLead?.name || 'Lead-i')}</option>`; leadSel.disabled = true; }
    else { const ls = await api('/api/admin/leads?status=active').catch(() => []); leadSel.disabled = false; leadSel.innerHTML = ls.length ? '<option value="">Zgjidhni klientin…</option>' + ls.map(l => `<option value="${l.id}">${esc(l.name)} · ${esc(l.phone || l.email)}</option>`).join('') : '<option value="">Shtoni fillimisht një lead</option>'; }
    $('#om-title').textContent = curOpp ? 'Ndrysho opportunity-në' : 'Opportunity e re';
    $('#om-del').hidden = !curOpp; $('#om-lead').hidden = !curOpp;
    toggleLost(); om.showModal();
  }
  const toggleLost = () => { $('#o-lostf').hidden = of.elements.stage.value !== 'lost'; };
  of.elements.stage.addEventListener('change', toggleLost);
  $('#o-prop').addEventListener('change', e => {
    const p = propsCache.find(x => x.id === Number(e.target.value)); if (!p) return;
    if (!of.elements.title.value) of.elements.title.value = `${p.code} – ${p.title}`;
    if (!of.elements.value.value) of.elements.value.value = p.price;
    of.elements.deal.value = p.deal;
  });
  of.addEventListener('submit', async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(of)); body.lead_id = $('#o-lead').value;
    if (!body.lead_id) { $('#om-msg').className = 'form-msg err'; $('#om-msg').textContent = 'Zgjidhni klientin (lead-in).'; return; }
    try {
      await api('/api/admin/opportunities' + (curOpp ? '/' + curOpp.id : ''), { method: curOpp ? 'PUT' : 'POST', body });
      om.close(); toast(curOpp ? 'Ndryshimet u ruajtën.' : 'Opportunity-ja u shtua.'); refreshCounts();
      if (lm.open && curLead) openLead(curLead.id);
      if ($('#kb')) loadO(); else if ($('#today')) route();
    } catch (err) { $('#om-msg').className = 'form-msg err'; $('#om-msg').textContent = err.message; }
  });
  $('#om-del').addEventListener('click', async () => {
    if (!curOpp || !confirm('Të fshihet kjo opportunity?')) return;
    try { await api('/api/admin/opportunities/' + curOpp.id, { method: 'DELETE' }); om.close(); toast('U fshi.'); if (lm.open && curLead) openLead(curLead.id); if ($('#kb')) loadO(); } catch (err) { toast(err.message, 'err'); }
  });
  $('#om-lead').addEventListener('click', () => { if (curOpp) { om.close(); openLead(curOpp.lead_id); } });
  function askText(title, label, okText) {
    return new Promise(res => {
      const d = $('#qmodal'); $('#q-title').textContent = title; $('#q-label').textContent = label; $('#q-ok').textContent = okText; $('#q-text').value = '';
      const done = v => { d.close(); res(v); };
      $('#q-ok').onclick = () => done($('#q-text').value.trim());
      $$('[data-qclose]', d).forEach(b => b.onclick = () => done(null));
      d.oncancel = e => { e.preventDefault(); done(null); };
      d.showModal(); $('#q-text').focus();
    });
  }

  /* ---------- raporti (administratori) ---------- */
  async function raporti() {
    const c = await api('/api/admin/crm');
    const tot = c.agents.reduce((t, a) => ({ leads: t.leads + a.leads, open: t.open + a.open, value: t.value + a.open_value, wm: t.wm + a.won_month, cm: t.cm + a.commission_month, ct: t.ct + a.commission_total }), { leads: 0, open: 0, value: 0, wm: 0, cm: 0, ct: 0 });
    const month = new Date().toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' });
    $('#view').innerHTML = `<div class="top"><h1>Raporti</h1><span class="muted">${esc(month)}</span></div>
      <div class="stats-grid">
        <div class="stat"><b>${c.leads.total || 0}</b><span>Leads gjithsej</span></div>
        <div class="stat"><b>${tot.open}</b><span>Opportunitete të hapura</span></div>
        <div class="stat"><b>${fmt(tot.value)} €</b><span>Vlera në proces</span></div>
        <div class="stat"><b>${c.month.won || 0}</b><span>Fituar këtë muaj</span></div>
        <div class="stat"><b>${fmt(c.month.commission)} €</b><span>Komision këtë muaj</span></div>
        <div class="stat"><b>${fmt(tot.ct)} €</b><span>Komision gjithsej</span></div>
      </div>
      <div class="panel" style="margin-bottom:1.5rem"><h2>Sipas agjentit</h2><div class="table-wrap" style="border:0"><table style="min-width:760px"><thead><tr><th>Agjenti</th><th>Leads</th><th>Të hapura</th><th>Vlera në proces</th><th>Fituar (muaji)</th><th>Komision (muaji)</th><th>Fituar / Humbur</th><th>Komision gjithsej</th></tr></thead><tbody>
        ${c.agents.map(a => `<tr><td><b style="font-weight:500">${esc(a.name)}</b></td><td>${a.leads}</td><td>${a.open}</td><td>${fmt(a.open_value)} €</td><td>${a.won_month}</td><td class="gold">${fmt(a.commission_month)} €</td><td>${a.won_total} / ${a.lost_total}${a.won_total + a.lost_total ? ` <small class="muted">(${Math.round(a.won_total / (a.won_total + a.lost_total) * 100)}%)</small>` : ''}</td><td>${fmt(a.commission_total)} €</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="panel"><h2>Nga vijnë klientët</h2><ul class="list-mini">${c.sources.map(s => `<li><span>${esc(SOURCE[s.source] || s.source)}</span><span><b style="font-weight:500">${s.leads}</b> leads${s.won ? ` · <span class="gold">${s.won} fituar</span>` : ''}</span></li>`).join('') || '<li class="muted">Ende pa të dhëna.</li>'}</ul></div>`;
  }

  /* ---------- kërkesat ---------- */
  let iStatus = '';
  async function kerkesat() {
    $('#view').innerHTML = `<div class="top"><h1>Kërkesat</h1><div class="tabs" id="itabs">${[['', 'Të gjitha'], ...Object.entries(ISTATUS)].map(([k, v]) => `<button data-s="${k}" class="${iStatus === k ? 'on' : ''}">${v}</button>`).join('')}</div></div>
      ${!admin() ? '<p class="muted" style="margin:-1rem 0 1.5rem">Këtu shfaqen kërkesat e klientëve për pronat tuaja.</p>' : ''}<div id="ilist"></div>`;
    $('#itabs').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; iStatus = b.dataset.s; $$('#itabs button').forEach(x => x.classList.toggle('on', x === b)); loadI(); });
    $('#ilist').addEventListener('change', async e => {
      const s = e.target.closest('[data-istatus]'); if (!s) return;
      try { await api('/api/admin/inquiries/' + s.dataset.istatus, { method: 'PATCH', body: { status: s.value } }); toast('Statusi u përditësua.'); s.closest('.inq').classList.toggle('new', s.value === 'new'); refreshCounts(); } catch (err) { toast(err.message, 'err'); }
    });
    $('#ilist').addEventListener('click', async e => {
      const lb = e.target.closest('[data-ilead]'), cv = e.target.closest('[data-iconv]');
      if (lb) return openLead(Number(lb.dataset.ilead));
      if (cv) { try { const r = await api(`/api/admin/inquiries/${cv.dataset.iconv}/lead`, { method: 'POST' }); toast('Lead-i u krijua.'); loadI(); openLead(r.lead_id); } catch (err) { toast(err.message, 'err'); } return; }
      const d = e.target.closest('[data-idel]');
      if (d && confirm('Të fshihet kjo kërkesë?')) { try { await api('/api/admin/inquiries/' + d.dataset.idel, { method: 'DELETE' }); toast('Kërkesa u fshi.'); loadI(); refreshCounts(); } catch (err) { toast(err.message, 'err'); } }
    });
    loadI();
  }
  async function loadI() {
    const rows = await api('/api/admin/inquiries' + (iStatus ? '?status=' + iStatus : ''));
    $('#ilist').innerHTML = rows.length ? rows.map(i => {
      const tel = (i.phone || '').replace(/[^\d+]/g, '');
      return `<article class="inq ${i.status === 'new' ? 'new' : ''}">
        <div><div style="display:flex;gap:.7rem;align-items:center;flex-wrap:wrap"><h3>${esc(i.name)}</h3><span class="kind-tag">${KIND[i.kind]}</span></div>
          <div class="meta">${tel ? `<a href="tel:${tel}">${esc(i.phone)}</a><a href="https://wa.me/${tel.replace('+', '')}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${i.email ? `<a href="mailto:${esc(i.email)}">${esc(i.email)}</a>` : ''}${i.property_id ? `<a href="/property.html?id=${i.property_id}" target="_blank">${esc(i.property_code || 'Prona')} – ${esc(i.property_title || '')}</a>` : ''}<span>${date(i.created_at)}</span></div>
          ${i.message ? `<p>${esc(i.message)}</p>` : ''}</div>
        <div class="side"><select class="select" data-istatus="${i.id}" aria-label="Statusi">${Object.entries(ISTATUS).map(([k, v]) => `<option value="${k}" ${i.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          ${i.lead_id ? `<button class="btn ghost sm" data-ilead="${i.lead_id}">Hap lead-in</button>` : `<button class="btn ghost sm" data-iconv="${i.id}">Krijo lead</button>`}
          ${admin() ? `<button class="icon-btn danger" data-idel="${i.id}" aria-label="Fshi kërkesën">${ic.del}</button>` : ''}</div>
      </article>`;
    }).join('') : `<div class="empty"><h3>Asnjë kërkesë këtu</h3>${admin() ? 'Kërkesat nga formularët e faqes shfaqen në këtë listë.' : 'Kur një klient pyet për një nga pronat tuaja, kërkesa shfaqet këtu.'}</div>`;
  }

  /* ---------- agjentët (vetëm administratori) ---------- */
  const am = $('#amodal'), af = $('#aform'); let aEditing = null;
  async function agjentet() {
    agentsCache = await api('/api/admin/agents');
    $('#view').innerHTML = `<div id="agv"><div class="top"><h1>Agjentët</h1><button class="btn" id="add-a">Shto agjent</button></div>
      <p class="muted" style="margin:-1rem 0 1.5rem">Jepini agjentit përdorues dhe fjalëkalim që të hyjë vetë te <b style="color:var(--text)">/admin/</b> dhe të postojë pronat e veta. Pronat e tij dalin në faqe pasi t’i miratoni.</p>
      <div class="table-wrap"><table style="min-width:820px"><thead><tr><th></th><th>Emri</th><th>Niveli</th><th>Kontakti</th><th>Hyrja në panel</th><th>Prona</th><th>Veprime</th></tr></thead><tbody>${agentsCache.map(a => `<tr>
        <td><img class="thumb" style="width:48px;height:48px" src="${esc(a.photo || FALLBACK)}" alt="" onerror="this.src='${FALLBACK}'"></td>
        <td><span class="t">${esc(a.name)}</span><small>${esc(a.role)}</small></td>
        <td><span class="lvl">${a.level || 2}</span> <small class="muted">${esc(LEVELS[a.level || 2])}</small></td>
        <td>${esc(a.phone)}<br><small>${esc(a.email)}</small></td>
        <td>${a.username ? `<b style="font-weight:500">${esc(a.username)}</b><br><span class="ap ${a.login_active ? 'ap-approved' : 'ap-rejected'}">${a.login_active ? 'Aktive' : 'E çaktivizuar'}</span>` : '<span class="muted">Pa hyrje</span>'}</td>
        <td>${a.listings}</td>
        <td><div class="row-acts"><button class="icon-btn" data-aedit="${a.id}" aria-label="Ndrysho">${ic.edit}</button><button class="icon-btn danger" data-adel="${a.id}" aria-label="Fshi">${ic.del}</button></div></td></tr>`).join('') || '<tr><td colspan="7" class="muted" style="padding:2rem;text-align:center">Shtoni agjentin e parë.</td></tr>'}</tbody></table></div></div>`;
    $('#add-a').addEventListener('click', () => openAgent());
    $('#agv').addEventListener('click', async e => {
      const ed = e.target.closest('[data-aedit]'), dl = e.target.closest('[data-adel]');
      if (ed) openAgent(agentsCache.find(a => a.id === +ed.dataset.aedit));
      if (dl && confirm('Të fshihet agjenti dhe llogaria e tij e hyrjes? Pronat e tij do të mbeten pa agjent.')) { try { await api('/api/admin/agents/' + dl.dataset.adel, { method: 'DELETE' }); toast('Agjenti u fshi.'); agjentet(); } catch (err) { toast(err.message, 'err'); } }
    });
  }
  function openAgent(a = null) {
    aEditing = a?.id || null; af.reset(); $('#am-msg').textContent = '';
    $('#am-title').textContent = a ? 'Ndrysho agjentin' : 'Agjent i ri';
    ['name', 'role', 'phone', 'email', 'bio', 'photo', 'username'].forEach(k => af.elements[k].value = a?.[k] || '');
    af.elements.level.value = String(a?.level || 2);
    af.elements.role.dataset.auto = a && a.role !== LEVELS[a.level || 2] ? '0' : '1';
    if (!a) af.elements.role.value = LEVELS[2];
    af.elements.login_active.checked = a ? (a.username ? !!a.login_active : true) : true;
    $('#a-pass-hint').textContent = a?.username ? 'Lëreni bosh për të mbajtur fjalëkalimin aktual. Shkruani një të ri për ta ndryshuar.' : 'Të paktën 8 karaktere. Lëreni bosh përdoruesin dhe fjalëkalimin nëse agjenti nuk do të hyjë në panel.';
    $('#a-prev').src = a?.photo || FALLBACK;
    am.showModal();
  }
  $('#a-level').innerHTML = Object.entries(LEVELS).sort((x, y) => y[0] - x[0]).map(([k, v]) => `<option value="${k}">${k} · ${v}</option>`).join('');
  $('#a-level').addEventListener('change', e => { const r = af.elements.role; if (!r.value || r.dataset.auto === '1') { r.value = LEVELS[e.target.value]; r.dataset.auto = '1'; } });
  af.elements.role.addEventListener('input', e => { e.target.dataset.auto = '0'; });
  $('#a-gen').addEventListener('click', () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const pw = Array.from(crypto.getRandomValues(new Uint32Array(10)), n => chars[n % chars.length]).join('');
    af.elements.password.value = pw; af.elements.password.type = 'text';
    if (!af.elements.username.value && af.elements.name.value) af.elements.username.value = af.elements.name.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
  });
  $('#a-photo-f').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const url = await upload(f); $('#a-photo').value = url; $('#a-prev').src = url; } catch (err) { toast(err.message, 'err'); }
  });
  af.addEventListener('submit', async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(af)); body.login_active = af.elements.login_active.checked;
    try {
      await api('/api/admin/agents' + (aEditing ? '/' + aEditing : ''), { method: aEditing ? 'PUT' : 'POST', body });
      am.close(); af.elements.password.type = 'password'; agentsCache = []; agjentet();
      if (body.username && body.password) showCredentials(body); else toast('Agjenti u ruajt.');
    } catch (err) { $('#am-msg').className = 'form-msg err'; $('#am-msg').textContent = err.message; }
  });

  function showCredentials(a) {
    const text = `Përshëndetje ${a.name.split(' ')[0]}, kjo është hyrja jote në panelin e De Luxe Real Estate:\n\n${location.origin}/admin/\nPërdoruesi: ${a.username.toLowerCase()}\nFjalëkalimi: ${a.password}\n\nPronat që shton dalin në faqe pasi t’i miratojmë. Fjalëkalimin mund ta ndryshosh te “Llogaria”.`;
    $('#c-text').textContent = text;
    const tel = (a.phone || '').replace(/\D/g, '');
    $('#c-wa').href = `https://wa.me/${tel}?text=${encodeURIComponent(text)}`;
    $('#c-copy').onclick = () => navigator.clipboard.writeText(text).then(() => toast('U kopjua.'), () => toast('Kopjoni tekstin me dorë.', 'err'));
    $('#cmodal').showModal();
  }

  /* ---------- abonentët ---------- */
  async function abonentet() {
    const rows = await api('/api/admin/subscribers');
    $('#view').innerHTML = `<div id="sbv"><div class="top"><h1>Abonentët</h1><button class="btn outline" id="csv" ${rows.length ? '' : 'disabled'}>Shkarko CSV</button></div>
      <div class="table-wrap"><table style="min-width:480px"><thead><tr><th>Email</th><th>Data</th><th></th></tr></thead><tbody>${rows.map(s => `<tr><td>${esc(s.email)}</td><td>${date(s.created_at)}</td><td><button class="icon-btn danger" data-sdel="${s.id}" aria-label="Fshi">${ic.del}</button></td></tr>`).join('') || '<tr><td colspan="3" class="muted" style="padding:2rem;text-align:center">Askush nuk është regjistruar ende.</td></tr>'}</tbody></table></div></div>`;
    $('#csv').addEventListener('click', () => {
      const csv = 'email,data\n' + rows.map(r => `${r.email},${r.created_at}`).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'abonentet.csv'; a.click(); URL.revokeObjectURL(a.href);
    });
    $('#sbv').addEventListener('click', async e => {
      const d = e.target.closest('[data-sdel]');
      if (d && confirm('Të hiqet ky abonent?')) { try { await api('/api/admin/subscribers/' + d.dataset.sdel, { method: 'DELETE' }); toast('U hoq.'); abonentet(); } catch (err) { toast(err.message, 'err'); } }
    });
  }

  /* ---------- faqja: foto kryesore dhe tekstet e hyrjes ---------- */
  async function faqja() {
    const [s, props] = await Promise.all([api('/api/admin/settings'), api('/api/admin/properties?approval=approved&status=active')]);
    $('#view').innerHTML = `<div class="top"><h1>Faqja kryesore</h1><a class="btn ghost" href="/" target="_blank">Shiko faqen</a></div>
      <form class="panel" id="hs" style="max-width:760px;display:grid;gap:1.2rem" novalidate>
        <h2>Fotoja e madhe në hyrje</h2>
        <div class="hero-pick"><div class="hero-prev" id="hs-prev"></div>
          <div style="display:grid;gap:.6rem;align-content:start">
            <label class="btn ghost sm" for="hs-file" style="justify-self:start">Ngarko foto</label><input type="file" id="hs-file" accept="image/jpeg,image/png,image/webp" hidden>
            <button class="btn ghost sm" type="button" id="hs-clear" style="justify-self:start">Hiq foton</button>
            <small class="muted">Foto vertikale ose katrore, mundësisht e ndriçuar mirë. Pa foto, faqja tregon foton e një prone të përzgjedhur, ose logon nëse nuk ka asnjë.</small>
          </div></div>
        <input type="hidden" name="hero_image" id="hs-img">
        <div class="field"><label for="hs-prop">Prona që shfaqet poshtë fotos (opsionale)</label>
          <select class="select" id="hs-prop" name="hero_property_id"><option value="">Asnjë – vetëm fotoja</option>${props.map(p => `<option value="${p.id}">${esc(p.code)} – ${esc(p.title)}</option>`).join('')}</select>
          <small class="muted">Klienti e shtyp dhe hap direkt pronën. Nëse nuk ngarkoni foto, përdoret fotoja e kësaj prone.</small></div>
        <h2 style="margin-top:.6rem">Tekstet</h2>
        <div class="field"><label for="hs-title">Titulli i madh</label><input class="input" id="hs-title" name="hero_title" maxlength="140" placeholder="Prona elitare të tipologjive të ndryshme nga çdo cep i *Shqipërisë*, të përzgjedhura për klientët tanë">
          <small class="muted">Fjalën që doni me ngjyrë ari vendoseni mes yjeve, p.sh. <b style="color:var(--text)">*bregdet*</b>. Lëreni bosh për tekstin e parazgjedhur.</small></div>
        <div class="field"><label for="hs-text">Teksti poshtë titullit</label><textarea class="textarea" id="hs-text" name="hero_text" maxlength="300" style="min-height:80px" placeholder="Vila, apartamente dhe hapësira biznesi që i kemi parë vetë…"></textarea></div>
        <div style="display:flex;gap:.8rem;align-items:center;flex-wrap:wrap"><button class="btn" type="submit">Ruaj ndryshimet</button><p class="form-msg" id="hs-msg" style="margin:0"></p></div>
      </form>`;
    const f = $('#hs');
    f.elements.hero_image.value = s.hero_image || ''; f.elements.hero_property_id.value = s.hero_property_id || '';
    f.elements.hero_title.value = s.hero_title || ''; f.elements.hero_text.value = s.hero_text || '';
    const prev = () => {
      const p = props.find(x => String(x.id) === f.elements.hero_property_id.value);
      const src = f.elements.hero_image.value || p?.images?.[0] || '';
      $('#hs-prev').innerHTML = src ? `<img src="${esc(src)}" alt="" onerror="this.src='${FALLBACK}'">` : `<img src="/img/logo-full.png" alt="" style="object-fit:contain;padding:1.5rem;background:var(--black)">`;
      $('#hs-clear').hidden = !f.elements.hero_image.value;
    };
    prev();
    f.elements.hero_property_id.addEventListener('change', prev);
    $('#hs-file').addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      $('#hs-msg').className = 'form-msg'; $('#hs-msg').textContent = 'Po ngarkohet…';
      try { f.elements.hero_image.value = await upload(file); prev(); $('#hs-msg').textContent = 'Fotoja u ngarkua – shtypni “Ruaj ndryshimet”.'; }
      catch (err) { $('#hs-msg').className = 'form-msg err'; $('#hs-msg').textContent = err.message; }
      e.target.value = '';
    });
    $('#hs-clear').addEventListener('click', () => { f.elements.hero_image.value = ''; prev(); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      try { await api('/api/admin/settings', { method: 'PUT', body: Object.fromEntries(new FormData(f)) }); $('#hs-msg').className = 'form-msg ok'; $('#hs-msg').textContent = 'U ruajt. Ndryshimet duken menjëherë në faqe.'; toast('Faqja kryesore u përditësua.'); }
      catch (err) { $('#hs-msg').className = 'form-msg err'; $('#hs-msg').textContent = err.message; }
    });
  }

  /* ---------- llogaria ---------- */
  async function llogaria() {
    $('#view').innerHTML = `<div class="top"><h1>Llogaria</h1></div>
      <form class="panel" id="pw" style="max-width:440px;display:grid;gap:1rem" novalidate><h2>Ndrysho fjalëkalimin</h2>
        <p class="muted" style="margin:0;font-size:.92rem">Përdoruesi: <b style="color:var(--text)">${esc(USER.username)}</b></p>
        <div class="field"><label for="pw-c">Fjalëkalimi aktual</label><input class="input" id="pw-c" name="current" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="pw-n">Fjalëkalimi i ri (min. 8 karaktere)</label><input class="input" id="pw-n" name="next" type="password" autocomplete="new-password"></div>
        <div class="field"><label for="pw-r">Përsërit fjalëkalimin e ri</label><input class="input" id="pw-r" name="repeat" type="password" autocomplete="new-password"></div>
        <button class="btn" type="submit" style="justify-self:start">Ruaj fjalëkalimin</button><p class="form-msg" id="pw-msg"></p></form>`;
    $('#pw').addEventListener('submit', async e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), m = $('#pw-msg');
      if (f.next !== f.repeat) { m.className = 'form-msg err'; m.textContent = 'Fjalëkalimet e reja nuk përputhen.'; return; }
      try { const r = await api('/api/admin/password', { method: 'POST', body: f }); m.className = 'form-msg ok'; m.textContent = r.message; e.target.reset(); } catch (err) { m.className = 'form-msg err'; m.textContent = err.message; }
    });
  }

  /* ---------- lagjet si sugjerime në formularë ---------- */
  let ZONES = {};
  fetch('/api/meta').then(r => r.json()).then(m => { ZONES = m.zones || {}; fillZoneList(); $('#zone-city-list').innerHTML = [...$$('#city-list option').map(o => o.value), ...Object.entries(ZONES).flatMap(([c, l]) => l.map(z => `${z}, ${c}`))].map(v => `<option value="${esc(v)}">`).join(''); }).catch(() => {});
  function fillZoneList(city) {
    const list = city && ZONES[city] ? ZONES[city] : Object.values(ZONES).flat();
    $('#zone-list').innerHTML = list.map(z => `<option value="${esc(z)}">`).join('');
  }
  $('#p-city').addEventListener('input', e => fillZoneList(e.target.value.trim()));
  $('#l-city').setAttribute('list', 'zone-city-list');

  /* ---------- nisja ---------- */
  api('/api/admin/me').then(u => { USER = u; renderShell(); }).catch(() => { if (!USER) renderLogin(); });
})();
