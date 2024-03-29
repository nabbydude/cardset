import React, { useCallback, useContext } from "react";
import { Editable, ReactEditor, useSlate } from "slate-react";
import { FocusedEditorContext } from "./contexts/FocusedEditorContext";
import { EditableProps } from "../slate";

export function FocusSendingEditable(props: EditableProps) {
	const { onFocus, onBlur, ...rest } = props;
	const thisSlate = useSlate() as ReactEditor;
	const { setFocusedEditor, setCachedFocusedEditor } = useContext(FocusedEditorContext);

	const newOnFocus: React.FocusEventHandler<HTMLDivElement> = useCallback(e => {
		setFocusedEditor(thisSlate);
		setCachedFocusedEditor(thisSlate);
		if (onFocus) onFocus(e);
	}, [setFocusedEditor, setCachedFocusedEditor, onFocus]);
	const newOnBlur: React.FocusEventHandler<HTMLDivElement> = useCallback(e => {
		setFocusedEditor(undefined);
		if (onBlur) onBlur(e);
	}, [setFocusedEditor, onBlur]);

	return <Editable onFocus={newOnFocus} onBlur={newOnBlur} {...rest}/>;
}
