import React, { ReactNode, createContext } from "react";
import { project } from "../../project";

export const ProjectContext = createContext<project>({ name: "Null Project", cards: {} });

export interface ProjectProviderProps {
	project: project,
	children: ReactNode,
}

export function ProjectProvider(props: ProjectProviderProps) {
	const { project } = props;

	return (
		<ProjectContext.Provider value={project}>
				{props.children}
		</ProjectContext.Provider>
	);
}
