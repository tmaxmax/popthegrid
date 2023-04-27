<script lang="ts">
  import Edit from 'svelte-material-icons/PuzzleEdit.svelte';
  import Win from 'svelte-material-icons/Trophy.svelte';
  import { Modal } from '$components/Modal';
  import Menu from './Menu.svelte';
  import { Component } from '$components/internal/Component';
  import { type ComponentProps } from 'svelte';
  import { createEventStore } from './internal/event';
  // @ts-expect-error Library has no type definitions.
  import { Confetti } from 'svelte-confetti';
  import { fade } from 'svelte/transition';

  export let props: ComponentProps<Menu>;

  const { game } = props;
  const event = game.events;
  const eventOutput = createEventStore(event, { short: true });

  $: isError = $event.name === 'error';
  $: display = isError ? 'Something went wrong' : 'Your game';
  $: isWin =
    (($event.name === 'transitionstart' || $event.name === 'transitionend') && $event.to === 'win') ||
    ($event.name === 'transitionstart' && $event.from === 'win');

  let disabled = false;

  const handler = async () => {
    if (disabled || isError) {
      return;
    }

    disabled = true;

    const modal = new Modal({
      content: (target) => new Menu({ target, props }),
      allowClose: true,
      animateClose: true,
      afterClose() {
        if ($event.name !== 'transitionstart') {
          game.resume();
        }
      },
    });

    if ($event.name === 'transitionstart') {
      if ($event.to === 'ongoing') {
        await new Promise<void>((resolve, reject) => {
          const unsubscribe = event.subscribe((e) => {
            if (e.name === 'transitionend' && e.to === 'ongoing') {
              resolve();
            } else {
              reject(e);
            }

            unsubscribe();
          });
        });

        await game.pause();
      }
    } else {
      await game.pause();
    }

    await modal.create(Component.body, true);

    disabled = false;
  };
</script>

<button {disabled} class:error={isError} class:win={isWin} on:click={handler}>
  {#if isWin}
    <div transition:fade={{ duration: 100 }}>
      <Win class="your-game-icon" />
      <span>You won!</span>
      <span class="confetti"><Confetti /></span>
    </div>
  {:else}
    <div transition:fade={{ duration: 100 }}>
      <Edit class="your-game-icon" />
      <span>{display} • {$eventOutput.message}</span>
    </div>
  {/if}
</button>

<style>
  button {
    background: none;
    border: none;
    margin: 0;
    color: var(--color-body);
    font-family: var(--font-body);
    display: grid;
    font-size: 1em;
    padding: 0.6em 1em;
    cursor: pointer;
    transition: all 0.1s ease-in;
  }

  button.win {
    color: var(--color-assurance);
  }

  div {
    display: flex;
    align-items: center;
    justify-content: center;
    grid-area: 1 / 1 / 2 / 2;
    position: relative;
  }

  .confetti {
    position: absolute;
    left: 50%;
  }

  button:disabled {
    cursor: default;
  }

  button:hover,
  button:disabled:not(.error) {
    filter: drop-shadow(0 0 0.03em var(--color-heading));
    color: var(--color-heading);
  }

  button:disabled.error {
    color: var(--color-danger);
    filter: drop-shadow(0 0 0.03em var(--color-danger));
  }

  span {
    margin-left: 0.4em;
    margin-top: 0.12em;
  }

  :global(.your-game-icon) {
    width: 1.2em;
    height: 1.2em;
  }
</style>
