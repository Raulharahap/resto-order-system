import React, { useState } from 'react';
import { Store, Lock, KeyRound, ArrowRight, QrCode } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onSimulateCustomer }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        // PIN default karyawan/kasir: "1234"
        if (pin === '1234' || pin === '0000') {
            onLoginSuccess();
        } else {
            setError(true);
            setPin('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200">

                {/* Header Merah KDS */}
                <div className="bg-[#b81d24] p-8 text-center text-white relative">
                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
                        <Store size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-wider">GACOAN KDS</h1>
                    <p className="text-red-200 text-xs mt-1 font-semibold uppercase tracking-widest">
                        Kitchen Display System & Admin Portal
                    </p>
                </div>

                {/* Form Login PIN */}
                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    PIN Akses Staf / Koki
                                </label>
                                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
                                    PIN Default: 1234
                                </span>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <KeyRound size={20} className="text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => { setPin(e.target.value); setError(false); }}
                                    placeholder="Masukkan PIN (1234)"
                                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-lg font-bold tracking-widest outline-none transition-all text-center ${
                                        error ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                    }`}
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-xs text-red-600 font-bold mt-2 text-center animate-shake">⚠️ PIN salah! Gunakan '1234'</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#b81d24] hover:bg-red-800 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-600/30 flex justify-center items-center gap-2 transition-all cursor-pointer"
                        >
                            <Lock size={18} /> Buka Layar Dapur KDS <ArrowRight size={18} />
                        </button>
                    </form>

                    {/* Pembatas Mode Pengujian */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-bold text-[10px]">Atau Simulasi Pelanggan</span></div>
                    </div>

                    {/* Link Buka Scan QR Pelanggan */}
                    <a
                        href="/?meja=18"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                        <QrCode size={16} className="text-red-600" />
                        <span>Buka Halaman Pelanggan (Meja 18)</span>
                    </a>

                    <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
                        Sistem Self-Order & Kitchen Display • Terhubung ke PostgreSQL
                    </p>
                </div>
            </div>
        </div>
    );
}
