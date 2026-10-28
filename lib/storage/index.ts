import "server-only";
import type { ContactMessage, Portfolio } from "@/types/portfolio";
import { fileStore } from "./file";
import { supabaseStore } from "./supabase";

export interface StoredMessage extends ContactMessage { id: string }

export interface Store {
  kind: "supabase" | "file";
  getContent(): Promise<unknown | null>;
  putContent(data: Portfolio): Promise<void>;
  addMessage(m: ContactMessage): Promise<void>;
  listMessages(): Promise<StoredMessage[]>;
  deleteMessage(id: string): Promise<void>;
  /** Saves an image and returns its public URL. */
  upload(name: string, type: string, bytes: ArrayBuffer): Promise<string>;
}

/** Supabase when its keys are set (production), local files otherwise (development). */
export function store(): Store {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseStore() : fileStore();
}
