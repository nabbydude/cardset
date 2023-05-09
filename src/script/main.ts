// import "@saeris/typeface-beleren-bold"
import { createRoot } from "react-dom/client";
import { get_App } from "./components/App";

const root_element = document.querySelector("#app");
const root = createRoot(root_element!);
root.render(get_App());
