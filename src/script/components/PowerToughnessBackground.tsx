import React, { useMemo } from "react";
import { Editor, Element, Node, Path } from "slate";
import { RenderElementProps, RenderLeafProps } from "slate-react";
import { first_matching_path } from "../slate";
import { TextFieldProps } from "./TextField";
import { useDocument } from "./DocumentContext";

export interface PowerToughnessBackgroundProps {
	card_path: Path,
	field: string,
}

const box_image_url = (new URL("/assets/red_pt.png", import.meta.url)).toString();

export function PowerToughnessBackground(props: PowerToughnessBackgroundProps) {
	const { card_path, field } = props;
	const doc = useDocument();
	const card = Node.get(doc, card_path);
	const field_path = useMemo(() => first_matching_path(card, { type: "Field", name: field }), [doc, card_path, field]);
	if (!field_path) return <></>;
	const full_path = useMemo(() => card_path.concat(field_path), [card_path, field_path]);
	const node = Node.get(doc, full_path) as Element;
	const is_pt_empty = node.children.length === 1 && Editor.isEmpty(doc, node.children[0] as Element);
	return <img className="pt_box" src={box_image_url} style={{ display: is_pt_empty ? "none" : "block" }}/>;
}
