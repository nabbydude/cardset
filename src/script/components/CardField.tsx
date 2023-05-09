import React, { KeyboardEvent, useCallback, useEffect, useMemo } from "react";
import { useState } from "react";
import { Editor, Node, Path } from "slate";
import { Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { MultiEditor } from "../multi_slate";
import { create_card_field_editor, CustomEditor, first_matching_path, renderElement, renderLeaf } from "../slate";
import { useDocument } from "./DocumentContext";

export interface CardFieldProps {
	card_path: Path,
	field: string,
}

export function CardField(props: CardFieldProps) {
	const { card_path, field } = props;
	const doc = useDocument();
	const [editor] = useState(create_card_field_editor);
	const card = Node.get(doc, card_path);
	const field_path = useMemo(() => first_matching_path(card, { type: "Field", name: field }), [doc, card_path, field]);
	if (!field_path) return <></>;
	const full_path = useMemo(() => card_path.concat(field_path), [card_path, field_path]);
	useEffect(() => {
		MultiEditor.setView(editor, doc, full_path);
	}, [editor, doc, full_path]);
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
		case "`": e.preventDefault(); CustomEditor.toggleCodeBlock(editor); break;
		case "b": e.preventDefault(); CustomEditor.toggleBoldMark(editor); break;
	}
}
