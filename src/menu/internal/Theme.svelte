<script lang="ts" context="module">
  import { entries } from '$util/objects';
  import { type ThemeName, themes, setTheme } from '../../theme';
  import { type Option } from './Fieldset.svelte';

  const getThemeOptions = (): Option<ThemeName>[] => {
    return entries(themes).map(([value, { display }]) => ({
      display,
      value,
    }));
  };

  const options = getThemeOptions();
</script>

<script lang="ts">
  import Fieldset from './Fieldset.svelte';
  import { getContext } from '../context';

  const { theme } = getContext();

  const onChange = () => {
    setTheme($theme);
  };
</script>

<Fieldset margin name="theme" {options} bind:selectedValue={$theme} on:change={onChange}>
  <span slot="legend">Theme:</span>
</Fieldset>
