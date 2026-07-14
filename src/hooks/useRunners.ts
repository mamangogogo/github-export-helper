import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Runner, VehicleType } from "../types";

type RunnerRow = {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicles: string[];
  status: string;
  completed_deliveries: number;
  total_earnings: number;
  today_earnings: number;
  active_streak: number;
  rating: number;
  level: number;
  fuel_saved: number;
};

function rowToRunner(row: RunnerRow): Runner {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    vehicleType: row.vehicle_type as VehicleType,
    vehicles: (row.vehicles as VehicleType[]) || [row.vehicle_type as VehicleType],
    status: (row.status as "ACTIVE" | "OFFLINE") || "ACTIVE",
    stats: {
      completedDeliveries: row.completed_deliveries,
      totalEarnings: Number(row.total_earnings),
      todayEarnings: Number(row.today_earnings),
      activeStreak: row.active_streak,
      rating: Number(row.rating),
      level: row.level,
      fuelSaved: Number(row.fuel_saved),
    },
  };
}

export function useRunners() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("runners")
      .select(
        "id, user_id, name, phone, vehicle_type, vehicles, status, completed_deliveries, total_earnings, today_earnings, active_streak, rating, level, fuel_saved"
      )
      .order("created_at", { ascending: true });
    if (!error && data) {
      setRunners((data as RunnerRow[]).map(rowToRunner));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("runners-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "runners" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const addRunner = async (r: Omit<Runner, "id" | "stats">) => {
    const { error } = await supabase.from("runners").insert({
      name: r.name,
      phone: r.phone,
      vehicle_type: r.vehicleType,
      vehicles: r.vehicles || [r.vehicleType],
      status: r.status || "ACTIVE",
    });
    if (error) throw error;
    await refresh();
  };

  const deleteRunner = async (id: string) => {
    const { error } = await supabase.from("runners").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const updateRunnerVehicles = async (id: string, vehicles: VehicleType[]) => {
    const { error } = await supabase
      .from("runners")
      .update({ vehicles: vehicles as string[] })
      .eq("id", id);
    if (error) throw error;
    await refresh();
  };

  return { runners, loading, addRunner, deleteRunner, updateRunnerVehicles, refresh };
}
