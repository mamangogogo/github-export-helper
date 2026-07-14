/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Order, VehicleType, Location } from "../types";
import { 
  Bike, Car, Truck, Navigation, Sun, CloudRain, ShieldCheck, 
  MapPin, Clock, AlertTriangle, ArrowRight, Zap, Coins, Users, Compass, Phone
} from "lucide-react";

interface LiveDashboardProps {
  activeOrder: Order | null;
  orders: Order[];
  weather?: "sunny" | "rainy";
  demandLevel?: "normal" | "high" | "peak";
}

export default function LiveDashboard({ 
  activeOrder, 
  orders, 
  weather = "sunny", 
  demandLevel = "high" 
}: LiveDashboardProps) {
  const [selectedFleet, setSelectedFleet] = useState<VehicleType>("MOTORCYCLE");

  const getVehicleLabelMalay = (v: VehicleType) => {
    switch (v) {
      case "MOTORCYCLE": return "Motorsikal";
      case "CAR": return "Kereta";
      case "PICKUP": return "Pickup Truck";
      case "LORRY": return "Lori";
    }
  };

  const getVehicleDetails = (v: VehicleType) => {
    switch (v) {
      case "MOTORCYCLE":
        return {
          model: "Yamaha Y15 / Honda Wave",
          capacity: "Kecil (Makanan, Dokumen, Barangan runcit mini)",
          baseFee: "Upah bermula RM 6.00",
          speed: "Paling Pantas (Sesuai elak kesesakan Pasar Karat)",
          suitability: "Sesuai untuk pesanan makanan panas & parcel kecil.",
          icon: Bike,
          color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
          status: "Sedia & Aktif"
        };
      case "CAR":
        return {
          model: "Perodua Myvi / Proton Saga",
          capacity: "Sederhana (Barang runcit banyak, barang kalis hujan)",
          baseFee: "Upah bermula RM 12.00",
          speed: "Sederhana (Kalis cuaca hujan lebat)",
          suitability: "Sesuai untuk belian pasar raya bulanan & barangan bernilai tinggi.",
          icon: Car,
          color: "text-sky-400 border-sky-500/20 bg-sky-500/10",
          status: "Sedia & Aktif"
        };
      case "PICKUP":
        return {
          model: "Toyota Hilux / Mitsubishi Triton",
          capacity: "Besar (Mesin rumput, perabot kecil, kabinet sederhana)",
          baseFee: "Upah bermula RM 25.00",
          speed: "Pantas & Lasak (Jalan kampung & ladang)",
          suitability: "Sesuai untuk barangan bundle Pasar Karat & kerja tebas rumput.",
          icon: Truck,
          color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
          status: "Sedia"
        };
      case "LORRY":
        return {
          model: "Isuzu 3 Tan / Hino",
          capacity: "Sangat Besar (Sofa kayu jati, almari besar, katil, pindah rumah)",
          baseFee: "Upah bermula RM 45.00",
          speed: "Sederhana Berat (Perlu ruang parking luas)",
          suitability: "Sesuai untuk pindah rumah di Rengit atau angkat perabot jati padu.",
          icon: Truck,
          color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
          status: "Sedia (Perlu tempahan awal)"
        };
    }
  };

  const activeFleetInfo = getVehicleDetails(selectedFleet);
  const FleetIcon = activeFleetInfo.icon;

  // Render tracking timeline nodes
  const getTimelineSteps = (status: string) => {
    const steps = [
      { id: "ACCEPTED", label: "Menerima", desc: "Runner terima tugasan" },
      { id: "ARRIVED_STORE", label: "Tiba Ambil", desc: "Membeli di lokasi mula" },
      { id: "DELIVERING", label: "OTW Hantar", desc: "Sedang dalam perjalanan" },
      { id: "ARRIVED_DESTINATION", label: "Tiba Destinasi", desc: "Sampai di rumah anda" },
      { id: "COMPLETED", label: "Selesai", desc: "Transaksi berjaya" }
    ];

    let activeIndex = -1;
    if (status === "ACCEPTED") activeIndex = 0;
    else if (status === "ARRIVED_STORE") activeIndex = 1;
    else if (status === "DELIVERING") activeIndex = 2;
    else if (status === "ARRIVED_DESTINATION") activeIndex = 3;
    else if (status === "COMPLETED") activeIndex = 4;

    return { steps, activeIndex };
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. SECTION: Live Delivery Tracking (Renders only when there is an active order) */}
      {activeOrder ? (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-5 shadow-2xl shadow-indigo-600/5 relative overflow-hidden">
          
          {/* Subtle glowing ambient line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-emerald-500 animate-pulse" />

          {/* Heading */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                Pusat Pemantauan Penghantaran Live
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-full text-slate-400 border border-slate-800">
              ID: #{activeOrder.id.slice(0, 8)}
            </span>
          </div>

          {/* Core Info Summary Card */}
          <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl mb-5">
            <h4 className="text-sm font-black text-white">{activeOrder.title}</h4>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs border-t border-slate-800/80 pt-3 text-slate-400">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500">Mula (Ambil)</p>
                <p className="font-semibold text-white mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="truncate">{activeOrder.pickupLocation.name}</span>
                </p>
                {activeOrder.pickupLocation.phone && (
                  <p className="text-[9px] text-emerald-400 font-bold font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    <span>{activeOrder.pickupLocation.phone}</span>
                  </p>
                )}
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500">Destinasi (Hantar)</p>
                <p className="font-semibold text-white mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span className="truncate">{activeOrder.dropoffLocation.name}</span>
                </p>
                {activeOrder.customerAddress && (
                  <p className="text-[9px] text-slate-400 font-medium italic mt-0.5 leading-snug line-clamp-1" title={activeOrder.customerAddress}>
                    Alamat: {activeOrder.customerAddress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2D Animated Route Lane Slider */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl mb-6">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-2">
              <span>MULA: {activeOrder.pickupLocation.name.split(" ")[0]}</span>
              <span className="text-indigo-400 font-bold">{activeOrder.progressPercent}% Selesai</span>
              <span>DESTINASI: {activeOrder.dropoffLocation.name.split(" ")[0]}</span>
            </div>

            {/* The Visual Track */}
            <div className="relative h-6 bg-slate-900 border border-slate-800/80 rounded-full flex items-center px-2">
              
              {/* Progress fill line */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 rounded-full transition-all duration-300"
                style={{ width: `${activeOrder.progressPercent}%` }}
              />

              {/* Dotted mid lines */}
              <div className="absolute left-4 right-4 h-0.5 border-t border-dashed border-slate-700 top-1/2 -translate-y-1/2 z-0" />

              {/* Animated Vehicle Icon */}
              <div 
                className="absolute z-10 transition-all duration-300 ease-out flex items-center justify-center p-1.5 rounded-full bg-indigo-600 border border-indigo-400 text-white shadow-lg shadow-indigo-600/30"
                style={{ 
                  left: `calc(${activeOrder.progressPercent}% - 14px)`,
                  transform: `scale(${activeOrder.progressPercent === 100 ? 1.15 : 1})`,
                }}
              >
                {activeOrder.vehicleType === "MOTORCYCLE" && <Bike className="w-3.5 h-3.5 animate-pulse" />}
                {activeOrder.vehicleType === "CAR" && <Car className="w-3.5 h-3.5 animate-pulse" />}
                {activeOrder.vehicleType === "PICKUP" && <Truck className="w-3.5 h-3.5 animate-pulse" />}
                {activeOrder.vehicleType === "LORRY" && <Truck className="w-3.5 h-3.5 animate-bounce" />}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-2.5 font-mono">
              Kenderaan digunakan: <strong className="text-white">{getVehicleLabelMalay(activeOrder.vehicleType)}</strong>
            </p>
          </div>

          {/* Interactive Delivery Steps Timeline */}
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Status Pencapaian</h5>
            <div className="relative border-l border-slate-800 ml-2.5 pl-5 space-y-4">
              {getTimelineSteps(activeOrder.status).steps.map((st, idx) => {
                const activeIdx = getTimelineSteps(activeOrder.status).activeIndex;
                const isCompleted = idx < activeIdx;
                const isCurrent = idx === activeIdx;

                return (
                  <div key={st.id} className="relative">
                    {/* Node Dot */}
                    <span className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                      isCompleted 
                        ? "bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/20" 
                        : isCurrent 
                          ? "bg-indigo-600 border-indigo-400 animate-pulse scale-110" 
                          : "bg-slate-900 border-slate-800"
                    }`}>
                      {isCompleted && <span className="w-1 h-1 bg-white rounded-full" />}
                    </span>

                    {/* Step Content */}
                    <div>
                      <h6 className={`text-xs font-bold ${
                        isCompleted 
                          ? "text-slate-400 line-through" 
                          : isCurrent 
                            ? "text-indigo-400" 
                            : "text-slate-600"
                      }`}>
                        {st.label}
                      </h6>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* 2. SECTION: Live Town & Vehicle Fleet Status (Renders when NO active order) */
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl flex flex-col gap-5">
          
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
                Papan Pemantauan & Armada Rengit
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Status cuaca, laluan semasa dan kapasiti kenderaan</p>
            </div>
          </div>

          {/* Weather & Demand Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl flex items-center gap-3">
              <div className={`p-2 rounded-xl flex items-center justify-center ${
                weather === "sunny" ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400 animate-pulse"
              }`}>
                {weather === "sunny" ? (
                  <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
                ) : (
                  <CloudRain className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Cuaca Semasa</p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {weather === "sunny" ? "Cerah & Berangin" : "Hujan Lebat"}
                </p>
                <p className={`text-[9px] font-mono ${weather === "sunny" ? "text-emerald-400" : "text-sky-400"}`}>
                  {weather === "sunny" ? "Selamat untuk motorsikal" : "Lampu & baju hujan disyorkan"}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Zap className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Kadar Permintaan</p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {demandLevel === "normal" ? "Sederhana (Biasa)" : demandLevel === "high" ? "Sangat Tinggi" : "Puncak Ekstrem"}
                </p>
                <p className="text-[9px] text-indigo-400 font-mono">
                  {demandLevel === "normal" ? "Masa padanan stabil" : demandLevel === "high" ? "Pasar Karat Sedang Sesak" : "Bonus upah amat disyorkan"}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Fleet Selection */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 font-mono">
              Maklumat Spesifikasi Armada Rengit
            </h4>
            
            {/* Horizontal Mini Tabs Selector */}
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 mb-4">
              {(["MOTORCYCLE", "CAR", "PICKUP", "LORRY"] as VehicleType[]).map((v) => {
                const isActive = selectedFleet === v;
                return (
                  <button
                    key={v}
                    onClick={() => setSelectedFleet(v)}
                    className={`py-2 text-[10px] font-black rounded-lg transition-all text-center cursor-pointer ${
                      isActive 
                        ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {getVehicleLabelMalay(v)}
                  </button>
                );
              })}
            </div>

            {/* Selected Vehicle Showcase Card */}
            <div className="bg-slate-950/90 border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start relative overflow-hidden">
              <div className="absolute top-2 right-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-400 font-mono">{activeFleetInfo.status}</span>
              </div>

              {/* Icon Bubble */}
              <div className={`p-4 rounded-2xl border flex items-center justify-center self-start sm:self-center ${activeFleetInfo.color}`}>
                <FleetIcon className="w-7 h-7" />
              </div>

              {/* Technical Details */}
              <div className="flex-1 space-y-1.5 text-xs text-slate-300">
                <h5 className="font-black text-white text-sm flex items-center gap-1.5">
                  <span>Armada {getVehicleLabelMalay(selectedFleet)}</span>
                  <span className="text-[10px] text-slate-500 font-mono font-normal">({activeFleetInfo.model})</span>
                </h5>
                
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-slate-400">Muatan Maksimum:</strong>{" "}
                    <span className="text-white">{activeFleetInfo.capacity}</span>
                  </p>
                  <p>
                    <strong className="text-slate-400">Kelebihan:</strong>{" "}
                    <span className="text-white">{activeFleetInfo.speed}</span>
                  </p>
                  <p className="text-slate-400 mt-1 italic">
                    💡 {activeFleetInfo.suitability}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-900/80 mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Harga Upah Amalan:</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold font-mono">
                    {activeFleetInfo.baseFee}
                  </span>
                </div>
              </div>
            </div>
          </div>


        </div>
      )}
    </div>
  );
}
