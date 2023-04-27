<script lang="ts">
  import NameInput from './internal/NameInput.svelte';
  import { name } from './internal/name';

  $: value = $name;
</script>

<section>
  <div class="align-name-input">
    <NameInput bind:value on:change={() => ($name = value)} />
  </div>
  <hr />
</section>

<style>
  section {
    width: 100%;
    max-width: 920px;
    height: 100%;
    margin: 0 auto;
  }

  hr {
    border: 0;
    height: 0;
    border-top: 1px solid var(--color-body);
  }

  .align-name-input {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 560px) {
    .align-name-input {
      display: block;
      padding: 0 0.6rem;
    }
  }
</style>
