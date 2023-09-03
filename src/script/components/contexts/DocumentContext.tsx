import React, { ReactNode, createContext, useCallback, useContext, useState } from "react";
import { DocumentEditor, createDocumentEditor, empty } from "../../slate";
import { Slate } from "slate-react";

export const DocumentWithVersionContext = createContext<{ doc: DocumentEditor, v: number }>({ doc: createDocumentEditor([{ type: "Document", name: "", children: empty() }]), v: 0 });

export function useDocument(): DocumentEditor {
	const docWithVersion = useContext(DocumentWithVersionContext);
	return docWithVersion.doc;
}

export function useDocumentWithV(): { doc: DocumentEditor, v: number } {
	const docWithVersion = useContext(DocumentWithVersionContext);
	return docWithVersion;
}

export interface DocumentProviderProps {
	doc: DocumentEditor,
	children: ReactNode,
}

export function DocumentProvider(props: DocumentProviderProps) {
	const { doc } = props;
	const [docContext, setDocContext] = useState({ doc, v: 0 });

	const onChange = useCallback(() => setDocContext(old => ({ doc, v: old.v + 1 })), [setDocContext, doc]);

	return (
		<DocumentWithVersionContext.Provider value={docContext}>
			<Slate editor={doc} initialValue={doc.children} onChange={onChange}>
				{props.children}
			</Slate>
		</DocumentWithVersionContext.Provider>
	);
}
