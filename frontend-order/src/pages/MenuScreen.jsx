import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Search, ChevronDown, ChevronUp, ShoppingBag, Plus, Minus, Star, Store, X, ArrowLeft, RefreshCw, AlertCircle, ImageOff, Trash2, ChefHat, ArrowRight } from 'lucide-react';

// Fallback deskripsi sesuai nama jika belum ada deskripsi di database
const getMenuDesc = (item) => {
    if (item.desc) return item.desc;
    if (item.deskripsi) return item.deskripsi;

    const nameLower = (item.nama || '').toLowerCase();
    if (nameLower.includes('gacoan')) {
        return "Mie kenyal berpadu saus kecap pedas gurih rahasia, dengan topping ayam cincang.";
    }
    if (nameLower.includes('hompimpa')) {
        return "Sensasi pedas asin gurih cabe rawit segar tanpa kecap, ditaburi daun bawang.";
    }
    if (nameLower.includes('suit')) {
        return "Mie gurih original tanpa cabai dengan taburan ayam lembut, cocok untuk anak-anak.";
    }
    if (nameLower.includes('keju')) {
        return "Olahan udang juicy dibalut tepung renyah dengan lelehan keju mozzarella.";
    }
    if (item.kategori) {
        return `Pilihan menu ${item.kategori} lezat khas Gacoan dengan racikan istimewa.`;
    }
    return "Menu lezat racikan spesial dengan cita rasa khas.";
};

// Helper untuk parsing opsi level pedas dari backend
const getMenuLevels = (item) => {
    if (Array.isArray(item.levels)) return item.levels;
    if (item.has_level && item.level_options) {
        const parsed = String(item.level_options)
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));
        return parsed.length > 0 ? parsed : null;
    }
    return null;
};

// Komponen gambar menu dengan fallback jika gambar kosong atau link rusak (404/broken)
function MenuImageItem({ src, alt, isSoldOut, rating }) {
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        setIsError(false);
    }, [src]);

    const hasValidImage = Boolean(src && src.trim() !== '') && !isError;

    return (
        <div className="w-28 h-28 rounded-2xl overflow-hidden relative shadow-sm bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-100">
            {hasValidImage ? (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setIsError(true)}
                    className={`w-full h-full object-cover transition duration-300 ${isSoldOut ? 'grayscale opacity-60' : ''}`}
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center select-none">
                    <ImageOff size={24} className="text-slate-400 mb-1 stroke-[1.5]" />
                    <span className="text-[10px] text-slate-400 font-semibold leading-tight">
                        {src ? 'Gambar Rusak' : 'Tanpa Foto'}
                    </span>
                </div>
            )}

            {/* Rating */}
            {rating && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 flex justify-end">
                    <div className="text-white text-[10px] font-bold flex items-center gap-0.5">
                        {rating} <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    </div>
                </div>
            )}

            {/* Overlay jika Stok Habis */}
            {isSoldOut && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                        Habis
                    </span>
                </div>
            )}
        </div>
    );
}

