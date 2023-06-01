import React, { KeyboardEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { Editor, Node, Path } from "slate";
import { ReactEditor, Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { MultiEditor } from "../multi_slate";
import { create_card_field_editor, CustomEditor, first_matching_path, renderElement, renderLeaf } from "../slate";
import { useDocument, useDocumentWithV } from "./contexts/DocumentContext";
import { Card } from "./slate/Card";
import { get_fill_size } from "../util";

export interface TextFieldProps {
	card_path: Path,
	field: string,
	min_font_size: number,
	max_font_size: number,
}

export function TextField(props: TextFieldProps) {
	const { card_path, field, min_font_size, max_font_size } = props;
	const doc = useDocument();
	const [editor] = useState(create_card_field_editor);
	const card = Node.get(doc, card_path) as Card;
	useEffect(() => {
		const field_path = first_matching_path(card, { type: "Field", name: field });
		if (!field_path) return;
		const full_path = card_path.concat(field_path);
		MultiEditor.setView(editor, doc, full_path); // the view and parent are connected with a pathref so we only need to change the view if the field or id change
		return () => MultiEditor.unsetView(editor);
	}, [doc, card.id, field]);

	useLayoutEffect(() => {
		const el = ReactEditor.toDOMNode(editor, editor);
		const size = get_fill_size(el, min_font_size, max_font_size, 0.5);
		el.style.fontSize = `${size}pt`;
	});
	return (
		<Slate editor={editor} value={editor.children}>
			<FocusSendingEditable
				className={field}
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
		case "b": e.preventDefault(); CustomEditor.toggleBoldMark(editor); break;
		case "i": e.preventDefault(); CustomEditor.toggleItalicMark(editor); break;
	}
}
