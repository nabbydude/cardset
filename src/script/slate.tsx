import React from "react";
import { BaseEditor, createEditor, Descendant, Editor, Element, Node, Operation, Path, Text } from "slate";
import { ReactEditor, RenderElementProps as BaseRenderElementProps, RenderLeafProps as BaseRenderLeafProps, withReact, Editable } from "slate-react";
import { Field } from "./components/slate/Field";
import { Paragraph, ParagraphElement } from "./components/slate/Paragraph";
import { StyledText, StyledTextElement } from "./components/slate/StyledText";
import { HorizontalRule, HorizontalRuleElement, isHorizontalRule } from "./components/slate/HorizontalRule";
import { isManaPip, ManaPip, ManaPipElement } from "./components/slate/ManaPip";
import { isIcon, Icon, IconElement } from "./components/slate/Icon";
import { doAutoReplace } from "./autoReplace";
import { cursorNudgeSelection } from "./cursorNudge";
import { project } from "./project";
import { history, SharedHistoryEditor, write_operation_to_history } from "./history";
import { card } from "./card";
import { text_property } from "./property";
import { apply_operation, modify_property_text_operation, text_property_operation } from "./operation";
import { observe, observer, unobserve } from "./observable";

///////////
// Types //
///////////

declare module "slate" {
	interface CustomTypes {
		// Editor: BaseEditor | HistoryEditor | ReactEditor | MultiEditor | ViewEditor,
		Element: (
			| Field
			| HorizontalRule
			| Paragraph

			| Icon

			| ManaPip
		),
		Text: StyledText,
	}
}

export type EditorWithVersion<T extends BaseEditor> = { editor: T, v: number }

// export type ChildOf<N extends Ancestor> = N["children"] extends (infer C)[] ? C : never;
// export type DescendantOf<N extends Ancestor, Before extends Ancestor = never> = ChildOf<N> | (ChildOf<N> extends Before ? never : (ChildOf<N> extends Ancestor ? DescendantOf<ChildOf<N>, N | Before> : never))

// export type DocumentEditor = BaseEditor & ReactEditor & HistoryEditor;

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

// export function createDocumentEditor(initialValue: [Document]): DocumentEditor {
// 	const editor = withReact(withMulti(withHistory(createEditor() as CardsetDocumentEditor)));
// 	editor.isVoid = isVoid;
// 	editor.isInline = isInline;
// 	editor.isElementReadOnly = isAtomic;

// 	editor.addCard = (card: Card) => addCard(editor, card);
// 	editor.deleteCard = (id: number) => deleteCard(editor, id);
// 	editor.deleteCards = (ids: Iterable<number>) => deleteCards(editor, ids);

// 	editor.children = initialValue;
// 	return editor;
// }

export interface BaseCardTextControlEditor extends BaseEditor {
	project: project,

	history: history,
	write_history: boolean,
	propagate_to_property: boolean,

	control_id: string,
	card?: card,
	property: text_property
	nudgeDirection?: "forward" | "backward",
	actionSource?: "user" | "history",
	true_apply: (operation: Operation) => void;
	observer?: observer<text_property_operation>;
	observe: () => void;
	unobserve: () => void;
}
export type CardTextControlEditor = BaseEditor & BaseCardTextControlEditor & SharedHistoryEditor & ReactEditor

