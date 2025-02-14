import React, { useCallback, useContext } from "react";
import { AnchorButton, AnchorButtonProps, ButtonGroup, Menu, MenuItem, Navbar, NumericInput, Popover, Tooltip } from "@blueprintjs/core";
import { UndoRedoContext } from "./contexts/HistoryContext";
import { FocusedEditorContext } from "./contexts/FocusedEditorContext";
import { ReactEditor } from "slate-react";
import { isMarkActive, toggleMark } from "../slate";
import { DpiContext } from "./contexts/DpiContext";
import { exportCardImage, exportManyCardImages } from "../export";
import { ProjectContext } from "./contexts/ProjectContext";
import { card } from "../card";

export interface HeaderProps {
	activeCard: card | undefined,
	selectedCards: Set<card	>,
	saveSet: () => void,
	loadSet: () => void,
}


export function Header(props: HeaderProps) {
	const { activeCard, selectedCards, saveSet, loadSet } = props;
	const { undo, redo, can_undo, can_redo } = useContext(UndoRedoContext);
	const project = useContext(ProjectContext);
	const { viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi } = useContext(DpiContext);
	const { cachedFocusedEditor } = useContext(FocusedEditorContext);

	const exportActiveCard = useCallback(() => activeCard && exportCardImage(project, activeCard, exportDpi), [project, activeCard, exportDpi]);
	const exportAll = useCallback(async () => {
		exportManyCardImages(project, [...project.card_list.cards], exportDpi);
	}, [project, exportDpi]);
	const exportSelected = useCallback(async () => {
		exportManyCardImages(project, [...selectedCards], exportDpi);
	}, [project, exportDpi, selectedCards]);

	return (
		<Navbar id="header">
			<Navbar.Group>
				<Navbar.Heading>Cardset</Navbar.Heading>
				<Navbar.Divider/>
				<NavbarButton tooltip="Open File" icon="folder-open" minimal={true} onClick={loadSet}/>
				<NavbarButton tooltip="Save File" icon="floppy-disk" minimal={true} onClick={saveSet}/>
				<Navbar.Divider/>
				<NavbarButton tooltip="Undo" icon="undo" minimal={true} disabled={!can_undo} onClick={undo}/>
				<NavbarButton tooltip="Redo" icon="redo" minimal={true} disabled={!can_redo} onClick={redo}/>
				<Navbar.Divider/>
				<NavbarButton tooltip="Bold"   icon="bold"   minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && isMarkActive(cachedFocusedEditor, "bold"  )} onClick={useCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "bold"  ); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/>
				<NavbarButton tooltip="Italic" icon="italic" minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && isMarkActive(cachedFocusedEditor, "italic")} onClick={useCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "italic"); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/>
				<Navbar.Divider/>
				<Tooltip content="DPI" position="bottom">
					<NumericInput
						style={{ width: "7em" }}
						value={viewDpi}
						buttonPosition="none"
						rightElement={<ButtonGroup>
							<AnchorButton icon="zoom-out" minimal={true} disabled={viewDpi <=  75} onClick={useCallback(() => setViewDpi(dpi => Math.max(Math.floor(dpi/25 - 1)*25,  75) ), [setViewDpi])}/>
							<AnchorButton icon="zoom-in"  minimal={true} disabled={viewDpi >= 300} onClick={useCallback(() => setViewDpi(dpi => Math.min(Math.ceil (dpi/25 + 1)*25, 300) ), [setViewDpi])}/>
						</ButtonGroup>}
						onValueChange={setViewDpi}
					/>
				</Tooltip>
				<Navbar.Divider/>
				<ButtonGroup>
					<Popover
						content={<Menu>
							<MenuItem text="Export All" onClick={exportAll}/>
							<MenuItem text="Export Selected" disabled={selectedCards.size === 0} onClick={exportSelected}/>
							<Tooltip content="Export DPI">
								<NumericInput
									style={{ width: "170px" }}
									fill
									value={exportDpi}
									buttonPosition="none"
									disabled={lockExportDpi}
									leftElement ={<AnchorButton icon={lockExportDpi ? "lock" : "unlock"} minimal={true} onClick={useCallback(() => setLockExportDpi(old => !old), [setLockExportDpi])}/>}
									rightElement={<ButtonGroup>
										<AnchorButton icon="zoom-out" minimal={true} disabled={lockExportDpi || exportDpi <=  75} onClick={useCallback(() => setExportDpi(dpi => Math.max(Math.floor(dpi/25 - 1)*25,  75)), [setExportDpi])}/>
										<AnchorButton icon="zoom-in"  minimal={true} disabled={lockExportDpi || exportDpi >= 300} onClick={useCallback(() => setExportDpi(dpi => Math.min(Math.ceil (dpi/25 + 1)*25, 300)), [setExportDpi])}/>
									</ButtonGroup>}
									onValueChange={setExportDpi}
								/>
							</Tooltip>
						</Menu>}
						renderTarget={({ isOpen, ...popoverProps }) => (
							<Tooltip
								content="Export Active Card"
								position="bottom"
								disabled={isOpen}
								renderTarget={({ onClick, ...tooltipProps }) => (
									<ButtonGroup>
										<AnchorButton {...tooltipProps} icon="export"     minimal={true} disabled={!activeCard} onClick={useCallback<React.MouseEventHandler<HTMLElement>>(e => { onClick?.(e); exportActiveCard(); }, [onClick, exportActiveCard])}/>
										<AnchorButton {...popoverProps} icon="caret-down" minimal={true} small active={isOpen}/>
									</ButtonGroup>
								)}
							/>
						)}
					/>
				</ButtonGroup>
			</Navbar.Group>
		</Navbar>
	);
}

interface NavbarButtonProps extends AnchorButtonProps {
	tooltip: string | JSX.Element | undefined,
}

function NavbarButton(props: NavbarButtonProps) {
	const { tooltip, ...rest } = props;
	return (
		<Tooltip content={tooltip} position="bottom" renderTarget={props => <AnchorButton {...props} {...rest}/>}/>
	);
}
