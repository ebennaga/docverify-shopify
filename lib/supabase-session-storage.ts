import { Session } from "@shopify/shopify-api";
import { db } from "./supabase";

// Definisikan interface sendiri — tidak perlu import dari Shopify
interface SessionStorage {
  storeSession(session: Session): Promise<boolean>;
  loadSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  deleteSessions(ids: string[]): Promise<boolean>;
  findSessionsByShop(shop: string): Promise<Session[]>;
}

export class SupabaseSessionStorage implements SessionStorage {
  async storeSession(session: Session): Promise<boolean> {
    try {
      const { error } = await db.from("Session").upsert({
        id: session.id,
        shop: session.shop,
        state: session.state,
        access_token: session.accessToken,
        is_online: session.isOnline,
        expires_at: session.expires
          ? new Date(session.expires).toISOString()
          : null,
      });
      return !error;
    } catch {
      return false;
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const { data, error } = await db
        .from("Session")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return undefined;

      const session = new Session({
        id: data.id,
        shop: data.shop,
        state: data.state ?? "",
        isOnline: data.is_online,
      });
      session.accessToken = data.access_token ?? undefined;
      if (data.expires_at) session.expires = new Date(data.expires_at);

      return session;
    } catch {
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const { error } = await db.from("Session").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      const { error } = await db.from("Session").delete().in("id", ids);
      return !error;
    } catch {
      return false;
    }
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    try {
      const { data, error } = await db
        .from("Session")
        .select("*")
        .eq("shop", shop);

      if (error || !data) return [];

      return data.map((row) => {
        const session = new Session({
          id: row.id,
          shop: row.shop,
          state: row.state ?? "",
          isOnline: row.is_online,
        });
        session.accessToken = row.access_token ?? undefined;
        if (row.expires_at) session.expires = new Date(row.expires_at);
        return session;
      });
    } catch {
      return [];
    }
  }
}
