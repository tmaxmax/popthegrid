<script context="module" lang="ts">
  import { type Option } from './Fieldset.svelte';
  import { type GameRecord } from '$edge/share';
  import { entries } from '$util/objects';
  import { type Game, type GamemodeSetWhen } from '$game';
  import { type GamemodeName } from '$game/gamemode';
  import { gamemodes } from '../../gamemode';
  import { readable, writable } from 'svelte/store';

  const currentGamemode = writable<GamemodeName | undefined>(undefined);

  const getGamemodeOptions = (record?: GameRecord): [GamemodeName, Option<GamemodeName>[]] => {
    const options = entries(gamemodes).map(([value, { display }]) => ({
      display,
      value,
    }));

    return [record ? record.gamemode : 'random', options];
  };

  const isWideMedia = window.matchMedia('(min-width: 600px)');

  const isWide = readable(isWideMedia.matches, (set) => {
    const callback = () => set(isWideMedia.matches);
    isWideMedia.addEventListener('change', callback);
    return () => isWideMedia.removeEventListener('change', callback);
  });

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
</script>

<script lang="ts">
  import Fieldset from './Fieldset.svelte';
  import { wait } from '$util/index';
  import { fade } from 'svelte/transition';

  // We assume that when this component is first created,
  // the game has either the record's gamemode or the
  // default, 'random'.

  export let game: Game;
  export let record: GameRecord | undefined;

  let [selectedGamemode, options] = getGamemodeOptions(record);

  if ($currentGamemode) {
    selectedGamemode = $currentGamemode;
  } else {
    $currentGamemode = selectedGamemode;
  }

  let waitPromise: Promise<void> | undefined;
  let when: GamemodeSetWhen | undefined;

  const onChange = () => {
    when = game.setGamemode(gamemodes[selectedGamemode].create());
    $currentGamemode = selectedGamemode;
    waitPromise = wait(2000);
  };
</script>

<Fieldset name="gamemode" {options} bind:selectedValue={selectedGamemode} let:value on:change={onChange}>
  <span slot="legend">
    Gamemode{#if !$isWide && when}
      {#await waitPromise}
        <span transition:fade={{ duration: 100 }} class="confirmation" class:next-game={when === 'next-game'}
          >{' '}({getWhenDisplay(when, $isWide)})</span
        >{/await}{/if}:
  </span>
  {#if $isWide && value === selectedGamemode && when}
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
