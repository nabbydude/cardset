import { BaseEditor, createEditor, Descendant, Editor, EditorPositionsOptions, Element, isEditor, Node, Operation, Path, Point, Range, Text } from "slate";
import { ReactEditor, withReact, Editable } from "slate-react";
import { Field } from "./components/slate/Field";
import { Paragraph } from "./components/slate/Paragraph";
import { StyledText } from "./components/slate/StyledText";
import { HorizontalRule, isHorizontalRule } from "./components/slate/HorizontalRule";
import { isManaPip, ManaPip } from "./components/slate/ManaPip";
import { isIcon, Icon } from "./components/slate/Icon";
import { doAutoReplace } from "./autoReplace";
import { apply_and_write, history } from "./history";
import { text_property } from "./property";
import { text_property_operation } from "./operation";
import { observe, observer, unobserve } from "./observable";
import { getCharacterDistance, getWordDistance, splitByCharacterDistance } from "./slate_utils/string";
import { text_control } from "./control";
import { card } from "./card";

///////////
// Types //
///////////

declare module "slate" {
	interface CustomTypes {
		Editor: TextControlEditor,
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

export type EditableProps = Parameters<typeof Editable>[0];

//////////
// Code //
//////////

export interface BaseCardTextControlEditor extends BaseEditor {
	history: history,

	card: card,
	control: text_control,
	get_property: () => text_property,
	propagate_to_property: boolean,

	true_apply: (operation: Operation) => void,
	
	observer?: observer<text_property_operation>,
	observe: () => void,
	unobserve: () => void,

