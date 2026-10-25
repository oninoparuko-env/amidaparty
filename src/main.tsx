
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./amida/amida_index.css";
import Home from "./home";
import AmidaIndex from "./amida/amida_index";
import Schedule from "./schedule/Schedule";

const path = window.location.pathname.replace(/\/+$/, "") || "/";

const page =
  path === "/amidaparty" ? (
    <AmidaIndex />
  ) : path === "/schedule" ? (
    <Schedule />
  ) : (
    <Home />
  );

createRoot(document.getElementById("root")!).render(
  <StrictMode>{page}</StrictMode>,
);
