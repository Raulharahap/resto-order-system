const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const apiService = {
  // --- MENU MANAGEMENT ---
  // Mengambil semua menu
  getMenus: async () => {
    const response = await fetch(`${BASE_URL}/menus`);
    if (!response.ok) throw new Error('Gagal mengambil data menu');
    return await response.json();
  },

  // Menambah menu baru (Admin)
  createMenu: async (menuData) => {
    const response = await fetch(`${BASE_URL}/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menambahkan menu');
    }
    return await response.json();
  },

  // Update menu (misal ubah stok, toggle habis/sold out)
  updateMenu: async (id, menuData) => {
    const response = await fetch(`${BASE_URL}/menus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memperbarui menu');
    }
    return await response.json();
  },

  // Hapus menu
  deleteMenu: async (id) => {
    const response = await fetch(`${BASE_URL}/menus/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menghapus menu');
    }
    return await response.json();
  },

  // Upload file foto menu dari perangkat ke backend
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengupload gambar');
    }
    const resData = await response.json();
    const finalUrl = resData.url || (resData.data && resData.data.url) || '';
    return {
      ...resData,
      url: finalUrl,
      data: { url: finalUrl, ...(resData.data || {}) },
    };
  },

  // --- ORDER & KITCHEN DISPLAY SYSTEM (KDS) ---
  // Mengirim pesanan checkout pelanggan
  createOrder: async (orderData) => {
    const response = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengirim pesanan');
    }
    return await response.json();
  },

  // Mengambil semua antrean pesanan aktif untuk Layar Dapur (KDS)
  getActiveOrders: async () => {
    const response = await fetch(`${BASE_URL}/orders`);
    if (!response.ok) throw new Error('Gagal mengambil antrean pesanan dapur');
    return await response.json();
  },

  // Melacak status 1 pesanan (Pelanggan)
  getOrderById: async (orderId) => {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengambil data status pesanan');
    }
    return await response.json();
  },

  // Memperbarui status pesanan dapur (Menunggu -> Dimasak -> Siap -> Selesai)
  updateOrderStatus: async (orderId, status) => {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memperbarui status pesanan');
    }
    return await response.json();
  },

  // Membatalkan pesanan (kasir atau sistem)
  cancelOrder: async (orderId) => {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal membatalkan pesanan');
    }
    return await response.json();
  },

  // Centang item matang di tiket KDS
  toggleOrderItemDone: async (itemId) => {
    const response = await fetch(`${BASE_URL}/order-items/${itemId}/toggle`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memperbarui status item');
    }
    return await response.json();
  },

  // --- LAPORAN & ANALITIK PENJUALAN ---
  getSalesReport: async () => {
    const response = await fetch(`${BASE_URL}/reports/summary`);
    if (!response.ok) throw new Error('Gagal memuat laporan penjualan');
    return await response.json();
  },

  getOrderHistory: async () => {
    const response = await fetch(`${BASE_URL}/orders/history`);
    if (!response.ok) throw new Error('Gagal memuat riwayat pesanan');
    return await response.json();
  },

  // --- PANGGILAN PELAYAN (WAITER CALL BELL) ---
  createWaiterCall: async (callData) => {
    const response = await fetch(`${BASE_URL}/waiter-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memanggil pelayan');
    }
    return await response.json();
  },

  getActiveWaiterCalls: async () => {
    const response = await fetch(`${BASE_URL}/waiter-calls`);
    if (!response.ok) throw new Error('Gagal mengambil panggilan pelayan');
    return await response.json();
  },

  completeWaiterCall: async (id) => {
    const response = await fetch(`${BASE_URL}/waiter-calls/${id}/done`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Gagal menyelesaikan panggilan pelayan');
    return await response.json();
  },

  // --- KUPON & VOUCHER PROMO ---
  getVouchers: async () => {
    const response = await fetch(`${BASE_URL}/vouchers`);
    if (!response.ok) throw new Error('Gagal mengambil daftar voucher');
    return await response.json();
  },

  createVoucher: async (voucherData) => {
    const response = await fetch(`${BASE_URL}/vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voucherData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menambahkan voucher');
    }
    return await response.json();
  },

  deleteVoucher: async (id) => {
    const response = await fetch(`${BASE_URL}/vouchers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Gagal menghapus voucher');
    return await response.json();
  },

  applyVoucher: async (payload) => {
    const response = await fetch(`${BASE_URL}/vouchers/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Kode promo tidak valid');
    }
    return await response.json();
  },

  // --- KASIR & VALIDASI PEMBAYARAN TUNAI ---
  getCashierOrders: async () => {
    const response = await fetch(`${BASE_URL}/orders/cashier`);
    if (!response.ok) throw new Error('Gagal mengambil data pesanan kasir');
    return await response.json();
  },

  payCashOrder: async (orderId, uangDiterima) => {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/pay-cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uang_diterima: uangDiterima }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memproses pembayaran kasir');
    }
    return await response.json();
  }
};
