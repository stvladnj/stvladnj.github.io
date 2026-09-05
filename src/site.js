// Site-wide settings. Edit the "cry" banner here to show an announcement on the hero.

// The hero photo, one per season. All four still point at the one photo we have;
// swap a path as each real shot lands. They must be imports, not strings — that is
// how Astro finds, optimizes and fingerprints them.
import spring from './images/st-vlad.jpg';
import summer from './images/st-vlad.jpg';
import fall   from './images/st-vlad.jpg';
import winter from './images/st-vlad.jpg';

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
  // deploy workflow reruns (it has a monthly cron). Dec-Feb winter, Mar-May spring,
  // Jun-Aug summer, Sep-Nov fall: month buckets, not equinoxes.
  hero: [winter, winter, spring, spring, spring, summer, summer, summer, fall, fall, fall, winter][new Date().getMonth()],

  email: 'info@stvladnj.org',
  phone: '+1 732 928 1248',
  facebook: 'https://facebook.com/stvladimirsnj',
  instagram: 'https://www.instagram.com/stvladimirsnj',
  telegram: 'https://t.me/stvladnj',
};
