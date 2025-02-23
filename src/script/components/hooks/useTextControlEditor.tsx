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
		editor.history = history;
		editor.card = card;
		editor.control = control;

		// replace editor contents with contents from new card
		withoutPropagating(editor, () => {
			editor.withoutNormalizing(() => {
				for (const _ of editor.children) editor.removeNodes({ at: [0] });
				editor.insertNodes(editor.get_property().value.children, { at: [0] });
				editor.observe();
			});
		});
		return () => editor.unobserve();
	}, [editor, history, card, control]);
	return editor;
}
