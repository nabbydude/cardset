import { useState } from "react";
import { property, property_value } from "../../property";
import { useObserver } from "./useObserver";

export function usePropertyValue<P extends property>(property: P): property_value<P> {
	const [_, setValue] = useState(property.value); // we don't actually use this as-stored, we just want to rerender when it changes (if the passed property changes this will be out of sync which isnt a worry)
	useObserver(property, (operation) => setValue(operation.property.value), [property]);
	return property.value;
}
