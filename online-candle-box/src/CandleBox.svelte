<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let lang = 'ru';
	export let locations = [];
	export let products = [];
	export let paypalClientId;
	export let brandName = {};
	export let thankYouMessage = {};

	let order = {};
	const getQuantity = (loc, prod) => order[loc.id + '/' + prod.id] || 0;

	const computeTotal = () => {
		let temp =0;
		for (const loc of locations) {
			for (const prod of products) {
				const quantity = getQuantity(loc, prod);
				temp += quantity * prod.price;
			}
		}
		return temp;
	};

	let total = 0;
	$: {
		total = computeTotal(order);
		if (total === 0) shuffleCandlePositions();
	}

	const clearOrder = () => {
		order = {};
	}

	const increment = (loc, prod) => {
		const quantity = getQuantity(loc, prod);
		if (quantity < prod.limit) {
			order[loc.id + '/' + prod.id] = quantity + 1;
			order = order;
		}
	};
	const decrement = (loc, prod) => {
		const quantity = getQuantity(loc, prod);
		if (quantity > 0) {
			order[loc.id + '/' + prod.id] = quantity - 1;
			order = order;
		}
	};

	const shuffle = array => {
		for(let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * i)
			const temp = array[i]
			array[i] = array[j]
			array[j] = temp
		}
		return array;
	};

	const maxCandles = products.reduce((a,b)=>a + b.limit, 0)
	const positions = {};

	function shuffleCandlePositions() {

		for (const loc of locations) {
			positions[loc.id] = {
				pos: shuffle([...Array(maxCandles).keys()]),
				rotation: [...Array(maxCandles).keys()].map(()=>Math.random() * 10 - 5),
			};
		}
	}

	const getCandles = loc => {
		const candles = [];
		var pos_index = 0;
		for (const prod of products) {
			const q = getQuantity(loc, prod);
			for (let i = 0; i < q; i++) {
				candles.push({
					image: prod.image,
					pos: 100 * (0.5 + positions[loc.id].pos[pos_index+i]) / maxCandles,
					height: prod.height,
					rotate: positions[loc.id].rotation[pos_index+i],
					key: loc.id + '/' + (pos_index + i),
				});
			}
			pos_index += prod.limit;
		}
		return candles;
	}

    let paypalReady = false;
	let mounted = false;
	let element;

    onMount(() => {
		mounted = true;
		if (paypalReady) {
			loadPayPalButton();
		}
	});

	function initializePayPal() {
		paypalReady = true;
		if (mounted) {
			loadPayPalButton();
		}
	}

	function createOrder(data, actions) {
		const items = [];
		for (const loc of locations) {
			for (const prod of products) {
				const q = getQuantity(loc, prod);
				if (q > 0) {
					items.push({
						name: 'candles',
						sku : prod.id + '/' + loc.id,
						unit_amount: {
							currency_code: 'USD',
							value: prod.price.toFixed(2),
						},
						quantity: q,
						description: prod.description[lang] + ' :: ' + loc.description[lang],
						category: 'DIGITAL_GOODS',
					});
				}
			}
		}

		const purchase_unit = {
			amount: {
				currency_code: 'USD',
				value: total.toFixed(2),
				breakdown: {
					item_total: {
						currency_code: 'USD',
						value: total.toFixed(2),
					}
				}
			},
			description: 'Candles',
			items: items,
		};

		return actions.order.create({
			purchase_units: [purchase_unit],
			application_context: {
				brand_name: brandName[lang],
			}
		});
	}

	function onApprove(data, actions) {
		return actions.order.capture().then(function(details) {
			// console.log(details.payer);
			// console.log(details);
			// alert('Transaction completed by ' + details.payer.name.given_name + '!');
			clearOrder();
			sayThanks();
		});
	}

	const onCancel = data => {
		console.log('Cancelled:', data);
	};

    function loadPayPalButton() {
		paypal.Buttons({
			style: {
				size  : 'responsive',
				shape : 'pill',
				color : 'blue',
				layout: 'vertical',
				label : 'paypal',
				tagline: false,
			},
			createOrder,
			onApprove,
			onCancel,
		}).render('#paypal-button-container');
	}

	let thanks = false;
	function sayThanks() {
		thanks = true;
		setTimeout(()=>{thanks=false}, 2500);
	}

