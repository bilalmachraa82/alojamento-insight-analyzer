/**
 * LoadingSpinner Component
 *
 * Performance Optimization: Used as Suspense fallback for lazy-loaded routes
 * Lightweight component that minimizes initial bundle size
 */

import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-brand-pink mb-4" />
      <p className="text-lg text-center">Carregando...</p>
    </div>
  );
};

export default LoadingSpinner;
