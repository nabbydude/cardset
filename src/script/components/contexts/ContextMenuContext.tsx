import { Dispatch, SetStateAction, createContext, useContext } from "react";
import { contextMenuData } from "../ContextMenu";

export const ContextMenuContext = createContext<Dispatch<SetStateAction<contextMenuData | undefined>>>(() => {});

export function useContextMenu(): Dispatch<SetStateAction<contextMenuData | undefined>> {
	return useContext(ContextMenuContext);
}
