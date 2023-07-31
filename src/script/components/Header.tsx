import React, { useCallback, useContext } from "react";
import { Button, Navbar, NumericInput } from "@blueprintjs/core";
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
				<Button icon="folder-open" minimal={true} onClick={loadSet}/>
				<Button icon="floppy-disk" minimal={true} onClick={saveSet}/>
				<Navbar.Divider/>
				<Button icon="archive" minimal={true} onClick={saveActiveCardImage}/>
				<Navbar.Divider/>
				<Button icon="undo" minimal={true} disabled={!history.undo} onClick={history.undo}/>
				<Button icon="redo" minimal={true} disabled={!history.redo} onClick={history.redo}/>
				<Navbar.Divider/>
				<Button icon="bold"   minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && isMarkActive(cachedFocusedEditor, "bold"  )} onClick={useCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "bold"  ); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/>
				<Button icon="italic" minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && isMarkActive(cachedFocusedEditor, "italic")} onClick={useCallback(() => { if (cachedFocusedEditor) { toggleMark(cachedFocusedEditor, "italic"); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/>
				<Navbar.Divider/>
				<NumericInput
					style={{ width: "6em" }}
					value={dpi}
					buttonPosition="none"
					leftElement ={<Button icon="zoom-out" minimal={true} disabled={dpi <=  75} onClick={useCallback(() => setDpi(dpi => Math.max(Math.floor(dpi/25 - 1)*25,  75) ), [setDpi])}/>}
					rightElement={<Button icon="zoom-in"  minimal={true} disabled={dpi >= 300} onClick={useCallback(() => setDpi(dpi => Math.min(Math.ceil (dpi/25 + 1)*25, 300) ), [setDpi])}/>}
					
					onValueChange={setDpi}
				/>
			</Navbar.Group>
		</Navbar>
	);


}
