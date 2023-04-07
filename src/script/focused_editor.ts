import { createContext } from "react"
import { Editor } from "slate";

export const FocusedEditorContext = createContext<[Editor | null, (newEditor: Editor | null) => void]>([null, () => {}]);

const s = Slate;
export function FocusableSlate(props: typeof Slate) {

}
