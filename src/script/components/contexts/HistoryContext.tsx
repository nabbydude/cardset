import React, { Dispatch, ReactNode, SetStateAction, createContext, useContext, useMemo, useState } from "react";
import { HotkeyConfig, useHotkeys } from "@blueprintjs/core";
import { history, redo, undo } from "../../history";
import { card } from "../../card";


export const HistoryContext = createContext<history>({ index: 0, steps: [], allow_merging: false, force_merging: false, disable_next_merge: false });
export const UndoRedoContext = createContext<undo_redo>({ undo: () => {}, redo: () => {}, can_undo: false, can_redo: false });

export interface HistoryProviderProps {
	history: history,
	setActiveCard: Dispatch<SetStateAction<card | undefined>>,
	children: ReactNode,
}

export interface UndoRedoProviderProps {
	children: ReactNode,
}

export interface undo_redo {
	undo: () => void,
	redo: () => void,
	can_undo: boolean,
	can_redo: boolean,
}

export function HistoryProvider(props: HistoryProviderProps) {
	const { history, setActiveCard, children } = props;

	const [_, refresh_undo_redo] = useState({});
	const can_undo = history.index > 0;
	const can_redo = history.index < history.steps.length;

	const undo_redo = useMemo<undo_redo>(() => ({
		can_undo,
		can_redo,
		undo: () => {
			undo(history);
			refresh_undo_redo({});
			// TODO: set focus. maybe all of undo should be here?

			// const selection = doc.history.undos[doc.history.undos.length - 1]?.selectionBefore;
			// doc.undo();
			// if (selection) {
			// 	doc.select(selection); // undo/redo use setSelection which noops if there's no existing selection, so we force it here
			// 	const cardEntry = doc.above<Card>({ at: selection, match: node => isCard(node) });
			// 	if (cardEntry) setActiveId(cardEntry[0].id);
			// }
		},
		redo: () => {
			redo(history);
			refresh_undo_redo({});
			// const selection = doc.history.redos[doc.history.redos.length - 1]?.selectionBefore;
			// if (selection) doc.select(selection); // undo/redo use setSelection which noops if there's no existing selection, so we force it here
			// doc.redo();
			// if (selection) {
			// 	try {
			// 		const cardEntry = doc.above<Card>({ at: selection, match: node => isCard(node) });
			// 		if (cardEntry) setActiveId(cardEntry[0].id);
			// 	} catch {
			// 		console.error("Error getting card entry for selection", selection, doc);
			// 	}
			// }
		},
	}), [history, can_undo, can_redo]);

	const hotkeys = useMemo<HotkeyConfig[]>(() => [
		{
			combo: "mod+z",
			label: "Undo",
			global: true,
			group: "History",
			allowInInput: true,
			onKeyDown: undo_redo.undo,
		},
		{
			combo: "mod+shift+z",
			label: "Redo",
			global: true,
			group: "History",
			allowInInput: true,
			onKeyDown: undo_redo.redo,
		},
	], [undo_redo]);

	useHotkeys(hotkeys);


	return (
		<HistoryContext.Provider value={history}>
			<UndoRedoContext.Provider value={undo_redo}>
				{children}
			</UndoRedoContext.Provider>
		</HistoryContext.Provider>
	);
}
