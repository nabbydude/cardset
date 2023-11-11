import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { CardEditor } from "./CardEditor";
import { Header } from "./Header";
import { ControllableCardList, listColumn } from "./CardList";
import { DocumentEditor, createDocumentEditor } from "../slate";
import { Card, isCard } from "./slate/Card";
import { Document } from "./slate/Document";
import { DocumentProvider, useDocument } from "./contexts/DocumentContext";
import { Node, NodeEntry } from "slate";
import { ImageStoreProvider, imageEntry } from "./contexts/ImageStoreContext";
import { loadSet, saveSet } from "../saveLoad";
import { FocusedEditorProvider } from "./contexts/FocusedEditorContext";
import { HistoryWrapper } from "./contexts/HistoryContext";
import { DpiProvider } from "./contexts/DpiContext";
import { exportCardImage, exportManyCardImages } from "../export";
import { HotkeysProvider } from "@blueprintjs/core";


const startingDocument: [Document] = [
	{
		type: "Document",
		name: "Untitled",
		children: [],
	},
];

const listColumns: listColumn[] = [
	{ field: "name", heading: "Name", width: 100 },
	{ field: "cost", heading: "Cost", width: 100 },
	{ field: "type", heading: "Type", width: 100 },
];

export function getApp() {
	return <App/>;
}

export function App() {
	const [activeId, setActiveId] = useState<number | undefined>();
	const [selectedIds, setSelectedIds] = useState(new Set<number>());
	const [doc, setDoc] = useState<DocumentEditor | undefined>(() => createDocumentEditor(startingDocument));
	const [imageStore, setImageStore] = useState(new Map<number, imageEntry>());

	const [columns, setColumns] = useState(listColumns);

	const [viewDpi, setViewDpi] = useState(150);
	const [exportDpi, setExportDpi] = useState(150);
	const [lockExportDpi, setLockExportDpi] = useState(true);

	const saveThisSet = useCallback(() => saveSet(doc!, imageStore), [doc, imageStore]);
	const loadThisSet = useCallback(() => loadSet(setDoc, setImageStore), [setDoc, setImageStore]);

	const exportCards = useCallback((ids: Iterable<number>) => {
		const arr = [...ids];
		if (arr.length === 1) {
			exportCardImage(doc!, imageStore, arr[0], exportDpi);
		} else {
			exportManyCardImages(doc!, imageStore, arr, exportDpi);
		}
	}, [doc, imageStore, exportDpi]);

	return (
		<HotkeysProvider>
			<ImageStoreProvider>
				<DpiProvider value={useMemo(() => ({ viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi }), [viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi])}>
					{doc ? (
						<DocumentProvider doc={doc}>
							<FocusedEditorProvider>
								<HistoryWrapper setActiveId={setActiveId}>
									<Header
										activeId={activeId}
										selectedIds={selectedIds}
										saveSet={saveThisSet}
										loadSet={loadThisSet}
									/>
									<div id="content">
										<CardEditor cardId={activeId} setActiveId={setActiveId} setSelectedIds={setSelectedIds}/>
										<MainCardList
											columns={columns}
											setColumns={setColumns}
											selectedIds={selectedIds}
											setSelectedIds={setSelectedIds}
											activeId={activeId}
											setActiveId={setActiveId}
											exportCards={exportCards}
										/>
									</div>
								</HistoryWrapper>
							</FocusedEditorProvider>
						</DocumentProvider>
					) : (
						<div>Loading...</div>
					)}
				</DpiProvider>
			</ImageStoreProvider>
		</HotkeysProvider>
	);
}

export interface MainCardListProps {
	columns: listColumn[],
	selectedIds: Set<number>, // ids of selected cards
	activeId?: number,
	setColumns: Dispatch<SetStateAction<listColumn[]>>,
	setSelectedIds: Dispatch<SetStateAction<Set<number>>>,
	setActiveId: Dispatch<SetStateAction<number | undefined>>,
	exportCards: (ids: Iterable<number>) => void,
}

export function MainCardList(props: MainCardListProps) {
	const doc = useDocument();
	const listedCardEntries = [...Node.children(doc, [0])].filter(([card]) => isCard(card)) as NodeEntry<Card>[];

	return (
		<ControllableCardList
			cardEntries={listedCardEntries}
			{...props}
		/>
	);
}
