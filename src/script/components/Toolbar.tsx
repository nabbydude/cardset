import React from "react";
import { useFocusedEditor } from "./contexts/FocusedEditorContext";
import { toSingleLinePlaintext } from "../slate";
import { useDocument } from "./contexts/DocumentContext";

export interface ToolbarProps {
	saveActiveCardImage: () => void,
	saveSet: () => void,
	loadSet: () => void,
}

export function Toolbar(props: ToolbarProps) {
	const { saveActiveCardImage, saveSet, loadSet } = props;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const doc = useDocument();
	const focusedEditor = useFocusedEditor();
	const text = focusedEditor ? toSingleLinePlaintext(focusedEditor.children) : "<no text>";
	return (
		<div id="toolbar">
			{text}
			<button onClick={saveActiveCardImage}>Save Card Image</button>
			<button onClick={saveSet}>Save Set</button>
			<button onClick={loadSet}>Load Set</button>
		</div>
	);
}
