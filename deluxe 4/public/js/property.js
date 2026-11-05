/* Detajet e pronës */
(async () => {
  const { $, $$, esc, fmt, api, meta, card, imgTag, bindInquiry, favs, I, waLink, roomsLabel, toast } = DL;
  const id = Number(new URLSearchParams(location.search).get('id'));
  let p;
  try {
    if (!id) throw new Error('Nuk u zgjodh asnjë pronë.');
    [p] = await Promise.all([api('/api/properties/' + id), meta()]);
  } catch (e) {
    $('#gallery').remove();
    $('#content').innerHTML = `<div class="empty" style="margin-top:2rem"><h3>Prona nuk u gjet</h3><p>${esc(e.message)}</p><p><a class="btn" href="/properties.html">Shikoni pronat e tjera</a></p></div>`;
    return;
  }
  const rate = (await meta()).site.eurToLek;
  document.title = `${p.title} – ${p.city} | De Luxe Real Estate`;
  $('#crumbs').innerHTML += ` / <a href="/properties.html?city=${encodeURIComponent(p.city)}">${esc(p.city)}</a> / ${esc(p.code)}`;

  /* galeria */
  const imgs = p.images.length ? p.images : [DL.FALLBACK];
  const g = $('#gallery');
  const many = imgs.length > 1;
  const FULL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  g.className = 'pgal';
  g.innerHTML = `<div class="pg-main">
      <div class="pg-track" id="pg-track" role="group" aria-roledescription="galeri" aria-label="Fotot e pronës">${imgs.map((src, i) => `<span class="pg-slide">${imgTag(src, `${p.title} – foto ${i + 1}`)}</span>`).join('')}</div>
      ${many ? `<button type="button" class="pg-nav prev" data-pg="-1" aria-label="Fotoja e mëparshme">‹</button><button type="button" class="pg-nav next" data-pg="1" aria-label="Fotoja tjetër">›</button><span class="pg-count" id="pg-count">1 / ${imgs.length}</span>` : ''}
      <button type="button" class="pg-full" id="pg-full" aria-label="Shiko në ekran të plotë">${FULL}</button>
    </div>
    ${many ? `<div class="pg-thumbs" id="pg-thumbs">${imgs.map((src, i) => `<button type="button" data-th="${i}" class="${i ? '' : 'on'}" aria-label="Foto ${i + 1}">${imgTag(src, '')}</button>`).join('')}</div>` : ''}`;
  const track = $('#pg-track');
  const curIdx = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
  const goTo = i => { i = (i + imgs.length) % imgs.length; track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }); };
  let rafG = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(rafG);
    rafG = requestAnimationFrame(() => {
      const i = curIdx();
      if ($('#pg-count')) $('#pg-count').textContent = `${i + 1} / ${imgs.length}`;
      $$('#pg-thumbs [data-th]').forEach((b, k) => b.classList.toggle('on', k === i));
      const th = $(`#pg-thumbs [data-th="${i}"]`);
      if (th) { const box = $('#pg-thumbs'); box.scrollTo({ left: th.offsetLeft - box.clientWidth / 2 + th.clientWidth / 2, behavior: 'smooth' }); }
    });
  });
  g.addEventListener('click', e => {
    const nav = e.target.closest('[data-pg]'); if (nav) return goTo(curIdx() + Number(nav.dataset.pg));
    const th = e.target.closest('[data-th]'); if (th) return goTo(Number(th.dataset.th));
    if (e.target.closest('#pg-full')) return openLb(curIdx());
    if (e.target.closest('#pg-track')) {
      if (!many) return openLb(0);
      const r = track.getBoundingClientRect(); goTo(curIdx() + (e.clientX - r.left < r.width / 3 ? -1 : 1));
    }
  });
  document.addEventListener('keydown', e => {
    if ($('#lb').classList.contains('open') || e.target.closest('input,textarea,select')) return;
    if (e.key === 'ArrowLeft' && many) goTo(curIdx() - 1);
    if (e.key === 'ArrowRight' && many) goTo(curIdx() + 1);
  });
  window.addEventListener('resize', () => track.scrollTo({ left: curIdx() * track.clientWidth }));
  let cur = 0;
  const lb = $('#lb');
  const show = i => { cur = (i + imgs.length) % imgs.length; $('#lb-img').src = imgs[cur]; $('#lb-img').alt = `${p.title} – foto ${cur + 1}`; $('#lb-count').textContent = `${cur + 1} / ${imgs.length}`; };
  const openLb = i => { show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('#lb-close').focus(); };
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; track.scrollTo({ left: cur * track.clientWidth }); };
  $('#lb-prev').onclick = () => show(cur - 1); $('#lb-next').onclick = () => show(cur + 1); $('#lb-close').onclick = closeLb;
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  let sx = null; lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) show(cur + (d < 0 ? 1 : -1)); sx = null; });
  if (imgs.length < 2) { $('#lb-prev').hidden = true; $('#lb-next').hidden = true; }

  /* përmbajtja */
  const status = { sold: 'E shitur', rented: 'E dhënë me qira' }[p.status];
  const fact = (label, val) => val || val === 0 ? `<div><span>${label}</span><b>${val}</b></div>` : '';
  const facts = [
    fact('Sipërfaqja', `${fmt(p.area)} m²`), fact('Lloji', esc(p.type)),
    p.type !== 'Tokë' ? fact(roomsLabel(p)[0].toUpperCase() + roomsLabel(p).slice(1), p.rooms || '–') : '',
    p.type !== 'Tokë' ? fact('Banjo', p.bathrooms || '–') : '',
    p.floor ? fact('Kati', esc(p.floor)) : '', p.year_built ? fact('Viti i ndërtimit', p.year_built) : '',
    p.type !== 'Tokë' ? fact('Mobilimi', p.furnished ? 'I mobiluar' : 'Pa mobilim') : '',
    fact('Parkim', p.parking ? `${p.parking} vend${p.parking > 1 ? 'e' : ''}` : 'Jo')
  ].join('');
  const isFav = favs().includes(p.id);
  const mapUrl = p.lat && p.lng ? `https://www.openstreetmap.org/export/embed.html?bbox=${p.lng - .012},${p.lat - .007},${p.lng + .012},${p.lat + .007}&layer=mapnik&marker=${p.lat},${p.lng}` : null;

  $('#content').innerHTML = `
    <div class="p-head">
      <div>${status ? `<span class="p-status">${status}</span>` : ''}<h1>${esc(p.title)}</h1>
        <div class="p-loc">${esc([p.address, p.zone, p.city].filter(Boolean).join(', '))} · <span class="gold">${esc(p.code)}</span></div></div>
      <div class="p-price"><b>${fmt(p.price)} €</b><small>${p.deal === 'qira' ? 'në muaj · ' : ''}≈ ${fmt(p.price * rate)} Lekë</small>
        <div class="p-tools">
          <button class="icon-btn fav" data-fav="${p.id}" aria-pressed="${isFav}" aria-label="${isFav ? 'Hiqe nga të ruajturat' : 'Ruaje pronën'}">${I.heart}</button>
          <button class="icon-btn" id="share" aria-label="Shpërndaje"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg></button>
          <button class="icon-btn" id="print" aria-label="Printo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3h10v6M7 17H4V9h16v8h-3M7 14h10v7H7z"/></svg></button>
        </div></div>
    </div>
    <div class="facts">${facts}</div>
    <div class="p-sec"><h2>Përshkrimi</h2><p>${esc(p.description || 'Kontaktoni agjentin për më shumë detaje.').replace(/\n/g, '<br>')}</p></div>
    ${p.features.length ? `<div class="p-sec"><h2>Karakteristikat</h2><ul class="feats">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
    ${mapUrl ? `<div class="p-sec"><h2>Vendndodhja</h2><iframe class="map" src="${mapUrl}" loading="lazy" title="Harta e pronës"></iframe>
      <p style="margin-top:.8rem"><a class="text-link" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}" target="_blank" rel="noopener">Hape në Google Maps</a></p></div>` : ''}
    ${p.deal === 'shitje' ? `<div class="p-sec calc-wrap"><h2>Llogaritni këstin e kredisë</h2>
      <form class="calc" id="calc">
        <div class="field"><label for="c-down">Paradhënia (%)</label><input class="input" id="c-down" type="number" min="0" max="90" value="30"></div>
        <div class="field"><label for="c-rate">Interesi vjetor (%)</label><input class="input" id="c-rate" type="number" min="0" max="20" step="0.1" value="4.5"></div>
        <div class="field"><label for="c-years">Kohëzgjatja (vjet)</label><input class="input" id="c-years" type="number" min="1" max="35" value="20"></div>
        <div class="calc-out"><span class="muted" id="c-info"></span><span><b id="c-out">–</b> <span class="muted">/ muaj</span></span></div>
      </form><p class="muted" style="font-size:.85rem;margin-top:.8rem">Llogaritje orientuese. Kushtet e sakta i jep banka.</p></div>` : ''}`;

  /* kalkulatori */
  const calc = $('#calc');
  if (calc) {
    const run = () => {
      const down = Math.min(90, Math.max(0, +$('#c-down').value || 0)), r = (+$('#c-rate').value || 0) / 100 / 12, n = Math.max(1, +$('#c-years').value || 1) * 12;
      const loan = p.price * (1 - down / 100);
      const m = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
      $('#c-out').textContent = `${fmt(Math.round(m))} €`;
      $('#c-info').textContent = `Kredia: ${fmt(Math.round(loan))} € · Paradhënia: ${fmt(Math.round(p.price - loan))} €`;
    };
    calc.addEventListener('input', run); calc.addEventListener('submit', e => e.preventDefault()); run();
  }
  $('#share').addEventListener('click', async () => {
    const data = { title: p.title, text: `${p.title} – ${fmt(p.price)} €`, url: location.href };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast('Lidhja u kopjua.'); } } catch (e) { if (e.name !== 'AbortError') toast('Kopjojeni lidhjen nga shiriti i adresës.', 'err'); }
  });
  $('#print').addEventListener('click', () => print());

  /* kutia anësore */
  const a = p.agent;
  const tel = (a?.phone || (await meta()).site.phone).replace(/[^\d+]/g, '');
  const waText = `Përshëndetje, jam i interesuar për pronën ${p.code} – ${p.title} (${location.href})`;
  const waHref = a?.phone ? `https://wa.me/${tel.replace('+', '')}?text=${encodeURIComponent(waText)}` : waLink(waText);
  const today = new Date().toISOString().slice(0, 10);
  $('#side').innerHTML = `<div class="box">
    ${a ? `<div class="ag"><span class="mono">${a.photo ? `<img src="${esc(a.photo)}" alt="">` : esc(a.name.split(' ').map(x => x[0]).join('').slice(0, 2))}</span><div><b>${esc(a.name)}</b><span>${esc(a.role)}</span></div></div>` : '<h3 style="font-size:1.6rem;margin-bottom:1rem">Pyetni për këtë pronë</h3>'}
    <div class="side-btns"><a class="btn wa-btn sm" href="${waHref}" target="_blank" rel="noopener">${I.wa}WhatsApp</a><a class="btn outline sm" href="tel:${tel}">${I.phone}Telefono</a></div>
    <form id="inq" novalidate>
      <div class="kind" role="radiogroup" aria-label="Lloji i kërkesës">
        <label><input type="radio" name="kind" value="property" checked><span>Më shumë info</span></label>
        <label><input type="radio" name="kind" value="visit"><span>Cakto vizitë</span></label>
      </div>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="field"><label for="i-name">Emri</label><input class="input" id="i-name" name="name" autocomplete="name"></div>
      <div class="field"><label for="i-phone">Telefoni</label><input class="input" id="i-phone" name="phone" type="tel" autocomplete="tel"></div>
      <div class="field"><label for="i-email">Email (opsionale)</label><input class="input" id="i-email" name="email" type="email" autocomplete="email"></div>
      <div class="field" id="visit-date" hidden><label for="i-date">Data e preferuar</label><input class="input" id="i-date" name="date" type="date" min="${today}"></div>
      <div class="field"><label for="i-msg">Mesazhi</label><textarea class="textarea" id="i-msg" name="note" style="min-height:96px">Përshëndetje, jam i interesuar për ${esc(p.code)}. A është ende në dispozicion?</textarea></div>
      <button class="btn block" type="submit">Dërgo kërkesën</button>
      <p class="form-msg" role="status"></p>
    </form></div>`;
  const inq = $('#inq');
  inq.addEventListener('change', e => { if (e.target.name === 'kind') $('#visit-date').hidden = e.target.value !== 'visit'; });
  bindInquiry(inq, () => { const f = new FormData(inq); return { property_id: p.id, message: (f.get('date') && f.get('kind') === 'visit' ? `Data e preferuar: ${f.get('date')}. ` : '') + (f.get('note') || '') }; });

  /* të ngjashme */
  try {
    let r = await api(`/api/properties?city=${encodeURIComponent(p.city)}&deal=${p.deal}&exclude=${p.id}&limit=3`);
    if (r.items.length < 3) { const more = await api(`/api/properties?type=${encodeURIComponent(p.type)}&exclude=${p.id}&limit=6`); r.items = [...r.items, ...more.items.filter(x => !r.items.some(y => y.id === x.id))].slice(0, 3); }
    if (r.items.length) $('#similar').innerHTML = `<div class="sec-head"><h2>Prona të ngjashme</h2><a class="text-link" href="/properties.html?city=${encodeURIComponent(p.city)}">Më shumë në ${esc(p.city)}</a></div><div class="grid">${r.items.map(card).join('')}</div>`;
  } catch {}
})();
