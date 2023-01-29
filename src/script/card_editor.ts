import { card } from "./card";
import { frame_urls } from "./card_frame";
import { default_input_event_map, do_input_event, mana_input_event_map } from "./input_events";

export interface card_editor {
	card: card,
	element: HTMLDivElement,
}

let frame_select_menu: HTMLElement;

export function hydrate_card_editor(card_editor: card_editor) {
	const element = card_editor.element;
	const frame_img = element.querySelector("img.frame") as HTMLImageElement;
	const name_div = element.querySelector("div.name") as HTMLDivElement;
	const cost_div = element.querySelector("div.cost") as HTMLDivElement;
	const type_div = element.querySelector("div.type") as HTMLDivElement;
	const rules_text_div = element.querySelector("div.rules_text") as HTMLDivElement;
	const flavor_text_div = element.querySelector("div.flavor_text") as HTMLDivElement;
	const visual_box_divs = element.querySelectorAll("div.visual_box") as NodeListOf<HTMLDivElement>;
	const pt_div = element.querySelector("div.pt") as HTMLDivElement;
	
	frame_img.addEventListener("click", e => on_frame_img_click(e, card_editor));

	name_div.addEventListener("beforeinput", e => before_textbox_input(e, card_editor));
	
	cost_div.addEventListener("mousedown", e => on_cost_mousedown(e, card_editor));
	cost_div.addEventListener("beforeinput", e => before_cost_input(e, card_editor));
	
	type_div.addEventListener("beforeinput", e => before_textbox_input(e, card_editor));
	
	for (const div of visual_box_divs) {
		div.addEventListener("mousedown", e => on_visual_box_mousedown(e, card_editor));
	}


	rules_text_div.addEventListener("beforeinput", e => before_textbox_input(e, card_editor));
	flavor_text_div.addEventListener("beforeinput", e => before_textbox_input(e, card_editor));
	rules_text_div.addEventListener("input", e => on_text_box_input(e as InputEvent, card_editor)); // hack: ts doesnt realize this listener sends an InputEvent
	flavor_text_div.addEventListener("input", e => on_text_box_input(e as InputEvent, card_editor)); // hack: ts doesnt realize this listener sends an InputEvent

	pt_div.addEventListener("input", e => on_pt_input(e as InputEvent, card_editor)); // hack: ts doesnt realize this listener sends an InputEvent
	
	if (!frame_select_menu) {
		const template = document.querySelector("template.frame_select_menu") as HTMLTemplateElement;
		frame_select_menu = template.content.firstChild!.cloneNode(true) as HTMLElement;
		hydrate_frame_select_menu(card_editor);
	}
}

export function hydrate_frame_select_menu(card_editor: card_editor) {
	frame_select_menu.addEventListener("click", e => on_frame_select_menu_click(e, card_editor));
	// document.addEventListener("click", on_document_interact);
	document.addEventListener("mousedown", on_document_interact);
	document.addEventListener("focus", on_document_interact);
}

function before_textbox_input(e: InputEvent, card_editor: card_editor) {
	do_input_event(e, default_input_event_map);
	update_text_box_grid(card_editor);
	document.dispatchEvent(new CustomEvent("card_field_update", {
		detail: {
			card: card_editor.card,
			field: (e.currentTarget as HTMLElement).dataset.field
		},
	}));
}

function on_text_box_input(e: InputEvent, card_editor: card_editor) {
	update_text_box_grid(card_editor);
}

function on_pt_input(e: InputEvent, card_editor: card_editor) {
	update_pt_box(card_editor);
}

export function change_card(card_editor: card_editor, card: card) {
	card_editor.card = card;
	card_editor.element.dataset.card = String(card.id);

	const name_div = card_editor.element.querySelector("div.name") as HTMLDivElement;
	const cost_div = card_editor.element.querySelector("div.cost") as HTMLDivElement;
	const type_div = card_editor.element.querySelector("div.type") as HTMLDivElement;
	const rules_div = card_editor.element.querySelector("div.rules_text") as HTMLDivElement;
	const flavor_div = card_editor.element.querySelector("div.flavor_text") as HTMLDivElement;
	const pt_div = card_editor.element.querySelector("div.pt") as HTMLDivElement;

	name_div.replaceChildren(...card.name.nodes);
	cost_div.replaceChildren(...card.cost.nodes);
	type_div.replaceChildren(...card.type.nodes);
	rules_div.replaceChildren(...card.rules_text.nodes);
	flavor_div.replaceChildren(...card.flavor_text.nodes);
	pt_div.replaceChildren(...card.pt.nodes);

	update_frame(card_editor);
	update_text_box_grid(card_editor);
	update_pt_box(card_editor);
}

