import type { EventType } from '$lib/utilities/is-event-type';
import type { WorkflowEvent } from '$lib/types/events';

type EventId = EventType['id'];

interface EventGroup
  extends Pick<
    WorkflowEvent,
    'timestamp' | 'classification' | 'category' | 'eventTime' | 'attributes'
  > {
  id: EventId;
  name: string;
  events: Map<EventId, WorkflowEvent>;
  eventIds: Set<EventId>;
  initialEvent: WorkflowEvent;
  lastEvent: WorkflowEvent;
  eventList: WorkflowEvent[];
  subGroups: Map<EventId, EventGroup>;
  subGroupList: EventGroup[];
  isFailureOrTimedOut: boolean;
  isCanceled: boolean;
  isTerminated: boolean;
  isCompleted: boolean;
}

type EventGroups = EventGroup[];
