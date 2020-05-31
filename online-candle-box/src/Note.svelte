<script>
    import { createEventDispatcher } from 'svelte';
	import Switch from './Switch.svelte';

	export let names = [];
	export let lang = 'en';
	export let active = false;
	export let living = true;

	const dispatch = createEventDispatcher();

	let text = '';
	let activeText = names.join('\n');
	let shadowActive = active;
	$: if (shadowActive !== active) {
		if (active) {
			// from not active to active:
			text = activeText;
		} else {
			// from active to not active:
			activeText = text;
			text = '';
		}
		shadowActive = active;
		dispatch('names');
	}

	$: if (active) {
		activeText = text;
		names = text.split('\n').map(x=>x.trim()).filter(x=>!!x);
		dispatch('names');
	}

	const message = {
		ru: 'Включите  \u21E7  эту кнопку и введите имена крещёных православных христиан.',
		en: 'Toggle  \u21E7  this switch and enter names of baptised orthodox christians.',
	}

	const title = {
		ru: 'О ЗДРАВИИ',
		en: 'FOR LIVING',
	};

	const titleDeceased = {
		ru: 'О УПОКОЕНИИ',
		en: 'FOR DEAD',
	}

</script>
<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
</svelte:head>
<div class="note">
	{#if living}
	<img src="/img/note-red.png" alt="">
	{:else}
	<img src="/img/note-black.png" alt="">
	{/if}
	<div class="input-group title custom-control custom-switch">
  		<Switch bind:checked={active} label={living ? title[lang] : titleDeceased[lang]} color={living ? '#c36266' : 'gray'} />
		<span class="number-of-names" style="color: {living? '#c36266' : 'gray'};">{active ? names.length : ''}</span>
	</div>
	<textarea class="notes" rows="12" bind:value={text} readonly={!active} placeholder={active ? '' : message[lang]}></textarea>
</div>

<style>
	.notes {
		background-attachment: local;
		background-image:
			linear-gradient(to right, white 10px, transparent 10px),
			linear-gradient(to left, white 10px, transparent 10px),
			repeating-linear-gradient(white, white 30px, #ccc 30px, #ccc 31px, white 31px);
		line-height: 31px;
		padding: 8px 10px;
		width: 100%;
		border: none;
		margin: 0;
	}
	.note {
		width: 100%;
		border: 1px solid lightgray;
	}
	.note > img {
		width: 100%;
	}
	.title {
		margin-left: 20%;
	}
	.number-of-names {
		margin-left: 2rem;
		font-weight: bold;
	}
	.note > textarea {
		font-size: 2rem;
	}
</style>