import { PropsWithoutRef, ReactElement } from "react";

export function index_in_parent(node: Node) {
	return Array.prototype.indexOf.call(node.parentNode!.childNodes, node);
}

let last_card_id = 0
export function new_card_id(): number {
	last_card_id += 1;
	return last_card_id;
}

let last_node_id = 0
export function new_node_id(): number {
	last_node_id += 1;
	return last_node_id;
}

export function collapsed_to_start(range: StaticRange) {
	return new StaticRange({
		startContainer: range.startContainer,
		startOffset: range.startOffset,
		endContainer: range.startContainer,
		endOffset: range.startOffset,
	});
}

export function collapsed_to_end(range: StaticRange) {
	return new StaticRange({
		startContainer: range.endContainer,
		startOffset: range.endOffset,
		endContainer: range.endContainer,
		endOffset: range.endOffset,
	});
}

export function select_range(selection: Selection, range: StaticRange) {
	const new_range = document.createRange();
	new_range.setStart(range.startContainer, range.startOffset);
	new_range.setEnd(range.endContainer, range.endOffset);

	selection.removeAllRanges();
	selection.addRange(new_range);
}

export function current_selection(): [StaticRange] {
	const selection = document.getSelection()!;
	return [new StaticRange(selection.getRangeAt(0))];
}

export interface SlateProps {
	attributes: { [x: keyof any]: unknown },
	children: ReactElement[],
}

export interface LeafProps extends SlateProps {
	leaf: CustomText,
}

export interface CustomText {
	text: string,
	bold: boolean,
	italic: boolean,
};
