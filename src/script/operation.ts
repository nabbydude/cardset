import { Descendant, Editor, Operation, Operation as SlateOperation, Transforms } from 'slate'
import { card } from './card';
import { enum_property, image_property, image_src, text_property } from './property';
import { project } from './project';


export interface base_operation {
	type: string,
}

export interface property_operation {
	type: string,
	card_id: string,
	property_id: string,
}

export interface text_property_operation extends property_operation {
	type: "text_property",
	operation: SlateOperation
}

export interface image_property_operation extends property_operation {
	type: "image_property",
	old_image?: image_src,
	new_image?: image_src,
}

export interface enum_property_operation extends property_operation {
	type: "enum_property",
	old_value: string,
	new_value: string,
}

export interface add_card_operation extends base_operation {
	type: "add_card",
	card: card,
}

export interface remove_card_operation extends base_operation {
	type: "remove_card",
	card: card,
}

export type operation = (
	| text_property_operation
	| image_property_operation
	| enum_property_operation
	| add_card_operation
	| remove_card_operation
);

export function get_inverse(op: operation): operation {
	switch (op.type) {
		case "text_property" : return { type: op.type, card_id: op.card_id, property_id: op.property_id, operation: SlateOperation.inverse(op.operation) };
		case "image_property": return { type: op.type, card_id: op.card_id, property_id: op.property_id, old_image: op.new_image, new_image: op.old_image };
		case "enum_property" : return { type: op.type, card_id: op.card_id, property_id: op.property_id, old_value: op.new_value, new_value: op.old_value };
		case "add_card"      : return { type: "remove_card", card: op.card };
		case "remove_card"   : return { type: "add_card"   , card: op.card };
	}
}

export function apply(project: project, op: operation) {
	switch (op.type) {
		case "text_property" : dumb_apply_to_nodes((project.cards[op.card_id].properties[op.property_id] as text_property).nodes, op.operation); break; //TODO: use actual apply for the active control
		case "image_property": (project.cards[op.card_id].properties[op.property_id] as image_property).src = op.new_image; break;
		case "enum_property" : (project.cards[op.card_id].properties[op.property_id] as enum_property).value = op.new_value; break;
		case "add_card"      : project.cards[op.card.id] = op.card; break;
		case "remove_card"   : delete project.cards[op.card.id]; break;
	}
}

export function dumb_apply_to_nodes(nodes: Descendant[], op: Operation) {
	const dummy_editor = { children: nodes } as Editor;
	Transforms.transform(dummy_editor, op);
	if (dummy_editor.children !== nodes) nodes.splice(0, nodes.length, ...dummy_editor.children);
}
