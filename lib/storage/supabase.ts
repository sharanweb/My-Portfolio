import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Store } from "./index";

const BUCKET = process.env.SUPABASE_BUCKET || "portfolio";
let client: SupabaseClient | null = null;

function db() {
  if (!client) client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  return client;
}

/** Production store. Tables and bucket are created by supabase/schema.sql. Uses the service role key, server-side only. */
export function supabaseStore(): Store {
  return {
    kind: "supabase",
    async getContent() {
      const { data, error } = await db().from("portfolio_content").select("data").eq("id", "main").maybeSingle();
      if (error) throw error;
      return data ? data.data : null;
    },
    async putContent(content) {
      const { error } = await db().from("portfolio_content").upsert({ id: "main", data: content, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    async addMessage(m) {
      const { error } = await db().from("messages").insert({ name: m.name, email: m.email, topic: m.topic, text: m.text, created_at: m.createdAt });
      if (error) throw error;
    },
    async listMessages() {
      const { data, error } = await db().from("messages").select("id,name,email,topic,text,created_at").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data || []).map((r) => ({ id: String(r.id), name: r.name, email: r.email, topic: r.topic, text: r.text, createdAt: r.created_at }));
    },
    async deleteMessage(id) {
      const { error } = await db().from("messages").delete().eq("id", id);
      if (error) throw error;
    },
    async upload(name, type, bytes) {
      const { error } = await db().storage.from(BUCKET).upload(name, bytes, { contentType: type, upsert: false });
      if (error) throw error;
      return db().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
    },
  };
}
