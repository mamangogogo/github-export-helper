/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Order, OrderType, OrderItem, Location, MAP_LOCATIONS, VehicleType } from "../types";
import { 
  ShoppingBag, Utensils, Package, Plus, Trash2, Truck, Scissors, Users, HelpCircle,
  MapPin, Clock, Coins, MessageSquare, FileText, Sparkles, Bike, Car, Phone
} from "lucide-react";

interface CustomerPanelProps {
  orders: Order[];
  onCreateOrder: (order: Partial<Order>) => void;
  onOpenChat: (order: Order) => void;
  selectedMapLocation: Location | null;
  weather?: "sunny" | "rainy";
  locations?: { [key: string]: Location };
  minFee?: number;
  baseFees?: {
    MOTORCYCLE: { normal: number; rainy: number };
    CAR: { normal: number; rainy: number };
    PICKUP: { normal: number; rainy: number };
    LORRY: { normal: number; rainy: number };
  };
}

const DEFAULT_BASE_FEES = {
  MOTORCYCLE: { normal: 6.00, rainy: 9.00 },
  CAR: { normal: 12.00, rainy: 15.00 },
  PICKUP: { normal: 25.00, rainy: 28.00 },
  LORRY: { normal: 45.00, rainy: 50.00 }
};

// Job templates dibuang — pelanggan kini pilih kedai berdaftar oleh admin


