<script context="module" lang="ts">
  import { type Option } from './Fieldset.svelte';
  import { entries } from '$util/objects';
  import { type GamemodeSetWhen } from '$game';
  import { type GamemodeName } from '$game/gamemode';
  import { gamemodes } from '../../gamemode';
  import { readable } from 'svelte/store';

  const getGamemodeOptions = (): Option<GamemodeName>[] => {
    return entries(gamemodes).map(([value, { display }]) => ({
      display,
      value,
    }));
  };

  const getWhenDisplay = (when: GamemodeSetWhen, isWide: boolean) => {
    switch (when) {
      case 'now':
        if (isWide) {
          return 'Set!';
        }
        return 'set now!';
      case 'next-game':
        if (isWide) {
          return 'Set for the next game!';
        }
        return 'set for next game!';
    }
  };

  const options = getGamemodeOptions();
  const isWide = createMediaMatcher('(min-width: 600px)');
</script>

<script lang="ts">
  import Fieldset from './Fieldset.svelte';
  import { wait } from '$util/index';
  import { fade } from 'svelte/transition';
  import { getContext } from '../context';

  const { game, gamemode, nextGamemode } = getContext();

  let waitPromise: Promise<void> | undefined;
  let when: GamemodeSetWhen | undefined;

  const onChange = () => {
    when = game.setGamemode(gamemodes[$nextGamemode].create());
    if (when === 'now') {
      $gamemode = $nextGamemode;
    }
    waitPromise = wait(2000);
  };
</script>

<Fieldset name="gamemode" {options} bind:selectedValue={$nextGamemode} let:value on:change={onChange}>
  <span slot="legend">
    Gamemode{#if !$isWide && when}
      {#await waitPromise}
        <span transition:fade={{ duration: 100 }} class="confirmation" class:next-game={when === 'next-game'}
          >{' '}({getWhenDisplay(when, $isWide)})</span
        >{/await}{/if}:
  </span>
  {#if $isWide && value === $nextGamemode && when}
    {#await waitPromise}
      <p transition:fade={{ duration: 100 }} class="confirmation" class:next-game={when === 'next-game'}>{getWhenDisplay(when, $isWide)}</p>
    {/await}
  {/if}
</Fieldset>

<style>
  .confirmation {
    color: var(--color-assurance);
  }

  p {
    margin-left: 1em;
  }

  .next-game {
    color: #f4fd1f;
    opacity: 90%;
  }
</style>
