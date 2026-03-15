<script lang="ts" module>
  import { duration } from './duration.ts';
  import humanDate from 'human-date';

  const durationProcessor = (n?: number | GamemodeName | Date) => {
    // I don't have enough patience to fix the types.
    if (!n) return '-';
    if (typeof n !== 'number') throw new Error('Something went wrong.');
    return duration(n);
  };

  const getFriendlyDate = (date: Date) => {
    const relative = humanDate.relativeTime(date, {
      presentText: 'just now',
    });
    if (relative.includes('weeks')) {
      return `on ${humanDate.prettyPrint(date)}`;
    }
    return relative;
  };

  const chromeURL = 'https://support.google.com/chrome/answer/9658361';
  const safariURL = navigator.userAgent.includes('iPhone')
    ? 'https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios'
    : navigator.userAgent.includes('Mac') && 'ontouchend' in document
      ? 'https://support.apple.com/en-gb/guide/ipad/ipad8f1f7a29/ipados'
      : 'https://support.apple.com/guide/safari/add-to-dock-ibrw9e991864/mac';

  let persistenceSucceeded: boolean | null = $state(null);
</script>

<script lang="ts">
  import { gamemodes } from '../../gamemode.ts';
  import { getContext } from '../context.ts';
  import StatisticsCol from './StatisticsCol.svelte';
  import type { GamemodeName } from '$game/gamemode/index.ts';
  import { getShareContent, isShareable, type ShareContentParams } from './share.ts';
  import Share from './Share.svelte';

  const { attempts, database, theme, name, sessionStatus } = getContext();

  let layout: HTMLElement | undefined = $state();
  let overflows = $derived(layout ? layout.scrollWidth > layout.clientWidth : false);

  let last = $derived($attempts.last);
  let [total, ...rest] = $derived($attempts.statistics);
  let statForAttempt = $derived(last ? $attempts.statistics.find((v) => 'gamemode' in v && v.gamemode === last!.gamemode) : undefined);
  let isShareableStat = $derived(last && statForAttempt ? isShareable(statForAttempt, 'fastestWinDuration') : false);

  const getShareData = () => {
    const shareData: ShareContentParams = {
      record: {
        gamemode: last!.gamemode,
        theme: $theme,
        name: $name,
        data: {
          fastestWinDuration: last!.duration,
        },
        when: last!.startedAt,
        attemptID: last!.serverID,
      },
      location: window.location,
    };

    return getShareContent(database, shareData, $sessionStatus === 'valid');
  };

  const requestPersistence = async () => {
    persistenceSucceeded = await navigator.storage.persist();
  };
</script>

