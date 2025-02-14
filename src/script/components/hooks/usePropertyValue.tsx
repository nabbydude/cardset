import { useEffect, useState } from "react";
import { property, property_value } from "../../property";
import { allowed_observer_for, observe, unobserve } from "../../observable";

export function usePropertyValue<P extends property>(property: P): property_value<P> {
	const [value, setValue] = useState(property.value);

	useEffect(() => {
		setValue(property.value); // reset to value of new property when watched property changes
	}, [property]);

	useEffect(() => {
		const observer: allowed_observer_for<P> = (operation) => setValue(operation.property.value);
		observe(property, observer);
		return () => {
			unobserve(property, observer);
		};
	}, [property]);



	return value;
}
