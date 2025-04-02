import React, { useContext, useEffect } from "react";
import { Editable, ReactEditor, useSlateWithV } from "slate-react";
import { EditorWithV, FocusedEditorWriteContext } from "./contexts/FocusedEditorContext";
import { EditableProps } from "../slate";
import { useToastedCallback } from "../toaster";

export function FocusSendingEditable(props: EditableProps) {
	const { onFocus, onBlur, ...rest } = props;
	const slateWithV = useSlateWithV() as EditorWithV;
	const { setFocusedEditor, clearFocusedEditor } = useContext(FocusedEditorWriteContext);

	useEffect(() => {
		if (ReactEditor.isFocused(slateWithV.editor)) setFocusedEditor(slateWithV);
		return () => {
			if (ReactEditor.isFocused(slateWithV.editor)) clearFocusedEditor();
		};
	}, [slateWithV]);

	const newOnFocus: React.FocusEventHandler<HTMLDivElement> = useToastedCallback(e => {
		setFocusedEditor(slateWithV);
		if (onFocus) onFocus(e);
	}, [setFocusedEditor, onFocus]);

	const newOnBlur: React.FocusEventHandler<HTMLDivElement> = useToastedCallback(e => {
		setFocusedEditor(undefined);
		if (onBlur) onBlur(e);
	}, [setFocusedEditor, onBlur]);

	return <Editable onFocus={newOnFocus} onBlur={newOnBlur} {...rest}/>;
}
