/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Order, OrderStatus, OrderType, VehicleType, Location, Runner } from "../types";
import { 
  ShieldAlert, Database, Trash2, Edit2, Play, RefreshCw, PlusCircle, 
  TrendingUp, Users, DollarSign, Layers, Sun, CloudRain, Zap, Check, AlertCircle, Sparkles,
  Store, Bike, MapPin, Phone, Lock, LogIn, LogOut, Key, Shield, Truck
} from "lucide-react";

interface AdminPanelProps {
  orders: Order[];
  weather: "sunny" | "rainy";
  demandLevel: "normal" | "high" | "peak";
  onChangeWeather: (weather: "sunny" | "rainy") => void;
  onChangeDemandLevel: (level: "normal" | "high" | "peak") => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateOrderFee: (orderId: string, fee: number) => void;
  onCancelOrder: (orderId: string) => void;
  onResetPlatformData: () => void;
  onInjectDemoOrder: () => void;
  onBroadcastSystemMessage: (text: string) => void;
  locations: { [key: string]: Location };
  onRegisterLocation: (location: Location) => void;
  onDeleteLocation: (id: string) => void;
  runners: Runner[];
  onRegisterRunner: (runner: Runner) => void;
  onDeleteRunner: (id: string) => void;
  onUpdateRunnerVehicles?: (runnerId: string, vehicles: VehicleType[]) => void;
  minFee: number;
  onChangeMinFee: (fee: number) => void;
  commissionRate: number;
  onChangeCommissionRate: (rate: number) => void;
  adminRevenue: number;
  baseFees: {
    MOTORCYCLE: { normal: number; rainy: number };
    CAR: { normal: number; rainy: number };
    PICKUP: { normal: number; rainy: number };
    LORRY: { normal: number; rainy: number };
  };
  onChangeBaseFees: (fees: {
    MOTORCYCLE: { normal: number; rainy: number };
    CAR: { normal: number; rainy: number };
    PICKUP: { normal: number; rainy: number };
    LORRY: { normal: number; rainy: number };
  }) => void;
}

