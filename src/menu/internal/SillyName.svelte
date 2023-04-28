<script lang="ts">
  import { SillyName } from '$components/SillyName';
  import { LocalStorage } from '$components/SillyName/storage';
  import { Component } from '$components/internal/Component';
  import { onMount } from 'svelte';
  import { getContext } from '../context';

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
    margin-top: 0.8em;
    display: flex;
    justify-content: center;
  }
</style>
