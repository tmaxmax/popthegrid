<script lang="ts">
  import { type ShareContentParams, isShareable, getShareContent } from './share';
  import type { Statistics, Counts } from '$game/statistics';
  import { getContext } from '../context';
  import { type KeyOfUnion } from '$util/index';
  import Share from './Share.svelte';

  type T = $$Generic<Counts | Statistics>;
  type K = KeyOfUnion<T>;

  export let statistics: T;
  export let key: Exclude<K, 'gamemode' | 'when'>;
  export let processor: ((key: T[K]) => string) | undefined = undefined;

  const { theme, name, database } = getContext();
  let data: ShareContentParams;

  $: processed = processor ? processor(statistics[key]) : statistics[key];

  $: if (statistics[key]) {
    data = {
      record: {
        gamemode: 'gamemode' in statistics ? statistics.gamemode : undefined,
        theme: $theme,
        name: $name,
        data: {
          [key]: statistics[key],
        },
        when: statistics.when,
      },
      location: window.location,
    };
  }
</script>

{#if isShareable(statistics, key) && statistics[key]}
  <Share data={() => getShareContent(database, data)}>{processed}</Share>
{:else}
  {processed}
{/if}
