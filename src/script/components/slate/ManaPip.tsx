import React, { useLayoutEffect, useRef } from "react";
import { BaseElement, Element } from "slate";
import { asEm, getFillSize } from "../../autoScaleText";
import { useToastedCallback } from "../../toaster";
import { TypedRenderElementProps } from "./RenderElement";

export interface ManaPip extends BaseElement {
	type: "ManaPip",
	color: string,
}

export function ManaPipElement(props: TypedRenderElementProps<ManaPip>) {
	const ref = useRef<HTMLSpanElement | undefined>(undefined);
	const refHandle = useToastedCallback((newRef: HTMLSpanElement) => {
		// props passes us down a callback-style ref so we have to use one here and pass it along
		props.attributes.ref(newRef);
		ref.current = newRef;
	}, [props.attributes.ref]);
	useLayoutEffect(() => {
		if (!ref.current) return;
		const el = ref.current.firstElementChild as HTMLSpanElement;
		const size = getFillSize(el, 0.5, 1, 0.1, asEm);
		el.style.fontSize = asEm(size);
	});
	return (
		<span {...props.attributes} ref={refHandle} className="mana-pip" style={{ backgroundColor: props.element.color }}>
			{props.children}
		</span>
	);
}

export function isManaPip(value: unknown): value is ManaPip {
	return Element.isElement(value) && value.type === "ManaPip";
}
