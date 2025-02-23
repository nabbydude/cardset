import React, { Dispatch, ReactNode, SetStateAction, createContext, useContext, useMemo, useState } from "react";
import { HotkeyConfig, useHotkeys } from "@blueprintjs/core";
import { history, new_history, redo, undo } from "../../history";
import { card } from "../../card";
import { focus } from "../../focus";


export const HistoryContext = createContext<history>(new_history());
export const UndoRedoContext = createContext<undo_redo>({ undo: () => {}, redo: () => {}, can_undo: false, can_redo: false });

export interface HistoryProviderProps {
	history: history,
	setFocus: (focus: focus) => void,
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
	const { history, setFocus, children } = props;

	const [_, refresh_undo_redo] = useState({});
	const can_undo = history.index > 0;
	const can_redo = history.index < history.steps.length;

	const undo_redo = useMemo<undo_redo>(() => ({
		can_undo,
		can_redo,
		undo: () => {
			undo(history, setFocus);
			refresh_undo_redo({});
		},
		redo: () => {
			redo(history, setFocus);
			refresh_undo_redo({});
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
