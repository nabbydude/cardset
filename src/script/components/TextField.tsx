import React, { KeyboardEvent, MouseEvent, useCallback, useLayoutEffect } from "react";
import { useState } from "react";
import { Editor, Path } from "slate";
import { ReactEditor, Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { createCardFieldEditor, CustomEditor, renderElement, renderLeaf, useViewOfMatchingNode } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { asScalingPt, getFillSize } from "../util";
import { EditableProps } from "slate-react/dist/components/editable";

export interface TextFieldProps extends EditableProps {
	cardPath: Path,
	field: string,
	minFontSize: number,
	maxFontSize: number,

	onEditableDOMBeforeInput?: (e: InputEvent, editor: ReactEditor) => void,
	onEditableClick?: (e: MouseEvent, editor: ReactEditor) => void,
	onEditableKeyDown?: (e: KeyboardEvent, editor: ReactEditor) => void,
}

export function TextField(props: TextFieldProps) {
	const { cardPath, field, minFontSize, maxFontSize, onEditableDOMBeforeInput, onEditableClick, onEditableKeyDown, ...rest } = props;
	const doc = useDocument();
	const [editor] = useState(createCardFieldEditor);
	useViewOfMatchingNode(editor, doc, cardPath, { type: "Field", name: field });

	useLayoutEffect(() => {
		const el = ReactEditor.toDOMNode(editor, editor);
		const size = getFillSize(el, minFontSize, maxFontSize, 0.5);
		el.style.fontSize = asScalingPt(size);
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
	);
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
