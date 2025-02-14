import JSZip from "jszip";
import { saveAs } from "file-saver";
import { project } from "./project";
import { current_meta, current_savefile_version, dehydrated_card, mimeTypeToFileExtension } from "./savefile";
import { blob_image } from "./image";

export async function save_set(project: project) {
	const zip = new JSZip();
	const meta: current_meta = { version: current_savefile_version, name: project.name }; 
	const images: Map<string, blob_image> = new Map();
	let image_index = 1;
	zip.file("meta.json", JSON.stringify(meta));
	for (const card of project.card_list.cards) {
		const dehydrated_card: dehydrated_card = {
			id: card.id,
			properties: {},
		}

		for (const [id, property] of card.properties) {
			switch (property.type) {
				case "image": {
					if (!property.value) {
						dehydrated_card.properties[id] = { type: property.type, value: "" };
						continue
					}
					switch (property.value.type) {
						case "asset": {
							dehydrated_card.properties[id] = { type: property.type, value: `assets/${property.value.name}` };
						} break;
						case "blob": {
							const filename = `image_${image_index}.${mimeTypeToFileExtension[property.value.blob.type]}`; // todo: handle unkown filetypes to futureproof
							image_index++;
							images.set(filename, property.value);
							dehydrated_card.properties[id] = { type: property.type, value: filename };
						} break;
					}
				} break;
				case "enum":
				case "text": {
					dehydrated_card.properties[id] = { type: property.type, value: property.value };
				} break;
			}
		}
		zip.file(`cards/${dehydrated_card.id}.json`, JSON.stringify(dehydrated_card));
	}
	for (const [filename, image] of images) {
		zip.file(`images/${filename}`, image.blob);
	}
	const blob = await zip.generateAsync({ type: "blob" });
	saveAs(blob, "my_set.zip");
}
