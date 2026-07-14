/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrderStatus = 
  | "PENDING"              // Menunggu Runner
  | "ACCEPTED"             // Runner Diterima
  | "ARRIVED_STORE"        // Sampai Kedai
  | "DELIVERING"           // Sedang Menghantar (OTW)
  | "ARRIVED_DESTINATION"  // Sampai Destinasi
  | "COMPLETED";           // Selesai

export type OrderType = "FOOD" | "GROCERY" | "PARCEL" | "HEAVY_LIFTING" | "CLEANING" | "QUEUING" | "ODD_JOBS";

export type VehicleType = "MOTORCYCLE" | "CAR" | "PICKUP" | "LORRY";

export interface Location {
  id: string;
  name: string;
  type: "shop" | "residential" | "office";
  x: number; // Percent width of map (0 - 100)
  y: number; // Percent height of map (0 - 100)
  address: string;
  phone?: string; // Nombor telefon kedai untuk dihubungi
  logoUrl?: string; // Logo kedai (data URL / URL) - pilihan
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  completed?: boolean;
}

export interface Order {
  id: string;
  title: string;
  type: OrderType;
  vehicleType: VehicleType;
  status: OrderStatus;
  pickupLocation: Location;
  dropoffLocation: Location;
  items: OrderItem[];
  fee: number; // RM delivery fee (Upah Runner)
  totalCost: number; // Estimated items cost
  notes: string;
  customerName: string;
  customerPhone: string; // Nombor WhatsApp pelanggan
  customerAddress?: string; // Alamat penghantaran pelanggan
  runnerId?: string;
  createdAt: string;
  progressPercent: number; // 0 to 100 for path travel
}

export interface ChatMessage {
  id: string;
  sender: "runner" | "customer" | "system";
  text: string;
  timestamp: string;
}

export interface RunnerStats {
  completedDeliveries: number;
  totalEarnings: number; // RM
  activeStreak: number;
  rating: number;
  todayEarnings: number;
  level: number;
  fuelSaved: number; // Mock statistic (liters or kg CO2)
}

export const MAP_LOCATIONS: { [key: string]: Location } = {};

export interface Runner {
  id: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicles?: VehicleType[]; // Senarai kenderaan yang dimiliki runner
  status: "ACTIVE" | "OFFLINE" | "CUTI";
  stats: RunnerStats;
  password?: string;
}

