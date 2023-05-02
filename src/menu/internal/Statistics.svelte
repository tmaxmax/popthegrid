<script lang="ts" context="module">
  import { duration } from './duration';
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
</script>

<script lang="ts">
  import { gamemodes } from '../../gamemode';
  import { getContext } from '../context';
  import StatisticsCol from './StatisticsCol.svelte';
  import type { GamemodeName } from '$game/gamemode';
  import { getShareContent, isShareable, type ShareContentParams } from './share';
  import Share from './Share.svelte';

  const { attempts, database, theme, name } = getContext();

  let layout: HTMLElement | undefined;
  $: overflows = layout ? layout.scrollWidth > layout.clientWidth : false;

  $: last = $attempts.last;
  $: [total, ...rest] = $attempts.statistics;
  $: statForAttempt = last ? $attempts.statistics.find((v) => 'gamemode' in v && v.gamemode === last!.gamemode) : undefined;
  $: isShareableStat = last && statForAttempt ? isShareable(statForAttempt, 'fastestWinDuration') : false;

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
      },
      location: window.location,
    };

    return getShareContent(database, shareData);
  };
</script>

{#if total && last}
  <p class="caption last-attempt">Here's your last attempt:</p>
  <ul>
    <li>Gamemode: {gamemodes[last.gamemode].display}</li>
    <li>
      {#if isShareableStat && last.isWin}
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
  <p class="share bottom">
    Note that you can share with your friends some of the statistics – tap or click the available Share buttons!{#if overflows}{' '}Scroll
      to the left for more.{/if}
  </p>
{:else}
  <p class="bottom">Nothing to show, go pop the grid!</p>
{/if}

<style>
  div {
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

  .bottom {
    margin-bottom: 2.4em;
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
</style>
