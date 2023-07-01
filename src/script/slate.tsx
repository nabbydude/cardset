import React, { useEffect } from "react";
import { Ancestor, BaseEditor, createEditor, Descendant, Editor, Element, Node, Path, Point, Text, Transforms } from "slate";
import { HistoryEditor, withHistory } from "slate-history";
import { ReactEditor, RenderElementProps as BaseRenderElementProps, RenderLeafProps as BaseRenderLeafProps, withReact } from "slate-react";
import { Card } from "./components/slate/Card";
import { CodeBlock, CodeBlockElement } from "./components/slate/CodeBlock";
import { Field } from "./components/slate/Field";
import { Paragraph, ParagraphElement } from "./components/slate/Paragraph";
import { isStyledText, StyledText, StyledTextElement } from "./components/slate/StyledText";
import { ViewEditor, MultiEditor, withView, withMulti } from "./multi_slate";
import { Document } from "./components/slate/Document";
import { PlainText, PlainTextElement } from "./components/slate/PlainText";
import { Absence } from "./components/slate/Absence";
import { Image, ImageElement, isImage } from "./components/slate/Image";
import { Section, SectionElement } from "./components/slate/Section";
import { HorizontalRule, HorizontalRuleElement, isHorizontalRule } from "./components/slate/HorizontalRule";
import { isManaPip, ManaPip, ManaPipElement } from "./components/slate/ManaPip";
import { isSymbol, Symbol, SymbolElement } from "./components/slate/Symbol";

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
			| (Image | Symbol)
			| ManaPip
		),
		Text: StyledText | PlainText,
	}
}

export type EditorWithVersion<T extends BaseEditor> = { editor: T, v: number }

// export type ChildOf<N extends Ancestor> = N["children"] extends (infer C)[] ? C : never;
// export type DescendantOf<N extends Ancestor, Before extends Ancestor = never> = ChildOf<N> | (ChildOf<N> extends Before ? never : (ChildOf<N> extends Ancestor ? DescendantOf<ChildOf<N>, N | Before> : never))

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
	const editor = withReact(withMulti(withHistory(createEditor() as BaseEditor)));
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;

	editor.children = initial_value;
	return editor;
}

export function create_card_field_editor() {
	const editor = withView(withReact(createEditor() as BaseEditor));
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;

	const { normalizeNode } = editor;
	editor.normalizeNode = (entry, options) => {
		const [node, path] = entry

		if (isManaPip(node) && editor.isEmpty(node)) {
			editor.removeNodes({ at: path });
		}

		normalizeNode(entry);
	}

	editor.children = empty();
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
}

export function renderElement(props: RenderElementProps) {
	switch (props.element.type) {
		case "Section":        return <SectionElement        {...props as RenderElementProps<Section>}/>;
		case "HorizontalRule": return <HorizontalRuleElement {...props as RenderElementProps<HorizontalRule>}/>;
		case "CodeBlock":      return <CodeBlockElement      {...props as RenderElementProps<CodeBlock>}/>;
		case "ManaPip":        return <ManaPipElement        {...props as RenderElementProps<ManaPip>}/>;
		case "Image":          return <ImageElement          {...props as RenderElementProps<Image>}/>;
		case "Symbol":         return <SymbolElement         {...props as RenderElementProps<Symbol>}/>;
		case "Paragraph":      return <ParagraphElement      {...props as RenderElementProps<Paragraph>}/>;
		default: {
			return <ParagraphElement {...props}/>;
		}
	}
}

export function renderLeaf(props: RenderLeafProps) {
	if (isStyledText(props.leaf)) return <StyledTextElement {...props as RenderLeafProps<StyledText>} />
	return <PlainTextElement {...props} />
}

export function isVoid(el: Element) {
	return (
		isHorizontalRule(el) ||
		isImage(el)
	);
}

export function isInline(el: Element) {
	return isManaPip(el) || isSymbol(el);
}

/**
 * returns true if the component acts like a void in the editor (ie cant be edited within) but still contains markup content
 */
export function isAtomic(el: Element) {
	return (
		isManaPip(el) && el.children.length === 3 && (el.children[0] as Text).text === "" && (el.children[1] as Element).type === "Symbol" && (el.children[2] as Text).text === ""
	);
}


