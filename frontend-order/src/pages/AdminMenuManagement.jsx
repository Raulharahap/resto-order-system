import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import {
    MonitorPlay, LayoutDashboard, ListOrdered, History, Settings,
    Clock, User, RefreshCw, QrCode, Plus, Search, ChevronDown,
    AlertCircle, MinusCircle, Flame, CheckSquare, Square, Lock, Info,
    X, ImageOff, Trash2, LogOut, UploadCloud, Check, Loader2, BarChart3,
    Camera, Pencil, CreditCard, Ticket, ExternalLink
} from 'lucide-react';

export default function AdminMenuManagement({ onNavigate, onSimulateCustomer }) {
    const [menus, setMenus] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Semua'); // 'Semua', 'Mie', 'Dimsum', 'Minuman'
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));

    // Modal Tambah Menu Baru
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImg, setIsUploadingImg] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const [newMenu, setNewMenu] = useState({
        nama: '',
        kategori: 'Mie',
        harga: 11500,
        stok: 50,
        has_level: false,
        level_options: '1,2,3,4,6,8',
        gambar: ''
    });

    // Modal Edit Menu
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [isUploadingEditImg, setIsUploadingEditImg] = useState(false);
    const [editUploadError, setEditUploadError] = useState('');
    const editFileInputRef = useRef(null);

    // Clock timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('id-ID'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- FETCH DATA MENU DARI BACKEND GOLANG (GET /menus) ---
    const fetchMenus = async () => {
        setIsLoading(true);
        try {
            const res = await apiService.getMenus();
            const list = res.data || [];
            setMenus(list);
        } catch (err) {
            console.error("Gagal memuat daftar menu:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    // --- UPLOAD GAMBAR BARU KE BACKEND (POST /upload) ---
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan');
            return;
        }

        // Tampilkan instant preview lokal
        const localPreview = URL.createObjectURL(file);
        setNewMenu(prev => ({ ...prev, gambar: localPreview }));

        setIsUploadingImg(true);
        setUploadError('');
        try {
            const res = await apiService.uploadImage(file);
            const imgUrl = res.url || res.data?.url || '';
            if (imgUrl) {
                setNewMenu(prev => ({ ...prev, gambar: imgUrl }));
            } else {
                throw new Error("URL gambar tidak ditemukan pada response upload");
            }
        } catch (err) {
            setUploadError(`Upload gagal: ${err.message}`);
        } finally {
            setIsUploadingImg(false);
            if (e.target) e.target.value = '';
        }
    };

    // --- UPLOAD GAMBAR EDIT KE BACKEND (POST /upload) ---
    const handleEditFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setEditUploadError('Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan');
            return;
        }

        // Tampilkan instant preview lokal
        const localPreview = URL.createObjectURL(file);
        setEditingMenu(prev => ({ ...prev, gambar: localPreview }));

        setIsUploadingEditImg(true);
        setEditUploadError('');
        try {
            const res = await apiService.uploadImage(file);
            const imgUrl = res.url || res.data?.url || '';
            if (imgUrl) {
                setEditingMenu(prev => ({ ...prev, gambar: imgUrl }));
            } else {
                throw new Error("URL gambar tidak ditemukan pada response upload");
            }
        } catch (err) {
            setEditUploadError(`Upload gagal: ${err.message}`);
        } finally {
            setIsUploadingEditImg(false);
            if (e.target) e.target.value = '';
        }
    };

    // --- BUKA MODAL EDIT DENGAN DATA SEBELUMNYA ---
    const handleOpenEditModal = (menu) => {
        setEditingMenu({
            id: menu.id,
            nama: menu.nama || '',
            kategori: menu.kategori || 'Mie',
            harga: menu.harga || 0,
            stok: menu.stok ?? 50,
            has_level: Boolean(menu.has_level),
            level_options: menu.level_options || '1,2,3,4,6,8',
            gambar: menu.gambar || '',
            is_sold_out: Boolean(menu.is_sold_out || (menu.stok !== undefined && menu.stok <= 0))
        });
        setEditUploadError('');
        setIsEditModalOpen(true);
    };

    // --- SIMPAN PERUBAHAN EDIT MENU (PUT /menus/:id) ---
    const handleUpdateMenuSubmit = async (e) => {
        e.preventDefault();
        if (!editingMenu || !editingMenu.nama.trim()) {
            alert("Nama menu tidak boleh kosong");
            return;
        }

        setIsSubmittingEdit(true);
        try {
            const stockVal = parseInt(editingMenu.stok, 10) || 0;
            const payload = {
                nama: editingMenu.nama.trim(),
                kategori: editingMenu.kategori,
                harga: parseInt(editingMenu.harga, 10) || 0,
                stok: stockVal,
                has_level: Boolean(editingMenu.has_level),
                level_options: editingMenu.has_level ? editingMenu.level_options : '',
                gambar: (editingMenu.gambar || '').trim(),
                is_sold_out: stockVal <= 0 ? true : Boolean(editingMenu.is_sold_out)
            };

            await apiService.updateMenu(editingMenu.id, payload);
            setIsEditModalOpen(false);
            setEditingMenu(null);
            await fetchMenus();
        } catch (err) {
            alert(`Gagal memperbarui menu: ${err.message}`);
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    // --- TOGGLE STATUS HABIS (SOLD OUT) LANGSUNG DARI TABEL ---
    const handleToggleSoldOut = async (menu) => {
        const updatedStatus = !menu.is_sold_out;
        try {
            await apiService.updateMenu(menu.id, {
                ...menu,
                is_sold_out: updatedStatus,
                stok: updatedStatus ? 0 : (menu.stok > 0 ? menu.stok : 20)
            });
            await fetchMenus();
        } catch (err) {
            alert(`Gagal memperbarui status menu: ${err.message}`);
        }
    };

    // --- UPDATE STOK MENU CEPAT DARI TABEL ---
    const handleUpdateStock = async (menu, newStock) => {
        const stockVal = Math.max(0, parseInt(newStock, 10) || 0);
        try {
            await apiService.updateMenu(menu.id, {
                ...menu,
                stok: stockVal,
                is_sold_out: stockVal <= 0
            });
            await fetchMenus();
        } catch (err) {
            alert(`Gagal memperbarui stok: ${err.message}`);
        }
    };

    // --- HAPUS MENU ---
    const handleDeleteMenu = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus menu "${nama}"?`)) return;
        try {
            await apiService.deleteMenu(id);
            await fetchMenus();
        } catch (err) {
            alert(`Gagal menghapus menu: ${err.message}`);
        }
    };

    // --- SUBMIT MENU BARU KE GOLANG (POST /menus) ---
    const handleCreateMenu = async (e) => {
        e.preventDefault();
        if (!newMenu.nama.trim()) {
            alert("Nama menu tidak boleh kosong");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                nama: newMenu.nama.trim(),
                kategori: newMenu.kategori,
                harga: parseInt(newMenu.harga, 10) || 0,
                stok: parseInt(newMenu.stok, 10) || 0,
                has_level: Boolean(newMenu.has_level),
                level_options: newMenu.has_level ? newMenu.level_options : '',
                gambar: newMenu.gambar.trim(),
                is_sold_out: parseInt(newMenu.stok, 10) <= 0
            };

            await apiService.createMenu(payload);
            setIsAddModalOpen(false);
            setNewMenu({
                nama: '',
                kategori: 'Mie',
                harga: 11500,
                stok: 50,
                has_level: false,
                level_options: '1,2,3,4,6,8',
                gambar: ''
            });
            setUploadError('');
            await fetchMenus();
        } catch (err) {
            alert(`Gagal menambah menu: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Perhitungan Statistik
    const totalMenu = menus.length;
    const soldOutCount = menus.filter(m => m.is_sold_out || m.stok <= 0).length;
    const lowStockCount = menus.filter(m => !m.is_sold_out && m.stok > 0 && m.stok < 15).length;
    const activeCount = totalMenu - soldOutCount;

    // Filter Menu
    const filteredMenus = menus.filter(m => {
        const matchesSearch = !searchQuery.trim() ||
            m.nama.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            (m.kategori && m.kategori.toLowerCase().includes(searchQuery.trim().toLowerCase()));

        if (!matchesSearch) return false;
        if (activeTab === 'Semua') return true;

        return (m.kategori || '').toLowerCase().includes(activeTab.toLowerCase());
    });

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

                        <button className="w-full flex items-center gap-3 bg-[#b81d24] text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-red-600/20 cursor-pointer text-left">
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

                        <button
                            onClick={() => onNavigate && onNavigate('admin-reports')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left"
                        >
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATABASE POSTGRESQL</p>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{totalMenu} Menu Terdaftar</span>
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
                            GACOAN ADMIN <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px]">LIVE POSTGRESQL</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Outlet Teuku Umar • Kelola Ketersediaan & Stok Realtime</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm">
                            <Clock size={16} className="text-[#b81d24]" /> {currentTime}
                        </div>
                        <button
                            onClick={fetchMenus}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                            title="Refresh Data Menu"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 pt-4">

                    {/* Header Title & Actions */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 leading-tight">Katalog Menu & Kontrol Stok</h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Perubahan data menu, foto, harga, atau status 'Sold Out' di sini otomatis tersinkron ke pelanggan.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchMenus}
                                className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                                <RefreshCw size={14} className="text-slate-400" /> Sinkronkan
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-[#b81d24] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 hover:bg-red-800 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                            >
                                <Plus size={16} /> Tambah Menu Baru
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL MENU TERDAFTAR</p>
                            <h2 className="text-3xl font-black text-slate-800 leading-none mb-1">{totalMenu}</h2>
                            <p className="text-[10px] font-bold text-emerald-600">{activeCount} Tersedia</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border-t-4 border-t-red-600 border border-slate-100 relative">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">HABIS (SOLD OUT)</p>
                            <h2 className="text-3xl font-black text-red-600 leading-none mb-1">{soldOutCount}</h2>
                            <p className="text-[10px] font-medium text-slate-400">Tombol tambah di-disable di HP</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border-t-4 border-t-orange-500 border border-slate-100 relative">
                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">STOK MENIPIS</p>
                            <h2 className="text-3xl font-black text-slate-800 leading-none mb-1">{lowStockCount}</h2>
                            <p className="text-[10px] font-medium text-slate-400">&lt; 15 Porsi tersisa</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">KONEKSI KATALOG</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>Terhubung Golang :8080</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Filter Controls */}
                    <div className="bg-white rounded-t-2xl border border-b-0 border-slate-200 p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="relative flex-1 max-w-sm">
                                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama menu atau kategori..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-400 focus:bg-white transition-colors"
                                />
                            </div>

                            {/* Kategori Tabs */}
                            <div className="flex gap-1.5 text-xs font-bold">
                                {['Semua', 'Mie', 'Dimsum', 'Minuman'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                            activeTab === tab
                                                ? 'bg-slate-800 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Table Menu */}
                    <div className="bg-white border border-slate-200 rounded-b-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 tracking-wider border-b border-slate-200 uppercase">
                                    <th className="p-4 w-12 text-center">ID</th>
                                    <th className="py-4">MENU & GAMBAR</th>
                                    <th className="py-4">KATEGORI & LEVEL</th>
                                    <th className="py-4">HARGA SATUAN</th>
                                    <th className="py-4">STOK PORSI</th>
                                    <th className="py-4 text-center">STATUS KETERSEDIAAN</th>
                                    <th className="py-4 pr-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {filteredMenus.map((menu) => {
                                    const isSoldOut = Boolean(menu.is_sold_out || menu.stok <= 0);

                                    return (
                                        <tr key={menu.id} className={`hover:bg-slate-50/80 transition-colors ${isSoldOut ? 'bg-slate-50/40' : ''}`}>
                                            {/* ID */}
                                            <td className="p-4 text-center font-bold text-slate-400 text-xs">
                                                #{menu.id}
                                            </td>

                                            {/* Menu & Thumbnail */}
                                            <td className="py-3 pr-4">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center relative">
                                                        {menu.gambar ? (
                                                            <img
                                                                src={menu.gambar}
                                                                alt={menu.nama}
                                                                className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-60' : ''}`}
                                                            />
                                                        ) : (
                                                            <ImageOff size={16} className="text-slate-400" />
                                                        )}
                                                        {isSoldOut && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <Lock size={12} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                                            {menu.nama}
                                                            {isSoldOut && (
                                                                <span className="bg-red-100 text-red-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                                                                    SOLD OUT
                                                                </span>
                                                            )}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                            {menu.gambar ? 'Foto tersedia' : 'Tanpa foto'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Kategori & Level */}
                                            <td className="py-3 pr-4">
                                                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md">
                                                    {menu.kategori}
                                                </span>
                                                {menu.has_level ? (
                                                    <p className="text-[10px] text-red-600 font-bold mt-1">
                                                        🔥 Lv: {menu.level_options || 'Pedas'}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-slate-400 mt-1">Non-level</p>
                                                )}
                                            </td>

                                            {/* Harga */}
                                            <td className="py-3 pr-4 font-extrabold text-slate-800 text-xs">
                                                Rp {(menu.harga || 0).toLocaleString('id-ID')}
                                            </td>

                                            {/* Stok Porsi (Bisa diubah langsung) */}
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        defaultValue={menu.stok}
                                                        onBlur={(e) => handleUpdateStock(menu, e.target.value)}
                                                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-red-400 focus:bg-white"
                                                    />
                                                    <span className="text-[10px] text-slate-400">Porsi</span>
                                                </div>
                                            </td>

                                            {/* Toggle Ketersediaan (Sold Out) */}
                                            <td className="py-3 text-center">
                                                <button
                                                    onClick={() => handleToggleSoldOut(menu)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                                                        isSoldOut
                                                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    }`}
                                                >
                                                    {isSoldOut ? '🔴 Habis (Nonaktif)' : '🟢 Tersedia (Aktif)'}
                                                </button>
                                            </td>

                                            {/* Aksi Edit & Hapus */}
                                            <td className="py-3 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleOpenEditModal(menu)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                        title="Edit Data & Foto Menu"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMenu(menu.id, menu.nama)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        title="Hapus Menu"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!isLoading && filteredMenus.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                                            Tidak ada menu yang sesuai dengan filter atau pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </main>

            {/* --- MODAL TAMBAH MENU BARU (DENGAN UPLOAD GAMBAR) --- */}
            {isAddModalOpen && (
                <div
                    onClick={() => setIsAddModalOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
                    >
                        {/* Modal Header */}
                        <div className="bg-[#b81d24] text-white p-5 flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-base">Tambah Menu Baru</h3>
                                <p className="text-red-200 text-xs">Upload gambar lokal langsung tersimpan ke backend</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white cursor-pointer transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleCreateMenu} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Menu *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Mie Suit Original"
                                    value={newMenu.nama}
                                    onChange={(e) => setNewMenu({ ...newMenu, nama: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-400 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                                    <select
                                        value={newMenu.kategori}
                                        onChange={(e) => setNewMenu({ ...newMenu, kategori: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-400"
                                    >
                                        <option value="Mie">🍜 Mie</option>
                                        <option value="Dimsum">🥟 Dimsum</option>
                                        <option value="Minuman">🥤 Minuman</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp) *</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={newMenu.harga}
                                        onChange={(e) => setNewMenu({ ...newMenu, harga: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Stok Porsi</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={newMenu.stok}
                                        onChange={(e) => setNewMenu({ ...newMenu, stok: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Punya Opsi Level?</label>
                                    <label className="flex items-center gap-2 pt-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newMenu.has_level}
                                            onChange={(e) => setNewMenu({ ...newMenu, has_level: e.target.checked })}
                                            className="w-4 h-4 text-red-600 rounded"
                                        />
                                        <span className="text-xs font-bold text-slate-700">Ya, Ada Level Pedas</span>
                                    </label>
                                </div>
                            </div>

                            {newMenu.has_level && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Pilihan Level (Pisahkan tanda koma)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 1,2,3,4,6,8"
                                        value={newMenu.level_options}
                                        onChange={(e) => setNewMenu({ ...newMenu, level_options: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-400"
                                    />
                                </div>
                            )}

                            {/* --- UPLOAD GAMBAR LANGSUNG --- */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Foto / Gambar Menu
                                </label>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                {/* Preview atau Kotak Unggah */}
                                {newMenu.gambar ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={newMenu.gambar}
                                                alt="Preview"
                                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1 text-emerald-600">
                                                    <Check size={14} /> Gambar Terunggah
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                                    {newMenu.gambar}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                                            >
                                                Ganti
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewMenu(prev => ({ ...prev, gambar: '' }))}
                                                className="px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 hover:bg-red-50/30 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
                                    >
                                        {isUploadingImg ? (
                                            <div className="flex items-center gap-2 text-xs font-bold text-red-600 py-2">
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Mengunggah file ke backend...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-600">
                                                    <UploadCloud size={20} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    Klik untuk Unggah Foto dari Komputer / HP
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    Format JPG, PNG, atau WebP (Disimpan di server Golang)
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {uploadError && (
                                    <p className="text-[10px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                                        <AlertCircle size={12} /> {uploadError}
                                    </p>
                                )}

                                {/* Atau alternatif input link URL */}
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        placeholder="Atau tempel URL gambar eksternal di sini..."
                                        value={newMenu.gambar}
                                        onChange={(e) => setNewMenu({ ...newMenu, gambar: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] outline-none focus:border-red-400 text-slate-600"
                                    />
                                </div>
                            </div>

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
                                    disabled={isSubmitting || isUploadingImg}
                                    className="flex-1 py-3 bg-[#b81d24] text-white rounded-xl text-xs font-bold hover:bg-red-800 transition cursor-pointer shadow-md shadow-red-600/30 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Menu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL EDIT DATA & FOTO MENU --- */}
            {isEditModalOpen && editingMenu && (
                <div
                    onClick={() => setIsEditModalOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
                    >
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                                    <Pencil size={18} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base">Edit Menu #{editingMenu.id}</h3>
                                    <p className="text-slate-400 text-xs">Perubahan akan langsung diperbarui di PostgreSQL</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleUpdateMenuSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Nama Menu */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Menu *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingMenu.nama}
                                    onChange={(e) => setEditingMenu({ ...editingMenu, nama: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition"
                                />
                            </div>

                            {/* Kategori & Harga */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                                    <select
                                        value={editingMenu.kategori}
                                        onChange={(e) => setEditingMenu({ ...editingMenu, kategori: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                                    >
                                        <option value="Mie">🍜 Mie</option>
                                        <option value="Dimsum">🥟 Dimsum</option>
                                        <option value="Minuman">🥤 Minuman</option>
                                        <option value="side">🍟 Side Dish</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Harga Satuan (Rp) *</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={editingMenu.harga}
                                        onChange={(e) => setEditingMenu({ ...editingMenu, harga: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Stok & Opsi Level */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Stok Porsi</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={editingMenu.stok}
                                        onChange={(e) => setEditingMenu({ ...editingMenu, stok: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Punya Opsi Level?</label>
                                    <label className="flex items-center gap-2 pt-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingMenu.has_level}
                                            onChange={(e) => setEditingMenu({ ...editingMenu, has_level: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-xs font-bold text-slate-700">Ya, Ada Level Pedas</span>
                                    </label>
                                </div>
                            </div>

                            {/* Input Pilihan Level jika enabled */}
                            {editingMenu.has_level && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Pilihan Level (Pisahkan tanda koma)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 1,2,3,4,6,8"
                                        value={editingMenu.level_options}
                                        onChange={(e) => setEditingMenu({ ...editingMenu, level_options: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                                    />
                                </div>
                            )}

                            {/* Status Ketersediaan (Sold Out Switch) */}
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Status Ketersediaan</p>
                                    <p className="text-[10px] text-slate-500">Jika ditandai habis, pelanggan tidak dapat memesan</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingMenu.is_sold_out}
                                        onChange={(e) => setEditingMenu({ ...editingMenu, is_sold_out: e.target.checked })}
                                        className="w-4 h-4 text-red-600 rounded"
                                    />
                                    <span className={`text-xs font-bold ${editingMenu.is_sold_out ? 'text-red-600' : 'text-emerald-700'}`}>
                                        {editingMenu.is_sold_out ? '🔴 Habis (Sold Out)' : '🟢 Tersedia'}
                                    </span>
                                </label>
                            </div>

                            {/* --- EDIT FOTO / GAMBAR MENU --- */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Foto / Gambar Menu
                                </label>

                                <input
                                    ref={editFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditFileUpload}
                                    className="hidden"
                                />

                                {/* Preview atau Kotak Unggah */}
                                {editingMenu.gambar ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={editingMenu.gambar}
                                                alt={editingMenu.nama}
                                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1 text-emerald-600">
                                                    <Check size={14} /> Foto Menu Aktif
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                                    {editingMenu.gambar}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => editFileInputRef.current?.click()}
                                                className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                                            >
                                                Ganti Foto
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingMenu(prev => ({ ...prev, gambar: '' }))}
                                                className="px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                            >
                                                Hapus Foto
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => editFileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
                                    >
                                        {isUploadingEditImg ? (
                                            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 py-2">
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Mengunggah foto baru ke server...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600">
                                                    <UploadCloud size={20} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    Klik untuk Unggah Foto Baru dari Komputer / HP
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    Format JPG, PNG, atau WebP
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {editUploadError && (
                                    <p className="text-[10px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                                        <AlertCircle size={12} /> {editUploadError}
                                    </p>
                                )}

                                {/* Atau alternatif input link URL */}
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        placeholder="Atau tempel URL gambar eksternal di sini..."
                                        value={editingMenu.gambar}
                                        onChange={(e) => setEditingMenu({ ...editingMenu, gambar: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] outline-none focus:border-blue-500 text-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Tombol Footer */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingEdit || isUploadingEditImg}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
                                >
                                    {isSubmittingEdit ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}