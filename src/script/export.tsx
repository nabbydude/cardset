import { toBlob } from "html-to-image";
import { saveAs } from "file-saver";
import { Card } from "./components/slate/Card";
import { Field } from "./components/slate/Field";
import { DocumentEditor, firstMatchingElement, toSingleLinePlaintext } from "./slate";
import { Root, createRoot } from "react-dom/client";
import { CardEditor } from "./components/CardEditor";
import { ImageStoreContext, imageEntry } from "./components/contexts/ImageStoreContext";
import React, { useLayoutEffect } from "react";
import { DocumentContext } from "./components/contexts/DocumentContext";
import { DpiContext } from "./components/contexts/DpiContext";
import JSZip from "jszip";

export async function exportCardImage(doc: DocumentEditor, imageStore: Map<number, imageEntry>, id: number, dpi: number) {
	let name: string;
	const card = firstMatchingElement<Card>(doc, { type: "Card", id });
	if (!card) throw Error("Cannot find active card in document");
	const nameNode = firstMatchingElement<Field>(card, { type: "Field", name: "name" });
	// eslint-disable-next-line no-control-regex
	if (nameNode) name = toSingleLinePlaintext(nameNode.children).replace(/[\\/<>:"|?*\0-\x1f]+/g, "");
	name ||= "Card";
	saveAs(await generateCardImage(doc, imageStore, card, dpi), `${name}.png`);
}

export async function exportManyCardImages(doc: DocumentEditor, imageStore: Map<number, imageEntry>, ids: number[], dpi: number) {
	const images: Map<string, Blob> = new Map();
	
	for (const id of ids) {
		let name: string;
		const card = firstMatchingElement<Card>(doc, { type: "Card", id });
		if (!card) throw Error("Cannot find active card in document");
		const nameNode = firstMatchingElement<Field>(card, { type: "Field", name: "name" });
		// eslint-disable-next-line no-control-regex
		if (nameNode) name = toSingleLinePlaintext(nameNode.children).replace(/[\\/<>:"|?*\0-\x1f]+/g, "");
		name ||= "Card";
		if (images.has(name)) {
			let i = 2;
			while (images.has(`${name} (${i})`)) i++;
			name = `${name} (${i})`;
		}
		images.set(name, await generateCardImage(doc, imageStore, card, dpi));
	}

	const zip = new JSZip();
	for (const [name, blob] of images) {
		zip.file(`${name}.png`, blob);
	}
	const blob = await zip.generateAsync({ type:"blob" });
	saveAs(blob, "cards.zip");
}

export async function generateCardImage(doc: DocumentEditor, imageStore: Map<number, imageEntry>, card: Card, dpi: number): Promise<Blob> {
	const { root, rootElement } = await renderFake(doc, imageStore, card.id, dpi);
	document.body.appendChild(rootElement);
	try {
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
		document.body.removeChild(rootElement);
		root.unmount();
	}
}

export function renderFake(doc: DocumentEditor, imageStore: Map<number, imageEntry>, cardId: number, dpi: number): Promise<{ root: Root, rootElement: HTMLDivElement }> {
	const rootElement = document.createElement("div");
	const root = createRoot(rootElement);
	return new Promise(resolve => root.render(<FakeApp doc={doc} imageStore={imageStore} cardId={cardId} dpi={dpi} callback={() => resolve({ root, rootElement })}/>));
}

export function FakeApp(props: { doc: DocumentEditor, imageStore: Map<number, imageEntry>, cardId: number, dpi: number, callback: () => void }) {
	const { doc, imageStore, cardId, dpi, callback } = props;
	const noop = () => {};
	useLayoutEffect(callback);
	return (
		<ImageStoreContext.Provider value={[imageStore, noop]}>
			<DpiContext.Provider value={{ viewDpi: dpi, setViewDpi: noop, exportDpi: dpi, setExportDpi: noop, lockExportDpi: true, setLockExportDpi: noop }}>
				<DocumentContext.Provider value={{ editor: doc, v: 0 }}>
					<div id="content">
						<CardEditor cardId={cardId} addCard={noop} readOnly style={{ display: "none" }}/>
					</div>
				</DocumentContext.Provider>
			</DpiContext.Provider>
		</ImageStoreContext.Provider>
	);
}
