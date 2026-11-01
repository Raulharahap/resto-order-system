import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
    MonitorPlay, LayoutDashboard, Settings, BarChart3,
    QrCode, LogOut, Printer, Search, RefreshCw, CreditCard,
    DollarSign, CheckCircle2, Clock, User, AlertCircle,
    ArrowRight, X, Receipt, Ticket, Sparkles, ChefHat, ExternalLink
} from 'lucide-react';

export default function AdminCashier({ onNavigate, onSimulateCustomer }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('menunggu'); // 'menunggu', 'lunas', 'semua'
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));

    // State Modal Bayar Tunai
    const [activePayOrder, setActivePayOrder] = useState(null);
    const [cashReceived, setCashReceived] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [receiptOrder, setReceiptOrder] = useState(null);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('id-ID'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch data pesanan kasir
    const fetchCashierOrders = async () => {
        setIsLoading(true);
        try {
            const res = await apiService.getCashierOrders();
            setOrders(res.data || []);
        } catch (err) {
            console.error("Gagal memuat pesanan kasir:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCashierOrders();
        const interval = setInterval(fetchCashierOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    // Proses Bayar Tunai
    const handleConfirmPayment = async (e) => {
        e.preventDefault();
        if (!activePayOrder) return;

        const nominal = parseInt(cashReceived, 10) || 0;
        if (nominal < activePayOrder.total_harga) {
            alert(`Uang diterima (Rp ${nominal.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${activePayOrder.total_harga.toLocaleString('id-ID')})!`);
            return;
        }

        setIsProcessing(true);
        try {
            const res = await apiService.payCashOrder(activePayOrder.id, nominal);
            const updatedOrder = res.data || {
                ...activePayOrder,
                status_bayar: 'Lunas',
                uang_diterima: nominal,
                kembalian: nominal - activePayOrder.total_harga
            };

            // Buka struk thermal
            setReceiptOrder(updatedOrder);
            setActivePayOrder(null);
            setCashReceived('');
            await fetchCashierOrders();
        } catch (err) {
            alert(`Gagal memproses pembayaran: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Kasir membatalkan pesanan (jika fiktif/iseng atau tamu batal makan)
    const handleCancelOrder = async (orderId, meja, nama) => {
        const info = nama ? `${meja} (${nama})` : meja;
        if (!window.confirm(`Yakin ingin membatalkan pesanan untuk ${info}? Antrean akan dibatalkan.`)) {
            return;
        }
        try {
            await apiService.cancelOrder(orderId);
            await fetchCashierOrders();
        } catch (err) {
            alert(`Gagal membatalkan pesanan: ${err.message}`);
        }
    };

    // Filter Pesanan
    const filteredOrders = orders.filter((order) => {
        const matchesSearch = !searchQuery.trim() ||
            (order.nomor_antrean && order.nomor_antrean.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (order.nama_pelanggan && order.nama_pelanggan.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (order.meja && order.meja.toLowerCase().includes(searchQuery.toLowerCase())) ||
            String(order.id).includes(searchQuery);

        if (!matchesSearch) return false;

        const isCancelled = order.status === 'Dibatalkan' || order.status_bayar === 'Dibatalkan' || order.status_bayar === 'Expired';
        const isLunas = order.status_bayar === 'Lunas';
        const isTunaiPending = !isCancelled && !isLunas && (order.status_bayar === 'Menunggu Bayar' || (order.metode_bayar && order.metode_bayar.toLowerCase().includes('tunai')));

        if (filterTab === 'menunggu') return isTunaiPending;
        if (filterTab === 'lunas') return isLunas && !isCancelled;
        if (filterTab === 'dibatalkan') return isCancelled;
        // Tab semua transaksi aktif: sembunyikan yang dibatalkan
        return !isCancelled;
    });

    const pendingCashCount = orders.filter(o => {
        const isCancelled = o.status === 'Dibatalkan' || o.status_bayar === 'Dibatalkan' || o.status_bayar === 'Expired';
        return !isCancelled && (o.status_bayar === 'Menunggu Bayar' || (o.metode_bayar && o.metode_bayar.toLowerCase().includes('tunai') && o.status_bayar !== 'Lunas'));
    }).length;

    const cancelledCount = orders.filter(o => o.status === 'Dibatalkan' || o.status_bayar === 'Dibatalkan' || o.status_bayar === 'Expired').length;

    // Kalkulator Kembalian
    const currentNominal = parseInt(cashReceived, 10) || 0;
    const currentChange = activePayOrder ? currentNominal - activePayOrder.total_harga : 0;

    return (
        <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">

            {/* --- SIDEBAR KIRI --- */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 print:hidden">
                <div>
                    {/* Logo & Outlet */}
                    <div className="p-5 flex items-center gap-3 border-b border-slate-100">
                        <div className="bg-[#b81d24] p-2 rounded-xl text-white shadow-sm">
                            <MonitorPlay size={24} />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-sm tracking-wide text-[#b81d24]">GACOAN KDS</h1>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">KITCHEN PORTAL</p>
                        </div>
                    </div>

                    {/* Navigasi Modul */}
                    <div className="p-3 space-y-1">
                        <button
                            onClick={() => onNavigate && onNavigate('admin-dashboard')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <LayoutDashboard size={18} /> Dashboard Dapur
                        </button>

                        <button className="w-full flex items-center gap-3 bg-[#b81d24] text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-red-600/20 cursor-pointer text-left">
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

                {/* Status Server & Logout */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KASIR POS AKTIF</p>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{pendingCashCount} Antrean Butuh Bayar</span>
                    </div>
                    <button
                        onClick={() => onNavigate && onNavigate('admin-login')}
                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                        <LogOut size={14} /> Keluar / Kunci Layar
                    </button>
                </div>
            </aside>

            {/* --- KONTEN UTAMA --- */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">

                {/* Top Navbar */}
                <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center flex-shrink-0 shadow-sm print:hidden">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                            MEJA KASIR & VALIDASI PEMBAYARAN <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px]">POS SYSTEM</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Outlet Teuku Umar • Terima Pembayaran Tunai & Validasi Transaksi Tamu</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm">
                            <Clock size={16} className="text-[#b81d24]" /> {currentTime}
                        </div>
                        <button
                            onClick={fetchCashierOrders}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                            title="Refresh Data Kasir"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </header>

                {/* Search & Tabs Filter */}
                <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nomor meja, antrean (#B-42), atau order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-500"
                        />
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1 flex-wrap">
                        <button
                            onClick={() => setFilterTab('menunggu')}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                filterTab === 'menunggu' ? 'bg-[#b81d24] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Menunggu Bayar Kasir ({pendingCashCount})
                        </button>
                        <button
                            onClick={() => setFilterTab('lunas')}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                filterTab === 'lunas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Sudah Lunas
                        </button>
                        <button
                            onClick={() => setFilterTab('semua')}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                filterTab === 'semua' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Semua Transaksi Aktif
                        </button>
                        {cancelledCount > 0 && (
                            <button
                                onClick={() => setFilterTab('dibatalkan')}
                                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                    filterTab === 'dibatalkan' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-slate-400 hover:text-red-700'
                                }`}
                            >
                                Batal / Expired ({cancelledCount})
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="text-center py-20 text-slate-400 font-bold text-xs">
                            Memuat data pesanan kasir dari server Golang...
                        </div>
                    )}

                    {!isLoading && filteredOrders.length === 0 && (
                        <div className="text-center py-24 space-y-2">
                            <CreditCard size={36} className="mx-auto text-slate-300" />
                            <h3 className="font-bold text-slate-700 text-sm">Tidak Ada Transaksi</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Belum ada transaksi yang sesuai dengan tab filter "{filterTab}".
                            </p>
                        </div>
                    )}

                    {!isLoading && filteredOrders.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredOrders.map((order) => {
                                const isPending = order.status_bayar === 'Menunggu Bayar' ||
                                    (order.metode_bayar && order.metode_bayar.toLowerCase().includes('tunai') && order.status_bayar !== 'Lunas');

                                return (
                                    <div
                                        key={order.id}
                                        className={`bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col justify-between transition ${
                                            isPending ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'
                                        }`}
                                    >
                                        <div>
                                            {/* Header Card */}
                                            <div className={`p-4 border-b flex justify-between items-center ${
                                                isPending ? 'bg-orange-50/80 border-orange-100 text-orange-900' : 'bg-slate-50 border-slate-100 text-slate-700'
                                            }`}>
                                                <div>
                                                    <span className="font-black text-base">{order.nomor_antrean || `#B-${order.id}`}</span>
                                                    <span className="text-[10px] text-slate-400 ml-2">Order #{order.id}</span>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                                    isPending ? 'bg-orange-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {isPending ? 'Bayar di Kasir' : 'Lunas'}
                                                </span>
                                            </div>

                                            {/* Info Meja & Jam */}
                                            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-xl bg-red-100 text-[#b81d24] flex items-center justify-center font-black">
                                                        <User size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h4 className="font-extrabold text-slate-800">{order.meja}</h4>
                                                            {order.nama_pelanggan && (
                                                                <span className="bg-red-50 text-[#b81d24] text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">
                                                                    👤 {order.nama_pelanggan}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{order.jumlah_tamu || 2} Tamu</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400">Metode Bayar:</p>
                                                    <p className="font-bold text-slate-700">{order.metode_bayar || 'QRIS'}</p>
                                                </div>
                                            </div>

                                            {/* Rincian Menu */}
                                            <div className="p-4 space-y-2 text-xs divide-y divide-slate-100">
                                                {(order.items || []).map((item, idx) => (
                                                    <div key={idx} className="pt-2 first:pt-0 flex justify-between items-start">
                                                        <div>
                                                            <span className="font-bold text-slate-800">{item.qty}x {item.menu?.nama || `Menu #${item.menu_id}`}</span>
                                                            {item.level_pedas > 0 && (
                                                                <span className="text-red-600 font-bold text-[10px] ml-1">🔥 Lv {item.level_pedas}</span>
                                                            )}
                                                            {item.catatan && (
                                                                <p className="text-[10px] text-slate-400 italic">"{item.catatan}"</p>
                                                            )}
                                                        </div>
                                                        <span className="font-extrabold text-slate-900 whitespace-nowrap ml-2">
                                                            Rp {(item.harga_satuan * item.qty).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Diskon Voucher jika ada */}
                                            {order.diskon > 0 && (
                                                <div className="mx-4 mb-2 p-2 bg-emerald-50 rounded-xl flex justify-between items-center text-[10px] text-emerald-800 font-bold border border-emerald-100">
                                                    <span>🎟️ Diskon Voucher ({order.kode_voucher}):</span>
                                                    <span>- Rp {order.diskon.toLocaleString('id-ID')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Total & Action Footer */}
                                        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Total Tagihan:</span>
                                                <span className="text-lg font-black text-[#b81d24]">
                                                    Rp {(order.total_harga || 0).toLocaleString('id-ID')}
                                                </span>
                                            </div>

                                            {isPending ? (
                                                <div className="space-y-2">
                                                    <button
                                                        onClick={() => {
                                                            setActivePayOrder(order);
                                                            setCashReceived(String(order.total_harga));
                                                        }}
                                                        className="w-full py-3 bg-[#b81d24] hover:bg-red-800 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                                                    >
                                                        <DollarSign size={16} /> Terima Uang & Proses Bayar
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id, order.meja, order.nama_pelanggan)}
                                                        className="w-full py-1.5 text-[11px] text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <X size={13} /> Batalkan Pesanan (Iseng / Batal)
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setReceiptOrder(order)}
                                                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                                                >
                                                    <Receipt size={15} /> Cetak Ulang Struk
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* --- MODAL TERIMA PEMBAYARAN TUNAI --- */}
            {activePayOrder && (
                <div
                    onClick={() => setActivePayOrder(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 duration-200"
                    >
                        <div className="bg-[#b81d24] text-white p-5 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-base">Pembayaran Kasir: {activePayOrder.nomor_antrean}</h3>
                                <p className="text-red-200 text-xs">
                                    {activePayOrder.meja}
                                    {activePayOrder.nama_pelanggan && ` • Tamu: ${activePayOrder.nama_pelanggan}`} • Total Rp {activePayOrder.total_harga.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <button
                                onClick={() => setActivePayOrder(null)}
                                className="p-1 hover:bg-white/20 rounded-full text-white cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
                            {/* Input Uang Diterima */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Nominal Uang Tunai Diterima (Rp) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={activePayOrder.total_harga}
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    placeholder="Masukkan uang yang diberikan tamu"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:border-red-500 text-slate-900"
                                    autoFocus
                                />
                            </div>

                            {/* Tombol Uang Cepat (Quick Cash) */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">PILIHAN UANG CEPAT:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCashReceived(String(activePayOrder.total_harga))}
                                        className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                                    >
                                        Uang Pas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCashReceived(String(Math.ceil(activePayOrder.total_harga / 50000) * 50000 || 50000))}
                                        className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                                    >
                                        50 Ribu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCashReceived(String(Math.ceil(activePayOrder.total_harga / 100000) * 100000 || 100000))}
                                        className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                                    >
                                        100 Ribu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCashReceived(String(200000))}
                                        className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                                    >
                                        200 Ribu
                                    </button>
                                </div>
                            </div>

                            {/* Kotak Kalkulasi Kembalian */}
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                                <div className="flex justify-between text-xs text-emerald-800">
                                    <span>Total Tagihan:</span>
                                    <span>Rp {activePayOrder.total_harga.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-xs text-emerald-800">
                                    <span>Uang Diterima:</span>
                                    <span>Rp {currentNominal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-base font-black text-emerald-700 border-t border-emerald-200 pt-2">
                                    <span>UANG KEMBALIAN:</span>
                                    <span>Rp {Math.max(0, currentChange).toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setActivePayOrder(null)}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing || currentNominal < activePayOrder.total_harga}
                                    className="flex-1 py-3 bg-[#b81d24] text-white rounded-2xl text-xs font-extrabold hover:bg-red-800 transition cursor-pointer shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isProcessing ? 'Memproses...' : 'Lunas & Kirim Dapur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL CETAK STRUK RESMI KASIR (58mm / 80mm) --- */}
            {receiptOrder && (
                <div
                    onClick={() => setReceiptOrder(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
                    >
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Receipt size={18} className="text-emerald-400" />
                                <h3 className="font-extrabold text-sm">Struk Kasir Resmi</h3>
                            </div>
                            <button
                                onClick={() => setReceiptOrder(null)}
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 bg-slate-100 flex-1 overflow-y-auto">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-300 font-mono text-slate-900 text-xs leading-relaxed space-y-3">
                                <div className="text-center border-b border-dashed border-slate-400 pb-3">
                                    <h4 className="font-black text-sm tracking-widest uppercase">MIE GACOAN RESTO</h4>
                                    <p className="text-[10px] text-slate-600">Cabang Teuku Umar - Bali</p>
                                    <p className="text-[9px] text-slate-500">Struk Pembayaran Kasir</p>
                                </div>

                                <div className="text-[10px] space-y-0.5 text-slate-700">
                                    <div className="flex justify-between">
                                        <span>No. Antrean:</span>
                                        <span className="font-bold text-slate-900">{receiptOrder.nomor_antrean}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Meja:</span>
                                        <span className="font-bold text-slate-900">{receiptOrder.meja}</span>
                                    </div>
                                    {receiptOrder.nama_pelanggan && (
                                        <div className="flex justify-between">
                                            <span>Pelanggan:</span>
                                            <span className="font-bold text-slate-900">{receiptOrder.nama_pelanggan}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Kasir / Staff:</span>
                                        <span>Kasir Depan (POS-01)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Waktu:</span>
                                        <span>{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <div className="border-t border-b border-dashed border-slate-400 py-2.5 space-y-1.5">
                                    {(receiptOrder.items || []).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold">{item.qty}x {item.menu?.nama || `Menu #${item.menu_id}`}</span>
                                                {item.level_pedas > 0 && <span className="text-red-600 text-[9px] block">* Lv {item.level_pedas}</span>}
                                            </div>
                                            <span className="font-bold">Rp {(item.harga_satuan * item.qty).toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 text-[11px]">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal Tagihan:</span>
                                        <span>Rp {(receiptOrder.total_harga + (receiptOrder.diskon || 0)).toLocaleString('id-ID')}</span>
                                    </div>
                                    {receiptOrder.diskon > 0 && (
                                        <div className="flex justify-between text-emerald-700 font-bold">
                                            <span>Diskon Voucher ({receiptOrder.kode_voucher}):</span>
                                            <span>- Rp {receiptOrder.diskon.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-black text-sm border-t border-dashed border-slate-400 pt-1 text-slate-900">
                                        <span>TOTAL AKHIR:</span>
                                        <span>Rp {receiptOrder.total_harga.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-700 pt-1">
                                        <span>Uang Diterima:</span>
                                        <span className="font-bold">Rp {(receiptOrder.uang_diterima || receiptOrder.total_harga).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 font-extrabold">
                                        <span>UANG KEMBALIAN:</span>
                                        <span>Rp {(receiptOrder.kembalian || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                                        <span>Status:</span>
                                        <span className="font-bold text-emerald-600">LUNAS (KASIR)</span>
                                    </div>
                                </div>

                                <div className="text-center border-t border-dashed border-slate-400 pt-3 space-y-1">
                                    <p className="font-bold text-[10px]">TERIMA KASIH ATAS KUNJUNGANNYA</p>
                                    <p className="text-[8px] text-slate-400">Selamat Menikmati Hidangan Anda</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => setReceiptOrder(null)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-2.5 bg-[#b81d24] text-white rounded-xl text-xs font-bold hover:bg-red-800 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30"
                            >
                                <Printer size={15} /> Cetak Struk
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
