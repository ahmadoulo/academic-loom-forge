import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AcademicYearProvider } from "@/hooks/useAcademicYear";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AcademicYearProvider>
      <App />
    </AcademicYearProvider>
  </QueryClientProvider>
);
