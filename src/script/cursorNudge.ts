import { Descendant, Editor, Element, NodeEntry, Path, Point, Text, Transforms } from "slate";
import { isManaPip } from "./components/slate/ManaPip";
import { isAtomic, isVoid } from "./slate";

// where the cursor stops when on the edge of a node
export type CursorStop = "inside" | "outside" | "both" | "either"; // "both" not yet implemented and behaves the same as "either"
export function cursorStopOnEdge(el: Element): CursorStop {
	if (isVoid(el) || isAtomic(el)) return "outside";
	if (isManaPip(el)) return "inside";
	return "either";
}

export interface NudgeOptions {
	direction?: "forward" | "backward",
}

export function cursorNudge(editor: Editor, point: Point, options: NudgeOptions = {}): Point {
	const { direction = "forward" } = options;
	const readOnlyAncestorEntry = editor.above({ at: point.path, match: node => Element.isElement(node) && editor.isElementReadOnly(node), mode: "highest" });
	const isStart = !!readOnlyAncestorEntry || editor.isStart(point, point.path);
	const isEnd = !!readOnlyAncestorEntry || editor.isEnd(point, point.path);

	let p: Point = point;
	if (isStart && (!isEnd || direction === "backward")) {
		if (readOnlyAncestorEntry) p = editor.start(readOnlyAncestorEntry[1]);
		// nudge backward
		while (editor.isStart(p, p.path)) {
			const [parent] = editor.parent(p.path);
			const indexInParent = p.path[p.path.length - 1];
			if (indexInParent === 0) {
				// first child, go up
				if (!(Element.isElement(parent) && editor.isInline(parent))) return p;
				if (cursorStopOnEdge(parent) !== "outside") return p;
			} else {
				// dive in to previous node
				const [sibling] = editor.node(Path.previous(p.path)) as NodeEntry<Descendant>;
				if (Text.isText(sibling)) return p; // previous node is butting text, return old point to move as little as possible
				if (cursorStopOnEdge(sibling) !== "inside") return p;
			}
			const newPoint = editor.before(p, { unit: "offset" });
			if (!newPoint) return p;
			p = newPoint;
		}
	} else if (isEnd) {
		if (readOnlyAncestorEntry) p = editor.end(readOnlyAncestorEntry[1]);
		// nudge forward
		while (editor.isEnd(p, p.path)) {
			const [parent] = editor.parent(p.path);
			const indexInParent = p.path[p.path.length - 1];
			if (indexInParent === parent.children.length - 1) {
				// last child, go up
				if (!(Element.isElement(parent) && editor.isInline(parent))) return p;
				if (cursorStopOnEdge(parent) !== "outside") return p;
			} else {
				// dive in to next node
				const [sibling] = editor.node(Path.next(p.path)) as NodeEntry<Descendant>;
				if (Text.isText(sibling)) return p; // previous node is butting text, return old point to move as little as possible
				if (cursorStopOnEdge(sibling) !== "inside") return p;
			}
			const newPoint = editor.after(p, { unit: "offset" });
			if (!newPoint) return p;
			p = newPoint;
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
