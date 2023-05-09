import React from "react";
import { Descendant, Node } from "slate";
import { useFocusedEditor } from "./FocusedEditorContext";
import { to_single_line_plaintext } from "../slate";
import { useDocument } from "./DocumentContext";

export interface ToolbarProps {
	saveActiveCardImage: () => void,
}

export function Toolbar(props: ToolbarProps) {
	const { saveActiveCardImage } = props;
	const doc = useDocument();
	const focused_editor = useFocusedEditor();
	const text = focused_editor ? to_single_line_plaintext(focused_editor.children) : "<no text>";
	return (
		<div id="toolbar">
			{text}
			<button onClick={saveActiveCardImage}>Save Card Image</button>
		</div>
	);
}
