<script lang="ts">
  import Icon from 'svelte-material-icons/PuzzleEdit.svelte';

  export let onClick: () => unknown;
</script>

<button on:click={onClick}><Icon class="your-game-icon" /> <span>Your game</span></button>

<style>
  button {
    background: none;
    border: none;
    margin: 0;
    color: var(--color-body);
    font-family: var(--font-body);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1em;
    padding: 0.6em 1em;
    cursor: pointer;
    transition: all 0.1s ease-in;
  }

  button:hover {
    filter: drop-shadow(0 0 0.03em var(--color-heading));
    color: var(--color-heading);
  }

  span {
    margin-left: 0.4em;
    margin-top: 0.12em;
  }

  :global(.your-game-icon) {
    width: 1.2em;
    height: 1.2em;
  }
</style>
