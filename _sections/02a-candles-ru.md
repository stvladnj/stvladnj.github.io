---
title: Свечи
layout: section
anchor: candles
lang: ru
---
{::options auto_ids="false"/}

<div class="section-title center" markdown="1">
## Свечной Ящик
---------------
Выберите размер и количество свечей. Для оплаты нажмите кнопку "PayPal" наверху.

Мы <b>поставим</b> свечи на указанное место и <b>зажжем</b> во время ближайшей Божественной литургии.

<div id="online-candle-box"></div>
<script>
{% include inventory.js %}
new app.CandleBox({
    target: document.querySelector('#online-candle-box'),
    props: {
        lang: 'ru',
        locations, candles, paypalClientId, brandName, thankYouMessage
    },
});
</script>
</div>


