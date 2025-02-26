import JSZip from "jszip";
import { assets } from "./assets";
import { card, setCardId } from "./card";
import { show_file_select } from "./file_select";
import { history, new_history, unload_history_step } from "./history";
import { load_image_from_blob, unload_image } from "./image";
import { project } from "./project";
import { property_value, text_property } from "./property";
import { base_meta, current_meta, current_savefile_version, dehydrated_card, is_base_meta, is_dehydrated_card, version_is_later, version_is_same_or_earlier } from "./savefile";

export function ensure_current_version(meta: base_meta): current_meta {
	if (version_is_later(meta.version, current_savefile_version)) throw Error(`Version mismatch, Savefile is version ${meta.version.join(".")}, too new (loader version ${current_savefile_version.join(".")})`);
	if (version_is_same_or_earlier(meta.version, [0, 2, 0])) throw Error(`Version mismatch, loader cannot convert from files version 0.2.0 or earlier`);
	// once the savefile format is stable, if the file is an old version, this will update it to the current version.
	return meta as current_meta;
}

export function unload_project(project: project, history: history) {
	for (const card of project.card_list.cards) {
		for (const [id, property] of card.properties) {
			if (property.type === "image" && property.value) unload_image(property.value);
		}
	}
	for (const step of history.steps) {
		unload_history_step(step);
	}
}

export async function load_set(project: project, history: history, setProject: (value: project | undefined) => void, setHistory: (value: history) => void) {
	const file = await show_file_select();
	if (!file) return; // cancelled, do nothing
	let loaded_project
	try {
		setProject(undefined); // todo: fix. this is omega jank. this is just showing nothing while loading. replace with loading indicator or something
		loaded_project = await get_project_from_file(file);
	} catch (e: unknown) {
		setProject(project); // todo: fix. this is omega jank. this is just showing nothing while loading. replace with loading indicator or something
		throw e;
	}
	setProject(loaded_project);

	unload_project(project, history)
	setHistory(new_history());
}

export async function get_project_from_file(file: File): Promise<project> {
	let zip: JSZip;
	try {
		zip = await JSZip.loadAsync(file);
	} catch (e: unknown) {
		throw Error(`Can't parse zip structure`, { cause: e });
	}

	const meta_zipped = zip.file("meta.json");
	if (!meta_zipped) throw Error("meta.json not found");
	const meta_text = await meta_zipped.async("text");
	let meta: unknown;
	try {
		meta = JSON.parse(meta_text);
	} catch (e: unknown) {
		throw Error(`Malformed meta.json`, { cause: e });
	}
	if (!is_base_meta(meta)) throw Error("Improper schema in meta.json");
	try {
		meta = ensure_current_version(meta); // in the future we may need to do this after everything else, constructing some sort of intermediary type to pass to this to modify
	} catch (e) {
		throw Error("Unable to update savefile version", { cause: e });
	}

	const project: project = {
		name: (meta as current_meta).name, // we assign the return value of ensure_current_version to meta so this cast shouldnt be necessary but I guess ts is not that clever
		card_list: {
			id: "all",
			cards: new Set(),
			observers: new Set(),
		},
	};
	const cards_zipped = zip.file(/^cards\//);

	let highest_id = 0;

	await Promise.all(cards_zipped.map(async subfile => {
		const text = await subfile.async("text");
		let dehydrated_card: dehydrated_card;
		try {
			dehydrated_card = JSON.parse(text);
		} catch (e: unknown) {
			throw Error(`Malformed ${subfile.name}`, { cause: e });
		}

		// warning this doesnt deep check propereties, we do that later
		if (!is_dehydrated_card(dehydrated_card)) throw Error(`Improper schema in ${subfile.name}`);

		const card: card = {
			id: dehydrated_card.id,
			properties: new Map(),
		};

		for (const [id, dehydrated_property] of Object.entries(dehydrated_card.properties)) {
			// todo, test property structure
			if (!dehydrated_property || typeof dehydrated_property.type !== "string") throw Error(`Improper schema for ${id} property in ${subfile.name}`);
			const { type, value } = dehydrated_property;
			switch (type) {
				case "image": {
					if (typeof value !== "string") throw Error(`Improper schema for ${id} property in ${subfile.name}`);
					if (value === "") {
						card.properties.set(id, { id, type, value: undefined, observers: new Set() });
					} else if (value.startsWith("assets/")) {
						const name = value.substring("assets/".length) as keyof typeof assets;
						if (!assets[name]) throw Error(`Asset ${value} not found`);
						card.properties.set(id, { id, type, value: assets[name], observers: new Set() });
					} else {
						const blob = await zip.file(`images/${value}`)?.async("blob");
						if (!blob) throw Error(`Image ${value} not found`);
						card.properties.set(id, { id, type, value: load_image_from_blob(blob), observers: new Set() });
					}
				} break;
				case "enum": {
					if (typeof value !== "string") throw Error(`Improper schema for ${id} property in ${subfile.name}`)
					card.properties.set(id, { id, type, value, observers: new Set() });
				} break;
				case "text": {
					// todo: typecheck text value
					card.properties.set(id, { id, type, value: value as property_value<text_property>, observers: new Set() });
				} break;
			}
		}
		project.card_list.cards.add(card);

		const match = /^card_(\d+)$/.exec(card.id); // if id matches our current default id schema, make sure there are no collisions
		if (match) {
			highest_id = Math.max(highest_id, parseInt(match[1], 10));
		}
	}));

	setCardId(highest_id);
	return project;
}
