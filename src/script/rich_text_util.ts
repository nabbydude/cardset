import { modify_rich_text_operation, move_node_and_mark_change, replace_text_and_mark_change } from "./modify_rich_text_operation";
import { index_in_parent } from "./util";

function can_merge(a: Node, b: Node): boolean {
	return should_always_merge(a, b) || (is_block_node(a) && is_block_node(b));
}

const always_merge_tags = ["#text", "B", "I"];
function should_always_merge(a: Node, b: Node): boolean {
	return a.nodeName === b.nodeName && always_merge_tags.includes(a.nodeName);
}

const block_node_tags = ["P", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "OL", "UL", "LI"];
export function is_block_node(node: Node): boolean {
	return block_node_tags.includes(node.nodeName);
}

/**
 * Append the contents of the second node as content of the first, then remove the second node.
 * @returns Where the content of the second parameter now reside.
 */
export function merge(first: Node, second: Node, operation: modify_rich_text_operation): StaticRange {
	let startOffset: number, endOffset: number;
	if (first.nodeType === Node.TEXT_NODE && second.nodeType === Node.TEXT_NODE) {
		const old_text = first.textContent!;
		const new_text = old_text + second.textContent!;

		replace_text_and_mark_change(first, new_text, operation);

		startOffset = old_text.length;
		endOffset = new_text.length;
	} else if (first.nodeType === Node.ELEMENT_NODE && second.nodeType === Node.ELEMENT_NODE) {
		startOffset = first.childNodes.length;
		for (const child of second.childNodes) {
			move_node_and_mark_change(child, first, null, operation);
		}
		endOffset = first.childNodes.length;
	} else {
		throw Error("Unrecognized or non-matching nodes in merge");
	}

	move_node_and_mark_change(second, null, null, operation);
	return new StaticRange({
		startContainer: first,
		startOffset,
		endContainer: first,
		endOffset,
	});
}

/**
 * Append the contents of the second node as content of the first, then remove the second node, also recursively merge any newly adjacent nodes that should always merge.
 * @returns Where the content of the second parameter now reside.
 */
export function cascade_merge(first: Node, second: Node, operation: modify_rich_text_operation): StaticRange {
	if (first.lastChild && second.firstChild) {
		const { startContainer, startOffset } = cascade_merge_or_move_after_2(first.lastChild, second.firstChild, operation);
		const { endContainer, endOffset } = merge(first, second, operation);
		return new StaticRange({ startContainer, startOffset, endContainer, endOffset });
	} else {
		return merge(first, second, operation);
	}
}

export function cascade_merge_or_move_after_2(first: Node, second: Node, operation: modify_rich_text_operation): StaticRange {
	if (should_always_merge(first, second)) {
		return cascade_merge(first, second, operation);
	} else {
		const parent = first.parentNode!;
		move_node_and_mark_change(second, parent, first.nextSibling, operation)
		const index = index_in_parent(second);
		return new StaticRange({
			startContainer: parent,
			startOffset: index,
			endContainer: parent,
			endOffset: index + 1,
		});
	}
}

export function cascade_merge_or_move_after(node: Node, parent: Node, sibling: Node | null, operation: modify_rich_text_operation): StaticRange {
	if (sibling && should_always_merge(sibling, node)) {
		return cascade_merge(sibling, node, operation);
	} else {
		move_node_and_mark_change(node, parent, sibling ? sibling.nextSibling : parent.firstChild, operation)
		const index = index_in_parent(node);
		return new StaticRange({
			startContainer: parent,
			startOffset: index,
			endContainer: parent,
			endOffset: index + 1,
		});
	}
}

export function move_child_range(node: Node, start: number, end: number, parent: Node, sibling: Node | null, operation: modify_rich_text_operation) {
	while (end > start) {
		move_node_and_mark_change(node.childNodes[start], parent, sibling, operation);
		end -= 1;
	}
}

export function remove_child_range(node: Node, start: number, end: number, operation: modify_rich_text_operation) {
	while (end > start) {
		move_node_and_mark_change(node.childNodes[start], null, null, operation);
		end -= 1;
	}
}

