import React from "react";
import { BaseEditor, createEditor, Descendant, Editor, Element, Node, Path, Text, Transforms } from "slate";
import { HistoryEditor, withHistory } from "slate-history";
import { ReactEditor, RenderElementProps as BaseRenderElementProps, RenderLeafProps as BaseRenderLeafProps, withReact, Editable } from "slate-react";
import { Card, createTestCard } from "./components/slate/Card";
import { Field } from "./components/slate/Field";
import { Paragraph, ParagraphElement } from "./components/slate/Paragraph";
import { StyledText, StyledTextElement } from "./components/slate/StyledText";
import { ViewEditor, MultiEditor, withView, withMulti } from "./multiSlate";
import { Document } from "./components/slate/Document";
import { Absence } from "./components/slate/Absence";
import { Image, ImageElement, isImage } from "./components/slate/Image";
import { Section, SectionElement } from "./components/slate/Section";
import { HorizontalRule, HorizontalRuleElement, isHorizontalRule } from "./components/slate/HorizontalRule";
import { isManaPip, ManaPip, ManaPipElement } from "./components/slate/ManaPip";
import { isIcon, Icon, IconElement } from "./components/slate/Icon";
import { doAutoReplace } from "./autoReplace";
import { cursorNudgeSelection } from "./cursorNudge";

///////////
// Types //
///////////

declare module "slate" {
	interface CustomTypes {
		// Editor: BaseEditor | HistoryEditor | ReactEditor | MultiEditor | ViewEditor,
		Element: (
			| Absence
			| (Document | Card | Field | Section)
			| HorizontalRule
			| Paragraph
			| (Image | Icon)
			| ManaPip
		),
		Text: StyledText,
	}
}

export type EditorWithVersion<T extends BaseEditor> = { editor: T, v: number }

// export type ChildOf<N extends Ancestor> = N["children"] extends (infer C)[] ? C : never;
// export type DescendantOf<N extends Ancestor, Before extends Ancestor = never> = ChildOf<N> | (ChildOf<N> extends Before ? never : (ChildOf<N> extends Ancestor ? DescendantOf<ChildOf<N>, N | Before> : never))

export type DocumentEditor = BaseEditor & ReactEditor & HistoryEditor & MultiEditor;

export interface RenderElementProps<T extends Element = Element> extends BaseRenderElementProps {
	element: T,
}

export interface RenderLeafProps<T extends Text = Text> extends BaseRenderLeafProps {
	leaf: T,
	text: T,
}

export type EditableProps = Parameters<typeof Editable>[0];

//////////
// Code //
//////////

export function empty(): [Absence] {
	return [{ type: "Absence", children: [{ text: "" }] }];
}

export function createDocumentEditor(initialValue: [Document]): DocumentEditor {
	const editor = withReact(withMulti(withHistory(createEditor())));
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;

	editor.children = initialValue;
	return editor;
}

export interface CardFieldEditor extends BaseEditor {
	nudgeDirection?: "forward" | "backward",
	actionSource?: "user" | "history",
}

export function createCardFieldEditor(): BaseEditor & CardFieldEditor & ReactEditor & ViewEditor {
	const editor = withView(withReact(createEditor() as BaseEditor & CardFieldEditor));
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;
	const { normalize, normalizeNode, onChange } = editor;

	editor.normalize = (options) => {
		if (!editor.isNormalizing()) return; // normalize gets called even when normalizing is disabled, so we have to manually check or our code below will get run
		normalize(options);

		withoutEverNormalizing(editor, () => {
			cursorNudgeSelection(editor, { direction: editor.nudgeDirection });
			editor.nudgeDirection = undefined;
		});
	};

	editor.normalizeNode = (entry, options) => {
		const [node, path] = entry;

		if (isManaPip(node) && editor.isEmpty(node)) {
			editor.removeNodes({ at: path });
			return;
		}

		normalizeNode(entry, options);
	};

	editor.onChange = (options) => {
		onChange(options);
		if (editor.actionSource === "user" && editor.operations.find(v => v.type === "insert_text")) {
			doAutoReplace(editor);
		}
		editor.actionSource = undefined;
	};

	editor.children = empty();
	return editor;
}

export function toPlaintext(nodes: Descendant[]) {
	return nodes.map(n => Node.string(n)).join("\n");
}

export function toSingleLinePlaintext(nodes: Descendant[]) {
	return nodes.map(n => Node.string(n)).join(" ");
}

export function firstMatchingEntry<T extends Element>(root: Node, partial: Partial<T>): [T, Path] | undefined {
	for (const entry of Node.elements(root)) {
		if (Element.matches(entry[0], partial)) return entry as [T, Path];
	}
	return undefined;
}

