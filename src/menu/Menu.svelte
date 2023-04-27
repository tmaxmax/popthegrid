<script lang="ts">
  import NameInput from './internal/NameInput.svelte';
  import { name } from './internal/name';
  import { createEventStore } from './internal/event';
  import { type Game } from '$game';

  export let game: Game;

  const events = createEventStore(game.events);

  $: value = $name;
</script>

<section>
  <div class="align-name-input">
    <NameInput bind:value on:change={() => ($name = value)} />
  </div>
  <p class:error={$events.isError}>{$events.message}</p>
  <h2>Settings</h2>
  <h2>Statistics</h2>
</section>

<style>
  section {
    width: 100%;
    max-width: 920px;
    height: 100%;
    margin: 0 auto;
  }

  .align-name-input {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  h2 {
    margin-top: 0.8em;
  }

  @media (min-width: 560px) {
    .align-name-input {
      display: block;
    }

    section {
      padding: 0 0.6rem;
    }
  }
</style>
