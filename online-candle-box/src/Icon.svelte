<script>
	import ButtonRow from './ButtonRow.svelte';
	import { fade, fly } from 'svelte/transition';

	export let src = 'icon_theotokos.png';
	export let name = 'Icon of Theotokos';
	export let candles = []
	export let lang = 'en';
	export let order = {};

	const shuffle = array => {
		for(let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * i)
			const temp = array[i]
			array[i] = array[j]
			array[j] = temp
		}
		return array;
	};

	const maxCandles = candles.reduce((a,b)=>a + b.limit, 0)
	const positions = {};

	function shuffleCandlePositions() {
		positions.pos = shuffle([...Array(maxCandles).keys()]);
		positions.rotation = [...Array(maxCandles).keys()].map(()=>Math.random() * 10 - 5);
	}

	shuffleCandlePositions();

	const getCandles = order => {
		const activeCandles = [];
		var pos_index = 0;
		for (const c of candles) {
			for (let i = 0; i < order[c.id] || 0; i++) {
				activeCandles.push({
					image: c.image,
					pos: 100 * (0.25 + positions.pos[pos_index+i]) / maxCandles,
					height: c.height,
					rotate: positions.rotation[pos_index+i],
					key: (pos_index + i),
				});
			}
			pos_index += c.limit;
		}
		if (activeCandles.length === 0) shuffleCandlePositions();
		return activeCandles;
	}
</script>
<div class="icon">
	<img {src} alt="">

	{#each getCandles(order) as candle (candle.key)}
		<div transition:fly={{y:120, duration:600}} class="candle" style="left: {candle.pos}%; height: {candle.height};">
			<img src={candle.image} style="transform: rotate({candle.rotate}deg);" alt="">
		</div>
	{/each}

	<div class="buttons">
		<div class="button-title">{name[lang]}</div>
		{#each candles as c}
		<ButtonRow label={c.description[lang]} price={c.price} limit={c.limit} bind:quantity={order[c.id]} on:quantity />
		{/each}
	</div>
</div>
<style>
:root {
	--responsive-scale: 1;
}
.icon {
	position: relative;
	width: 100%;
}
.icon > img {
	width: 100%;
}
.buttons {
	position: absolute;
	bottom: 0;
	width: 100%;
	height: 30%;
	background-color: #0008;
}
.button-title {
	text-align: center;
	font-size: 2rem;
	font-weight: bold;
	color: lightyellow;
	height: 25%;
}
.candle {
	position: absolute;
	bottom: 25%;
	/* background-color: white; */
}
.candle > img {
	height: 100%;
}
</style>