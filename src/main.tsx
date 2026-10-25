
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./amida/amida_index.css";
import Home from "./home";
import AmidaIndex from "./amida/amida_index";

const path = window.location.pathname.replace(/\/+$/, "") || "/";

const page =
  path === "/amidaparty" ? <AmidaIndex /> : <Home />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>{page}</StrictMode>,
);
