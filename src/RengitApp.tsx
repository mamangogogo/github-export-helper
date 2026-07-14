/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Order, OrderStatus, OrderType, VehicleType, Location, ChatMessage, RunnerStats, MAP_LOCATIONS, Runner } from "./types";
import LiveDashboard from "./components/LiveDashboard";
import CustomerPanel from "./components/CustomerPanel";
import RunnerPanel from "./components/RunnerPanel";
import AdminPanel from "./components/AdminPanel";
import ChatBox from "./components/ChatBox";
import AuthModal from "./components/AuthModal";
import { useSession } from "./hooks/useSession";
import { useShops } from "./hooks/useShops";
import { useRunners as useRunnersDB } from "./hooks/useRunners";
import {
  Bike, User, ShoppingBag, Plus, Sparkles, Navigation, CheckCircle2,
  MessageSquare, DollarSign, TrendingUp, Compass, HeartPulse, Info, HelpCircle, Shield, LogIn, LogOut
} from "lucide-react";

export default function App() {
  const navigate = useNavigate();
  const { session, role, loading: authLoading, signOut } = useSession();

  const [activeMode, setActiveMode] = useState<"customer" | "runner" | "admin">("customer");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [weather, setWeather] = useState<"sunny" | "rainy">("sunny");
  const [demandLevel, setDemandLevel] = useState<"normal" | "high" | "peak">("high");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMapLocation, setSelectedMapLocation] = useState<Location | null>(null);

  // DB-backed shops (merged with the built-in map locations for demo)
  const { shops: dbShops, addShop, deleteShop } = useShops();
  const locations: { [key: string]: Location } = { ...MAP_LOCATIONS, ...dbShops };

  // Chat state
  const [chattingOrderId, setChattingOrderId] = useState<string | null>(null);
  const [chats, setChats] = useState<{ [orderId: string]: ChatMessage[] }>({});
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);

  // DB-backed runners with local stat overlay (stats increment locally until orders persist)
  const { runners: dbRunners, addRunner, deleteRunner, updateRunnerVehicles } = useRunnersDB();
  const [runnerStatOverlay, setRunnerStatOverlay] = useState<{ [id: string]: Partial<RunnerStats> }>({});
  const runners: Runner[] = dbRunners.length > 0
    ? dbRunners.map(r => ({ ...r, stats: { ...r.stats, ...(runnerStatOverlay[r.id] || {}) } }))
    : [];
  const setRunners = (_: any) => { /* handled via DB hook; overlay used for stats */ };

  const [selectedRunnerId, setSelectedRunnerId] = useState<string>("");
  const [loggedInRunnerId, setLoggedInRunnerId] = useState<string | null>(null);

  // Default-select first runner once loaded
  useEffect(() => {
    if (!selectedRunnerId && runners.length > 0) {
      setSelectedRunnerId(runners[0].id);
    }
  }, [runners, selectedRunnerId]);

  // Auto-keluar dari mod admin/runner jika tiada session atau peranan tidak layak
  useEffect(() => {
    if (activeMode === "admin" && role !== "admin") setActiveMode("customer");
  }, [activeMode, role]);

  // Financial configurations
  const [minFee, setMinFee] = useState<number>(5.00);
  const [commissionRate, setCommissionRate] = useState<number>(10); // percent commission
  const [adminRevenue, setAdminRevenue] = useState<number>(4.20); // starts with commission from pre-completed orders
  const [baseFees, setBaseFees] = useState<{
    MOTORCYCLE: { normal: number; rainy: number };
    CAR: { normal: number; rainy: number };
    PICKUP: { normal: number; rainy: number };
    LORRY: { normal: number; rainy: number };
  }>({
    MOTORCYCLE: { normal: 6.00, rainy: 9.00 },
    CAR: { normal: 12.00, rainy: 15.00 },
    PICKUP: { normal: 25.00, rainy: 28.00 },
    LORRY: { normal: 45.00, rainy: 50.00 }
  });

  // Derive active runner and runnerStats dynamically (fallback jika tiada runner didaftar lagi)
  const FALLBACK_STATS: RunnerStats = {
    completedDeliveries: 0, totalEarnings: 0, activeStreak: 0, rating: 5.0,
    todayEarnings: 0, level: 1, fuelSaved: 0,
  };
  const activeRunner = runners.find(r => r.id === selectedRunnerId) || runners[0] || null;
  const runnerStats = activeRunner?.stats || FALLBACK_STATS;

  // Active accepted order for the current runner
  const activeOrder = orders.find(o => o.runnerId === selectedRunnerId && o.status !== "COMPLETED") || null;

  // Initialize with some default pending jobs to populate the runner's board on startup
  useEffect(() => {
    const initialOrders: Order[] = [
      {
        id: "job-1",
        title: "Belikan Pisang Goreng Panas & Karipap",
        type: "FOOD",
        vehicleType: "MOTORCYCLE",
        status: "PENDING",
        pickupLocation: MAP_LOCATIONS.pak_ayob,
        dropoffLocation: MAP_LOCATIONS.flat_sentosa,
        items: [
          { id: "p1", name: "Pisang Goreng RM5", quantity: 1, completed: false },
          { id: "p2", name: "Karipap Kentang", quantity: 5, completed: false }
        ],
        fee: 6.00,
        totalCost: 10.00,
        notes: "Cari gerai sebelah pokok besar ya, sambal kicap nak lebih.",
        customerName: "Kak Shida Flat B",
        customerPhone: "019-2233445",
        createdAt: new Date().toLocaleTimeString(),
        progressPercent: 0
      },
      {
        id: "job-2",
        title: "Angkat Almari Jati & Meja Makan",
        type: "HEAVY_LIFTING",
        vehicleType: "LORRY",
        status: "PENDING",
        pickupLocation: MAP_LOCATIONS.perabot_jati,
        dropoffLocation: MAP_LOCATIONS.kondo_harmoni,
        items: [
          { id: "a1", name: "Almari Jati 2 Pintu", quantity: 1, completed: false },
          { id: "a2", name: "Meja Makan Bulat", quantity: 1, completed: false }
        ],
        fee: 35.00,
        totalCost: 0,
        notes: "Kena bawa tali ikat kuat-kuat atas motor/lori. Saya tolong angkat sekali.",
        customerName: "Abang Kamal",
        customerPhone: "012-9988776",
        createdAt: new Date().toLocaleTimeString(),
        progressPercent: 0
      }
    ];

    setOrders(initialOrders);
    
    // Set up default chats for these orders
    const initialChats: { [orderId: string]: ChatMessage[] } = {};
    initialOrders.forEach(o => {
      initialChats[o.id] = [
        {
          id: `sys-${Date.now()}-1`,
          sender: "system",
          text: `Tempahan "${o.title}" telah diposkan ke papan tugasan.`,
          timestamp: o.createdAt
        }
      ];
    });
    setChats(initialChats);
  }, []);

  // Handle map landmark selection (injects into custom form)
  const handleSelectMapLocation = (location: Location) => {
    setSelectedMapLocation(location);
    // Visual alert confirmation
    const message = `Lokasi "${location.name}" dipilih sebagai ${location.type === 'shop' ? 'Titik Mula (Pickup)' : 'Destinasi (Dropoff)'}.`;
    addSystemNotification(message);
  };

  const addSystemNotification = (text: string) => {
    // Show a floating notification in the UI
    const notificationContainer = document.getElementById("toast-container");
    if (notificationContainer) {
      const toast = document.createElement("div");
      toast.className = "bg-indigo-600 border border-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 transform transition-all translate-y-10 opacity-0 duration-300";
      toast.innerHTML = `
        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
        <span>${text}</span>
      `;
      notificationContainer.appendChild(toast);
      
      // Animate entry
      setTimeout(() => {
        toast.className = "bg-indigo-600 border border-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 transform transition-all translate-y-0 opacity-100 duration-300";
      }, 50);

      // Dismiss after 4s
      setTimeout(() => {
        toast.className = "bg-indigo-600 border border-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 transform transition-all translate-y-10 opacity-0 duration-300";
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  };

  // Customer creates a new order
  const handleCreateOrder = (orderData: Partial<Order>) => {
    const newId = `order-${Date.now()}`;
    const newOrder: Order = {
      id: newId,
      title: orderData.title || "Tugasan Mudah",
      type: orderData.type || "FOOD",
      vehicleType: orderData.vehicleType || "MOTORCYCLE",
      status: "PENDING",
      pickupLocation: orderData.pickupLocation || locations.pak_ayob || MAP_LOCATIONS.pak_ayob,
      dropoffLocation: orderData.dropoffLocation || locations.flat_sentosa || MAP_LOCATIONS.flat_sentosa,
      items: orderData.items || [],
      fee: orderData.fee || 6.00,
      totalCost: orderData.totalCost || 0,
      notes: orderData.notes || "",
      customerName: orderData.customerName || "Pelanggan Sentosa",
      customerPhone: orderData.customerPhone || "011-1234567",
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      progressPercent: 0
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Add system chat message
    setChats(prev => ({
      ...prev,
      [newId]: [
        {
          id: `sys-${Date.now()}`,
          sender: "system",
          text: "Tempahan anda telah didaftarkan. Menunggu Runner menerima tugasan...",
          timestamp: newOrder.createdAt
        }
      ]
    }));

    addSystemNotification("Tempahan Baru Berjaya Dihantar!");
  };

  // Runner accepts a pending order
  const handleAcceptOrder = (orderId: string) => {
    // Check if runner already has an active order
    if (activeOrder) {
      alert("Anda mempunyai satu tugasan aktif yang belum selesai. Sila selesaikan tugasan tersebut dahulu!");
      return;
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: "ACCEPTED", runnerId: selectedRunnerId };
      }
      return o;
    }));

    // System event in chat
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appendChatMessage(orderId, "system", `Runner ${activeRunner?.name || "Runner"} bersetuju untuk menguruskan tugasan anda!`, timeStr);
    
    // Delay greeting from customer to simulate natural interaction
    setTimeout(() => {
      appendChatMessage(orderId, "customer", "Cun bro! Terima kasih banyak sudi ambil job saya ni.", timeStr);
    }, 1200);

    addSystemNotification("Tugasan Diterima! Bersedia untuk ke lokasi.");
  };

  // Update order delivery status
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status };
      }
      return o;
    }));

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Context-dependent system logs & client automatic trigger responses
    let sysMsg = "";
    let customerReply = "";

    switch (status) {
      case "ARRIVED_STORE":
        sysMsg = "Runner telah sampai di lokasi pickup (Kedai). Sedang membeli barangan...";
        customerReply = "Okay bro, tolong check elok-elok ya barang tu. Terima kasih.";
        break;
      case "DELIVERING":
        sysMsg = "Runner telah melengkapkan pembelian dan kini sedang dalam perjalanan (OTW) hantar.";
        customerReply = "Cun! Hati-hati bawa motor tu bro. Jalan basah ni.";
        break;
      case "ARRIVED_DESTINATION":
        sysMsg = "Runner telah sampai di destinasi anda!";
        customerReply = "Ok orait jap saya keluar, tgh turun lif ni bro.";
        break;
      case "COMPLETED":
        sysMsg = "Penghantaran selesai sepenuhnya. Pembayaran upah telah dikreditkan ke baki Runner.";
        break;
    }

    if (sysMsg) {
      appendChatMessage(orderId, "system", sysMsg, timeStr);
    }

    if (customerReply && status !== "COMPLETED") {
      setTimeout(() => {
        appendChatMessage(orderId, "customer", customerReply, timeStr);
      }, 1500);
    }

    // Handle runner rewards state on final completion
    if (status === "COMPLETED") {
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        // Calculate platform commission and runner net fee
        const commission = parseFloat(((targetOrder.fee * commissionRate) / 100).toFixed(2));
        const runnerNet = parseFloat((targetOrder.fee - commission).toFixed(2));

        setAdminRevenue(prev => parseFloat((prev + commission).toFixed(2)));

        // Update stat overlay for the completing runner
        const targetRunnerId = targetOrder.runnerId || selectedRunnerId;
        const currentRunner = runners.find(r => r.id === targetRunnerId);
        if (currentRunner) {
          const prev = currentRunner.stats;
          setRunnerStatOverlay(o => ({
            ...o,
            [targetRunnerId]: {
              completedDeliveries: prev.completedDeliveries + 1,
              totalEarnings: parseFloat((prev.totalEarnings + runnerNet).toFixed(2)),
              todayEarnings: parseFloat((prev.todayEarnings + runnerNet).toFixed(2)),
              activeStreak: prev.activeStreak + 1,
              level: Math.floor((prev.completedDeliveries + 1) / 3) + 1,
              fuelSaved: parseFloat((prev.fuelSaved + 0.35).toFixed(2)),
            },
          }));
        }
        addSystemNotification(`Job Selesai! RM ${runnerNet.toFixed(2)} dikreditkan ke dompet Runner (Komisen Admin RM ${commission.toFixed(2)} ditolak).`);
      }
    }
  };

  // Track drive simulator progress percent
  const handleUpdateOrderProgress = (orderId: string, progress: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, progressPercent: progress };
      }
      return o;
    }));
  };

  // Tick off items at the store
  const handleUpdateOrderChecklist = (orderId: string, itemId: string, completed: boolean) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(i => {
          if (i.id === itemId) return { ...i, completed };
          return i;
        });
        return { ...o, items: updatedItems };
      }
      return o;
    }));
  };

  // Shared messaging engine
  const appendChatMessage = (orderId: string, sender: "runner" | "customer" | "system", text: string, timestamp?: string) => {
    const time = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      sender,
      text,
      timestamp: time
    };

    setChats(prev => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newMsg]
    }));
  };

  // Send message (manual chat between runner and customer/admin)
  const handleSendMessage = async (orderId: string, text: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appendChatMessage(orderId, "runner", text, timeStr);
  };


  const handleOpenChat = (order: Order) => {
    setChattingOrderId(order.id);
  };

  const handleUpdateOrderFee = (orderId: string, fee: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, fee } : o));
    addSystemNotification(`Upah pesanan dikemaskini: RM ${fee.toFixed(2)}`);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    addSystemNotification("Tempahan berjaya dibatalkan oleh Admin.");
  };

  const handleResetPlatformData = () => {
    // Reset local overlays (DB kedai/runner tak diusik)
    setRunnerStatOverlay({});
    if (runners.length > 0) setSelectedRunnerId(runners[0].id);

    const initialOrders: Order[] = [
      {
        id: "job-1",
        title: "Belikan Pisang Goreng Panas & Karipap",
        type: "FOOD",
        vehicleType: "MOTORCYCLE",
        status: "PENDING",
        pickupLocation: MAP_LOCATIONS.pak_ayob,
        dropoffLocation: MAP_LOCATIONS.flat_sentosa,
        items: [
          { id: "p1", name: "Pisang Goreng RM5", quantity: 1, completed: false },
          { id: "p2", name: "Karipap Kentang", quantity: 5, completed: false }
        ],
        fee: 6.00,
        totalCost: 10.00,
        notes: "Cari gerai sebelah pokok besar ya, sambal kicap nak lebih.",
        customerName: "Kak Shida Flat B",
        customerPhone: "019-2233445",
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        progressPercent: 0
      },
      {
        id: "job-2",
        title: "Angkat Almari Jati & Meja Makan",
        type: "HEAVY_LIFTING",
        vehicleType: "LORRY",
        status: "PENDING",
        pickupLocation: MAP_LOCATIONS.perabot_jati,
        dropoffLocation: MAP_LOCATIONS.kondo_harmoni,
        items: [
          { id: "a1", name: "Almari Jati 2 Pintu", quantity: 1, completed: false },
          { id: "a2", name: "Meja Makan Bulat", quantity: 1, completed: false }
        ],
        fee: 35.00,
        totalCost: 0,
        notes: "Kena bawa tali ikat kuat-kuat atas motor/lori. Saya tolong angkat sekali.",
        customerName: "Abang Kamal",
        customerPhone: "012-9988776",
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        progressPercent: 0
      }
    ];
    setOrders(initialOrders);
    
    // reset chats
    const initialChats: { [orderId: string]: ChatMessage[] } = {};
    initialOrders.forEach(o => {
      initialChats[o.id] = [
        {
          id: `sys-${Date.now()}-1`,
          sender: "system",
          text: `Tempahan "${o.title}" telah diposkan ke papan tugasan.`,
          timestamp: o.createdAt
        }
       ];
    });
    setChats(initialChats);
    addSystemNotification("Platform berjaya diset semula ke keadaan asal.");
  };

  const handleInjectDemoOrder = () => {
    const demoTitles = [
      { title: "Beli Barangan Bundle Di Pasar Karat Rengit", type: "GROCERY" as OrderType, veh: "CAR" as VehicleType, fee: 15.00, cost: 40.00, notes: "Tolong cari baki bundle yang berjenama bundle vintaj di lambak.", customer: "Azrul Rengit", phone: "013-8877665" },
      { title: "Belikan Rengit Coffee & Roti Bakar", type: "FOOD" as OrderType, veh: "MOTORCYCLE" as VehicleType, fee: 6.00, cost: 14.50, notes: "Kopi original Rengit ais bungkus satu, kopi o suam satu.", customer: "Che Aminah", phone: "017-4455663" },
      { title: "Tebas Rumput Belakang Rumah", type: "CLEANING" as OrderType, veh: "PICKUP" as VehicleType, fee: 30.00, cost: 0.00, notes: "Mesin rumput saya pinjamkan minyak petrol dah beli.", customer: "Tok Ketua Kampung", phone: "019-1122334" },
      { title: "Ambil Lesen Tamat Tempoh di Pejabat JPJ", type: "QUEUING" as OrderType, veh: "MOTORCYCLE" as VehicleType, fee: 10.00, cost: 2.00, notes: "Dah beratur tolong hantar ke rumah terus ye saya tak sihat.", customer: "Cikgu Rosli", phone: "011-2334455" }
    ];
    const rand = demoTitles[Math.floor(Math.random() * demoTitles.length)];
    const newId = `job-demo-${Date.now()}`;
    const newOrder: Order = {
      id: newId,
      title: rand.title,
      type: rand.type,
      vehicleType: rand.veh,
      status: "PENDING",
      pickupLocation: MAP_LOCATIONS.pasar_raya_mesra,
      dropoffLocation: MAP_LOCATIONS.taman_indah,
      items: [{ id: "d1", name: rand.title, quantity: 1, completed: false }],
      fee: rand.fee,
      totalCost: rand.cost,
      notes: rand.notes,
      customerName: rand.customer,
      customerPhone: rand.phone,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      progressPercent: 0
    };
    setOrders(prev => [newOrder, ...prev]);
    setChats(prev => ({
      ...prev,
      [newId]: [{ id: `sys-${Date.now()}`, sender: "system", text: "Tugasan demo berjaya disuntik masuk oleh Admin.", timestamp: newOrder.createdAt }]
    }));
    addSystemNotification("Suntikan Job Demo Berjaya!");
  };

  const handleBroadcastSystemMessage = (text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChats(prev => {
      const updated = { ...prev };
      orders.forEach(o => {
        updated[o.id] = [
          ...(updated[o.id] || []),
          {
            id: `sys-broadcast-${Date.now()}-${Math.random()}`,
            sender: "system",
            text: `⚠️ PENGUMUMAN RASMI ADMIN: ${text}`,
            timestamp: timeStr
          }
        ];
      });
      return updated;
    });
    addSystemNotification(`Pengumuman Berjaya Disiarkan ke ${orders.length} sembang!`);
  };

  // Registration and deletion handlers for Locations (kedai) — kini melalui DB
  const handleRegisterLocation = async (newLoc: Location) => {
    try {
      await addShop({
        name: newLoc.name,
        address: newLoc.address,
        phone: newLoc.phone,
        logoUrl: newLoc.logoUrl,
        x: newLoc.x,
        y: newLoc.y,
      } as any);
      addSystemNotification(`Kedai "${newLoc.name}" berjaya didaftarkan!`);
    } catch (err: any) {
      alert(`Gagal daftar kedai: ${err?.message || "ralat"}`);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    // Jangan buang lokasi built-in (bukan UUID DB)
    if (MAP_LOCATIONS[id]) {
      alert("Lokasi ini adalah lokasi contoh dan tidak boleh dibuang.");
      return;
    }
    try {
      await deleteShop(id);
      addSystemNotification("Kedai berjaya dibuang.");
    } catch (err: any) {
      alert(`Gagal buang kedai: ${err?.message || "ralat"}`);
    }
  };

  // Registration and deletion handlers for Runners — kini melalui DB
  const handleRegisterRunner = async (newRunner: Runner) => {
    try {
      await addRunner({
        name: newRunner.name,
        phone: newRunner.phone,
        vehicleType: newRunner.vehicleType,
        vehicles: newRunner.vehicles || [newRunner.vehicleType],
        status: newRunner.status || "ACTIVE",
      });
      addSystemNotification(`Runner "${newRunner.name}" berjaya didaftarkan!`);
    } catch (err: any) {
      alert(`Gagal daftar runner: ${err?.message || "ralat"}`);
    }
  };

  const handleDeleteRunner = async (id: string) => {
    try {
      await deleteRunner(id);
      if (selectedRunnerId === id && runners.length > 1) {
        const next = runners.find(r => r.id !== id);
        if (next) setSelectedRunnerId(next.id);
      }
      addSystemNotification("Runner berjaya dipadam.");
    } catch (err: any) {
      alert(`Gagal padam runner: ${err?.message || "ralat"}`);
    }
  };

  const handleUpdateRunnerVehicles = async (runnerId: string, vehicles: VehicleType[]) => {
    try {
      const final = vehicles.length > 0 ? vehicles : ["MOTORCYCLE" as VehicleType];
      await updateRunnerVehicles(runnerId, final);
      addSystemNotification("Senarai kenderaan dimiliki dikemaskini.");
    } catch (err: any) {
      alert(`Gagal kemaskini: ${err?.message || "ralat"}`);
    }
  };

  const handleUpdateRunnerVehicle = (runnerId: string, vehicleType: VehicleType) => {
    // Kenderaan aktif hanya UI-level (tidak persist)
    const vehMalay = vehicleType === "MOTORCYCLE" ? "Motosikal" : vehicleType === "CAR" ? "Kereta" : vehicleType === "PICKUP" ? "Pikap" : "Lori";
    addSystemNotification(`Kenderaan aktif ditukar kepada ${vehMalay}.`);
  };

  const activeChatOrder = orders.find(o => o.id === chattingOrderId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Overlay System */}
      <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm" />

      {/* Main Header Row */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-2.5 flex items-center justify-center text-white shadow-lg shadow-indigo-600/10">
              <Bike className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Rengit Runner</h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Sangat Pantas
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih Servis • Set Upah Murah • Dapat Runner Terus!
              </p>
            </div>
          </div>

          {/* Real-time Simulator Info */}
          <div className="hidden lg:flex items-center gap-6 text-slate-400 text-xs bg-slate-900/40 border border-slate-900/60 p-2 px-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span><strong>Pekan Rengit:</strong> 8 Runner Aktif</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>Masa Padan Purata: <strong className="text-white">2.4 min</strong></div>
            <span className="text-slate-700">|</span>
            <div>Kadar Berjaya: <strong className="text-emerald-400">99.8%</strong></div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-inner self-start md:self-auto flex-wrap gap-1">
            <button
              onClick={() => {
                setActiveMode("customer");
                // Reset selected chatting if switching modes to avoid distraction
                setChattingOrderId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMode === "customer"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Mod Pelanggan</span>
            </button>
            <button
              onClick={() => {
                setActiveMode("runner");
                setChattingOrderId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMode === "runner"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Mod Runner</span>
            </button>
            <button
              onClick={() => {
                if (!session) {
                  setAuthModalOpen(true);
                  return;
                }
                if (role !== "admin") {
                  alert("Akaun anda tiada akses admin. Sila log masuk dengan akaun admin.");
                  return;
                }
                setActiveMode("admin");
                setChattingOrderId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMode === "admin"
                  ? "bg-rose-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Mod Admin</span>
              {!session && <LogIn className="w-3 h-3 opacity-60" />}
            </button>
          </div>

          {/* Auth chip — hanya papar bila sudah log masuk */}
          {session && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                {role === "admin" ? "👑 Admin" : role === "runner" ? "🏍️ Runner" : "👤 Pengguna"}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          )}

        </div>
      </header>

      {/* App Main Body layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live Operations Dashboard (Span 5) */}
        <section id="live-operations-grid" className="lg:col-span-5 h-full flex flex-col gap-4">
          <LiveDashboard 
            activeOrder={activeOrder} 
            orders={orders}
            weather={weather}
            demandLevel={demandLevel}
          />

          {/* Quick instructions / Help guide */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-slate-400">
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">Panduan Simulasi Rengit:</p>
              <ol className="list-decimal ml-4 mt-1 space-y-1 text-slate-300">
                <li>Sedia borang di <strong className="text-indigo-400">Portal Pelanggan</strong> untuk mendaftar penghantaran barang/makanan.</li>
                <li>Pilih jenis kenderaan yang sepadan dengan saiz barangan anda (e.g. Lori untuk sofa Pasar Karat).</li>
                <li>Tukar ke <strong className="text-emerald-400">Mod Runner</strong> di atas untuk mula mengambil & melaksana tugasan.</li>
                <li>Berbual terus dengan <strong className="text-amber-400">Simulasi AI Pelanggan</strong> secara real-time!</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Right Column: Workflow Panels based on Mode Selector (Span 7) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Active Mode Banner */}
          <div className={`p-4 rounded-3xl border flex items-center justify-between shadow-xl transition-all duration-300 ${
            activeMode === "customer" 
              ? "bg-indigo-950/20 border-indigo-900/50 text-indigo-200" 
              : activeMode === "runner"
                ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-200"
                : "bg-rose-950/20 border-rose-900/50 text-rose-200"
          }`}>
            <div className="flex items-center gap-3">
              <span className={`p-2.5 rounded-2xl flex items-center justify-center ${
                activeMode === "customer" 
                  ? "bg-indigo-900/40 text-indigo-400" 
                  : activeMode === "runner"
                    ? "bg-emerald-900/40 text-emerald-400"
                    : "bg-rose-900/40 text-rose-400"
              }`}>
                {activeMode === "customer" ? (
                  <ShoppingBag className="w-5 h-5" />
                ) : activeMode === "runner" ? (
                  <Bike className="w-5 h-5" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </span>
              <div>
                <h2 className="text-sm font-black text-white">
                  {activeMode === "customer" 
                    ? "Portal Utama Pelanggan" 
                    : activeMode === "runner"
                      ? "Hab Tugasan Runner Rengit"
                      : "Pusat Kawalan & Pemantauan Sistem"
                  }
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeMode === "customer" 
                    ? "Sila pilih sebarang servis segera di bawah atau buat tugasan khas mengikut upah pilihan anda." 
                    : activeMode === "runner"
                      ? "Pilih dan ambil job pembawa barang yang diposkan oleh penduduk setempat."
                      : "Uruskan tempahan, ubah parameter simulasi cuaca/permintaan, dan pantau metrik operasi."
                  }
                </p>
              </div>
            </div>

            <div className={`text-[10px] font-mono px-3 py-1 rounded-full border uppercase ${
              activeMode === "customer" 
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                : activeMode === "runner"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              {activeMode}
            </div>
          </div>

          {/* Dynamic Module Panel */}
          {activeMode === "customer" ? (
            <CustomerPanel 
              orders={orders} 
              onCreateOrder={handleCreateOrder} 
              onOpenChat={handleOpenChat}
              selectedMapLocation={selectedMapLocation}
              weather={weather}
              locations={locations}
              minFee={minFee}
              baseFees={baseFees}
            />
          ) : activeMode === "runner" ? (
            <RunnerPanel 
              orders={orders}
              activeOrder={activeOrder}
              stats={runnerStats}
              onAcceptOrder={handleAcceptOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateOrderProgress={handleUpdateOrderProgress}
              onUpdateOrderChecklist={handleUpdateOrderChecklist}
              onOpenChat={handleOpenChat}
              onSendMessage={handleSendMessage}
              runners={runners}
              selectedRunnerId={selectedRunnerId}
              onSelectRunner={setSelectedRunnerId}
              loggedInRunnerId={loggedInRunnerId}
              onLoginRunner={(id) => {
                setLoggedInRunnerId(id);
                setSelectedRunnerId(id);
              }}
              onLogoutRunner={() => {
                setLoggedInRunnerId(null);
              }}
              onUpdateRunnerVehicle={handleUpdateRunnerVehicle}
            />
          ) : (
            <AdminPanel
              orders={orders}
              weather={weather}
              demandLevel={demandLevel}
              onChangeWeather={setWeather}
              onChangeDemandLevel={setDemandLevel}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateOrderFee={handleUpdateOrderFee}
              onCancelOrder={handleCancelOrder}
              onResetPlatformData={handleResetPlatformData}
              onInjectDemoOrder={handleInjectDemoOrder}
              onBroadcastSystemMessage={handleBroadcastSystemMessage}
              locations={locations}
              onRegisterLocation={handleRegisterLocation}
              onDeleteLocation={handleDeleteLocation}
              runners={runners}
              onRegisterRunner={handleRegisterRunner}
              onDeleteRunner={handleDeleteRunner}
              onUpdateRunnerVehicles={handleUpdateRunnerVehicles}
              minFee={minFee}
              onChangeMinFee={setMinFee}
              commissionRate={commissionRate}
              onChangeCommissionRate={setCommissionRate}
              adminRevenue={adminRevenue}
              baseFees={baseFees}
              onChangeBaseFees={setBaseFees}
            />
          )}

        </section>

      </main>

      {/* Floating Chat Overlay (Always reachable if chat is open) */}
      {activeChatOrder && (
        <div className="fixed bottom-6 right-6 z-40 p-1">
          <ChatBox
            order={activeChatOrder}
            chatHistory={chats[activeChatOrder.id] || []}
            currentUserRole={activeMode === "runner" ? "runner" : "customer"}
            isTyping={isCustomerTyping}
            onSendMessage={(text) => handleSendMessage(activeChatOrder.id, text)}
            onClose={() => setChattingOrderId(null)}
          />
        </div>
      )}

      {/* Compact footer */}
      <footer className="mt-auto py-6 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 Rengit Runner Inc. Dioptimumkan untuk kelajuan melampau dan kemudahan runner setempat.</p>
      </footer>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
