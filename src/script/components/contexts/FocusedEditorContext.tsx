import { Dispatch, SetStateAction, useContext } from "react";
import { createContext } from "react";
import { ReactEditor } from "slate-react";

export const FocusedEditorContext = createContext<readonly [ReactEditor | undefined, Dispatch<SetStateAction<ReactEditor | undefined>>]>([undefined, () => {}]);

export function useFocusedEditor(): ReactEditor | undefined {
	const [focusedSlate] = useContext(FocusedEditorContext);
	return focusedSlate;
}
