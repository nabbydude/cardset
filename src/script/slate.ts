import { BaseEditor, createEditor, Editor, Text, Transforms } from "slate";
import { HistoryEditor, withHistory } from "slate-history";
import { ReactEditor, withReact } from "slate-react";
import { CodeBlock } from "./components/slate/CodeBlock";
import { Paragraph } from "./components/slate/Paragraph";
import { StyledText } from "./components/slate/StyledText";

declare module "slate" {
	interface CustomTypes {
		Editor: BaseEditor & HistoryEditor & ReactEditor,
		Element: Paragraph | CodeBlock,
		Text: StyledText,
	}
}

export function create_card_field_editor() {
	return withReact(withHistory(createEditor()));
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
			match: n => Editor.isBlock(editor, n) && n.type === "CodeBlock",
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
			{ match: n => Editor.isBlock(editor, n) }
		);
	},
}
