<script lang="ts">
  import { codecEndpoint } from '$lib/stores/data-encoder-config';
  import { dataEncoder } from '$lib/stores/data-encoder';

  import ToggleSwitch from './toggle-switch.svelte';

  export let endpoint = '';
  export let passToken = false;
  export let includeCreds = false;
  export let error = '';
</script>

<div class="mb-8 flex flex-col gap-8">
  <p class="text-base">
    Enter your remote codec endpoint to decrypt your payloads.
  </p>
  <div class="flex flex-col gap-2">
    <h3 class="text-lg" data-testid="data-encoder-endpoint-title">
      Remote codec endpoint
    </h3>
    {#if error}
      <small data-testid="data-encoder-endpoint-error" class="text-red-700"
        >{error}</small
      >
    {/if}
    <textarea
      class="block w-full rounded-md border-2 border-gray-900 p-2"
      rows={5}
      placeholder="Paste your endpoint here"
      data-testid="data-encoder-endpoint-input"
      bind:value={endpoint}
      on:keydown|stopPropagation
    />
    <label
      for="pass-access-token"
      class="flex items-center gap-4 font-secondary text-sm"
      ><ToggleSwitch
        id="pass-access-token"
        bind:checked={passToken}
        data-testid="data-encoder-pass-access-token"
      />Pass the user access token with your endpoint.
    </label>
    <label
      for="pass-access-credentials"
      class="flex items-center gap-4 font-secondary text-sm"
      ><ToggleSwitch
        id="pass-access-credentials"
        bind:checked={includeCreds}
        data-testid="data-encoder-include-credentials"
      />Include cross-origin credentials.
    </label>
    {#if includeCreds}
      <small data-testid="data-encoder-cross-origin-credentials"
        >Warning: Pre-flight checks will be done and could result in failure to
        decode if incorrectly configured.</small
      >
    {/if}
    {#if $dataEncoder.settingsEndpoint}
      <div class="flex items-center justify-between">
        <p data-testid="data-encoder-site-endpoint">
          {$dataEncoder.settingsEndpoint}
        </p>
        <p data-testid="data-encoder-site-settings">Site setting</p>
      </div>
      {#if $codecEndpoint}
        <small class="text-yellow-900" data-testid="data-encoder-endpoint-info"
          >Set endpoint overrides site setting endpoint.</small
        >
      {/if}
    {/if}
  </div>
</div>
