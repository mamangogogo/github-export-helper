/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Order, RunnerStats, OrderItem, VehicleType, Runner } from "../types";
import { 
  Bike, DollarSign, Award, Zap, TrendingUp, Compass, CheckSquare, Square,
  Check, Play, Pause, Navigation, MessageSquare, AlertCircle, RefreshCw, ThumbsUp,
  Car, Truck, Lock, Phone, LogIn, LogOut, Key, Shield
} from "lucide-react";

interface RunnerPanelProps {
  orders: Order[];
  activeOrder: Order | null;
  stats: RunnerStats;
  onAcceptOrder: (orderId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order["status"]) => void;
  onUpdateOrderProgress: (orderId: string, progress: number) => void;
  onUpdateOrderChecklist: (orderId: string, itemId: string, completed: boolean) => void;
  onOpenChat: (order: Order) => void;
  onSendMessage: (orderId: string, text: string) => void;
  runners?: Runner[];
  selectedRunnerId?: string;
  onSelectRunner?: (id: string) => void;
  loggedInRunnerId?: string | null;
  onLoginRunner?: (runnerId: string) => void;
  onLogoutRunner?: () => void;
  onUpdateRunnerVehicle?: (runnerId: string, vehicleType: VehicleType) => void;
}

const getWhatsAppUrl = (phone?: string) => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const finalPhone = cleanPhone.startsWith("0") ? `6${cleanPhone}` : cleanPhone;
  return `https://wa.me/${finalPhone}`;
};

