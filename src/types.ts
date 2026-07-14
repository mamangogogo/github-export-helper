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

export const MAP_LOCATIONS: { [key: string]: Location } = {
  // Shops (Pickups)
  pak_ayob: {
    id: "pak_ayob",
    name: "Rengit Coffee Original",
    type: "shop",
    x: 20,
    y: 25,
    address: "Jalan Besar, Pekan Rengit, Batu Pahat",
    phone: "019-7788991"
  },
  perabot_jati: {
    id: "perabot_jati",
    name: "Pasar Karat Rengit (Perabot & Bundle)",
    type: "shop",
    x: 35,
    y: 38,
    address: "Kawasan Lambak Pasar Karat Rengit, Johor",
    phone: "011-1020304"
  },
  pasar_raya_mesra: {
    id: "pasar_raya_mesra",
    name: "Pasar Raya Target Rengit",
    type: "shop",
    x: 55,
    y: 18,
    address: "No. 12-14, Jalan Dagang, Pekan Rengit",
    phone: "07-4241234"
  },
  jpj_sentosa: {
    id: "jpj_sentosa",
    name: "Pejabat JPJ & Pos Rengit",
    type: "shop",
    x: 82,
    y: 22,
    address: "Kompleks Kerajaan Rengit, Jalan Pontian",
    phone: "07-4245678"
  },

  // Residential/Destinations (Dropoffs)
  flat_sentosa: {
    id: "flat_sentosa",
    name: "Taman Rengit Jaya (Blok B)",
    type: "residential",
    x: 15,
    y: 75,
    address: "Tingkat 3, Blok B, Taman Rengit Jaya"
  },
  taman_indah: {
    id: "taman_indah",
    name: "Kampung Parit Tengah (No. 24)",
    type: "residential",
    x: 52,
    y: 72,
    address: "Lot 24, Jalan Parit Tengah, Rengit"
  },
  kondo_harmoni: {
    id: "kondo_harmoni",
    name: "Kampung Parit Botak (No. 15)",
    type: "residential",
    x: 85,
    y: 78,
    address: "Lot 15, Parit Botak, Rengit"
  },
  pejabat_urusan: {
    id: "pejabat_urusan",
    name: "Pusat Komuniti Pekan Rengit",
    type: "office",
    x: 42,
    y: 85,
    address: "Tingkat 1, Wisma Majlis Perbandaran Batu Pahat"
  }
};

export interface Runner {
  id: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicles?: VehicleType[]; // Senarai kenderaan yang dimiliki runner
  status: "ACTIVE" | "OFFLINE";
  stats: RunnerStats;
  password?: string;
}

