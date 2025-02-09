import { useContext, useEffect, useMemo } from "react";
import { card } from "../../card";
import { ProjectContext } from "../contexts/ProjectContext";
import { HistoryContext } from "../contexts/HistoryContext";
import { text_property } from "../../property";
import { createTextPropertyControlEditor, withoutPropagating } from "../../slate";
import { without_writing_history } from "../../history";

export function useCardTextControlEditor(card: card, control_id: string, property: text_property) {
	const project = useContext(ProjectContext);
	const history = useContext(HistoryContext);
	const editor = useMemo(() => {
		return createTextPropertyControlEditor(project, history, control_id, card, property);
	}, [control_id]);

	useEffect(() => {
		editor.project  = project;
		editor.history  = history;
		editor.card     = card;
		editor.property = property;

		// replace editor contents with contents from new card
		without_writing_history(editor, () => {
			withoutPropagating(editor, () => {
				editor.withoutNormalizing(() => {
					for (const _ of editor.children) editor.removeNodes({ at: [0] });
					editor.insertNodes(property.value.children, { at: [0] });
				});
			});
		});
		editor.observe();
		return () => {
			editor.unobserve();
		}
	}, [editor, project, history, card, property]);
	return editor;
}
