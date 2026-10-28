"use client";
import { createContext, useContext } from "react";
import type { IconMap, Portfolio } from "@/types/portfolio";

export type ThemePref = 'light' | 'dark' | 'auto';

/** Actions the Shell offers to the palette, modal and owner editor. */
export interface ShellApi {
  data: Portfolio;
  isEditor: boolean;
  openProject: (i: number) => void;
  copy: (text: string, label?: string) => void;
  toast: (msg: string) => void;
  edit: (tab?: string) => void;
  setTheme: (t: ThemePref) => void;
}

export const ShellContext = createContext<ShellApi | null>(null);
export function useShell(): ShellApi {
  const v = useContext(ShellContext);
  if (!v) throw new Error('useShell outside Shell');
  return v;
}

export const IconsContext = createContext<IconMap>({});
export const useIcons = () => useContext(IconsContext);
