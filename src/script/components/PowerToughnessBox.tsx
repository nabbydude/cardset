import React, { KeyboardEvent, useCallback, useState } from "react";
import { createEditor, Editor, Element } from "slate";
import { Editable, RenderElementProps, RenderLeafProps, Slate, useSlate, withReact } from "slate-react";
import { rich_text_value } from "../rich_text_value";
import { create_card_field_editor, CustomEditor } from "../slate";

export interface PowerToughnessBoxProps {
	value: rich_text_value,
	renderElement: (props: RenderElementProps) => JSX.Element,
	renderLeaf: (props: RenderLeafProps) => JSX.Element,
}

const box_image_url = (new URL("/assets/red_pt.png", import.meta.url)).toString();

export function PowerToughnessBox(props: PowerToughnessBoxProps) {
	const { value, renderElement, renderLeaf } = props;
	const [editor] = useState(create_card_field_editor);

	const ptOnKeyDown = useCallback((e: KeyboardEvent) => onKeyDown(e, editor), [editor]);
	return (
		<>
			<Slate editor={editor} value={value.children}>
				<PowerToughnessBackground/>
				<Editable
					className="pt"
					renderElement={renderElement}
					renderLeaf={renderLeaf}
					onKeyDown={ptOnKeyDown}
				/>
			</Slate>
		</>
	);
}

function onKeyDown(e: KeyboardEvent, editor: Editor) {
	if (!e.ctrlKey) return;

	switch (e.key) {
		case "`": e.preventDefault(); CustomEditor.toggleCodeBlock(editor); break;
		case "b": e.preventDefault(); CustomEditor.toggleBoldMark(editor); break;
	}
}

function PowerToughnessBackground() {
	const editor = useSlate();
	const is_pt_empty = editor.children.length === 1 && Editor.isEmpty(editor, editor.children[0] as Element);
	return <img className="pt_box" src={box_image_url} style={{ display: is_pt_empty ? "none" : "block" }}/>;
}
