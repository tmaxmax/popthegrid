<script lang="ts">
  import { setName } from '$share/name.ts';
  import { getContext } from '../context.ts';

  const inputName = 'name';
  const inputID = 'name';

  export let pretentious = false;

  const { name } = getContext();

  let value = $name;

  $: empty = (value || '') === '';

  const onBlur = (ev: HTMLElementEventMap['blur']) => {
    // This function helps iOS safari to correctly handle input blurring.

    const element = ev.target as HTMLInputElement;
    if (document.activeElement !== element) {
      return;
    }

    element.setSelectionRange(0, 0, 'forward');
    element.blur();
  };

  const onChange = () => {
    $name = value;
    setName($name);
  };
</script>

<label for={inputName} data-value={value} title="Your name is used for sharing records.">
  <span class="message">{pretentious ? 'Well' : 'Howdy'},</span>
  <input
    type="text"
    class:empty
    name={inputName}
    id={inputID}
    size="1"
    placeholder="…"
    bind:value
    aria-label="Your name"
    on:blur={onBlur}
    on:change={onChange} />
</label>

<style>
  label {
    font-size: calc(1.4rem + 1vw);
    font-weight: 800;
    color: var(--color-heading);
    font-family: var(--font-heading);
    line-height: 1.24;
    display: inline-grid;
    align-items: center;
    position: relative;
  }

  label::after,
  input {
    grid-area: 1 / 2;
    width: auto;
    min-width: 1em;
    font: inherit;
    margin: 0;
    resize: none;
    background: none;
    appearance: none;
    border: none;
  }

  label::after {
    content: attr(data-value) ' ';
    visibility: hidden;
    white-space: pre-wrap;
    height: 0;
  }

  input {
    display: inline-block;
    color: inherit;
    padding: 0;
    text-overflow: ellipsis;
  }

  input::placeholder {
    color: inherit;
    opacity: 100%;
  }

  input.empty {
    color: var(--color-body);
    transition: all 0.1s ease-in;
  }

  input.empty:hover {
    color: var(--color-heading);
  }

  .message {
    margin-right: 0.24em;
  }
</style>
