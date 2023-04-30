<script context="module" lang="ts">
  import { type Option } from './Fieldset.svelte';
  import { entries, keys } from '$util/objects';
  import { type GamemodeSetWhen } from '$game';
  import { type GamemodeName } from '$game/gamemode';
  import { gamemodes } from '../../gamemode';
  import { createMediaMatcher } from './media';

  const getGamemodeOptions = (): Option<GamemodeName | 'random-pick'>[] => {
    const options: Option<GamemodeName | 'random-pick'>[] = entries(gamemodes).map(([value, { display }]) => ({
      display,
      value,
    }));
    options.push({
      value: 'random-pick',
      display: 'Random',
    });
    return options;
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
  import { randInt, wait } from '$util/index';
  import { fade } from 'svelte/transition';
  import { getContext } from '../context';

  const { game, gamemode, nextGamemode } = getContext();

  let waitPromise: Promise<void> | undefined;
  let when: GamemodeSetWhen | undefined;
  let selectedValue: GamemodeName | 'random-pick' = $nextGamemode;

  const onChange = () => {
    if (selectedValue === 'random-pick') {
      const choices = keys(gamemodes).filter((v) => v !== $nextGamemode);
      $nextGamemode = selectedValue = choices[randInt(choices.length)];
    } else {
      $nextGamemode = selectedValue;
    }

    when = game.setGamemode(gamemodes[$nextGamemode].create());
    if (when === 'now') {
      $gamemode = $nextGamemode;
    }
    waitPromise = wait(2000);
  };
</script>

<Fieldset name="gamemode" {options} bind:selectedValue let:value on:change={onChange}>
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
