import type { PageLoad } from '@sveltejs/kit';
import type { CombinedWorkflowExecutionsResponse } from '$lib/services/workflow-service';
import type { DescribeNamespaceResponse } from '$types';
import { fetchAllArchivedWorkflows } from '$lib/services/workflow-service';

export const load: PageLoad = async function ({ params, url, parent }) {
  const { searchParams } = url;
  const data = await parent();

  if (!searchParams.has('time-range')) searchParams.set('time-range', '1 day');

  const namespace = params.namespace;
  const workflowId = searchParams.get('workflow-id');
  const workflowType = searchParams.get('workflow-type');
  const timeRange = searchParams.get('time-range');
  const executionStatus = searchParams.get('status') as WorkflowStatus;

  const parameters: ArchiveFilterParameters = {
    workflowId,
    workflowType,
    closeTime: timeRange,
    executionStatus,
  };

  const namespaces: DescribeNamespaceResponse[] = data.namespaces;

  const currentNamespaceConfig = namespaces.find(
    (namespaceConfig) => namespaceConfig.namespaceInfo.name === namespace,
  );

  // These are incorrectly typed as enums and need to be coerced to strings
  const archivalEnabled =
    (currentNamespaceConfig?.config
      ?.historyArchivalState as unknown as string) === 'Enabled';

  const visibilityArchivalEnabled =
    (currentNamespaceConfig?.config
      ?.visibilityArchivalState as unknown as string) === 'Enabled';

  const initialData: CombinedWorkflowExecutionsResponse | null =
    archivalEnabled && visibilityArchivalEnabled
      ? await fetchAllArchivedWorkflows(namespace, parameters, fetch)
      : null;

  return {
    workflows: initialData ? initialData.workflows : [],
    namespace,
    archivalEnabled,
    visibilityArchivalEnabled,
  };
};
