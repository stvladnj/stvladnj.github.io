<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import Note from './Note.svelte';

	export let lang = 'en';
	export let locations = [];  // where candles can be placed
	export let candles = [];    // candle types (Large, Medium, Small)
	export let paypalClientId;
	export let brandName = {};  // brand to send to PayPal
	export let thankYouMessage = {};
	export let noteImages = {};  // { living, deceased } image URLs
	export let order = {};  // output is a dictionary of location ids, with values being a dictionary of landle ids

	const namesPerNote = 10;
	const notePrice = 1.00;
	const priceForNames = num => Math.floor((num + namesPerNote - 1) / namesPerNote) * notePrice;

	const clearOrder = () => {
		for (const loc of locations) {
			order[loc.id] = {};
			for (const c of candles) {
				order[loc.id][c.id] = 0;
			}
		}
		activeLiving = false;
		activeDeceased = false;
		onQuantityChanged();
	};

	const getQuantity = (loc, candle) => order[loc.id][candle.id] || 0;

	const computeTotal = () => {
		let temp =0;
		for (const loc of locations) {
			for (const c of candles) {
				const quantity = getQuantity(loc, c);
				temp += quantity * c.price;
			}
		}
		const forLiving = activeLiving ? priceForNames(namesLiving.length) : 0;
		const forDeceased = activeDeceased ? priceForNames(namesDeceased.length): 0;
		return temp + forLiving + forDeceased;
	};

	let total = 0;
	let namesLiving = [];
	try {
		namesLiving = JSON.parse(localStorage.getItem('names-living') || '[]');
	} catch {}
	let activeLiving = false;

	let namesDeceased = [];
	try {
		namesDeceased = JSON.parse(localStorage.getItem('names-deceased') || '[]');
	} catch {}
	let activeDeceased = false;

	function onQuantityChanged() {
		total = computeTotal();
	}

    let paypalReady = false;
	let mounted = false;

    onMount(() => {
		mounted = true;
		if (window.paypal) {
			initializePayPal();
			return;
		}
		const script = document.createElement('script');
		script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&disable-funding=card,credit`;
		script.dataset.sdkIntegrationSource = 'button-factory';
		script.onload = initializePayPal;
		document.head.appendChild(script);
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
			for (const c of candles) {
				const q = getQuantity(loc, c);
				if (q > 0) {
					items.push({
						name: 'candles',
						sku : c.id + '/' + loc.id,
						unit_amount: {
							currency_code: 'USD',
							value: c.price.toFixed(2),
						},
						quantity: q,
						description: c.description[lang] + ' :: ' + c.description[lang],
						category: 'DIGITAL_GOODS',
					});
				}
			}
		}

		if (activeLiving && namesLiving.length > 0) {
			localStorage.setItem('names-living', JSON.stringify(namesLiving));
			let amount = priceForNames(namesLiving.length);
			for (const name of namesLiving) {
				items.push({
					name: 'names',
					sku : 'names/living',
					unit_amount: {
						currency_code: 'USD',
						value: amount.toFixed(2),
					},
					quantity: 1,
					description: name,
					category: 'DIGITAL_GOODS',
				});
				amount = 0;  // we charge full price to the first name
			}
		}

		if (activeDeceased && namesDeceased.length > 0) {
			localStorage.setItem('names-deceased', JSON.stringify(namesDeceased));
			let amount = priceForNames(namesDeceased.length);
			for (const name of namesDeceased) {
				items.push({
					name: 'names',
					sku : 'names/deceased',
					unit_amount: {
						currency_code: 'USD',
						value: amount.toFixed(2),
					},
					quantity: 1,
					description: name,
					category: 'DIGITAL_GOODS',
				});
				amount = 0;  // we charge full price to the first name
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

	clearOrder();

</script>

<div class="grid">
	{#each locations as loc}
		<Icon {candles} src={loc.image} order={order[loc.id]} name={loc.description} lang={lang} on:quantity={onQuantityChanged} />
	{/each}
</div>
<div class="grid notes">
	<Note image={noteImages.living} bind:names={namesLiving} bind:active={activeLiving} on:names={onQuantityChanged} {lang} />
	<Note image={noteImages.deceased} living={false} bind:names={namesDeceased} bind:active={activeDeceased} on:names={onQuantityChanged} {lang} />
</div>
<div class="total" class:visible={total > 0}>
	<div id="paypal-button-container" class="paypal-ugly"></div>
	<div class="amount">
		<span class="number">${total.toFixed(2)}</span>
		<button class="cancel" on:click={clearOrder} aria-label="Cancel">&times;</button>
	</div>
</div>
{#if thanks}
<div class="thanks" transition:fade>
	{thankYouMessage[lang]}
</div>
{/if}

<style>
.total {
	background-color: #777e;
	position: fixed;
	top: -50%;
	left: 0;
	width:100%;
	z-index: 2000;
	line-height: 20px;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	transition-property: top;
	transition-duration: 2s;
	align-items: center;
}

.paypal-ugly {
	margin-top: 5px;
	margin-left: 5px;
	flex-grow: 1;
}
.cancel {
	height: 38px;
	width: 38px;
	margin-left: 1rem;
	font-size: 22px;
	line-height: 1;
	border: 0;
	border-radius: 50%;
	font-weight: bold;
	color: #fff;
	background: #d9534f;
	cursor: pointer;
}
.grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;
	margin-bottom: 1rem;
	text-align: left;
}
.notes {
	grid-template-columns: repeat(2, minmax(0, 360px));
	justify-content: center;
}
@media (max-width: 767px) {
	.grid, .notes { grid-template-columns: 1fr; }
}
.amount {
	flex-grow: 1;
	font-size: 30px;
	font-weight: bolder;
	line-height: 30px;
	color: lightgray;
	display: flex;
	align-items: center;
	justify-content: center;
}
.number {
	margin-left: 10px;
	margin-right: 10px;
}
.thanks {
	font-size: 3em;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 3000;
	background-color: lightgray;
	color: #555;
	text-align: center;
	padding: 1em;
}
.visible {
	top: 0;
}
</style>
