import React from "react";
import { RenderLeafProps } from "slate-react";
import { StyledText, StyledTextElement } from "./StyledText";
import { Text } from "slate";

export interface TypedRenderLeafProps<T extends Text = Text> extends RenderLeafProps {
	leaf: T,
	text: T,
}

export function RenderLeaf(props: RenderLeafProps) {
	return <StyledTextElement {...props as TypedRenderLeafProps<StyledText>} />;
}