	actionSource?: "user" | "history",
}
export type TextControlEditor = BaseCardTextControlEditor & ReactEditor;

export function createCardTextControlEditor(history: history, card: card, control: text_control): TextControlEditor {
	const editor = withReact(createEditor() as BaseCardTextControlEditor);

	editor.history = history;
	editor.propagate_to_property = true;

	editor.card = card;
	editor.control = control;
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;

	editor.get_property = () => {
		return editor.card.properties.get(editor.control.property_id) as text_property;
	}

	editor.observe = () => {
		editor.unobserve();
		editor.observer = (operation) => {
			if (operation.type !== "modify_property_text") throw Error(`unexpected operation "${operation.type}"`);
			withoutEverNormalizing(editor, () => {
				editor.true_apply(operation.operation);
			});
		}
		observe(editor.get_property(), editor.observer);
	}
	editor.unobserve = () => {
		if (!editor.observer) return;
		unobserve(editor.get_property(), editor.observer);
		editor.observer = undefined;
	}

	editor.positions = (options) => positions(editor, options);

	const { apply, normalizeNode, onChange } = editor;
	
	editor.true_apply = apply;

	editor.apply = (slate_operation) => {
		if (!editor.propagate_to_property) {
			editor.true_apply(slate_operation);
			return;
		}
		if (!editor.observer) {
			console.warn(`[${editor.get_property().id}] Applying operation to TextPropertyControlEditor without observing. Falling back to regular #apply (may cause strange or unstable behavior)`)
			editor.true_apply(slate_operation);
			return;
		}
		if (slate_operation.type === "set_selection") {
			editor.true_apply(slate_operation);
			return;
		}
		const { operations, history, card, control, selection } = editor;
		apply_and_write(
			history,
			{ type: "card_text_control", card, control, selection },
			{ type: "modify_property_text", property: editor.get_property(), operation: slate_operation },
			operations.length !== 0,
		);
		history.allow_merging = true;
		editor.normalize(); // apply usually ends by calling this so since we aren't directly calling super-apply, we do too
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

	return editor;
}

export function toPlaintext(nodes: Descendant[]) {
	return nodes.map(n => Node.string(n)).join("\n");
}

export function toSingleLinePlaintext(nodes: Descendant[]) {
	return nodes.map(n => Node.string(n)).join(" ");
}

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
 * perform one or more operations without sending to the attached property
 */
export function withoutPropagating(editor: TextControlEditor, fn: () => void) {
	const value = editor.propagate_to_property;
	editor.propagate_to_property = false;
	try {
		fn();
	} finally {
		editor.propagate_to_property = value;
	}
}

export function toggleMark(editor: Editor, mark: keyof Omit<StyledText, "text">) {
	const isActive = editor.getMarks()?.[mark];
	if (isActive) {
		editor.removeMark(mark);
	} else {
		editor.addMark(mark, true);
	}
}

export function safeToDomNode(editor: ReactEditor, node: Node): HTMLElement | undefined {
	try {
		return ReactEditor.toDOMNode(editor, node);
	} catch {
		return undefined;
	}
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


export function isBoundarySplittingInline(el: Element) {
	return isManaPip(el);
}

/**
 * overriding the native slate positions generator with minor changes
 */
export function* positions(
	editor: Editor,
	options: EditorPositionsOptions = {}
): Generator<Point, void, undefined> {
	const {
		at = editor.selection,
		unit = 'offset',
		reverse = false,
		voids = false,
		ignoreNonSelectable = false,
	} = options

	if (!at) {
		return
	}

	/**
	 * Algorithm notes:
	 *
	 * Each step `distance` is dynamic depending on the underlying text
	 * and the `unit` specified.  Each step, e.g., a line or word, may
	 * span multiple text nodes, so we iterate through the text both on
	 * two levels in step-sync:
	 *
	 * `leafText` stores the text on a text leaf level, and is advanced
	 * through using the counters `leafTextOffset` and `leafTextRemaining`.
	 *
	 * `blockText` stores the text on a block level, and is shortened
	 * by `distance` every time it is advanced.
	 *
	 * We only maintain a window of one blockText and one leafText because
	 * a block node always appears before all of its leaf nodes.
	 */

	const range = Editor.range(editor, at)
	const [start, end] = Range.edges(range)
	const first = reverse ? end : start
	let isNewBlock = false
	let isNewBoundarySplittingInline = false
	let isAfterBoundarySplittingInline = false
	let blockText = ''
	let distance = 0 // Distance for leafText to catch up to blockText.
	let leafTextRemaining = 0
	let leafTextOffset = 0

	// Iterate through all nodes in range, grabbing entire textual content
	// of block nodes in blockText, and text nodes in leafText.
	// Exploits the fact that nodes are sequenced in such a way that we first
	// encounter the block node, then all of its text nodes, so when iterating
	// through the blockText and leafText we just need to remember a window of
	// one block node and leaf node, respectively.
	for (const [node, path] of Editor.nodes(editor, {
		at,
		reverse,
		voids,
		ignoreNonSelectable,
	})) {
		/*
		 * ELEMENT NODE - Yield position(s) for voids, collect blockText for blocks
		 */
		if (Element.isElement(node)) {
			// Void nodes are a special case, so by default we will always
			// yield their first point. If the `voids` option is set to true,
			// then we will iterate over their content.
			if (!voids && (editor.isVoid(node) || editor.isElementReadOnly(node))) {
				yield Editor.start(editor, path)
				continue
			}

			// Inline element nodes are ignored as they don't themselves
			// contribute to `blockText` or `leafText` - their parent and
			// children do.
			if (editor.isInline(node)) {
				isNewBoundarySplittingInline ||= editor.hasInlines(node) && isBoundarySplittingInline(node)
				continue
			}

			// Block element node - set `blockText` to its text content.
			if (Editor.hasInlines(editor, node)) {
				// We always exhaust block nodes before encountering a new one:
				//   console.assert(blockText === '',
				//     `blockText='${blockText}' - `+
				//     `not exhausted before new block node`, path)

				// Ensure range considered is capped to `range`, in the
				// start/end edge cases where block extends beyond range.
				// Equivalent to this, but presumably more performant:
				//   blockRange = Editor.range(editor, ...Editor.edges(editor, path))
				//   blockRange = Range.intersection(range, blockRange) // intersect
				//   blockText = Editor.string(editor, blockRange, { voids })
				const e = Path.isAncestor(path, end.path)
					? end
					: Editor.end(editor, path)
				const s = Path.isAncestor(path, start.path)
					? start
					: Editor.start(editor, path)

				blockText = Editor.string(editor, { anchor: s, focus: e }, { voids })
				isNewBlock = true
			}
		}

		/*
		 * TEXT LEAF NODE - Iterate through text content, yielding
		 * positions every `distance` offset according to `unit`.
		 */
		if (Text.isText(node)) {
			const isFirst = Path.equals(path, first.path)
			const parent = Node.parent(editor, path)
			const isLastInParent = path[path.length - 1] === parent.children.length - 1



			// Proof that we always exhaust text nodes before encountering a new one:
			//   console.assert(leafTextRemaining <= 0,
			//     `leafTextRemaining=${leafTextRemaining} - `+
			//     `not exhausted before new leaf text node`, path)

			// Reset `leafText` counters for new text node.
			if (isFirst) {
				leafTextRemaining = reverse
					? first.offset
					: node.text.length - first.offset
				leafTextOffset = first.offset // Works for reverse too.
			} else {
				leafTextRemaining = node.text.length
				leafTextOffset = reverse ? leafTextRemaining : 0
			}

			// Yield position at the start of node (potentially).
			if (isFirst || isNewBlock || isNewBoundarySplittingInline || isAfterBoundarySplittingInline || unit === 'offset') {
				yield { path, offset: leafTextOffset }
				isNewBlock = false
				isNewBoundarySplittingInline = false
				isAfterBoundarySplittingInline = false
			}

			// Yield positions every (dynamically calculated) `distance` offset.
			while (true) {
				// If `leafText` has caught up with `blockText` (distance=0),
				// and if blockText is exhausted, break to get another block node,
				// otherwise advance blockText forward by the new `distance`.
				if (distance === 0) {
					if (blockText === '') break
					distance = calcDistance(blockText, unit, reverse)
					// Split the string at the previously found distance and use the
					// remaining string for the next iteration.
					blockText = splitByCharacterDistance(blockText, distance, reverse)[1]
				}

				// Advance `leafText` by the current `distance`.
				leafTextOffset = reverse
					? leafTextOffset - distance
					: leafTextOffset + distance
				leafTextRemaining = leafTextRemaining - distance

				// If `leafText` is exhausted, break to get a new leaf node
				// and set distance to the overflow amount, so we'll (maybe)
				// catch up to blockText in the next leaf text node.
				if (leafTextRemaining < 0) {
					distance = -leafTextRemaining
					break
				}

				// Successfully walked `distance` offsets through `leafText`
				// to catch up with `blockText`, so we can reset `distance`
				// and yield this position in this node.
				distance = 0
				yield { path, offset: leafTextOffset }
			}
			isAfterBoundarySplittingInline ||= (isLastInParent && !isEditor(parent) && isBoundarySplittingInline(parent))
		}
	}
	// Proof that upon completion, we've exahusted both leaf and block text:
	//   console.assert(leafTextRemaining <= 0, "leafText wasn't exhausted")
	//   console.assert(blockText === '', "blockText wasn't exhausted")

	// Helper:
	// Return the distance in offsets for a step of size `unit` on given string.
	function calcDistance(text: string, unit: string, reverse?: boolean) {
		if (unit === 'character') {
			return getCharacterDistance(text, reverse)
		} else if (unit === 'word') {
			return getWordDistance(text, reverse)
		} else if (unit === 'line' || unit === 'block') {
			return text.length
		}
		return 1
	}
}
