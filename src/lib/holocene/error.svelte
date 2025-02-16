<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { BROWSER } from 'esm-env';
  import { page } from '$app/stores';

  import { isNetworkError } from '$lib/utilities/is-network-error';
  import type { NetworkError } from '$lib/types/global';

  import Link from '$lib/holocene/link.svelte';

  export let error: App.Error | NetworkError = null;
  export let status = 500;
  let message = error?.message || '';

  if (isNetworkError(error)) {
    status = error.statusCode;
  }

  const dispatch = createEventDispatcher();

  $: currentLocation = $page.url.toString();

  beforeNavigate(() => {
    dispatch('clearError', {});
  });
</script>

<section
  aria-roledescription="error"
  class="mt-32 text-center align-middle"
  role="alert"
>
  <h1 class="text-[12rem] font-semibold">{status}</h1>
  <p class="-mt-6 mb-5 text-lg">Uh oh. There's an error.</p>
  <p class="my-4 w-auto text-2xl font-extrabold text-red-700">
    {message}
  </p>

  <p class="text-lg">
    <Link
      href={currentLocation}
      on:click={() => {
        if (BROWSER) {
          window.location.reload();
        }
      }}
      target="_self"
      class="underline underline-offset-2">Try a refresh</Link
    >
    or
    <Link href="https://temporal.io/slack">jump on our Slack Channel</Link>.
  </p>
</section>
