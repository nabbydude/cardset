import { Descendant } from "slate";

export interface rich_text_value {
	children: Descendant[];
}

export function create_rich_text_value_from_plain_text(text: string): rich_text_value {
	return {
		children: [
			{
				type: "Paragraph",
				children: [{ text, bold: false, italic: false }],
			},
		],
	};
}
