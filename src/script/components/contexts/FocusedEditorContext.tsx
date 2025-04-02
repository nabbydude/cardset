import React, { Dispatch, ReactNode, SetStateAction, useCallback, useMemo, useState } from "react";
import { createContext } from "react";
import { TextControlEditor } from "../../slate";

export type EditorWithV = { editor: TextControlEditor, v: number };

export interface FocusedEditorReadContextValue {
	focusedEditor: TextControlEditor | undefined,
	/** The last non-undefined value of the `focusedEditor` property (or undefined if it's always been). */
	cachedFocusedEditor: TextControlEditor | undefined,
	v: number,
}
export interface FocusedEditorWriteContextValue {
	setFocusedEditor: Dispatch<SetStateAction<EditorWithV | undefined>>,
	clearFocusedEditor: () => void,
}

export const FocusedEditorReadContext = createContext<FocusedEditorReadContextValue>({ focusedEditor: undefined, cachedFocusedEditor: undefined, v: 0 });
export const FocusedEditorWriteContext = createContext<FocusedEditorWriteContextValue>({ setFocusedEditor: () => {}, clearFocusedEditor: () => {} });

export interface FocusedEditorProviderProps {
	children: ReactNode,
}

export function FocusedEditorProvider(props: FocusedEditorProviderProps) {
	const [focusedEditor, setFocusedEditor] = useState<EditorWithV | undefined>();
	const [cachedFocusedEditor, setCachedFocusedEditor] = useState<EditorWithV | undefined>();
	const focusedEditorReadValue = useMemo<FocusedEditorReadContextValue>(() => ({ focusedEditor: focusedEditor?.editor, cachedFocusedEditor: focusedEditor?.editor, v: cachedFocusedEditor?.v ?? 0 }), [focusedEditor?.editor, cachedFocusedEditor?.editor, cachedFocusedEditor?.v]);
	const focusedEditorWriteValue = useMemo<FocusedEditorWriteContextValue>(() => ({
		setFocusedEditor: (value) => {
			setFocusedEditor(value);
			if (value) setCachedFocusedEditor(value);
		},
		clearFocusedEditor: () => {
			setFocusedEditor(undefined);
			setCachedFocusedEditor(undefined);
		},
	}), []);

	return (
		<FocusedEditorReadContext.Provider value={focusedEditorReadValue}>
			<FocusedEditorWriteContext.Provider value={focusedEditorWriteValue}>
				{props.children}
			</FocusedEditorWriteContext.Provider>
		</FocusedEditorReadContext.Provider>
	);
}
