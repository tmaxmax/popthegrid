<script context="module" lang="ts">
  import type { Statistics } from '$game/statistics';
  import type { GameRecord } from '$edge/share';
  import { isDefined } from '$util/index';
  import type { Event } from '$game';

  const getRecordDelta = ({ statistics, last, ongoing }: Attempts, record: GameRecord): [number, boolean] | undefined => {
    const stat = statistics.find((v) => 'gamemode' in v && record.gamemode === v.gamemode) as Statistics | undefined;
    if (!stat || !last?.isWin || ongoing) {
      return undefined;
    }

    if ('numWins' in record.data) {
      return [record.data.numWins - stat.numWins, false];
    }

    if ('fastestWinDuration' in record.data) {
      return [last!.duration - record.data.fastestWinDuration, true];
    }

    // TODO: Add here new records when necessary. This could surely be cleaner.

    return undefined;
  };

  const isTransitionEvent = (e: Event): e is Extract<Event, { name: `transition${string}` }> => {
    return e.name.startsWith('transition');
  };

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
</script>

<script lang="ts">
  import Edit from 'svelte-material-icons/PuzzleEdit.svelte';
  import Win from 'svelte-material-icons/Trophy.svelte';
  import { Modal } from '$components/Modal';
  import Menu from './Menu.svelte';
  import { Component } from '$components/internal/Component';
  import { createEventStore } from './internal/event';
  // @ts-expect-error Library has no type definitions.
  import { Confetti } from 'svelte-confetti';
  import { fade } from 'svelte/transition';
  import { contextKey, getContext, type Attempts } from './context';
  import { gamemodes } from '../gamemode';
  import { duration } from './internal/duration';
  import { pause, resume } from '$game/pause';
  import Interval from './internal/Interval.svelte';

  const context = getContext();

  const { game, gamemode, record, attempts } = context;
  const event = game.events;
  const eventOutput = createEventStore(event, { short: true });

  $: isError = $event.name === 'error';
  $: recordPrompt = record && $attempts.last?.gamemode === record.gamemode ? getRecordPrompt($attempts, record) : undefined;
  $: display = isError ? 'Something went wrong' : recordPrompt && isEnd ? recordPrompt : gamemodes[$gamemode].display;
  $: isEnd = (isTransitionEvent($event) && $event.to === 'win') || ($event.name === 'transitionstart' && $event.from === 'win');
  $: isWin = isEnd && (recordPrompt ? recordPrompt?.includes('beaten') : !record);
  $: showInterval = isTransitionEvent($event) && $event.to === 'ongoing';

  let disabled = false;

  let intervalPause: (() => void) | undefined;
  let intervalResume: (() => void) | undefined;
  let currentTime = 0;

  $: if (!(isTransitionEvent($event) && ($event.to === 'ongoing' || ($event.to === 'pause' && $event.from === 'ongoing')))) {
    console.log('Reset:', $event);
    currentTime = 0;
  }

  const handler = async () => {
    if (disabled || isError) {
      return;
    }

    disabled = true;

    const token = pause(game);
    intervalPause?.();

    const modal = new Modal({
      content: (target) => new Menu({ target, context: new Map([[contextKey, context]]) }),
      allowClose: true,
      animateClose: true,
      afterClose() {
        resume(game, token);
        intervalResume?.();
      },
    });

    await modal.create(Component.body, true);

    disabled = false;
  };
</script>

<button {disabled} class:error={isError} class:win={isWin} on:click={handler}>
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
      <span
        >{display}{recordPrompt && isEnd ? '' : ` • `}{#if showInterval}<Interval
            bind:pause={intervalPause}
            bind:resume={intervalResume}
            bind:currentTime />{:else}{$eventOutput.message}{/if}</span>
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
