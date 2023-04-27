<script lang="ts">
  import NameInput from './internal/NameInput.svelte';
  import Gamemode from './internal/Gamemode.svelte';
  import { name } from './internal/name';
  import { createEventStore } from './internal/event';
  import { type Game } from '$game';
  import { type GameRecord } from '$edge/share';
  import { fade } from 'svelte/transition';
  import Theme from './internal/Theme.svelte';

  export let game: Game;
  export let record: GameRecord | undefined;

  const events = createEventStore(game.events);

  $: value = $name;
</script>

<section>
  <div class="align-name-input">
    <NameInput pretentious={!!record} bind:value on:change={() => ($name = value)} />
  </div>
  <p class="game-status" class:error={$events.isError}>
    {#key $events.message}
      <span transition:fade={{ duration: 100 }}>{$events.message}</span>
    {/key}
  </p>
  <h2>Settings</h2>
  <Gamemode {game} {record} />
  <Theme {record} />
  <h2>Statistics</h2>
</section>

<style>
  section {
    width: 100%;
    max-width: 920px;
    height: 100%;
    margin: 0 auto;
  }

  h2 {
    margin-top: 0.8em;
    margin-bottom: 0.4em;
  }

  .game-status {
    display: grid;
  }

  .game-status span {
    grid-area: 1 / 1 / 2 / 2;
  }

  @media (min-width: 560px) {
    section {
      padding: 0 0.6rem;
    }
  }
</style>
