import { useContext, useEffect, useMemo } from "react";
import { HistoryContext } from "../contexts/HistoryContext";
import { createCardTextControlEditor, withoutPropagating } from "../../slate";
import { card } from "../../card";
import { text_control } from "../../control";

export function useTextControlEditor(card: card, control: text_control) {
	const history = useContext(HistoryContext);
	const editor = useMemo(() => {
		return createCardTextControlEditor(history, card, control);
	}, []);

	useEffect(() => {
		editor.hydrate(history, card, control);
		return () => editor.dispose();
	}, [editor, history, card, control]);
	return editor;
}
