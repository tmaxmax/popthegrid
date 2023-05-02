<script lang="ts" context="module">
  import humanizeDuration from 'humanize-duration';

  const duration = humanizeDuration.humanizer({
    units: ['s'],
    maxDecimalPoints: 2,
    language: 'short',
    spacer: '',
    languages: {
      short: {
        s: () => 's',
      },
    },
  });

  const durationProcessor = (n?: number | GamemodeName | Date) => {
    // I don't have enough patience to fix the types.
    if (!n) return '-';
    if (typeof n !== 'number') throw new Error('Something went wrong.');
    return duration(n);
  };
</script>

<script lang="ts">
  import { gamemodes } from '../../gamemode';
  import { getContext } from '../context';
  import StatisticsCol from './StatisticsCol.svelte';
  import type { GamemodeName } from '$game/gamemode';

  const { statistics } = getContext();

  let layout: HTMLElement | undefined;
  $: overflows = layout ? layout.scrollWidth > layout.clientWidth : false;

  $: [total, ...rest] = $statistics;
</script>

{#if total}
  <p class="caption">Here's how you've been holding up:</p>
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
    margin-bottom: 0.4em;
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
</style>
