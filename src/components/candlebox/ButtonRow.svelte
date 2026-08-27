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
    <button class="button-circle" on:click={decrement} aria-label="Less">&minus;</button>
    <div class="button-title">{label} ${price.toFixed(2)} &times;<span class="quantity">{quantity}</span></div>
    <button class="button-circle" on:click={increment} aria-label="More">+</button>
</div>
<style>
.button-row {
	width: 100%;
	color: lightyellow;
	text-align: center;
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
}
.button-circle {
    height: 38px;
    width: 38px;
    border: 1px solid #ccc;
    background: #fff;
    cursor: pointer;
    line-height: 1;
    margin-top: auto;
    margin-bottom: auto;
    font-size: 18px;
	padding: 0 12px;
	border-radius: 50%;
	font-weight: bold;
	color: #333;
}
.button-title {
	flex-grow: 1;
	line-height: 2.5rem;
    font-size: 1.75rem;
    margin-top: auto;
    margin-bottom: auto;
}
.quantity {
    display: inline-block;
    width: 1ch;
	font-size: 1.75rem;
}
</style>