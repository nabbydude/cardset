import React from "react";
import { useFocusedEditor } from "./contexts/FocusedEditorContext";
import { to_single_line_plaintext } from "../slate";
import { useDocument } from "./contexts/DocumentContext";

export interface ToolbarProps {
	save_active_card_image: () => void,
	save_set: () => void,
	load_set: () => void,
}

export function Toolbar(props: ToolbarProps) {
	const { save_active_card_image, save_set, load_set } = props;
	const doc = useDocument();
	const focused_editor = useFocusedEditor();
	const text = focused_editor ? to_single_line_plaintext(focused_editor.children) : "<no text>";
	return (
		<div id="toolbar">
			{text}
			<button onClick={save_active_card_image}>Save Card Image</button>
			<button onClick={save_set}>Save Set</button>
			<button onClick={load_set}>Load Set</button>
		</div>
	);
}
