import { is_block_node } from "./rich_text_util";

export interface rich_text {
	nodes: Node[];
}

export function nodes_to_plain_text(nodes: Node[]) {
	return nodes.map(v => node_to_plain_text(v)).join(""); 
}

export function node_to_plain_text(node: Node): string {
	switch (node.nodeName) {
		case "#comment": return "";
		case "#text": return node.textContent!;
		case "BR": return "\n";
		default: return Array.prototype.map.call(node.childNodes, v => node_to_plain_text(v)).join("") + (is_block_node(node) ? "\n\n" : "");
	}
}

export function create_rich_text_from_markup(markup: string): rich_text {
	const temp = document.createElement("div");
	temp.innerHTML = markup;
	return {
		nodes: [...temp.childNodes],
	};
}
