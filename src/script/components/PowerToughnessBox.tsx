import React, { KeyboardEvent, useCallback, useContext, useEffect, useState } from "react";
import { Editor, Element } from "slate";
import { Editable, RenderElementProps, RenderLeafProps, Slate, useSlate, withReact } from "slate-react";
import { FocusedEditorContext } from "../focused_editor";
import { MultiEditor } from "../multi_slate";
import { create_card_field_editor, CustomEditor, find_path_to_field, renderElement, renderLeaf } from "../slate";
import { CardFieldProps } from "./CardField";

export interface PowerToughnessBoxProps {
	editor: Editor,
	renderElement: (props: RenderElementProps) => JSX.Element,
	renderLeaf: (props: RenderLeafProps) => JSX.Element,
}

const box_image_url = (new URL("/assets/red_pt.png", import.meta.url)).toString();

export function PowerToughnessBox(props: CardFieldProps) {
	const { card, field, cardEditor } = props;
	const [editor] = useState(create_card_field_editor);
	const [, setFocusedEditor] = useContext(FocusedEditorContext);
	useEffect(() => { const path = find_path_to_field(cardEditor as Editor, field); if(path) MultiEditor.setView(editor, cardEditor, path); }, [card]);

	return (
		<>
			<Slate editor={editor} value={editor.children}>
				<PowerToughnessBackground/>
				<Editable
					className={field}
					onFocus={useCallback(() => setFocusedEditor(editor), [setFocusedEditor, editor])}
					onBlur={useCallback(() => setFocusedEditor(null), [setFocusedEditor])}
					renderElement={renderElement}
					renderLeaf={renderLeaf}
					onKeyDown={useCallback((e: KeyboardEvent) => onKeyDown(e, editor), [editor])}
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
