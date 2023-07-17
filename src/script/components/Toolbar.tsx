import React, { useContext } from "react";
import { useFocusedEditor } from "./contexts/FocusedEditorContext";
import { toSingleLinePlaintext } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { RedoIcon, UndoIcon } from "@primer/octicons-react";
import { HistoryContext } from "./contexts/HistoryContext";

export interface ToolbarProps {
	saveActiveCardImage: () => void,
	saveSet: () => void,
	loadSet: () => void,
}

export function Toolbar(props: ToolbarProps) {
	const { saveActiveCardImage, saveSet, loadSet } = props;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const doc = useDocument(); // useFocusedEditor doesn't update on doc changes, so we listen to the doc directly
	const focusedEditor = useFocusedEditor();
	const history = useContext(HistoryContext);
	const text = focusedEditor ? toSingleLinePlaintext(focusedEditor.children) : "<no text>";
	return (
		<div id="toolbar">
			<button onClick={history.undo} disabled={!history.undo}><UndoIcon size={16}/></button>
			<button onClick={history.redo} disabled={!history.redo}><RedoIcon size={16}/></button>
			{text}
			<button onClick={saveActiveCardImage}>Save Card Image</button>
			<button onClick={saveSet}>Save Set</button>
			<button onClick={loadSet}>Load Set</button>
		</div>
	);
}