</script>

<div class="row" bind:this={element}>
	{#each locations as loc}
		<div class="col-md-3 col-sm-12">
		<div class="candle-location">
		<img src={loc.image} alt="">
		{#each getCandles(loc, order) as candle (candle.key)}
			<div transition:fly={{y:100, duration:500}} class="candle" style="left: {candle.pos}%; height: {candle.height};">
				<img src={candle.image} style="transform: rotate({candle.rotate}deg);" alt="">
			</div>
		{/each}
		<div class="button-group">
		<div class="row">
			<div class="col-md-12 icon-header">{loc.description[lang]}</div>
		</div>
		{#each products as prod}
		<div class="row">
		<div class="col-sm-12">
		<div class="button-row">
			<button class="btn btn-default btn-circle button-left" on:click={()=>decrement(loc, prod)}>-</button>
			<span class="descr">{prod.description[lang]}: ${prod.price.toFixed(2)} &times;{getQuantity(loc, prod, order)}</span>
			<button class="btn btn-default btn-circle button-right" on:click={()=>increment(loc, prod)}>+</button>
		</div>
		</div>
		</div>
		{/each}
		</div>
		</div>
		</div>
	{/each}
</div>
<div class="row total" class:flex={total > 0}>
	<div id="paypal-button-container" class="col-sm-6 paypal-ugly"></div>
	<div class="amount col-sm-3">${total.toFixed(2)}</div>
	<div class="col-sm-3"><button class="btn btn-circle btn-danger cancel" on:click={clearOrder}><i class="fa fa-times"></i></button></div>
</div>
{#if thanks}
<div class="row thanks" transition:fade>
	{thankYouMessage[lang]}
</div>
{/if}
<svelte:head>
<script
    src="https://www.paypal.com/sdk/js?client-id={paypalClientId}&currency=USD&disable-funding=card,credit"
    data-sdk-integration-source="button-factory" on:load={initializePayPal}></script>
</svelte:head>

<style>
.total {
	background-color: #777e;
	position:fixed;
	top: 0;
	left: 15px;
	width:100%;
	z-index: 2000;
	line-height: 2em;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	display: none;
}

.paypal-ugly {
	margin-top: 0.5em;
}

.candle-location > img {
	width: 100%;
	max-width: 1660px;
	height: auto;
}
.icon-header {
	text-align: center;
	font-size: 1.35rem;
	font-weight: bolder;
	color: lightyellow;
}
.candle-location {
	position: relative;
	padding-top: 0.5em;
	padding-bottom: 0.5em;
}
.button-group {
	position: absolute;
	bottom: 0.5em;
	background-color: #00000075;
	width: 100%;
	text-align: center;
}
.btn-circle {
	width: 2em;
	height: 2em;
	line-height: 2em; /* adjust line height to align vertically*/
	padding:0;
	border-radius: 50%;
	font-weight: bold;
}
.button-row {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	width: 100%;
}
.descr {
	display: inline-block;
	color: lightyellow;
	font-size: 1.35rem;
	flex-grow: 1;
	line-height: 2.5rem;
}
@media (max-width: 996px) {
	.descr {
		font-size: 2.35rem;
	}
	.icon-header {
		font-size: 2.5rem;
	}
}
.button-left {
	flex-shrink: 0;
}
.button-right {
	flex-shrink: 0;
}
.amount {
	font-size: 2.5em;
	font-weight: bolder;
	line-height: 2.0em;
	color: lightgray
}
.cancel {
	margin-top: 1em;
	margin-bottom: 1em;
	font-size: 18px;
}
.candle {
	position: absolute;
	bottom: 7em;
	width: 3%;
	/* background-color: white; */
}
.candle > img {
	max-height: 100%;
	width: auto;
}
.thanks {
	font-size: 3em;
    position: fixed;
    top: 0;
    left: 15px;
    z-index: 3000;
	background-color: lightgray;
	color: #555;
    width: 100%;
	text-align: center;
	padding: 1em;
}
.flex {
	display: flex;
}
</style>
