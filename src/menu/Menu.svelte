<script lang="ts">
  import NameInput from './internal/NameInput.svelte';
  import { name } from './internal/name';

  $: value = $name;
</script>

<section>
  <div class="align-name-input">
    <NameInput bind:value on:change={() => ($name = value)} />
  </div>
</section>

<style>
  section {
    width: 100%;
    max-width: 920px;
    height: 100%;
    margin: 0 auto;
  }

  .align-name-input {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 560px) {
    .align-name-input {
      display: block;
    }

    section {
      padding: 0 0.6rem;
    }
  }
</style>
