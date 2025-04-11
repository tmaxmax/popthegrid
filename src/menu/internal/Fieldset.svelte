<script module lang="ts">
  import type { FormEventHandler } from 'svelte/elements';
  import { createMediaMatcher } from './media.ts';

  export type Option<T extends string> = {
    display: string;
    description?: string;
    value: T;
  };

  const canHover = createMediaMatcher('(hover: hover)');
</script>

<script lang="ts">
  import { fade } from 'svelte/transition';

  type T = $$Generic<string>;

  interface Props {
    options: Option<T>[];
    name: string;
    disabled?: boolean;
    selectedValue: T;
    margin?: boolean;
    legend?: import('svelte').Snippet;
    children?: import('svelte').Snippet<[{ value: T }]>;
    onchange?: FormEventHandler<HTMLFieldSetElement>;
  }

  let { options, name, disabled = false, selectedValue = $bindable(), margin = false, legend, children, onchange }: Props = $props();

  let hovering = $state('');

  let selectedOrHovered = $derived(options.find((v) => v.value === (($canHover ? hovering : '') || selectedValue)));
</script>

<fieldset class:disabled class:margin {onchange}>
  {#if legend}
    <legend>
      {@render legend?.()}
    </legend>
  {/if}
  <div class="layout">
    {#each options as { value, display }, i (value)}
      <label for="{value}-{i}" onmouseenter={() => (hovering = value)} onmouseleave={() => (hovering = '')}>
        <input type="radio" bind:group={selectedValue} {name} id="{value}-{i}" {value} {disabled} />
        <span class="display">
          <span class="radio"></span>
          {display}
          {@render children?.({ value })}
        </span>
      </label>
    {/each}
  </div>
</fieldset>
{#if selectedOrHovered?.description}
  <p>
    {#key selectedOrHovered.value}
      <span transition:fade={{ duration: 100 }}>{selectedOrHovered.description}</span>
    {/key}
  </p>
{/if}

<style>
  fieldset {
    color: var(--color-body);
    font-family: var(--font-body);
    border: none;
    width: 100%;
    height: max-content;
    margin: 0;
    padding: 0;
    transition: color 0.1s ease-in;
  }

  fieldset:hover:not(.disabled) {
    color: var(--color-heading);
  }

  fieldset.margin {
    margin-top: 0.4em;
  }

  legend {
    padding: 0;
  }

  .layout {
    margin-top: 0.1em;
    margin-left: 0.6em;
    grid-column: 2;
  }

  @media (min-width: 600px) {
    fieldset {
      position: relative;
      display: grid;
      grid-template-columns: 6em 1fr;
    }

    legend {
      position: absolute;
      grid-column: 1;
    }

    .layout {
      margin-left: 0;
    }
  }

  input {
    width: 1px;
    height: 1px;
    opacity: 0%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .display {
    display: flex;
    flex-wrap: wrap;
    color: var(--color-body);
    transition: color 0.1s ease-in;
    cursor: pointer;
  }

  .radio {
    border: 3px solid var(--color-body);
    border-radius: 100%;
    display: inline-block;
    width: 1.4rem;
    height: 1.4rem;
    padding-top: 0.1rem;
    text-align: center;
    font-weight: bold;
    margin-right: 0.3rem;
    transition:
      border-color 0.1s ease-in,
      background-color 0.1s ease-in;
  }

  label {
    user-select: none;
    -webkit-user-select: none;
  }

  label ~ label span {
    padding-top: 0.2rem;
  }

  label input:hover:not(:disabled) + span,
  label input:focus-visible:not(:disabled) + span {
    color: var(--color-heading);
  }

  label input:hover:not(:disabled) + span > span.radio,
  label input:focus-visible:not(:disabled) + span > span.radio {
    border-color: var(--color-heading);
  }

  fieldset label input:hover:checked:not(:disabled) + span > span.radio,
  fieldset label input:focus-visible:checked:not(:disabled) + span > span.radio {
    border-color: var(--color-heading);
    background-color: var(--color-heading);
  }

  input:disabled + .display {
    opacity: 40%;
    cursor: default;
  }

  input:disabled:checked + .display {
    opacity: 100%;
  }

  input:checked + .display > .radio {
    background-color: var(--color-body);
  }

  input:checked:disabled + .display > .radio {
    background-color: var(--color-heading);
    border-color: var(--color-heading);
  }

  p {
    margin-top: 0.2em;
    display: grid;
  }

  p span {
    grid-area: 1 / 1 / 2 / 2;
  }
</style>
