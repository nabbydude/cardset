import React, { ReactNode, createContext } from "react";
import { project } from "../../project";
import { CardTextControlEditor } from "../../slate";
import { ReactEditor } from "slate-react";

export const ControlEditorDirectoryContext = createContext<Map<string, CardTextControlEditor & ReactEditor>>(new Map());

// export interface ControlEditorDirectoryProviderProps {
// 	project: project,
// 	children: ReactNode,
// }

// export function ControlEditorDirectoryProvider(props: ControlEditorDirectoryProviderProps) {
// 	const { project } = props;

// 	return (
// 		<ControlEditorDirectoryContext.Provider value={project}>
// 				{props.children}
// 		</ControlEditorDirectoryContext.Provider>
// 	);
// }
