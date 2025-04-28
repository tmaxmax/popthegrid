<script lang="ts">
  import { type ShareContentParams, isShareable, getShareContent } from './share.ts';
  import type { Statistics, Counts } from '$game/statistics.ts';
  import { getContext } from '../context.ts';
  import { type KeyOfUnion } from '$util/index.ts';
  import Share from './Share.svelte';

  type T = $$Generic<Counts | Statistics>;
  type K = KeyOfUnion<T>;

  interface Props {
    statistics: T;
    key: Exclude<K, 'gamemode' | 'when'>;
    processor?: ((key: T[K]) => string) | undefined;
  }

  let { statistics, key, processor = undefined }: Props = $props();

  const { theme, name, database, sessionStatus } = getContext();
  let data = $derived.by<ShareContentParams | undefined>(() => {
    if (statistics[key]) {
      return {
        record: {
          gamemode: 'gamemode' in statistics ? statistics.gamemode : undefined,
          theme: $theme,
          name: $name,
          data: {
            [key]: statistics[key],
          },
          when: statistics.when,
          attemptID: 'gamemode' in statistics ? statistics.attemptID : undefined,
        },
        location: window.location,
      };
    }
  });

  let processed = $derived(processor ? processor(statistics[key]) : statistics[key]);
</script>

<!-- TODO: better way of signaling that one cannot yet share. -->
{#if isShareable(statistics, key) && data && ($sessionStatus === 'valid' || $sessionStatus === 'error')}
  <Share data={() => getShareContent(database, data, $sessionStatus === 'valid')}>{processed}</Share>
{:else}
  {processed}
{/if}