export function remove_child_range_and_cascade_merge(node: Node, start: number, end: number, operation: modify_rich_text_operation) {
	remove_child_range(node, start, end, operation);
	const before = node.childNodes[start - 1];
	const after = node.childNodes[start];
	if (before && after && should_always_merge(before, after)) {
		const range = cascade_merge(before, after, operation);
		return new StaticRange({
			startContainer: range.startContainer,
			startOffset: range.startOffset,
			endContainer: range.startContainer,
			endOffset: range.startOffset,
		});
	} else {
		return new StaticRange({
			startContainer: node,
			startOffset: start,
			endContainer: node,
			endOffset: start,
		});
	}
}

export function remove_range(range: StaticRange, operation: modify_rich_text_operation): StaticRange {
	if (range.collapsed) return range;

	/*
		[(a|b)c][d][e{f|g}] -> [(a|){|g}]
		[a|bc][d][ef|g] -> [a|g] (this changes end parent)
		[(a)|bc][d][ef|(g)] -> [(a|g)] (this changes start and end parent)
	*/

	let start_parent = range.startContainer;
	let start_offset = range.startOffset;
	let end_parent = range.endContainer;
	let end_offset = range.endOffset;


	// expand out to encapsulate nodes that would be empty (unless that would involve deleting a block node, which are okay to be empty)
	while (start_offset <= 0 && !is_block_node(start_parent) && !start_parent.contains(end_parent)) {
		start_offset = index_in_parent(start_parent);
		start_parent = start_parent.parentNode!;
	}
	while (end_offset >= maximum_offset(end_parent) && !end_parent.contains(start_parent)) {
		end_offset = index_in_parent(end_parent) + 1;
		end_parent = end_parent.parentNode!;
	}

	if (start_parent === end_parent) {
		// we'll just use start_parent in this block

		// similar to above, if we're deleting all contents of a non-block node, just expand the range out to delete the whole thing
		while (start_offset <= 0 && end_offset >= maximum_offset(start_parent) && !is_block_node(start_parent)) {
			start_offset = index_in_parent(start_parent);
			end_offset = start_offset + 1;
			start_parent = start_parent.parentNode!;
		}
		if (start_parent.nodeType === Node.TEXT_NODE) {
			const old_text = start_parent.textContent!;
			const new_text = old_text.substring(0, start_offset) + old_text.substring(end_offset);
			replace_text_and_mark_change(start_parent, new_text, operation);
			return new StaticRange({
				startContainer: start_parent,
				startOffset: start_offset,
				endContainer: start_parent,
				endOffset: start_offset,
			});
		} else if (start_offset <= 0 && end_offset >= maximum_offset(start_parent) && is_block_node(start_parent)) {
			// we're removing all contents of a block node. When block nodes are empty, they contain a single <br>
			remove_child_range(start_parent, start_offset, end_offset, operation);
			move_node_and_mark_change(document.createElement("br"), start_parent, null, operation);
			return new StaticRange({
				startContainer: start_parent,
				startOffset: 0,
				endContainer: start_parent,
				endOffset: 0,
			});
		} else {
			return remove_child_range_and_cascade_merge(start_parent, start_offset, end_offset, operation);
		}
	}

	let parent = start_parent;
	let offset = start_offset;

	// normalize to closest element
	if (parent.nodeType === Node.TEXT_NODE) {
		// we save actually modifying this node for last
		offset = index_in_parent(parent) + 1;
		parent = parent.parentNode!;
	}

	// remove tail ends of the head tree until we find the common ancestor
	while (!parent.contains(end_parent)) {
		remove_child_range(parent, offset, parent.childNodes.length, operation);
		offset = index_in_parent(parent) + 1;
		parent = parent.parentNode!;
	}

	const common_ancestor = parent;

	// end_node is the node we stop inside of (if its a text node) or just before (or null if and only if its at the very end of common_ancestor)
	let end_node: Node | null = end_parent.nodeType === Node.TEXT_NODE ? end_parent : end_parent.childNodes[end_offset] ?? null;

	// remove body nodes
	let child: Node | null = parent.childNodes[offset] ?? null;
	while (child && !child.contains(end_node)) {
		move_node_and_mark_change(child, null, null, operation);
		child = parent.childNodes[offset];
	}

	if (!end_node) {
		if (start_parent.nodeType === Node.TEXT_NODE) {
			replace_text_and_mark_change(start_parent, start_parent.textContent!.substring(0, start_offset), operation);
		}
		return new StaticRange({
			startContainer: start_parent,
			startOffset: start_offset,
			endContainer: parent,
			endOffset: offset,
		});
	}

	// start diving into the tail
	// see how deep we can merge, if at all
	let merge_candidate: Node | null = parent.childNodes[offset - 1] ?? null;
	let merge_into_node = common_ancestor;
	let merge_text = false;
	while (merge_candidate && child && can_merge(merge_candidate, child)) {
		if (merge_candidate.nodeType === Node.TEXT_NODE) {
			offset += 1;
			merge_text = true;
			break;
		}
		
		if (start_parent === merge_into_node) {
			start_parent = merge_candidate;
			start_offset = merge_candidate.childNodes.length;
		}
		merge_into_node = merge_candidate;
		
		parent = child;
		offset = 0;
		
		child = parent.firstChild;
		if (!child) break;
		if (parent === end_node) end_node = child; // if we're merging into end_node, its first child is the new end node

		// skip past any nodes before end_node, we only care about ancestors (and descendants) of end_node
		while (!child.contains(end_node)) {
			offset += 1;
			child = child.nextSibling!;
		}

		merge_candidate = merge_into_node.lastChild;
	}

	// continue diving and deleting, now that merging is out of the question
	while (child && child !== end_node) {
		let dive_parent: Node = child;

		child = dive_parent.firstChild;
		while (child && !child.contains(end_node)) {
			move_node_and_mark_change(child, null, null, operation);
			child = dive_parent.firstChild;
		}
		if (end_parent === dive_parent) end_offset = 0;
	}

	if (merge_into_node !== common_ancestor) {
		// walk up and move everything we wanna keep
		while (parent !== common_ancestor) {
			move_child_range(parent, offset, parent.childNodes.length, merge_into_node, null, operation);
			offset = index_in_parent(parent) + 1;
			parent = parent.parentNode!;
			merge_into_node = merge_into_node.parentNode!;
		}
		// disconnect final parent from tree
		move_node_and_mark_change(common_ancestor.childNodes[offset - 1], null, null, operation);
	}

	if (is_block_node(start_parent) && start_parent.firstChild === null) {
		move_node_and_mark_change(document.createElement("br"), start_parent, null, operation);
	}

	if (merge_text) {
		const start_text = merge_candidate === start_parent ? start_parent.textContent!.substring(0, start_offset) : merge_candidate!.textContent!;
		const end_text = end_node === end_parent ? end_node.textContent!.substring(end_offset) : end_node!.textContent!;
		replace_text_and_mark_change(merge_candidate!, start_text + end_text, operation);
		return new StaticRange({
			startContainer: merge_candidate!,
			startOffset: start_offset,
			endContainer: merge_candidate!,
			endOffset: start_offset,
		});
	}

	if (end_parent.nodeType === Node.TEXT_NODE) {
		replace_text_and_mark_change(end_parent, end_parent.textContent!.substring(end_offset), operation);
		end_offset = 0;
	}
	if (start_parent.nodeType === Node.TEXT_NODE) {
		replace_text_and_mark_change(start_parent, start_parent.textContent!.substring(0, start_offset), operation);
	}
	
	return new StaticRange({
		startContainer: start_parent,
		startOffset: start_offset,
		endContainer: end_parent,
		endOffset: end_offset,
	});
}

