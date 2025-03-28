import { BlueprintProvider } from "@blueprintjs/core";
import React, { Dispatch, SetStateAction, useContext, useMemo, useState } from "react";
import { card } from "../card";
import { exportCardImage, exportManyCardImages } from "../export";
import { focus } from "../focus";
import { history, new_history } from "../history";
import { load_set } from "../load";
import { project } from "../project";
import { save_set } from "../save";
import { useToastedCallback } from "../toaster";
import { CardEditor } from "./CardEditor";
import { ControllableCardList, listColumn } from "./CardList";
import { DpiProvider } from "./contexts/DpiContext";
import { FocusedEditorProvider } from "./contexts/FocusedEditorContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import { ProjectContext, ProjectProvider } from "./contexts/ProjectContext";
import { Header } from "./Header";
import { flushSync } from "react-dom";
import { Editor } from "slate";
import { ReactEditor } from "slate-react";
import { useObserver } from "./hooks/useObserver";

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

	const saveThisSet = useToastedCallback(() => save_set(project!), [project]);
	const loadThisSet = useToastedCallback(() => load_set(project!, history, setProject, setHistory), [project, history]);

	const exportCards = useToastedCallback((cards: Iterable<card>) => {
		const arr = [...cards];
		if (arr.length === 1) {
			exportCardImage(project!, arr[0], exportDpi);
		} else {
			exportManyCardImages(project!, arr, exportDpi);
		}
	}, [project, exportDpi]);

	const setFocus = useToastedCallback((focus: focus) => {
		switch (focus.type) {
			case "card_control": {
				flushSync(() => setActiveCard(focus.card));
				const el = document.querySelector(`[data-control-id=${focus.control.id}]`) as HTMLElement;
				el.focus();
			} break;
			case "card_text_control": {
				flushSync(() => setActiveCard(focus.card));
				const el = document.querySelector(`[data-control-id=${focus.control.id}]`) as HTMLElement;

				const editor = ReactEditor.toSlateNode(
					undefined as unknown as Editor, // this is unused in the current implementation (global weakmap lookup)
					el,
				) as Editor; // throws if it cant find

				editor.select(focus.selection || editor.selection || { anchor: editor.end([]), focus: editor.end([]) });
				ReactEditor.focus(editor);
			} break;
			case "none": break;
		}
	}, []);

	useObserver(starting_project.card_list, (operation) => {
		if (operation.type === "remove_card_from_list") {
			console.log(operation);
			if (operation.card === activeCard) setActiveCard(undefined);
			if (selectedCards.has(operation.card)) setSelectedCards(old => { old.delete(operation.card); return new Set(old) }); // I kinda wanna change this I hate immutability for this
		}
	}, [starting_project.card_list, activeCard, selectedCards]);

	return (
		<BlueprintProvider>
			<DpiProvider value={useMemo(() => ({ viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi }), [viewDpi, exportDpi, lockExportDpi])}>
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
		</BlueprintProvider>
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
