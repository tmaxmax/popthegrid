<script lang="ts">
  import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
  import CheckBold from 'svelte-material-icons/CheckBold.svelte';
  import { copy } from '@svelte-put/copy';
  import { wait } from '$util/index.ts';

  export let text: string;

  let showSuccess = false;

  const onCopied = async () => {
    showSuccess = true;
    await wait(1000);
    showSuccess = false;
  };
</script>

<button use:copy={{ text, event: ['mousedown', 'touchend'] }} on:copied={onCopied}>
  {#if showSuccess}
    <CheckBold class="copy-icon check-bold-icon" />
  {:else}
    <ContentCopy class="copy-icon" />
  {/if}
</button>

<style>
  button {
    color: inherit;
    font-size: inherit;
    background: none;
    border: none;
    margin: none;
    padding: none;
    height: 1.4em;
    width: 1.4em;
    transition: color 0.1s ease-in;
    cursor: pointer;
  }

  button:hover {
    color: var(--color-heading);
  }

  :global(.check-bold-icon) {
    color: var(--color-assurance);
  }

  :global(.copy-icon) {
    width: 1.1em;
    height: 1.1em;
  }
</style>
