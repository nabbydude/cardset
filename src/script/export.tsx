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

export async function exportCardImage(doc: DocumentEditor, imageStore: Map<number, imageEntry>, id: number | undefined, dpi: number) {
	if (!id) {
		console.warn("No active card id!");
		return;
	}
	const { root, rootElement } = await renderFake(doc, imageStore, id, dpi);
	document.body.appendChild(rootElement);
	try {
		const editorElement = rootElement.querySelector<HTMLDivElement>("div.card-editor");
		if (!editorElement) throw Error("Cannot find editorElement");

		const card = firstMatchingElement<Card>(doc, { type: "Card", id });
		let name: string;
		if (card) {
			const nameNode = firstMatchingElement<Field>(card, { type: "Field", name: "name" });
			// eslint-disable-next-line no-control-regex
			if (nameNode) name = toSingleLinePlaintext(nameNode.children).replace(/[\\/<>:"|?*\0-\x1f]+/g, "");
		}
		name ||= "Card";

		const blob = await toBlob(editorElement, {
			filter: node => !node.dataset?.noRender,
			style: { display: "block" },
			width: 2.5 * dpi,
			height: 3.5 * dpi,
		}).catch(console.error);

		if (!blob) {
			console.error("error generating blob!");
			return;
		}
		saveAs(blob, `${name}.png`);
	} finally {
		document.body.removeChild(rootElement);
		root.unmount();
	}
}

export function renderFake(doc: DocumentEditor, imageStore: Map<number, imageEntry>, cardId: number | undefined, dpi: number): Promise<{ root: Root, rootElement: HTMLDivElement }> {
	const rootElement = document.createElement("div");
	const root = createRoot(rootElement);
	return new Promise(resolve => root.render(<FakeApp doc={doc} imageStore={imageStore} cardId={cardId} dpi={dpi} callback={() => resolve({ root, rootElement })}/>));
}

export function FakeApp(props: { doc: DocumentEditor, imageStore: Map<number, imageEntry>, cardId: number | undefined, dpi: number, callback: () => void }) {
	const { doc, imageStore, cardId, dpi, callback } = props;
	const noop = () => {};
	useLayoutEffect(callback);
	return (
		<ImageStoreContext.Provider value={[imageStore, noop]}>
			<DocumentContext.Provider value={{ editor: doc, v: 0 }}>
				<div id="content">
					<CardEditor cardId={cardId} dpi={dpi} addCard={noop} readOnly style={{ display: "none" }}/>
				</div>
			</DocumentContext.Provider>
		</ImageStoreContext.Provider>
	);
}
