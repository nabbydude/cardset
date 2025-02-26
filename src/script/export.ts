import { saveAs } from "file-saver";
import { toBlob } from "html-to-image";
import JSZip from "jszip";
import { Root, createRoot } from "react-dom/client";
import { card } from "./card";
import { getFakeApp } from "./components/FakeApp";
import { project } from "./project";

export async function exportCardImage(project: project, card: card, dpi: number) {
	saveAs(await generateCardImage(project, card, dpi), `${card.id}.png`);
}

export async function exportManyCardImages(project: project, cards: card[], dpi: number) {
	const images: Map<string, Blob> = new Map();
	
	for (const card of cards) {
		images.set(card.id, await generateCardImage(project, card, dpi));
	}

	const zip = new JSZip();
	for (const [name, blob] of images) {
		zip.file(`${name}.png`, blob);
	}
	const blob = await zip.generateAsync({ type:"blob" });
	saveAs(blob, "cards.zip");
}

export async function generateCardImage(project: project, card: card, dpi: number): Promise<Blob> {
	let root, rootElement;
	try {
		({ root, rootElement } = await renderFake(project, card, dpi));
		document.body.appendChild(rootElement);
		const editorElement = rootElement.querySelector<HTMLDivElement>("div.card-editor");
		if (!editorElement) throw Error("Cannot find editorElement");

		const blob = await toBlob(editorElement, {
			filter: node => !node.dataset?.noRender,
			style: { display: "block" },
			width: 2.5 * dpi,
			height: 3.5 * dpi,
		});

		if (!blob) throw Error("Failed to generate blob.");
		return blob;
	} finally {
		rootElement && document.body.removeChild(rootElement);
		root?.unmount();
	}
}

export function renderFake(project: project, card: card, dpi: number): Promise<{ root: Root, rootElement: HTMLDivElement }> {
	const rootElement = document.createElement("div");
	const root = createRoot(rootElement);
	return new Promise(resolve => root.render(getFakeApp({ project, card, dpi, callback: () => resolve({ root, rootElement }) })));
}
