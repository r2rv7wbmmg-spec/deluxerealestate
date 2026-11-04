# De Luxe Real Estate

Faqe interneti për agjenci imobiliare: faqja publike, kërkim me filtra, faqe për çdo pronë, asistent për pyetje të shpejta, buton anësor WhatsApp dhe panel administrimi me databazë.

**Pa asnjë varësi të jashtme**: vetëm Node.js (server HTTP + SQLite i integruar). Nuk ka `npm install`.

## Nisja

Kërkohet **Node.js 22.13 ose më i ri** (`node -v`).

```bash
npm start            # ose: node src/server.js
```

- Faqja: http://localhost:3000
- Paneli: http://localhost:3000/admin/ – hyrja e parë: `admin` / `admin123` (ndryshojeni menjëherë te *Llogaria*)

Në nisjen e parë databaza (`data/deluxe.db`) krijohet vetë dhe mbushet me 16 prona dhe 4 agjentë shembull.
Për t'i fshirë shembujt dhe rifilluar: `npm run seed`. Për të filluar bosh, fshini pronat nga paneli.

## Të dhënat e biznesit

Ndryshoni telefonin, numrin e WhatsApp, email-in, adresën dhe orarin te `src/config.js` ose me variabla mjedisi (shih `.env.example`).
Numri i WhatsApp shkruhet vetëm me shifra, me prefiksin e shtetit: `355691234567`.

Përgjigjet e asistentit (orari, komisioni, dokumentet, kredia etj.) i ndryshoni te lista `FAQ` në `src/chat.js`.

## Çfarë bën

**Faqja publike**
- Kërkim sipas shitje/qira, qytetit, llojit, buxhetit dhe dhomave
- Lista me filtra, renditje, faqosje, pamje rrjetë/listë dhe lidhje që ruajnë filtrat
- Faqja e pronës: galeri me shikues (shigjeta, tastierë, rrëshqitje në telefon), karakteristikat, harta, kalkulatori i kredisë, formular për info ose vizitë, WhatsApp me kodin e pronës, shpërndarje, printim, prona të ngjashme
- Pronat e ruajtura (zemra) dhe dërgimi i tyre në WhatsApp
- Vlerësim falas i pronës, regjistrim në email, faqe 404
- Butoni anësor WhatsApp (në telefon bëhet buton i rrumbullakët poshtë majtas)
- Asistenti “Pyetje të shpejta”: kupton qytetin, llojin, buxhetin dhe “2+1”, kërkon direkt në databazë dhe përgjigjet për orarin, adresën, dokumentet, kredinë, vizitat dhe diasporën

**Agjentët me hyrje të veçantë**
- Te *Agjentët → Shto agjent* plotësoni edhe **Përdoruesi** dhe **Fjalëkalimi** (butoni *Krijo* jep një fjalëkalim të sigurt). Pas ruajtjes, paneli ju jep tekstin me të dhënat e hyrjes, gati për ta dërguar te agjenti me WhatsApp.
- Agjenti hyn te `/admin/` dhe sheh vetëm: *Paneli*, *Pronat e mia*, *Kërkesat* (vetëm për pronat e veta) dhe *Llogaria*.
- Çdo pronë që agjenti shton ose ndryshon shkon te **Miratime** dhe del në faqe vetëm pasi ta miratojë administratori. Nëse e refuzoni, shkruani arsyen dhe agjenti e sheh te pronat e tij.
- Agjenti mund ta shënojë vetë pronën *E shitur*, *E dhënë me qira* ose *E fshehur* pa miratim; pronat e miratuara nuk i fshin dot.
- Për ta bllokuar një agjent, hiqni *Hyrja aktive* – nxirret menjëherë nga paneli.
- **Niveli** (1 Praktikant … 7 Agjent Partner … 10 Themelues & CEO) përcakton renditjen te “Agjentët tanë”: niveli më i lartë del i pari. Titulli që shfaqet plotësohet vetë nga niveli dhe mund ta ndryshoni lirisht.

