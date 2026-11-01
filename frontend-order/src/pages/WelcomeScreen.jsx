import { useState, useRef } from 'react';
import { Wifi, QrCode, BadgeCheck, Edit, Zap, Wallet, ReceiptText, ArrowRight, Snowflake, AlertCircle, User } from 'lucide-react';

export default function WelcomeScreen({ defaultTamu = null, defaultNama = '', onMulaiPesan, meja = 'Meja 18', onGoToAdmin }) {
    // Default null (kosong) agar pelanggan sadar menentukan jumlah tamu, atau gunakan defaultTamu jika pernah memilih
    const [tamu, setTamu] = useState(defaultTamu);
    const [nama, setNama] = useState(defaultNama || '');
    const [error, setError] = useState('');
    const tamuSectionRef = useRef(null);

    const handleSelectTamu = (opsi) => {
        setTamu(opsi);
        if (error) setError('');
    };

    const handleMulaiPesan = () => {
        if (!nama.trim()) {
            setError('Silakan masukkan nama pemesan terlebih dahulu ya!');
            return;
        }

        if (!tamu) {
            setError('Silakan pilih jumlah orang terlebih dahulu ya!');
            tamuSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Panggil fungsi navigasi ke MenuScreen dengan tamu & nama
        if (onMulaiPesan) {
            onMulaiPesan(tamu, nama.trim());
        }
    };

    return (
        // Pembungkus utama: Latar belakang abu-abu sangat muda, max-width menyerupai HP
        <div className="min-h-screen bg-[#fcfcfd] flex justify-center">
            <div className="w-full max-w-md bg-[#fcfcfd] relative pb-28 shadow-sm">

                {/* Konten Utama ditaruh di dalam padding */}
                <div className="p-5 space-y-6">

                    {/* Header Badges */}
                    <div className="flex justify-between items-center text-xs font-semibold">
                        <div className="flex items-center gap-2 bg-blue-50 text-slate-700 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            <span>OUTLET GACOAN TEUKU UMAR</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href="/admin"
                                className="text-[10px] text-slate-500 hover:text-red-600 font-bold px-2.5 py-1 bg-white hover:bg-red-50 border border-slate-200 rounded-full transition cursor-pointer"
                            >
                                Portal Admin
                            </a>
                            <div className="flex items-center gap-1.5 bg-blue-50 text-slate-700 px-2.5 py-1.5 rounded-full">
                                <Wifi size={14} className="text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    {/* Title Section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm tracking-wider">
                            <span>🌶️</span> SELF-ORDER EXPRESS
                        </div>
                        <h1 className="text-4xl font-extrabold text-[#1a233a] leading-tight">
                            Selamat Datang di <br /> Gacoan!
                        </h1>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Pesan santai tanpa antre kasir. Pilih level pedas favoritmu dan bayar langsung dari meja.
                        </p>
                    </div>

                    {/* Hero Image */}
                    <div className="relative rounded-2xl overflow-hidden h-48 w-full shadow-sm">
                        <img
                            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000&auto=format&fit=crop"
                            alt="Suasana Restoran"
                            className="object-cover w-full h-full"
                        />
                        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 text-slate-800">
                            <Zap size={14} className="text-orange-500" />
                            Pedas Manis & Pedas Gurih Siap Saji
                        </div>
                    </div>

                    {/* Card Meja & Tamu */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-5">
                        {/* Status QR */}
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                                    <QrCode size={20} />
                                </div>
                                <span className="font-semibold text-slate-800">Scan QR Berhasil</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                <BadgeCheck size={14} /> Terverifikasi
                            </div>
                        </div>

                        {/* Detail Meja */}
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-1">LOKASI MEJA ANDA</p>
                                <h2 className="text-4xl font-extrabold text-[#1a233a] mb-2">{meja || 'Meja 18'}</h2>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <Snowflake size={14} className="text-red-500" />
                                    Area Indoor • Bebas Asap (AC)
                                </div>
                            </div>
                            <button className="bg-blue-50/50 hover:bg-blue-50 transition p-3 rounded-2xl flex flex-col items-center gap-1 text-slate-700">
                                <Edit size={20} className="text-red-600" />
                                <span className="text-[10px] font-semibold">Ganti</span>
                            </button>
                        </div>

                        {/* Input Nama Pemesan */}
                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 mb-2">
                                <User size={15} className="text-red-600" />
                                <p className="text-sm font-bold text-slate-800">Nama Pemesan</p>
                                <span className="text-red-500 font-bold">*</span>
                            </div>
                            <input
                                type="text"
                                value={nama}
                                onChange={(e) => {
                                    setNama(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="Contoh: Kak Budi / Maya"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Nama ini akan dipanggil saat pesanan siap atau di kasir.</p>
                        </div>

                        {/* Pilihan Jumlah Tamu */}
                        <div
                            ref={tamuSectionRef}
                            className={`pt-3 pb-3 px-3 rounded-2xl transition-all duration-200 ${
                                error ? 'bg-red-50/50 border border-red-300 ring-2 ring-red-100' : ''
                            }`}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-bold text-slate-800">Jumlah Orang (Tamu)</p>
                                        <span className="text-red-500 font-bold">*</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Untuk sendok & mangkok</p>
                                </div>
                                {tamu && (
                                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                        {tamu}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {['1 Org', '2 Org', '3-4 Org', '5+ Rame'].map((opsi) => (
                                    <button
                                        key={opsi}
                                        type="button"
                                        onClick={() => handleSelectTamu(opsi)}
                                        className={`py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                                            tamu === opsi
                                                ? 'bg-[#b81d24] text-white shadow-md'
                                                : 'bg-blue-50/70 text-slate-700 hover:bg-blue-100'
                                        }`}
                                    >
                                        {opsi}
                                    </button>
                                ))}
                            </div>

                            {/* Pesan Validasi Error */}
                            {error && (
                                <div className="flex items-center gap-1.5 mt-2.5 text-red-600 text-xs font-semibold animate-pulse">
                                    <AlertCircle size={15} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Features Bottom */}
                    <div className="grid grid-cols-3 gap-2 py-4">
                        <div className="flex flex-col items-center gap-2 text-center border-r border-slate-200">
                            <Zap size={20} className="text-red-600" />
                            <span className="text-xs text-slate-600 font-medium">Cepat Saji</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 text-center border-r border-slate-200">
                            <Wallet size={20} className="text-orange-700" />
                            <span className="text-xs text-slate-600 font-medium">QRIS / E-Wallet</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <ReceiptText size={20} className="text-yellow-700" />
                            <span className="text-xs text-slate-600 font-medium">Struk Digital</span>
                        </div>
                    </div>

                </div>

                {/* Floating Action Button (Sticky Bottom) */}
                <div className="fixed sm:absolute bottom-0 w-full max-w-md bg-gradient-to-t from-[#fcfcfd] via-[#fcfcfd] to-transparent p-5 pt-8">
                    <button
                        onClick={handleMulaiPesan}
                        className="w-full bg-[#b81d24] hover:bg-red-800 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 cursor-pointer"
                    >
                        Lihat Menu & Mulai Pesan <ArrowRight size={20} />
                    </button>
                    <p className="text-[10px] text-center text-slate-500 mt-3 font-medium">
                        Pesanan akan langsung diteruskan ke staf dapur Meja 18
                    </p>
                </div>

            </div>
        </div>
    );
}
