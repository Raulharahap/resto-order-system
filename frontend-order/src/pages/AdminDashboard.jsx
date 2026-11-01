import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import {
    Store, LayoutDashboard, ListOrdered, History, Settings,
    Clock, User, ChefHat, ConciergeBell, BellRing,
    CheckSquare, Square, AlertTriangle, MonitorPlay, RefreshCw, QrCode, LogOut,
    Volume2, VolumeX, Printer, Utensils, Flame, Coffee, Check, X, BarChart3,
    CreditCard, Ticket, Bell, ExternalLink, Lock
} from 'lucide-react';

export default function AdminDashboard({ onNavigate, onSimulateCustomer }) {
    const [orders, setOrders] = useState([]);
    const [waiterCalls, setWaiterCalls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('Semua'); // 'Semua', 'Menunggu', 'Dimasak', 'Siap'
    const [selectedStation, setSelectedStation] = useState('Semua'); // 'Semua', 'Mie', 'Dimsum', 'Minuman'
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));
    const [updatingId, setUpdatingId] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [ticketToPrint, setTicketToPrint] = useState(null);

    // Ref untuk melacak jumlah order & panggilan bantuan sebelumnya
    const prevOrdersCountRef = useRef(null);
    const prevCallsCountRef = useRef(null);

    // Audio Chime (Web Audio API Bell Synthesizer: 2-tone pleasant doorbell chime)
    const playChime = () => {
        if (isMuted) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const now = ctx.currentTime;

            // Tone 1: 587.33 Hz (D5)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now);
            gain1.gain.setValueAtTime(0.25, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.4);

            // Tone 2: 880 Hz (A5)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, now + 0.15);
            gain2.gain.setValueAtTime(0.3, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.85);
        } catch (e) {
            console.warn("Web Audio chime error:", e);
        }
    };

    // Update jam digital di navbar atas
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('id-ID'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- FETCH DATA ANTREAN PESANAN & PANGGILAN PELAYAN DARI GOLANG ---
    const fetchActiveOrders = async () => {
        try {
            const [resOrders, resCalls] = await Promise.all([
                apiService.getActiveOrders(),
                apiService.getActiveWaiterCalls().catch(() => ({ data: [] }))
            ]);

            const list = resOrders.data || [];
            const calls = resCalls.data || [];

            // Jika ada order baru masuk dibanding sebelumnya, bunyikan bel "Ting-Ting!"
            if (prevOrdersCountRef.current !== null && list.length > prevOrdersCountRef.current) {
                playChime();
            }
            // Jika ada panggilan pelayan baru masuk
            if (prevCallsCountRef.current !== null && calls.length > prevCallsCountRef.current) {
                playChime();
            }

            prevOrdersCountRef.current = list.length;
            prevCallsCountRef.current = calls.length;

            setOrders(list);
            setWaiterCalls(calls);
        } catch (err) {
            console.error("Gagal mengambil data pesanan KDS:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-polling antrean setiap 4 detik agar sinkron realtime saat ada pesanan baru
    useEffect(() => {
        fetchActiveOrders();
        const interval = setInterval(fetchActiveOrders, 4000);
        return () => clearInterval(interval);
    }, [isMuted]);

    // --- SELESAIKAN PANGGILAN PELAYAN ---
    const handleResolveCall = async (callId) => {
        try {
            await apiService.completeWaiterCall(callId);
            setWaiterCalls(prev => prev.filter(c => c.id !== callId));
        } catch (err) {
            alert(`Gagal menyelesaikan panggilan: ${err.message}`);
        }
    };

    // --- UPDATE STATUS PESANAN (Menunggu -> Dimasak -> Siap -> Selesai) ---
    const handleUpdateStatus = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            await apiService.updateOrderStatus(orderId, newStatus);
            await fetchActiveOrders();
        } catch (err) {
            alert(`Gagal memperbarui status: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    // --- TOGGLE CHECKLIST ITEM DAPUR (Selesai Racik) ---
    const handleToggleItemDone = async (orderId, itemId, currentStatus) => {
        const targetOrder = orders.find(o => o.id === orderId);
        if (targetOrder && targetOrder.status_bayar === 'Menunggu Bayar') {
            alert("⚠️ Pesanan ini belum dibayar di kasir! Dapur dilarang memproses makanan sebelum pembayaran lunas.");
            return;
        }

        try {
            // Optimistic update di local UI agar instan dan responsif
            setOrders(prevOrders =>
                prevOrders.map(order => {
                    if (order.id !== orderId) return order;
                    return {
                        ...order,
                        items: (order.items || []).map(it => {
                            if (it.id !== itemId) return it;
                            return { ...it, is_done: !currentStatus };
                        })
                    };
                })
            );

            // Kirim perubahan ke backend Golang (PATCH /order-items/:id/toggle)
            await apiService.toggleOrderItemDone(itemId);
        } catch (err) {
            console.error("Gagal toggle status item:", err);
            fetchActiveOrders();
        }
    };

    // Hitung statistik pesanan aktif
    const totalAntrean = orders.length;
    const countMenunggu = orders.filter(o => o.status === 'Menunggu').length;
    const countDimasak = orders.filter(o => o.status === 'Dimasak').length;
    const countSiap = orders.filter(o => o.status === 'Siap').length;

    // Filter daftar pesanan yang ditampilkan berdasarkan Status dan Stasiun Koki
    const displayedOrders = orders.filter(order => {
        if (filterStatus !== 'Semua' && order.status !== filterStatus) {
            return false;
        }

        if (selectedStation !== 'Semua') {
            const hasStationItem = (order.items || []).some(item => {
                const kat = (item.menu?.kategori || '').toLowerCase();
                if (selectedStation === 'Mie') return kat.includes('mie');
                if (selectedStation === 'Dimsum') return kat.includes('dimsum');
                if (selectedStation === 'Minuman') return kat.includes('minum');
                return true;
            });
            if (!hasStationItem) return false;
        }

        return true;
    });

    return (
        <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">

            {/* --- SIDEBAR KIRI --- */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0">
                <div>
                    {/* Logo & Info Outlet */}
                    <div className="p-5 flex items-center gap-3 border-b border-slate-100">
                        <div className="bg-[#b81d24] p-2 rounded-xl text-white shadow-sm">
                            <MonitorPlay size={24} />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-sm tracking-wide text-[#b81d24]">GACOAN KDS</h1>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Teuku Umar Dapur</p>
                        </div>
                    </div>

                    {/* Menu Navigasi Modul Lengkap */}
                    <div className="p-3 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 px-3 mt-2 mb-2 uppercase tracking-wider">Modul Operasional</p>
                        
                        <button
                            onClick={() => { setFilterStatus('Semua'); setSelectedStation('Semua'); }}
                            className="w-full flex items-center gap-3 bg-[#b81d24] text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-red-600/20 cursor-pointer text-left"
                        >
                            <LayoutDashboard size={18} /> Dashboard Dapur
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-cashier')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <CreditCard size={18} /> Kasir & Pembayaran
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-menu-management')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <Settings size={18} /> Manajemen Menu & Stok
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-vouchers')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <Ticket size={18} /> Kupon & Diskon
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-table-qr')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <QrCode size={18} /> Cetak Standee QR Meja
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-reports')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <BarChart3 size={18} /> Laporan & Omset
                        </button>

                        <p className="text-[10px] font-bold text-slate-400 px-3 pt-4 mb-2 uppercase tracking-wider">Akses Pelanggan</p>
                        <a
                            href="/?meja=18"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between text-slate-600 hover:bg-red-50 hover:text-red-700 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3">
                                <QrCode size={18} className="text-red-600" />
                                <span>Buka Web Pelanggan (Meja 18)</span>
                            </div>
                            <ExternalLink size={14} className="text-slate-400" />
                        </a>
                    </div>
                </div>

                {/* Bagian Bawah: Server Status & Logout */}
                <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-slate-700">Online • Dapur Aktif</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">PostgreSQL Sync Realtime</p>
                    </div>

                    <button
                        onClick={() => onNavigate && onNavigate('admin-login')}
                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                        <LogOut size={14} /> Keluar / Kunci Layar
                    </button>
                </div>
            </aside>

            {/* --- KONTEN UTAMA (KANAN) --- */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Top Navbar */}
                <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center flex-shrink-0 shadow-sm">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 leading-tight">Gacoan Kitchen Display System (KDS)</h2>
                        <p className="text-xs text-slate-500 font-medium">Outlet Teuku Umar • <span className="text-red-600 font-bold">Layar Monitor Utama</span></p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter Status Tab */}
                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setFilterStatus('Semua')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    filterStatus === 'Semua' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Semua ({totalAntrean})
                            </button>
                            <button
                                onClick={() => setFilterStatus('Menunggu')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    filterStatus === 'Menunggu' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Menunggu ({countMenunggu})
                            </button>
                            <button
                                onClick={() => setFilterStatus('Dimasak')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    filterStatus === 'Dimasak' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Dimasak ({countDimasak})
                            </button>
                            <button
                                onClick={() => setFilterStatus('Siap')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    filterStatus === 'Siap' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Siap Saji ({countSiap})
                            </button>
                        </div>

                        <div className="h-6 w-px bg-slate-200"></div>

                        {/* Tombol Audio Chime Toggle */}
                        <button
                            onClick={() => {
                                const nextState = !isMuted;
                                setIsMuted(nextState);
                                if (!nextState) playChime();
                            }}
                            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                isMuted
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                            title={isMuted ? "Suara Dapur Dinonaktifkan" : "Suara Dapur Aktif (Bel Otomatis)"}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-red-600 animate-pulse" />}
                            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Bel On'}</span>
                        </button>

                        {/* Jam Digital */}
                        <div className="flex items-center gap-1.5 text-[#b81d24] font-black text-lg tracking-wider">
                            <Clock size={18} /> {currentTime}
                        </div>

                        {/* Tombol Refresh Manual */}
                        <button
                            onClick={fetchActiveOrders}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition"
                            title="Refresh Pesanan"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </header>

                {/* --- BANNER PANGGILAN PELAYAN (EMERGENCY CALL WAITER) --- */}
                {waiterCalls.length > 0 && (
                    <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md animate-pulse">
                        <div className="flex items-center gap-2 text-xs font-extrabold">
                            <Bell size={18} className="animate-bounce" />
                            <span>PANGGILAN BANTUAN PELAYAN ({waiterCalls.length} Meja):</span>
                            <div className="flex gap-2 flex-wrap ml-2">
                                {waiterCalls.map((call) => (
                                    <span key={call.id} className="bg-white text-red-700 px-2.5 py-0.5 rounded-lg text-xs font-black shadow-sm flex items-center gap-1.5">
                                        {call.meja}: "{call.alasan}"
                                        <button
                                            onClick={() => handleResolveCall(call.id)}
                                            className="ml-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded px-1.5 py-0.2 text-[10px] font-bold cursor-pointer"
                                            title="Tandai Sudah Didatangi"
                                        >
                                            ✓ Datangi
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 hidden md:inline">
                            Klik 'Datangi' jika staf sudah melayani
                        </span>
                    </div>
                )}

                {/* Sub-header: Filter Stasiun Koki & Stats Bar */}
                <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Stasiun Koki:</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            <button
                                onClick={() => setSelectedStation('Semua')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    selectedStation === 'Semua' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Semua Stasiun
                            </button>
                            <button
                                onClick={() => setSelectedStation('Mie')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    selectedStation === 'Mie' ? 'bg-[#b81d24] text-white shadow-sm' : 'text-slate-600 hover:text-red-700'
                                }`}
                            >
                                <Flame size={12} /> Stasiun Wajan (Mie)
                            </button>
                            <button
                                onClick={() => setSelectedStation('Dimsum')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    selectedStation === 'Dimsum' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-orange-700'
                                }`}
                            >
                                <Utensils size={12} /> Dimsum & Kukusan
                            </button>
                            <button
                                onClick={() => setSelectedStation('Minuman')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    selectedStation === 'Minuman' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-700'
                                }`}
                            >
                                <Coffee size={12} /> Bar Minuman
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <span>Menunggu: <strong className="text-red-600">{countMenunggu}</strong></span>
                        <span>•</span>
                        <span>Dimasak: <strong className="text-orange-600">{countDimasak}</strong></span>
                        <span>•</span>
                        <span>Siap: <strong className="text-emerald-600">{countSiap}</strong></span>
                    </div>
                </div>

                {/* Grid Tiket Pesanan Dapur */}
                <div className="flex-1 overflow-y-auto p-4">

                    {isLoading && (
                        <div className="text-center py-20 text-slate-400 font-semibold text-sm">
                            Memuat antrean dapur dari server Golang...
                        </div>
                    )}

                    {!isLoading && displayedOrders.length === 0 && (
                        <div className="text-center py-24 space-y-3">
                            <div className="w-16 h-16 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-sm border border-slate-200 text-slate-400">
                                <ChefHat size={32} />
                            </div>
                            <h3 className="text-base font-bold text-slate-700">Dapur Sedang Santai</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Belum ada tiket pesanan dengan filter status "{filterStatus}" dan stasiun "{selectedStation}". Pesanan baru dari HP pelanggan akan otomatis berbunyi di sini!
                            </p>
                        </div>
                    )}

                    {!isLoading && displayedOrders.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                            {displayedOrders.map((order) => {
                                const isUpdating = updatingId === order.id;
                                const isCooking = order.status === 'Dimasak';
                                const isReady = order.status === 'Siap';
                                const isWaiting = order.status === 'Menunggu';
                                const isUnpaid = order.status_bayar === 'Menunggu Bayar';

                                const timeFormatted = order.created_at
                                    ? new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : 'Baru saja';

                                const totalItems = (order.items || []).length;
                                const doneItemsCount = (order.items || []).filter(it => it.is_done).length;
                                const isAllItemsDone = totalItems > 0 && doneItemsCount === totalItems;

                                return (
                                    <div
                                        key={order.id}
                                        className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-200 ${
                                            isCooking
                                                ? 'border-orange-400 ring-2 ring-orange-200'
                                                : isReady
                                                    ? 'border-emerald-400 ring-2 ring-emerald-200'
                                                    : 'border-slate-200'
                                        }`}
                                    >
                                        {/* Card Header */}
                                        <div
                                            className={`p-3 border-b flex justify-between items-center ${
                                                isCooking
                                                    ? 'bg-orange-50 border-orange-200 text-orange-800'
                                                    : isReady
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                        : 'bg-slate-800 text-white border-slate-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-black tracking-wide">
                                                    {order.nomor_antrean || `#B-${order.id}`}
                                                </span>
                                                <span className={`text-[10px] font-medium ${isCooking || isReady ? 'text-slate-500' : 'text-slate-300'}`}>
                                                    Order #{order.id}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 font-bold text-xs">
                                                    <Clock size={13} /> {timeFormatted}
                                                </div>
                                                <button
                                                    onClick={() => setTicketToPrint(order)}
                                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                                        isCooking || isReady
                                                            ? 'hover:bg-slate-200/80 text-slate-700'
                                                            : 'hover:bg-slate-700 text-slate-200'
                                                    }`}
                                                    title="Cetak Tiket Dapur (Thermal)"
                                                >
                                                    <Printer size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info Meja & Tamu */}
                                        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-red-100 text-red-600 p-1.5 rounded-lg">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">LOKASI MEJA</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <p className="text-base font-black text-slate-800 leading-tight">{order.meja}</p>
                                                        {order.nama_pelanggan && (
                                                            <span className="text-[10px] font-bold bg-red-50 text-[#b81d24] px-1.5 py-0.5 rounded border border-red-100">
                                                                👤 {order.nama_pelanggan}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded">
                                                    Dine-In • {order.jumlah_tamu || 2} Org
                                                </span>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                                    order.status_bayar === 'Menunggu Bayar'
                                                        ? 'bg-orange-100 text-orange-800 font-extrabold animate-pulse'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }`}>
                                                    {order.status_bayar === 'Menunggu Bayar' ? '🟡 Belum Bayar' : '🟢 Lunas'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Checklist Banner */}
                                        <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-100 flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-slate-500">
                                                Progres Racik: {doneItemsCount}/{totalItems} Item
                                            </span>
                                            {isAllItemsDone ? (
                                                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                                                    <Check size={12} strokeWidth={3} /> Selesai Diracik
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-medium">Klik item bila matang</span>
                                            )}
                                        </div>

                                        {/* Daftar Makanan yang Dipesan */}
                                        <div className="p-3 space-y-2 flex-1 divide-y divide-slate-100">
                                            {(order.items || []).map((item, idx) => {
                                                const isItemDone = Boolean(item.is_done);
                                                const itemKategori = (item.menu?.kategori || '').toLowerCase();
                                                const isMatchingStation = selectedStation === 'Semua' || itemKategori.includes(selectedStation.toLowerCase());

                                                return (
                                                    <div
                                                        key={item.id || idx}
                                                        onClick={() => handleToggleItemDone(order.id, item.id, isItemDone)}
                                                        className={`pt-2 first:pt-0 cursor-pointer rounded-xl p-2 transition-colors ${
                                                            isItemDone
                                                                ? 'bg-emerald-50/50 opacity-60'
                                                                : 'hover:bg-slate-50'
                                                        } ${!isMatchingStation ? 'opacity-40' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex items-start gap-2 flex-1">
                                                                <button
                                                                    type="button"
                                                                    className={`mt-0.5 p-0.5 rounded transition ${
                                                                        isItemDone ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                                                                    }`}
                                                                >
                                                                    {isItemDone ? (
                                                                        <CheckSquare size={17} className="text-emerald-600 fill-emerald-100" />
                                                                    ) : (
                                                                        <Square size={17} />
                                                                    )}
                                                                </button>
                                                                <div className="flex-1">
                                                                    <h4 className={`text-xs font-bold leading-snug ${
                                                                        isItemDone ? 'line-through text-slate-500' : 'text-slate-800'
                                                                    }`}>
                                                                        <span className="text-[#b81d24] font-black mr-1 text-sm">{item.qty}x</span>
                                                                        {item.menu?.nama || `Menu #${item.menu_id}`}
                                                                    </h4>

                                                                    <div className="flex items-center gap-1.5 mt-1">
                                                                        {item.level_pedas > 0 ? (
                                                                            <span className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                                                                🔥 Lv {item.level_pedas}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="bg-slate-100 text-slate-500 text-[9px] font-medium px-1.5 py-0.5 rounded">
                                                                                Standar
                                                                            </span>
                                                                        )}
                                                                        {item.menu?.kategori && (
                                                                            <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                                                                {item.menu.kategori}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {item.catatan && (
                                                                        <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 font-medium inline-block">
                                                                            Catatan: "{item.catatan}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Catatan Meja Umum */}
                                        {order.catatan_meja && (
                                            <div className="mx-3 mb-2 p-2 bg-orange-50 border border-orange-100 rounded-xl text-[10px] text-orange-800">
                                                <span className="font-bold">Catatan Meja:</span> "{order.catatan_meja}"
                                            </div>
                                        )}

                                        {/* Footer Tombol Aksi Koki */}
                                        <div className="p-2.5 border-t border-slate-100 bg-slate-50 space-y-2">
                                            {isWaiting && isUnpaid && (
                                                <div className="space-y-1.5">
                                                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2 flex items-center justify-between text-[11px] font-bold">
                                                        <div className="flex items-center gap-1.5">
                                                            <Lock size={14} className="text-amber-600 flex-shrink-0" />
                                                            <span>Menunggu Bayar di Kasir</span>
                                                        </div>
                                                        <span className="text-[9px] bg-amber-200/90 text-amber-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                                            Belum Lunas
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-not-allowed select-none"
                                                        title="Pembayaran belum diverifikasi oleh kasir. Dapur dilarang memasak sebelum lunas."
                                                    >
                                                        <Lock size={14} /> Terkunci (Belum Bayar)
                                                    </button>
                                                </div>
                                            )}

                                            {isWaiting && !isUnpaid && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'Dimasak')}
                                                    disabled={isUpdating}
                                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 shadow-sm transition cursor-pointer"
                                                >
                                                    <ChefHat size={15} /> Mulai Masak (Ambil Tiket)
                                                </button>
                                            )}

                                            {isCooking && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'Siap')}
                                                    disabled={isUpdating}
                                                    className="w-full bg-[#b81d24] hover:bg-red-800 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 shadow-sm transition cursor-pointer"
                                                >
                                                    <CheckSquare size={15} /> Tandai Siap Saji
                                                </button>
                                            )}

                                            {isReady && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'Selesai')}
                                                    disabled={isUpdating}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 shadow-sm transition cursor-pointer"
                                                >
                                                    <ConciergeBell size={15} /> Selesaikan Pesanan (Diantar)
                                                </button>
                                            )}

                                            {/* Fallback jika pesanan berstatus Dibatalkan atau status lain */}
                                            {!isWaiting && !isCooking && !isReady && (
                                                <div className="space-y-1.5">
                                                    <div className="text-center py-1 text-[11px] font-bold text-red-600 bg-red-50 rounded-lg border border-red-100">
                                                        Status Tiket: {order.status || 'Dibatalkan'}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'Dimasak')}
                                                            disabled={isUpdating}
                                                            className="py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-[11px] flex justify-center items-center gap-1 transition cursor-pointer"
                                                        >
                                                            <ChefHat size={13} /> Mulai Masak
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'Selesai')}
                                                            disabled={isUpdating}
                                                            className="py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-[11px] flex justify-center items-center gap-1 transition cursor-pointer"
                                                        >
                                                            Arsipkan Selesai
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* --- MODAL CETAK TIKET DAPUR (THERMAL 58mm / 80mm) --- */}
            {ticketToPrint && (
                <div
                    onClick={() => setTicketToPrint(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                    >
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Printer size={18} className="text-red-400" />
                                <h3 className="font-extrabold text-sm">Tiket Dapur Thermal</h3>
                            </div>
                            <button
                                onClick={() => setTicketToPrint(null)}
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 bg-slate-100 flex-1 overflow-y-auto">
                            <div
                                id="thermal-kitchen-ticket"
                                className="bg-white p-5 rounded-lg shadow-sm border border-slate-300 font-mono text-slate-900 text-xs leading-relaxed"
                            >
                                <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                                    <h4 className="font-black text-sm tracking-wider">TIKET DAPUR GACOAN</h4>
                                    <p className="text-[10px]">Outlet Teuku Umar</p>
                                </div>

                                <div className="space-y-0.5 mb-2 text-[11px]">
                                    <div className="flex justify-between font-bold">
                                        <span>ANTREAN : {ticketToPrint.nomor_antrean || `#B-${ticketToPrint.id}`}</span>
                                        <span>{ticketToPrint.meja}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 text-[10px]">
                                        <span>Order #{ticketToPrint.id}</span>
                                        <span>{new Date(ticketToPrint.created_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-600">
                                        {ticketToPrint.nama_pelanggan && <span className="font-bold text-slate-900">👤 {ticketToPrint.nama_pelanggan} • </span>}
                                        Tamu: {ticketToPrint.jumlah_tamu || 2} Orang • {ticketToPrint.metode_bayar || 'QRIS'}
                                    </div>
                                </div>

                                <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-2 my-2">
                                    {(ticketToPrint.items || []).map((item, idx) => (
                                        <div key={idx} className="space-y-0.5">
                                            <div className="flex justify-between items-start font-bold">
                                                <span className="text-[12px]">{item.qty}x {item.menu?.nama || `Menu #${item.menu_id}`}</span>
                                                <span className="text-[10px] font-normal border border-slate-400 px-1 rounded">
                                                    [ ]
                                                </span>
                                            </div>
                                            {item.level_pedas > 0 && (
                                                <div className="text-[11px] font-black text-red-700 pl-4">
                                                    ** LEVEL {item.level_pedas} **
                                                </div>
                                            )}
                                            {item.catatan && (
                                                <div className="text-[10px] italic text-slate-600 pl-4">
                                                    Note: "{item.catatan}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {ticketToPrint.catatan_meja && (
                                    <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px]">
                                        <span className="font-bold">NOTE MEJA:</span> {ticketToPrint.catatan_meja}
                                    </div>
                                )}

                                <div className="text-center text-[9px] text-slate-500 pt-1">
                                    *** SIAPKAN TEPAT WAKTU & RAPI ***
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => setTicketToPrint(null)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-2.5 bg-[#b81d24] text-white rounded-xl text-xs font-bold hover:bg-red-800 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30"
                            >
                                <Printer size={15} /> Cetak (Thermal)
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}