export function unwrap_node(node: Node, operation: modify_rich_text_operation): StaticRange {
	const parent = node.parentNode!;
	const sibling = node.nextSibling;
	const start = index_in_parent(node);
	const end = start + node.childNodes.length;
	move_node_and_mark_change(node, null, null, operation);

	// todo: merge with siblings
	for (const child of node.childNodes) {
		move_node_and_mark_change(child, parent, sibling, operation);
	}
	return new StaticRange({
		startContainer: parent,
		startOffset: start,
		endContainer: parent,
		endOffset: end,
	});
}

// when wrapping content with a mergeable node already in it, remove the node
// ie. when bolding content that includes bold text, remove the inner bold tag
export function unwrap_mergeable_in_child_range(node: Node, start: number, end: number, tester: Node, operation: modify_rich_text_operation) {
	let child: Node | null = node.childNodes[start] ?? null;
	const stop_before: Node | null = node.childNodes[end] ?? node.nextSibling;
	if (!child) return;
	while (child !== null && child !== stop_before) {
		if (should_always_merge(tester, child)) {
			const to_unwrap = child;
			child = child.nextSibling ?? child.parentNode!.nextSibling;
			unwrap_node(to_unwrap, operation);
		} else if (child.firstChild) {
			child = child.firstChild;
		} else {
			while (!child.nextSibling) {
				child = child.parentNode;
				if (child === null) return;
			}
			child = child.nextSibling;
		}
	}
}