export default function RunnerPanel({
  orders,
  activeOrder,
  stats,
  onAcceptOrder,
  onUpdateOrderStatus,
  onUpdateOrderProgress,
  onUpdateOrderChecklist,
  onOpenChat,
  onSendMessage,
  runners,
  selectedRunnerId,
  onSelectRunner,
  loggedInRunnerId,
  onLoginRunner,
  onLogoutRunner,
  onUpdateRunnerVehicle
}: RunnerPanelProps) {
  // Navigation simulation state
  const [isDriving, setIsDriving] = useState(false);

  // Login form states
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!runners) return;

    // Check if logging in as Admin
    const isLoggingInAsAdmin = 
      loginPhone.toLowerCase().trim() === "admin" || 
      loginPhone.toLowerCase().trim() === "mamanharry93@gmail.com";

    if (isLoggingInAsAdmin) {
      // Admin bypass - log in as the default runner
      onLoginRunner?.(runners[0].id);
      setLoginPhone("");
      setLoginPassword("");
      return;
    }

    // Normalize comparison: remove spaces, dashes, parentheses
    const cleanInputPhone = loginPhone.replace(/[^0-9]/g, "");
    
    const matched = runners.find(
      (r) => {
        const cleanRunnerPhone = r.phone.replace(/[^0-9]/g, "");
        const correctPassword = r.password || "123456";
        return cleanRunnerPhone === cleanInputPhone && correctPassword === loginPassword.trim();
      }
    );

    if (matched) {
      onLoginRunner?.(matched.id);
      setLoginPhone("");
      setLoginPassword("");
    } else {
      setLoginError("Nombor telefon atau kata laluan tidak sah! Sila semak senarai di Portal Admin.");
    }
  };
  
  // Pending orders for the Runner
  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  const getVehicleLabelMalay = (v?: VehicleType) => {
    switch (v) {
      case "MOTORCYCLE": return "Motorsikal";
      case "CAR": return "Kereta";
      case "PICKUP": return "Pickup Truck";
      case "LORRY": return "Lori";
      default: return "Motorsikal";
    }
  };

  const getVehicleIcon = (v?: VehicleType) => {
    switch (v) {
      case "MOTORCYCLE": return <Bike className="w-3.5 h-3.5 text-amber-400" />;
      case "CAR": return <Car className="w-3.5 h-3.5 text-sky-400" />;
      case "PICKUP": return <Truck className="w-3.5 h-3.5 text-indigo-400" />;
      case "LORRY": return <Truck className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Bike className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  // Driving Simulation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isDriving && activeOrder) {
      interval = setInterval(() => {
        const nextProgress = Math.min(100, activeOrder.progressPercent + 5);
        onUpdateOrderProgress(activeOrder.id, nextProgress);
        
        if (nextProgress >= 100) {
          setIsDriving(false);
          // Transition status to ARRIVED_DESTINATION once path is complete
          onUpdateOrderStatus(activeOrder.id, "ARRIVED_DESTINATION");
          onSendMessage(activeOrder.id, "[SISTEM]: Runner telah tiba di tempat anda! Sila sedia untuk ambil barang.");
        }
      }, 500); // Drives fast for smooth but quick simulation
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDriving, activeOrder, onUpdateOrderProgress, onUpdateOrderStatus]);

  const handleStartSimulatedDrive = () => {
    if (!activeOrder) return;
    setIsDriving(true);
    onSendMessage(activeOrder.id, "Saya otw menghantar sekarang ya bos. Anggaran dalam beberapa minit.");
  };

  const handlePauseSimulatedDrive = () => {
    setIsDriving(false);
  };

  // Quick message shortcuts for runners to text customers instantly
  const QUICK_REPLIES = [
    "Saya dah gerak pergi kedai ya.",
    "Item dah habis bro. Nak ganti benda lain ke?",
    "Barang semua dah dibeli. Saya otw menghantar.",
    "Dah sampai ni bro. Saya letak kat mana ya?",
    "Saya gantung kat gate ya, terima kasih bos!"
  ];

  const handleSendQuickReply = (reply: string) => {
    if (!activeOrder) return;
    onSendMessage(activeOrder.id, reply);
  };

  if (!loggedInRunnerId) {
    return (
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl w-full">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-3 flex items-center justify-center text-white shadow-lg shadow-emerald-600/10">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
              Log Masuk Portal Runner
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Sila masukkan nombor telefon bimbit dan kata laluan berdaftar anda untuk mengakses papan tugasan.
            </p>
          </div>
        </div>

        {loginError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-2xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-mono tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              Nombor Telefon (Bimbit)
            </label>
            <input
              type="text"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              placeholder="cth: 013-4567890"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 font-mono tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              Kata Laluan (Password)
            </label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Masukkan kata laluan (cth: 123456)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Portal Runner</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[9px] text-slate-500 uppercase tracking-widest font-mono">Atau Masuk Sebagai Admin</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (runners && runners.length > 0) {
                onLoginRunner?.(runners[0].id);
              }
            }}
            className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/30 text-rose-400 border border-rose-900/20 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-950/10"
          >
            <Shield className="w-4 h-4" />
            <span>🔑 Log Masuk Sebagai Admin (Bypass)</span>
          </button>
        </form>

        {/* Quick Testing Accounts list */}
        {runners && runners.length > 0 && (
          <div className="border-t border-slate-800/80 pt-4 mt-1">
            <span className="block text-[9px] uppercase font-black text-slate-500 font-mono mb-2.5 tracking-wider">
              Akaun Runner Berdaftar (Klik untuk Isi Automatik)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
              {runners.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => {
                    setLoginPhone(run.phone);
                    setLoginPassword(run.password || "123456");
                    setLoginError("");
                  }}
                  className="bg-slate-950/60 hover:bg-slate-800 text-left p-2.5 rounded-xl border border-slate-850 hover:border-slate-700 transition-all cursor-pointer flex flex-col gap-0.5"
                >
                  <span className="text-[10px] font-black text-white truncate">{run.name}</span>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                    <span>📱 {run.phone}</span>
                    <span className="text-emerald-400 font-bold">K.Laluan: {run.password || "123456"}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      {/* Profile Header for logged in runner with Logout */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bike className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Log Masuk Sebagai</p>
              <p className="text-xs font-black text-white">{runners?.find(r => r.id === loggedInRunnerId)?.name || "Runner"}</p>
            </div>
          </div>

          {/* Vehicle Switcher/Badge */}
          {(() => {
            const currentRunner = runners?.find(r => r.id === loggedInRunnerId);
            if (!currentRunner) return null;
            const hasMultiple = (currentRunner.vehicles?.length || 0) > 1;
            if (hasMultiple) {
              return (
                <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 border border-slate-850/80 px-3 py-1.5 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-slate-500 font-mono">Tukar Kenderaan:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentRunner.vehicles?.map((v) => {
                      const isActive = currentRunner.vehicleType === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            if (onUpdateRunnerVehicle) {
                              onUpdateRunnerVehicle(currentRunner.id, v);
                            }
                          }}
                          className={`text-[9px] px-2 py-0.5 rounded-lg font-black border transition-all cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/15"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span>
                            {v === "MOTORCYCLE" && "🏍️"}
                            {v === "CAR" && "🚗"}
                            {v === "PICKUP" && "🛻"}
                            {v === "LORRY" && "🚚"}
                          </span>
                          <span className="uppercase text-[8px]">{v.slice(0, 4)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            } else {
              return (
                <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-850/60 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400">
                  <span>Kenderaan:</span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase">
                    {currentRunner.vehicleType === "MOTORCYCLE" && "🏍️ Motosikal"}
                    {currentRunner.vehicleType === "CAR" && "🚗 Kereta"}
                    {currentRunner.vehicleType === "PICKUP" && "🛻 Pikap"}
                    {currentRunner.vehicleType === "LORRY" && "🚚 Lori"}
                  </span>
                </div>
              );
            }
          })()}
        </div>

        <button
          type="button"
          onClick={() => onLogoutRunner?.()}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-red-950/30 text-slate-400 hover:text-red-400 border border-slate-850 hover:border-red-900/20 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Keluar Portal</span>
        </button>
      </div>

      {/* Earnings & Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Earnings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pendapatan Hari Ini</p>
            <p className="text-base font-extrabold text-white">RM {stats.todayEarnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Level Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pangkat Runner</p>
            <p className="text-base font-extrabold text-white">Level {stats.level} (Pro)</p>
          </div>
        </div>

        {/* Deliveries Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Jumlah Job Selesai</p>
            <p className="text-base font-extrabold text-white">{stats.completedDeliveries} Trips</p>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl animate-pulse">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Streak Hari Ini</p>
            <p className="text-base font-extrabold text-white">{stats.activeStreak}x Berterusan</p>
          </div>
        </div>
      </div>

      {/* Main Screen Layout (If Runner has active order vs Job Board) */}
      {activeOrder ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between overflow-y-auto max-h-[480px]">
          {/* Active Job Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                  Tugasan Aktif
                </span>
                <h3 className="text-base font-black text-white mt-1.5">{activeOrder.title}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Pelanggan: <span className="font-semibold text-slate-300">{activeOrder.customerName}</span></span>
                  <span>•</span>
                  {activeOrder.customerPhone && (
                    <>
                      <span>WhatsApp: <span className="font-black text-emerald-400 font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30">{activeOrder.customerPhone}</span></span>
                      <span>•</span>
                    </>
                  )}
                  <span>Upah: <span className="font-extrabold text-emerald-400 font-mono">RM {activeOrder.fee.toFixed(2)}</span></span>
                  <span>•</span>
                  <span className="bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    {getVehicleIcon(activeOrder.vehicleType)}
                    <span>{getVehicleLabelMalay(activeOrder.vehicleType)}</span>
                  </span>
                </p>
              </div>
 
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => onOpenChat(activeOrder)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Sini</span>
                </button>
                {activeOrder.customerPhone && (
                  <a
                    href={getWhatsAppUrl(activeOrder.customerPhone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 border border-emerald-500/30"
                  >
                    <Phone className="w-3.5 h-3.5 text-white" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            {activeOrder.notes && (
              <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nota Khas Pelanggan</h4>
                  <p className="text-xs text-slate-300 mt-1 italic leading-relaxed">"{activeOrder.notes}"</p>
                </div>
              </div>
            )}

            {/* Lokasi Ambil & Hantar */}
            <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl space-y-2.5">
              <div className="flex items-start gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] uppercase font-bold text-amber-500 font-mono">Mula (Ambil)</span>
                  <p className="text-white font-bold">{activeOrder.pickupLocation.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{activeOrder.pickupLocation.address}</p>
                  {activeOrder.pickupLocation.phone && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-400">Tel Kedai: <span className="text-emerald-400 font-extrabold font-mono bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/20">{activeOrder.pickupLocation.phone}</span></span>
                      <a
                        href={`tel:${activeOrder.pickupLocation.phone}`}
                        className="bg-emerald-950 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                        title="Klik untuk hubungi kedai tanya buka/tutup"
                      >
                        <Phone className="w-2.5 h-2.5 animate-pulse" />
                        <span>Tanya Buka Ke Tak</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-slate-900/40 my-2" />

              <div className="flex items-start gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] uppercase font-bold text-sky-400 font-mono">Tamat (Hantar)</span>
                  <p className="text-white font-bold">{activeOrder.dropoffLocation.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{activeOrder.dropoffLocation.address}</p>
                  {activeOrder.customerAddress && (
                    <div className="mt-2 bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-[11px] text-slate-200">
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">Alamat Penghantaran Pelanggan:</span>
                      <p className="font-semibold">{activeOrder.customerAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Steps Workflow Engine */}
            <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Progres Penghantaran</span>
              </h4>

              {/* Status Timelines */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold font-mono">
                <div className={`p-2 rounded-xl border ${activeOrder.status === "ACCEPTED" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                  Terima
                </div>
                <div className={`p-2 rounded-xl border ${activeOrder.status === "ARRIVED_STORE" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                  Beli
                </div>
                <div className={`p-2 rounded-xl border ${activeOrder.status === "DELIVERING" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                  OTW
                </div>
                <div className={`p-2 rounded-xl border ${activeOrder.status === "ARRIVED_DESTINATION" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                  Tiba
                </div>
              </div>

              {/* Dynamic Steps Actions */}
              <div className="pt-2">
                {activeOrder.status === "ACCEPTED" && (
                  <button
                    onClick={() => {
                      onUpdateOrderStatus(activeOrder.id, "ARRIVED_STORE");
                      onSendMessage(activeOrder.id, "Saya sudah sampai di kedai/lokasi pickup ya bos.");
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>SAYA DAH SAMPAI KEDAI (START BUY)</span>
                  </button>
                )}

                {activeOrder.status === "ARRIVED_STORE" && (
                  <div className="space-y-4">
                    {/* Item Checklists */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 space-y-2 max-h-[140px] overflow-y-auto">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Semak Barangan Sebelum OTW</p>
                      {activeOrder.items.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => onUpdateOrderChecklist(activeOrder.id, item.id, !item.completed)}
                          className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800/50 hover:border-slate-700 cursor-pointer text-xs"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                          <span className={`text-slate-200 ${item.completed ? "line-through text-slate-500" : ""}`}>
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => onUpdateOrderStatus(activeOrder.id, "DELIVERING")}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>SEMUA BARANG SIAP BELI • OTW SEKARANG</span>
                    </button>
                  </div>
                )}

                {activeOrder.status === "DELIVERING" && (
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Memandu ke Destinasi...</span>
                      <span className="font-mono text-indigo-400">{activeOrder.progressPercent}%</span>
                    </div>

                    {/* Progress slider track */}
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${activeOrder.progressPercent}%` }}
                      />
                    </div>

                    {/* GPS Drive Engine Buttons */}
                    <div className="flex gap-2">
                      {!isDriving ? (
                        <button
                          onClick={handleStartSimulatedDrive}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Mula Drive (Simulasi)</span>
                        </button>
                      ) : (
                        <button
                          onClick={handlePauseSimulatedDrive}
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Berhenti Seketika</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onUpdateOrderProgress(activeOrder.id, 100);
                          setIsDriving(false);
                          onUpdateOrderStatus(activeOrder.id, "ARRIVED_DESTINATION");
                          onSendMessage(activeOrder.id, "[SISTEM]: Runner telah tiba di tempat anda! Sila sedia untuk ambil barang.");
                        }}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors"
                      >
                        Lompat Ke Tiba
                      </button>
                    </div>
                  </div>
                )}

                {activeOrder.status === "ARRIVED_DESTINATION" && (
                  <button
                    onClick={() => {
                      onUpdateOrderStatus(activeOrder.id, "COMPLETED");
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 animate-bounce"
                  >
                    <ThumbsUp className="w-4 h-4 animate-spin" />
                    <span>BARANG DAH DISERAH • SELESAIKAN JOB</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Chat shortcuts */}
            {activeOrder.status !== "COMPLETED" && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mesej Pantas</h4>
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                  {QUICK_REPLIES.map((rep, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuickReply(rep)}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {rep}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Job Board Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col overflow-y-auto max-h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-500" />
                <span>Papan Tugasan Aktif ({pendingOrders.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Ketik "Ambil Tugasan" untuk menerima pesanan dan memulakan penghantaran.
              </p>
            </div>
            
            <button
              onClick={() => {}}
              className="text-slate-500 hover:text-white p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {pendingOrders.map((ord) => (
              <div 
                key={ord.id}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between md:flex-row md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase">
                      {ord.type}
                    </span>
                    <span className="bg-slate-900 text-slate-300 border border-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                      {getVehicleIcon(ord.vehicleType)}
                      <span>{getVehicleLabelMalay(ord.vehicleType)}</span>
                    </span>
                    <span className="text-slate-500 text-[11px]">Dipesan oleh: {ord.customerName}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">{ord.title}</h4>
                  
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-400 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Pick: <span className="text-slate-300 font-semibold">{ord.pickupLocation.name}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      Drop: <span className="text-slate-300 font-semibold">{ord.dropoffLocation.name}</span>
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    Barang ({ord.items.length}): {ord.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                  </p>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-900">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Upah Bersih</p>
                    <p className="text-base font-extrabold text-emerald-400">RM {ord.fee.toFixed(2)}</p>
                  </div>

                  <button
                    onClick={() => onAcceptOrder(ord.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/10"
                  >
                    Ambil Tugasan
                  </button>
                </div>
              </div>
            ))}

            {pendingOrders.length === 0 && (
              <div className="border border-slate-800/80 border-dashed rounded-2xl py-12 px-6 text-center text-slate-500 text-xs">
                <Bike className="w-8 h-8 mx-auto text-slate-700 mb-3 animate-bounce" />
                Tiada tugasan baru dalam kawasan Taman Sentosa buat masa ini.
                <p className="text-[10px] text-slate-600 mt-1">Sila tukar ke "Mod Pelanggan" di atas untuk membuat pesanan baru.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
