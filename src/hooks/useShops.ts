import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Location } from "../types";

type ShopRow = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  logo_url: string | null;
  map_x: number;
  map_y: number;
};

function rowToLocation(row: ShopRow): Location {
  return {
    id: row.id,
    name: row.name,
    type: "shop",
    x: Number(row.map_x),
    y: Number(row.map_y),
    address: row.address,
    phone: row.phone || undefined,
    logoUrl: row.logo_url || undefined,
  };
}

export function useShops() {
  const [shops, setShops] = useState<{ [id: string]: Location }>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("id, name, address, phone, logo_url, map_x, map_y")
      .order("created_at", { ascending: true });
    if (!error && data) {
      const map: { [id: string]: Location } = {};
      for (const row of data as ShopRow[]) {
        map[row.id] = rowToLocation(row);
      }
      setShops(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Realtime subscribe
    const channel = supabase
      .channel("shops-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shops" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const addShop = async (loc: Omit<Location, "id" | "type"> & { logoFile?: File | null }) => {
    let logoUrl: string | null = loc.logoUrl || null;
    // If a logoFile is provided, upload to storage
    if (loc.logoFile) {
      const ext = loc.logoFile.name.split(".").pop() || "png";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("shop-logos")
        .upload(path, loc.logoFile, { cacheControl: "3600" });
      if (uploadErr) throw uploadErr;
      const { data: signed } = await supabase.storage
        .from("shop-logos")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
      logoUrl = signed?.signedUrl || null;
    }

    const { error } = await supabase.from("shops").insert({
      name: loc.name,
      address: loc.address,
      phone: loc.phone || null,
      logo_url: logoUrl,
      map_x: loc.x,
      map_y: loc.y,
    });
    if (error) throw error;
    await refresh();
  };

  const deleteShop = async (id: string) => {
    const { error } = await supabase.from("shops").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  };

  return { shops, loading, addShop, deleteShop, refresh };
}
