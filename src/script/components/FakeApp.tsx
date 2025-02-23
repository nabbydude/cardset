import { useLayoutEffect } from "react";
import { card } from "../card";
import { project } from "../project";
import { DpiContext } from "./contexts/DpiContext";
import { ProjectContext } from "./contexts/ProjectContext";
import React from "react";
import { CardEditor } from "./CardEditor";

export function getFakeApp(props: { project: project, card: card, dpi: number, callback: () => void }) {
	return <FakeApp {...props}/>;
}

/**
 * Render Card Editor with needed context for export
 */
export function FakeApp(props: { project: project, card: card, dpi: number, callback: () => void }) {
	const { project, card, dpi, callback } = props;
	const noop = () => {};
	useLayoutEffect(callback);
	return (
		<DpiContext.Provider value={{ viewDpi: dpi, setViewDpi: noop, exportDpi: dpi, setExportDpi: noop, lockExportDpi: true, setLockExportDpi: noop }}>
			<ProjectContext.Provider value={project}>
				<div id="content">
					<CardEditor card={card} setActiveCard={noop} setSelectedCards={noop} readOnly style={{ display: "none" }}/>
				</div>
			</ProjectContext.Provider>
		</DpiContext.Provider>
	);
}
