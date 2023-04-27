<script lang="ts" context="module">
  import { entries } from '$util/objects';
  import { type Writable, writable } from 'svelte/store';
  import { type ThemeName, themes, getTheme, setTheme, listenToThemeChanges } from '../../theme';
  import { type Option } from './Fieldset.svelte';

  const getThemeOptions = (): Option<ThemeName>[] => {
    return entries(themes).map(([value, { display }]) => ({
      display,
      value,
    }));
  };

  const createThemeStore = (): Writable<ThemeName> => {
    const { subscribe, set, update } = writable<ThemeName>(undefined, (set) => {
      set(getTheme());
      return listenToThemeChanges((themeName) => {
        set(themeName);
      });
    });

    return {
      subscribe,
      set(value) {
        setTheme(value);
        set(value);
      },
      update(up) {
        update((old) => {
          const newVal = up(old);
          setTheme(newVal);
          return newVal;
        });
      },
    };
  };

  const options = getThemeOptions();
  const theme = createThemeStore();
</script>

<script lang="ts">
  import Fieldset from './Fieldset.svelte';
</script>

<Fieldset margin name="theme" {options} bind:selectedValue={$theme}>
  <span slot="legend">Theme:</span>
</Fieldset>
