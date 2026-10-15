"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { TourOverlay } from "@/components/tour/tour-overlay";

type TourContextValue = {
  startTour: () => void;
  isActive: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

const STORAGE_KEY = "jit-iam-portal-tour-seen";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  // Auto-start on first visit to the dashboard.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay so the page has a chance to render before the tour
      // starts pointing at elements.
      const handle = setTimeout(() => setIsActive(true), 800);
      return () => clearTimeout(handle);
    }
  }, []);

  const startTour = useCallback(() => {
    setIsActive(true);
  }, []);

  const finishTour = useCallback(() => {
    setIsActive(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({ startTour, isActive }),
    [startTour, isActive],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay
        active={isActive}
        onFinish={finishTour}
        onSkip={skipTour}
      />
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used inside TourProvider");
  }
  return ctx;
}