export function firstMatchingElement<T extends Element>(root: Node, partial: Partial<T>): T | undefined {
	return firstMatchingEntry(root, partial)?.[0];
}

export function firstMatchingPath(root: Node, partial: Partial<Element>): Path | undefined {
	return firstMatchingEntry(root, partial)?.[1];
}


/**
 * tried to be clever with re-searching the tree but this doesnt properly rerender on frame selection
 * maybe one day this code will be useful, but not in its current state
 */
// export function useMatchingEntry<T extends Element>(root: Ancestor, searchPath: Path, partial: Partial<T>): NodeEntry<T> | undefined {
// 	const cachedRoot = useRef<Ancestor>();
// 	const cachedEntry = useRef<NodeEntry<T>>();
// 	const [node, path] = cachedEntry.current ?? [undefined, undefined];
// 	const alreadyValid = (
// 		root === cachedRoot.current &&
// 		path &&
// 		Path.isDescendant(path, searchPath) &&
// 		Element.matches(node, partial)
// 	);
// 	if (!alreadyValid) {
// 		cachedRoot.current = root;
// 		cachedEntry.current = firstMatchingEntry(Node.get(root, searchPath), partial);
// 	}
// 	return cachedEntry.current;
// }

/**
 * perform one or more operations without normalizing and without forcing a normalize afterward
 */
export function withoutEverNormalizing(editor: Editor, fn: () => void) {
	const value = Editor.isNormalizing(editor);
	Editor.setNormalizing(editor, false);
	try {
		fn();
	} finally {
		Editor.setNormalizing(editor, value);
	}
}

export function toggleMark(editor: Editor, mark: keyof StyledText) {
	const isActive = isMarkActive(editor, mark);
	if (isActive) {
		editor.removeMark(mark);
	} else {
		editor.addMark(mark, true);
	}
}

export function isMarkActive(editor: Editor, key: keyof StyledText) {
	const [match] = editor.nodes({
		match: n => Text.isText(n) && n[key] === true,
		universal: true,
	});
	return !!match;
}

export function renderElement(props: RenderElementProps) {
	switch (props.element.type) {
		case "Section":        return <SectionElement        {...props as RenderElementProps<Section       >}/>;
		case "HorizontalRule": return <HorizontalRuleElement {...props as RenderElementProps<HorizontalRule>}/>;
		case "ManaPip":        return <ManaPipElement        {...props as RenderElementProps<ManaPip       >}/>;
		case "Image":          return <ImageElement          {...props as RenderElementProps<Image         >}/>;
		case "Icon":           return <IconElement           {...props as RenderElementProps<Icon          >}/>;
		case "Paragraph":      return <ParagraphElement      {...props as RenderElementProps<Paragraph     >}/>;

		default:               return <ParagraphElement      {...props as RenderElementProps<Paragraph     >}/>;
	}
}

export function renderLeaf(props: RenderLeafProps) {
	return <StyledTextElement {...props as RenderLeafProps<StyledText>} />;
}

export function isVoid(el: Element) {
	return (
		isHorizontalRule(el) ||
		isIcon(el) ||
		isImage(el)
	);
}

export function isInline(el: Element) {
	return isManaPip(el) || isIcon(el);
}

/**
 * returns true if the component acts like a void in the editor (ie cant be edited within) but still contains markup content
 */
export function isAtomic(el: Element) {
	return (
		(isManaPip(el) && el.children.length === 3 && (el.children[0] as Text).text === "" && (el.children[1] as Element).type === "Icon" && (el.children[2] as Text).text === "")
	);
}

export function addNewCardToDoc(doc: DocumentEditor): Card {
	const documentNode = doc.children[0] as Document;
	const child = documentNode.children[0];
	const card = createTestCard("New Card", "colorless");
	doc.withoutNormalizing(() => {
		if (documentNode.children.length === 1 && (child as Text).text === "") {
			doc.insertNodes(card, { at: [0, 0] }); // if the list is empty an empty text node gets added when normalized. When normalized after adding, if the text node is first, the block is assumed to contain inlines only, and deletes the following block node, so we put at the start
		} else {
			doc.insertNodes(card, { at: [0, documentNode.children.length] });
		}
	});
	return card;
}

export function deleteCardFromDoc(doc: DocumentEditor, id: number) {
	const path = firstMatchingPath(doc, { type: "Card", id });
	if (!path) throw Error("This card doesn't exist for some reason!");
	Transforms.delete(doc, { at: path });
}

export function deleteCardsFromDoc(doc: DocumentEditor, ids: Iterable<number>) {
	for (const id of ids) deleteCardFromDoc(doc, id);
}
