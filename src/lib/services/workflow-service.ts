import { v4 } from 'uuid';

import {
  toWorkflowExecution,
  toWorkflowExecutions,
} from '$lib/models/workflow-execution';

import { requestFromAPI } from '$lib/utilities/request-from-api';
import { routeForApi } from '$lib/utilities/route-for-api';
import { toListWorkflowQuery } from '$lib/utilities/query/list-workflow-query';
import {
  handleUnauthorizedOrForbiddenError,
  isForbidden,
  isUnauthorized,
} from '$lib/utilities/handle-error';
import { noop } from 'svelte/internal';
import { stringifyWithBigInt } from '$lib/utilities/parse-with-big-int';
import { btoa } from '$lib/utilities/btoa';

import type { ErrorCallback } from '$lib/utilities/request-from-api';
import type { ResetReapplyType } from '$lib/models/workflow-actions';
import type { ResetWorkflowRequest } from '$lib/types';
import type { NamespaceScopedRequest, Replace } from '$lib/types/global';
import type {
  WorkflowExecution,
  ListWorkflowExecutionsResponse,
  ArchiveFilterParameters,
} from '$lib/types/workflows';
import type {
  ValidWorkflowEndpoints,
  ValidWorkflowParameters,
} from '$lib/types/api';

export type GetWorkflowExecutionRequest = NamespaceScopedRequest & {
  workflowId: string;
  runId: string;
};

export type CombinedWorkflowExecutionsResponse = {
  workflows: WorkflowExecution[];
  nextPageToken: string;
  error?: string;
};

type CancelWorkflowOptions = {
  namespace: string;
  workflowId: string;
  runId: string;
};

type SignalWorkflowOptions = {
  namespace: string;
  workflowId: string;
  runId: string;
  signalName: string;
  signalInput: string;
};

type TerminateWorkflowOptions = {
  workflow: WorkflowExecution;
  namespace: string;
  reason: string;
};

export type ResetWorkflowOptions = {
  namespace: string;
  workflowId: string;
  runId: string;
  eventId: string;
  reason: string;
  resetReapplyType: ResetReapplyType;
};

export type FetchWorkflow =
  | typeof fetchAllWorkflows
  | typeof fetchAllArchivedWorkflows;

export const fetchWorkflowCount = async (
  namespace: string,
  query: string,
  request = fetch,
): Promise<{ totalCount: number; count: number }> => {
  let totalCount = 0;
  let count = 0;
  try {
    const countRoute = routeForApi('workflows.count', { namespace });
    if (!query) {
      const totalCountResult = await requestFromAPI<{ count: number }>(
        countRoute,
        {
          params: {},
          onError: noop,
          handleError: noop,
          request,
        },
      );
      totalCount = totalCountResult?.count;
    } else {
      const countPromise = requestFromAPI<{ count: number }>(countRoute, {
        params: { query },
        onError: noop,
        handleError: noop,
        request,
      });
      const totalCountPromise = requestFromAPI<{ count: number }>(countRoute, {
        params: { query: '' },
        onError: noop,
        handleError: noop,
        request,
      });
      const [countResult, totalCountResult] = await Promise.all([
        countPromise,
        totalCountPromise,
      ]);
      count = countResult?.count;
      totalCount = totalCountResult?.count;
    }
  } catch (e) {
    // Don't fail the workflows call due to count
  }

  return { count, totalCount };
};

export const fetchAllWorkflows = async (
  namespace: string,
  parameters: ValidWorkflowParameters,
  request = fetch,
  archived = false,
): Promise<CombinedWorkflowExecutionsResponse> => {
  const rawQuery =
    parameters.query || toListWorkflowQuery(parameters, archived);
  let query: string;
  try {
    query = decodeURIComponent(rawQuery);
  } catch {
    query = rawQuery;
  }

  const endpoint: ValidWorkflowEndpoints = archived
    ? 'workflows.archived'
    : 'workflows';

  let error = '';
  const onError: ErrorCallback = (err) => {
    // Kick out to login if 401/403
    handleUnauthorizedOrForbiddenError(err);
    if (err?.body?.message || err?.status) {
      error =
        err?.body?.message ??
        `Error fetching workflows: ${err.status}: ${err.statusText}`;
    } else {
      error = `Error fetching workflows: Server failed to respond`;
    }
  };

  const route = routeForApi(endpoint, { namespace });
  const { executions, nextPageToken } =
    (await requestFromAPI<ListWorkflowExecutionsResponse>(route, {
      params: { query },
      onError,
      handleError: onError,
      request,
    })) ?? { executions: [], nextPageToken: '' };

  return {
    workflows: toWorkflowExecutions({ executions }),
    nextPageToken: String(nextPageToken),
    error,
  };
};

