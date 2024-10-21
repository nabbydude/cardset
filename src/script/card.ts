import { frameUrls, ptBoxUrls } from "./assets";
import { property } from "./property";

export interface card {
	id: string,
	properties: Record<string, property>,
}

let lastCardId = 0;
export function setCardId(value: number = 0) {
	lastCardId = value;
}

export function newCardId(): string {
	lastCardId += 1;
	return `card_${lastCardId}`;
}

export function createTestCard(name: string = "Test Card", color: keyof typeof frameUrls & keyof typeof ptBoxUrls = "red"): card {
	return {
		id: newCardId(),
		properties: {
			frame: { type: "image", id: "frame", src: frameUrls[color] },

			name:  { type: "text", id: "name" , nodes: [{ type: "Paragraph", children: [{ text: name,            }] }] },
			cost:  { type: "text", id: "cost" , nodes: [{ type: "Paragraph", children: [{ text: "",              }] }] },
			type:  { type: "text", id: "type" , nodes: [{ type: "Paragraph", children: [{ text: "Legendary Test" }] }] },
			pt:    { type: "text", id: "pt"   , nodes: [{ type: "Paragraph", children: [{ text: "2/2"            }] }] },

			cardText:   { type: "text", id: "cardText"  , nodes: [{ type: "Paragraph", children: [{ text: "Wholetext are a lot." }] }] },
			rulesText:  { type: "text", id: "rulesText" , nodes: [{ type: "Paragraph", children: [{ text: "Rules are rules."     }] }] },
			flavorText: { type: "text", id: "flavorText", nodes: [{ type: "Paragraph", children: [{ text: "Flavor is nice."      }] }] },

			ptBox: { type: "image", id: "ptBox", src: undefined },
			image: { type: "image", id: "image", src: undefined },
		}
	};
}
