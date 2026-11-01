import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
    MonitorPlay, LayoutDashboard, Settings, BarChart3,
    Clock, RefreshCw, QrCode, LogOut, Printer, TrendingUp,
    DollarSign, ShoppingBag, Award, CreditCard, Calendar,
    Receipt, CheckCircle2, Flame, ArrowUpRight, Ticket, ExternalLink
} from 'lucide-react';

export default function AdminReports({ onNavigate, onSimulateCustomer }) {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('id-ID'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- FETCH DATA LAPORAN & RIWAYAT DARI GOLANG (GET /reports/summary & GET /orders/history) ---
    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            const [sumRes, histRes] = await Promise.all([
                apiService.getSalesReport(),
                apiService.getOrderHistory()
            ]);
            setSummary(sumRes.data || {});
            setHistory(histRes.data || []);
        } catch (err) {
            console.error("Gagal memuat laporan penjualan:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    // Perhitungan Metrik Tambahan
    const totalOmset = summary?.total_omset || 0;
    const totalPesanan = summary?.total_pesanan || 0;
    const pesananSelesai = summary?.pesanan_selesai || 0;
    const pesananAktif = summary?.pesanan_aktif || 0;
    const aov = pesananSelesai > 0 ? Math.round(totalOmset / pesananSelesai) : 0;

    const bestSellers = summary?.best_sellers || [];
    const metodeBayar = summary?.metode_bayar || {};

    return (
        <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">

            {/* --- SIDEBAR KIRI --- */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0">
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
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left"
                        >
                            <LayoutDashboard size={18} /> Dashboard Dapur
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-cashier')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left"
                        >
                            <CreditCard size={18} /> Kasir & Pembayaran
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-menu-management')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left"
                        >
                            <Settings size={18} /> Manajemen Menu & Stok
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-vouchers')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left"
                        >
                            <Ticket size={18} /> Kupon & Diskon
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-table-qr')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left"
                        >
                            <QrCode size={18} /> Cetak Standee QR Meja
                        </button>

                        <button className="w-full flex items-center gap-3 bg-[#b81d24] text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-red-600/20 cursor-pointer text-left">
                            <BarChart3 size={18} /> Laporan & Omset
                        </button>

                        <p className="text-[10px] font-bold text-slate-400 px-3 pt-4 mb-2 uppercase tracking-wider">Akses Pelanggan</p>
                        <a
                            href="/?meja=18"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between text-slate-600 hover:bg-red-50 hover:text-red-700 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left"
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATA ANALITIK LIVE</p>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{pesananSelesai} Transaksi Tercatat</span>
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
                <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center flex-shrink-0 shadow-sm">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                            LAPORAN PENJUALAN & OMSET <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px]">REALTIME POSTGRESQL</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Outlet Teuku Umar • Rekap Transaksi & Analisis Menu Terlaris</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm">
                            <Clock size={16} className="text-[#b81d24]" /> {currentTime}
                        </div>
                        <button
                            onClick={fetchReportData}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                            title="Refresh Data Laporan"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 bg-[#b81d24] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-red-800 transition cursor-pointer"
                        >
                            <Printer size={15} /> Cetak Rekap
                        </button>
                    </div>
                </header>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Omset */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL OMSET RESTO</p>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                        Rp {totalOmset.toLocaleString('id-ID')}
                                    </h3>
                                    <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                                        <ArrowUpRight size={14} /> Terverifikasi Masuk
                                    </p>
                                </div>
                                <div className="p-3 bg-red-50 text-[#b81d24] rounded-2xl">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Total Pesanan */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL PESANAN</p>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                        {totalPesanan} <span className="text-sm font-bold text-slate-400">Tiket</span>
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1.5">
                                        Semua meja terdaftar
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <ShoppingBag size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Pesanan Selesai */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PESANAN SELESAI</p>
                                    <h3 className="text-2xl font-black text-emerald-600 leading-tight">
                                        {pesananSelesai} <span className="text-sm font-bold text-emerald-400">Lunas</span>
                                    </h3>
                                    <p className="text-[10px] text-orange-600 font-bold mt-1.5">
                                        {pesananAktif} Pesanan masih aktif
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <CheckCircle2 size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Average Order Value (AOV) */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RATA-RATA MEJA (AOV)</p>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                        Rp {aov.toLocaleString('id-ID')}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1.5">
                                        Per transaksi meja selesai
                                    </p>
                                </div>
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Best Sellers & Pembayaran */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* 2 Cols: Menu Terlaris (Best Sellers) */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                                        <Award size={18} className="text-amber-500" /> Menu Terlaris (Best Sellers)
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Peringkat menu paling sering dipesan pelanggan</p>
                                </div>
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                                    Top Rankings
                                </span>
                            </div>

                            {bestSellers.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-8">Belum ada transaksi selesai untuk dianalisis.</p>
                            ) : (
                                <div className="space-y-3">
                                    {bestSellers.map((item, idx) => {
                                        const maxQty = bestSellers[0]?.total_qty || 1;
                                        const percentage = Math.round((item.total_qty / maxQty) * 100);
                                        const rankColors = [
                                            'bg-amber-400 text-white',
                                            'bg-slate-300 text-slate-700',
                                            'bg-amber-700 text-white',
                                            'bg-slate-100 text-slate-600'
                                        ];

                                        return (
                                            <div key={idx} className="space-y-1.5">
                                                <div className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${rankColors[idx] || rankColors[3]}`}>
                                                            {idx + 1}
                                                        </span>
                                                        <span className="font-bold text-slate-800">{item.nama_menu || item.nama}</span>
                                                    </div>
                                                    <span className="font-extrabold text-[#b81d24]">
                                                        {item.total_qty} <span className="text-[10px] font-medium text-slate-400">Porsi ({item.kategori || 'Menu'})</span>
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-[#b81d24] h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 1 Col: Metode Pembayaran Breakdown */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                                    <CreditCard size={18} className="text-blue-600" /> Metode Pembayaran
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Distribusi pilihan pembayaran tamu</p>
                            </div>

                            <div className="space-y-3 pt-1">
                                {Array.isArray(metodeBayar) && metodeBayar.length > 0 ? (
                                    metodeBayar.map((mb, idx) => (
                                        <div key={idx} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${mb.metode_bayar?.toLowerCase().includes('qris') ? 'bg-red-600' : 'bg-emerald-600'}`}></div>
                                                <span className="text-xs font-bold text-slate-700">{mb.metode_bayar || 'Metode Lain'}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-extrabold text-slate-900 block">
                                                    {mb.total || 0} Transaksi
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    Rp {(mb.jumlah_uang || 0).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-slate-50 p-3 rounded-xl text-center text-xs text-slate-400">
                                        Belum ada data pembayaran transaksi.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Bottom Section: Riwayat Transaksi Selesai */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                                    <Receipt size={16} className="text-slate-600" /> Riwayat Transaksi Selesai
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Daftar pesanan yang telah diantar dan diselesaikan di dapur</p>
                            </div>
                            <span className="text-xs font-bold text-slate-500">
                                {history.length} Data Transaksi
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 tracking-wider uppercase border-b border-slate-200">
                                        <th className="p-4">ORDER ID</th>
                                        <th className="py-4">MEJA</th>
                                        <th className="py-4">WAKTU PESAN</th>
                                        <th className="py-4">RINCIAN ITEM</th>
                                        <th className="py-4">METODE BAYAR</th>
                                        <th className="py-4 font-bold text-right pr-4">TOTAL TRANSAKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((order) => {
                                        const timeFormatted = order.created_at
                                            ? new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                            : '-';

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-black text-slate-800">
                                                    {order.nomor_antrean || `#B-${order.id}`}
                                                    <span className="block text-[10px] font-normal text-slate-400">Order #{order.id}</span>
                                                </td>
                                                <td className="py-3 font-extrabold text-slate-700">
                                                    {order.meja}
                                                </td>
                                                <td className="py-3 text-slate-500">
                                                    {timeFormatted}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <div className="space-y-0.5">
                                                        {(order.items || []).map((item, idx) => (
                                                            <div key={idx} className="text-[11px] text-slate-700">
                                                                <span className="font-bold">{item.qty}x</span> {item.menu?.nama || `Menu #${item.menu_id}`}
                                                                {item.level_pedas > 0 && (
                                                                    <span className="text-red-600 font-bold ml-1 text-[9px]">(Lv {item.level_pedas})</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                                        {order.metode_bayar || 'QRIS'}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-right font-extrabold text-slate-900 text-sm">
                                                    Rp {(order.total_harga || 0).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {!isLoading && history.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                                                Belum ada riwayat pesanan selesai.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>

        </div>
    );
}