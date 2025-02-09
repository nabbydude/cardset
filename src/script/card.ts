import { frame_images, pt_box_images } from "./assets";
import { dumb_load_image_from_url } from "./image";
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

export function createTestCard(name: string = "Test Card", color: keyof typeof frame_images & keyof typeof pt_box_images = "red"): card {
	const id = newCardId();
	return {
		id,
		properties: {
			frame: { type: "image", id: "frame", value: frame_images[color], observers: new Set() },

			name:  { type: "text", id: "name", value: { children: [{ type: "Paragraph", children: [{ text: `${name} [${id}]`, }] }] }, observers: new Set() },
			cost:  { type: "text", id: "cost", value: { children: [{ type: "Paragraph", children: [{ text: "",                }] }] }, observers: new Set() },
			type:  { type: "text", id: "type", value: { children: [{ type: "Paragraph", children: [{ text: "Legendary Test"   }] }] }, observers: new Set() },
			pt:    { type: "text", id: "pt"  , value: { children: [{ type: "Paragraph", children: [{ text: "2/2"              }] }] }, observers: new Set() },

			cardText:   { type: "text", id: "cardText"  , value: { children: [{ type: "Paragraph", children: [{ text: "Wholetext are a lot." }] }] }, observers: new Set() },
			rulesText:  { type: "text", id: "rulesText" , value: { children: [{ type: "Paragraph", children: [{ text: "Rules are rules."     }] }] }, observers: new Set() },
			flavorText: { type: "text", id: "flavorText", value: { children: [{ type: "Paragraph", children: [{ text: "Flavor is nice."      }] }] }, observers: new Set() },

			ptBox: { type: "image", id: "ptBox", value: pt_box_images[color], observers: new Set() },
			image: { type: "image", id: "image", value: undefined, observers: new Set() },
		}
	};
}
