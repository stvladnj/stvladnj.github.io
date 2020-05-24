---
title: Candles
layout: section
anchor: candles
lang: en
---
{::options auto_ids="false"/}

<div class="section-title center" markdown="1">
## Online Candle Box
--------------------
Please choose quantity and size of the candles, then use "PayPal" button on the top to complete
the purchase.

We will <b>light the candles</b> during the next liturgy service at the designated location.

<div id="online-candle-box"></div>
<script>
{% include inventory.js %}
new app.CandleBox({
  target: document.querySelector('#online-candle-box'),
  props: {
    lang: 'en',
    locations, products, paypalClientId, brandName, thankYouMessage
  }
});
</script>
</div>


