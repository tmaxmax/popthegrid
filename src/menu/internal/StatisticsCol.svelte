<script lang="ts" context="module">
  import { findCachedLink, type CodeInfo, cacheLink } from '$db/link';

  import { entries } from '$util/objects';
  import type { Code, ThemeName } from '$edge/share';
  import type { Statistics, Counts } from '$game/statistics';
  import type { GamemodeName } from '$game/gamemode';

  const display: Record<Exclude<keyof Statistics, 'when'>, string> = {
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

  interface ShareContentParams {
    /** Keep in sync with Go's share.Record */
    record: {
      gamemode?: GamemodeName;
      theme: ThemeName;
      name?: string;
      data: Record<string, unknown>;
      when: Date;
    };
    location: Location;
  }

  interface Response {
    code: Code;
  }

  interface ResponseErrorData {
    title: string;
    status: number;
    type?: string;
    detail?: string;
    instance?: string;
    reason: string;
  }

  class ResponseError extends Error {
    constructor({ status, title, detail, reason }: ResponseErrorData) {
      super(`${status} ${title}${detail ? ': ' + detail : ''}`, { cause: new Error(reason) });
    }
  }

  /** Mimics share.Record from Go code. Keep in sync. */
  async function getShareContent(db: IDBDatabase, { record, location: { protocol, host } }: ShareContentParams): Promise<ShareData> {
    if (!recordCanBeCodeInfo(record)) {
      const [[key, value]] = entries(record.data);

      return {
        title: 'Pop the grid!',
        text: `I have ${value} ${makePlural(display[key as keyof typeof display], value as number)} by now, can you beat me?`,
        url: `${protocol}//${host}`,
      };
    }

    let code = await findCachedLink(db, record);

    if (!code) {
      const res = await fetch(`${import.meta.env.VITE_FUNCTIONS_ROOT}/share`, {
        method: 'POST',
        body: JSON.stringify(record),
      });

      if (res.status !== 200) {
        const data: ResponseErrorData = await res.json();
        throw new ResponseError(data);
      }

      const { code: newCode }: Response = await res.json();
      code = newCode;
      await cacheLink(db, { ...record, code });
    }

    let text: string;
    switch (record.gamemode!) {
      case 'random':
        text = 'Can you win more than me at Pop the grid?';
        break;
      case 'random-timer':
        text = 'Can you Pop the grid quicker than me?';
        break;
      case 'same-square':
        text = 'Destroy the same squares! Can you do it quicker?';
        break;
      default:
        throw new UnreachableError(record.gamemode, 'unimplemented gamemode');
    }

    return {
      title: 'Pop the grid!',
      url: `${protocol}//${host}/${code}`,
      text,
    };
  }

  function recordCanBeCodeInfo(r: Omit<ShareContentParams['record'], 'data'>): r is CodeInfo {
    return 'gamemode' in r && !!r.gamemode;
  }
</script>

<script lang="ts">
  import { getContext } from '../context';

  import { UnreachableError, type KeyOfUnion } from '$util/index';
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
