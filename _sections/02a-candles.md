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

You can submit a list of names for commemoration during the liturgy. The donation is $1 per <b>every</b> 8 names.
<div id="online-candle-box"></div>
<script>
{% include inventory.js %}
new app.CandleBox({
  target: document.querySelector('#online-candle-box'),
  props: {
    lang: 'en',
    locations, candles, paypalClientId, brandName, thankYouMessage
  }
});
</script>
</div>


