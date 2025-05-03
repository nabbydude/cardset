import { createRoot } from "react-dom/client";
import { getApp } from "./components/App";

const rootElement = document.querySelector("#app");
const root = createRoot(rootElement!);
root.render(getApp());
