<script>
    import { createEventDispatcher, tick } from 'svelte';
	import Switch from './Switch.svelte';

	export let names = [];
	export let lang = 'en';
	export let active = false;
	export let living = true;
	export let image = {};  // { src, width, height } from the build

	const dispatch = createEventDispatcher();

	let text = '';
	let activeText = names.join('\n');
	let shadowActive = active;
	let textareaEl;

	async function focusEnd() {
		await tick();
		if (!textareaEl) return;
		textareaEl.focus();
		const end = textareaEl.value.length;
		textareaEl.setSelectionRange(end, end);
		textareaEl.scrollTop = textareaEl.scrollHeight;
	}

	$: if (shadowActive !== active) {
		if (active) {
			// from not active to active:
			text = activeText;
			focusEnd();
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
		en: 'FOR DECEASED',
	}

</script>
<div class="note">
	<img src={image.src} width={image.width} height={image.height} alt="">
	<div class="title">
  		<Switch bind:checked={active} label={living ? title[lang] : titleDeceased[lang]} color={living ? '#a84e52' : '#6b6b6b'} />
		<span class="number-of-names" style="color: {living ? '#a84e52' : '#6b6b6b'};">{active ? names.length : ''}</span>
	</div>
	<textarea class="notes" rows="12" bind:this={textareaEl} bind:value={text} readonly={!active} aria-label={living ? title[lang] : titleDeceased[lang]} placeholder={active ? '' : message[lang]}></textarea>
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
	.notes:focus { outline: none; }
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
		margin-left: 20px;
		font-weight: bold;
	}
	.note > textarea {
		font-size: 20px;
	}
</style>