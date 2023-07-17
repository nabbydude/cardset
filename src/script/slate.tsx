import React, { useEffect, useLayoutEffect } from "react";
import { Ancestor, BaseEditor, createEditor, Descendant, Editor, Element, Node, Path, Point, Text, Transforms } from "slate";
import { HistoryEditor, withHistory } from "slate-history";
import { ReactEditor, RenderElementProps as BaseRenderElementProps, RenderLeafProps as BaseRenderLeafProps, withReact, Editable } from "slate-react";
import { Card } from "./components/slate/Card";
import { Field } from "./components/slate/Field";
import { Paragraph, ParagraphElement } from "./components/slate/Paragraph";
import { isStyledText, StyledText, StyledTextElement } from "./components/slate/StyledText";
import { ViewEditor, MultiEditor, withView, withMulti } from "./multiSlate";
import { Document } from "./components/slate/Document";
import { PlainText, PlainTextElement } from "./components/slate/PlainText";
import { Absence } from "./components/slate/Absence";
import { Image, ImageElement, isImage } from "./components/slate/Image";
import { Section, SectionElement } from "./components/slate/Section";
import { HorizontalRule, HorizontalRuleElement, isHorizontalRule } from "./components/slate/HorizontalRule";
import { isManaPip, ManaPip, ManaPipElement } from "./components/slate/ManaPip";
import { isIcon, Icon, IconElement } from "./components/slate/Icon";

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
			| Paragraph
			| (Image | Icon)
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
	const editor = withReact(withMulti(withHistory(createEditor() as BaseEditor)));
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;

	editor.children = initialValue;
	return editor;
}

export function createCardFieldEditor() {
	const editor = withView(withReact(createEditor() as BaseEditor));
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;

	const { normalizeNode } = editor;
	editor.normalizeNode = (entry) => {
		const [node, path] = entry;

		if (isManaPip(node) && editor.isEmpty(node)) {
			editor.removeNodes({ at: path });
		}

		normalizeNode(entry);
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
};

export function renderElement(props: RenderElementProps) {
	switch (props.element.type) {
		case "Section":        return <SectionElement        {...props as RenderElementProps<Section>}/>;
		case "HorizontalRule": return <HorizontalRuleElement {...props as RenderElementProps<HorizontalRule>}/>;
		case "ManaPip":        return <ManaPipElement        {...props as RenderElementProps<ManaPip>}/>;
		case "Image":          return <ImageElement          {...props as RenderElementProps<Image>}/>;
		case "Icon":           return <IconElement           {...props as RenderElementProps<Icon>}/>;
		case "Paragraph":      return <ParagraphElement      {...props as RenderElementProps<Paragraph>}/>;

		default:               return <ParagraphElement      {...props as RenderElementProps<Paragraph>}/>;
	}
}

export function renderLeaf(props: RenderLeafProps) {
	if (isStyledText(props.leaf)) return <StyledTextElement {...props as RenderLeafProps<StyledText>} />;
	return <PlainTextElement {...props} />;
}

export function isVoid(el: Element) {
	return (
		isHorizontalRule(el) ||
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
		isManaPip(el) && el.children.length === 3 && (el.children[0] as Text).text === "" && (el.children[1] as Element).type === "Icon" && (el.children[2] as Text).text === ""
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

	const isStart = Editor.isStart(editor, p, p.path);
	const isEnd = Editor.isEnd(editor, p, p.path);
	if (isStart && (!isEnd || direction === "backward")) {
		// nudge backward
		while (Editor.isStart(editor, p, p.path)) {
			const parent = Node.parent(editor, p.path);
			const indexInParent = p.path[p.path.length - 1];
			if (indexInParent === 0) {
				// first child, go up
				if (!(Element.isElement(parent) && Editor.isInline(editor, parent))) return p;
				const cursorStop = cursorStopOnEdge(parent);
				if (cursorStop !== "outside") return p;
				const newPoint = Editor.before(editor, p, { unit: "offset" });
				if (!newPoint) return p;
				p = newPoint;
				continue;
			} else {
				// dive in to previous node
				const newPoint = Editor.before(editor, p, { unit: "offset" }) as Point;
				const nextNode = Node.get(editor, newPoint.path);
				if (Text.isText(nextNode)) return p; // previous node is butting text, return old point to move as little as possible
				const cursorStop = cursorStopOnEdge(nextNode);
				if (cursorStop !== "inside") return p;
				p = newPoint;
				continue;
			}
		}
	} else if (isEnd) {
		// nudge forward
		while (Editor.isEnd(editor, p, p.path)) {
			const parent = Node.parent(editor, p.path);
			const indexInParent = p.path[p.path.length - 1];
			if (indexInParent === parent.children.length - 1) {
				// last child, go up
				if (!(Element.isElement(parent) && Editor.isInline(editor, parent))) return p;
				const cursorStop = cursorStopOnEdge(parent);
				if (cursorStop !== "outside") return p;
				const newPoint = Editor.after(editor, p, { unit: "offset" });
				if (!newPoint) return p;
				p = newPoint;
			} else {
				// dive in to next node
				const newPoint = Editor.after(editor, p, { unit: "offset" }) as Point;
				const newNode = Node.parent(editor, newPoint.path);
				if (Path.isParent(p.path, newPoint.path)) return p; // old and new point share the same parent, they are sibling text nodes
				const cursorStop = cursorStopOnEdge(newNode);
				if (cursorStop !== "inside") return p;
				p = newPoint;
			}
		}
	}

	return p;
}

export function cursorNudgeSelection(editor: Editor, options: NudgeOptions = {}) {
	const { selection } = editor;
	if (!selection) return;
	const { focus, anchor } = selection;
	const newFocus = cursorNudge(editor, focus, options);
	const newAnchor = cursorNudge(editor, anchor, options);
	const setFocus = !Point.equals(focus, newFocus);
	const setAnchor = !Point.equals(anchor, newAnchor);
	if (setFocus || setAnchor) {
		Transforms.setSelection(editor, {
			focus: setFocus ? newFocus : undefined,
			anchor: setAnchor ? newAnchor : undefined,
		});
	}
}

export function useViewOfMatchingNode(editor: ViewEditor & ReactEditor, parentEditor: MultiEditor, searchPath: Path, partial: Partial<Element>) {
	const node = Node.get(parentEditor, searchPath);
	const oldParentEditor = editor.viewParent.editor;
	const oldParentPath = editor.viewParent.path;
	useEffect(() => {
		return () => MultiEditor.unsetView(editor);
	}, []);
	const alreadyValid = (
		parentEditor === oldParentEditor &&
		oldParentPath &&
		oldParentPath.current &&
		Path.isDescendant(oldParentPath.current, searchPath) &&
		Element.matches(Node.get(oldParentEditor, oldParentPath.current) as Element, partial)
	);
	if (!alreadyValid) {
		const matchingPath = firstMatchingPath(node, partial);
		if (matchingPath) {
			const fullPath = searchPath.concat(matchingPath);
			MultiEditor.setView(editor, parentEditor, fullPath);
		} else {
			MultiEditor.unsetView(editor);
		}
	}
	// this is all the way down here to match against its dependencies properly
	useLayoutEffect(() => {
		if (editor.selection) ReactEditor.toDOMNode(editor, editor).focus();
	}, [editor.viewParent.editor, editor.viewParent.path]);
}
