import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { isAdmin, passwordConfigured } from "@/lib/auth";
import { ALL_ICONS, loadContent } from "@/lib/content";
import { Login } from "@/components/admin/Login";

// The editor is only loaded here, never on the public page.
const AdminApp = dynamic(() => import("@/components/admin/AdminApp").then((m) => m.AdminApp));


export const metadata: Metadata = { title: "Edit portfolio", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <Login configured={passwordConfigured()} />;
  return <AdminApp initial={await loadContent()} icons={ALL_ICONS} />;
}
