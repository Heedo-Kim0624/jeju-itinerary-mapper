
// src/App.tsx (이 행 삭제 금지)
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { MapProvider } from "@/components/rightpanel/MapContext";
import { PlaceProvider } from "@/contexts/PlaceContext"; // Import PlaceProvider
import { GeoJsonProvider } from './contexts/GeoJsonContext'; // Import GeoJsonProvider

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PlaceProvider> {/* Wrap with PlaceProvider */}
        <TooltipProvider>
          <GeoJsonProvider> {/* Wrap with GeoJsonProvider */}
            <MapProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </MapProvider>
          </GeoJsonProvider>
        </TooltipProvider>
      </PlaceProvider>
    </QueryClientProvider>
  );
};

export default App;
