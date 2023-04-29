<script lang="ts" context="module">
  import { writable } from 'svelte/store';

  interface Modal {
    close(): void;
  }

  const modal = writable<Modal | undefined>();
</script>

<script lang="ts">
  import Share from 'svelte-material-icons/Share.svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { clickoutside } from '@svelte-put/clickoutside';
  // @ts-expect-error this library does not have types.
  import autosize from 'svelte-autosize';

  export let data: () => Promise<ShareData>;

  let clicked = false;
  let toShare: ShareData | undefined;
  let resolvePopUp: (() => void) | undefined;
  let popUpPosition: { x: number; y: number } | undefined;

  const popUpWidth = 20 * 16;
  const modalMargin = 2 * 16;

  const onClick = async (e: MouseEvent) => {
    if (clicked) {
      return;
    }

    clicked = true;
    toShare = await data();

    await new Promise<void>((resolve) => {
      $modal?.close();
      $modal = { close: resolve };
      let x = e.clientX - popUpWidth / 2;
      if (x - modalMargin < 0) {
        x = modalMargin;
      } else if (e.clientX + popUpWidth / 2 > window.innerWidth - modalMargin) {
        x = window.innerWidth - modalMargin - popUpWidth;
      }
      popUpPosition = { x, y: e.clientY };
      console.log({ popUpPosition });
      resolvePopUp = resolve;
    });

    clicked = false;
    toShare = resolvePopUp = popUpPosition = undefined;
  };

  const onTextAreaClick = (e: Event) => {
    (e.target as HTMLTextAreaElement).select();
  };
</script>

<div class="button">
  <button on:click|stopPropagation={onClick}><slot /><Share class="share-icon" /></button>
</div>
{#if resolvePopUp && toShare && popUpPosition}
  <div class="absolute" style="--width: {popUpWidth}px; --position-x: {popUpPosition.x}px; --position-y: {popUpPosition.y}px">
    <div class="popup" transition:fade={{ duration: 400, easing: cubicOut }} use:clickoutside on:clickoutside={resolvePopUp}>
      <label for="share-text">
        {#if toShare.url && !(toShare.text || toShare.title)}
          Share this link with your friends!
        {:else}
          Share the following with your friends!
        {/if}
      </label>
      <textarea on:click={onTextAreaClick} use:autosize name="share-text" autocomplete="off" autocorrect="off" cols="29" readonly
        >{toShare.text}{'\n'}{toShare.url}</textarea>
    </div>
  </div>
{/if}

<style>
  .button {
    width: calc(100% - 1em);
    height: 100%;
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

  textarea {
    resize: none;
    border: none;
    -webkit-appearance: none;
    height: fit-content;
    width: 100%;
    color: var(--color-body);
    font-family: 'Cutive Mono', 'Courier New', monospace;
    letter-spacing: -0.1em;
    font-size: 1.1em;
    padding-top: 0.2em;
    padding-left: 0.6em;
    padding-right: 0.6em;
    transition: color 0.1s ease-in;
    background: none;
  }

  textarea:hover {
    color: var(--color-heading);
  }

  .absolute {
    --height: 12em;
    position: absolute;
    top: calc(var(--position-y) - 4em);
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
</style>
