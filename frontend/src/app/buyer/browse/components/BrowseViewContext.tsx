"use client";

import { createContext } from "react";

export type BrowseViewType = "grid" | "calendar";

export const BrowseViewContext = createContext<{
  view: BrowseViewType;
  setView: (view: BrowseViewType) => void;
}>({ view: "grid", setView: () => {} });
