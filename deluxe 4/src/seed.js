// Mbush databazën me të dhëna shembull. Përdorim: node src/seed.js [--reset]
const { db } = require('./db');

const reset = process.argv.includes('--reset');
const count = db.prepare('SELECT COUNT(*) AS n FROM properties').get().n;
if (count > 0 && !reset) { if (require.main === module) console.log('Databaza ka të dhëna. Përdorni --reset për t’i rifilluar.'); module.exports = false; return; }

if (reset) db.exec('DELETE FROM inquiries; DELETE FROM properties; DELETE FROM agents; DELETE FROM subscribers; DELETE FROM sqlite_sequence WHERE name IN (\'properties\',\'agents\',\'inquiries\',\'subscribers\');');

const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=75`;
const IMG = {
  villa: ['1613490493576-7fde63acd811','1600596542815-ffad4c1539a9','1600585154340-be6161a56a0c','1580587771525-78b9dba3b914','1512917774080-9991f1c4c750'],
  house: ['1568605114967-8130f3a36994','1564013799919-ab600027ffc6','1605276374104-dee2a0ed3cd6'],
  interior: ['1600607687939-ce8a6c25118c','1600566753190-17f0baa2a6c3','1600210492486-724fe5c67fb0','1502672260266-1c1ef2d93688','1522708323590-d24dbb6b0267','1560448204-e02f11c3d0e2','1493809842364-78817add7ffb','1484154218962-a197022b5858'],
  building: ['1545324418-cc1a3fa10c00','1460317442991-0ec209397118'],
  office: ['1497366216548-37526070297c','1497366811353-6870744d04b2','1486406146926-c627a92ad1ab'],
  shop: ['1441986300917-64674bd600d8','1555396273-367ea4eb4db5'],
  land: ['1500382017468-9049fed747ef','1464822759023-fed622ff2c3b']
};
const pick = (arr, i, n) => Array.from({ length: n }, (_, k) => U(arr[(i + k) % arr.length]));

const agents = [
  ['Arben Hoxha', 'Partner Menaxhues', '+355 69 000 0001', 'arben@deluxe-realestate.al', 'Mbi 12 vjet në tregun e pronave luksoze në Tiranë dhe bregdet.', 8],
  ['Elira Kola', 'Agjente e Licencuar', '+355 69 000 0002', 'elira@deluxe-realestate.al', 'E specializuar në apartamente dhe qira afatgjata për familje e diasporë.', 3],
  ['Dritan Meta', 'Agjent Partner · Prona komerciale', '+355 69 000 0003', 'dritan@deluxe-realestate.al', 'Zyra, dyqane dhe hapësira biznesi në qendër të Tiranës dhe Durrësit.', 7],
  ['Sara Gjoni', 'Agjente e Lartë · Bregdeti', '+355 69 000 0004', 'sara@deluxe-realestate.al', 'Vila dhe apartamente me pamje deti nga Vlora deri në Sarandë.', 4]
];
const insA = db.prepare('INSERT INTO agents (name, role, phone, email, bio, level) VALUES (?,?,?,?,?,?)');
agents.forEach(a => insA.run(...a));

const desc = {
  Vilë: 'Vilë e projektuar me linja të pastra, dritare nga dyshemeja në tavan dhe hapësira të mëdha ndenjeje. Kuzhina është e pajisur plotësisht, dhomat e gjumit kanë banjo private dhe oborri ofron privatësi të plotë. Ideale për familje që kërkojnë qetësi pa u larguar nga qyteti.',
  Apartament: 'Apartament i ndriçuar mirë, me ndarje funksionale dhe materiale cilësore. Ndodhet në një pallat të ri me ashensor, hyrje të kontrolluar dhe afër shërbimeve kryesore: shkolla, supermarkete dhe transport publik.',
  Zyrë: 'Hapësirë zyre e konfiguruar në plan të hapur, me sallë mbledhjesh, kondicionim qendror dhe internet me fibër optike. E përshtatshme për kompani që duan prezencë në zonë prestigjioze.',
  Dyqan: 'Njësi tregtare me vitrinë të gjerë në rrugë me qarkullim të lartë këmbësorësh. Lartësi e mirë tavani, banjo dhe magazinë e vogël në pjesën e pasme.',
  Tokë: 'Truall me dokumentacion të rregullt, me qasje direkte nga rruga dhe leje për ndërtim rezidencial. Pozicion i mirë me pamje të hapur.'
};
const feats = {
  Vilë: ['Pishinë','Kopsht','Garazh për 2 makina','Ngrohje qendrore','Sistem sigurie','Tarracë'],
  Apartament: ['Ashensor','Ballkon','Kondicioner','Dyer të blinduara','Kuzhinë e pajisur','Pamje e hapur'],
  Zyrë: ['Recepsion','Sallë mbledhjesh','Kondicionim qendror','Fibër optike','Parkim nëntokë'],
  Dyqan: ['Vitrinë','Magazinë','Banjo','Sinjalistikë e lejuar'],
  Tokë: ['Leje ndërtimi','Qasje nga rruga','Ujë dhe energji pranë']
};

const P = [
  ['Vilë moderne me pishinë në Long Hill','shitje','Vilë','Tiranë','Long Hill','Rruga e Liqenit të Thatë',1200000,396,5,4,'3 kate',2021,1,2,41.3045,19.8301,1,1,'villa',0],
  ['Apartament 3+1 me pamje nga deti','shitje','Apartament','Vlorë','Lungomare','Rruga Murat Terbaçi',390000,152,3,2,'7',2022,1,1,40.4580,19.4870,1,4,'interior',0],
  ['Apartament 2+1 i mobiluar në Bllok','qira','Apartament','Tiranë','Blloku','Rruga Pjetër Bogdani',950,85,2,1,'4',2018,1,0,41.3189,19.8170,1,2,'interior',2],
  ['Zyra premium pranë Stadiumit','qira','Zyrë','Tiranë','Stadiumi Air Albania','Bulevardi Dëshmorët e Kombit',6500,420,8,3,'9',2020,1,10,41.3186,19.8237,1,3,'office',0],
  ['Dyqan me vitrinë në bulevard','shitje','Dyqan','Tiranë','Astiri','Bulevardi i Kasharit',520000,135,1,1,'0',2019,0,0,41.3346,19.7778,0,3,'shop',0],
  ['Apartament 1+1 pranë plazhit','qira','Apartament','Durrës','Plazh','Rruga Taulantia',420,60,1,1,'5',2017,1,0,41.3058,19.4689,1,2,'interior',4],
  ['Vilë me oborr dhe pamje liqeni','shitje','Vilë','Shkodër','Shiroka','Rruga Shkodër–Zogaj',340000,260,4,3,'2 kate',2016,1,2,42.0629,19.4519,0,1,'villa',2],
  ['Apartament 2+1 me tarracë','shitje','Apartament','Tiranë','Komuna e Parisit','Rruga Medar Shtylla',225000,98,2,2,'6',2021,0,1,41.3156,19.7969,0,2,'interior',5],
  ['Garsoniere në rezidencë me pishinë','shitje','Apartament','Durrës','Mali i Robit','Rruga Durrës–Kavajë',58000,41,1,1,'2',2023,1,0,41.2367,19.4767,0,4,'building',0],
  ['Apartament 2+1 me pamje nga Joni','shitje','Apartament','Sarandë','Qendër','Rruga Jonianët',178000,88,2,1,'5',2020,1,0,39.8750,20.0050,1,4,'interior',6],
  ['Tokë për ndërtim pranë detit','shitje','Tokë','Vlorë','Radhimë','Rruga Vlorë–Orikum',240000,1200,0,0,'',null,0,0,40.3994,19.4729,0,4,'land',0],
  ['Apartament 3+1 pranë liqenit','qira','Apartament','Pogradec','Bregu i liqenit','Rruga Rinia',600,110,3,2,'3',2015,1,1,40.9025,20.6525,0,2,'interior',7],
  ['Zyrë në qendër të Durrësit','qira','Zyrë','Durrës','Qendër','Rruga Egnatia',750,70,2,1,'1',2014,0,0,41.3134,19.4458,0,3,'office',1],
  ['Shtëpi familjare 4+1 me kopsht','shitje','Vilë','Tiranë','Lundër','Rruga e Lundrës',410000,240,4,3,'2 kate',2012,0,2,41.2905,19.8678,0,1,'house',0],
  ['Penthouse me tarracë 120 m²','qira','Apartament','Tiranë','Tirana e Re','Rruga Sami Frashëri',2400,180,3,3,'12',2023,1,2,41.3149,19.8128,1,2,'interior',1],
  ['Dyqan me qira në pedonale','qira','Dyqan','Shkodër','Pedonalja','Rruga Kolë Idromeno',1100,55,1,1,'0',2010,0,0,42.0683,19.5126,0,3,'shop',1]
];
const insP = db.prepare(`INSERT INTO properties (code,title,description,deal,type,city,zone,address,price,area,rooms,bathrooms,floor,year_built,furnished,parking,lat,lng,featured,agent_id,features,images,views)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
P.forEach((p, i) => {
  const [title, deal, type, city, zone, address, price, area, rooms, baths, floor, year, furnished, parking, lat, lng, featured, agent, imgSet, offset] = p;
  const cover = IMG[imgSet];
  const imgs = [...pick(cover, offset, 1), ...pick(IMG.interior, i, 3)];
  if (imgSet === 'interior') imgs.splice(0, 1, U(IMG[type === 'Apartament' ? 'building' : 'interior'][i % 2]), U(IMG.interior[(i + 5) % 8]));
  insP.run(`DLX-${1001 + i}`, title, desc[type], deal, type, city, zone, address, price, area, rooms, baths, floor, year, furnished, parking, lat, lng, featured, agent,
    JSON.stringify(feats[type].slice(0, 4 + (i % 3))), JSON.stringify(imgs.slice(0, 4)), 20 + ((i * 37) % 180));
});

const insI = db.prepare('INSERT INTO inquiries (kind,name,phone,email,message,property_id,status) VALUES (?,?,?,?,?,?,?)');
insI.run('property','Klodian Shehu','+355 68 111 2233','klodian@example.com','A është ende në dispozicion? Do të doja ta shihja këtë javë.',2,'new');
insI.run('valuation','Mirela Dervishi','+355 69 555 4411','','Kam një apartament 2+1 në Ali Dem dhe dua ta shes.',null,'contacted');
insI.run('visit','Erion Basha','+39 333 000 1122','erion@example.com','Jam në Itali, mund të bëjmë vizitë me video?',1,'new');
// Kërkesat shembull kalojnë edhe te CRM (leads + opportunitete)
const { fromInquiry } = require('./crm');
db.prepare('SELECT id FROM inquiries ORDER BY id').all().forEach(r => fromInquiry(r.id));

console.log(`U shtuan ${agents.length} agjentë dhe ${P.length} prona shembull.`);
module.exports = true;
