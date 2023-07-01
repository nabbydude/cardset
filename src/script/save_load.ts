import JSZip from "jszip";
import { saveAs } from "file-saver";
import { DocumentEditor, create_document_editor } from "./slate";
import { image_entry, image_store_handle } from "./components/contexts/ImageStoreContext";

type version = [number, number, number];

const current_save_version: version = [0, 1, 0];

export function isVersion(version: any): version is version {
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

export function versionIsLater(version: version, other: version): boolean {
	return compareVersion(version, other) > 0;
}

export function versionIsSameOrLater(version: version, other: version): boolean {
	return compareVersion(version, other) >= 0;
}

export const mime_type_to_file_extension: Record<string, string> = {
	["image/avif"]: "avif",
	["image/gif"]: "gif",
	["image/jpeg"]: "jpeg",
	["image/png"]: "png",
	["image/svg+xml"]: "svg",
	["image/webp"]: "webp",
}


interface BaseMeta {
	version: version,
}

export function isBaseMeta(meta: any): meta is BaseMeta {
	return isVersion(meta.version);
}



export async function save_set(doc: DocumentEditor, image_store: Map<number, image_entry>) {
	const zip = new JSZip();
	zip.file("meta.json", JSON.stringify({ version: current_save_version }));
	zip.file("document.json", JSON.stringify(doc.children));
	for (const [k, v] of image_store) {
		zip.file(`images/${k}.${mime_type_to_file_extension[v.data.type]}`, v.data);
	}
	const blob = await zip.generateAsync({ type:"blob" })
	saveAs(blob, "my_set.zip");
}

export async function load_set(set_doc: React.Dispatch<React.SetStateAction<DocumentEditor | undefined>>, set_image_store: React.Dispatch<React.SetStateAction<Map<number, image_entry>>>) {
	const input = document.createElement("input");
	input.type = "file";
	const change = new Promise<Event>((resolve) => input.addEventListener("change", resolve, { once: true }));
	const click = new Promise<Event>((resolve) => input.addEventListener("click", resolve, { once: true }));
	input.click();
	const event = await Promise.race([change, click]);
	if (event.type === "click") {
		console.log("Loading Canceled");
		return;
	}
	

	const file = input.files?.[0];
	if (!file) throw Error("No file found to load");

	set_doc(undefined); // todo: fix. this is omega jank, if we don't do it, slate will continue to show stale document

	const zip = await JSZip.loadAsync(file);

	const meta_zipped = zip.file("meta.json");
	if (!meta_zipped) throw Error("meta.json not found");
	const meta_text = await meta_zipped.async("text");
	const meta = JSON.parse(meta_text);
	if (!isBaseMeta(meta)) throw Error("Invalid meta.json");
	if (versionIsLater(meta.version, current_save_version)) throw Error(`Version mismatch, Savefile is version ${meta.version.join(".")}, loader is only ${current_save_version.join(".")}`);
	// in the future I'd rather smarter handling of major/minor/bugfix versions with modal/toasted warnings etc

	const doc_zipped = zip.file("document.json");
	if (!doc_zipped) throw Error("document.json not found");
	const doc_text = await doc_zipped.async("text");
	const doc = JSON.parse(doc_text);

	const images_zipped = zip.file(/^images\//);
	const pairs: [number, image_entry][] = await Promise.all(images_zipped.map(async v => {
		const data = await v.async("blob");
		return [Number(v.name.match(/^(?:.*\/)?(\d+)\.\w+$/)![1]), { data, url: URL.createObjectURL(data) }];
	}));

	set_doc(() => create_document_editor(doc));
	set_image_store(store => {
		for (const [k, v] of store) {
			URL.revokeObjectURL(v.url);
		}
		return new Map(pairs);
	});
}