{#if total && last}
  {#await navigator.storage.persisted() then persisted}
    {#if !persisted && !persistenceSucceeded}
      <div class="persistence">
        <div>
          {#if persistenceSucceeded === null}
            <p class="caption">
              <span class="warn">Warning:</span>
              When you will leave Pop the grid! your games will be deleted by default. Press this button to prevent that!
            </p>
          {:else}
            <p class="caption warn">Persisting has not succeeded.</p>
            <p class="caption">
              On <a href={chromeURL} target="_blank" class="external">Chrome</a> and
              <a href={safariURL} target="_blank" class="external">Safari</a>
              and others you can try to turn the website into an app.
            </p>
            <p class="caption">If you are tech savvy, you can also go to settings and enable persistent storage.</p>
          {/if}
        </div>
        {#if persistenceSucceeded === null}
          <button class="persist" onclick={requestPersistence}> Persist my games </button>
        {/if}
      </div>
    {/if}
  {/await}
  <p class="caption last-attempt">Here's your last attempt:</p>
  <ul>
    <li>Gamemode: {gamemodes[last.gamemode].display}</li>
    <li>
      {#if isShareableStat && last.isWin && ($sessionStatus === 'valid' || $sessionStatus === 'error')}
        <Share small data={getShareData}>Duration: {duration(last.duration)}</Share>
      {:else}
        Duration: {duration(last.duration)}
      {/if}
    </li>
    <li>Played {getFriendlyDate(last.startedAt)}</li>
    {#if last.gamemode !== 'passthrough'}
      <li>{last.isWin ? 'You won' : 'You lost'}.</li>
    {/if}
  </ul>
  <p class="caption">Here's how you've been holding up overall:</p>
  <div bind:this={layout}>
    <table>
      <thead>
        <tr>
          <th>Gamemode</th>
          <th class="count">Attempts</th>
          <th class="count">Wins</th>
          <th class="count">Losses</th>
          <th>Fastest win</th>
        </tr>
      </thead>
      <tbody>
        {#each rest as s (s.gamemode)}
          <tr>
            <td>{gamemodes[s.gamemode].display}</td>
            <td class="count"><StatisticsCol statistics={s} key="numAttempts" /></td>
            <td class="count"><StatisticsCol statistics={s} key="numWins" /></td>
            <td class="count"><StatisticsCol statistics={s} key="numLosses" /></td>
            <td><StatisticsCol statistics={s} key={'fastestWinDuration'} processor={durationProcessor} /></td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <td class="total">Total</td>
          <td class="count"><StatisticsCol statistics={total} key="numAttempts" /></td>
          <td class="count"><StatisticsCol statistics={total} key="numWins" /></td>
          <td class="count"><StatisticsCol statistics={total} key="numLosses" /></td>
          <td>-</td>
        </tr>
      </tfoot>
    </table>
  </div>
  <p class="share">
    Note that you can share with your friends some of the statistics – tap or click the available Share buttons!{#if overflows}{' '}Scroll
      to the left for more.{/if}
  </p>
{:else}
  <p>Nothing to show, go pop the grid!</p>
{/if}

<style>
  :not(.persistence) div {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 0.6em;
  }

  table {
    --padding: 0.2em;
    color: var(--color-body);
    font-family: var(--font-body);
    width: 100%;
    border-collapse: collapse;
  }

  .caption {
    margin-bottom: 0.2em;
  }

  thead {
    text-align: left;
  }

  thead tr {
    padding-top: var(--padding);
  }

  tr {
    display: flex;
  }

  tbody tr {
    padding-top: var(--padding);
    padding-bottom: var(--padding);
  }

  tfoot tr {
    padding-top: var(--padding);
    font-weight: bold;
  }

  th,
  td {
    flex-grow: 2;
    flex-basis: 0;
    min-width: 8em;
  }

  .count {
    flex-grow: 1;
    flex-shrink: 1;
    min-width: 5.8em;
  }

  .share {
    margin-top: 0.6em;
  }

  p.last-attempt {
    margin-bottom: 0;
  }

  ul {
    margin-bottom: 1em;
    color: var(--color-body);
    font-family: var(--font-body);
    list-style: disc;
  }

  li {
    margin-top: 0.2em;
    margin-left: 1.3em;
  }

  .persistence {
    margin-bottom: 0.8em;
  }

  .warn {
    font-weight: bold;
    color: var(--color-danger);
  }

  .persist {
    background: none;
    border: 3px solid var(--color-body);
    font-family: var(--font-heading);
    color: var(--color-body);
    padding: 0.4em 1em;
    min-width: max-content;
    height: fit-content;
    flex: 0 0 auto;
    border-radius: 0.4em;
    margin-left: auto;
    margin: 0.3em 0 0.6em 0;
    cursor: pointer;
  }

  .persist:hover {
    color: var(--color-heading);
  }

  .caption.bold {
    color: var(--color-heading);
    font-weight: bold;
  }

  .external {
    color: var(--color-body);
    text-decoration: none;
    font-weight: bold;
  }

  .external:visited {
    color: var(--color-body);
  }

  .external:hover {
    color: var(--color-heading);
    text-decoration: underline;
  }

  @media (min-width: 560px) {
    .persistence {
      display: flex;
      column-gap: 1em;
    }
  }
</style>
