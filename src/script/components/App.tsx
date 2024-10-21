import React, { Dispatch, SetStateAction, useCallback, useContext, useMemo, useState } from "react";
import { CardEditor } from "./CardEditor";
import { Header } from "./Header";
import { ControllableCardList, listColumn } from "./CardList";
import { ImageStoreProvider, imageEntry } from "./contexts/ImageStoreContext";
import { load_set, save_set } from "../saveLoad";
import { FocusedEditorProvider } from "./contexts/FocusedEditorContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import { DpiProvider } from "./contexts/DpiContext";
import { exportCardImage, exportManyCardImages } from "../export";
import { HotkeysProvider } from "@blueprintjs/core";
import { project } from "../project";
import { ProjectContext, ProjectProvider } from "./contexts/ProjectContext";

const starting_project: project = {
	name: "Untitled",
	cards: {},
};

const listColumns: listColumn[] = [
	{ property: "name", heading: "Name", width: 100 },
	{ property: "cost", heading: "Cost", width: 100 },
	{ property: "type", heading: "Type", width: 100 },
];

export function getApp() {
	return <App/>;
}

export function App() {
	const [activeId, setActiveId] = useState<string | undefined>();
	const [selectedIds, setSelectedIds] = useState(new Set<string>());
	const [project, setProject] = useState<project | undefined>(starting_project);
	const [imageStore, setImageStore] = useState(new Map<string, imageEntry>());

	const [columns, setColumns] = useState(listColumns);

	const [viewDpi, setViewDpi] = useState(150);
	const [exportDpi, setExportDpi] = useState(150);
	const [lockExportDpi, setLockExportDpi] = useState(true);

	const saveThisSet = useCallback(() => save_set(project!, imageStore), [project, imageStore]);
	const loadThisSet = useCallback(() => load_set(setProject, setImageStore), [setProject, setImageStore]);

	const exportCards = useCallback((ids: Iterable<string>) => {
		const arr = [...ids];
		if (arr.length === 1) {
			exportCardImage(project!, imageStore, arr[0], exportDpi);
		} else {
			exportManyCardImages(project!, imageStore, arr, exportDpi);
		}
	}, [project, imageStore, exportDpi]);

	return (
		<HotkeysProvider>
			<ImageStoreProvider>
				<DpiProvider value={useMemo(() => ({ viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi }), [viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi])}>
					{project ? (
						<ProjectProvider project={project}>
							<FocusedEditorProvider>
								<HistoryProvider setActiveId={setActiveId}>
									<Header
										activeId={activeId}
										selectedIds={selectedIds}
										saveSet={saveThisSet}
										loadSet={loadThisSet}
									/>
									<div id="content">
										<CardEditor card={activeId ? project.cards[activeId] : undefined} setActiveId={setActiveId} setSelectedIds={setSelectedIds}/>
										{/* <MainCardList
											columns={columns}
											setColumns={setColumns}
											selectedIds={selectedIds}
											setSelectedIds={setSelectedIds}
											activeId={activeId}
											setActiveId={setActiveId}
											exportCards={exportCards}
										/> */}
									</div>
								</HistoryProvider>
							</FocusedEditorProvider>
						</ProjectProvider>
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
	selectedIds: Set<string>, // ids of selected cards
	activeId?: string,
	setColumns: Dispatch<SetStateAction<listColumn[]>>,
	setSelectedIds: Dispatch<SetStateAction<Set<string>>>,
	setActiveId: Dispatch<SetStateAction<string | undefined>>,
	exportCards: (ids: Iterable<string>) => void,
}

export function MainCardList(props: MainCardListProps) {
	const project = useContext(ProjectContext);
	const cards = Object.values(project.cards);

	return (
		<ControllableCardList
			cards={cards}
			{...props}
		/>
	);
}
