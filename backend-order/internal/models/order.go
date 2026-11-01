package models

import "time"

// Order merepresentasikan tabel pesanan utama
type Order struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	NomorAntrean string `gorm:"type:varchar(20)" json:"nomor_antrean"` // Contoh: #B-42
	NamaPelanggan string `gorm:"type:varchar(100)" json:"nama_pelanggan"` // Nama Pemesan (contoh: Kak Budi)
	Meja         string `gorm:"type:varchar(20);not null" json:"meja"`
	JumlahTamu   int    `json:"jumlah_tamu"`
	CatatanMeja  string `gorm:"type:text" json:"catatan_meja"`
	MetodeBayar  string `gorm:"type:varchar(50)" json:"metode_bayar"`
	TotalHarga   int    `json:"total_harga"`
	Status       string `gorm:"type:varchar(50);default:'Menunggu'" json:"status"` // Status: Menunggu, Dimasak, Siap, Selesai

	// --- KOLOM KASIR & PROMO ---
	KodeVoucher  string `gorm:"type:varchar(50)" json:"kode_voucher"`
	Diskon       int    `gorm:"default:0" json:"diskon"`
	UangDiterima int    `gorm:"default:0" json:"uang_diterima"`
	Kembalian    int    `gorm:"default:0" json:"kembalian"`
	StatusBayar  string `gorm:"type:varchar(30);default:'Lunas'" json:"status_bayar"` // "Lunas" atau "Menunggu Bayar"

	// Relasi: 1 Order memiliki Banyak Item
	Items []OrderItem `gorm:"foreignKey:OrderID" json:"items"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// OrderItem merepresentasikan detail makanan di dalam sebuah pesanan
type OrderItem struct {
	ID      uint `gorm:"primaryKey" json:"id"`
	OrderID uint `json:"order_id"`
	MenuID  uint `json:"menu_id"`

	// Relasi untuk menarik data Menu (Nama, Kategori) secara otomatis
	Menu Menu `gorm:"foreignKey:MenuID" json:"menu"`

	Qty         int    `json:"qty"`
	HargaSatuan int    `json:"harga_satuan"`
	LevelPedas  int    `json:"level_pedas"` // Isi angka levelnya, 0 jika tidak ada level
	Catatan     string `gorm:"type:text" json:"catatan"`
	IsDone      bool   `gorm:"default:false" json:"is_done"` // Centang ✅ untuk layar koki (KDS)

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