**CRM: leads dhe opportunitete**
- **Leads (portofoli):** çdo kërkesë nga faqja shtohet vetë si lead te agjenti i pronës; kërkesat pa pronë (kontakt, vlerësim) shkojnë te administratori si “Pa agjent”. Numri i njëjtë telefoni nuk dyfishohet – kërkesat e reja shtohen te i njëjti klient. Agjenti shton vetë klientët nga telefoni, Instagrami, zyra ose rekomandimet.
- Çdo lead ka llojin (blerës, qiramarrës, shitës, qiradhënës, investitor), burimin, buxhetin, çfarë kërkon, shënime dhe **historikun** e çdo telefonate, mesazhi, vizite e takimi. Butonat Telefono/WhatsApp e shënojnë vetë kontaktin në historik.
- **Opportunitete:** marrëveshjet në faza *E re → Kontaktuar → Vizitë → Ofertë → Negocim → Fituar / Humbur*, me pronën, vlerën, komisionin, hapin e radhës dhe datën. Kartat lëvizen duke i tërhequr ose me shigjetat ‹ ›; kur humbet, shënohet arsyeja.
- **Për sot:** paneli tregon kë duhet të kontaktoni sot dhe kush ka mbetur me vonesë.
- **Raporti** (administratori): leads, opportunitete të hapura, fitore dhe komision për çdo agjent – këtë muaj dhe gjithsej – dhe nga cili burim vijnë klientët.
- Agjenti sheh vetëm portofolin e vet; administratori sheh gjithçka dhe ia cakton lead-in një agjenti (opportunitetet e hapura kalojnë bashkë me të).

**Paneli**
- Statistika, kërkesat e fundit, pronat më të shikuara
- Pronat: shto, ndrysho, fshi, ndrysho statusin (aktive / e shitur / me qira / e fshehur), shëno si të përzgjedhur, ngarko foto (tërhiq e lësho), rendit fotot dhe zgjidh foton kryesore
- Kërkesat: filtro sipas statusit, telefono ose shkruaj në WhatsApp me një klik, ndrysho statusin, fshi
- Agjentët me foto, abonentët me shkarkim CSV, ndryshimi i fjalëkalimit

## Struktura

```
src/
  server.js   serveri, API dhe skedarët statikë
  db.js       tabelat SQLite dhe fjalëkalimet (scrypt)
  chat.js     logjika e asistentit
  crm.js      leads, opportunitete, historiku dhe raporti
  seed.js     të dhënat shembull
  config.js   të dhënat e biznesit
public/
  index.html, properties.html, property.html, favorites.html, 404.html
  css/  style.css (i përbashkët), home.css, list.css, property.css
  js/   common.js (koka, fundi, karta, WhatsApp, asistenti), home.js, properties.js, property.js, favorites.js
  admin/ index.html, admin.css, admin.js
data/     databaza (krijohet vetë)
uploads/  fotot e ngarkuara nga paneli
```

## API

| Metoda | Adresa | Përshkrimi |
|---|---|---|
| GET | `/api/meta` | të dhënat e biznesit, qytetet, llojet, numrat |
| GET | `/api/properties` | `deal, city, type, min, max, rooms, minArea, furnished, parking, q, sort, page, limit, featured, ids, exclude` |
| GET | `/api/properties/:id` | një pronë me agjentin |
| GET | `/api/agents` | agjentët |
| POST | `/api/inquiries` | `{kind, name, phone, email, message, property_id}` |
| POST | `/api/subscribe` | `{email}` |
| POST | `/api/chat` | `{message}` → `{reply, properties, link}` |
| * | `/api/admin/...` | kërkon hyrje: `login, logout, me, password, stats, properties, upload, inquiries, agents, subscribers, leads, leads/:id/activities, opportunities, crm`. Agjentët shohin vetëm të dhënat e veta; `agents`, `subscribers` dhe miratimet janë vetëm për administratorin |

## Publikimi në internet

Funksionon në çdo VPS ose hostim që mbështet Node.js 22.13+ (Hetzner, DigitalOcean, Render, Railway…):

1. Ngarkoni dosjen dhe vendosni variablat nga `.env.example` (sidomos `ADMIN_PASSWORD` dhe `NODE_ENV=production`).
2. Nisni me `node src/server.js` (me `pm2` ose `systemd` që të rinisë vetë).
3. Vendosni Nginx/Caddy përpara me HTTPS. Me `NODE_ENV=production` cookie e hyrjes dërgohet vetëm me HTTPS.
4. Ruani kopje rezervë të `data/` dhe `uploads/`. Në hostim pa disk të përhershëm (p.sh. Render falas) vendosni `DATA_DIR` dhe `UPLOAD_DIR` në një disk të montuar.

## Siguria

Fjalëkalime me scrypt, sesione me cookie HttpOnly, kufizim kërkesash për formularët, hyrjen dhe asistentin, fushë kurth kundër spam-it, mbrojtje nga `../` te skedarët dhe kontroll i llojit dhe madhësisë së fotove.
