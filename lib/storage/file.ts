import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Store, StoredMessage } from "./index";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content", "portfolio.json");
const MESSAGES = path.join(ROOT, "data", "messages.json");
const UPLOADS = path.join(ROOT, "public", "uploads");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as T; } catch { return fallback; }
}
async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** Local development store: the content JSON in the repo, messages in data/, images in public/uploads/. */
export function fileStore(): Store {
  return {
    kind: "file",
    getContent: () => readJson<unknown | null>(CONTENT, null),
    putContent: (data) => writeJson(CONTENT, data),
    async addMessage(m) {
      const list = await readJson<StoredMessage[]>(MESSAGES, []);
      list.push({ id: randomUUID(), ...m });
      await writeJson(MESSAGES, list.slice(-500));
    },
    async listMessages() {
      const list = await readJson<StoredMessage[]>(MESSAGES, []);
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async deleteMessage(id) {
      const list = await readJson<StoredMessage[]>(MESSAGES, []);
      await writeJson(MESSAGES, list.filter((m) => m.id !== id));
    },
    async upload(name, _type, bytes) {
      await fs.mkdir(UPLOADS, { recursive: true });
      await fs.writeFile(path.join(UPLOADS, name), Buffer.from(bytes));
      return "/uploads/" + name;
    },
  };
}
