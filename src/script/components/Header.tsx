import React, { useCallback, useContext } from "react";
import { AnchorButton, ButtonGroup, Menu, MenuItem, Navbar, NumericInput, Popover, Tooltip } from "@blueprintjs/core";
import { useDocument } from "./contexts/DocumentContext";
import { HistoryContext } from "./contexts/HistoryContext";
import { FocusedEditorContext } from "./contexts/FocusedEditorContext";
import { ReactEditor } from "slate-react";
import { isMarkActive, toggleMark } from "../slate";
import { DpiContext } from "./contexts/DpiContext";
import { exportCardImage, exportManyCardImages } from "../export";
import { ImageStoreContext } from "./contexts/ImageStoreContext";
import { Element } from "slate";
import { Card } from "./slate/Card";

export interface HeaderProps {
	activeId: number | undefined,
	selectedIds: Set<number>,
	saveSet: () => void,
	loadSet: () => void,
}


export function Header(props: HeaderProps) {
	const { activeId, selectedIds, saveSet, loadSet } = props;
	const history = useContext(HistoryContext);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const doc = useDocument(); // FocusedEditorContext doesn't update on doc changes, so we listen to the doc directly
	const [imageStore] = useContext(ImageStoreContext);
	const { viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi } = useContext(DpiContext);
	const { cachedFocusedEditor } = useContext(FocusedEditorContext);
	// const text = focusedEditor ? toSingleLinePlaintext(focusedEditor.children) : "<no text>";

	const exportActiveCard = useCallback(() => activeId && exportCardImage(doc, imageStore, activeId, exportDpi), [doc, imageStore, activeId, exportDpi]);
	const exportAll = useCallback(async () => {
		const entries = [...doc.nodes<Card>({ at: [], match: node => Element.isElement(node) && node.type === "Card" })];
		const ids = entries.map(([node]) => node.id);
		console.log(ids);
		exportManyCardImages(doc, imageStore, ids, exportDpi);
	}, [doc, imageStore, exportDpi]);
	const exportSelected = useCallback(async () => {
		const entries = [...doc.nodes<Card>({ at: [], match: node => Element.isElement(node) && node.type === "Card" && selectedIds.has(node.id) })];
		const ids = entries.map(([node]) => node.id);
		console.log(ids);
		exportManyCardImages(doc, imageStore, ids, exportDpi);
	}, [doc, imageStore, exportDpi, selectedIds]);
	return (
		<Navbar id="header">
			<Navbar.Group>
				<Navbar.Heading>Cardset</Navbar.Heading>
				<Navbar.Divider/>
				<Tooltip content="Open File" position="bottom"><AnchorButton icon="folder-open" minimal={true} onClick={loadSet}/></Tooltip>
				<Tooltip content="Save File" position="bottom"><AnchorButton icon="floppy-disk" minimal={true} onClick={saveSet}/></Tooltip>
				<Navbar.Divider/>
				<Tooltip content="Undo" position="bottom"><AnchorButton icon="undo" minimal={true} disabled={!history.undo} onClick={history.undo}/></Tooltip>
				<Tooltip content="Redo" position="bottom"><AnchorButton icon="redo" minimal={true} disabled={!history.redo} onClick={history.redo}/></Tooltip>
				<Navbar.Divider/>
				<Tooltip content="Bold"   position="bottom"><AnchorButton icon="bold"   minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && isMarkActive(cachedFocusedEditor, "bold"  )} onClick={useCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "bold"  ); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/></Tooltip>
				<Tooltip content="Italic" position="bottom"><AnchorButton icon="italic" minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && isMarkActive(cachedFocusedEditor, "italic")} onClick={useCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "italic"); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/></Tooltip>
				<Navbar.Divider/>
				<Tooltip content="DPI" position="bottom">
					<NumericInput
						style={{ width: "7em" }}
						value={viewDpi}
						buttonPosition="none"
						// leftElement ={<AnchorButton icon="zoom-out" minimal={true} disabled={dpi <=  75} onClick={useCallback(() => setDpi(dpi => Math.max(Math.floor(dpi/25 - 1)*25,  75) ), [setDpi])}/>}
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
							<MenuItem text="Export Selected" disabled={selectedIds.size === 0} onClick={exportSelected}/>
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
						renderTarget={({ isOpen: isPopoverOpen, ref: popoverRef, ...popoverProps }) => (
							<Tooltip
								content="Export Active Card"
								position="bottom"
								// disabled={isPopoverOpen}
								renderTarget={({ ref: tooltipRef, onClick, ...tooltipProps }) => (
									<ButtonGroup>
										<AnchorButton ref={tooltipRef} {...tooltipProps} icon="export"     minimal={true} disabled={!activeId} onClick={useCallback<React.MouseEventHandler<HTMLElement>>(e => { onClick?.(e); exportActiveCard(); }, [exportActiveCard])}/>
										<AnchorButton ref={popoverRef} {...popoverProps} icon="caret-down" minimal={true} small active={isPopoverOpen}/>
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