export function createTextPropertyControlEditor(project: project, history: history, control_id: string, card: card | undefined, property: text_property): CardTextControlEditor {
	const editor = withReact(createEditor() as BaseEditor & BaseCardTextControlEditor);
	editor.project = project;

	editor.history = history;
	editor.write_history = true;
	editor.propagate_to_property = true;

	editor.control_id = control_id;
	editor.card = card;
	editor.property = property;
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;

	editor.observe = () => {
		if (editor.observer) return;
		editor.observer = (operation) => {
			if (operation.type !== "modify_property_text") throw Error(`unexpected operation "${operation.type}"`);
			withoutEverNormalizing(editor, () => {
				editor.true_apply(operation.operation);
			});
		}
		observe(editor.property, editor.observer);
	}
	editor.unobserve = () => {
		if (!editor.observer) return;
		unobserve(editor.property, editor.observer);
		editor.observer = undefined;
	}

	const { apply, normalize, normalizeNode, onChange } = editor;
	
	editor.true_apply = apply;

	editor.apply = (slate_operation) => {
		if (!editor.propagate_to_property) {
			editor.true_apply(slate_operation);
			return;
		}
		if (!editor.observer) {
			console.warn(`[${editor.card?.id}:${editor.property.id}] Applying operation to TextPropertyControlEditor without observing. Falling back to regular #apply (may cause strange or unstable behavior)`)
			editor.true_apply(slate_operation);
			return;
		}
		if (slate_operation.type === "set_selection") {
			editor.true_apply(slate_operation);
			return;
		}
		const { operations, history, write_history, card, control_id, property, selection } = editor;
		const operation: modify_property_text_operation = { type: "modify_property_text", property, operation: slate_operation };
		if (write_history) {
			write_operation_to_history(
				history,
				{ type: "card_text_control", card: card!, control_id, selection }, // todo: type safety on undefined
				operation,
				operations.length !== 0,
			);
			history.allow_merging = true;
		}
		apply_operation(operation);
		editor.normalize();
	};

	editor.normalize = (options) => {
		normalize(options);
		if (!editor.isNormalizing()) return; // normalize gets called even when normalizing is disabled, so we have to manually check or our code below will get run
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

	// editor.children = editor.property.nodes;

	return editor;
}

// export function createCardTextControlEditor(project: project, history: history, control_id: string, card: card | undefined, property: text_property): CardTextControlEditor {
// 	const editor = withSharedHistory(withReact(createEditor() as BaseEditor & BaseCardTextControlEditor), history);
// 	editor.project = project;
// 	editor.control_id = control_id;
// 	editor.card = card;
// 	editor.property = property;
// 	editor.isVoid = isVoid;
// 	editor.isInline = isInline;
// 	editor.isElementReadOnly = isAtomic;
// 	const { normalize, normalizeNode, onChange } = editor;

// 	editor.normalize = (options) => {
// 		if (!editor.isNormalizing()) return; // normalize gets called even when normalizing is disabled, so we have to manually check or our code below will get run
// 		normalize(options);

// 		withoutEverNormalizing(editor, () => {
// 			cursorNudgeSelection(editor, { direction: editor.nudgeDirection });
// 			editor.nudgeDirection = undefined;
// 		});
// 	};

// 	editor.normalizeNode = (entry, options) => {
// 		const [node, path] = entry;

// 		if (isManaPip(node) && editor.isEmpty(node)) {
// 			editor.removeNodes({ at: path });
// 			return;
// 		}

// 		normalizeNode(entry, options);
// 	};

// 	editor.onChange = (options) => {
// 		onChange(options);
// 		if (editor.actionSource === "user" && editor.operations.find(v => v.type === "insert_text")) {
// 			doAutoReplace(editor);
// 		}
// 		editor.actionSource = undefined;
// 	};
// 	return editor;
// }

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
/**
 * perform one or more operations without normalizing and without forcing a normalize afterward
 */
export function withoutPropagating(editor: CardTextControlEditor, fn: () => void) {
	const value = editor.propagate_to_property;
	editor.propagate_to_property = false;
	try {
		fn();
	} finally {
		editor.propagate_to_property = value;
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

export function safeToDomNode(editor: ReactEditor, node: Node): HTMLElement | undefined {
	try {
		return ReactEditor.toDOMNode(editor, node);
	} catch {
		return undefined;
	}
}

export function renderElement(props: RenderElementProps) {
	switch (props.element.type) {
		case "HorizontalRule": return <HorizontalRuleElement {...props as RenderElementProps<HorizontalRule>}/>;
		case "ManaPip":        return <ManaPipElement        {...props as RenderElementProps<ManaPip       >}/>;
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
		isIcon(el)
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
