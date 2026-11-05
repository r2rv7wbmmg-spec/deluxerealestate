// Lagjet/zonat sipas qytetit – shfaqen si zgjedhje në kërkim, filtra dhe në panel.
// Shtoni ose hiqni emra këtu; lista renditet vetë sipas alfabetit.
const ZONES = {
  'Tiranë': [
    '21 Dhjetori', '5 Maji', 'Ali Demi', 'Allias', 'Astiri', 'Babrru', 'Blloku', 'Bregu i Lumit', 'Brryli',
    'Bulevardi i Ri', 'Dajti', 'Don Bosko', 'Farkë', 'Fresku', 'Garda', 'Ish-Ekspozita', 'Ish-Fusha e Aviacionit',
    'Kamëz', 'Kashar', 'Kinostudio', 'Kodra e Diellit', 'Kodra e Priftit', 'Kombinati', 'Komuna e Parisit',
    'Kopshti Botanik', 'Kopshti Zoologjik', 'Laprakë', 'Linzë', 'Liqeni Artificial', 'Liqeni i Thatë', 'Long Hill',
    'Lundër', 'Medreseja', 'Myslym Shyri', 'Paskuqan', 'Pazari i Ri', 'Petrelë', 'Porcelani', 'Qendër',
    'Rruga e Barrikadave', 'Rruga e Bogdaneve', 'Rruga e Dibrës', 'Rruga e Durrësit', 'Rruga e Elbasanit',
    'Rruga e Kavajës', 'Sauk', 'Selitë', 'Selvia', 'Shallvare', 'Shkozë', 'Stacioni i Trenit',
    'Stadiumi Air Albania', 'Tirana e Re', 'Tregu Elektrik', 'Unaza e Re', 'Vasil Shanto', 'Vilat Gjermane',
    'Xhamllik', 'Yzberisht', 'Zogu i Zi'
  ]
};
for (const k of Object.keys(ZONES)) ZONES[k] = [...new Set(ZONES[k])].sort((a, b) => a.localeCompare(b, 'sq'));
module.exports = { ZONES };
