// Zëri i agjentit virtual të De Luxe: përshëndetjet, përgjigjet dhe tonin e bisedës.
// Ndryshoni tekstet këtu – përdoren nga serveri (src/chat.js).
(function (root) {
  const pick = list => list[Math.floor(Math.random() * list.length)];

  function persona(site) {
    function greet(date = new Date()) {
      let h;
      try { h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/Tirane' }).format(date)); }
      catch { h = date.getHours(); }
      return h < 11 ? 'Mirëmëngjes' : h < 18 ? 'Mirëdita' : 'Mirëmbrëma';
    }

    // Biseda e lirë: përshëndetje, faleminderit, mirupafshim, “kush je”, “si je”
    const SMALL = [
      { re: /^(pershendetje|tung|tungjatjeta|hello|hi|hey|ckemi|c'kemi|mirdita|miredita|mirmengjes|miremengjes|mirembrema|mirmbrema|ciao)\b/, max: 4,
        a: () => `${greet()}! 👋 Jam agjenti virtual i De Luxe Real Estate. Jam këtu t’ju ndihmoj të gjeni pronën e duhur – për ta blerë, për ta marrë me qira apo për të shitur tuajën. Çfarë po kërkoni sot?` },
      { re: /(faleminderit|flm|rrofsh|rrofshi|thank|merci|grazie)/,
        a: () => pick(['Ju faleminderit juve! 😊 Nëse ju lind ndonjë pyetje tjetër, jam këtu.', 'S’ka përse! 😊 Jam këtu kurdo që t’ju duhet. Nëse doni, ju lidh edhe me një nga agjentët tanë.', 'Me kënaqësi! 🙌 Shpresoj t’ju ndihmova – jam këtu për çdo pyetje tjetër.']) },
      { re: /(mirupafshim|mirupafshi|bye|naten e mire|ditë te mbare|dite te mbare|shihemi)/,
        a: () => pick(['Kënaqësi që folëm! Ju uroj një ditë të bukur dhe shpresoj t’ju shohim së shpejti te De Luxe. 🏡', 'Mirupafshim dhe suksese! Kur të jeni gati, ne jemi këtu. ✨']) },
      { re: /(kush je|cfare je|je robot|je njeri|je bot|me kë po flas|me ke po flas)/,
        a: () => 'Jam agjenti virtual i De Luxe Real Estate 🤖 – ju ndihmoj në çdo orë me kërkimin e pronave, çmimet, vizitat dhe dokumentet. Për diçka më të detajuar, ju lidh menjëherë me një nga agjentët tanë.' },
      { re: /^(si je|si jeni|si kalove|si kaloni|ca ben|cfare ben)\b/,
        a: () => 'Shumë mirë, faleminderit që pyetët! 😊 Si mund t’ju ndihmoj sot – po kërkoni të blini, të merrni me qira apo të shisni?' }
    ];

    const FAQ = [
      { k: ['orar', 'hapur', 'ore', 'kur punoni'], a: () => `Jemi në zyrë ${site.hours} 🕘. Në WhatsApp ju përgjigjemi edhe jashtë orarit, kështu që mos ngurroni të na shkruani!` },
      { k: ['adres', 'ku ndodhe', 'zyra juaj', 'ku jeni'], a: () => `Zyra jonë ndodhet në ${site.address} 📍. Na telefononi para se të vini, që t’ju presë agjenti i duhur me një kafe. ☕` },
      { k: ['telefon', 'numer', 'kontakt', 'whatsapp', 'email'], a: () => `Mund të na gjeni në ${site.phone} (edhe në WhatsApp 💬) ose në ${site.email}. Ju përgjigjemi shpejt!` },
      { k: ['shes', 'shit', 'vleres', 'vlera e pron', 'jap me qira', 'pronen time'], a: () => 'Shumë mirë që menduat për ne! 🙌 Vlerësimi i pronës suaj është falas dhe pa asnjë detyrim. Plotësoni “Vlerëso pronën” në faqen kryesore, ose më shkruani në WhatsApp vendndodhjen dhe sipërfaqen – një agjent ju kontakton brenda ditës.' },
      { k: ['komision', 'tarif', 'sa merrni', 'pagese per agjenc'], a: () => 'Pyetje e mirë! Komisioni varet nga lloji i pronës dhe i marrëveshjes. Agjenti jua tregon qartë që në fillim – pa kosto të fshehura. 🤝' },
      { k: ['dokument', 'noter', 'hipotek', 'certifikat', 'kartel'], a: () => 'Mos u shqetësoni për letrat – kujdesemi ne! 📄 Për blerje ju duhet dokumenti i identitetit dhe, nëse merrni kredi, miratimi i bankës. Ne kontrollojmë certifikatën e pronësisë dhe ju shoqërojmë deri te noteri.' },
      { k: ['kredi', 'bank', 'kest'], a: () => 'Po, shumica e pronave në shitje mund të blihen me kredi bankare 🏦. Te faqja e çdo prone gjeni edhe kalkulatorin e këstit mujor – provojeni, mund t’ju befasojë këndshëm!' },
      { k: ['vizit', 'te shoh', 'ta shoh', 'takim'], a: () => 'Me kënaqësi! 🗓️ Vizitat i caktojmë sipas kohës suaj, edhe në fundjavë. Hapni pronën që ju intereson dhe shtypni “Cakto vizitë”, ose më shkruani në WhatsApp dhe e rregullojmë menjëherë.' },
      { k: ['diaspor', 'jashte shtetit', 'nga italia', 'nga gjermania', 'video'], a: () => 'Punojmë shpesh me klientë nga diaspora 🌍 – bëjmë vizita me video, dërgojmë dokumentet online dhe ju përfaqësojmë me prokurë kur nevojitet. Nuk ka nevojë të vini në Shqipëri për të blerë.' }
    ];

    return {
      greet,
      empty: () => 'Më shkruani çfarë po kërkoni 😊 – p.sh. “apartament 2+1 me qira në Tiranë deri 800 €” ose “vilë në shitje në Vlorë”.',
      small: t => { const s = SMALL.find(x => x.re.test(t) && (!x.max || t.split(/\s+/).length <= x.max)); return s ? s.a() : null; },
      faq: t => FAQ.find(f => f.k.some(k => t.includes(k))),
      found: (total, desc) => `${pick(['Lajm i mirë! 🎉', 'Shumë mirë! ✨', 'Ja ku jemi! 🏡'])} Kam gjetur ${total} ${total === 1 ? 'pronë' : 'prona'} – ${desc}.${total > 3 ? ' Ja tri që mendoj se do t’ju pëlqejnë:' : total === 1 ? ' Ja ku është:' : ' Ja ku janë:'}`,
      after: total => total > 3 ? 'Ju pëlqen ndonjëra? Mund t’i shihni të gjitha, ose t’ju caktoj një vizitë. 😊' : 'Ju pëlqen? Mund t’ju caktoj një vizitë ose t’ju lidh me agjentin përkatës. 😊',
      none: desc => `${pick(['Për momentin', 'Sot për sot'])} nuk kemi ${desc} 😔 – por prona të reja na vijnë çdo javë! Më lini një mesazh në WhatsApp dhe agjentët tanë ju njoftojnë të parët sapo të dalë diçka e tillë.`,
      fallback: () => pick([
        'Hmm, nuk jam i sigurt që e kuptova plotësisht 🤔. Mund të më shkruani p.sh. “apartament 2+1 me qira në Bllok” ose “vilë në shitje deri 500.000 €”. Ose, nëse preferoni, ju lidh direkt me një agjent në WhatsApp.',
        'Më falni, këtë nuk e kapa mirë 🙈. Provoni të më thoni llojin e pronës, zonën dhe buxhetin – ose shkruajini direkt një agjenti në WhatsApp, që ju përgjigjet menjëherë.'
      ]),
      QUICK: ['Apartament me qira në Tiranë', 'Vila në shitje', 'Dua të shes pronën time', 'Orari dhe adresa', 'Blerje me kredi']
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = persona;
  else root.DLPersona = persona;
})(typeof window !== 'undefined' ? window : globalThis);
