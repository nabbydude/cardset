import { Dispatch, SetStateAction, createContext, useContext } from "react";
import { context_menu_data } from "./ContextMenu";

export const ContextMenuContext = createContext<Dispatch<SetStateAction<context_menu_data | undefined>>>(() => {});

export function useContextMenu(): Dispatch<SetStateAction<context_menu_data | undefined>> {
	return useContext(ContextMenuContext);
}
