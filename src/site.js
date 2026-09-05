// Site-wide settings. Edit the "cry" banner here to show an announcement on the hero.
import stVlad from './images/st-vlad.jpg';

// Which hero photo belongs to which season — the one knob worth turning here.
// All four are still the one photo we have; swap an import as each real shot lands.
// They must be imports, not strings: that is how Astro optimizes and fingerprints them.
const seasonHero = { winter: stVlad, spring: stVlad, summer: stVlad, fall: stVlad };

// Dec-Feb winter, Mar-May spring, and so on round the year.
const season = ['winter', 'spring', 'summer', 'fall'][((new Date().getMonth() + 1) % 12 / 3) | 0];

export default {
  title: {
    en: 'St. Vladimir Memorial Church',
    ru: 'Свято-Владимирский Храм-Памятник',
  },
  brand: { en: 'St. Vladimir', ru: 'Св. Владимир' },
  description: {
    en: 'Russian orthodox memorial church in Jackson, NJ',
    ru: 'Русский православный храм-памятник в г. Джексон, Нью-Джерси',
  },
  keywords: {
    en: 'russian orthodox church nj',
    ru: 'русская православная церковь',
  },
  cryHeader: { en: 'Attention', ru: 'Внимание' },
  // Set to { en: '...', ru: '...' } to show a banner on the hero image; null hides it.
  cry: null,

  // Picked at BUILD time — the site is static, so the season only turns when the
  // deploy workflow reruns (it has a monthly cron).
  hero: seasonHero[season],

  email: 'info@stvladnj.org',
  phone: '+1 732 928 1248',
  facebook: 'https://facebook.com/stvladimirsnj',
  instagram: 'https://www.instagram.com/stvladimirsnj',
  telegram: 'https://t.me/stvladnj',
};
