import { Dispatch, SetStateAction } from "react";
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
