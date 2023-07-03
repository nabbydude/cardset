import JSZip from "jszip";
import { saveAs } from "file-saver";
import { DocumentEditor, createDocumentEditor } from "./slate";
import { imageEntry } from "./components/contexts/ImageStoreContext";

type version = [number, number, number];

const currentSaveVersion: version = [0, 1, 0];

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

export function versionIsLater(version: version, other: version): boolean {
	return compareVersion(version, other) > 0;
}

export function versionIsSameOrLater(version: version, other: version): boolean {
	return compareVersion(version, other) >= 0;
}

export const mimeTypeToFileExtension: Record<string, string> = {
	["image/avif"]: "avif",
	["image/gif"]: "gif",
	["image/jpeg"]: "jpeg",
	["image/png"]: "png",
	["image/svg+xml"]: "svg",
	["image/webp"]: "webp",
};


interface BaseMeta {
	version: version,
}

export function isBaseMeta(meta: unknown): meta is BaseMeta {
	return !!meta && isVersion((meta as BaseMeta).version);
}



export async function saveSet(doc: DocumentEditor, imageStore: Map<number, imageEntry>) {
	const zip = new JSZip();
	zip.file("meta.json", JSON.stringify({ version: currentSaveVersion }));
	zip.file("document.json", JSON.stringify(doc.children));
	for (const [k, v] of imageStore) {
		zip.file(`images/${k}.${mimeTypeToFileExtension[v.data.type]}`, v.data);
	}
	const blob = await zip.generateAsync({ type:"blob" });
	saveAs(blob, "mySet.zip");
}

export async function loadSet(setDoc: React.Dispatch<React.SetStateAction<DocumentEditor | undefined>>, setImageStore: React.Dispatch<React.SetStateAction<Map<number, imageEntry>>>) {
	const input = document.createElement("input");
	input.type = "file";
	const change = new Promise<Event>((resolve) => input.addEventListener("change", resolve, { once: true }));
	input.click();
	await change;

	const file = input.files?.[0];
	if (!file) throw Error("No file found to load");

	setDoc(undefined); // todo: fix. this is omega jank, if we don't do it, slate will continue to show stale document

	const zip = await JSZip.loadAsync(file);

	const metaZipped = zip.file("meta.json");
	if (!metaZipped) throw Error("meta.json not found");
	const metaText = await metaZipped.async("text");
	const meta = JSON.parse(metaText);
	if (!isBaseMeta(meta)) throw Error("Invalid meta.json");
	if (versionIsLater(meta.version, currentSaveVersion)) throw Error(`Version mismatch, Savefile is version ${meta.version.join(".")}, loader is only ${currentSaveVersion.join(".")}`);
	// in the future I'd rather smarter handling of major/minor/bugfix versions with modal/toasted warnings etc

	const docZipped = zip.file("document.json");
	if (!docZipped) throw Error("document.json not found");
	const docText = await docZipped.async("text");
	const doc = JSON.parse(docText);

	const imagesZipped = zip.file(/^images\//);
	const pairs: [number, imageEntry][] = await Promise.all(imagesZipped.map(async v => {
		const data = await v.async("blob");
		return [Number(v.name.match(/^(?:.*\/)?(\d+)\.\w+$/)![1]), { data, url: URL.createObjectURL(data) }];
	}));

	setDoc(() => createDocumentEditor(doc));
	setImageStore(store => {
		for (const [, v] of store) {
			URL.revokeObjectURL(v.url);
		}
		return new Map(pairs);
	});
}
