import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "@/app/App";
import { AppToaster } from "@/components/shared/AppToaster";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { SmoothScrollProvider } from "@/lib/motion/SmoothScrollProvider";
import { queryClient } from "@/lib/query-client";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary label="root">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SmoothScrollProvider>
            <App />
          </SmoothScrollProvider>
          <AppToaster />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
