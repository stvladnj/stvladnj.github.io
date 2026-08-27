// Candle box inventory. Images are imported so the build optimizes them (see CandleBox.astro).
import iconTheotokos from '../images/icon_theotokos.png';
import stNicolas from '../images/st_nicolas.png';
import centerIcon from '../images/center_icon.png';
import stVladimir from '../images/st_vladimir.png';
import commTable from '../images/comm_table.png';
import quickToHear from '../images/quick-to-hear.png';
import kievSobor from '../images/kiev-sobor.png';
import candleLarge from '../images/candle_large.png';
import candleMedium from '../images/candle_medium.png';

export const locations = [
  { id: 'icon_theotokos', description: { en: 'Icon of our Lady Theotokos', ru: 'У иконы Богородицы' }, image: iconTheotokos },
  { id: 'icon_nicholas', description: { en: 'Icon of St. Nicholas', ru: 'У иконы св. Николая' }, image: stNicolas },
  { id: 'icon_center', description: { en: 'Festal Icon in the Center', ru: 'У центральной иконы' }, image: centerIcon },
  { id: 'icon_vladimir', description: { en: 'Icon of St. Vladimir', ru: 'У иконы св. Владимира' }, image: stVladimir },
  { id: 'icon_cross', description: { en: 'Commemoration Table', ru: 'На поминальный столик' }, image: commTable },
  { id: 'icon_kiev_sobor', description: { en: 'Saints of Kyiv-Pechersk', ru: 'Собор святых Киево-Печерских' }, image: kievSobor },
  { id: 'icon_quick_to_hear', description: { en: 'Mother of God "Quick to Hear"', ru: 'Скоропослушница' }, image: quickToHear },
];

export const candles = [
  { id: 'candle_large', price: 6.0, description: { en: 'Large', ru: 'Большая' }, limit: 5, height: '40%', image: candleLarge },
  { id: 'candle_medium', price: 3.0, description: { en: 'Medium', ru: 'Средняя' }, limit: 5, height: '25%', image: candleMedium },
  { id: 'candle_small', price: 2.0, description: { en: 'Small', ru: 'Малая' }, limit: 5, height: '25%', image: candleLarge },
];

// PayPal client ids are public identifiers, not secrets.
// Sandbox: 'Abf-cRHoazo0I7rRJuvhv06P5rm3OyUN0u7t9hPpZe1l87q8-BCODsSTIbrgsvIUs1PJBou9_Rttn4F0'
export const paypalClientId = 'AWV9x5m6r2j75RTdtOsl-dL7KJnmqNGKBbVCSfWUxuAC0hqGvnx7XraDYtmW0sU-uu-zpqIOfUlt_jSo';

// PayPal shows this as a brand in checkout widget
export const brandName = {
  en: 'St. Vladimir Memorial Church, Jackson, NJ',
  ru: 'Храм-памятник св. князя Владимира в Джексоне, Нью-Джерси',
};

// Displayed after successful checkout
export const thankYouMessage = {
  en: 'Thank you for supporting St. Vladimir Memorial Church. God Bless you!',
  ru: 'Благодарим за поддержку храма-памятника св. Владимира. Да хранит вас Господь!',
};
