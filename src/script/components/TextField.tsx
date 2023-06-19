import React, { KeyboardEvent, MouseEvent, SyntheticEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { Editor, Node, Path } from "slate";
import { ReactEditor, Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { MultiEditor } from "../multi_slate";
import { create_card_field_editor, CustomEditor, first_matching_path, renderElement, renderLeaf } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { Card } from "./slate/Card";
import { as_scaling_pt, get_fill_size } from "../util";
import { EditableProps } from "slate-react/dist/components/editable";

export interface TextFieldProps extends EditableProps {
	card_path: Path,
	field: string,
	min_font_size: number,
	max_font_size: number,

	onEditableDOMBeforeInput?: (e: InputEvent, editor: ReactEditor) => void,
	onEditableClick?: (e: MouseEvent, editor: ReactEditor) => void,
	onEditableKeyDown?: (e: KeyboardEvent, editor: ReactEditor) => void,
}

export function TextField(props: TextFieldProps) {
	const { card_path, field, min_font_size, max_font_size, onEditableDOMBeforeInput, onEditableClick, onEditableKeyDown, ...rest } = props;
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
		el.style.fontSize = as_scaling_pt(size);
	});

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				className={field}
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				onKeyDown={useCallback((e: KeyboardEvent) => { onEditableKeyDown?.(e, editor); if(!e.defaultPrevented) onKeyDown(e, editor); }, [editor, onEditableKeyDown])}
				onClick={useCallback((e: MouseEvent) => onEditableClick?.(e, editor), [editor, onEditableClick])}
				onDOMBeforeInput={useCallback((e: InputEvent) => onEditableDOMBeforeInput?.(e, editor), [editor, onEditableDOMBeforeInput])}
				disableDefaultStyles={true}
				style={{
					whiteSpace: "pre-wrap",
					wordWrap: "break-word",
				}}
				{...rest}
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
