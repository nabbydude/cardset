import React, { ReactNode, useCallback, useMemo, useState } from "react";
import { CardEditor } from "./CardEditor";
import { Header } from "./Header";
import { ReactEditor, Slate, useSlateWithV } from "slate-react";
import { ControllableCardList, listColumn } from "./CardList";
import { DocumentEditor, EditorWithVersion, addNewCardToDoc, createDocumentEditor, deleteCardsFromDoc } from "../slate";
import { Card, isCard } from "./slate/Card";
import { Document } from "./slate/Document";
import { DocumentContext, useDocument } from "./contexts/DocumentContext";
import { Node, NodeEntry } from "slate";
import { ImageStoreContext, imageEntry } from "./contexts/ImageStoreContext";
import { loadSet, saveSet } from "../saveLoad";
import { FocusedEditorContext, FocusedEditorContextValue } from "./contexts/FocusedEditorContext";
import { HistoryWrapper } from "./contexts/HistoryContext";
import { DpiContextWrapper } from "./contexts/DpiContext";
import { exportCardImage, exportManyCardImages } from "../export";


const startingDocument: [Document] = [
	{
		type: "Document",
		name: "Untitled",
		children: [],
	},
];

const listColumns: listColumn[] = [
	{ field: "name", header: "Name" },
	{ field: "cost", header: "Cost" },
	{ field: "type", header: "Type" },
];

export function getApp() {
	return <App/>;
}

export function App() {
	const [activeId, setActiveId] = useState<number | undefined>();
	const [selectedIds, setSelectedIds] = useState(new Set<number>());
	const [doc, setDoc] = useState<DocumentEditor | undefined>(() => createDocumentEditor(startingDocument));
	const [focusedEditor, setFocusedEditor] = useState<ReactEditor>();
	const [cachedFocusedEditor, setCachedFocusedEditor] = useState<ReactEditor>();
	const focusedEditorValue = useMemo<FocusedEditorContextValue>(() => ({ focusedEditor, setFocusedEditor, cachedFocusedEditor, setCachedFocusedEditor }), [focusedEditor, setFocusedEditor, cachedFocusedEditor, setCachedFocusedEditor]);
	const [imageStore, setImageStore] = useState(new Map<number, imageEntry>());
	const imageStoreValue = useMemo(() => [imageStore, setImageStore] as const, [imageStore, setImageStore]);

	const [viewDpi, setViewDpi] = useState(150);
	const [exportDpi, setExportDpi] = useState(150);
	const [lockExportDpi, setLockExportDpi] = useState(true);

	const saveThisSet = useCallback(() => saveSet(doc!, imageStore), [doc, imageStore]);
	const loadThisSet = useCallback(() => loadSet(setDoc, setImageStore), [setDoc, setImageStore]);

	const addCard = useCallback(() => addNewCardToDoc(doc!), [doc]);

	const addCardAndFocus = useCallback(() => {
		const card = addNewCardToDoc(doc!);
		setActiveId(card.id);
	}, [doc, setActiveId]);

	const exportCards = useCallback((ids: Iterable<number>) => {
		const arr = [...ids];
		if (arr.length === 1) {
			exportCardImage(doc!, imageStore, arr[0], exportDpi);
		} else {
			exportManyCardImages(doc!, imageStore, arr, exportDpi);
		}
	}, [doc, imageStore, exportDpi]);

	const deleteCards = useCallback((ids: Iterable<number>) => {
		deleteCardsFromDoc(doc!, ids);
		setSelectedIds(old => {
			const v = new Set(old);
			for (const id of ids) v.delete(id);
			return v;
		});
	}, [doc, setSelectedIds]);

	return (
		<ImageStoreContext.Provider value={imageStoreValue}>
			<DpiContextWrapper value={useMemo(() => ({ viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi }), [viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi])}>
				{doc ? (
					<Slate editor={doc} initialValue={doc.children}>
						<DocumentWrapper>
							<FocusedEditorContext.Provider value={focusedEditorValue}>
								<HistoryWrapper setActiveId={setActiveId}>
									<Header
										activeId={activeId}
										selectedIds={selectedIds}
										saveSet={saveThisSet}
										loadSet={loadThisSet}
									/>
									<div id="content">
										<CardEditor cardId={activeId} addCard={addCardAndFocus}/>
										<MainCardList
											columns={listColumns}
											selectedIds={selectedIds}
											setSelectedIds={setSelectedIds}
											activeId={activeId}
											setActiveId={setActiveId}
											addCard={addCard}
											exportCards={exportCards}
											deleteCards={deleteCards}
										/>
									</div>
								</HistoryWrapper>
							</FocusedEditorContext.Provider>
						</DocumentWrapper>
					</Slate>
				) : (
					<div>Loading...</div>
				)}
			</DpiContextWrapper>
		</ImageStoreContext.Provider>
	);
}

export interface DocumentWrapperProps {
	children: ReactNode,
}

export function DocumentWrapper(props: DocumentWrapperProps) {
	const docWithV = useSlateWithV() as unknown as EditorWithVersion<DocumentEditor>;

	return (
		<DocumentContext.Provider value={docWithV}>
			{props.children}
		</DocumentContext.Provider>
	);
}

export interface MainCardListProps {
	columns: listColumn[],
	selectedIds: Set<number>, // ids of selected cards
	activeId?: number,
	setSelectedIds: (cardsOrFunc: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	setActiveId: (card: number) => void,
	addCard: () => Card,
	exportCards: (ids: Iterable<number>) => void,
	deleteCards: (ids: Iterable<number>) => void,
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
