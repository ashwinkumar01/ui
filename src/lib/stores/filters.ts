import type {
  WorkflowFilter,
  WorkflowSort,
} from '$lib/models/workflow-filters';
import { persistStore } from '$lib/stores/persist-store';
import { writable, derived, get } from 'svelte/store';
import { page } from '$app/stores';
import type { StartStopNotifier } from 'svelte/store';

const query = derived([page], ([$page]) => $page.url.searchParams.get('query'));
const category = derived([page], ([$page]) =>
  $page.url.searchParams.get('category'),
);

const parameters = derived([query, category], ([$query, $category]) => {
  return {
    query: $query,
    category: $category,
  };
});

const updateWorkflowFilters: StartStopNotifier<WorkflowFilter[]> = (set) => {
  return parameters.subscribe(({ query }) => {
    if (!query && get(workflowFilters).length) {
      // Clear filters if there is no query
      set([]);
    }
  });
};

const updateSorts: StartStopNotifier<WorkflowSort[]> = (set) => {
  return parameters.subscribe(({ query }) => {
    if (!query && get(workflowSorts).length) {
      // Clear sorts if there is no query
      set([]);
    }
  });
};

export const persistedTimeFilter = persistStore<WorkflowFilter>(
  'workflowDateTimeFilter',
  undefined,
  true,
);

export const workflowFilters = writable<WorkflowFilter[]>(
  [],
  updateWorkflowFilters,
);

export const workflowSorts = writable<WorkflowSort[]>([], updateSorts);

const updateEventCategoryFilter: StartStopNotifier<string | null> = (set) => {
  return parameters.subscribe(({ category }) => {
    if (!category && get(eventCategoryFilter)) {
      // Clear filter if there is no category
      set(null);
    }
  });
};

export const eventCategoryFilter = writable<string | null>(
  null,
  updateEventCategoryFilter,
);
