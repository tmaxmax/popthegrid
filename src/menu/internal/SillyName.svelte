<script lang="ts">
  import { SillyName } from '$components/SillyName/index.ts';
  import { LocalStorage } from '$components/SillyName/storage.ts';
  import { Component } from '$components/internal/Component.ts';
  import { onMount } from 'svelte';
  import { getContext } from '../context.ts';

  const { theme } = getContext();
  const component = new SillyName({ theme: $theme, storage: new LocalStorage() });

  $: component.setTheme($theme);

  let parent: HTMLElement;

  onMount(() => {
    component.create(Component.from(parent));
    return () => component.destroy();
  });
</script>

<div bind:this={parent} />

<style>
  div {
    margin-top: auto;
    display: flex;
    justify-content: center;
  }
</style>
