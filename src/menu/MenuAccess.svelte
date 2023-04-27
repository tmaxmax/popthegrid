<script lang="ts">
  import Edit from 'svelte-material-icons/PuzzleEdit.svelte';
  import { type Game } from '$game';
  import { Modal } from '$components/Modal';
  import Menu from './Menu.svelte';
  import { Component } from '$components/internal/Component';

  export let game: Game;

  const event = game.events;

  $: isError = $event.name === 'error';
  $: display = isError ? 'Something went wrong' : 'Your game';

  let disabled = false;

  const handler = async () => {
    if (disabled || isError) {
      return;
    }

    disabled = true;

    const modal = new Modal({
      content: (target) => new Menu({ target, props: { game } }),
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

<button {disabled} class:error={isError} on:click={handler}>
  <Edit class="your-game-icon" />
  <span>{display}</span>
</button>

<style>
  button {
    background: none;
    border: none;
    margin: 0;
    color: var(--color-body);
    font-family: var(--font-body);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1em;
    padding: 0.6em 1em;
    cursor: pointer;
    transition: all 0.1s ease-in;
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
