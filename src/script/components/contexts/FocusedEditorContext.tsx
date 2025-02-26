import React, { Dispatch, ReactNode, SetStateAction, useMemo, useState } from "react";
import { createContext } from "react";
import { TextControlEditor } from "../../slate";

export interface FocusedEditorContextValue {
	focusedEditor: TextControlEditor | undefined,
	setFocusedEditor: Dispatch<SetStateAction<TextControlEditor | undefined>>,
	/** The last non-undefined value of the `focusedEditor` property (or undefined if it's always been). */
	cachedFocusedEditor: TextControlEditor | undefined,
	setCachedFocusedEditor: Dispatch<SetStateAction<TextControlEditor | undefined>>,
}

export const FocusedEditorContext = createContext<FocusedEditorContextValue>({ focusedEditor: undefined, setFocusedEditor: () => {}, cachedFocusedEditor: undefined, setCachedFocusedEditor: () => {} });

export interface FocusedEditorProviderProps {
	children: ReactNode,
}

export function FocusedEditorProvider(props: FocusedEditorProviderProps) {
	const [focusedEditor, setFocusedEditor] = useState<TextControlEditor>();
	const [cachedFocusedEditor, setCachedFocusedEditor] = useState<TextControlEditor>();
	const focusedEditorValue = useMemo<FocusedEditorContextValue>(() => ({ focusedEditor, setFocusedEditor, cachedFocusedEditor, setCachedFocusedEditor }), [focusedEditor, setFocusedEditor, cachedFocusedEditor, setCachedFocusedEditor]);

	return (
		<FocusedEditorContext.Provider value={focusedEditorValue}>
			{props.children}
		</FocusedEditorContext.Provider>
	);
}