export default function CustomerPanel({ 
  orders, 
  onCreateOrder, 
  onOpenChat, 
  selectedMapLocation,
  weather = "sunny",
  locations,
  minFee = 5.00,
  baseFees
}: CustomerPanelProps) {
  const currentLocations = locations || MAP_LOCATIONS;

  const getDynamicDefaultFee = (id: VehicleType) => {
    const isRainy = weather === "rainy";
    const fees = baseFees || DEFAULT_BASE_FEES;
    const base = isRainy ? fees[id].rainy : fees[id].normal;
    return Math.max(base, minFee);
  };

  const [activeTab, setActiveTab] = useState<"template" | "custom">("template");

  // Customer Contact Info (Wajib WhatsApp)
  const [customerName, setCustomerName] = useState("Kak Kiah Sentosa");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("Tingkat 3, Blok B, Flat Sentosa, Pekan Rengit");

  // Custom Form States
  const [title, setTitle] = useState("");
  const [type, setType] = useState<OrderType>("ODD_JOBS");
  const [typeText, setTypeText] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("MOTORCYCLE");
  const [pickupId, setPickupId] = useState("pak_ayob");
  const [dropoffId, setDropoffId] = useState("flat_sentosa");
  const [notes, setNotes] = useState("");
  const [fee, setFee] = useState(6.00);
  const [estimatedCost, setEstimatedCost] = useState(15.00);
  
  // Custom Items
  const [items, setItems] = useState<OrderItem[]>([
    { id: "1", name: "Item Tempahan 1", quantity: 1 }
  ]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);

  // If map location is selected, apply it to the form
  React.useEffect(() => {
    if (selectedMapLocation) {
      if (selectedMapLocation.type === "shop") {
        setPickupId(selectedMapLocation.id);
        setActiveTab("custom");
      } else {
        setDropoffId(selectedMapLocation.id);
        setActiveTab("custom");
      }
    }
  }, [selectedMapLocation]);

  // Adjust custom fee if it falls below the minimum fee set by Admin
  React.useEffect(() => {
    if (fee < minFee) {
      setFee(minFee);
    }
  }, [minFee]);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    setItems([
      ...items,
      { id: Date.now().toString(), name: newItemName.trim(), quantity: newItemQty }
    ]);
    setNewItemName("");
    setNewItemQty(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmitCustomOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerPhone.trim()) {
      alert("Sila masukkan Nombor WhatsApp anda terlebih dahulu di bahagian 'Maklumat Pelanggan'!");
      return;
    }

    if (!customerAddress.trim()) {
      alert("Sila masukkan Alamat anda terlebih dahulu di bahagian 'Maklumat Pelanggan'!");
      return;
    }

    if (!title.trim() || items.length === 0) return;

    if (fee < minFee) {
      alert(`Maaf, upah minimum yang ditetapkan oleh Admin semasa ialah RM ${minFee.toFixed(2)}. Sila naikkan baki upah.`);
      return;
    }

    const availableLocs = Object.values(currentLocations);
    if (availableLocs.length === 0) return;

    onCreateOrder({
      title: title.trim(),
      type: type,
      vehicleType: vehicleType,
      pickupLocation: currentLocations[pickupId] || availableLocs[0],
      dropoffLocation: currentLocations[dropoffId] || availableLocs[1] || availableLocs[0],
      items: items,
      fee: fee,
      totalCost: estimatedCost,
      notes: typeText.trim() ? `Jenis: ${typeText.trim()}${notes.trim() ? `\n${notes.trim()}` : ""}` : notes,
      customerName: customerName.trim() || "Kak Kiah Sentosa",
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim()
    });

    // Reset Form
    setTitle("");
    setItems([{ id: "1", name: "Item Tempahan Baru", quantity: 1 }]);
    setNotes("");
  };

  const handleSelectShop = (shop: Location) => {
    // Pilih kedai berdaftar → tukar ke tab custom & set pickup
    setPickupId(shop.id);
    setActiveTab("custom");
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/15 text-amber-500 border-amber-500/30";
      case "ACCEPTED":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
      case "ARRIVED_STORE":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "DELIVERING":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "ARRIVED_DESTINATION":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "COMPLETED":
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  const getStatusTextMalay = (status: string) => {
    switch (status) {
      case "PENDING": return "Mencari Runner...";
      case "ACCEPTED": return "Runner Ditemui";
      case "ARRIVED_STORE": return "Runner di Lokasi";
      case "DELIVERING": return "Runner Sedang OTW";
      case "ARRIVED_DESTINATION": return "Runner Dah Sampai!";
      case "COMPLETED": return "Kerja Selesai!";
      default: return status;
    }
  };

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
      case "MOTORCYCLE": return <Bike className="w-3 h-3 text-amber-400" />;
      case "CAR": return <Car className="w-3 h-3 text-sky-400" />;
      case "PICKUP": return <Truck className="w-3 h-3 text-indigo-400" />;
      case "LORRY": return <Truck className="w-3 h-3 text-rose-400" />;
      default: return <Bike className="w-3 h-3 text-amber-400" />;
    }
  };

  const getOrderIcon = (type: OrderType) => {
    switch (type) {
      case "FOOD": 
        return <Utensils className="w-5 h-5 text-orange-400" />;
      case "GROCERY": 
        return <ShoppingBag className="w-5 h-5 text-amber-400" />;
      case "PARCEL": 
        return <Package className="w-5 h-5 text-indigo-400" />;
      case "HEAVY_LIFTING": 
        return <Truck className="w-5 h-5 text-red-400" />;
      case "CLEANING": 
        return <Scissors className="w-5 h-5 text-emerald-400" />;
      case "QUEUING": 
        return <Users className="w-5 h-5 text-teal-400" />;
      case "ODD_JOBS": 
        return <HelpCircle className="w-5 h-5 text-fuchsia-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Customer Contact Details (Wajib) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">Maklumat Pelanggan (Hubungi WhatsApp)</h3>
            <p className="text-[10px] text-slate-400 leading-normal">
              Sila isi nama dan nombor WhatsApp aktif supaya runner boleh chat & menghubungi anda.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Nama Anda</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="cth: Kak Kiah Sentosa"
              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
              <span>Nombor WhatsApp <span className="text-rose-500 font-bold">* Wajib</span></span>
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="cth: 011-1234567"
              className={`w-full bg-slate-950 border focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono ${
                !customerPhone.trim() ? "border-rose-500/30 ring-1 ring-rose-500/10 animate-pulse" : "border-slate-850"
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
            <span>Alamat Penghantaran / Rumah Anda <span className="text-rose-500 font-bold">* Wajib</span></span>
          </label>
          <input
            type="text"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="cth: No 12, Lorong 4, Taman Sentosa, Rengit"
            className={`w-full bg-slate-950 border focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none ${
              !customerAddress.trim() ? "border-rose-500/30 ring-1 ring-rose-500/10 animate-pulse" : "border-slate-850"
            }`}
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-full">
        <button
          onClick={() => setActiveTab("template")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "template"
              ? "bg-slate-800 text-white shadow-md border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Kedai Berdaftar</span>
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "custom"
              ? "bg-slate-800 text-white shadow-md border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Servis Khas (Custom)</span>
        </button>
      </div>

      {/* Main Order Placer Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex-1 flex flex-col overflow-y-auto max-h-[480px]">
        {activeTab === "template" ? (
          <div className="flex flex-col gap-4">
            <div className="text-slate-400 text-xs leading-relaxed">
              Pilih kedai atau perkhidmatan berdaftar di bawah. Senarai ini diurus oleh Admin.
            </div>
            {(() => {
              const shops = Object.values(currentLocations).filter((l) => l.type === "shop");
              if (shops.length === 0) {
                return (
                  <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center">
                    <MapPin className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">Belum ada kedai berdaftar.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Admin perlu daftar kedai dahulu di Panel Admin.</p>
                  </div>
                );
              }
              // Padding sehingga 9 slot supaya kelihatan sebagai grid 3x3 walaupun kedai kurang
              const slotCount = Math.max(9, Math.ceil(shops.length / 3) * 3);
              const slots: (Location | null)[] = Array.from({ length: slotCount }, (_, i) => shops[i] || null);
              return (
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3">
                  <div className="grid grid-cols-3 gap-2.5">
                    {slots.map((shop, idx) => {
                      if (!shop) {
                        return (
                          <div
                            key={`empty-${idx}`}
                            className="aspect-square rounded-xl border border-dashed border-slate-800/70 bg-slate-900/30 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4 text-slate-700" />
                          </div>
                        );
                      }
                      return (
                        <button
                          key={shop.id}
                          type="button"
                          onClick={() => handleSelectShop(shop)}
                          className="aspect-square rounded-xl bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 transition-all flex flex-col items-center justify-center p-2 gap-1.5 cursor-pointer group"
                          title={`${shop.name}${shop.address ? " — " + shop.address : ""}`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-amber-500/50 flex items-center justify-center overflow-hidden">
                            {shop.logoUrl ? (
                              <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-amber-400" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-200 group-hover:text-amber-300 text-center leading-tight line-clamp-2">
                            {shop.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>


        ) : (
          <form onSubmit={handleSubmitCustomOrder} className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tajuk Servis Runner</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Tolong angkat peti sejuk ke tingkat 2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Pilih Kenderaan Runner</span>
                {weather === "rainy" && (
                  <span className="text-[9px] text-amber-400 font-bold animate-pulse">⚡ Hujan Lebat: Syor upah diselaraskan (+RM3-RM5)</span>
                )}
                {weather === "sunny" && (
                  <span className="text-[9px] text-indigo-400 font-normal">Sila pilih kenderaan yang sepadan dengan saiz barang</span>
                )}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { id: "MOTORCYCLE" as const, label: "Motorsikal", desc: "Makanan & barang kecil", icon: Bike, activeClass: "border-amber-500/80 bg-amber-500/10 text-amber-300 ring-2 ring-amber-500/20" },
                  { id: "CAR" as const, label: "Kereta", desc: "Barang runcit / cuaca hujan", icon: Car, activeClass: "border-sky-500/80 bg-sky-500/10 text-sky-300 ring-2 ring-sky-500/20" },
                  { id: "PICKUP" as const, label: "Pickup Truck", desc: "Barang sederhana / pindah", icon: Truck, activeClass: "border-indigo-500/80 bg-indigo-500/10 text-indigo-300 ring-2 ring-indigo-500/20" },
                  { id: "LORRY" as const, label: "Lori", desc: "Perabot besar / pindah rumah", icon: Truck, activeClass: "border-rose-500/80 bg-rose-500/10 text-rose-300 ring-2 ring-rose-500/20" }
                ].map((veh) => {
                  const Icon = veh.icon;
                  const isSelected = vehicleType === veh.id;
                  const recommendedFee = getDynamicDefaultFee(veh.id);
                  return (
                    <button
                      key={veh.id}
                      type="button"
                      onClick={() => {
                        setVehicleType(veh.id);
                        // Auto-adjust default fee when selecting vehicle to provide super fluid UX
                        setFee(recommendedFee);
                      }}
                      className={`flex flex-col items-center justify-center text-center p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? veh.activeClass 
                          : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-1.5 ${isSelected ? 'animate-bounce' : ''}`} />
                      <span className="text-[11px] font-black">{veh.label}</span>
                      <span className="text-[8px] text-slate-500 mt-0.5 leading-tight">{veh.desc}</span>
                      <span className="text-[9px] font-bold text-emerald-400 font-mono mt-1">Syor: RM {recommendedFee}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Types & Upah Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Jenis Tugasan</label>
                <input
                  type="text"
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                  placeholder="cth: Beli ubat di farmasi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                  <span>Upah Runner (RM)</span>
                  <span className="text-[8px] text-amber-500 font-bold">Min: RM {minFee.toFixed(2)}</span>
                </label>
                <input
                  type="number"
                  min={minFee}
                  max="200"
                  step="0.5"
                  value={fee}
                  onChange={(e) => setFee(parseFloat(e.target.value) || minFee)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Pickup & Dropoff Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1 text-amber-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Titik Mula / Kedai</span>
                </label>
                <select
                  value={pickupId}
                  onChange={(e) => setPickupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {Object.values(currentLocations).map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1 text-sky-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Destinasi Hantar</span>
                </label>
                <select
                  value={dropoffId}
                  onChange={(e) => setDropoffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {Object.values(currentLocations).map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Maklumat Hubungi Kedai (Jika Ada) */}
            {(() => {
              const selectedPickup = currentLocations[pickupId];
              if (selectedPickup && selectedPickup.phone) {
                return (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Phone className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider leading-none mb-1">Mahu semak status kedai?</p>
                        <p className="text-white font-semibold leading-normal">
                          {selectedPickup.name}: <span className="font-mono font-black text-amber-400">{selectedPickup.phone}</span>
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedPickup.phone}`}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-md shadow-amber-500/15"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Hubungi</span>
                    </a>
                  </div>
                );
              }
              return null;
            })()}

            {/* Dynamic Items List */}
            <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-4">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Senarai Perkara / Barang</label>
              
              {/* Item Lines */}
              <div className="flex flex-col gap-1.5 max-h-[100px] overflow-y-auto mb-3 pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white">
                    <span className="font-mono text-indigo-400 mr-2">{item.quantity}x</span>
                    <span className="flex-1 text-slate-200 truncate">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-[10px] text-slate-600 italic">Tiada barang disenaraikan lagi.</p>
                )}
              </div>

              {/* Add Item Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nama tugasan/barang..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none placeholder-slate-700"
                />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  className="w-14 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-center text-indigo-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Notes & Costs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nota Khas / Pesanan Tambahan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Tolong bawa tali ikat perabot sendiri ye bro."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none placeholder-slate-700"
                />
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Anggaran Kos Belanja:</span>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-slate-900 border border-slate-800 rounded text-center text-white px-1.5 py-0.5 text-xs"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Upah Runner Bersih:</span>
                  <span className="text-emerald-400 font-mono">RM {fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-white border-t border-slate-800 pt-1.5 mt-1.5">
                  <span>Jumlah Kasar:</span>
                  <span className="text-indigo-400">RM {(estimatedCost + fee).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={items.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Hantar Permintaan Runner</span>
            </button>
          </form>
        )}
      </div>

      {/* Track Active Orders */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
          <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>Status Permintaan Anda ({orders.length})</span>
        </h3>

        <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {getOrderIcon(ord.type)}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{ord.title}</h4>
                      <span className="bg-slate-950 text-slate-300 border border-slate-800/85 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        {getVehicleIcon(ord.vehicleType)}
                        <span>{getVehicleLabelMalay(ord.vehicleType)}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                      <span>{ord.pickupLocation.name}</span>
                      <span>→</span>
                      <span>{ord.dropoffLocation.name}</span>
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${getStatusBadge(ord.status)}`}>
                  {getStatusTextMalay(ord.status)}
                </span>
              </div>

              {/* Progress Slider Track (Visual only for customer) */}
              {ord.status !== "PENDING" && ord.status !== "COMPLETED" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>Mula</span>
                    <span className="text-indigo-400 font-bold">
                      {ord.status === "ARRIVED_STORE" ? "Runner Sedang Melakukan Tugasan" : `OTW Ke Rumah: ${ord.progressPercent}%`}
                    </span>
                    <span>Hantar</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ord.status === "ARRIVED_STORE" ? 30 : Math.max(10, ord.progressPercent)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Runner Details & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                {ord.status === "PENDING" ? (
                  <span className="text-[9px] text-slate-500 italic flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Mencari runner terdekat di Taman Sentosa...
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-[10px] text-white">
                      AS
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-300 leading-tight">Ahmad Safwan</p>
                      <p className="text-[9px] text-slate-500 font-mono">Yamaha Y15 • ★4.9</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    RM {(ord.totalCost + ord.fee).toFixed(2)}
                  </span>
                  
                  {ord.status !== "PENDING" && ord.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => onOpenChat(ord)}
                      className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Sembang</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="border border-slate-800/80 border-dashed rounded-2xl p-6 text-center text-slate-500 text-xs">
              Tiada permintaan aktif hantar. Sila pilih servis mudah atau buat tugas khas di atas!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
