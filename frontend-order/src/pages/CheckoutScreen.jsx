import { useState } from 'react';
import { apiService } from '../services/api';
import {
    ArrowLeft, Clock, Utensils, Trash2, Plus, Minus, PlusCircle,
    AlignLeft, CreditCard, ScanLine, Lock, ArrowRight, Store,
    CheckCircle2, Circle, AlertCircle, Loader2, ImageOff, Ticket,
    Tag, Sparkles, Check, X, User
} from 'lucide-react';

export default function CheckoutScreen({ onKembali, onOrderSuccess, orderData, cart, setCart }) {
    // State untuk metode pembayaran & catatan meja
    const [paymentMethod, setPaymentMethod] = useState('qris');
    const [namaPelanggan, setNamaPelanggan] = useState(orderData?.nama || '');
    const [catatanMeja, setCatatanMeja] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // State Voucher Promo
    const [voucherInput, setVoucherInput] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
    const [voucherError, setVoucherError] = useState('');
    const [voucherSuccess, setVoucherSuccess] = useState('');

    // Data default simulasi jika keranjang kosong saat dibuka langsung
    const defaultDummyItems = [
        {
            id: 1,
            menu_id: 1,
            nama: "Mie Gacoan (Manis Pedas)",
            harga: 11500,
            qty: 1,
            selectedLevel: 2,
            badge: "🔥 Lvl 2",
            note: "Banyakin pangsit tabur",
            img: ""
        },
        {
            id: 3,
            menu_id: 3,
            nama: "Dimsum Udang Keju",
            harga: 11500,
            qty: 1,
            selectedLevel: null,
            badge: "Isi 3 pcs",
            note: "Saus dipisah",
            img: ""
        }
    ];

    // Gunakan data keranjang aktual dari MenuScreen jika ada
    const [cartItems, setCartItems] = useState(() => {
        if (cart && cart.length > 0) {
            return cart.map((item) => ({
                id: item.cartId || item.id,
                menu_id: item.id,
                nama: item.nama,
                harga: item.harga,
                qty: item.qty,
                selectedLevel: item.selectedLevel,
                badge: item.selectedLevel ? `🔥 Lvl ${item.selectedLevel}` : 'Standar',
                note: item.note || (item.selectedLevel ? `Level pedas ${item.selectedLevel}` : 'Standar dapur'),
                img: item.gambar || item.img
            }));
        }
        return defaultDummyItems;
    });

    // Fungsi ubah jumlah (sinkron dengan cart induk)
    const updateQty = (id, delta) => {
        setCartItems(prev => {
            const updated = prev.map(item => {
                if (item.id === id) {
                    const newQty = item.qty + delta;
                    return newQty > 0 ? { ...item, qty: newQty } : null;
                }
                return item;
            }).filter(Boolean);

            if (setCart && cart && cart.length > 0) {
                const parentUpdated = cart.map(item => {
                    if ((item.cartId || item.id) === id) {
                        const newQty = item.qty + delta;
                        return newQty > 0 ? { ...item, qty: newQty } : null;
                    }
                    return item;
                }).filter(Boolean);
                setCart(parentUpdated);
            }

            return updated;
        });
    };

    const deleteItem = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
        if (setCart && cart && cart.length > 0) {
            setCart(cart.filter(c => (c.cartId || c.id) !== id));
        }
    };

    // Fungsi Rekomendasi Topping (Upselling)
    const handleAddQuickAddon = (name, price) => {
        const addonItem = {
            id: `addon-${Date.now()}`,
            menu_id: 3,
            nama: name,
            harga: price,
            qty: 1,
            selectedLevel: null,
            badge: "Ekstra Topping",
            note: "Tambahan Rekomendasi",
            img: ""
        };

        setCartItems(prev => [...prev, addonItem]);
        if (setCart) {
            setCart(prev => [...(prev || []), {
                ...addonItem,
                cartId: addonItem.id
            }]);
        }
    };

    // Perhitungan Harga
    const subtotal = cartItems.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const tax = Math.round(discountedSubtotal * 0.10); // Pajak PB1 10%
    const serviceFee = 1000; // Biaya layanan & kemasan
    const total = discountedSubtotal + tax + serviceFee;

    // --- TERAPKAN KODE VOUCHER / KUPON ---
    const handleApplyVoucher = async () => {
        if (!voucherInput.trim()) return;
        setIsApplyingVoucher(true);
        setVoucherError('');
        setVoucherSuccess('');
        try {
            const res = await apiService.applyVoucher({
                kode: voucherInput.trim(),
                subtotal: subtotal
            });
            setAppliedVoucher(res.voucher);
            setDiscountAmount(res.diskon || 0);
            setVoucherSuccess(`Kupon "${res.voucher?.kode}" berhasil! Potongan Rp ${(res.diskon || 0).toLocaleString('id-ID')}`);
        } catch (err) {
            setVoucherError(err.message || 'Kupon tidak valid atau syarat minimal belanja belum terpenuhi');
            setAppliedVoucher(null);
            setDiscountAmount(0);
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        setVoucherInput('');
        setVoucherSuccess('');
        setVoucherError('');
    };

    // --- PENGIRIMAN PESANAN KE BACKEND GOLANG (POST /orders) ---
    const handlePesanSekarang = async () => {
        if (cartItems.length === 0) {
            alert("Keranjang pesanan masih kosong!");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        const guestCount = parseInt(orderData?.tamu, 10) || 2;
        const nomorAntrean = `#B-${Math.floor(10 + Math.random() * 90)}`;

        const payload = {
            nomor_antrean: nomorAntrean,
            nama_pelanggan: namaPelanggan.trim() || 'Tamu',
            meja: orderData?.meja || 'Meja 18',
            jumlah_tamu: guestCount,
            catatan_meja: catatanMeja.trim(),
            metode_bayar: paymentMethod === 'qris' ? 'QRIS' : 'Tunai di Kasir',
            total_harga: Math.round(total),
            kode_voucher: appliedVoucher ? appliedVoucher.kode : '',
            diskon: discountAmount,
            items: cartItems.map((item) => ({
                menu_id: Number(item.menu_id || item.id || 1),
                qty: Number(item.qty),
                harga_satuan: Number(item.harga),
                level_pedas: item.selectedLevel ? Number(item.selectedLevel) : 0,
                catatan: item.note || (item.selectedLevel ? `Level pedas ${item.selectedLevel}` : '')
            }))
        };

        try {
            const response = await apiService.createOrder(payload);
            const createdOrder = response.data || {};
            const realOrderId = response.order_id || createdOrder.id;

            const orderSummary = {
                backendOrderId: realOrderId,
                orderId: createdOrder.nomor_antrean || nomorAntrean,
                orderCode: `GC-${realOrderId || Math.floor(1000 + Math.random() * 9000)}`,
                namaPelanggan: namaPelanggan.trim() || 'Tamu',
                subtotal,
                tax,
                serviceFee,
                total,
                paymentMethod,
                items: cartItems,
                meja: orderData?.meja || 'Meja 18',
                tamu: orderData?.tamu || `${guestCount} Org`,
                catatanMeja: catatanMeja.trim(),
                kodeVoucher: appliedVoucher ? appliedVoucher.kode : '',
                diskon: discountAmount,
                status: createdOrder.status || 'Menunggu',
                createdAt: createdOrder.created_at || new Date().toISOString()
            };

            if (onOrderSuccess) {
                onOrderSuccess(orderSummary);
            }
        } catch (err) {
            console.error("Gagal checkout pesanan:", err);
            setSubmitError(err.message || 'Gagal menyimpan pesanan ke server backend Golang');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center">
            <div className="w-full max-w-md bg-slate-50 relative pb-32 shadow-sm">

                {/* --- HEADER --- */}
                <div className="bg-white px-4 pt-4 pb-4 shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onKembali}
                            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="font-extrabold text-base text-slate-800">Konfirmasi Pesanan</h1>
                            <p className="text-[10px] text-slate-400 font-medium">Periksa kembali menu & metode pembayaran</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-4">

                    {/* Card Lokasi Meja & Nama Pelanggan */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 text-[#b81d24] flex items-center justify-center font-black">
                                    <Store size={20} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOKASI PESANAN</span>
                                    <h3 className="font-extrabold text-sm text-slate-800">{orderData?.meja || 'Meja 18'}</h3>
                                </div>
                            </div>
                            <span className="bg-red-50 text-[#b81d24] text-xs font-bold px-3 py-1 rounded-full">
                                {orderData?.tamu || '2 Tamu'}
                            </span>
                        </div>

                        {/* Input / Konfirmasi Nama Pemesan */}
                        <div className="pt-2.5 border-t border-slate-100">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                                <User size={13} className="text-red-600" />
                                <span>Nama Pemesan / Panggilan:</span>
                            </label>
                            <input
                                type="text"
                                value={namaPelanggan}
                                onChange={(e) => setNamaPelanggan(e.target.value)}
                                placeholder="Masukkan nama kamu (contoh: Kak Budi)"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                            />
                        </div>
                    </div>

                    {/* Card 1: Daftar Menu yang Dipesan */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Utensils size={16} className="text-[#b81d24]" /> Menu yang Dipesan
                            </h2>
                            <span className="text-xs text-slate-400 font-bold">{cartItems.length} Jenis Item</span>
                        </div>

                        <div className="space-y-3 divide-y divide-slate-100">
                            {cartItems.map((item) => (
                                <div key={item.id} className="pt-3 first:pt-0 flex gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                                        {item.img ? (
                                            <img src={item.img} alt={item.nama} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageOff size={16} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-xs text-slate-800 truncate">{item.nama}</h4>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="text-slate-300 hover:text-red-600 p-0.5 cursor-pointer"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {item.badge} {item.note && `• "${item.note}"`}
                                        </p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="font-extrabold text-[#b81d24] text-sm">
                                                Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                                            </span>

                                            {/* Qty Control */}
                                            <div className="flex items-center bg-slate-50 rounded-full border border-slate-200">
                                                <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-500 hover:bg-slate-200 rounded-full cursor-pointer"><Minus size={12} /></button>
                                                <span className="w-6 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-[#b81d24] text-white rounded-full shadow-sm cursor-pointer"><Plus size={12} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* --- REKOMENDASI TAMBAHAN / UPSELLING --- */}
                        <div className="pt-3 border-t border-dashed border-slate-200">
                            <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-2">
                                <Sparkles size={12} className="text-[#b81d24]" /> Mau Tambah Menu Pendamping?
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleAddQuickAddon("Pangsit Goreng Ekstra", 4000)}
                                    className="p-2 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-xl text-left transition cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-800">Pangsit Goreng</p>
                                        <p className="text-[9px] text-red-600 font-extrabold">+Rp 4.000</p>
                                    </div>
                                    <Plus size={14} className="text-[#b81d24]" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddQuickAddon("Es Teh Manis Segar", 5000)}
                                    className="p-2 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-xl text-left transition cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-800">Es Teh Manis</p>
                                        <p className="text-[9px] text-red-600 font-extrabold">+Rp 5.000</p>
                                    </div>
                                    <Plus size={14} className="text-[#b81d24]" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onKembali}
                            className="w-full mt-3 py-2.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-[#b81d24] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                            <PlusCircle size={14} /> Pilih Menu Lain dari Katalog
                        </button>
                    </div>

                    {/* Card 2: Voucher & Promo Diskon */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                            <Ticket size={16} className="text-[#b81d24]" /> Kupon Promo & Voucher Hemat
                        </h2>

                        {appliedVoucher ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                                        <Check size={16} />
                                    </div>
                                    <div>
                                        <span className="font-mono font-black text-xs text-emerald-900 tracking-wider">
                                            {appliedVoucher.kode}
                                        </span>
                                        <p className="text-[10px] text-emerald-700 font-semibold">
                                            Hemat Rp {discountAmount.toLocaleString('id-ID')} ({appliedVoucher.judul})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveVoucher}
                                    className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer"
                                >
                                    Hapus
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ketik kode promo (misal: GACOANHEMAT)"
                                    value={voucherInput}
                                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider outline-none focus:border-red-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyVoucher}
                                    disabled={isApplyingVoucher || !voucherInput.trim()}
                                    className="px-4 py-2.5 bg-[#b81d24] hover:bg-red-800 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                >
                                    {isApplyingVoucher ? 'Cek...' : 'Gunakan'}
                                </button>
                            </div>
                        )}

                        {voucherSuccess && (
                            <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                <Check size={13} /> {voucherSuccess}
                            </p>
                        )}
                        {voucherError && (
                            <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                                <AlertCircle size={13} /> {voucherError}
                            </p>
                        )}
                    </div>

                    {/* Card 3: Catatan Tambahan Meja */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-1">
                            <AlignLeft size={16} className="text-orange-700" /> Catatan Tambahan untuk Meja
                        </h2>
                        <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                            Sampaikan preferensi penyajian atau alat makan ekstra ke dapur.
                        </p>
                        <textarea
                            value={catatanMeja}
                            onChange={(e) => setCatatanMeja(e.target.value)}
                            placeholder="Contoh: Jangan terlalu asin, minta sendok lebih 1 pasang..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:border-red-300 focus:ring-1 focus:ring-red-200 resize-none h-16 placeholder:text-slate-400"
                        ></textarea>
                    </div>

                    {/* Card 4: Metode Pembayaran */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <CreditCard size={16} className="text-red-700" /> Metode Pembayaran
                            </h2>
                            <span className="text-[9px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">Pilih Satu</span>
                        </div>

                        <div className="space-y-2">
                            {/* Option 1: QRIS */}
                            <div
                                onClick={() => setPaymentMethod('qris')}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'qris' ? 'border-[#b81d24] bg-red-50/20' : 'border-slate-100 bg-white'
                                    }`}
                            >
                                <div className="bg-[#b81d24] text-white p-2.5 rounded-xl">
                                    <ScanLine size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-slate-800">QRIS / Instant E-Wallet</h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">GoPay, ShopeePay, DANA, OVO, BCA</p>
                                    <p className="text-[9px] text-red-600 font-semibold mt-1 flex items-center gap-0.5">
                                        ⚡ Otomatis Terverifikasi & Langsung Dimasak
                                    </p>
                                </div>
                                <div className="text-[#b81d24]">
                                    {paymentMethod === 'qris' ? <CheckCircle2 size={20} className="fill-red-100" /> : <Circle size={20} className="text-slate-300" />}
                                </div>
                            </div>

                            {/* Option 2: Cash */}
                            <div
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-[#b81d24] bg-red-50/20' : 'border-slate-100 bg-white'
                                    }`}
                            >
                                <div className="bg-slate-100 text-slate-600 p-2.5 rounded-xl">
                                    <CreditCard size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-slate-800">Bayar di Kasir (Tunai / EDC)</h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Tunjukkan nomor antrean ini ke kasir depan</p>
                                </div>
                                <div className="text-[#b81d24]">
                                    {paymentMethod === 'cash' ? <CheckCircle2 size={20} className="fill-red-100" /> : <Circle size={20} className="text-slate-300" />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 5: Ringkasan Biaya */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <h2 className="font-bold text-slate-800 text-sm mb-3">Ringkasan Pembayaran</h2>

                        <div className="space-y-2 text-xs text-slate-600">
                            <div className="flex justify-between">
                                <span>Subtotal Pesanan ({cartItems.length} Item)</span>
                                <span className="font-medium text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>

                            {discountAmount > 0 && (
                                <div className="flex justify-between font-bold text-emerald-600">
                                    <span>Potongan Diskon Kupon ({appliedVoucher?.kode})</span>
                                    <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span>Pajak Restoran (PB1 10%)</span>
                                <span className="font-medium text-slate-800">Rp {tax.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Biaya Layanan & Alat Makan</span>
                                <span className="font-medium text-slate-800">Rp {serviceFee.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 border-dashed my-3 pt-3 flex justify-between items-end">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOTAL PEMBAYARAN</span>
                                <p className="text-xs text-slate-500">Termasuk pajak PB1 10%</p>
                            </div>
                            <span className="text-xl font-black text-[#b81d24]">
                                Rp {Math.round(total).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {submitError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-bold flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{submitError}</span>
                        </div>
                    )}

                </div>

                {/* --- FOOTER TOMBOL PESAN SEKARANG --- */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-20 flex justify-center">
                    <div className="w-full max-w-md flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">TOTAL TAGIHAN</p>
                            <h3 className="text-lg font-black text-[#b81d24] leading-tight">
                                Rp {Math.round(total).toLocaleString('id-ID')}
                            </h3>
                        </div>

                        <button
                            onClick={handlePesanSekarang}
                            disabled={isSubmitting || cartItems.length === 0}
                            className="flex-1 py-3.5 bg-[#b81d24] hover:bg-red-800 active:scale-98 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span>Pesan Sekarang</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}