export function wrap_child_range(parent: Node, start: number, end: number, wrapper: Node, operation: modify_rich_text_operation): StaticRange {
	let output_start_node = wrapper;
	let output_start_offset = wrapper.childNodes.length;

	const prev = parent.childNodes[start - 1];
	if (end > start && prev && should_always_merge(prev, wrapper)) {
		wrapper = prev;
		const node = parent.childNodes[start];
		unwrap_mergeable_in_child_range(node, 0, node.childNodes.length, wrapper, operation);
		const range = cascade_merge_or_move_after(node, wrapper, wrapper.lastChild, operation);
		output_start_node = range.startContainer;
		output_start_offset = range.startOffset;
		end -= 1;
	}
	while (end > start) {
		const node = parent.childNodes[start];
		unwrap_mergeable_in_child_range(node, 0, node.childNodes.length, wrapper, operation);
		cascade_merge_or_move_after(node, wrapper, wrapper.lastChild, operation);
		end -= 1;
	}

	let output_end_node = wrapper;
	let output_end_offset = wrapper.childNodes.length;

	let next = parent.childNodes[start] ?? null;
	if (next && should_always_merge(wrapper, next)) {
		const range = cascade_merge(wrapper, next, operation);
		output_end_node = range.startContainer;
		output_end_offset = range.startOffset;
		next = parent.childNodes[start] ?? null;
	}
	if (wrapper !== prev) {
		move_node_and_mark_change(wrapper, parent, next, operation);
	}
	return new StaticRange({
		startContainer: output_start_node,
		startOffset: output_start_offset,
		endContainer: output_end_node,
		endOffset: output_end_offset,
	});
}

