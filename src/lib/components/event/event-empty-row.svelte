<script lang="ts">
  import EmptyState from '$lib/holocene/empty-state.svelte';
  import Loading from '$lib/holocene/loading.svelte';

  export let loading = false;
</script>

<tr class="row">
  <td colspan="6">
    {#if loading}
      <Loading />
    {:else}
      <EmptyState
        title="No Events Match"
        content="There are no events that match your filters or selected view. Adjust your filters or view to see your events."
      />
    {/if}
  </td>
</tr>

<style lang="postcss">
  .row {
    @apply border-2 border-gray-900 p-2 text-center text-sm;
  }
</style>
