<script module lang="ts">
  import { isDefined } from '$util/index.ts';
  import { createFlag } from '$util/storage.svelte.ts';
  import { duration } from './internal/duration.ts';
  import type { GameRecord } from '$share/record.ts';
  import { getRecordDelta } from './record.ts';

  const getRecordPrompt = (attempts: Attempts, record: GameRecord): string | undefined => {
    const result = getRecordDelta(attempts, record);
    if (!isDefined(result)) {
      if (attempts.ongoing) {
        return 'Hang tight...';
      }
      return 'Not yet there...';
    }

    const [delta, isTime] = result;

    if (delta > 0) {
      if (isTime) {
        return `${duration(delta)} behind!`;
      }

      return `${delta} attempts behind!`;
    }

    if (delta < 0) {
      return `You've beaten ${record.name || 'them'}!`;
    }

    return `You're now equal.`;
  };

  const { mark: markOpenedMenu, get: openedMenu } = createFlag('openedMenu');
</script>

<script lang="ts">
  import Edit from 'svelte-material-icons/PuzzleEdit.svelte';
  import Win from 'svelte-material-icons/Trophy.svelte';
  import { Modal } from '$components/Modal.ts';
  import Menu from './Menu.svelte';
  import { Component } from '$components/internal/Component.ts';
  import { createEventStore, isTransitionEvent } from './internal/event.ts';
  import { Confetti } from 'svelte-confetti';
  import { fade } from 'svelte/transition';
  import { contextKey, getContext, type Attempts } from './context.ts';
  import { gamemodes } from '../gamemode.ts';
  import { pause, resume } from '$game/ops.ts';
  import { mount } from 'svelte';

  const context = getContext();

  const { game, gamemode, record, attempts } = context;
  const event = game.events;
  const eventOutput = createEventStore(event, { short: true });

  let disabled = $state(false);

  const handler = async () => {
    if (disabled || isError) {
      return;
    }

    disabled = true;

    const token = pause(game);
    const modal = new Modal({
      content: (target) =>
        mount(Menu, {
          target,
          context: new Map([[contextKey, context]]),
        }),
      allowClose: true,
      animateClose: true,
      afterClose() {
        markOpenedMenu();
        resume(game, token);
      },
    });

    await modal.create(Component.body, true);

    disabled = false;
  };

  let isError = $derived($event.name === 'error');
  let recordPrompt = $derived(record && $attempts.last?.gamemode === record.gamemode ? getRecordPrompt($attempts, record) : undefined);
  let isEnd = $derived((isTransitionEvent($event) && $event.to === 'win') || ($event.name === 'transitionstart' && $event.from === 'win'));
  let display = $derived(isError ? 'Something went wrong' : recordPrompt && isEnd ? recordPrompt : gamemodes[$gamemode].display);
  let isWin = $derived(isEnd && (recordPrompt ? recordPrompt?.includes('beaten') : !record));
  let highlight = $derived(!openedMenu() && ($event.name === 'error' || ($event.name === 'transitionend' && $event.to === 'ready')));
</script>

<button {disabled} class:error={isError} class:highlight class:win={isWin} class="noselect" onclick={handler}>
  {#if isWin}
    <div transition:fade={{ duration: 100 }}>
      <Win class="your-game-icon" />
      <span>{recordPrompt ? recordPrompt : 'You won!'}</span>
      <span class="confetti">
        {#if recordPrompt}
          <Confetti delay={[200, 3000]} cone amount={500} />
        {:else}
          <Confetti />
        {/if}
      </span>
    </div>
  {:else}
    <div transition:fade={{ duration: 100 }}>
      <Edit class="your-game-icon" />
      <span>{display}{recordPrompt && isEnd ? '' : ` • ${$eventOutput.message}`}</span>
    </div>
  {/if}
</button>

<style>
  button {
    background: none;
    border: none;
    border-radius: 0.5em;
    margin: 0;
    color: var(--color-body);
    font-family: var(--font-body);
    display: grid;
    font-size: 1em;
    padding: 0.6em 1em;
    cursor: pointer;
    transition:
      all 0.1s ease-in,
      background-color 0.6s ease-out;
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
    filter: drop-shadow(0 0 0.02em var(--color-heading));
    color: var(--color-heading);
  }

  button:disabled.error {
    color: var(--color-danger);
    filter: drop-shadow(0 0 0.03em var(--color-danger));
  }

  button.highlight {
    background-color: color-mix(in srgb, var(--color-heading) 10%, transparent 100%);
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