export const fetchWorkflowForRunId = async (
  parameters: { namespace: string; workflowId: string },
  request = fetch,
): Promise<{ runId: string }> => {
  const { namespace, workflowId } = parameters;
  const endpoint: ValidWorkflowEndpoints = 'workflows';

  const route = routeForApi(endpoint, { namespace });
  const { executions } = (await requestFromAPI<ListWorkflowExecutionsResponse>(
    route,
    {
      params: {
        query: `WorkflowId="${workflowId}"`,
        pageSize: '1',
      },
      request,
    },
  )) ?? { executions: [] };
  const latestExecution = toWorkflowExecutions({ executions })?.[0];

  return {
    runId: latestExecution?.runId,
  };
};

export const fetchWorkflowForAuthorization = async (
  namespace: string,
  request = fetch,
  archived = false,
): Promise<{ authorized: boolean }> => {
  const endpoint: ValidWorkflowEndpoints = archived
    ? 'workflows.archived'
    : 'workflows';

  let authorized = true;
  const onError: ErrorCallback = (err) => {
    if (isUnauthorized(err) || isForbidden(err)) {
      authorized = false;
    }
  };

  const route = routeForApi(endpoint, { namespace });
  await requestFromAPI<ListWorkflowExecutionsResponse>(route, {
    params: { pageSize: '1' },
    onError,
    handleError: onError,
    request,
  });

  return {
    authorized,
  };
};

export const fetchAllArchivedWorkflows = async (
  namespace: string,
  parameters: ArchiveFilterParameters,
  request = fetch,
): Promise<CombinedWorkflowExecutionsResponse> => {
  return fetchAllWorkflows(namespace, parameters, request, true);
};

export async function fetchWorkflow(
  parameters: GetWorkflowExecutionRequest,
  request = fetch,
): Promise<WorkflowExecution> {
  const route = routeForApi('workflow', parameters);
  return requestFromAPI(route, { request }).then(toWorkflowExecution);
}

export async function terminateWorkflow({
  workflow,
  namespace,
  reason,
}: TerminateWorkflowOptions): Promise<null> {
  const route = routeForApi('workflow.terminate', {
    namespace,
    workflowId: workflow.id,
    runId: workflow.runId,
  });
  return await requestFromAPI<null>(route, {
    options: { method: 'POST', body: stringifyWithBigInt({ reason }) },
    notifyOnError: false,
  });
}

export async function cancelWorkflow(
  { namespace, workflowId, runId }: CancelWorkflowOptions,
  request = fetch,
) {
  const route = routeForApi('workflow.cancel', {
    namespace,
    workflowId,
    runId,
  });

  return requestFromAPI(route, {
    request,
    notifyOnError: false,
    options: {
      method: 'POST',
    },
  });
}

export async function signalWorkflow({
  namespace,
  workflowId,
  runId,
  signalName,
  signalInput,
}: SignalWorkflowOptions) {
  const route = routeForApi('workflow.signal', {
    namespace,
    workflowId,
    runId,
  });

  return requestFromAPI(route, {
    notifyOnError: false,
    options: {
      method: 'POST',
      body: stringifyWithBigInt({
        signalName,
        input: {
          payloads: signalInput
            ? [
                {
                  metadata: {
                    encoding: btoa('json/plain'),
                  },
                  data: btoa(signalInput),
                },
              ]
            : null,
        },
      }),
    },
  });
}

export async function resetWorkflow({
  namespace,
  workflowId,
  runId,
  eventId,
  reason,
  resetReapplyType,
}: ResetWorkflowOptions): Promise<{ runId: string }> {
  const route = routeForApi('workflow.reset', {
    namespace,
    workflowId,
    runId,
  });

  const body: Replace<
    ResetWorkflowRequest,
    { workflowTaskFinishEventId: string; resetReapplyType: ResetReapplyType }
  > = {
    workflowExecution: {
      workflowId,
      runId,
    },
    workflowTaskFinishEventId: eventId,
    resetReapplyType,
    requestId: v4(),
    reason,
  };

  return requestFromAPI<{ runId: string }>(route, {
    notifyOnError: false,
    options: {
      method: 'POST',
      body: stringifyWithBigInt(body),
    },
  });
}

export async function fetchWorkflowForSchedule(
  parameters: GetWorkflowExecutionRequest,
  request = fetch,
): Promise<WorkflowExecution> {
  const onError: ErrorCallback = (err) => {
    console.error(err);
  };

  const route = routeForApi('workflow', parameters);
  return requestFromAPI(route, {
    request,
    onError,
    handleError: onError,
  }).then(toWorkflowExecution);
}
