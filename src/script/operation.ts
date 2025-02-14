import { Editor, Operation as SlateOperation, Transforms } from 'slate'
import { card } from './card';
import { property, property_value, text_property } from './property';
import { card_list } from './card_list';
import { notify_observers } from './observable';

export interface base_operation {
	type: string,
}

export interface base_property_operation<P extends property = property> {
	type: string,
	property: P,
}

export interface change_property_value_operation<P extends property = property> extends base_property_operation<P> {
	type: "change_property_value",
	old_value: property_value<P>,
	new_value: property_value<P>,
}

export type generic_property_operation = (
	| change_property_value_operation
);

export interface modify_property_text_operation extends base_property_operation<text_property> {
	type: "modify_property_text",
	operation: SlateOperation,
}

export type text_property_operation = (
	| generic_property_operation
	| modify_property_text_operation
);

export type property_operation = (
	| generic_property_operation
	| text_property_operation
);

export type inner<P extends property, O> = O extends base_property_operation<P> ? O : never;
export type property_operation_for<P extends property> = inner<P, property_operation>

export interface base_card_list_operation {
	type: string,
	card: card,
	list: card_list,
}

export interface add_card_to_list_operation extends base_card_list_operation {
	type: "add_card_to_list",
}

export interface remove_card_from_list_operation extends base_card_list_operation {
	type: "remove_card_from_list",
}

export type card_list_operation = (
	| add_card_to_list_operation
	| remove_card_from_list_operation
);

export type operation = (
	| property_operation
	| card_list_operation
);

export function get_inverse(op: operation): operation {
	switch (op.type) {
		case "modify_property_text" : return { type: op.type, property: op.property, operation: SlateOperation.inverse(op.operation) };
		case "change_property_value": return { type: op.type, property: op.property, old_value: op.new_value, new_value: op.old_value };
		case "add_card_to_list"     : return { type: "remove_card_from_list", card: op.card, list: op.list };
		case "remove_card_from_list": return { type: "add_card_to_list"     , card: op.card, list: op.list };
	}
}

export function apply_operation(op: operation) {
	switch (op.type) {
		case "modify_property_text": {
			Transforms.transform(op.property.value as Editor, op.operation);
			notify_observers(op.property, op);
		} break;

		case "change_property_value": {
			op.property.value = op.new_value;
			notify_observers(op.property, op);
		} break;

		case "add_card_to_list": {
			op.list.cards.add(op.card);
			notify_observers(op.list, op);
		} break;

		case "remove_card_from_list": {
			op.list.cards.delete(op.card);
			notify_observers(op.list, op);
		} break;
	}
}
