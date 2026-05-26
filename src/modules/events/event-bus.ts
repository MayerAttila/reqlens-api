import { EventEmitter } from "node:events";

export type RequestLogCreatedEvent = {
  accepted: number;
  latestCreatedAt: string;
  projectId: string;
};

type DashboardEvents = {
  "request-log.created": RequestLogCreatedEvent;
};

type DashboardEventName = keyof DashboardEvents;

const eventBus = new EventEmitter();

eventBus.setMaxListeners(0);

export function publishDashboardEvent<TEventName extends DashboardEventName>(
  name: TEventName,
  payload: DashboardEvents[TEventName]
) {
  eventBus.emit(name, payload);
}

export function subscribeToDashboardEvent<TEventName extends DashboardEventName>(
  name: TEventName,
  handler: (payload: DashboardEvents[TEventName]) => void
) {
  eventBus.on(name, handler);

  return () => {
    eventBus.off(name, handler);
  };
}
