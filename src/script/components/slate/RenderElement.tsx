import React from "react";
import { RenderElementProps } from "slate-react";
import { HorizontalRule, HorizontalRuleElement } from "./HorizontalRule";
import { ManaPip, ManaPipElement } from "./ManaPip";
import { Icon, IconElement } from "./Icon";
import { Paragraph, ParagraphElement } from "./Paragraph";
import { Element } from "slate";
import { EmbeddedProperty, EmbeddedPropertyElement } from "./EmbeddedProperty";

export interface TypedRenderElementProps<T extends Element = Element> extends RenderElementProps {
	element: T,
}

export function RenderElement(props: RenderElementProps) {
	switch (props.element.type) {
		case "HorizontalRule":   return <HorizontalRuleElement   {...props as TypedRenderElementProps<HorizontalRule  >}/>;
		case "ManaPip":          return <ManaPipElement          {...props as TypedRenderElementProps<ManaPip         >}/>;
		case "Icon":             return <IconElement             {...props as TypedRenderElementProps<Icon            >}/>;
		case "Paragraph":        return <ParagraphElement        {...props as TypedRenderElementProps<Paragraph       >}/>;
		case "EmbeddedProperty": return <EmbeddedPropertyElement {...props as TypedRenderElementProps<EmbeddedProperty>}/>;

		default: return <ParagraphElement {...props as TypedRenderElementProps<Paragraph>}/>;
	}
}
