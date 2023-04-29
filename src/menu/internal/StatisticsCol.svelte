<script lang="ts" context="module">
  import type { Statistics, Counts } from '$game/statistics';
  import type { GamemodeName } from '$game/gamemode';

  const display: Record<keyof Statistics, string> = {
    fastestWinDuration: 'fastest win',
    gamemode: 'gamemode',
    numAttempts: 'attempt',
    numWins: 'win',
    numLosses: 'loss',
  };

  const shareable: Record<GamemodeName | 'total', Array<keyof Statistics>> = {
    random: ['numWins'],
    'random-timer': ['fastestWinDuration'],
    'same-square': ['fastestWinDuration'],
    total: ['numWins', 'numAttempts'],
  };

  function isShareable(s: Counts | Statistics, key: keyof Statistics) {
    if ('gamemode' in s) {
      return shareable[s.gamemode].includes(key);
    }
    return shareable['total'].includes(key);
  }

  function makePlural(s: string, count: number): string {
    if (count === 1) {
      return s;
    }

    if (s.endsWith('s')) {
      return s + 'es';
    }

    return s + 's';
  }

  async function getShareContent(s: Counts | Statistics, key: keyof Statistics, { protocol, host }: Location): Promise<ShareData> {
    if ('gamemode' in s) {
      return {
        title: 'Mock.',
        text: 'This is a mock share.',
        url: `${protocol}//${host}`,
      };
    }

    return {
      title: 'Pop the grid!',
      text: `I have ${s[key as keyof Counts]} ${makePlural(display[key], s[key as keyof Counts] as number)} by now, can you beat me?`,
      url: `${protocol}//${host}`,
    };
  }
</script>

<script lang="ts">
  import type { KeyOfUnion } from '$util/index';
  import Share from './Share.svelte';

  type T = $$Generic<Counts | Statistics>;
  type K = KeyOfUnion<T>;

  export let statistics: T;
  export let key: K;
  export let processor: ((key: T[K]) => string) | undefined = undefined;

  $: processed = processor ? processor(statistics[key]) : statistics[key];
</script>

{#if isShareable(statistics, key) && statistics[key]}
  <Share data={() => getShareContent(statistics, key, window.location)}>{processed}</Share>
{:else}
  {processed}
{/if}

<style>
</style>
