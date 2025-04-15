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
  import { solveChallenge, type Challenge, type Payload } from './altcha.ts';
  import { derived } from 'svelte/store';

  const { game, record, sessionStatus } = getContext();
  const events = createEventStore(game.events);

  const requiresChallenge = derived(sessionStatus, (v) => v === 'none' || v === 'error');

  onMount(() => {
    // TODO: Make all this happen when game starts and on relevant interactions.

    if (!$requiresChallenge) {
      return;
    }

    let intervalID: number;

    const log = baseLog.extend('Session');
    const refreshFn = async () => {
      try {
        let payload: string | null = null;
        if ($requiresChallenge) {
          log('Requesting challenge');

          const res = await fetch('/session', { method: 'GET', credentials: 'same-origin' });
          if (!res.ok) {
            throw new Error('failed to fetch challenge', { cause: await res.text() });
          }

          const data: Challenge = await res.json();

          log('Solving challenge', data);

          const solution = await solveChallenge(data);
          if (solution === null) {
            throw new Error('failed to get solution');
          }

          payload = JSON.stringify({
            algorithm: data.algorithm,
            challenge: data.challenge,
            number: solution.number,
            salt: data.salt,
            signature: data.signature,
            took: solution.took,
          } satisfies Payload);
        }

        log('Refreshing session');

        const res = await fetch('/session', {
          method: 'POST',
          body: payload,
          credentials: 'same-origin',
        });
        if (!res.ok) {
          throw new Error('failed to get session', { cause: await res.text() });
        }

        $sessionStatus = 'valid';

        log('Success');
      } catch (err) {
        console.error(err);
        $sessionStatus = 'error';
        clearInterval(intervalID);
      }
    };

    intervalID = setInterval(refreshFn, import.meta.env.VITE_SESSION_EXPIRY * 50 * 1000) as any;

    refreshFn();
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
