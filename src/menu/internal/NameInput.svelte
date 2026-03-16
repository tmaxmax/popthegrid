<script lang="ts">
  import { setName } from '$share/name.ts';
  import { getContext } from '../context.ts';

  const inputName = 'name';
  const inputID = 'name';

  interface Props {
    pretentious?: boolean;
    enable: boolean;
  }

  let { pretentious = false, enable }: Props = $props();

  const message = (pretentious ? 'Well' : 'Howdy') + (enable ? ',' : pretentious ? '…' : '!');

  const { name } = getContext();

  let value = $state($name);

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

<label for={inputName} data-value={value} title="Input your name! It is used when you share games with others.">
  <span class="message">{message}</span>
  {#if enable}
    <input
      type="text"
      name={inputName}
      id={inputID}
      size="1"
      placeholder=" …"
      bind:value
      aria-label="Your name"
      onblur={onBlur}
      onchange={onChange} />
    <span class="cursor">&nbsp;</span>
  {/if}
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
    min-width: 3em;
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

  input:placeholder-shown {
    color: var(--color-body);
    transition: all 0.1s ease-in;
  }

  input:placeholder-shown:hover {
    color: var(--color-heading);
  }

  .message {
    margin-right: 0.24em;
  }

  .cursor {
    display: inline-block;
    width: 0.13em;
    border-radius: 0.02em;
    height: 63%;
    background-color: var(--color-heading);
    grid-area: 1/2;
    animation: 0.6s infinite alternate cursor-blink ease-out;
  }

  input:is(:not(:placeholder-shown), :focus) + .cursor {
    display: none;
  }

  @keyframes cursor-blink {
    0% {
      opacity: 0;
    }
    20% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
