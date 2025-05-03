import { BaseEditor, createEditor, Descendant, Editor, EditorPositionsOptions, Element, isEditor, Node, Operation as SlateOperation, Path, PathRef, Point, Range, Text, Ancestor, NodeMatch } from "slate";
import { ReactEditor, withReact, Editable } from "slate-react";
import { Paragraph } from "./components/slate/Paragraph";
import { StyledText } from "./components/slate/StyledText";
import { HorizontalRule, isHorizontalRule } from "./components/slate/HorizontalRule";
import { isManaPip, ManaPip } from "./components/slate/ManaPip";
import { isIcon, Icon } from "./components/slate/Icon";
import { doAutoReplace } from "./autoReplace";
import { apply_and_write, history } from "./history";
import { property, text_property } from "./property";
import { operation, text_property_operation } from "./operation";
import { observe, observer, unobserve } from "./observable";
import { getCharacterDistance, getWordDistance, splitByCharacterDistance } from "./slate_utils/string";
import { text_control } from "./control";
import { card } from "./card";
import { EmbeddedProperty, isEmbeddedProperty } from "./components/slate/EmbeddedProperty";

///////////
// Types //
///////////

declare module "slate" {
	interface CustomTypes {
		Editor: TextControlEditor,
		Element: (
			| HorizontalRule
			| Paragraph

			| Icon

			| ManaPip

			| EmbeddedProperty
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
	getProperty: () => text_property,
	propagateToProperty: boolean,

	/** actually modifies this editors children (unlike #apply modifying the linked property) */
	trueApply: (operation: SlateOperation) => void,
	
	// observer?: observer<text_property_operation>,
	// observe: () => void,
	// unobserve: () => void,

	/** Replace editor contents with contents from new card */
	hydrate: (history: history, card: card, control: text_control) => void,
	/** Disconnect all observers and pathRefs */
	dispose: () => void,
	/** All properties depended on by this, and their associated refs and observers. Populated by #hydrate and cleared by #dispose */
	dependees: Map<property, [{ pathRef: PathRef, observer: observer<text_property_operation> }]>

	actionSource?: "user" | "history",
}
export type TextControlEditor = BaseCardTextControlEditor & ReactEditor;

export function createCardTextControlEditor(history: history, card: card, control: text_control): TextControlEditor {
	const editor = withReact(createEditor() as BaseCardTextControlEditor);

	editor.history = history;
	editor.propagateToProperty = true;
	editor.dependees = new Map();

	editor.card = card;
	editor.control = control;
	editor.isVoid = isVoid;
	editor.isInline = isInline;
	editor.isElementReadOnly = isAtomic;

	editor.getProperty = () => {
		return editor.card.properties.get(editor.control.property_id) as text_property;
	}

	// editor.observe = () => {
	// 	editor.unobserve();
	// 	editor.observer = (operation) => {
	// 		if (operation.type !== "modify_property_text") throw Error(`unexpected operation "${operation.type}"`);
	// 		withoutEverNormalizing(editor, () => {
	// 			editor.trueApply(operation.operation);
	// 		});
	// 	}
	// 	observe(editor.getProperty(), editor.observer);
	// }
	// editor.unobserve = () => {
	// 	if (!editor.observer) return;
	// 	unobserve(editor.getProperty(), editor.observer);
	// 	editor.observer = undefined;
	// }

	editor.dispose = () => {
		editor.withoutNormalizing(() => {
			withoutPropagating(editor, () => {
				for (const [property, entries] of editor.dependees) {
					for (const { pathRef, observer } of entries) {
						unobserve(property, observer);
						pathRef.unref();
					}
				}
				editor.dependees.clear();
				editor.children = []; // will normalize after #withoutNormalizing
			});
		});
	}

	editor.hydrate = (history: history, card: card, control: text_control) => {
		editor.dispose();
		editor.history = history;
		editor.card = card;
		editor.control = control;

		// assumed to be called when not normalizing or propagating
		function addPropertyAtPath(property: text_property, path: Path, propertyAncestors: property[] = []) {
			const pathRef = editor.pathRef(path);
			const observer: observer<text_property_operation> = (operation) => {
				if (operation.type !== "modify_property_text") throw Error(`unexpected operation "${operation.type}"`);
				withoutEverNormalizing(editor, () => {
					if (!pathRef.current) return; // todo: should we cull this if this happens? or trust it will be culled when relevant elsewhere?
					if (pathRef.current.length === 0) {
						editor.trueApply(operation.operation);
					} else {
						const modifiedOperation = { ...operation.operation };
						if ("path"    in modifiedOperation) modifiedOperation.path    = [...pathRef.current, ...modifiedOperation.path   ];
						if ("newPath" in modifiedOperation) modifiedOperation.newPath = [...pathRef.current, ...modifiedOperation.newPath];
						editor.trueApply(modifiedOperation);
					}
				});
			};

			observe(property, observer);

			if (editor.dependees.has(property)) {
				editor.dependees.get(property)!.push({ pathRef, observer });
			} else {
				editor.dependees.set(property, [{ pathRef, observer }]);
			}

			editor.removeNodes({ at: path, match: (n, p) => p.length > path.length, mode: "highest" });
			editor.insertNodes(property.value.children, { at: [...path, 0] });
			
			const newAncestors = [...propertyAncestors, property]
			for (const [subNode, subPath] of editor.nodes({ at: path, match: ((n, p) => p.length > path.length && isEmbeddedProperty(n)) as NodeMatch<EmbeddedProperty> })) {
				const subProperty = editor.card.properties.get(subNode.propertyId);
				if      (!subProperty                      ) editor.setNodes({ error: "propertyMissing"   }, { at: subPath, match: (n, p) => p.length === subPath.length });
				else if (subProperty.type !== "text"       ) editor.setNodes({ error: "propertyWrongType" }, { at: subPath, match: (n, p) => p.length === subPath.length });
				else if (newAncestors.includes(subProperty)) editor.setNodes({ error: "recursive"         }, { at: subPath, match: (n, p) => p.length === subPath.length });
				else addPropertyAtPath(subProperty, subPath, newAncestors);

			}
		}

		editor.withoutNormalizing(() => {
			withoutPropagating(editor, () => {
				addPropertyAtPath(editor.getProperty(), []);
			});
		});
	}

	editor.positions = (options) => positions(editor, options);

	const { apply, normalizeNode, onChange } = editor;
	
	editor.trueApply = (slateOperation) => {
		if (slateOperation.type === "insert_node") {
			// Okay so slate-react uses a number of optimizations to navigate the node tree, one of the ways it does this is by hashmapping each node to its parent at render-time in a global NODE_TO_PARENT.
			// This is a problem when we want to apply the same insert operation to multiple editors/embedded properties within editors, since we're adding the exact same (ie linked) node object to both trees
			// which causes them to have the same key in this hashmap and override eachother.
			// So we deep copy the object into a new one.
			slateOperation.node = structuredClone(slateOperation.node);
		}
		apply(slateOperation);
	};

	editor.apply = (slateOperation) => {
		if (slateOperation.type === "set_selection" || !editor.propagateToProperty) return editor.trueApply(slateOperation);
		if (editor.dependees.size === 0) {
			console.warn(`[${editor.getProperty().id}] Applying operation to TextPropertyControlEditor without observing. Falling back to #trueApply (may cause strange or unstable behavior)`)
			return editor.trueApply(slateOperation);
		}

		const { operations, history, card, control, selection } = editor;

		let [propertyNode, propertyRoot]: [Ancestor | undefined, Path] = editor.parent(slateOperation.path); // we have to start 1 level up because the referenced path might not exist yet, and could fail to find a node
		if (!isEmbeddedProperty(propertyNode)) { // and we have to manually check the direct parent because #above will never return the path passed to it, only ancestors.
			[propertyNode, propertyRoot] = editor.above({ at: propertyRoot, match: n => isEmbeddedProperty(n) }) ?? [undefined, []];
		}
		const property = propertyNode ? card.properties.get(propertyNode.propertyId) : editor.getProperty();
		if (!property || property.type !== "text") {
			console.warn(`[${editor.getProperty().id}] property "${propertyNode?.propertyId}" not found or not text. Falling back to #trueApply (may cause strange or unstable behavior)`);
			return editor.trueApply(slateOperation);
		}

		
		let operation: operation, secondOperation: operation | undefined;

		if (slateOperation.type === "move_node") {
			// move_node is an annoying twig in our gears, since it has a second path that could resolve to a different property than the first.
			// in ideal and all known "proper" cases it wont, but I dont want to create a future bug.
			// if it does, we split into a `remove` and an `insert`.
			let [newPropertyNode, newPropertyRoot]: [Ancestor | undefined, Path] = editor.parent(slateOperation.newPath); // we have to start 1 level up because the referenced path might not exist yet, and could fail to find a node
			if (!isEmbeddedProperty(newPropertyNode)) { // and we have to manually check the direct parent because #above will never return the path passed to it, only ancestors.
				[newPropertyNode, newPropertyRoot] = editor.above({ at: newPropertyRoot, match: n => isEmbeddedProperty(n) }) ?? [undefined, []];
			}
			if (propertyNode === newPropertyNode) {
				operation = {
					type: "modify_property_text",
					property,
					operation: { type: "move_node", path: Path.relative(slateOperation.path, propertyRoot), newPath: Path.relative(slateOperation.newPath, propertyRoot) },
				};
			} else {

				
				const newProperty = newPropertyNode ? card.properties.get(newPropertyNode.propertyId) : editor.getProperty();
				if (!newProperty || newProperty.type !== "text") {
					console.warn(`[${editor.getProperty().id}] property "${newPropertyNode?.propertyId}" not found or not text. not applying move for safety.`);
					// return editor.trueApply(slateOperation);
					return;
				}	

				const [node] = editor.node(slateOperation.path);
				operation = {
					type: "modify_property_text",
					property,
					operation: { type: "remove_node", node, path: Path.relative(slateOperation.path, propertyRoot) },
				};
				secondOperation = {
					type: "modify_property_text",
					property: newProperty,
					operation: { type: "insert_node", node, path: Path.relative(slateOperation.newPath, newPropertyRoot) },
				};
			}
		} else {
			operation = {
				type: "modify_property_text",
				property,
				operation: { ...slateOperation, path: Path.relative(slateOperation.path, propertyRoot) }
			};
		}
		apply_and_write(history, { type: "card_text_control", card, control, selection }, operation, operations.length !== 0);
		if (secondOperation) apply_and_write(history, { type: "card_text_control", card, control, selection }, secondOperation, true);
		history.allow_merging = true;
		editor.normalize(); // #trueApply ends by calling this but the observer will call it with normalizing disabled, so we normalize here.
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
	const value = editor.propagateToProperty;
	editor.propagateToProperty = false;
	try {
		fn();
	} finally {
		editor.propagateToProperty = value;
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
	switch (el.type) {
		case "HorizontalRule": return true;
		case "Icon"          : return true;

		case "EmbeddedProperty": return !!el.error;

		default: return false;
	}
}

export function isInline(el: Element) {
	switch (el.type) {
		case "ManaPip": return true;
		case "Icon"   : return true;

		default: return false;
	}
}

/**
 * returns true if the component acts like a void in the editor (ie cant be edited within) but still contains markup content
 */
export function isAtomic(el: Element) {
	switch (el.type) {
		case "ManaPip": return el.children.length === 3 && (el.children[0] as Text).text === "" && (el.children[1] as Element).type === "Icon" && (el.children[2] as Text).text === "";

		default: return false;
	};
}


export function isBoundarySplittingInline(el: Element) {
	switch (el.type) {
		case "ManaPip": return true;

		default: return false;
	}
}

/**
 * overriding the native slate positions generator with minor changes
 * (namely support for boundary-splitting inline elements, which have cursor position both before and after them)
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
