import JSZip from "jszip";
import { saveAs } from "file-saver";
import { project } from "./project";
import { card } from "./card";

type version = readonly [number, number, number];

const current_save_version = [0, 3, 0] as const;

export function isVersion(version: unknown): version is version {
	return (
		version instanceof Array &&
		version.length === 3 &&
		typeof version[0] === "number" &&
		typeof version[1] === "number" &&
		typeof version[2] === "number"
	);
}

export function compareVersion(version: version, other: version): number {
	if (version[0] > other[0]) return 1;
	if (version[0] < other[0]) return -1;
	if (version[1] > other[1]) return 1;
	if (version[1] < other[1]) return -1;
	if (version[2] > other[2]) return 1;
	if (version[2] < other[2]) return -1;
	return 0;
}

export function version_is_earlier(version: version, other: version): boolean {
	return compareVersion(version, other) < 0;
}

export function version_is_same_or_earlier(version: version, other: version): boolean {
	return compareVersion(version, other) <= 0;
}

export function version_is_later(version: version, other: version): boolean {
	return compareVersion(version, other) > 0;
}

export function version_is_same_or_later(version: version, other: version): boolean {
	return compareVersion(version, other) >= 0;
}

export const mimeTypeToFileExtension: Record<string, string> = {
	["image/avif"]: "avif",
	["image/gif"]: "gif",
	["image/jpeg"]: "jpg",
	["image/png"]: "png",
	["image/svg+xml"]: "svg",
	["image/webp"]: "webp",
};


interface base_meta {
	version: version,
}

interface current_meta {
	version: typeof current_save_version,
	name: string,
}

export function is_base_meta(meta: unknown): meta is base_meta {
	return !!meta && isVersion((meta as base_meta).version);
}

export function ensure_current_version(meta: base_meta): meta is current_meta {
	if (version_is_later(meta.version, current_save_version)) throw Error(`Version mismatch, Savefile is version ${meta.version.join(".")}, too new (loader version ${current_save_version.join(".")})`);
	if (version_is_same_or_earlier(meta.version, [0, 2, 0])) throw Error(`Version mismatch, loader cannot convert from files version 0.2.0 or earlier`);
	// once the savefile format is stable, if the file is an old version, this will update it to the current version.
	return true; // return true for type guard so that ts can be sure this is `current_meta` without casting
}

export async function save_set(project: project) {
	const zip = new JSZip();
	const meta: current_meta = { version: current_save_version, name: project.name }; 

	zip.file("meta.json", JSON.stringify(meta));
	for (const card of project.card_list.cards) {

		  //////////////////////////////////////////////////////////////////
		 // TODO: actually important next thing, dehydrate/hydrate saves //
		//////////////////////////////////////////////////////////////////
		zip.file(`cards/${card.id}.json`, card);
	}
	// for (const [k, v] of imageStore) {
	// 	zip.file(`images/${k}.${mimeTypeToFileExtension[v.data.type]}`, v.data);
	// }

	const blob = await zip.generateAsync({ type: "blob" });
	saveAs(blob, "my_set.zip");
}

export async function load_set(setProject: React.Dispatch<React.SetStateAction<project | undefined>>) {
	const input = document.createElement("input");
	input.type = "file";

	const file_result = new Promise<Event>((resolve, reject) => {
		const on_change: EventListener = e => {
			input.removeEventListener("change", on_change);
			input.removeEventListener("cancel", on_cancel);
			resolve(e);
		}
		const on_cancel: EventListener = e => {
			input.removeEventListener("change", on_change);
			input.removeEventListener("cancel", on_cancel);
			reject(e);
		}
		input.addEventListener("change", on_change);
		input.addEventListener("cancel", on_cancel);
	});
	input.click();
	try {
		await file_result;
	} catch (e: unknown) {
		if (e instanceof Event) {
			return; // cancelled
		} else throw e;
	}

	const file = input.files?.[0];
	if (!file) throw Error("No file found to load");

	setProject(undefined); // todo: fix. this is omega jank. this is just showing nothing while loading. replace with loading indicator or something

	const zip = await JSZip.loadAsync(file);

	const meta_zipped = zip.file("meta.json");
	if (!meta_zipped) throw Error("meta.json not found");
	const meta_text = await meta_zipped.async("text");
	const meta = JSON.parse(meta_text);
	if (!is_base_meta(meta)) throw Error("Invalid meta.json");
	try {
		if (!ensure_current_version(meta)) throw Error("ensure_current_version returned false (should be impossible)");
	} catch (e) {
		throw Error("Unable to update savefile version", { cause: e });
	}

	const project: project = {
		name: meta.name,
		card_list: {
			id: "all",
			cards: new Set(),
			observers: new Set()
		},
	};
	const cards_zipped = zip.file(/^cards\//);

	await Promise.all(cards_zipped.map(async v => {
		const text = await v.async("text");
		let data: unknown;
		try {
			data = JSON.parse(text);
		} catch (e: unknown) {
			throw Error(`Error parsing card file ${v.name}, bad JSON`, { cause: e });
		}
		// todo: properly check if is card
		if (!(data as card).id) throw Error(`Error parsing card file ${v.name}, no ID`);

		  //////////////////////////////////////////////////////////////////
		 // TODO: actually important next thing, dehydrate/hydrate saves //
		//////////////////////////////////////////////////////////////////
		project.card_list.cards.add(data as card);
	}));

	// const images_zipped = zip.file(/^images\//);
	// const image_pairs: [string, imageEntry][] = await Promise.all(images_zipped.map(async v => {
	// 	const data = await v.async("blob");
	// 	return [v.name, { data, url: URL.createObjectURL(data) }];
	// }));

	// todo: properly unload old project (images etc)

	setProject(project);
	// setImageStore(store => {
	// 	for (const [, v] of store) {
	// 		URL.revokeObjectURL(v.url);
	// 	}
	// 	return new Map(image_pairs);
	// });
}
