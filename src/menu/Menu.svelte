<script lang="ts">
  import NameInput from './internal/NameInput.svelte';
  import Gamemode from './internal/Gamemode.svelte';
  import { createEventStore } from './internal/event.ts';
  import { fade } from 'svelte/transition';
  import Theme from './internal/Theme.svelte';
  import { getContext } from './context.ts';
  import SillyName from './internal/SillyName.svelte';
  import Statistics from './internal/Statistics.svelte';
  import PasteCode from './internal/PasteCode.svelte';
  import { onMount } from 'svelte';
  import baseLog from '$util/log.ts';

  const { game, record, sessionIntervalID } = getContext();
  const events = createEventStore(game.events);

  onMount(async () => {
    if ($sessionIntervalID != null) {
      return;
    }

    const log = baseLog.extend('Session');
    const refreshFn = async () => {
      log('refreshing session');
      const resp = await fetch('/session', { method: 'POST', credentials: 'same-origin' });
      if (!resp.ok) {
        const err = await resp.json();
        console.error(err);
      }
    };

    $sessionIntervalID = setInterval(refreshFn, import.meta.env.VITE_SESSION_EXPIRY * 50 * 1000);
    await refreshFn();
  });
</script>

<section>
  <div class="align-name-input">
    <NameInput pretentious={!!record} />
  </div>
  <p class="game-status" class:error={$events.isError}>
    {#key $events.message}
      <span transition:fade={{ duration: 100 }}>{$events.message}</span>
    {/key}
  </p>
  <h2>Settings</h2>
  <Gamemode />
  <Theme />
  <h2>Statistics</h2>
  <Statistics />
  <h2>Paste link</h2>
  <p>This will take you directly to the challenge!</p>
  <PasteCode />
  <SillyName />
</section>

<style>
  section {
    width: 100%;
    max-width: 920px;
    min-height: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    padding-top: 3rem;
    padding-bottom: 3rem;
    overflow: auto;
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
      padding: 3rem 0.6rem;
    }
  }
</style>
