import React, { useCallback, useContext } from "react";
import { AnchorButton, Navbar, NumericInput, Tooltip } from "@blueprintjs/core";
import { useDocument } from "./contexts/DocumentContext";
import { HistoryContext } from "./contexts/HistoryContext";
import { FocusedEditorContext } from "./contexts/FocusedEditorContext";
import { ReactEditor } from "slate-react";
import { isMarkActive, toggleMark } from "../slate";

export interface HeaderProps {
	saveActiveCardImage: () => void,
	saveSet: () => void,
	loadSet: () => void,
	dpi: number,
	setDpi: React.Dispatch<React.SetStateAction<number>>,
}


export function Header(props: HeaderProps) {
	const { saveActiveCardImage, saveSet, loadSet, dpi, setDpi } = props;
	const history = useContext(HistoryContext);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const doc = useDocument(); // FocusedEditorContext doesn't update on doc changes, so we listen to the doc directly
	const { cachedFocusedEditor } = useContext(FocusedEditorContext);
	// const text = focusedEditor ? toSingleLinePlaintext(focusedEditor.children) : "<no text>";
	return (
		<Navbar id="header">
			<Navbar.Group>
				<Navbar.Heading>Cardset</Navbar.Heading>
				<Navbar.Divider/>
				<Tooltip content="Open File"><AnchorButton icon="folder-open" minimal={true} onClick={loadSet}/></Tooltip>
				<Tooltip content="Save File"><AnchorButton icon="floppy-disk" minimal={true} onClick={saveSet}/></Tooltip>
				<Navbar.Divider/>
				<Tooltip content="Export Card Image"><AnchorButton icon="archive" minimal={true} onClick={saveActiveCardImage}/></Tooltip>
				<Navbar.Divider/>
				<Tooltip content="Undo"><AnchorButton icon="undo" minimal={true} disabled={!history.undo} onClick={history.undo}/></Tooltip>
				<Tooltip content="Redo"><AnchorButton icon="redo" minimal={true} disabled={!history.redo} onClick={history.redo}/></Tooltip>
				<Navbar.Divider/>
				<Tooltip content="Bold"  ><AnchorButton icon="bold"   minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && isMarkActive(cachedFocusedEditor, "bold"  )} onClick={useCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "bold"  ); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/></Tooltip>
				<Tooltip content="Italic"><AnchorButton icon="italic" minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && isMarkActive(cachedFocusedEditor, "italic")} onClick={useCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "italic"); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/></Tooltip>
				<Navbar.Divider/>
				
				<Tooltip content="DPI">
					<NumericInput
						style={{ width: "6em" }}
						value={dpi}
						buttonPosition="none"
						leftElement ={<AnchorButton icon="zoom-out" minimal={true} disabled={dpi <=  75} onClick={useCallback(() => setDpi(dpi => Math.max(Math.floor(dpi/25 - 1)*25,  75) ), [setDpi])}/>}
						rightElement={<AnchorButton icon="zoom-in"  minimal={true} disabled={dpi >= 300} onClick={useCallback(() => setDpi(dpi => Math.min(Math.ceil (dpi/25 + 1)*25, 300) ), [setDpi])}/>}
						onValueChange={setDpi}
					/>
				</Tooltip>
			</Navbar.Group>
		</Navbar>
	);


}
