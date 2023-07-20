import React, { Dispatch, ReactNode, SetStateAction, createContext, useEffect, useMemo } from "react";
import { useDocument } from "./DocumentContext";
import { Card, isCard } from "../slate/Card";

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
				const cardEntry = doc.above<Card>({ at: selection, match: node => isCard(node) });
				if (cardEntry) setActiveId(cardEntry[0].id);
			}
		} : undefined,
	}), [doc, canUndo, canRedo]);

	useEffect(() => {
		if (!doc) return;
		const handler = (e: KeyboardEvent) => {
			if (!e.ctrlKey) return;
			if (e.code !== "KeyZ") return;
			if (e.shiftKey) {
				history.redo?.();
			} else {
				history.undo?.();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [doc, history]);

	return (
		<HistoryContext.Provider value={history}>
			{children}
		</HistoryContext.Provider>
	);
}