export function wrap_range(range: StaticRange, wrapper_factory: () => Node, should_wrap: (parent: Node) => boolean, operation: modify_rich_text_operation): StaticRange {
	let node = range.startContainer;
	let offset = range.startOffset;
	let end_node = range.endContainer;
	let end_offset = range.endOffset;

	let output_start_node: Node | undefined;
	let output_start_offset: number;
	let output_end_node: Node | undefined;
	let output_end_offset: number;

	// see if start is already in a mergeable node and skip to the end of that if so
	const dummy_wrapper = wrapper_factory();
	let parent = node instanceof HTMLElement ? node : node.parentElement;
	let result: HTMLElement | undefined;
	while (parent && parent.isContentEditable) {
		if (should_always_merge(parent, dummy_wrapper)) {
			result = parent;
			break;
		}
		parent = parent.parentElement;
	}

	if (result) {
		if (result.contains(end_node)) return range; // already fully wrapped
		offset = index_in_parent(result) + 1;
		node = result.parentNode!;
	}

	if (
		node === end_node &&
		node.nodeType === Node.TEXT_NODE &&
		offset > 0 &&
		end_offset < node.textContent!.length
	) {
		// wrap contained in single text node
		const parent = node.parentNode!;
		const sibling = node.nextSibling;
		const old_text = node.textContent!;
		const new_text = old_text.substring(0, offset);
		const wrapper = wrapper_factory();
		if (end_offset > offset) {
			const inner_text = document.createTextNode(old_text.substring(offset, end_offset));
			wrapper.appendChild(inner_text);
		}
		const tail = document.createTextNode(old_text.substring(end_offset));

		replace_text_and_mark_change(node, new_text, operation);
		move_node_and_mark_change(wrapper, parent, sibling, operation);
		move_node_and_mark_change(tail, parent, sibling, operation);

		output_start_node = wrapper;
		output_start_offset = 0;
		output_end_node = wrapper;
		output_end_offset = wrapper.childNodes.length;
	} else {
		/*
			[(a|b)c][d][e(f|g)]
			should become
			[(a|{b}){c}]{[d]}[{e}({f}|g)]
			    ^^^^^^^/^^^^^/^^^^^^^
			      head  torso  tail
		*/

		// first we walk up the head until the common ancestor, then repeat for the tail, then we join the two.

		// walk up the head
		if (node.nodeType === Node.TEXT_NODE) {
			const old_text = node.textContent!;
			if (offset <= 0) {
				offset = index_in_parent(node);
				node = node.parentNode!;
			} else if (offset >= old_text.length) {
				offset = index_in_parent(node) + 1;
				node = node.parentNode!;
			} else {
				const new_text = old_text.substring(0, offset);
				const new_child = document.createTextNode(old_text.substring(offset));
				replace_text_and_mark_change(node, new_text, operation);
				move_node_and_mark_change(new_child, node.parentNode, node.nextSibling, operation); // this gets placed as a sibling only to be immediately moved into wrapper, could maybe optimize

				offset = index_in_parent(node) + 1;
				node = node.parentNode!;
			}
		}

		let latest_head_node: Node | undefined;
		let latest_head_offset: number;
		while (!node.contains(end_node)) {
			if (node.nodeType !== Node.ELEMENT_NODE) throw Error("Unrecognized node");
			if (offset <= 0 && should_wrap(node)) {
				// if we would wrap all children, just wrap the whole node instead
				offset = index_in_parent(node);
				node = node.parentNode!;
				continue;
			} else if (offset >= node.childNodes.length) {
				// if we would wrap no children, just skip the whole node
				offset = index_in_parent(node) + 1;
				node = node.parentNode!;
				continue;
			}

			const wrapper = wrapper_factory();
			const wrapped_range = wrap_child_range(node, offset, node.childNodes.length, wrapper, operation);
			// unwrap_mergeable_children(wrapper, wrapper, operation);
			if (!output_start_node) {
				output_start_node = wrapped_range.startContainer;
				output_start_offset = wrapped_range.startOffset;
			}
			latest_head_node = wrapped_range.startContainer;
			latest_head_offset = wrapped_range.startOffset;

			offset = index_in_parent(node) + 1;
			node = node.parentNode!;
		}

		const common_ancestor = node;
		const ancestor_start_offset = offset;

		// walk up the tail
		if (end_node.nodeType === Node.TEXT_NODE) {
			const old_text = end_node.textContent!;
			if (end_offset <= 0) {
				end_offset = index_in_parent(end_node);
			} else if (end_offset >= old_text.length) {
				end_offset = index_in_parent(end_node) + 1;
			} else {
				const new_child = document.createTextNode(old_text.substring(end_offset));
				const new_text = old_text.substring(0, end_offset);
				replace_text_and_mark_change(end_node, new_text, operation);
				move_node_and_mark_change(new_child, end_node.parentNode, end_node.nextSibling, operation);
				end_offset = index_in_parent(end_node) + 1;
			}
			end_node = end_node.parentNode!;
		}

		node = end_node;
		offset = end_offset;

		let earliest_tail_node: Node | undefined;
		let earliest_tail_offset: number;
		while (node !== common_ancestor) {
			if (node.nodeType !== Node.ELEMENT_NODE) throw Error("Unrecognized node");
			if (offset <= 0) {
				// if we would wrap no children, just stop before the whole node
				offset = index_in_parent(node);
				node = node.parentNode!;
				continue;
			} else if (offset >= node.childNodes.length && should_wrap(node)) {
				// if we would wrap all children, just wrap the whole node instead
				offset = index_in_parent(node) + 1;
				node = node.parentNode!;
				continue;
			}

			const wrapped_range = wrap_child_range(node, 0, offset, wrapper_factory(), operation);
			if (!output_end_node) {
				output_end_node = wrapped_range.endContainer;
				output_end_offset = wrapped_range.endOffset;
			}
			earliest_tail_node = wrapped_range.endContainer;
			earliest_tail_offset = wrapped_range.endOffset;

			offset = index_in_parent(node);
			node = node.parentNode!;
		}

		// wrap torso if it has any elements, or if we haven't made any elements so far, create an empty wrapper at the torso
		if (ancestor_start_offset !== offset || (!output_start_node && !output_end_node)) {
			const wrapped_range = wrap_child_range(node, ancestor_start_offset, offset, wrapper_factory(), operation);
			if (!output_start_node) {
				output_start_node = wrapped_range.startContainer;
				output_start_offset = wrapped_range.startOffset;
			}
			if (!output_end_node) {
				output_end_node = wrapped_range.endContainer;
				output_end_offset = wrapped_range.endOffset;
			}
		}

		if (!output_start_node) {
			output_start_node = earliest_tail_node;
			output_start_offset = earliest_tail_offset!;
		}
		if (!output_end_node) {
			output_end_node = latest_head_node;
			output_end_offset = latest_head_offset!;
		}
	}

	// the if and nullish assignments above ensure everything is definitely set by now, ts just doesnt realize that latest_head/earliest_tail are linked to their respective containers
	return new StaticRange({
		startContainer: output_start_node!,
		startOffset: output_start_offset!,
		endContainer: output_end_node!,
		endOffset: output_end_offset!,
	});
}

