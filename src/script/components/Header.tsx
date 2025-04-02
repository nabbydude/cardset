import { AnchorButton, AnchorButtonProps, ButtonGroup, Menu, MenuItem, Navbar, NumericInput, Popover, Tooltip } from "@blueprintjs/core";
import React, { SyntheticEvent, useContext } from "react";
import { card } from "../card";
import { exportCardImage, exportManyCardImages } from "../export";
import { toggleMark } from "../slate";
import { useToastedCallback } from "../toaster";
import { DpiContext } from "./contexts/DpiContext";
import { FocusedEditorReadContext } from "./contexts/FocusedEditorContext";
import { UndoRedoContext } from "./contexts/HistoryContext";
import { ProjectContext } from "./contexts/ProjectContext";

export interface HeaderProps {
	activeCard: card | undefined,
	selectedCards: Set<card	>,
	saveSet: () => void,
	loadSet: () => void,
}

function preventDefault(e: SyntheticEvent) { e.preventDefault(); }

export function Header(props: HeaderProps) {
	const { activeCard, selectedCards, saveSet, loadSet } = props;
	const { undo, redo, can_undo, can_redo } = useContext(UndoRedoContext);
	const project = useContext(ProjectContext);
	const { viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi } = useContext(DpiContext);
	const { cachedFocusedEditor } = useContext(FocusedEditorReadContext);

	const exportActiveCard = useToastedCallback(() => activeCard && exportCardImage(project, activeCard, exportDpi), [project, activeCard, exportDpi]);
	const exportAll = useToastedCallback(async () => {
		exportManyCardImages(project, [...project.card_list.cards], exportDpi);
	}, [project, exportDpi]);
	const exportSelected = useToastedCallback(async () => {
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
				<NavbarButton tooltip="Bold"   icon="bold"   minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor?.getMarks()?.bold  } onMouseDown={preventDefault} onClick={useToastedCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "bold"  ); } }, [cachedFocusedEditor])}/>
				<NavbarButton tooltip="Italic" icon="italic" minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor?.getMarks()?.italic} onMouseDown={preventDefault} onClick={useToastedCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "italic"); } }, [cachedFocusedEditor])}/>
				<Navbar.Divider/>
				<Tooltip content="DPI" position="bottom">
					<NumericInput
						style={{ width: "7em" }}
						value={viewDpi}
						buttonPosition="none"
						rightElement={<ButtonGroup>
							<AnchorButton icon="zoom-out" minimal={true} disabled={viewDpi <=  75} onClick={useToastedCallback(() => setViewDpi(dpi => Math.max(Math.floor(dpi/25 - 1)*25,  75) ), [setViewDpi])}/>
							<AnchorButton icon="zoom-in"  minimal={true} disabled={viewDpi >= 300} onClick={useToastedCallback(() => setViewDpi(dpi => Math.min(Math.ceil (dpi/25 + 1)*25, 300) ), [setViewDpi])}/>
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
									leftElement ={<AnchorButton icon={lockExportDpi ? "lock" : "unlock"} minimal={true} onClick={useToastedCallback(() => setLockExportDpi(old => !old), [setLockExportDpi])}/>}
									rightElement={<ButtonGroup>
										<AnchorButton icon="zoom-out" minimal={true} disabled={lockExportDpi || exportDpi <=  75} onClick={useToastedCallback(() => setExportDpi(dpi => Math.max(Math.floor(dpi/25 - 1)*25,  75)), [setExportDpi])}/>
										<AnchorButton icon="zoom-in"  minimal={true} disabled={lockExportDpi || exportDpi >= 300} onClick={useToastedCallback(() => setExportDpi(dpi => Math.min(Math.ceil (dpi/25 + 1)*25, 300)), [setExportDpi])}/>
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
								renderTarget={({ onClick, isOpen: _, ...tooltipProps }) => (
									<ButtonGroup>
										<AnchorButton {...tooltipProps} icon="export"     minimal={true} disabled={!activeCard} onClick={useToastedCallback<React.MouseEventHandler<HTMLElement>>(e => { onClick?.(e); exportActiveCard(); }, [onClick, exportActiveCard])}/>
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
		<Tooltip content={tooltip} position="bottom" renderTarget={({isOpen: _, ...props}) => <AnchorButton {...props} {...rest}/>}/>
	);
}
