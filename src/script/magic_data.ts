import { card, card_field_id } from "./card";
import { field } from "./field";

export const card_fields: field[] = [
	{
		id: "name",
		display_name: "Name",
	},
	{
		id: "cost",
		display_name: "Cost",
	},
	{
		id: "type",
		display_name: "Type",
	},
	{
		id: "rules_text",
		display_name: "Rules Text",
	},
	{
		id: "flavor_text",
		display_name: "Flavor Text",
	},
];

export const card_list_columns: card_field_id[] = [
	"name",
	"cost",
	"type",
];
