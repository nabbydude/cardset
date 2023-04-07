import React, { KeyboardEvent, ReactElement, useCallback, useContext, useEffect } from "react";
import { useState } from "react";
import { Editor } from "slate";
import { Editable, Slate } from "slate-react";
import { card } from "../card";
import { FocusedEditorContext } from "../focused_editor";
import { MultiEditor } from "../multi_slate";
import { create_card_field_editor, CustomEditor, find_path_to_field, renderElement, renderLeaf } from "../slate";

export interface CardFieldProps {
	card: card,
	field: string,
	cardEditor: MultiEditor,
}

export function CardField(props: CardFieldProps) {
	const { card, field, cardEditor } = props;
	const [editor] = useState(create_card_field_editor);
	const [, setFocusedEditor] = useContext(FocusedEditorContext);
	useEffect(() => { const path = find_path_to_field(cardEditor as Editor, field); if(path) MultiEditor.setView(editor, cardEditor, path); }, [card]);

	return (
		<Slate editor={editor} value={editor.children}>
			<Editable
				className={field}
				onFocus={useCallback(() => setFocusedEditor(editor), [setFocusedEditor, editor])}
				onBlur={useCallback(() => setFocusedEditor(null), [setFocusedEditor])}
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				onKeyDown={useCallback((e: KeyboardEvent) => onKeyDown(e, editor), [editor])}
			/>
		</Slate>
	)
}

function onKeyDown(e: KeyboardEvent, editor: Editor) {
	if (!e.ctrlKey) {
		return;
	}

	switch (e.key) {
		case "`": e.preventDefault(); CustomEditor.toggleCodeBlock(editor); break;
		case "b": e.preventDefault(); CustomEditor.toggleBoldMark(editor); break;
	}
}
