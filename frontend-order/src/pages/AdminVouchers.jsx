import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
    MonitorPlay, LayoutDashboard, Settings, BarChart3,
    QrCode, LogOut, Ticket, Plus, Trash2, RefreshCw,
    Check, X, CreditCard, Percent, Tag, DollarSign, AlertCircle, ExternalLink
} from 'lucide-react';

export default function AdminVouchers({ onNavigate, onSimulateCustomer }) {
    const [vouchers, setVouchers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [newVoucher, setNewVoucher] = useState({
        kode: '',
        judul: '',
        tipe: 'percent',
        nilai: 15,
        min_belanja: 30000,
        max_potongan: 15000,
        is_active: true
    });

    const fetchVouchers = async () => {
        setIsLoading(true);
        try {
            const res = await apiService.getVouchers();
            setVouchers(res.data || []);
        } catch (err) {
            console.error("Gagal memuat voucher:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleCreateVoucher = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!newVoucher.kode.trim() || !newVoucher.judul.trim()) {
            setErrorMsg("Kode dan Judul voucher harus diisi");
            return;
        }

        setIsSubmitting(true);
        try {
            await apiService.createVoucher({
                ...newVoucher,
                kode: newVoucher.kode.trim().toUpperCase(),
                nilai: parseInt(newVoucher.nilai, 10) || 0,
                min_belanja: parseInt(newVoucher.min_belanja, 10) || 0,
                max_potongan: parseInt(newVoucher.max_potongan, 10) || 0,
            });
            setIsAddModalOpen(false);
            setNewVoucher({
                kode: '',
                judul: '',
                tipe: 'percent',
                nilai: 15,
                min_belanja: 30000,
                max_potongan: 15000,
                is_active: true
            });
            await fetchVouchers();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVoucher = async (id, kode) => {
        if (!window.confirm(`Yakin ingin menghapus kupon voucher "${kode}"?`)) return;
        try {
            await apiService.deleteVoucher(id);
            await fetchVouchers();
        } catch (err) {
            alert(`Gagal menghapus voucher: ${err.message}`);
        }
    };

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
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
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

                        <button className="w-full flex items-center gap-3 bg-[#b81d24] text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-red-600/20 cursor-pointer text-left">
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATABASE POSTGRESQL</p>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{vouchers.length} Kupon Terdaftar</span>
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
                            MANAJEMEN KUPON & VOUCHER PROMO <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px]">LIVE DATABASE</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Outlet Teuku Umar • Atur Diskon Belanja Pelanggan untuk Naikkan Penjualan</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchVouchers}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                            title="Refresh Voucher"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 bg-[#b81d24] hover:bg-red-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer"
                        >
                            <Plus size={16} /> Tambah Voucher
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Grid Kartu Voucher */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vouchers.map((v) => (
                            <div
                                key={v.id}
                                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#b81d24] flex items-center justify-center font-black">
                                                <Ticket size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-mono font-black text-lg text-slate-800 tracking-wider">
                                                    {v.kode}
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{v.judul}</p>
                                            </div>
                                        </div>
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            Aktif
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Nominal Potongan:</span>
                                            <span className="font-extrabold text-[#b81d24]">
                                                {v.tipe === 'percent' ? `${v.nilai}% Diskon` : `Rp ${v.nilai.toLocaleString('id-ID')}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 text-[11px]">
                                            <span>Min. Belanja:</span>
                                            <span>Rp {v.min_belanja.toLocaleString('id-ID')}</span>
                                        </div>
                                        {v.max_potongan > 0 && (
                                            <div className="flex justify-between text-slate-500 text-[11px]">
                                                <span>Maks. Potongan:</span>
                                                <span>Rp {v.max_potongan.toLocaleString('id-ID')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-3">
                                    <span className="text-[10px] text-slate-400">
                                        Digunakan di HP Checkout
                                    </span>
                                    <button
                                        onClick={() => handleDeleteVoucher(v.id, v.kode)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        title="Hapus Voucher"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isLoading && vouchers.length === 0 && (
                        <div className="text-center py-20 text-slate-400 text-xs font-bold">
                            Belum ada voucher diskon terdaftar. Klik "Tambah Voucher" untuk membuat promo baru!
                        </div>
                    )}

                </div>
            </main>

            {/* --- MODAL TAMBAH VOUCHER --- */}
            {isAddModalOpen && (
                <div
                    onClick={() => setIsAddModalOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 duration-200"
                    >
                        <div className="bg-[#b81d24] text-white p-5 flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-base">Buat Kupon Diskon Baru</h3>
                                <p className="text-red-200 text-xs">Voucher langsung aktif dan dapat dipakai pelanggan</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1 hover:bg-white/20 rounded-full text-white cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateVoucher} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Voucher *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: GACOANHEMAT atau JUMATBERKAH"
                                    value={newVoucher.kode}
                                    onChange={(e) => setNewVoucher({ ...newVoucher, kode: e.target.value.toUpperCase() })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Deskripsi Promo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Diskon 15% Spesial Weekend"
                                    value={newVoucher.judul}
                                    onChange={(e) => setNewVoucher({ ...newVoucher, judul: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Diskon</label>
                                    <select
                                        value={newVoucher.tipe}
                                        onChange={(e) => setNewVoucher({ ...newVoucher, tipe: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                    >
                                        <option value="percent">Persentase (%)</option>
                                        <option value="nominal">Nominal Rupiah (Rp)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {newVoucher.tipe === 'percent' ? 'Persen Diskon (%) *' : 'Nominal Potongan (Rp) *'}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={newVoucher.nilai}
                                        onChange={(e) => setNewVoucher({ ...newVoucher, nilai: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Min. Belanja (Rp)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={newVoucher.min_belanja}
                                        onChange={(e) => setNewVoucher({ ...newVoucher, min_belanja: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Maks. Potongan (Rp)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={newVoucher.max_potongan}
                                        onChange={(e) => setNewVoucher({ ...newVoucher, max_potongan: e.target.value })}
                                        placeholder="0 jika tak terbatas"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>

                            {errorMsg && (
                                <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                                    <AlertCircle size={14} /> {errorMsg}
                                </p>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-[#b81d24] text-white rounded-xl text-xs font-bold hover:bg-red-800 transition cursor-pointer shadow-md shadow-red-600/30"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Voucher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