// where the cursor stops when on the edge of a node
// unused for now. isElementReadOnly is making everything work out so far but I might want this or something like it to make the cursor visual more consistent
export type CursorStop = "inside" | "outside" | "both" | "either";
export function cursorStopOnEdge(el: Ancestor): CursorStop {
	if (isManaPip(el)) return "outside";
	return "either";
}

export interface NudgeOptions {
	direction?: "forward" | "backward",
}

export function cursorNudge(editor: Editor, point: Point, options: NudgeOptions = {}): Point {
	const { direction = "forward" } = options;
	let p: Point | undefined = point;

	const is_start = Editor.isStart(editor, p, p.path);
	const is_end = Editor.isEnd(editor, p, p.path);
	if (is_start && (!is_end || direction === "backward")) {
		// nudge backward
		while (Editor.isStart(editor, p, p.path)) {
			const parent = Node.parent(editor, p.path);
			const index_in_parent = p.path[p.path.length - 1];
			if (index_in_parent === 0) {
				// first child, go up
				if (!(Element.isElement(parent) && Editor.isInline(editor, parent))) return p;
				const cursor_stop = cursorStopOnEdge(parent);
				if (cursor_stop !== "outside") return p;
				const new_point = Editor.before(editor, p, { unit: "offset" });
				if (!new_point) return p;
				p = new_point;
				continue;
			} else {
				// dive in to previous node
				const new_point = Editor.before(editor, p, { unit: "offset" }) as Point;
				const next_node = Node.get(editor, new_point.path);
				if (Text.isText(next_node)) return p; // previous node is butting text, return old point to move as little as possible
				const cursor_stop = cursorStopOnEdge(next_node);
				if (cursor_stop !== "inside") return p;
				p = new_point;
				continue;
			}
		}
	} else if (is_end) {
		// nudge forward
		while (Editor.isEnd(editor, p, p.path)) {
			const parent = Node.parent(editor, p.path);
			const index_in_parent = p.path[p.path.length - 1];
			if (index_in_parent === parent.children.length - 1) {
				// last child, go up
				if (!(Element.isElement(parent) && Editor.isInline(editor, parent))) return p;
				const cursor_stop = cursorStopOnEdge(parent);
				if (cursor_stop !== "outside") return p;
				const new_point = Editor.after(editor, p, { unit: "offset" });
				if (!new_point) return p;
				p = new_point;
			} else {
				// dive in to next node
				const new_point = Editor.after(editor, p, { unit: "offset" }) as Point;
				const new_node = Node.parent(editor, new_point.path);
				if (Path.isParent(p.path, new_point.path)) return p; // old and new point share the same parent, they are sibling text nodes
				const cursor_stop = cursorStopOnEdge(new_node);
				if (cursor_stop !== "inside") return p;
				p = new_point;
			}
		}
	}

	return p;
}

export function cursorNudgeSelection(editor: Editor, options: NudgeOptions = {}) {
	const { selection } = editor;
	if (!selection) return;
	const { focus, anchor } = selection;
	const new_focus = cursorNudge(editor, focus, options);
	const new_anchor = cursorNudge(editor, anchor, options);
	const set_focus = !Point.equals(focus, new_focus);
	const set_anchor = !Point.equals(anchor, new_anchor);
	if (set_focus || set_anchor) {
		Transforms.setSelection(editor, {
			focus: set_focus ? new_focus : undefined,
			anchor: set_anchor ? new_anchor : undefined,
		});
	}
}

export function useViewOfMatchingNode(editor: ViewEditor, parent_editor: MultiEditor, search_path: Path, partial: Partial<Element>) {
	const node = Node.get(parent_editor, search_path);
	const old_parent_editor = editor.viewParent.editor;
	const old_parent_path = editor.viewParent.path;
	useEffect(() => {
		return () => MultiEditor.unsetView(editor);
	}, []);
	const already_valid = (
		parent_editor === old_parent_editor &&
		old_parent_path &&
		old_parent_path.current &&
		Path.isDescendant(old_parent_path.current, search_path) &&
		Element.matches(Node.get(old_parent_editor, old_parent_path.current) as Element, partial)
	);
	if (already_valid) return;
	const matching_path = first_matching_path(node, partial);
	if (!matching_path) {
		MultiEditor.unsetView(editor);
		return;
	}
	const full_path = search_path.concat(matching_path);
	MultiEditor.setView(editor, parent_editor, full_path);
}