function update_frame(card_editor: card_editor) {
	const img = card_editor.element.querySelector("img.frame") as HTMLImageElement;
	img.src = card_editor.card.frame.image;
}

function update_text_box_grid(card_editor: card_editor) {
	const text_div = card_editor.element.querySelector(".card_editor div.text_box") as HTMLDivElement;
	const rules_div = text_div.querySelector("div.rules_text") as HTMLDivElement;
	const flavor_div = text_div.querySelector("div.flavor_text") as HTMLDivElement;
	const hr = text_div.querySelector("hr.flavor_bar") as HTMLHRElement;
	const rules_content = rules_div.textContent?.trim() ?? "";
	const flavor_content = flavor_div.textContent?.trim() ?? "";
	
	// the idea here with the spacers is to have the content of the blocks vertically centered as a group but have the negative space on the top and bottom still clickable to focus the block
	// right now we use sibling dummy elements to fake it, but when it finally lands in chrome we might be able to use subgrid
	if (rules_content === "") {
		if (flavor_content === "") {
			text_div.style.gridTemplateRows = "1fr auto auto 1fr";
		} else {
			text_div.style.gridTemplateRows = "0 1fr auto 1fr";
		}
		hr.style.display = "none";
	} else {
		if (flavor_content === "") {
			text_div.style.gridTemplateRows = "1fr auto 1fr 0";
			hr.style.display = "none";
		} else {
			text_div.style.gridTemplateRows = "1fr auto auto 1fr";
			hr.style.removeProperty("display");
		}
	}
}


function update_pt_box(card_editor: card_editor) {
	const div = card_editor.element.querySelector(".card_editor div.pt") as HTMLDivElement;
	const img = card_editor.element.querySelector("img.pt_box") as HTMLImageElement;

	if (div.textContent?.trim()) {
		img.style.removeProperty("display");
	} else {
		img.style.display = "none";
	}
}

function on_visual_box_mousedown(e: MouseEvent, card_editor: card_editor) {
	if (!(e.currentTarget instanceof Element)) throw Error("on_visual_box_click listening on non-element");
	const ediable_div = e.currentTarget.previousElementSibling;
	if (!(ediable_div instanceof HTMLDivElement)) throw Error("can't find associated element div");
	const box = ediable_div.getBoundingClientRect();
	const closest_x = Math.max(box.left + 1, Math.min(e.clientX, box.right - 1));
	const closest_y = Math.max(box.top + 1, Math.min(e.clientY, box.bottom - 1));
	const range = document.caretRangeFromPoint(closest_x, closest_y); // todo: cross-browser support
	if (!range) throw Error("clamped mouse position is outside viewport");
	e.preventDefault();
	ediable_div.focus();
	const selection = window.getSelection()!;
	selection.removeAllRanges();
	selection.addRange(range);
}

function on_frame_img_click(e: MouseEvent, card_editor: card_editor) {
	document.body.appendChild(frame_select_menu);
	frame_select_menu.style.left = `${e.pageX}px`;
	frame_select_menu.style.top = `${e.pageY}px`;
}

function on_frame_select_menu_click(e: MouseEvent, card_editor: card_editor) {
	const button = (e.target instanceof Element ? e.target : (e.target as Node).parentElement)?.closest("button");
	if (!button) return;
	const color = button?.dataset.value! as keyof typeof frame_urls;
	card_editor.card.frame.image = frame_urls[color];
	update_frame(card_editor);
	document.body.removeChild(frame_select_menu);
}

function on_document_interact(e: Event) {
	if (frame_select_menu.parentNode !== document.body) return;
	if (!(e.target instanceof Node) || frame_select_menu.contains(e.target)) return;
	document.body.removeChild(frame_select_menu);
}

function on_cost_mousedown(e: MouseEvent, card_editor: card_editor) {
	if (!(e.currentTarget instanceof Element)) throw Error("on_visual_box_click listening on non-element");
	const range = document.caretRangeFromPoint(e.clientX, e.clientY); // todo: cross-browser support
	if (!range) throw Error("clamped mouse position is outside viewport");
	console.log(range);
	
	// const selection = window.getSelection()!;
	// selection.removeAllRanges();
	// selection.addRange(range);
}

function before_cost_input(e: InputEvent, card_editor: card_editor) {
	do_input_event(e, mana_input_event_map);
}
