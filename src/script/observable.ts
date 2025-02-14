import { operation } from "./operation"

export interface observable<OPERATION extends operation = never> {
	observers: Set<observer<OPERATION>>,
}

export type observer<OPERATION extends operation = never> = (operation: OPERATION) => void;

export type observable_operations<OBSERVABLE extends observable> = OBSERVABLE extends observable<infer OPERATION> ? OPERATION : never;
export type allowed_observer_for<OBSERVABLE extends observable> = observer<observable_operations<OBSERVABLE>>;

export function observe<OBSERVABLE extends observable>(observable: OBSERVABLE, observer: allowed_observer_for<OBSERVABLE>) {
	observable.observers.add(observer);
}

export function unobserve<OBSERVABLE extends observable>(observable: OBSERVABLE, observer: allowed_observer_for<OBSERVABLE>) {
	observable.observers.delete(observer);
}

export function notify_observers<OBSERVABLE extends observable<OPERATION>, OPERATION extends operation>(observable: OBSERVABLE, operation: OPERATION) {
	for (const callback of observable.observers) {
		callback(operation);
	}
}