export function replace_range_with_text(range: StaticRange, text: string, operation: modify_rich_text_operation): StaticRange {
	let node = range.startContainer;
	let offset = range.startOffset;
	let end_node = range.endContainer;
	let end_offset = range.endOffset;

	if (node.nodeType === Node.ELEMENT_NODE) {
		const child_before: ChildNode | undefined = node.childNodes[offset - 1];
		const child_after: ChildNode | undefined = node.childNodes[offset];
		if (child_before?.nodeType === Node.TEXT_NODE) {
			node = child_before;
			offset = child_before.textContent!.length;
		} else if (child_after?.nodeType === Node.TEXT_NODE) {
			node = child_after;
			offset = 0;
		} else {
			const new_child = document.createTextNode(text);
			move_node_and_mark_change(new_child, node, child_after ?? null, operation);
			if (node === end_node) end_offset += 1;
			node = new_child;
			offset = 0;
		}
		remove_range(new StaticRange({
			startContainer: node,
			startOffset: offset + text.length,
			endContainer: end_node,
			endOffset: end_offset,
		}), operation);
	} else if (node === end_node) {
		const old_text = node.textContent!;
		const new_text = old_text.substring(0, offset) + text + old_text.substring(range.endOffset);
		replace_text_and_mark_change(node, new_text, operation)
	} else {
		const old_text = node.textContent!;
		const new_text = old_text.substring(0, offset) + text;
		replace_text_and_mark_change(node, new_text, operation)

		remove_range(new StaticRange({
			startContainer: node,
			startOffset: offset + text.length,
			endContainer: end_node,
			endOffset: end_offset,
		}), operation);
	}

	return new StaticRange({
		startContainer: node,
		startOffset: offset,
		endContainer: node,
		endOffset: offset + text.length,
	});
}

export function replace_range_with_node(range: StaticRange, node: Node, operation: modify_rich_text_operation): StaticRange {
	let { startContainer, startOffset, endContainer, endOffset } = range;
	let output_offset;
	if (startContainer.nodeType === Node.ELEMENT_NODE) {
		const sibling = startContainer.childNodes[startOffset] ?? null;
		move_node_and_mark_change(node, startContainer, sibling, operation);
		output_offset = startOffset;
		startOffset += 1;
		if (startContainer === endContainer) endOffset += 1;

		remove_range(new StaticRange({
			startContainer,
			startOffset,
			endContainer,
			endOffset,
		}), operation);
	} else {
		const old_text = startContainer.textContent!;
		const parent = startContainer.parentNode!;
		const sibling = startContainer.nextSibling;
		if (startOffset > 0) {
			const new_text = old_text.substring(0, startOffset);
			replace_text_and_mark_change(startContainer, new_text, operation)
			if (parent === endContainer) endOffset += 1; // since we aren't getting rid of this, after we add the input node, there will be an extra node in this container
		} else {
			move_node_and_mark_change(startContainer, null, null, operation);
		}
		move_node_and_mark_change(node, parent, sibling, operation);

		output_offset = index_in_parent(node);

		if (startContainer !== endContainer) {
			remove_range(new StaticRange({
				startContainer: parent,
				startOffset: output_offset + 1,
				endContainer,
				endOffset,
			}), operation);
		} else if (endOffset < old_text.length) {
			const new_child = document.createTextNode(old_text.substring(endOffset));
			move_node_and_mark_change(new_child, parent, sibling, operation);
		}
	}

	return new StaticRange({
		startContainer: node.parentNode!,
		startOffset: output_offset,
		endContainer: node.parentNode!,
		endOffset: output_offset + 1,
	});
}

export function all_text_is_within_selector(range: StaticRange, selector: string): boolean {
	let container: Node | null = range.startContainer;
	let endContainer = range.endContainer;
	container = (container instanceof Element ? container : container.parentElement)!.closest(selector);
	while (container) {
		if (container.nodeType === Node.TEXT_NODE) return false;
		if (container.contains(endContainer)) return true;
		if (container instanceof Element && !(container.matches(selector))) {
			container = container.firstChild;
		} else {
			container = container.nextSibling ?? container.parentNode?.nextSibling ?? null;
		}
	}
	return false;
}

export function maximum_offset(node: Node): number {
	return node.nodeType === Node.TEXT_NODE ? node.textContent!.length : node.childNodes.length;
}
