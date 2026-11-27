<script context="module">
  let count = 0;  // module-scoped so server and client agree on the id
</script>

<script>
  export let checked = false;
  export let label = '';
  export let color = "#2196F3";

  const id = `switch-${count++}`;
</script>

<style>
  .switch {
    position: relative;
    display: inline-block;
    /* The 0x0 input inside gives this box a text baseline, which floats the pill
       above the label. Centre the pill on the text instead -- then nudge 1px, as
       `middle` centres on the parent's x-height while the label is all-caps, whose
       optical centre sits slightly higher. Measured, not guessed. */
    vertical-align: middle;
    top: -1px;
    width: 30px;
    height: 17px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .label {
    font-size: 15px;
    font-weight: 700;
    padding: .2em .6em .3em;
    line-height: 1;
    cursor: pointer;
  }

  .switch input:focus-visible + .slider {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 17px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 13px;
    width: 13px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(13px);
    -ms-transform: translateX(13px);
    transform: translateX(13px);
  }
</style>

<label class="switch">
  <input type="checkbox" {id} bind:checked />
  <span class="slider" style="background-color: {checked ? color : '#ccc'};"></span>
</label>
<label class="label" for={id} style="color: {color}">{label}</label>
