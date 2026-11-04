// Të dhënat e biznesit – ndryshojini këtu ose me variabla mjedisi (.env)
module.exports = {
  port: Number(process.env.PORT) || 3000,
  site: {
    name: 'De Luxe Real Estate',
    phone: process.env.SITE_PHONE || '+355 69 000 0000',
    whatsapp: process.env.SITE_WHATSAPP || '355690000000', // vetëm shifra, me prefiksin e shtetit
    email: process.env.SITE_EMAIL || 'info@deluxe-realestate.al',
    address: process.env.SITE_ADDRESS || 'Rruga Ismail Qemali, Tiranë',
    hours: process.env.SITE_HOURS || 'E hënë – E shtunë, 09:00 – 19:00',
    instagram: 'https://www.instagram.com/de_luxe_real_estate',
    facebook: process.env.SITE_FACEBOOK || '',
    eurToLek: Number(process.env.EUR_TO_LEK) || 95
  }
};
