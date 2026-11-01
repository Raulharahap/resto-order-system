import { useState, useEffect } from 'react';
import WelcomeScreen from './pages/WelcomeScreen';
import MenuScreen from './pages/MenuScreen';
import CheckoutScreen from './pages/CheckoutScreen';
import TrackingScreen from './pages/TrackingScreen';

// --- IMPORT HALAMAN ADMIN & DAPUR ---
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenuManagement from './pages/AdminMenuManagement';
import AdminReports from './pages/AdminReports';
import AdminCashier from './pages/AdminCashier';
import AdminVouchers from './pages/AdminVouchers';
import AdminTableQR from './pages/AdminTableQR';

export default function App() {
  // 1. DETEKSI APAKAH URL MENGARAH KE ADMIN ATAU PELANGGAN
  const isDirectAdminUrl = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.startsWith('/admin') ||
      hash.startsWith('#/admin') ||
      hash.startsWith('#admin') ||
      search.includes('mode=admin')
    );
  };

  const isAdminRoute = isDirectAdminUrl();

  // ========================================================
  // JALUR 1: PORTAL ADMIN & KASIR & DAPUR (URL: /admin)
  // ========================================================
  const [adminScreen, setAdminScreen] = useState(() => {
    if (!isAdminRoute) return 'admin-login';
    const isLoggedIn = localStorage.getItem('resto_admin_logged_in') === 'true';
    const savedScreen = localStorage.getItem('resto_admin_screen') || 'admin-dashboard';
    return isLoggedIn ? savedScreen : 'admin-login';
  });

  const handleAdminNavigate = (screen) => {
    if (screen === 'admin-login') {
      localStorage.removeItem('resto_admin_logged_in');
      localStorage.removeItem('resto_admin_screen');
      setAdminScreen('admin-login');
    } else {
      localStorage.setItem('resto_admin_logged_in', 'true');
      localStorage.setItem('resto_admin_screen', screen);
      setAdminScreen(screen);
    }
  };

  // ========================================================
  // JALUR 2: PORTAL PELANGGAN / SCAN QR (URL: /?meja=18)
  // ========================================================
  // Ekstraksi parameter meja dari URL
  const getInitialCustomerData = () => {
    if (typeof window === 'undefined') {
      return { meja: 'Meja 18', nama: '', tamu: null, orderId: null, screen: 'welcome' };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const rawMeja = searchParams.get('meja') || searchParams.get('table') || '18';
    const formattedMeja = rawMeja.toLowerCase().startsWith('meja') ? rawMeja : `Meja ${rawMeja}`;

    const savedOrderId =
      localStorage.getItem(`resto_active_order_id_${formattedMeja}`) ||
      localStorage.getItem('resto_active_order_id') ||
      null;

    const savedNama = localStorage.getItem(`resto_nama_${formattedMeja}`) || '';
    const savedTamu = localStorage.getItem(`resto_tamu_${formattedMeja}`) || null;

    // Cek parameter view di URL atau di localStorage
    const viewParam = searchParams.get('view');
    const savedScreen = localStorage.getItem(`resto_customer_screen_${formattedMeja}`);

    let initialScreen = 'welcome';
    if (savedOrderId) {
      // Jika ada pesanan aktif dan pengguna sedang menambah menu
      if (viewParam === 'menu' || savedScreen === 'menu') {
        initialScreen = 'menu';
      } else {
        initialScreen = 'tracking';
      }
    } else if (viewParam === 'menu' || savedScreen === 'menu') {
      initialScreen = 'menu';
    }

    return {
      meja: formattedMeja,
      nama: savedNama,
      tamu: savedTamu,
      orderId: savedOrderId ? Number(savedOrderId) : null,
      screen: initialScreen,
    };
  };

  const [customerInit] = useState(getInitialCustomerData);

  // State Layar Pelanggan
  const [customerScreen, setCustomerScreen] = useState(customerInit.screen);

  // State Meja & Identitas Pelanggan
  const [orderData, setOrderData] = useState({
    meja: customerInit.meja,
    tamu: customerInit.tamu,
    nama: customerInit.nama,
  });

  // Keranjang Belanja Pelanggan
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(`resto_cart_${customerInit.meja}`);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

  // State Pesanan Aktif Pelanggan
  const [latestOrder, setLatestOrder] = useState(() => {
    if (customerInit.orderId) {
      return {
        backendOrderId: customerInit.orderId,
        id: customerInit.orderId,
        meja: customerInit.meja,
        namaPelanggan: customerInit.nama,
      };
    }
    return null;
  });

  // Sinkronisasi Cart ke LocalStorage
  useEffect(() => {
    if (!isAdminRoute && orderData?.meja) {
      try {
        localStorage.setItem(`resto_cart_${orderData.meja}`, JSON.stringify(cart));
      } catch (err) {
        console.error('Gagal simpan cart:', err);
      }
    }
  }, [cart, orderData.meja, isAdminRoute]);

  // Fungsi Transisi Layar Pelanggan & Sinkronisasi URL agar aman dari F5 Refresh
  const navigateCustomer = (screen) => {
    setCustomerScreen(screen);
    if (orderData?.meja) {
      localStorage.setItem(`resto_customer_screen_${orderData.meja}`, screen);
    }
    // Update URL query string tanpa reload halaman
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const mejaNum = orderData.meja.replace(/[^0-9]/g, '') || '18';
        url.searchParams.set('meja', mejaNum);
        url.searchParams.set('view', screen);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error('Gagal update URL:', e);
    }
  };

  // Pelanggan Mulai Pesan
  const handleMulaiPesan = (selectedTamu, customerName) => {
    setOrderData((prev) => ({
      ...prev,
      tamu: selectedTamu,
      nama: customerName,
    }));

    if (orderData.meja) {
      localStorage.setItem(`resto_tamu_${orderData.meja}`, selectedTamu);
      localStorage.setItem(`resto_nama_${orderData.meja}`, customerName);
    }
    navigateCustomer('menu');
  };

  // Pelanggan Berhasil Checkout
  const handleOrderSuccess = (orderSummary) => {
    setLatestOrder(orderSummary);
    setCart([]); // Kosongkan keranjang setelah order dibuat

    if (orderData.meja) {
      localStorage.removeItem(`resto_cart_${orderData.meja}`);
      const orderId = orderSummary.backendOrderId || orderSummary.id;
      if (orderId) {
        localStorage.setItem(`resto_active_order_id_${orderData.meja}`, String(orderId));
        localStorage.setItem('resto_active_order_id', String(orderId));
      }
      if (orderSummary.namaPelanggan) {
        localStorage.setItem(`resto_nama_${orderData.meja}`, orderSummary.namaPelanggan);
      }
    }
    navigateCustomer('tracking');
  };

  // Reset Sesi Pesanan (Selesai Makan / Kunjungan Baru)
  const handleResetOrder = () => {
    if (orderData.meja) {
      localStorage.removeItem(`resto_active_order_id_${orderData.meja}`);
      localStorage.removeItem(`resto_cart_${orderData.meja}`);
      localStorage.removeItem(`resto_customer_screen_${orderData.meja}`);
    }
    localStorage.removeItem('resto_active_order_id');
    setLatestOrder(null);
    setCart([]);
    navigateCustomer('welcome');
  };

  // ========================================================
  // RENDER: APAPUN YANG TERJADI, ADMIN DAN PELANGGAN TERPISAH
  // ========================================================

  // --- KONDISI A: PENGGUNA MEMBUKA URL /admin ---
  if (isAdminRoute) {
    return (
      <main className="min-h-screen bg-slate-100">
        {adminScreen === 'admin-login' && (
          <AdminLogin onLoginSuccess={() => handleAdminNavigate('admin-dashboard')} />
        )}
        {adminScreen === 'admin-dashboard' && (
          <AdminDashboard onNavigate={handleAdminNavigate} />
        )}
        {adminScreen === 'admin-cashier' && (
          <AdminCashier onNavigate={handleAdminNavigate} />
        )}
        {adminScreen === 'admin-menu-management' && (
          <AdminMenuManagement onNavigate={handleAdminNavigate} />
        )}
        {adminScreen === 'admin-reports' && (
          <AdminReports onNavigate={handleAdminNavigate} />
        )}
        {adminScreen === 'admin-vouchers' && (
          <AdminVouchers onNavigate={handleAdminNavigate} />
        )}
        {adminScreen === 'admin-table-qr' && (
          <AdminTableQR onNavigate={handleAdminNavigate} />
        )}
      </main>
    );
  }

  // --- KONDISI B: PENGGUNA MEMBUKA URL PELANGGAN / SCAN QR (/) ---
  return (
    <main className="min-h-screen bg-[#fcfcfd]">
      {customerScreen === 'welcome' && (
        <WelcomeScreen
          meja={orderData.meja}
          defaultTamu={orderData.tamu}
          defaultNama={orderData.nama}
          onMulaiPesan={handleMulaiPesan}
        />
      )}

      {customerScreen === 'menu' && (
        <MenuScreen
          orderData={orderData}
          onBack={() => navigateCustomer('welcome')}
          onCheckout={() => navigateCustomer('checkout')}
          cart={cart}
          setCart={setCart}
          activeOrder={latestOrder}
          onBackToTracking={latestOrder ? () => navigateCustomer('tracking') : null}
        />
      )}

      {customerScreen === 'checkout' && (
        <CheckoutScreen
          orderData={orderData}
          cart={cart}
          setCart={setCart}
          onKembali={() => navigateCustomer('menu')}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {customerScreen === 'tracking' && (
        <TrackingScreen
          orderData={orderData}
          latestOrder={latestOrder}
          onTambahPesanan={() => navigateCustomer('menu')}
          onResetOrder={handleResetOrder}
        />
      )}
    </main>
  );
}