export default function AdminPanel({
  orders,
  weather,
  demandLevel,
  onChangeWeather,
  onChangeDemandLevel,
  onUpdateOrderStatus,
  onUpdateOrderFee,
  onCancelOrder,
  onResetPlatformData,
  onInjectDemoOrder,
  onBroadcastSystemMessage,
  locations,
  onRegisterLocation,
  onDeleteLocation,
  runners,
  onRegisterRunner,
  onDeleteRunner,
  onUpdateRunnerVehicles,
  minFee,
  onChangeMinFee,
  commissionRate,
  onChangeCommissionRate,
  adminRevenue,
  baseFees,
  onChangeBaseFees,
}: AdminPanelProps) {

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editFeeValue, setEditFeeValue] = useState<string>("");
  const [broadcastText, setBroadcastText] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Deletion confirmation state
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  // Shop state form
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopType, setShopType] = useState<"shop" | "residential" | "office">("shop");
  const [shopLogoUrl, setShopLogoUrl] = useState<string>("");

  const handleShopLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Sila pilih fail imej sahaja (PNG / JPG).");
      return;
    }
    if (file.size > 500 * 1024) {
      alert("Saiz logo terlalu besar. Sila pilih imej di bawah 500KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setShopLogoUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  // Runner state form
  const [runnerName, setRunnerName] = useState("");
  const [runnerPhone, setRunnerPhone] = useState("");
  const [runnerPassword, setRunnerPassword] = useState("");
  const [runnerVehicle, setRunnerVehicle] = useState<VehicleType>("MOTORCYCLE");
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleType[]>(["MOTORCYCLE"]);
  const [runnerStatus, setRunnerStatus] = useState<"ACTIVE" | "OFFLINE">("ACTIVE");

  const handleRegisterShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !shopAddress.trim()) return;

    // Generate unique ID based on name
    const shopId = "custom_" + shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString().slice(-4);
    
    // Generate random coordinates for placement on the Map dashboard
    const randomX = Math.floor(Math.random() * 70) + 15;
    const randomY = Math.floor(Math.random() * 70) + 15;

    const newLoc: Location = {
      id: shopId,
      name: shopName.trim(),
      type: shopType,
      x: randomX,
      y: randomY,
      address: shopAddress.trim(),
      phone: shopPhone.trim() || undefined,
      logoUrl: shopLogoUrl || undefined,
    };

    onRegisterLocation(newLoc);
    
    // Reset Form
    setShopName("");
    setShopAddress("");
    setShopPhone("");
    setShopType("shop");
    setShopLogoUrl("");
  };

  const handleRegisterRunner = (e: React.FormEvent) => {
     e.preventDefault();
     if (!runnerName.trim() || !runnerPhone.trim()) return;
 
     const runnerId = "runner_custom_" + Date.now().toString();
     const newRunner: Runner = {
       id: runnerId,
       name: runnerName.trim(),
       phone: runnerPhone.trim(),
       vehicleType: runnerVehicle,
       vehicles: selectedVehicles.length > 0 ? selectedVehicles : [runnerVehicle],
       status: runnerStatus,
       password: runnerPassword.trim() || "123456",
       stats: {
         completedDeliveries: 0,
         totalEarnings: 0,
         activeStreak: 0,
         rating: 5.0,
         todayEarnings: 0,
         level: 1,
         fuelSaved: 0,
       }
     };
 
     onRegisterRunner(newRunner);
 
     // Reset Form
     setRunnerName("");
     setRunnerPhone("");
     setRunnerPassword("");
     setRunnerVehicle("MOTORCYCLE");
     setSelectedVehicles(["MOTORCYCLE"]);
     setRunnerStatus("ACTIVE");
   };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (filterStatus === "ALL") return true;
    return o.status === filterStatus;
  });

  // Calculate high-level platform statistics
  const totalOrders = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === "PENDING").length;
  const activeOrdersCount = orders.filter(o => o.status !== "PENDING" && o.status !== "COMPLETED").length;
  const completedOrdersCount = orders.filter(o => o.status === "COMPLETED").length;
  const totalEarningsCollected = orders.reduce((acc, curr) => acc + curr.fee, 0);
  const avgDeliveryFee = totalOrders > 0 ? (totalEarningsCollected / totalOrders).toFixed(2) : "0.00";

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "ACCEPTED": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ARRIVED_STORE": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "DELIVERING": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "ARRIVED_DESTINATION": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "COMPLETED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  const getOrderTypeMalay = (type: OrderType) => {
    switch (type) {
      case "FOOD": return "Makanan";
      case "GROCERY": return "Runcit";
      case "PARCEL": return "Parcel";
      case "HEAVY_LIFTING": return "Angkat Barang";
      case "CLEANING": return "Pembersihan";
      case "QUEUING": return "Tolong Beratur";
      case "ODD_JOBS": return "Lain-lain";
    }
  };

  const handleStartEditFee = (order: Order) => {
    setEditingOrderId(order.id);
    setEditFeeValue(order.fee.toString());
  };

  const handleSaveFee = (orderId: string) => {
    const feeNum = parseFloat(editFeeValue);
    if (!isNaN(feeNum) && feeNum >= 0) {
      onUpdateOrderFee(orderId, feeNum);
      setEditingOrderId(null);
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (broadcastText.trim()) {
      onBroadcastSystemMessage(broadcastText.trim());
      setBroadcastText("");
    }
  };

  return (
    <div id="admin-panel-container" className="flex flex-col gap-6 w-full">
      
      <>


          {/* SECTION 1: Metrics Cards */}
          <div id="admin-metrics-grid" className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div id="metric-card-total" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Jumlah Job</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-white">{totalOrders}</p>
            <p className="text-[10px] text-slate-400 mt-1">Dipos sejak sesi bermula</p>
          </div>
        </div>

        <div id="metric-card-pending" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Menunggu</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-amber-400">{pendingOrdersCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">Runner belum terima</p>
          </div>
        </div>

        <div id="metric-card-active" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Dalam Proses</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-sky-400">{activeOrdersCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">Runner sedang hantar</p>
          </div>
        </div>

        <div id="metric-card-volume" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Upah Purata</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-emerald-400">RM {avgDeliveryFee}</p>
            <p className="text-[10px] text-slate-400 mt-1">Kasar: RM {totalEarningsCollected.toFixed(2)}</p>
          </div>
        </div>

        <div id="metric-card-admin-revenue" className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl flex flex-col justify-between ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-400">Gaji Admin (Owner)</span>
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-black text-emerald-400">RM {adminRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Dari komisen {commissionRate}%</p>
          </div>
        </div>

      </div>

      {/* SECTION 2: Simulated Town Controls & Bulk Commands */}
      <div id="admin-controls-grid" className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Environment Configuration */}
        <div id="town-env-config" className="md:col-span-7 bg-slate-900 border border-slate-850 p-5 rounded-3xl flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-2">
            <Database className="w-4 h-4" />
            Kawalan Simulasi & Alam Sekitar Rengit
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* Weather Selection */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Keadaan Cuaca Semasa</span>
              <div className="flex gap-2 mt-2.5">
                <button
                  id="weather-btn-sunny"
                  type="button"
                  onClick={() => onChangeWeather("sunny")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    weather === "sunny"
                      ? "bg-amber-600/20 border-amber-500/40 text-amber-400"
                      : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Cerah</span>
                </button>
                <button
                  id="weather-btn-rainy"
                  type="button"
                  onClick={() => onChangeWeather("rainy")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    weather === "rainy"
                      ? "bg-sky-600/20 border-sky-500/40 text-sky-400"
                      : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>Hujan Lebat</span>
                </button>
              </div>
            </div>

            {/* Demand Intensity Selector */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Kepadatan Permintaan</span>
              <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                {(["normal", "high", "peak"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    id={`demand-btn-${lvl}`}
                    type="button"
                    onClick={() => onChangeDemandLevel(lvl)}
                    className={`py-2 text-[10px] font-bold rounded-lg border text-center uppercase transition-all cursor-pointer ${
                      demandLevel === lvl
                        ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-400"
                        : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Tetapan Kewangan Platform */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/20 col-span-1 sm:col-span-2 shadow-inner space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                  Tetapan Kewangan (Gaji Owner & Upah Minimum)
                </span>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Upah Minimum Runner</span>
                      <span className="text-[8px] text-indigo-400 font-bold">Wajib</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-500">RM</span>
                      <input
                        type="number"
                        min="2"
                        max="30"
                        step="0.5"
                        value={minFee}
                        onChange={(e) => onChangeMinFee(Math.max(2, parseFloat(e.target.value) || 2))}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Komisen Platform</span>
                      <span className="text-[8px] text-emerald-400 font-bold">Gaji Owner</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="1"
                        value={commissionRate}
                        onChange={(e) => onChangeCommissionRate(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-3.5 pr-8 py-2 text-xs font-bold text-white outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-900/60 my-2" />

              {/* Harga Upah Ramalan Kenderaan */}
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono flex items-center gap-1.5 mb-2">
                  <Truck className="w-3.5 h-3.5 text-indigo-400" />
                  Syor Upah Ramalan Kenderaan (Normal vs Hujan)
                </span>

                <div className="space-y-2.5">
                  {(["MOTORCYCLE", "CAR", "PICKUP", "LORRY"] as const).map((vType) => {
                    const vehicleLabels: Record<string, string> = {
                      MOTORCYCLE: "Motosikal 🏍️",
                      CAR: "Kereta 🚗",
                      PICKUP: "Pikap/4x4 🛻",
                      LORRY: "Lori 🚚",
                    };
                    return (
                      <div key={vType} className="bg-slate-900/60 border border-slate-900 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-300">{vehicleLabels[vType]}</span>
                        <div className="flex gap-2">
                          <div className="relative flex-1 sm:w-28">
                            <span className="absolute left-2.5 top-1.5 text-[9px] text-slate-500 font-bold">Normal:</span>
                            <input
                              type="number"
                              min="2"
                              max="150"
                              step="0.5"
                              value={baseFees[vType].normal}
                              onChange={(e) => {
                                const val = Math.max(2, parseFloat(e.target.value) || 2);
                                onChangeBaseFees({
                                  ...baseFees,
                                  [vType]: { ...baseFees[vType], normal: val }
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-14 pr-2 py-1 text-xs font-bold text-white outline-none focus:border-indigo-500 text-right"
                            />
                          </div>
                          <div className="relative flex-1 sm:w-28">
                            <span className="absolute left-2.5 top-1.5 text-[9px] text-blue-500 font-bold">Hujan:</span>
                            <input
                              type="number"
                              min="2"
                              max="200"
                              step="0.5"
                              value={baseFees[vType].rainy}
                              onChange={(e) => {
                                const val = Math.max(2, parseFloat(e.target.value) || 2);
                                onChangeBaseFees({
                                  ...baseFees,
                                  [vType]: { ...baseFees[vType], rainy: val }
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-12 pr-2 py-1 text-xs font-bold text-blue-400 outline-none focus:border-indigo-500 text-right"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 bg-indigo-950/20 border border-indigo-900/30 p-2.5 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                📢 <span className="font-semibold text-slate-300">Bagaimana Owner/Platform dapat gaji?</span> Platform akan mengecas komisen sebanyak <span className="text-emerald-400 font-bold font-mono">{commissionRate}%</span> bagi setiap tugasan yang disiapkan oleh runner. Sebagai contoh, jika upah runner RM10.00, platform mendapat <span className="text-emerald-400 font-bold font-mono">RM {(10 * commissionRate / 100).toFixed(2)}</span> manakala runner menerima baki bersih <span className="text-indigo-300 font-bold font-mono">RM {(10 - (10 * commissionRate / 100)).toFixed(2)}</span>.
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-850 mt-1">
            <span className="font-bold text-white">Kesan Simulasi:</span> Apabila hujan lebat diaktifkan, system Rengit Runner akan secara dinamik menaikkan syor upah tip permulaan di borang tempahan pelanggan untuk menjaga keselamatan kebajikan runner bermotor.
          </div>
        </div>

        {/* Global Action Triggers */}
        <div id="global-bulk-actions" className="md:col-span-5 bg-slate-900 border border-slate-850 p-5 rounded-3xl flex flex-col gap-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Aksi Pusat & Pintasan
          </h3>

          <div className="flex flex-col gap-2.5 mt-1.5">
            <button
              id="admin-btn-inject"
              type="button"
              onClick={onInjectDemoOrder}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-white rounded-xl flex items-center justify-between transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2 text-slate-300 group-hover:text-white">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Tambah Tempahan Demo Rawak
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded">
                +1 Job
              </span>
            </button>

            <button
              id="admin-btn-reset"
              type="button"
              onClick={onResetPlatformData}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/50 text-xs font-bold text-slate-300 hover:text-red-300 rounded-xl flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-red-400" />
                Set Semula Data Platform
              </span>
              <span className="text-[9px] text-slate-500">Mula Asal</span>
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 3: System Broadcast Portal */}
      <div id="system-broadcast-card" className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 font-mono flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4" />
          Penyiar Sistem (System Message Broadcast)
        </h3>
        
        <form onSubmit={handleSendBroadcast} className="flex flex-col sm:flex-row gap-3">
          <input
            id="broadcast-msg-input"
            type="text"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Taip pesanan amaran/pengumuman rasmi admin ke semua chatbox pelanggan & runner..."
            className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
          <button
            id="broadcast-submit-btn"
            type="submit"
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-rose-600/10"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Siarkan Mesej</span>
          </button>
        </form>
        <p className="text-[10px] text-slate-500 font-mono mt-2">
          *Mesej akan ditambahkan secara rasmi sebagai log sistem di semua ruang sembang pesanan aktif.
        </p>
      </div>

      {/* SECTION 4: Comprehensive Order Management Grid */}
      <div id="admin-order-manager" className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-white">Senarai Kawalan Tempahan (Order Operations)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Sunting harga upah, kemaskini status atau batalkan terus tempahan</p>
          </div>

          {/* Table Filters */}
          <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl self-start sm:self-auto">
            {["ALL", "PENDING", "ACCEPTED", "DELIVERING", "COMPLETED"].map((st) => (
              <button
                key={st}
                id={`filter-btn-${st}`}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  filterStatus === st
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {st === "ALL" ? "Semua" : st}
              </button>
            ))}
          </div>
        </div>

        {/* The Orders Table / Mobile List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-mono">
            Tiada tempahan ditemui padanan dengan penapis "{filterStatus}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono">
                  <th className="py-3 px-4">Maklumat Tempahan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Runner ID</th>
                  <th className="py-3 px-4 text-right">Kos / Upah</th>
                  <th className="py-3 px-4 text-center">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-950/20 transition-colors">
                    
                    {/* Column 1: Core Info */}
                    <td className="py-3 px-4 max-w-[260px]">
                      <p className="font-bold text-white truncate">{o.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                        <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono text-[9px] text-slate-400">
                          #{o.id.slice(0, 8)}
                        </span>
                        <span>•</span>
                        <span>{getOrderTypeMalay(o.type)}</span>
                        <span>•</span>
                        <span className="text-slate-500">{o.customerName}</span>
                      </div>
                    </td>

                    {/* Column 2: Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 text-[9px] font-bold rounded-full border ${getStatusBadgeColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>

                    {/* Column 3: Assigned Runner */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {o.runnerId ? (
                        <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                          {o.runnerId}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Belum Diambil</span>
                      )}
                    </td>

                    {/* Column 4: Delivery Fees / Item costs */}
                    <td className="py-3 px-4 text-right">
                      {editingOrderId === o.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-slate-500 text-[10px]">RM</span>
                          <input
                            type="text"
                            value={editFeeValue}
                            onChange={(e) => setEditFeeValue(e.target.value)}
                            className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveFee(o.id)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-white font-mono">RM {o.fee.toFixed(2)}</p>
                          <p className="text-[9px] text-slate-500">Anggaran barang: RM {o.totalCost.toFixed(2)}</p>
                        </div>
                      )}
                    </td>

                    {/* Column 5: Admin Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Status update shortcuts depending on current status */}
                        {o.status === "PENDING" && (
                          <button
                            title="Auto-terima tugasan bagi pihak runner"
                            type="button"
                            onClick={() => onUpdateOrderStatus(o.id, "ACCEPTED")}
                            className="px-2 py-1 bg-indigo-950 text-indigo-400 border border-indigo-900/40 hover:bg-indigo-900/60 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Terima Job
                          </button>
                        )}

                        {o.status === "ACCEPTED" && (
                          <button
                            title="Set status ke 'Sedang Menghantar'"
                            type="button"
                            onClick={() => onUpdateOrderStatus(o.id, "DELIVERING")}
                            className="px-2 py-1 bg-blue-950 text-blue-400 border border-blue-900/40 hover:bg-blue-900/60 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Set OTW
                          </button>
                        )}

                        {(o.status === "DELIVERING" || o.status === "ARRIVED_DESTINATION") && (
                          <button
                            title="Set status sebagai 'Selesai'"
                            type="button"
                            onClick={() => onUpdateOrderStatus(o.id, "COMPLETED")}
                            className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-900/60 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Lengkapkan
                          </button>
                        )}

                        {editingOrderId !== o.id && (
                          <button
                            title="Edit upah penghantaran"
                            type="button"
                            onClick={() => handleStartEditFee(o)}
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 rounded-lg cursor-pointer transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          title="Padam/Batal tempahan"
                          type="button"
                          onClick={() => onCancelOrder(o.id)}
                          className="p-1.5 bg-slate-950 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-850 rounded-lg cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 5: Pendaftaran Kedai & Runner (Bento Layout) */}
      <div id="admin-registration-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Registration Column 1: Kedai & Lokasi */}
        <div id="register-shop-card" className="bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col gap-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
              <Store className="w-4 h-4" />
              Pendaftaran Kedai / Lokasi Baru
            </h3>
            <span className="bg-amber-500/15 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
              {Object.keys(locations).length} Lokasi Berdaftar
            </span>
          </div>

          <form onSubmit={handleRegisterShop} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nama Kedai / Landmark</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="cth: Kedai Runcit Pak Samad"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Alamat Kedai</label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="cth: Lot 10, Jalan Parit Raja, Rengit"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                <span>No. Telefon Kedai (Buka/Tutup)</span>
                <span className="text-[9px] text-emerald-400 font-bold">Pilihan (Optional)</span>
              </label>
              <input
                type="tel"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="cth: 019-7788991 atau 07-4241234"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                <span>Logo Kedai / Perkhidmatan</span>
                <span className="text-[9px] text-emerald-400 font-bold">Pilihan (Optional) · Maks 500KB</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {shopLogoUrl ? (
                    <img src={shopLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-[11px] font-bold text-slate-300 transition-all">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{shopLogoUrl ? "Tukar Logo" : "Muat Naik Logo"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleShopLogoUpload} />
                  </label>
                  {shopLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setShopLogoUrl("")}
                      className="p-2 hover:bg-red-950/40 hover:text-red-400 text-slate-500 rounded-lg cursor-pointer transition-colors"
                      title="Buang logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Jenis Lokasi</label>
                <select
                  value={shopType}
                  onChange={(e) => setShopType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                >
                  <option value="shop">Kedai / Restoran (Pickup)</option>
                  <option value="residential">Kediaman (Dropoff)</option>
                  <option value="office">Pejabat / Awam (Dropoff)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">ID Unik (Sistem)</label>
                <input
                  type="text"
                  placeholder="Di-jana automatik"
                  disabled
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-600 font-mono"
                />
              </div>
            </div>

            <button
              id="admin-btn-register-shop"
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-600/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Daftar Lokasi Baru</span>
            </button>
          </form>

          {/* List of Locations (with deletion option) */}
          <div className="border-t border-slate-800/80 pt-4 mt-1">
            <span className="block text-[10px] uppercase font-bold text-slate-500 font-mono mb-2.5">
              Urus Kedai / Lokasi Sedang Beroperasi
            </span>
            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {Object.values(locations).map((loc) => {
                const isCustom = !["pak_ayob", "perabot_jati", "pasar_raya_mesra", "jpj_sentosa", "flat_sentosa", "taman_indah", "kondo_harmoni", "pejabat_urusan"].includes(loc.id);
                return (
                  <div key={loc.id} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {loc.logoUrl ? (
                        <span className="w-7 h-7 rounded-lg overflow-hidden border border-slate-800 shrink-0">
                          <img src={loc.logoUrl} alt={loc.name} className="w-full h-full object-cover" />
                        </span>
                      ) : (
                        <span className={`p-1.5 rounded-lg ${loc.type === "shop" ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400"}`}>
                          <Store className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div>
                        <p className="font-bold text-white leading-normal flex items-center gap-1.5 flex-wrap">
                          {loc.name}
                          {isCustom && (
                            <span className="bg-indigo-500/10 text-indigo-400 text-[7px] font-mono font-black px-1 py-0.5 rounded uppercase">Kustom</span>
                          )}
                          {loc.phone && (
                            <a
                              href={`tel:${loc.phone}`}
                              className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded-md font-mono transition-all"
                              title="Hubungi kedai ini"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{loc.phone}</span>
                            </a>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-[240px] mt-0.5">{loc.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLocationToDelete(loc)}
                        className="p-1 hover:bg-red-950/40 hover:text-red-400 text-slate-500 rounded cursor-pointer transition-colors"
                        title="Padam kedai ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Registration Column 2: Runner */}
        <div id="register-runner-card" className="bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col gap-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pendaftaran Runner Baru
            </h3>
            <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              {runners.length} Runner Berdaftar
            </span>
          </div>

          <form onSubmit={handleRegisterRunner} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nama Penuh Runner</label>
              <input
                type="text"
                value={runnerName}
                onChange={(e) => setRunnerName(e.target.value)}
                placeholder="cth: Mohd Khairul Azmi"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">No Telefon (Bimbit)</label>
              <input
                type="text"
                value={runnerPhone}
                onChange={(e) => setRunnerPhone(e.target.value)}
                placeholder="cth: 019-7654321"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Kata Laluan (Password)</label>
              <input
                type="text"
                value={runnerPassword}
                onChange={(e) => setRunnerPassword(e.target.value)}
                placeholder="Kata laluan untuk log masuk (cth: 123456)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Kenderaan Yang Dimiliki <span className="text-emerald-400 font-black">(Boleh Pilih Banyak)</span></span>
                <span className="text-[9px] text-slate-500 font-normal">Sila tandakan kenderaan yang ada</span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                {(["MOTORCYCLE", "CAR", "PICKUP", "LORRY"] as VehicleType[]).map((v) => {
                  const isSelected = selectedVehicles.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        let updated: VehicleType[];
                        if (isSelected) {
                          if (selectedVehicles.length > 1) {
                            updated = selectedVehicles.filter(item => item !== v);
                            setSelectedVehicles(updated);
                            if (runnerVehicle === v) {
                              setRunnerVehicle(updated[0]);
                            }
                          }
                        } else {
                          updated = [...selectedVehicles, v];
                          setSelectedVehicles(updated);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all cursor-pointer text-xs font-semibold ${
                        isSelected 
                          ? "bg-emerald-950/30 border-emerald-500 text-emerald-400" 
                          : "bg-slate-950/60 border-slate-850 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} 
                        className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-3.5 h-3.5 flex-shrink-0"
                      />
                      <span className="truncate">
                        {v === "MOTORCYCLE" && "🏍️ Motosikal"}
                        {v === "CAR" && "🚗 Kereta"}
                        {v === "PICKUP" && "🛻 Pikap"}
                        {v === "LORRY" && "🚚 Lori"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Kenderaan Aktif (Utama)</label>
                <select
                  value={runnerVehicle}
                  onChange={(e) => setRunnerVehicle(e.target.value as VehicleType)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                >
                  {selectedVehicles.map((v) => (
                    <option key={v} value={v}>
                      {v === "MOTORCYCLE" && "🏍️ Motorsikal"}
                      {v === "CAR" && "🚗 Kereta"}
                      {v === "PICKUP" && "🛻 Pikap"}
                      {v === "LORRY" && "🚚 Lori"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status Keaktifan</label>
                <select
                  value={runnerStatus}
                  onChange={(e) => setRunnerStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                >
                  <option value="ACTIVE">Aktif (Sedang Bekerja)</option>
                  <option value="OFFLINE">Offline (Berehat)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-[10px] text-slate-400 leading-normal">
              💡 Runner baru yang didaftarkan akan mempunyai akaun profil simulasi, mendapat baki dompet permulaan RM0, baki penarafan 5.0 bintang, dan boleh dipilih oleh sistem atau dipilih secara manual dalam RunnerPanel.
            </div>

            <button
              id="admin-btn-register-runner"
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Daftar & Aktifkan Runner</span>
            </button>
          </form>

          {/* List of Runners (with deletion option) */}
          <div className="border-t border-slate-800/80 pt-4 mt-1">
            <span className="block text-[10px] uppercase font-bold text-slate-500 font-mono mb-2.5">
              Urus Runner Aktif / Berehat
            </span>
            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {runners.map((run) => {
                const isCustom = run.id !== "runner_1";
                return (
                  <div key={run.id} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className={`p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400`}>
                        <Bike className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="font-bold text-white leading-normal flex items-center gap-1.5">
                          {run.name}
                          <span className={`text-[7px] font-mono font-black px-1.5 py-0.5 rounded uppercase ${
                            run.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-500"
                          }`}>
                            {run.status}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Aktif: <span className="text-white font-extrabold">{run.vehicleType}</span> • <span className="text-white font-semibold font-mono">{run.phone}</span> • K.Laluan: <span className="text-emerald-400 font-bold font-mono bg-emerald-950/40 border border-emerald-900/30 px-1 py-0.2 rounded">{run.password || "123456"}</span> • ★{run.stats.rating}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Miliki:</span>
                          {(["MOTORCYCLE", "CAR", "PICKUP", "LORRY"] as VehicleType[]).map((v) => {
                            const isOwned = run.vehicles?.includes(v) || run.vehicleType === v;
                            return (
                              <button
                                key={v}
                                type="button"
                                onClick={() => {
                                  if (onUpdateRunnerVehicles) {
                                    const currentList = run.vehicles || [run.vehicleType];
                                    let newList: VehicleType[];
                                    if (isOwned) {
                                      newList = currentList.filter(item => item !== v);
                                    } else {
                                      newList = [...currentList, v];
                                    }
                                    onUpdateRunnerVehicles(run.id, newList);
                                  }
                                }}
                                className={`text-[8px] px-1.5 py-0.5 rounded font-black border transition-all cursor-pointer ${
                                  isOwned
                                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                                    : "bg-slate-950/60 border-slate-900 text-slate-600 hover:text-slate-400"
                                }`}
                                title="Klik untuk tambah/buang jenis kenderaan ini"
                              >
                                {v === "MOTORCYCLE" && "🏍️ MOT"}
                                {v === "CAR" && "🚗 CAR"}
                                {v === "PICKUP" && "🛻 PIC"}
                                {v === "LORRY" && "🚚 LOR"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">RM {run.stats.totalEarnings.toFixed(2)}</span>
                      {isCustom ? (
                        <button
                          type="button"
                          onClick={() => onDeleteRunner(run.id)}
                          className="p-1 hover:bg-red-950/40 hover:text-red-400 text-slate-500 rounded cursor-pointer transition-colors"
                          title="Padam runner ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[8px] font-mono text-slate-600 bg-slate-900 px-1 py-0.5 rounded border border-slate-850">Kekal</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* CUSTOM CONFIRMATION MODAL FOR LOCATIONS DELETION */}
      {locationToDelete && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 animate-bounce">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Pengesahan Padam Lokasi
                </h3>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Adakah anda pasti mahu memadam lokasi ini dari peta platform? Tindakan ini tidak boleh dikembalikan.
                </p>
              </div>
            </div>

            {/* Shop summary detail box */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <Store className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-white">{locationToDelete.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal pl-6">
                📍 {locationToDelete.address}
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                className="py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer border border-slate-750"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLocation(locationToDelete.id);
                  setLocationToDelete(null);
                }}
                className="py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-red-600/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Padam</span>
              </button>
            </div>

          </div>
        </div>
      )}

        </>


    </div>
  );
}
