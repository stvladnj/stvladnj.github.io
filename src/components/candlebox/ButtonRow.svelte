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
	height: 25%;
	color: lightyellow;
	text-align: center;
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
}
/* Original look: style.css .btn-default (orange) + the scoped .button-circle rules */
.button-circle {
    height: 38px;
    width: 38px;
    margin: auto 8px;
    padding: 0;
    font-size: 18px;
    line-height: 1;
    border: 0;
    border-radius: 50%;
    font-weight: bold;
    color: lightyellow;
    background: #cf5022;
    cursor: pointer;
    transition: background .5s;
}
.button-circle:hover, .button-circle:focus {
    background: #a13e1a;
}
.button-title {
	flex-grow: 1;
	line-height: 30px;
    font-size: 20px;
    margin-top: auto;
    margin-bottom: auto;
}
.quantity {
    display: inline-block;
    width: 1ch;
	font-size: 20px;
}
</style>