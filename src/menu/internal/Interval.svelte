<script lang="ts">
  import interval from '$util/time/interval';
  import { onDestroy } from 'svelte';
  import { duration } from './duration';

  export let refreshMs = 10;
  export let currentTime = 0;

  const c = new AbortController();
  const i = interval({
    interval: refreshMs,
    signal: c.signal,
    callback: ({ time, lastTime }) => {
      if (lastTime) {
        currentTime += time - lastTime;
      }
    },
  });

  export const pause = i.pause;
  export const resume = i.resume;

  onDestroy(() => {
    c.abort();
  });
</script>

{duration(currentTime, { keepDecimalsOnWholeSeconds: true })}
