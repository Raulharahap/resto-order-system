import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
    Store, RefreshCw, Bell, Utensils, CheckCircle2, ChefHat,
    ConciergeBell, Receipt, PlusCircle, Armchair, Check, ImageOff,
    Clock, Printer, X, Download, Share2
} from 'lucide-react';

export default function TrackingScreen({ onTambahPesanan, onResetOrder, orderData, latestOrder }) {
    const [liveOrder, setLiveOrder] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState('Baru saja');
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    // State Panggil Pelayan Interaktif
    const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
    const [waiterReason, setWaiterReason] = useState('Minta Sendok / Garpu');
    const [waiterNote, setWaiterNote] = useState('');
    const [isCallingWaiter, setIsCallingWaiter] = useState(false);
    const [waiterSuccessMsg, setWaiterSuccessMsg] = useState('');

    const backendOrderId = latestOrder?.backendOrderId || latestOrder?.id;

    // --- FETCH LIVE ORDER STATUS DARI GOLANG (GET /orders/:id) ---
    const fetchLiveOrder = async () => {
        if (!backendOrderId) return;
        setIsRefreshing(true);
        try {
            const res = await apiService.getOrderById(backendOrderId);
            if (res.data) {
                setLiveOrder(res.data);
                const now = new Date();
                setLastUpdated(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            }
        } catch (err) {
            console.error("Gagal refresh status pesanan dari backend:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Auto-refresh setiap 5 detik agar realtime mengikuti update dari KDS dapur
    useEffect(() => {
        fetchLiveOrder();
        const interval = setInterval(fetchLiveOrder, 5000);
        return () => clearInterval(interval);
    }, [backendOrderId]);

    // Data gabungan (Live dari backend Golang jika ada, fallback ke prop latestOrder)
    const currentOrder = liveOrder || latestOrder || {};
    const meja = currentOrder.meja || orderData?.meja || 'Meja 18';
    const namaPelanggan = currentOrder.nama_pelanggan || latestOrder?.namaPelanggan || orderData?.nama || '';
    const orderId = currentOrder.nomor_antrean || latestOrder?.orderId || '#B-42';
    const orderCode = latestOrder?.orderCode || `GC-${currentOrder.id || '1842'}`;
    const statusPesanan = currentOrder.status || 'Menunggu'; // Menunggu, Dimasak, Siap, Selesai
    const isCash = currentOrder.metode_bayar
        ? currentOrder.metode_bayar.toLowerCase().includes('tunai') || currentOrder.metode_bayar.toLowerCase().includes('cash')
        : (latestOrder?.paymentMethod === 'cash');
    const catatanMeja = currentOrder.catatan_meja || latestOrder?.catatanMeja;

    // Normalisasi daftar item
    let displayItems = [];
    if (liveOrder && liveOrder.items && liveOrder.items.length > 0) {
        displayItems = liveOrder.items.map((item, idx) => ({
            id: item.id || idx,
            nama: item.menu?.nama || `Menu #${item.menu_id}`,
            harga: item.harga_satuan,
            qty: item.qty,
            levelPedas: item.level_pedas,
            subdesc: item.level_pedas > 0 ? `🔥 Level ${item.level_pedas}` : 'Siap Saji (Standar)',
            note: item.catatan,
            status: item.is_done ? 'Selesai Dimasak' : (statusPesanan === 'Dimasak' ? 'Sedang Dimasak' : 'Dalam Antrean'),
            img: item.menu?.gambar || ''
        }));
    } else if (latestOrder && latestOrder.items && latestOrder.items.length > 0) {
        displayItems = latestOrder.items.map((item, idx) => ({
            id: item.id || idx,
            nama: item.nama,
            harga: item.harga,
            qty: item.qty,
            levelPedas: item.selectedLevel,
            subdesc: item.selectedLevel ? `🔥 Level ${item.selectedLevel}` : (item.badge || 'Siap Saji'),
            note: item.note,
            status: statusPesanan === 'Dimasak' ? 'Sedang Dimasak' : 'Menunggu Dapur',
            img: item.gambar || item.img
        }));
    } else {
        displayItems = [
            {
                id: 1,
                nama: "Mie Gacoan Lv 2",
                harga: 11500,
                qty: 1,
                levelPedas: 2,
                subdesc: "🔥 Level 2",
                status: "Dalam Antrean",
                img: ""
            }
        ];
    }

    const subtotal = displayItems.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const pb1Pajak = Math.round(subtotal * 0.1);
    const totalHarga = currentOrder.total_harga || (subtotal + pb1Pajak);

    const handlePanggilPelayan = () => {
        setIsWaiterModalOpen(true);
    };

    const handleSubmitWaiterCall = async (e) => {
        if (e) e.preventDefault();
        setIsCallingWaiter(true);
        try {
            await apiService.createWaiterCall({
                meja: meja,
                alasan: waiterReason || 'Bantuan Umum',
                catatan: waiterNote
            });
            setIsWaiterModalOpen(false);
            setWaiterSuccessMsg(`🔔 Pelayan telah dipanggil untuk ${meja}! Staf akan segera datang membawakan ${waiterReason}.`);
            setWaiterNote('');
            setTimeout(() => setWaiterSuccessMsg(''), 7000);
        } catch (err) {
            alert(`Gagal memanggil pelayan: ${err.message}`);
        } finally {
            setIsCallingWaiter(false);
        }
    };

    const handleStrukDigital = () => {
        setIsReceiptOpen(true);
    };

    // Helper penentu badge status utama
    const getStatusBadge = () => {
        switch (statusPesanan) {
            case 'Dimasak':
                return {
                    label: 'Sedang Dimasak',
                    color: 'bg-orange-100/90 text-orange-700 border-orange-200',
                    icon: <ChefHat size={13} className="animate-bounce" />,
                    estimate: '5 - 10 Menit'
                };
            case 'Siap':
                return {
                    label: 'Siap Disajikan',
                    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    icon: <ConciergeBell size={13} />,
                    estimate: 'Sedang Diantar'
                };
            case 'Selesai':
                return {
                    label: 'Pesanan Selesai',
                    color: 'bg-blue-100 text-blue-800 border-blue-200',
                    icon: <CheckCircle2 size={13} />,
                    estimate: 'Selamat Menikmati'
                };
            case 'Dibatalkan':
                return {
                    label: 'Pesanan Dibatalkan',
                    color: 'bg-red-100 text-red-800 border-red-200',
                    icon: <X size={13} />,
                    estimate: 'Dibatalkan Kasir / Expired'
                };
            default: // Menunggu
                return {
                    label: 'Menunggu Dapur',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: <Clock size={13} />,
                    estimate: '10 - 15 Menit'
                };
        }
    };

    const statusBadge = getStatusBadge();

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center">
            <div className="w-full max-w-md bg-slate-50 relative pb-10 shadow-sm font-sans">

                {/* --- HEADER --- */}
                <div className="px-5 pt-6 pb-4 flex justify-between items-start bg-white sticky top-0 z-10 shadow-sm">
                    <div className="flex gap-2">
                        <Store size={18} className="text-red-600 mt-0.5" />
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Outlet Gacoan Teuku Umar</h2>
                            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5 tracking-wider uppercase">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span>LIVE STATUS DAPUR</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchLiveOrder}
                            className={`w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-200 cursor-pointer transition ${isRefreshing ? 'animate-spin text-red-600' : ''}`}
                            title="Perbarui Status Realtime"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <button
                            onClick={handlePanggilPelayan}
                            className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:bg-red-100 cursor-pointer transition"
                        >
                            <Bell size={14} /> Bantuan
                        </button>
                    </div>
                </div>

                {/* Banner Sukses Panggil Pelayan */}
                {waiterSuccessMsg && (
                    <div className="mx-4 mt-3 p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                        <span>{waiterSuccessMsg}</span>
                        <button onClick={() => setWaiterSuccessMsg('')} className="p-1 hover:bg-white/20 rounded-full">
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className="px-4 py-4 space-y-4">

                    {/* Banner Jika Pesanan Dibatalkan / Expired */}
                    {statusPesanan === 'Dibatalkan' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl space-y-2 text-center animate-in fade-in">
                            <p className="text-xs font-bold text-red-700">❌ Pesanan ini telah dibatalkan atau kedaluwarsa</p>
                            <p className="text-[11px] text-slate-500">Antrean ini sudah tidak aktif di dapur maupun kasir.</p>
                            {onResetOrder && (
                                <button
                                    onClick={onResetOrder}
                                    className="w-full mt-2 py-2.5 bg-[#b81d24] text-white rounded-xl text-xs font-bold hover:bg-red-800 transition cursor-pointer shadow-md shadow-red-600/20"
                                >
                                    Buat Pesanan Baru Sekarang
                                </button>
                            )}
                        </div>
                    )}

                    {/* --- NOMOR ANTREAN CARD --- */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">NOMOR ANTREAN PESANAN</p>
                                <h1 className="text-2xl font-extrabold mt-1">
                                    <span className="text-[#b81d24]">{orderId}</span>
                                    <span className="text-slate-400 text-sm font-semibold ml-1.5">/ {orderCode}</span>
                                </h1>
                            </div>
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm ${statusBadge.color}`}>
                                {statusBadge.icon} {statusBadge.label}
                            </div>
                        </div>

                        <div className="mt-4 bg-slate-50/80 rounded-2xl p-3 flex justify-between items-center border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 text-red-600 p-2 rounded-xl">
                                    <Armchair size={16} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-bold text-slate-800 leading-tight">{meja}</p>
                                        {namaPelanggan && (
                                            <span className="text-[10px] font-bold bg-red-50 text-[#b81d24] px-2 py-0.5 rounded-full border border-red-100">
                                                👤 {namaPelanggan}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Dine-In • {currentOrder.jumlah_tamu || 2} Orang</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-medium">Estimasi Waktu</p>
                                <p className="text-xs font-bold text-[#b81d24]">{statusBadge.estimate}</p>
                            </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                            <span>Sinkronisasi otomatis aktif</span>
                            <span>Update: {lastUpdated}</span>
                        </div>
                    </div>

                    {/* --- PROGRES PESANAN (TIMELINE REALTIME) --- */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-slate-800 text-sm">Progres Pesanan</h3>
                            <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
                                Realtime Golang
                            </span>
                        </div>

                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">

                            {/* Step 1: Diterima */}
                            <div className="relative pl-6">
                                <div className="absolute -left-[11px] top-0.5 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-4 border-white">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800">Pesanan Masuk ke Sistem</h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Tercatat di server backend</p>
                                    </div>
                                    <span className="text-[10px] text-emerald-600 font-bold">Sukses</span>
                                </div>
                            </div>

                            {/* Step 2: Pembayaran */}
                            <div className="relative pl-6">
                                <div className={`absolute -left-[11px] top-0.5 ${isCash && statusPesanan === 'Menunggu' ? 'bg-orange-500' : 'bg-emerald-500'} text-white w-5 h-5 rounded-full flex items-center justify-center border-4 border-white`}>
                                    <Check size={12} strokeWidth={4} />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800">
                                            {isCash && statusPesanan === 'Menunggu' ? 'Menunggu Bayar di Kasir' : 'Pembayaran Terverifikasi'}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                             {isCash ? 'Tunjukkan nomor antrean ini ke kasir depan' : 'Metode QRIS Instant'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {isCash && statusPesanan === 'Menunggu' ? 'Bayar Kasir' : 'Lunas'}
                                    </span>
                                </div>
                            </div>

                            {/* Step 3: Sedang Dimasak di Dapur */}
                            <div className="relative pl-6">
                                <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                    statusPesanan === 'Dimasak'
                                        ? 'bg-[#b81d24] text-white shadow-[0_0_0_4px_white,0_0_0_5px_#b81d24]'
                                        : (statusPesanan === 'Siap' || statusPesanan === 'Selesai'
                                            ? 'bg-emerald-500 text-white border-4 border-white'
                                            : 'bg-slate-200 text-slate-400 border-4 border-white')
                                }`}>
                                    {statusPesanan === 'Siap' || statusPesanan === 'Selesai' ? (
                                        <Check size={12} strokeWidth={4} />
                                    ) : (
                                        <ChefHat size={12} />
                                    )}
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className={`text-xs font-bold ${statusPesanan === 'Dimasak' ? 'text-[#b81d24]' : 'text-slate-800'}`}>
                                            Sedang Dimasak di Dapur
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {statusPesanan === 'Menunggu'
                                                ? 'Menunggu giliran koki menyiapkan pesanan'
                                                : (statusPesanan === 'Dimasak'
                                                    ? 'Koki sedang meracik mie & menggoreng dimsum'
                                                    : 'Makanan selesai diracik oleh koki')}
                                        </p>
                                    </div>
                                    {statusPesanan === 'Dimasak' && (
                                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[9px] font-bold">
                                            Dimasak
                                        </span>
                                    )}
                                </div>
                                {statusPesanan === 'Dimasak' && (
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5">
                                        <div className="bg-[#b81d24] w-[65%] h-full rounded-full relative">
                                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step 4: Siap Disajikan */}
                            <div className="relative pl-6">
                                <div className={`absolute -left-[11px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                                    statusPesanan === 'Siap' || statusPesanan === 'Selesai'
                                        ? 'bg-emerald-500 text-white shadow-[0_0_0_4px_white,0_0_0_5px_#10b981]'
                                        : 'bg-slate-200 text-slate-400 border-4 border-white'
                                }`}>
                                    <ConciergeBell size={12} />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className={`text-xs font-bold ${statusPesanan === 'Siap' ? 'text-emerald-700' : 'text-slate-800'}`}>
                                            Siap Disajikan
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            Pelayan mengantar pesanan langsung ke {meja}
                                        </p>
                                    </div>
                                    {statusPesanan === 'Siap' && (
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">
                                            Siap Saji
                                        </span>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* --- RINCIAN MENU CARD --- */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Receipt size={16} className="text-red-700" /> Rincian Menu
                            </h3>
                            <span className="text-[11px] text-slate-600 font-semibold">
                                {displayItems.length} Item • Rp {totalHarga.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {/* List Items */}
                        <div className="space-y-3">
                            {displayItems.map((item, idx) => (
                                <div key={item.id || idx} className="bg-slate-50/70 p-3 rounded-2xl flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative border border-slate-100">
                                        {item.img ? (
                                            <img src={item.img} alt={item.nama} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageOff size={16} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-xs font-bold text-slate-800 truncate">
                                                {item.qty}x {item.nama}
                                            </h4>
                                            <span className="text-xs font-extrabold text-[#b81d24] ml-2">
                                                Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                {item.subdesc}
                                            </span>
                                            {item.note && (
                                                <span className="text-[10px] text-slate-400 italic truncate max-w-[150px]">
                                                    "{item.note}"
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${
                                                item.status.includes('Selesai')
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                    : (item.status.includes('Dimasak')
                                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-100')
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Catatan Meja dari Database */}
                        {catatanMeja && (
                            <div className="bg-orange-50/70 border border-orange-100 p-3 rounded-xl flex gap-2 items-start mt-2">
                                <Utensils size={13} className="text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wide">Catatan Tambahan Meja:</p>
                                    <p className="text-[11px] text-orange-800 italic mt-0.5 leading-snug">
                                        "{catatanMeja}"
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* --- INFO & ACTION BUTTONS --- */}
                    <div className="bg-blue-50/70 rounded-2xl p-4 flex gap-3 items-start border border-blue-100">
                        <div className="bg-white p-2 rounded-full shadow-sm text-blue-600 flex-shrink-0">
                            <Armchair size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-800">Santai di {meja}!</h4>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                Anda tidak perlu repot antre di counter pick-up. Staf kami akan mengantarkan pesanan langsung ke meja begitu matang.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                            onClick={handlePanggilPelayan}
                            className="bg-white py-3 rounded-2xl text-xs font-semibold text-slate-700 flex justify-center items-center gap-2 border border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer transition active:scale-95"
                        >
                            <Bell size={14} className="text-red-600" /> Panggil Pelayan
                        </button>
                        <button
                            onClick={handleStrukDigital}
                            className="bg-white py-3 rounded-2xl text-xs font-semibold text-slate-700 flex justify-center items-center gap-2 border border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer transition active:scale-95"
                        >
                            <Receipt size={14} className="text-red-600" /> Struk Digital
                        </button>
                    </div>

                    <button
                        onClick={onTambahPesanan}
                        className="w-full mt-3 bg-red-50 py-3.5 rounded-2xl text-sm font-bold text-red-700 flex justify-center items-center gap-2 hover:bg-red-100 transition-colors cursor-pointer active:scale-98 border border-red-100"
                    >
                        <PlusCircle size={16} /> Tambah Pesanan Baru ke {meja}
                    </button>

                    {onResetOrder && (
                        <button
                            onClick={onResetOrder}
                            className="w-full mt-2 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer flex justify-center items-center gap-1.5"
                        >
                            <span>Selesai Makan?</span>
                            <span className="text-[#b81d24] font-bold underline">Mulai Kunjungan Baru</span>
                        </button>
                    )}

                </div>
            </div>

            {/* --- MODAL PANGGIL PELAYAN INTERAKTIF --- */}
            {isWaiterModalOpen && (
                <div
                    onClick={() => setIsWaiterModalOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 duration-200"
                    >
                        <div className="bg-[#b81d24] text-white p-5 flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-base flex items-center gap-2">
                                    <Bell size={18} /> Panggil Pelayan ke {meja}
                                </h3>
                                <p className="text-red-200 text-xs mt-0.5">Pilih bantuan yang Anda butuhkan</p>
                            </div>
                            <button
                                onClick={() => setIsWaiterModalOpen(false)}
                                className="p-1 hover:bg-white/20 rounded-full text-white cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitWaiterCall} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    Pilih Kebutuhan Meja:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        'Minta Sendok / Garpu',
                                        'Minta Tisu Ekstra',
                                        'Minta Sedotan',
                                        'Minta Air Putih',
                                        'Bersihkan Meja',
                                        'Bantuan Lainnya'
                                    ].map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setWaiterReason(opt)}
                                            className={`p-2.5 rounded-2xl text-xs font-bold text-left transition cursor-pointer border ${
                                                waiterReason === opt
                                                    ? 'bg-red-50 text-[#b81d24] border-red-300 ring-2 ring-red-100'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Catatan Tambahan (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={waiterNote}
                                    onChange={(e) => setWaiterNote(e.target.value)}
                                    placeholder="Contoh: Minta 2 pasang sendok"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-400 font-semibold"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsWaiterModalOpen(false)}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCallingWaiter}
                                    className="flex-1 py-3 bg-[#b81d24] hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    {isCallingWaiter ? 'Memanggil...' : 'Panggil Sekarang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isReceiptOpen && (
                <div
                    onClick={() => setIsReceiptOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
                    >
                        {/* Header Modal */}
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Receipt size={18} className="text-red-400" />
                                <h3 className="font-extrabold text-sm">Struk Digital Transaksi</h3>
                            </div>
                            <button
                                onClick={() => setIsReceiptOpen(false)}
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Lembar Struk Kertas Kasir (Monospace Thermal) */}
                        <div className="p-5 bg-slate-100 flex-1 overflow-y-auto">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-300 font-mono text-slate-900 text-xs leading-relaxed space-y-3">

                                {/* Header Outlet */}
                                <div className="text-center border-b border-dashed border-slate-400 pb-3">
                                    <h4 className="font-black text-sm tracking-widest uppercase">MIE GACOAN RESTO</h4>
                                    <p className="text-[10px] text-slate-600">Cabang Teuku Umar - Bali</p>
                                    <p className="text-[9px] text-slate-500">Jl. Teuku Umar No. 18, Denpasar</p>
                                    <p className="text-[9px] text-slate-500">NPWP / PB1: 01.234.567.8-901.000</p>
                                </div>

                                {/* Meta Transaksi */}
                                <div className="text-[10px] space-y-0.5 text-slate-700">
                                    <div className="flex justify-between">
                                        <span>No. Antrean:</span>
                                        <span className="font-bold text-slate-900">{orderId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kode Order:</span>
                                        <span className="font-bold text-slate-900">{orderCode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Lokasi Meja:</span>
                                        <span className="font-bold text-slate-900">{meja}</span>
                                    </div>
                                    {namaPelanggan && (
                                        <div className="flex justify-between">
                                            <span>Nama Pemesan:</span>
                                            <span className="font-bold text-slate-900">{namaPelanggan}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Waktu Transaksi:</span>
                                        <span>{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kasir / Jalur:</span>
                                        <span>Self-Order Table QR</span>
                                    </div>
                                </div>

                                {/* Rincian Item */}
                                <div className="border-t border-b border-dashed border-slate-400 py-2.5 space-y-2">
                                    <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase border-b border-slate-100 pb-1">
                                        <span>Item Menu</span>
                                        <span>Total</span>
                                    </div>

                                    {displayItems.map((item, idx) => (
                                        <div key={idx} className="space-y-0.5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-2">
                                                    <span className="font-bold">{item.qty}x {item.nama}</span>
                                                    {item.levelPedas > 0 && (
                                                        <span className="text-[9px] text-red-600 font-bold block">
                                                            * Level {item.levelPedas}
                                                        </span>
                                                    )}
                                                    {item.note && (
                                                        <span className="text-[9px] text-slate-500 italic block">
                                                            * {item.note}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-bold whitespace-nowrap">
                                                    {(item.harga * item.qty).toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                            <div className="text-[9px] text-slate-400">
                                                @{item.harga.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Ringkasan Biaya & Pajak */}
                                <div className="space-y-1 text-[11px]">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>PB1 Restoran (10%)</span>
                                        <span>Rp {pb1Pajak.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between font-extrabold text-sm border-t border-dashed border-slate-400 pt-1.5 text-slate-900">
                                        <span>TOTAL AKHIR</span>
                                        <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                                        <span>Metode Bayar:</span>
                                        <span className="font-bold">{isCash ? 'Tunai di Kasir' : 'QRIS Instant (Lunas)'}</span>
                                    </div>
                                </div>

                                {/* Catatan Meja */}
                                {catatanMeja && (
                                    <div className="text-[9px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-600">
                                        <span className="font-bold">Pesan Meja:</span> "{catatanMeja}"
                                    </div>
                                )}

                                {/* Barcode & Footer Ucapan */}
                                <div className="text-center border-t border-dashed border-slate-400 pt-3 space-y-1">
                                    <div className="font-mono text-center tracking-widest text-[9px] text-slate-400">
                                        |||||||| |||| | |||||||| |||||| ||||
                                    </div>
                                    <p className="font-bold text-[10px] text-slate-800">TERIMA KASIH ATAS KUNJUNGANNYA!</p>
                                    <p className="text-[8px] text-slate-400">Kritik & Saran DM Instagram @mie.gacoan</p>
                                </div>

                            </div>
                        </div>

                        {/* Tombol Aksi Cetak & Tutup */}
                        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => setIsReceiptOpen(false)}
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