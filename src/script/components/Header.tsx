import React, { useCallback, useContext } from "react";
import { Button, Navbar } from "@blueprintjs/core";
import { useDocument } from "./contexts/DocumentContext";
import { HistoryContext } from "./contexts/HistoryContext";
import { FocusedEditorContext } from "./contexts/FocusedEditorContext";
import { CustomEditor } from "../slate";
import { ReactEditor } from "slate-react";

export interface HeaderProps {
	saveActiveCardImage: () => void,
	saveSet: () => void,
	loadSet: () => void,
}


export function Header(props: HeaderProps) {
	const { saveActiveCardImage, saveSet, loadSet } = props;
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
				<Button icon="bold"   minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && CustomEditor.isBoldMarkActive  (cachedFocusedEditor)} onClick={useCallback(() => { if (cachedFocusedEditor) { CustomEditor.toggleBoldMark  (cachedFocusedEditor); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/>
				<Button icon="italic" minimal={true} disabled={!cachedFocusedEditor} active={cachedFocusedEditor && CustomEditor.isItalicMarkActive(cachedFocusedEditor)} onClick={useCallback(() => { if (cachedFocusedEditor) { CustomEditor.toggleItalicMark(cachedFocusedEditor); ReactEditor.toDOMNode(cachedFocusedEditor, cachedFocusedEditor).focus(); } }, [cachedFocusedEditor])}/>
			</Navbar.Group>
		</Navbar>
	);


}
