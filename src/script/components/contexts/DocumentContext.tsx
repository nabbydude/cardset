import { createContext, useContext } from "react";
import { DocumentEditor, EditorWithVersion, createDocumentEditor, empty } from "../../slate";

export const DocumentContext = createContext<EditorWithVersion<DocumentEditor>>({ editor: createDocumentEditor([{ type: "Document", name: "", children: empty() }]), v: 0 });

export function useDocument(): DocumentEditor {
	const doc = useContext(DocumentContext);
	return doc.editor;
}

export function useDocumentWithV(): { doc: DocumentEditor, v: number } {
	const doc = useContext(DocumentContext);
	return { doc: doc.editor, v: doc.v };
}
