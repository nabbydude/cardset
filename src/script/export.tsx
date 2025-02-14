import { toBlob } from "html-to-image";
import { saveAs } from "file-saver";
import { Root, createRoot } from "react-dom/client";
import { CardEditor } from "./components/CardEditor";
import React, { useLayoutEffect } from "react";
import { DpiContext } from "./components/contexts/DpiContext";
import JSZip from "jszip";
import { card } from "./card";
import { project } from "./project";
import { ProjectContext } from "./components/contexts/ProjectContext";

export async function exportCardImage(project: project, card: card, dpi: number) {
	// let name: string;

	// const card = project.card_list[id];
	// if (!card) throw Error("Cannot find active card in document");

	// const nameNode = firstMatchingElement<Field>(card, { type: "Field", name: "name" });
	// // eslint-disable-next-line no-control-regex
	// if (nameNode) name = toSingleLinePlaintext(nameNode.children).replace(/[\\/<>:"|?*\0-\x1f]+/g, "");
	// name ||= "Card";
	saveAs(await generateCardImage(project, card, dpi), `${card.id}.png`);
}

export async function exportManyCardImages(project: project, cards: card[], dpi: number) {
	const images: Map<string, Blob> = new Map();
	
	for (const card of cards) {
		// let name: string;

		// const card = project.card_list[id];
		// if (!card) throw Error("Cannot find active card in document");

		// const nameNode = firstMatchingElement<Field>(card, { type: "Field", name: "name" });
		// // eslint-disable-next-line no-control-regex
		// if (nameNode) name = toSingleLinePlaintext(nameNode.children).replace(/[\\/<>:"|?*\0-\x1f]+/g, "");
		// name ||= "Card";
		// if (images.has(name)) {
		// 	let i = 2;
		// 	while (images.has(`${name} (${i})`)) i++;
		// 	name = `${name} (${i})`;
		// }
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
	const { root, rootElement } = await renderFake(project, card, dpi);
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

export function renderFake(project: project, card: card, dpi: number): Promise<{ root: Root, rootElement: HTMLDivElement }> {
	const rootElement = document.createElement("div");
	const root = createRoot(rootElement);
	return new Promise(resolve => root.render(<FakeApp project={project} card={card} dpi={dpi} callback={() => resolve({ root, rootElement })}/>));
}

export function FakeApp(props: { project: project, card: card, dpi: number, callback: () => void }) {
	const { project, card, dpi, callback } = props;
	const noop = () => {};
	useLayoutEffect(callback);
	return (
		<DpiContext.Provider value={{ viewDpi: dpi, setViewDpi: noop, exportDpi: dpi, setExportDpi: noop, lockExportDpi: true, setLockExportDpi: noop }}>
			<ProjectContext.Provider value={project}>
				<div id="content">
					<CardEditor card={card} setActiveCard={noop} setSelectedCards={noop} readOnly style={{ display: "none" }}/>
				</div>
			</ProjectContext.Provider>
		</DpiContext.Provider>
	);
}
