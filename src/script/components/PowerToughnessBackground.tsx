import React, { useMemo } from "react";
import { Editor, Element, Node, Path } from "slate";
import { firstMatchingPath } from "../slate";
import { useDocument } from "./contexts/DocumentContext";

export interface PowerToughnessBackgroundProps {
	cardPath: Path,
	field: string,
}

const boxImageUrl = (new URL("/assets/red_pt.png", import.meta.url)).toString();

export function PowerToughnessBackground(props: PowerToughnessBackgroundProps) {
	const { cardPath, field } = props;
	const doc = useDocument();
	const card = Node.get(doc, cardPath);
	const fieldPath = useMemo(() => firstMatchingPath(card, { type: "Field", name: field }), [doc, cardPath, field]);
	if (!fieldPath) return <></>;
	const fullPath = useMemo(() => cardPath.concat(fieldPath), [cardPath, fieldPath]);
	const node = Node.get(doc, fullPath) as Element;
	const isPtEmpty = node.children.length === 1 && Editor.isEmpty(doc, node.children[0] as Element);
	return <img className="pt-box" src={boxImageUrl} style={{ display: isPtEmpty ? "none" : "block" }}/>;
}
