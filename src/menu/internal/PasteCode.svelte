<script lang="ts">
  import { getCodeFromPath } from '$edge/share';

  let href = '';
  let value = '';

  const onChange = () => {
    try {
      const url = new URL(value);
      const code = getCodeFromPath(url.pathname);
      if (!code) {
        href = '';
        return;
      }

      href = value;
    } catch {
      href = '';
    }
  };

  const onClick = (e: Event) => {
    e.preventDefault();
    if (href === '' || !e.isTrusted) {
      return;
    }

    window.location.href = href;
  };
</script>

<div>
  <input type="text" name="code" id="code" placeholder="Your link here..." bind:value on:input={onChange} />
  <a aria-disabled={href === ''} class:disabled={href === ''} {href} on:click={onClick}>Go!</a>
</div>

<style>
  div {
    margin-top: 0.2em;
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: 2.4em;
  }

  input {
    flex-grow: 1;
    width: 100%;
    background: none;
    border: none;
    font-size: calc(1em + 1.2vmin);
    letter-spacing: -0.1em;
    font-family: var(--font-mono);
    color: var(--color-heading);
    margin-right: 0.2em;
  }

  a {
    text-align: center;
    height: 100%;
    width: 3em;
    display: block;
    text-decoration: none;
    color: var(--color-heading);
    font-family: var(--font-heading);
    transition: all 0.1s ease-in;
    cursor: pointer;
  }

  a.disabled {
    color: var(--color-body);
    opacity: 70%;
    pointer-events: none;
    cursor: default;
  }
</style>
