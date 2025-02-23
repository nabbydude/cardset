import React, { Dispatch, SetStateAction, useCallback, useContext, useMemo, useState } from "react";
import { CardEditor } from "./CardEditor";
import { Header } from "./Header";
import { ControllableCardList, listColumn } from "./CardList";
import { save_set } from "../save";
import { FocusedEditorProvider } from "./contexts/FocusedEditorContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import { DpiProvider } from "./contexts/DpiContext";
import { exportCardImage, exportManyCardImages } from "../export";
import { HotkeysProvider } from "@blueprintjs/core";
import { project } from "../project";
import { ProjectContext, ProjectProvider } from "./contexts/ProjectContext";
import { card } from "../card";
import { load_set } from "../load";
import { history, new_history } from "../history";
import { focus } from "../focus";

const starting_project: project = {
	name: "Untitled",
	card_list: {
		id: "all",
		cards: new Set(),
		observers: new Set()
	},
};

const listColumns: listColumn[] = [
	{ control: { id: "list#name", type: "text", property_id: "name", min_font_size: 10, max_font_size: 10 }, label: "Name", width: 300 },
	{ control: { id: "list#cost", type: "text", property_id: "cost", min_font_size: 10, max_font_size: 10 }, label: "Cost", width: 100 },
	{ control: { id: "list#type", type: "text", property_id: "type", min_font_size: 10, max_font_size: 10 }, label: "Type", width: 300 },
];

export function getApp() {
	return <App/>;
}

export function App() {
	const [activeCard, setActiveCard] = useState<card | undefined>();
	const [selectedCards, setSelectedCards] = useState(new Set<card>());
	const [project, setProject] = useState<project | undefined>(starting_project);
	const [history, setHistory] = useState<history>(new_history());

	const [columns, setColumns] = useState(listColumns);

	const [viewDpi, setViewDpi] = useState(150);
	const [exportDpi, setExportDpi] = useState(150);
	const [lockExportDpi, setLockExportDpi] = useState(true);

	const saveThisSet = useCallback(() => save_set(project!), [project]);
	const loadThisSet = useCallback(() => load_set(project!, history, setProject, setHistory), [setProject]);

	const exportCards = useCallback((cards: Iterable<card>) => {
		const arr = [...cards];
		if (arr.length === 1) {
			exportCardImage(project!, arr[0], exportDpi);
		} else {
			exportManyCardImages(project!, arr, exportDpi);
		}
	}, [project, exportDpi]);

	const setFocus = useCallback((focus: focus) => {
		switch (focus.type) {
			case "card_control": {
				setActiveCard(focus.card);
				(document.querySelector(`[data-control-id=${focus.control.id}]`) as HTMLElement).focus();
			} break;
			case "card_text_control": {
				setActiveCard(focus.card);
				(document.querySelector(`[data-control-id=${focus.control.id}]`) as HTMLElement).focus();
			} break;
			case "none": break;
		}
	}, [setActiveCard]);

	return (
		<HotkeysProvider>
			<DpiProvider value={useMemo(() => ({ viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi }), [viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi])}>
				{project ? (
					<ProjectProvider project={project}>
						<FocusedEditorProvider>
							<HistoryProvider history={history} setFocus={setFocus}>
								<Header
									activeCard={activeCard}
									selectedCards={selectedCards}
									saveSet={saveThisSet}
									loadSet={loadThisSet}
								/>
								<div id="content">
									<CardEditor card={activeCard} setActiveCard={setActiveCard} setSelectedCards={setSelectedCards}/>
									<MainCardList
										columns={columns}
										setColumns={setColumns}
										selectedCards={selectedCards}
										setSelectedCards={setSelectedCards}
										activeCard={activeCard}
										setActiveCard={setActiveCard}
										exportCards={exportCards}
									/>
								</div>
							</HistoryProvider>
						</FocusedEditorProvider>
					</ProjectProvider>
				) : (
					<div>Loading...</div>
				)}
			</DpiProvider>
		</HotkeysProvider>
	);
}

export interface MainCardListProps {
	columns: listColumn[],
	selectedCards: Set<card>, // ids of selected cards
	activeCard?: card,
	setColumns: Dispatch<SetStateAction<listColumn[]>>,
	setSelectedCards: Dispatch<SetStateAction<Set<card>>>,
	setActiveCard: Dispatch<SetStateAction<card | undefined>>,
	exportCards: (ids: Iterable<card>) => void,
}

export function MainCardList(props: MainCardListProps) {
	const project = useContext(ProjectContext);

	return (
		<ControllableCardList
			card_list={project.card_list}
			{...props}
		/>
	);
}
