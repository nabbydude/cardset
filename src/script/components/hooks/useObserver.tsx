import { useEffect } from "react";
import { allowed_observer_for, observable, observe, unobserve } from "../../observable";

export function useObserver<O extends observable>(observable: O, observer: allowed_observer_for<O>, deps: unknown[]) {
	useEffect(() => {
		observe(observable, observer);
		return () => unobserve(observable, observer);
	}, deps);
}
