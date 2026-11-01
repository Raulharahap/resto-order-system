import React, { useState } from 'react';
import {
    MonitorPlay, LayoutDashboard, Settings, BarChart3,
    QrCode, LogOut, Printer, Store, Wifi, ExternalLink,
    Check, Sparkles, CreditCard, Ticket
} from 'lucide-react';

export default function AdminTableQR({ onNavigate, onSimulateCustomer }) {
    const [selectedTable, setSelectedTable] = useState('18');
    const [wifiSSID, setWifiSSID] = useState('Gacoan_Free_WiFi');
    const [wifiPass, setWifiPass] = useState('gacoanpedas');
    const [batchCount, setBatchCount] = useState(12);
    const [viewMode, setViewMode] = useState('single'); // 'single' atau 'batch'

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const currentTableUrl = `${baseUrl}/?meja=${selectedTable}`;
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(currentTableUrl)}`;

    const tablesList = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'));

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

                        <button className="w-full flex items-center gap-3 bg-[#b81d24] text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-red-600/20 cursor-pointer text-left">
                            <QrCode size={18} /> Cetak Standee QR Meja
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('admin-reports')}
                            className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <BarChart3 size={18} /> Laporan & Omset
                        </button>

                        <p className="text-[10px] font-bold text-slate-400 px-3 pt-4 mb-2 uppercase tracking-wider">Akses Cepat</p>
                        <a
                            href={`/?meja=${selectedTable}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between text-slate-600 hover:bg-red-50 hover:text-red-700 px-4 py-3 rounded-xl font-medium text-sm transition cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3">
                                <ExternalLink size={18} className="text-red-600" />
                                <span>Buka Menu Meja {selectedTable}</span>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Status Server & Logout */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STANDAR AKRILIK RESTO</p>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Format A6 / Standee Meja</span>
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
                            GENERATOR STANDEE QR CODE MEJA <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px]">SIAP CETAK</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Outlet Teuku Umar • Buat Kartu QR Akrilik untuk Seluruh Meja Restoran</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                            <button
                                onClick={() => setViewMode('single')}
                                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                    viewMode === 'single' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Satuan (Meja {selectedTable})
                            </button>
                            <button
                                onClick={() => setViewMode('batch')}
                                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                    viewMode === 'batch' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Sekaligus ({batchCount} Meja)
                            </button>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 bg-[#b81d24] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 hover:bg-red-800 transition cursor-pointer"
                        >
                            <Printer size={16} /> Cetak Standee
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Mode Satuan (Single Table Customizer) */}
                    {viewMode === 'single' && (
                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                            {/* Panel Pengaturan */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 print:hidden">
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-800">Pilih Nomor Meja</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Pilih nomor meja yang ingin dicetak standee-nya</p>
                                </div>

                                {/* Grid Pilihan Meja */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Meja Cepat:</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {tablesList.slice(0, 18).map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setSelectedTable(num)}
                                                className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                                                    selectedTable === num
                                                        ? 'bg-[#b81d24] text-white shadow-md shadow-red-600/30'
                                                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Nomor Meja */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Meja Kustom</label>
                                    <input
                                        type="text"
                                        value={selectedTable}
                                        onChange={(e) => setSelectedTable(e.target.value)}
                                        placeholder="Contoh: 18 atau VIP-01"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-red-500"
                                    />
                                </div>

                                {/* Wi-Fi Restoran */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Wi-Fi (SSID)</label>
                                        <input
                                            type="text"
                                            value={wifiSSID}
                                            onChange={(e) => setWifiSSID(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Password Wi-Fi</label>
                                        <input
                                            type="text"
                                            value={wifiPass}
                                            onChange={(e) => setWifiPass(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-500"
                                        />
                                    </div>
                                </div>

                                {/* Link Preview */}
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Target URL Scan QR:</p>
                                    <p className="text-xs font-mono font-bold text-slate-700 break-all mt-0.5">
                                        {currentTableUrl}
                                    </p>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => onSimulateCustomer ? onSimulateCustomer(`Meja ${selectedTable}`) : (onNavigate && onNavigate('welcome'))}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <ExternalLink size={15} /> Tes Buka di Web
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 py-3 bg-[#b81d24] hover:bg-red-800 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-red-600/30 cursor-pointer"
                                    >
                                        <Printer size={15} /> Cetak Standee Ini
                                    </button>
                                </div>
                            </div>

                            {/* Preview Standee Akrilik Meja (Ukuran Standar Standee Resto) */}
                            <div className="flex justify-center">
                                <div
                                    id="standee-print-card"
                                    className="w-[320px] bg-white rounded-3xl shadow-2xl border-4 border-slate-800 overflow-hidden text-center flex flex-col justify-between relative"
                                    style={{ minHeight: '480px' }}
                                >
                                    {/* Header Merah Standee */}
                                    <div className="bg-[#b81d24] text-white py-5 px-4 relative">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Store size={20} />
                                            <h3 className="font-black text-base tracking-widest uppercase">MIE GACOAN</h3>
                                        </div>
                                        <p className="text-[10px] font-bold text-red-200 tracking-wider uppercase">Dine-In Self Order</p>
                                    </div>

                                    {/* Nomor Meja Besar */}
                                    <div className="py-4 bg-slate-50 border-b border-slate-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">NOMOR MEJA</p>
                                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-0.5">
                                            MEJA {selectedTable}
                                        </h1>
                                    </div>

                                    {/* QR Code Container */}
                                    <div className="p-6 flex flex-col items-center justify-center">
                                        <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-inner">
                                            <img
                                                src={qrCodeApiUrl}
                                                alt={`QR Code Meja ${selectedTable}`}
                                                className="w-48 h-48 object-contain"
                                            />
                                        </div>
                                        <p className="text-xs font-extrabold text-slate-800 mt-3 flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-[#b81d24]" /> SCAN UNTUK PESAN & BAYAR
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5 max-w-[220px] leading-snug">
                                            Arahkan kamera HP ke kode QR di atas untuk langsung memilih menu favorit Anda.
                                        </p>
                                    </div>

                                    {/* Footer Wi-Fi Resto */}
                                    <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between text-[10px] font-bold">
                                        <div className="flex items-center gap-1.5 text-slate-300">
                                            <Wifi size={14} className="text-red-400" />
                                            <span>Wi-Fi: {wifiSSID}</span>
                                        </div>
                                        <div className="text-slate-400">
                                            Pass: <span className="text-white font-mono">{wifiPass}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Mode Batch (Multi Table Sheet untuk Sekaligus Cetak 12 Meja) */}
                    {viewMode === 'batch' && (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center print:hidden">
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-800">Cetak Lembar Banyak Meja</h3>
                                    <p className="text-xs text-slate-500">Standee meja 01 sampai {String(batchCount).padStart(2, '0')} akan dicetak dalam tata letak lembar akrilik</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={batchCount}
                                        onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                    >
                                        <option value={6}>6 Meja (Meja 01 - 06)</option>
                                        <option value={12}>12 Meja (Meja 01 - 12)</option>
                                        <option value={20}>20 Meja (Meja 01 - 20)</option>
                                        <option value={30}>30 Meja (Meja 01 - 30)</option>
                                    </select>
                                    <button
                                        onClick={() => window.print()}
                                        className="bg-[#b81d24] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 hover:bg-red-800 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Printer size={16} /> Cetak Lembar Ini
                                    </button>
                                </div>
                            </div>

                            {/* Batch Sheet Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {tablesList.slice(0, batchCount).map((num) => {
                                    const tUrl = `${baseUrl}/?meja=${num}`;
                                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(tUrl)}`;

                                    return (
                                        <div
                                            key={num}
                                            className="bg-white rounded-2xl border-2 border-slate-800 overflow-hidden shadow-sm text-center flex flex-col justify-between"
                                            style={{ minHeight: '340px' }}
                                        >
                                            <div className="bg-[#b81d24] text-white py-2 px-3">
                                                <h4 className="font-black text-xs tracking-wider uppercase">MIE GACOAN</h4>
                                                <p className="text-[8px] text-red-200 uppercase font-bold">Dine-In Self-Order</p>
                                            </div>

                                            <div className="py-2 bg-slate-50 border-b border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">LOKASI MEJA</p>
                                                <h2 className="text-2xl font-black text-slate-900">MEJA {num}</h2>
                                            </div>

                                            <div className="p-3 flex flex-col items-center justify-center flex-1">
                                                <img src={qrUrl} alt={`QR Meja ${num}`} className="w-28 h-28 object-contain border border-slate-300 rounded-lg p-1" />
                                                <p className="text-[9px] font-black text-slate-800 mt-2 uppercase">Scan untuk Pesan</p>
                                            </div>

                                            <div className="bg-slate-900 text-white p-2 text-[8px] flex justify-between">
                                                <span>Wi-Fi: {wifiSSID}</span>
                                                <span>Pass: {wifiPass}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </main>

        </div>
    );
}
