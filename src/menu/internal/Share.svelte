<script lang="ts" context="module">
  import { writable } from 'svelte/store';

  interface Modal {
    close(): void;
  }

  const modal = writable<Modal | undefined>();

  function autosize(node: HTMLTextAreaElement) {
    const computed = window.getComputedStyle(node);
    // assume border-box sizing
    const newHeight = node.scrollHeight + parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
    node.style.height = `${newHeight}px`;
  }
</script>

<script lang="ts">
  import Share from 'svelte-material-icons/Share.svelte';
  import Loading from 'svelte-material-icons/Loading.svelte';
  import CopyButton from './CopyButton.svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { clickoutside } from '@svelte-put/clickoutside';

  export let data: () => Promise<ShareData>;
  export let small = false;

  let clicked = false;
  let toShare: ShareData | Error | undefined;
  let resolvePopUp: (() => void) | undefined;
  let popUpPosition: { x: number; y: number } | undefined;
  let absolute: HTMLElement | undefined;
  let loading = false;

  $: absolute && document.body.appendChild(absolute);
  $: textAreaContent = toShare ? (toShare instanceof Error ? toShare.message : toShare.text + '\n' + toShare.url) : undefined;

  const popUpWidth = 20 * 16;
  const modalMargin = 2 * 16;

  const onClick = async (e: MouseEvent) => {
    if (clicked) {
      return;
    }

    clicked = true;

    try {
      loading = true;
      toShare = await data();
      loading = false;
    } catch (err) {
      loading = false;
      if (err instanceof Error) {
        toShare = err;
      } else {
        throw err;
      }
    }

    await new Promise<void>((resolve) => {
      $modal?.close();
      $modal = { close: resolve };
      let x = e.clientX - popUpWidth / 4;
      if (x - modalMargin < 0) {
        x = modalMargin;
      } else if (e.clientX + (3 * popUpWidth) / 4 > window.innerWidth - modalMargin) {
        x = window.innerWidth - modalMargin - popUpWidth;
      }
      popUpPosition = { x, y: e.clientY };
      resolvePopUp = resolve;
    });

    clicked = false;
    toShare = resolvePopUp = popUpPosition = undefined;
  };

  const onTextAreaClick = (e: Event) => {
    if (toShare instanceof Error) {
      return;
    }

    (e.target as HTMLTextAreaElement).select();
  };
</script>

<div class="button" class:small>
  <button on:click|stopPropagation={onClick}>
    <slot />
    {#if loading}
      <Loading class="share-icon share-icon--loading" />
    {:else}
      <Share class="share-icon" />
    {/if}
  </button>
</div>
{#if resolvePopUp && toShare && popUpPosition}
  <div
    class="absolute"
    style="--width: {popUpWidth}px; --position-x: {popUpPosition.x}px; --position-y: {popUpPosition.y}px"
    bind:this={absolute}>
    <div class="popup" transition:fade={{ duration: 400, easing: cubicOut }} use:clickoutside on:clickoutside={resolvePopUp}>
      {#if toShare instanceof Error}
        <label class="popup-title" for="share-text">An error occurred :( try again later!</label>
        <textarea class="error" use:autosize name="share-text" autocomplete="off" autocorrect="off" cols="29" readonly
          >{textAreaContent}</textarea>
      {:else if toShare.url && !(toShare.text || toShare.title)}
        <label class="popup-title" for="share-text">Share this link with your friends! <CopyButton text={toShare.url} /></label>
        <textarea on:click={onTextAreaClick} use:autosize name="share-text" autocomplete="off" autocorrect="off" rows="1" cols="29" readonly
          >{toShare.url}</textarea>
      {:else}
        <div class="popup-title">Share the following with your friends!</div>
        <label for="share-url" class="popup-subtitle">Link only: <CopyButton text={toShare.url || ''} /></label>
        <textarea on:click={onTextAreaClick} use:autosize name="share-url" autocomplete="off" autocorrect="off" rows="1" cols="29" readonly
          >{toShare.url}</textarea>
        <label for="share-text" class="popup-subtitle">With text: <CopyButton text={textAreaContent || ''} /></label>
        <textarea
          class:error={toShare instanceof Error}
          on:click={onTextAreaClick}
          use:autosize
          name="share-text"
          autocomplete="off"
          autocorrect="off"
          cols="29"
          readonly>{textAreaContent}</textarea>
      {/if}
    </div>
  </div>
{/if}

<style>
  .button {
    width: calc(100% - 1em);
    height: 100%;
  }

  .button.small {
    width: max-content;
  }

  .button.small > button {
    padding-right: 0.4em;
  }

  button {
    margin: 0;
    padding: 0;
    background: none;
    width: 100%;
    height: 100%;
    border: none;
    color: inherit;
    text-align: left;
    display: flex;
    align-items: center;
    transition: color 0.1s ease-in;
    cursor: pointer;
  }

  button:hover {
    color: var(--color-heading);
  }

  :global(.share-icon) {
    margin-bottom: 0.2em;
    margin-left: 0.4em;
  }

  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .popup-title {
    color: var(--color-body);
    font-weight: bold;
    font-family: var(--font-body);
    margin-bottom: 0.6em;
  }

  .popup-subtitle {
    font-family: var(--font-body);
    color: var(--color-body);
  }

  textarea {
    resize: none;
    border: none;
    -webkit-appearance: none;
    width: 100%;
    overflow: hidden;
    word-wrap: break-word;
    color: var(--color-body);
    font-family: 'Cutive Mono', 'Courier New', monospace;
    letter-spacing: -0.1em;
    font-size: 1.1em;
    padding: 0 0.6em;
    transition: color 0.1s ease-in;
    background: none;
    line-height: 1.2;
    margin-top: 0.2em;
    margin-bottom: 0.4em;
  }

  textarea:hover {
    color: var(--color-heading);
  }

  .absolute {
    position: absolute;
    top: calc(var(--position-y) - 5.8em);
    left: var(--position-x);
    width: var(--width);
    height: calc(100% - var(--position) + 3em);
  }

  .popup {
    --padding: 1em;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border-radius: var(--padding);
    padding: var(--padding);
    border: 0.2em solid var(--color-body);
  }

  textarea.error,
  textarea.error:hover {
    color: var(--color-danger);
  }

  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }

  :global(.share-icon--loading) {
    animation: spin 2s linear infinite;
  }
</style>
