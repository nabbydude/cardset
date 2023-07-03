import React, { useCallback, useLayoutEffect, useState } from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "../../slate";
import { asEm, getFillSize } from "../../util";

export interface ManaPip extends BaseElement {
	type: "ManaPip",
	color: string,
}



export function ManaPipElement(props: RenderElementProps<ManaPip>) {
		// Its bad practice to use mutable state here but we only use it to store the ref in a place where the layout effect can see, we don't need to update when it changes (in fact we specifically want to avoid it)
	const [refBox] = useState<{ ref: HTMLSpanElement | undefined }>({ ref: undefined });
	
	const refHandle = useCallback((newRef: HTMLSpanElement) => {
		// props passes us down a callback-style ref so we have to use one here and pass it along
		props.attributes.ref(newRef);
		refBox.ref = newRef;
	}, [props.attributes.ref]);
	useLayoutEffect(() => {
		if (!refBox.ref) return;
		const el = refBox.ref.firstElementChild as HTMLSpanElement;
		const size = getFillSize(el, 0.5, 1, 0.1, asEm);
		el.style.fontSize = `${size}em`;
	});
	return (
		<span {...props.attributes} ref={refHandle} className="mana-pip" style={{ backgroundColor: props.element.color }}>
			{props.children}
		</span>
	);
}

// export const ManaPipElement = forwardRef(ManaPipElementInner);

export function isManaPip(value: unknown): value is ManaPip {
	return Element.isElement(value) && value.type === "ManaPip";
}
