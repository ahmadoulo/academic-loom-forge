import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AcademicYearProvider } from "./hooks/useAcademicYear";

createRoot(document.getElementById("root")!).render(
  <AcademicYearProvider>
    <App />
  </AcademicYearProvider>
);
