import React from "react";
import { BaseElement, Element } from "slate";
import { useFocused, useSelected } from "slate-react";
import { TypedRenderElementProps } from "./RenderElement";

export interface HorizontalRule extends BaseElement {
	type: "HorizontalRule",
}

export function HorizontalRuleElement(props: TypedRenderElementProps<HorizontalRule>) {
	// return (
	// 	<hr {...props.attributes} className="hr" contentEditable={false}/>
	// );
	const focused = useFocused() ? " focused" : "";
	const selected = useSelected() ? " selected" : "";
	return (
		<div {...props.attributes} className={"hr" + focused + selected} contentEditable={false}>
			{props.children}
		</div>
	);
}

export function isHorizontalRule(value: unknown): value is HorizontalRule {
	return Element.isElement(value) && value.type === "HorizontalRule";
}
