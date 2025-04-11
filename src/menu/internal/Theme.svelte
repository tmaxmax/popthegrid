<script lang="ts" module>
  import { entries } from '$util/objects.ts';
  import { type ThemeName, themes, setTheme } from '../../theme.ts';
  import { type Option } from './Fieldset.svelte';

  const getThemeOptions = (): Option<ThemeName>[] => {
    return entries(themes).map(([value, { display, description }]) => ({
      display,
      description,
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
    setTheme($theme, { global: true });
  };
</script>

<Fieldset margin name="theme" {options} bind:selectedValue={$theme} onchange={onChange}>
  {#snippet legend()}
    <span>Theme:</span>
  {/snippet}
</Fieldset>
