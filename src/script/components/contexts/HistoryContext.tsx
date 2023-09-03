import React, { Dispatch, ReactNode, SetStateAction, createContext, useMemo } from "react";
import { useDocument } from "./DocumentContext";
import { Card, isCard } from "../slate/Card";
import { HotkeyConfig, useHotkeys } from "@blueprintjs/core";

export interface HistoryObject {
	undo?: () => void,
	redo?: () => void,
}

export const HistoryContext = createContext<HistoryObject>({});

export interface HistoryWrapperProps {
	setActiveId: Dispatch<SetStateAction<number | undefined>>,
	children: ReactNode,
}

export function HistoryWrapper(props: HistoryWrapperProps) {
	const { setActiveId, children } = props;
	const doc = useDocument();
	const canUndo = doc.history.undos.length > 0;
	const canRedo = doc.history.redos.length > 0;
	const history = useMemo(() => ({
		undo: canUndo ? () => {
			const selection = doc.history.undos[doc.history.undos.length - 1]?.selectionBefore;
			doc.undo();
			if (selection) {
				doc.select(selection); // undo/redo use setSelection which noops if there's no existing selection, so we force it here
				const cardEntry = doc.above<Card>({ at: selection, match: node => isCard(node) });
				if (cardEntry) setActiveId(cardEntry[0].id);
			}
		} : undefined,
		redo: canRedo ? () => {
			const selection = doc.history.redos[doc.history.redos.length - 1]?.selectionBefore;
			if (selection) doc.select(selection); // undo/redo use setSelection which noops if there's no existing selection, so we force it here
			doc.redo();
			if (selection) {
				try {
					const cardEntry = doc.above<Card>({ at: selection, match: node => isCard(node) });
					if (cardEntry) setActiveId(cardEntry[0].id);
				} catch {
					console.error("Error getting card entry for selection", selection, doc);
				}
			}
		} : undefined,
	}), [doc, canUndo, canRedo]);

	const hotkeys = useMemo<HotkeyConfig[]>(() => [
		{
			combo: "mod+z",
			label: "Undo",
			global: true,
			group: "History",
			allowInInput: true,
			onKeyDown: history.undo,
		},
		{
			combo: "mod+shift+z",
			label: "Redo",
			global: true,
			group: "History",
			allowInInput: true,
			onKeyDown: history.redo,
		},
	], [history.undo, history.redo]);

	useHotkeys(hotkeys);

	return (
		<HistoryContext.Provider value={history}>
			{children}
		</HistoryContext.Provider>
	);
}
