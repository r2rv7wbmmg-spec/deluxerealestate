/* Faqja kryesore */
(async () => {
  const { $, esc, fmt, api, meta, card, skeletons, imgTag, bindInquiry, I, waLink } = DL;
  const TYPE_PLURAL = { Apartament: 'Apartamente', 'Vilë': 'Vila dhe shtëpi', 'Zyrë': 'Zyra', Dyqan: 'Dyqane', 'Tokë': 'Toka' };
  const BUDGET = { shitje: [100000, 150000, 250000, 400000, 750000, 1500000], qira: [400, 600, 900, 1500, 3000, 7000] };

  $('#featured').innerHTML = skeletons(6);

  const fillBudget = deal => { $('#s-max').innerHTML = '<option value="">Pa kufi</option>' + BUDGET[deal].map(v => `<option value="${v}">deri në ${fmt(v)} €${deal === 'qira' ? ' / muaj' : ''}</option>`).join(''); };
  fillBudget('shitje');
  document.querySelectorAll('input[name=deal]').forEach(r => r.addEventListener('change', () => fillBudget(r.value)));
  $('#search').addEventListener('submit', e => {
    e.preventDefault();
    const params = new URLSearchParams([...new FormData(e.target)].filter(([, v]) => v !== ''));
    location.href = '/properties.html?' + params.toString();
  });

  try {
    const [m, featured, all, agents] = await Promise.all([
      meta(), api('/api/properties?featured=1&limit=6'), api('/api/properties?limit=48'), api('/api/agents')
    ]);

    // Statistikat (nga databaza)
    $('#stats').innerHTML = `<div><b>${m.totals.active || 0}</b><span>prona aktive</span></div><div><b>${m.totals.sale || 0}</b><span>në shitje</span></div><div><b>${m.totals.rent || 0}</b><span>me qira</span></div><div><b>${m.cities.length}</b><span>qytete</span></div>`;

    // Zgjedhjet e kërkimit
    const cityOpts = m.cities.map(c => `<option>${esc(c.city)}</option>`).join('');
    const extraCities = Object.keys(m.zones || {}).filter(c => !m.cities.some(x => x.city === c));
    $('#s-city').innerHTML += cityOpts + extraCities.map(c => `<option>${esc(c)}</option>`).join('');
    const qIn = $('#s-q'), zIn = $('#s-zone'), basePh = qIn.placeholder;
    const clearZone = () => { if (zIn.value) { zIn.value = ''; qIn.placeholder = basePh; } };
    DL.zoneAutocomplete(qIn, m.zones || {}, m.cities.map(c => c.city), x => {
      $('#s-city').value = x.city; zIn.value = x.zone; qIn.value = '';
      qIn.placeholder = x.zone ? `Zona: ${x.zone} ✓` : `Qyteti: ${x.city} ✓`;
    });
    qIn.addEventListener('input', () => { if (qIn.value) clearZone(); });
    $('#s-city').addEventListener('change', clearZone);
    $('#v-city').innerHTML = cityOpts + '<option>Tjetër</option>';
    const typeOpts = m.allTypes.map(t => `<option value="${esc(t)}">${esc(TYPE_PLURAL[t] || t)}</option>`).join('');
    $('#s-type').innerHTML += typeOpts;
    $('#v-type').innerHTML = m.allTypes.map(t => `<option>${esc(t)}</option>`).join('');

    // Fotoja dhe tekstet e hyrjes: nga paneli (Faqja), përndryshe nga pronat e përzgjedhura
    const S = m.settings || {};
    if (S.hero_title) $('#hero-title').innerHTML = esc(S.hero_title).replace(/\*([^*]+)\*/g, '<span>$1</span>');
    if (S.hero_text) $('#hero-text').textContent = S.hero_text;
    const linked = S.hero_property || null;
    const auto = all.items.find(p => p.featured && p.images.length) || all.items.find(p => p.images.length) || null;
    const heroProp = linked || (S.hero_image ? null : auto);
    const heroImg = S.hero_image || heroProp?.images?.[0];
    const cap = heroProp ? `<a class="hero-cap" href="/property.html?id=${heroProp.id}"><small>${esc([heroProp.zone, heroProp.city].filter(Boolean).join(', '))}</small><b>${esc(heroProp.title)}</b><span>${fmt(heroProp.price)} €${heroProp.deal === 'qira' ? ' / muaj' : ''}</span></a>` : '';
    $('#hero-photo').innerHTML = heroImg
      ? `${imgTag(heroImg, heroProp?.title || 'De Luxe Real Estate')}${cap}`
      : `<div class="hero-logo"><img src="/img/logo-full.png" alt="De Luxe Real Estate – Live Beyond Ordinary."></div>`;

    $('#featured').innerHTML = featured.items.length ? featured.items.map(card).join('') : '<div class="empty"><h3>Së shpejti</h3>Pronat e përzgjedhura do të shfaqen këtu.</div>';

    const tCount = Object.fromEntries(m.types.map(t => [t.type, t.count]));
    $('#types').innerHTML = m.allTypes.map(t => `<li><a href="/properties.html?type=${encodeURIComponent(t)}"><b>${esc(TYPE_PLURAL[t] || t)}</b><span>${tCount[t] || 0} në ofertë</span><i aria-hidden="true">›</i></a></li>`).join('');

    const firstImg = {};
    all.items.forEach(p => { if (!firstImg[p.city] && p.images[0]) firstImg[p.city] = p.images[0]; });
    $('#cities').innerHTML = m.cities.map(c => `<a class="city" href="/properties.html?city=${encodeURIComponent(c.city)}">${imgTag(firstImg[c.city], c.city)}<div><b>${esc(c.city)}</b><span>${c.count} ${c.count === 1 ? 'pronë' : 'prona'}</span></div></a>`).join('');

    $('#agents').innerHTML = agents.map(a => {
      const ini = a.name.split(' ').map(x => x[0]).join('').slice(0, 2);
      const tel = (a.phone || '').replace(/[^\d+]/g, '');
      return `<div class="agent"><div class="mono">${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}">` : esc(ini)}</div>
        <b>${esc(a.name)}</b><span class="role">${esc(a.role)}</span><p>${esc(a.bio || '')}</p>
        <span class="muted" style="font-size:.85rem;margin-bottom:1rem">${a.listings} prona aktive</span>
        <div class="acts">
          ${tel ? `<a class="icon-btn" href="tel:${tel}" aria-label="Telefono ${esc(a.name)}">${I.phone}</a><a class="icon-btn wa" href="https://wa.me/${tel.replace('+', '')}?text=${encodeURIComponent('Përshëndetje ' + a.name.split(' ')[0] + ', ju shkruaj nga faqja De Luxe.')}" target="_blank" rel="noopener" aria-label="WhatsApp me ${esc(a.name)}">${I.wa}</a>` : ''}
          ${a.email ? `<a class="icon-btn" href="mailto:${esc(a.email)}" aria-label="Email për ${esc(a.name)}">${I.mail}</a>` : ''}
        </div></div>`;
    }).join('');
  } catch (e) {
    DL.toast(e.message, 'err');
    $('#featured').innerHTML = `<div class="empty"><h3>Pronat nuk u ngarkuan</h3>${esc(e.message)}<p><button class="btn outline sm" onclick="location.reload()">Provo sërish</button></p></div>`;
  }

  const vf = $('#val-form');
  bindInquiry(vf, () => {
    const f = new FormData(vf);
    return { message: `${f.get('goal')} – ${f.get('ptype')} në ${f.get('city')}${f.get('area') ? ', ' + f.get('area') + ' m²' : ''}. ${f.get('note') || ''}`.trim() };
  });
})();
