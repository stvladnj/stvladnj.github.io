<script>
    import { createEventDispatcher } from 'svelte';

    export let price = 1;
    export let limit = 5;
    export let quantity = 0;
    export let label = '';

    const dispatch = createEventDispatcher();

    const increment = () => {
        if (quantity < limit) {
            quantity += 1;
            dispatch('quantity');
        }
    };

    const decrement = () => {
        if (quantity > 0) {
            quantity -= 1;
            dispatch('quantity');
        }
    }
</script>
<div class="button-row">
    <button class="btn btn-default button-circle" on:click={decrement}><i class="fa fa-minus"></i></button>
    <div class="button-title">{label} ${price.toFixed(2)} &times;<span class="quantity">{quantity}</span></div>
    <button class="btn btn-default button-circle" on:click={increment}><i class="fa fa-plus"></i></button>
</div>
<style>
:root {
    --responsive-scale: 2;
}
.button-row {
	width: 100%;
	height: 25%;
	color: lightyellow;
	text-align: center;
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
}
.button-circle {
	width: 4rem; /* calc(2rem * var(--responsive-scale)); */
	height: 4rem; /* calc(2rem * var(--responsive-scale)); */
	line-height: 100%; /* adjust line height to align vertically*/
	padding:0;
	border-radius: 50%;
	font-weight: bold;
	color: lightyellow;
}
.button-title {
	flex-grow: 1;
	line-height: 4rem; /* calc(2rem * var(--responsive-scale)); */
	font-size: 2rem; /* calc(1rem * var(--responsive-scale)); */
}
.quantity {
    display: inline-block;
    width: 1ch;
	font-size: 2rem; /* calc(1rem * var(--responsive-scale)); */
}
</style>