export default function MenuScreen({
    orderData,
    onBack,
    onCheckout,
    cart = [],
    setCart,
    activeOrder = null,
    onBackToTracking = null
}) {
    const meja = orderData?.meja || 'Meja 18';
    const tamu = orderData?.tamu || '2 Org';

    // State untuk Keranjang (mendukung lifting state ke App.jsx atau fallback lokal)
    const [localCart, setLocalCart] = useState([]);
    const currentCart = setCart ? cart : localCart;
    const updateCurrentCart = setCart || setLocalCart;

    // State untuk Drawer/Pop-up Keranjang (ala ShopeeFood)
    const [isCartOpen, setIsCartOpen] = useState(false);

    // State untuk data API Golang
    const [menus, setMenus] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter Kategori & Search
    const [activeKategori, setActiveKategori] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');

    // State untuk Modal Tambah Item (Bottom Sheet Level & Qty)
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [modalImgError, setModalImgError] = useState(false);
    const [modalLevel, setModalLevel] = useState(1);
    const [modalQty, setModalQty] = useState(1);

    // --- FETCH DATA MENGGUNAKAN API SERVICE ---
    const fetchMenus = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiService.getMenus();
            setMenus(result.data || []);
        } catch (error) {
            console.error("Gagal mengambil data menu:", error);
            setError("Gagal memuat data menu dari backend Golang. Pastikan server Golang aktif di port 8080.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    // Filter daftar menu berdasarkan pencarian dan kategori
    const filteredMenus = menus.filter((menu) => {
        const desc = getMenuDesc(menu);
        const matchesSearch = !searchQuery.trim() ||
            (menu.nama && menu.nama.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
            desc.toLowerCase().includes(searchQuery.trim().toLowerCase());

        if (!matchesSearch) return false;
        if (activeKategori === 'Semua') return true;

        // Hilangkan emoji untuk membandingkan nama kategori (misal "🍜 Mie" -> "mie")
        const cleanKategori = activeKategori.replace(/[^\w\s]/gi, '').trim().toLowerCase();
        const menuKat = (menu.kategori || '').toLowerCase();
        return menuKat.includes(cleanKategori) || cleanKategori.includes(menuKat);
    });

    // --- FUNGSI MODAL TAMBAH MENU ---
    const openModal = (menu) => {
        const isSoldOut = Boolean(menu.is_sold_out || (menu.stok !== undefined && menu.stok <= 0));
        if (isSoldOut) return;

        const levels = getMenuLevels(menu);
        const gambarUrl = menu.gambar || menu.img || menu.image_url || '';

        const modalMenu = {
            ...menu,
            gambar: gambarUrl,
            img: gambarUrl,
            desc: getMenuDesc(menu),
            levels: levels
        };

        setSelectedMenu(modalMenu);
        setModalImgError(false);
        setModalQty(1);
        setModalLevel(levels && levels.length > 0 ? levels[0] : null);
    };

    const closeModal = () => {
        setSelectedMenu(null);
    };

    const addToCart = () => {
        if (!selectedMenu) return;

        // Cek apakah menu yang sama dengan level yang sama sudah ada di keranjang
        const existingIndex = currentCart.findIndex(
            (item) => item.id === selectedMenu.id && item.selectedLevel === modalLevel
        );

        if (existingIndex > -1) {
            // Jika makanan dan level pedasnya sama, gabungkan jumlahnya (quantity)
            const updatedCart = [...currentCart];
            updatedCart[existingIndex] = {
                ...updatedCart[existingIndex],
                qty: updatedCart[existingIndex].qty + modalQty
            };
            updateCurrentCart(updatedCart);
        } else {
            // Jika makanan berbeda atau level pedasnya berbeda, buat entri item baru
            const newItem = {
                ...selectedMenu,
                img: selectedMenu.gambar || selectedMenu.img || '',
                cartId: `${selectedMenu.id}-${modalLevel ?? 'plain'}-${Date.now()}`, // ID unik keranjang
                selectedLevel: modalLevel,
                qty: modalQty
            };
            updateCurrentCart([...currentCart, newItem]);
        }

        closeModal();
    };

    // --- FUNGSI PENGATURAN KERANJANG (DI POP-UP KERANJANG) ---
    const updateCartItemQty = (cartId, delta) => {
        const updated = currentCart
            .map((item) => {
                if (item.cartId === cartId) {
                    const newQty = item.qty + delta;
                    return { ...item, qty: newQty };
                }
                return item;
            })
            .filter((item) => item.qty > 0);

        updateCurrentCart(updated);
        if (updated.length === 0) {
            setIsCartOpen(false);
        }
    };

    const clearAllCart = () => {
        updateCurrentCart([]);
        setIsCartOpen(false);
    };

    // Hitung Total Keranjang
    const totalQty = currentCart.reduce((total, item) => total + item.qty, 0);
    const totalPrice = currentCart.reduce((total, item) => total + (item.harga * item.qty), 0);

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center">
            <div className="w-full max-w-md bg-white relative pb-28 shadow-sm min-h-screen flex flex-col">

                {/* --- HEADER (Sticky) --- */}
                <div className="sticky top-0 bg-white z-10 pt-4 pb-2 px-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="p-1.5 -ml-1 text-slate-600 hover:bg-slate-100 active:scale-95 rounded-full transition cursor-pointer"
                                    title="Kembali ke Layar Utama"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                            )}
                            <div className="bg-red-50 p-1.5 rounded-full text-red-600">
                                <Store size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                    {meja} <span className="text-[10px] text-slate-400 font-normal">• {tamu} • DINE-IN</span>
                                </h2>
                                <p className="text-[10px] text-slate-500">Gacoan Teuku Umar</p>
                            </div>
                        </div>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                            >
                                Ubah <ChevronDown size={14} />
                            </button>
                        )}
                    </div>

                    {/* Banner Status Pesanan Aktif (Jika customer klik "Tambah Pesanan") */}
                    {onBackToTracking && activeOrder && (
                        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white rounded-2xl p-3 shadow-md shadow-red-600/20 flex justify-between items-center animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    <ChefHat size={18} className="text-yellow-200" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-200 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300"></span>
                                        </span>
                                        <p className="text-xs font-black">Pesanan #{activeOrder.id || activeOrder.backendOrderId || activeOrder.orderId} Sedang Diproses</p>
                                    </div>
                                    <p className="text-[10px] text-red-100">Klik untuk melihat status makanan di dapur</p>
                                </div>
                            </div>
                            <button
                                onClick={onBackToTracking}
                                className="bg-white text-[#b81d24] hover:bg-red-50 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            >
                                <span>Status</span>
                                <ArrowRight size={13} />
                            </button>
                        </div>
                    )}

                    {/* Bar Pencarian */}
                    <div className="bg-slate-100/80 rounded-xl flex items-center px-3 py-2 text-slate-500">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Cari menu favoritmu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-sm ml-2 placeholder:text-slate-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filter Kategori */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        {['Semua', '🍜 Mie', '🥟 Dimsum', '🥤 Minuman'].map((kat) => (
                            <button
                                key={kat}
                                onClick={() => setActiveKategori(kat)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${activeKategori === kat
                                        ? 'bg-[#b81d24] border-[#b81d24] text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {kat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- KONTEN DAFTAR MENU --- */}
                <div className="px-4 py-2 mt-2 space-y-4 flex-1">

                    {/* Status Loading Skeleton */}
                    {isLoading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="flex gap-3 border-b border-slate-100 pb-4 animate-pulse">
                                    <div className="w-28 h-28 rounded-2xl bg-slate-200 flex-shrink-0" />
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-slate-200 rounded w-full"></div>
                                            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="h-4 bg-slate-200 rounded w-16"></div>
                                            <div className="h-7 bg-slate-200 rounded-full w-20"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Status Error Backend */}
                    {!isLoading && error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center my-6 space-y-3">
                            <AlertCircle className="mx-auto text-red-500" size={32} />
                            <div>
                                <h4 className="font-bold text-red-800 text-sm">Gagal Mengambil Data Menu</h4>
                                <p className="text-xs text-red-600 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={fetchMenus}
                                className="inline-flex items-center gap-1.5 bg-[#b81d24] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-800 transition cursor-pointer"
                            >
                                <RefreshCw size={14} /> Coba Lagi
                            </button>
                        </div>
                    )}

                    {/* Daftar Menu Hasil Fetch */}
                    {!isLoading && !error && filteredMenus.length > 0 && (
                        filteredMenus.map((menu) => {
                            const qtyInCart = currentCart
                                .filter((item) => item.id === menu.id)
                                .reduce((sum, item) => sum + item.qty, 0);

                            const desc = getMenuDesc(menu);
                            const isSoldOut = Boolean(menu.is_sold_out || (menu.stok !== undefined && menu.stok <= 0));
                            const gambarUrl = menu.gambar || menu.img || menu.image_url || '';

                            return (
                                <div key={menu.id} className="flex gap-3 border-b border-slate-100 pb-4">
                                    {/* Komponen Gambar dengan fallback gambar rusak / tanpa foto */}
                                    <MenuImageItem
                                        src={gambarUrl}
                                        alt={menu.nama}
                                        isSoldOut={isSoldOut}
                                        rating={menu.rating || '4.9'}
                                    />

                                    {/* Info Menu */}
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h4 className="font-bold text-sm text-slate-800 leading-tight">
                                                    {menu.nama}
                                                </h4>
                                                {menu.has_level && (
                                                    <span className="bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-100">
                                                        Lv {menu.level_options || 'Pedas'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                {desc}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-extrabold text-slate-800 text-sm">
                                                Rp {(menu.harga || 0).toLocaleString('id-ID')}
                                            </span>

                                            {/* Tombol Tambah / Habis */}
                                            {isSoldOut ? (
                                                <span className="bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200">
                                                    Stok Habis
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => openModal(menu)}
                                                    className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border border-red-100 transition-colors relative cursor-pointer active:scale-95"
                                                >
                                                    <Plus size={14} strokeWidth={3} /> Tambah
                                                    {qtyInCart > 0 && (
                                                        <span className="absolute -top-2 -right-1 bg-[#b81d24] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                                            {qtyInCart}
                                                        </span>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Status Kosong / Tidak Ditemukan */}
                    {!isLoading && !error && filteredMenus.length === 0 && (
                        <div className="text-center py-12 space-y-2">
                            <p className="text-sm font-semibold text-slate-600">Menu tidak ditemukan</p>
                            <p className="text-xs text-slate-400">
                                Coba kata kunci lain atau pilih kategori yang berbeda.
                            </p>
                            {(searchQuery || activeKategori !== 'Semua') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setActiveKategori('Semua');
                                    }}
                                    className="text-xs font-bold text-[#b81d24] hover:underline mt-2 cursor-pointer inline-block"
                                >
                                    Reset Filter
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* --- FLOATING CART (Klik bar buka popup rincian, klik tombol langsung checkout) --- */}
                {totalQty > 0 && (
                    <div className="fixed sm:absolute bottom-0 w-full max-w-md bg-white p-4 border-t border-slate-100 z-20 shadow-lg">
                        <div
                            onClick={() => setIsCartOpen(true)}
                            className="bg-[#b81d24] rounded-2xl p-3 flex justify-between items-center shadow-lg shadow-red-600/20 cursor-pointer hover:bg-[#a0181f] transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-red-900/40 p-2 rounded-xl relative">
                                    <ShoppingBag size={20} className="text-white" />
                                    <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-600">
                                        {totalQty}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-white font-bold text-sm">
                                            Rp {totalPrice.toLocaleString('id-ID')}
                                        </p>
                                        <ChevronUp size={16} className="text-red-200 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                    <p className="text-red-200 text-[10px]">{meja} • {tamu} • Ketuk untuk lihat rincian</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onCheckout) onCheckout(currentCart);
                                }}
                                className="bg-white text-red-600 text-sm font-bold py-2 px-4 rounded-xl cursor-pointer hover:bg-red-50 active:scale-95 transition shadow-sm"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                )}

                {/* --- BOTTOM SHEET MODAL KERANJANG (Ala ShopeeFood) --- */}
                {isCartOpen && (
                    <div
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 z-50 flex items-end sm:justify-center bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[85vh] cursor-default"
                        >

                            {/* Header Modal Keranjang */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <div className="bg-red-50 p-2 rounded-xl text-red-600">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Rincian Keranjang</h3>
                                        <p className="text-[10px] text-slate-400">{meja} • {totalQty} Item Dipilih</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={clearAllCart}
                                        className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer flex items-center gap-1"
                                        title="Kosongkan Semua Item"
                                    >
                                        <Trash2 size={13} />
                                        <span>Kosongkan</span>
                                    </button>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 cursor-pointer transition"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Daftar Item di Keranjang */}
                            <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
                                {currentCart.map((item) => {
                                    const itemImg = item.gambar || item.img;
                                    const itemTotal = (item.harga || 0) * item.qty;

                                    return (
                                        <div key={item.cartId} className="pt-3 first:pt-0 flex gap-3 items-center justify-between">
                                            {/* Gambar Kecil & Info Item */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-100 relative">
                                                    {itemImg ? (
                                                        <img src={itemImg} alt={item.nama} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageOff size={16} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-bold text-xs text-slate-800 truncate leading-snug">
                                                        {item.nama}
                                                    </h4>
                                                    {item.selectedLevel ? (
                                                        <span className="inline-block bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-100 mt-0.5">
                                                            🔥 Level {item.selectedLevel}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block text-[9px] text-slate-400 font-medium mt-0.5">
                                                            Standar
                                                        </span>
                                                    )}
                                                    <p className="text-xs font-extrabold text-[#b81d24] mt-0.5">
                                                        Rp {itemTotal.toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Stepper Jumlah (+ / -) Ala ShopeeFood */}
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1 rounded-full flex-shrink-0">
                                                <button
                                                    onClick={() => updateCartItemQty(item.cartId, -1)}
                                                    className="p-1 rounded-full hover:bg-white text-slate-600 hover:text-red-600 transition cursor-pointer active:scale-95"
                                                    title={item.qty === 1 ? "Hapus Item" : "Kurangi"}
                                                >
                                                    {item.qty === 1 ? (
                                                        <Trash2 size={14} className="text-red-500" />
                                                    ) : (
                                                        <Minus size={14} />
                                                    )}
                                                </button>
                                                <span className="font-bold text-xs w-4 text-center select-none">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => updateCartItemQty(item.cartId, 1)}
                                                    className="p-1 bg-white text-red-600 shadow-sm rounded-full hover:bg-red-50 transition cursor-pointer active:scale-95"
                                                    title="Tambah"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer Modal Keranjang */}
                            <div className="p-4 border-t border-slate-100 bg-white space-y-3 sticky bottom-0">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Subtotal Pesanan</span>
                                    <span className="text-slate-800 font-extrabold text-sm">
                                        Rp {totalPrice.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsCartOpen(false);
                                        if (onCheckout) onCheckout(currentCart);
                                    }}
                                    className="w-full bg-[#b81d24] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/20 cursor-pointer hover:bg-red-800 transition active:scale-98 flex items-center justify-between px-5"
                                >
                                    <span className="text-xs bg-red-900/40 px-2 py-1 rounded-lg">
                                        {totalQty} Item
                                    </span>
                                    <span className="text-sm">Lanjut Checkout</span>
                                    <span className="text-sm font-extrabold">
                                        Rp {totalPrice.toLocaleString('id-ID')}
                                    </span>
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* --- BOTTOM SHEET MODAL (Muncul saat klik Tambah Menu) --- */}
                {selectedMenu && (
                    <div
                        onClick={closeModal}
                        className="fixed inset-0 z-50 flex items-end sm:justify-center bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-300 cursor-default"
                        >

                            {/* Modal Header */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-100">
                                        {selectedMenu.gambar && !modalImgError ? (
                                            <img
                                                src={selectedMenu.gambar}
                                                alt={selectedMenu.nama}
                                                onError={() => setModalImgError(true)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-1 text-center select-none">
                                                <ImageOff size={20} className="text-slate-400 stroke-[1.5]" />
                                                <span className="text-[8px] text-slate-400 font-semibold leading-tight mt-0.5">
                                                    {selectedMenu.gambar ? 'Foto Rusak' : 'Tanpa Foto'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">{selectedMenu.nama}</h3>
                                        <p className="font-extrabold text-[#b81d24] mt-1">Rp {(selectedMenu.harga || 0).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                                <button onClick={closeModal} className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-6">

                                {/* Pilihan Level (Jika Ada) */}
                                {selectedMenu.levels && selectedMenu.levels.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800 mb-3 flex justify-between">
                                            Pilih Level Pedas <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Wajib</span>
                                        </h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {selectedMenu.levels.map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setModalLevel(level)}
                                                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${modalLevel === level
                                                            ? 'bg-red-50 border-red-500 text-red-600 shadow-sm'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'
                                                        }`}
                                                >
                                                    Level {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Atur Jumlah */}
                                <div className="flex justify-between items-center pt-2">
                                    <h4 className="font-bold text-sm text-slate-800">Jumlah</h4>
                                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-1 rounded-full">
                                        <button
                                            onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${modalQty > 1 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="font-bold text-sm w-4 text-center">{modalQty}</span>
                                        <button
                                            onClick={() => setModalQty(modalQty + 1)}
                                            className="p-1.5 bg-white text-red-600 shadow-sm rounded-full cursor-pointer"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer / Tombol Masukkan Keranjang */}
                            <div className="p-4 border-t border-slate-100 bg-white">
                                <button
                                    onClick={addToCart}
                                    className="w-full bg-[#b81d24] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/20 cursor-pointer hover:bg-red-800 transition"
                                >
                                    Tambah ke Keranjang - Rp {((selectedMenu.harga || 0) * modalQty).toLocaleString('id-ID')}
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
