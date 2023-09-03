import React, { Dispatch, ReactNode, SetStateAction, useMemo, useState } from "react";
import { createContext } from "react";
import { ReactEditor } from "slate-react";

export interface FocusedEditorContextValue {
	focusedEditor: ReactEditor | undefined,
	setFocusedEditor: Dispatch<SetStateAction<ReactEditor | undefined>>,
	/** The last non-undefined value of the `focusedEditor` property (or undefined if it's always been). */
	cachedFocusedEditor: ReactEditor | undefined,
	setCachedFocusedEditor: Dispatch<SetStateAction<ReactEditor | undefined>>,
}

export const FocusedEditorContext = createContext<FocusedEditorContextValue>({ focusedEditor: undefined, setFocusedEditor: () => {}, cachedFocusedEditor: undefined, setCachedFocusedEditor: () => {} });

export interface FocusedEditorProviderProps {
	children: ReactNode,
}

export function FocusedEditorProvider(props: FocusedEditorProviderProps) {
	const [focusedEditor, setFocusedEditor] = useState<ReactEditor>();
	const [cachedFocusedEditor, setCachedFocusedEditor] = useState<ReactEditor>();
	const focusedEditorValue = useMemo<FocusedEditorContextValue>(() => ({ focusedEditor, setFocusedEditor, cachedFocusedEditor, setCachedFocusedEditor }), [focusedEditor, setFocusedEditor, cachedFocusedEditor, setCachedFocusedEditor]);

	return (
		<FocusedEditorContext.Provider value={focusedEditorValue}>
			{props.children}
		</FocusedEditorContext.Provider>
	);
}
