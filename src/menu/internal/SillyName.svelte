<script lang="ts">
  import { SillyName } from '$components/SillyName/index.ts';
  import { LocalStorage } from '$components/SillyName/storage.ts';
  import { Component } from '$components/internal/Component.ts';
  import { getContext } from '../context.ts';

  const { theme } = getContext();
  const component = new SillyName({ theme: $theme, storage: new LocalStorage() });

  $effect(() => {
    component.setTheme($theme);
  });

  let parent = $state<HTMLElement>();

  $effect(() => {
    component.create(Component.from(parent!));
    return () => component.destroy();
  });
</script>

<div bind:this={parent}></div>

<style>
  div {
    margin-top: auto;
    display: flex;
    justify-content: center;
  }
</style>
