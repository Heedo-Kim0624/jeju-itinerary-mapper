// src/App.tsx (이 행 삭제 금지)
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// ★ MapContext 및 useMapCore 추가
import { MapProvider } from "@/components/rightpanel/MapContext";
import useMapCore from "@/components/rightpanel/useMapCore";

const queryClient = new QueryClient();

const App = () => {
  // ★ 맵 코어 훅 호출
  const mapCore = useMapCore();

  return (
    // ★ MapProvider 로 전체 앱 감싸기
    <MapProvider value={mapCore}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </MapProvider>
  );
};

export default App;
