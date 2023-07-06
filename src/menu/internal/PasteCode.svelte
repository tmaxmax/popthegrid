<script lang="ts" context="module">
  import { getCodeFromPath, isCode, type Code } from '$edge/share.ts';

  const getCode = (urlOrCode: string): Code | undefined => {
    if (isCode(urlOrCode)) {
      return urlOrCode;
    }

    try {
      const { pathname } = new URL(urlOrCode);
      return getCodeFromPath(pathname);
    } catch {
      return;
    }
  };
</script>

<script lang="ts">
  let value = getCodeFromPath(window.location.pathname) ? window.location.href : '';
  let href = '';

  $: {
    const code = getCode(value);
    if (code) {
      href = `${window.location.protocol}//${window.location.host}/${code}`;
    } else {
      href = '';
    }
  }

  const onClick = (e: Event) => {
    if (!href || !e.isTrusted) {
      return;
    }

    if (!(e instanceof KeyboardEvent) || e.key === 'Enter') {
      e.preventDefault();
      window.location.href = href;
    }
  };
</script>

<div>
  <input type="text" name="code" id="code" placeholder="Your link here..." bind:value on:keydown={onClick} />
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
    font-size: calc(1em + 1.1vmin);
    letter-spacing: -0.1em;
    font-family: var(--font-mono);
    color: var(--color-heading);
    margin-right: 0.2em;
    text-overflow: ellipsis;
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

  @media (hover: hover) {
    a:hover {
      text-decoration: underline;
    }
  }
</style>
