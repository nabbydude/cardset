import React from "react";
import { BaseEditor, createEditor, Editor, Element, Node, Text, Transforms } from "slate";
import { HistoryEditor, withHistory } from "slate-history";
import { ReactEditor, RenderElementProps, RenderLeafProps, withReact } from "slate-react";
import { Card } from "./components/slate/Card";
import { CodeBlock, CodeBlockElement } from "./components/slate/CodeBlock";
import { Field } from "./components/slate/Field";
import { Paragraph, ParagraphElement } from "./components/slate/Paragraph";
import { StyledText, StyledTextElement } from "./components/slate/StyledText";
import { ViewEditor, MultiEditor, withView, withMulti, withHistoryShim } from "./multi_slate";

declare module "slate" {
	interface CustomTypes {
		Editor: BaseEditor & HistoryEditor & ReactEditor & (MultiEditor | {}) & (ViewEditor | {}),
		Element: Paragraph | CodeBlock | Card | Field,
		Text: StyledText,
	}
}

export type ElementType = Element["type"];

export function create_card_editor(card: Card) {
	const editor = withMulti(withReact(createEditor()));
	editor.children = [card];
	return editor;
}

export function create_card_field_editor() {
	// return withView(withReact(createEditor()));
	return withHistoryShim(withView(withReact(createEditor())));
}

export function find_path_to_field(editor: BaseEditor, field_name: string) {
	for (const [element, path] of Node.elements(editor as Editor)) {
		if (element.type === "Field" && element.name === field_name) return path;
	}
}

// should we move this somewhere better?
export const CustomEditor = {
	isBoldMarkActive(editor: Editor) {
		const [match] = Editor.nodes(editor, {
			match: n => Text.isText(n) && n.bold === true,
			universal: true,
		});
		return !!match;
	},

	isCodeBlockActive(editor: Editor) {
		const [match] = Editor.nodes(editor, {
			match: n => !Editor.isEditor(n) && !("text" in n) && Editor.isBlock(editor, n) && n.type === "CodeBlock",
		});
		return !!match;
	},

	toggleBoldMark(editor: Editor) {
		const isActive = CustomEditor.isBoldMarkActive(editor);
		Transforms.setNodes(
			editor,
			{ bold: !isActive },
			{ match: n => Text.isText(n), split: true }
		);
	},

	toggleCodeBlock(editor: Editor) {
		const isActive = CustomEditor.isCodeBlockActive(editor);
		Transforms.setNodes(
			editor,
			{ type: isActive ? "Paragraph" : "CodeBlock" },
			{ match: n => !Editor.isEditor(n) && !("text" in n) && Editor.isBlock(editor, n) }
		);
	},
}


export function renderElement(props: RenderElementProps) {
	switch (props.element.type) {
		case "CodeBlock": {
			return <CodeBlockElement {...props}/>;
		}
		default: {
		// case "Paragraph": {
			return <ParagraphElement {...props}/>;
		}
		
	}
}

export function renderLeaf(props: RenderLeafProps) {
	return <StyledTextElement {...props} />
}

// Editor.withoutNormalizing = (editor: Editor, fn: () => void): void => {
// 	const value = Editor.isNormalizing(editor)
// 	Editor.setNormalizing(editor, false)
	
// 	// TIMEBOMB: THIS ONLY GOES UP/DOWN ONE LEVEL. Views of views will give this issues but I dont do that rn so whatever
// 	let others: BaseEditor[];
// 	if (MultiEditor.isMultiEditor(editor)) {
// 		others = [...editor.views.keys()];
// 	} else if (MultiEditor.isViewEditor(editor) && editor.viewParent.editor) {
// 		others = [editor.viewParent.editor];
// 	} else {
// 		others = [];
// 	}
// 	const values = others.map(e => {
// 		const v = Editor.isNormalizing(e as Editor);
// 		Editor.setNormalizing(e as Editor, false);
// 		return [e, v] as const;
// 	});

// 	try {
// 		fn()
// 	} finally {
// 		Editor.setNormalizing(editor, value)
// 		for (const [e, v] of values) Editor.setNormalizing(e as Editor, v);
// 	}
// 	if (value) Editor.normalize(editor);
// 	for (const [e, v] of values) if (v) Editor.normalize(e as Editor);
// }
