const locations = [
    {
        id: 'icon_theotokos',
        description: {
            en: 'Icon of our Lady Theotokos',
            ru: 'У иконы Богородицы',
        },
        image: '/img/icon_theotokos.png',
    },
	{
        id: 'icon_nicholas',
        description: {
            en: 'Icon of St. Nicholas',
            ru: 'У иконы св. Николая',
		},
        image: '/img/st_nicolas.png',
	},
    {
        id: 'icon_center',
        description: {
            en: 'Festal Icon in the Center',
            ru: 'У центральной иконы',
		},
        image: '/img/center_icon.png',
	},
    {
        id: 'icon_vladimir',
        description: {
            en: 'Icon of St. Vladimir',
            ru: 'У иконы св. Владимира',
        },
        image: '/img/st_vladimir.png',
    },
    {
    id: 'icon_cross',
        description: {
            en: 'Commemoration Table',
            ru: 'На поминальный столик',
		},
        image: '/img/comm_table.png',
    },
    // {
    //     id: 'icon_kiev_sobor',
    //     description: {
    //         en: 'Saints of Kyiv-Pechersk',
    //         ru: 'Собор святых Киево-Печерских',
    //     },
    //     image: '/img/kiev-sobor.png',
    // },
    {
        id: 'icon_quick_to_hear',
        description: {
            en: 'Mother of God "Quick to Hear"',
            ru: 'Скоропослушница',
        },
        image: '/img/quick-to-hear.png',
    },
];

const candles = [
    {
        id: 'candle_large',
        price: 6.00,
        description: {
            en: 'Large',
            ru: 'Большая',
        },
        limit: 5,
        height: '40%',
        image: '/img/candle_large.png',
    },
    {
        id: 'candle_medium',
        price: 3.00,
        description: {
            en: 'Medium',
            ru: 'Средняя',
        },
        limit: 5,
        height: '25%',
        image: '/img/candle_medium.png',
    },
    {
        id: 'candle_small',
        price: 2.00,
        description: {
            en: 'Small',
            ru: 'Малая',
        },
        height: '25%',
        limit: 5,
        image: '/img/candle_large.png',
    }
];


const PROD_CLIENT_ID = 'ASaZpeX62K2Hc4JlCLt0qhusm0E4XBvBpVzAqrxzQKveDpa3nKTaHmrnP8bhi39SeP8NIpc3x4j1X2IW';
const SANDBOX_CLIENT_ID = 'Abf-cRHoazo0I7rRJuvhv06P5rm3OyUN0u7t9hPpZe1l87q8-BCODsSTIbrgsvIUs1PJBou9_Rttn4F0';
const paypalClientId =  PROD_CLIENT_ID;

// PayPal shows this as a brand in checkout widget
const brandName = {
    en: 'St. Vladimir Memorial Church, Jackson, NJ',
    ru: 'Храм-памятник св. князя Владимира в Джексоне, Нью-Джерси',
};

// This message is displayed after successul checkout
const thankYouMessage = {
    en: 'Thank you for supporting St. Vladimir Memorial Church. God Bless you!',
    ru: 'Благодарим за поддержку храма-памятника св. Владимира. Да хранит вас Господь!',
};