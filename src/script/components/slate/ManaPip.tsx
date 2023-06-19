import React, { useCallback, useLayoutEffect, useState } from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "../../slate";
import { as_em, get_fill_size } from "../../util";

export interface ManaPip extends BaseElement {
	type: "ManaPip",
	color: string,
}



export function ManaPipElement(props: RenderElementProps<ManaPip>) {
		// Its bad practice to use mutable state here but we only use it to store the ref in a place where the layout effect can see, we don't need to update when it changes (in fact we specifically want to avoid it)
	const [ref_box] = useState<{ ref: HTMLSpanElement | null }>({ ref: null });
	
	const ref_handle = useCallback((new_ref: HTMLSpanElement) => {
		// props passes us down a callback-style ref so we have to use one here and pass it along
		props.attributes.ref(new_ref);
		ref_box.ref = new_ref;
	}, [props.attributes.ref]);
	useLayoutEffect(() => {
		if (!ref_box.ref) return;
		const el = ref_box.ref.firstElementChild as HTMLSpanElement;
		const size = get_fill_size(el, 0.5, 1, 0.1, as_em);
		el.style.fontSize = `${size}em`;
	});
	return (
		<span {...props.attributes} ref={ref_handle} className="mana_pip" style={{ backgroundColor: props.element.color }}>
			{props.children}
		</span>
	)
}

// export const ManaPipElement = forwardRef(ManaPipElementInner);

export function isManaPip(value: any): value is ManaPip {
	return Element.isElement(value) && value.type === "ManaPip";
}
