import React from "react";
import { Ancestor, BaseEditor, BaseElement, BaseText, createEditor, Descendant, Editor, Element, Node, NodeEntry, Path, Text, Transforms } from "slate";
import { HistoryEditor, withHistory } from "slate-history";
import { ReactEditor, RenderElementProps as BaseRenderElementProps, RenderLeafProps as BaseRenderLeafProps, withReact } from "slate-react";
import { Card } from "./components/slate/Card";
import { CodeBlock, CodeBlockElement } from "./components/slate/CodeBlock";
import { Field } from "./components/slate/Field";
import { Paragraph, ParagraphElement } from "./components/slate/Paragraph";
import { isStyledText, StyledText, StyledTextElement } from "./components/slate/StyledText";
import { ViewEditor, MultiEditor, withView, withMulti, withHistoryShim } from "./multi_slate";
import { Document } from "./components/slate/Document";
import { PlainText, PlainTextElement } from "./components/slate/PlainText";
import { Absence } from "./components/slate/Absence";
import { Image } from "./components/slate/Image";
import { Section, SectionElement } from "./components/slate/Section";
import { HorizontalRule, HorizontalRuleElement, isHorizontalRule } from "./components/slate/HorizontalRule";



///////////
// Types //
///////////

declare module "slate" {
	interface CustomTypes {
		Editor: BaseEditor | HistoryEditor | ReactEditor | MultiEditor | ViewEditor,
		Element: (
			| Absence
			| (Document | Card | Field | Section)
			| HorizontalRule
			| (Paragraph | CodeBlock)
			| Image
		),
		Text: StyledText | PlainText,
	}
}

export type EditorWithVersion<T extends BaseEditor> = { editor: T, v: number }

export type ChildOf<N extends Ancestor> = N["children"] extends (infer C)[] ? C : never;
export type DescendantOf<N extends Ancestor> = ChildOf<N> | (ChildOf<N> extends Ancestor ? DescendantOf<ChildOf<N>> : never)

export type DocumentEditor = BaseEditor & ReactEditor & HistoryEditor & MultiEditor;

export interface RenderElementProps<T extends Element = Element> extends BaseRenderElementProps {
	element: T;
}

export interface RenderLeafProps<T extends Text = Text> extends BaseRenderLeafProps {
	leaf: T;
	text: T;
}

//////////
// Code //
//////////

export function empty(): [Absence] {
	return [{ type: "Absence", children: [{ text: "" }] }];
}

export function create_document_editor(initial_value: [Document]): DocumentEditor {
	const editor = withReact(withMulti(withHistory(createEditor())));
	editor.children = initial_value;
	return editor;
}

export function create_card_field_editor() {
	const editor = withHistoryShim(withView(withReact(createEditor())));
	editor.isVoid = isVoid;
	return editor;
}

export function to_plaintext(nodes: Descendant[]) {
	return nodes.map(n => Node.string(n)).join("\n");
}
export function to_single_line_plaintext(nodes: Descendant[]) {
	return nodes.map(n => Node.string(n)).join(" ");
}

export function first_matching_entry<T extends Element>(root: Node, partial: Partial<T>): [T, Path] | undefined {
	for (const entry of Node.elements(root)) {
		if (Element.matches(entry[0], partial)) return entry as [T, Path];
	}
	return undefined;
}

export function first_matching_element<T extends Element>(root: Node, partial: Partial<T>): T | undefined {
	return (first_matching_entry(root, partial) ?? [undefined])[0];
}

export function first_matching_path(root: Node, partial: Partial<Element>): Path | undefined {
	return (first_matching_entry(root, partial) ?? [undefined, undefined])[1];
}

// should we move this somewhere better?
export const CustomEditor = {
	/**
	 * perform one or more operations without normalizing and without forcing a normalize afterward
	 */
	withoutEverNormalizing(editor: Editor, fn: () => void) {
		const value = Editor.isNormalizing(editor);
		Editor.setNormalizing(editor, false);
		try {
			fn();
		} finally {
			Editor.setNormalizing(editor, value);
		}
	},

	isBoldMarkActive(editor: Editor) {
		const [match] = Editor.nodes(editor, {
			match: n => isStyledText(n) && n.bold === true,
			universal: true,
		});
		return !!match;
	},

	isItalicMarkActive(editor: Editor) {
		const [match] = Editor.nodes(editor, {
			match: n => isStyledText(n) && n.italic === true,
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

	toggleItalicMark(editor: Editor) {
		const isActive = CustomEditor.isItalicMarkActive(editor);
		Transforms.setNodes(
			editor,
			{ italic: !isActive },
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
		case "Section": return <SectionElement {...props as RenderElementProps<Section>}/>;
		case "HorizontalRule": return <HorizontalRuleElement {...props as RenderElementProps<HorizontalRule>}/>;
		case "CodeBlock": return <CodeBlockElement {...props as RenderElementProps<CodeBlock>}/>;
		default: {
		// case "Paragraph": {
			return <ParagraphElement {...props}/>;
		}
		
	}
}

export function renderLeaf(props: RenderLeafProps) {
	if (isStyledText(props.leaf)) return <StyledTextElement {...props as RenderLeafProps<StyledText>} />
	return <PlainTextElement {...props} />
}

export function isVoid(element: Element) {
	return isHorizontalRule(element);
}