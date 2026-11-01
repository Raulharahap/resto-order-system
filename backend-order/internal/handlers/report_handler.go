package handlers

import (
	"net/http"

	"backend-order/internal/models"
	"backend-order/pkg/database"

	"github.com/gin-gonic/gin"
)

type BestSellerItem struct {
	MenuID    uint   `json:"menu_id"`
	NamaMenu  string `json:"nama_menu"`
	Kategori  string `json:"kategori"`
	TotalQty  int    `json:"total_qty"`
	TotalUang int    `json:"total_uang"`
}

// GetSalesReport menghasilkan ringkasan omset dan statistik penjualan restoran
func GetSalesReport(c *gin.Context) {
	var totalPesanan int64
	var pesananSelesai int64
	var pesananAktif int64
	var totalOmset int64

	// Hitung total pesanan
	database.DB.Model(&models.Order{}).Count(&totalPesanan)
	database.DB.Model(&models.Order{}).Where("status = ?", "Selesai").Count(&pesananSelesai)
	database.DB.Model(&models.Order{}).Where("status != ?", "Selesai").Count(&pesananAktif)

	// Hitung total omset dari seluruh pesanan
	row := database.DB.Model(&models.Order{}).Select("COALESCE(SUM(total_harga), 0)").Row()
	_ = row.Scan(&totalOmset)

	// Hitung Top 5 Menu Terlaris (Best Seller)
	var bestSellers []BestSellerItem
	database.DB.Table("order_items").
		Select("order_items.menu_id, menus.nama as nama_menu, menus.kategori as kategori, SUM(order_items.qty) as total_qty, SUM(order_items.qty * order_items.harga_satuan) as total_uang").
		Joins("LEFT JOIN menus ON menus.id = order_items.menu_id").
		Group("order_items.menu_id, menus.nama, menus.kategori").
		Order("total_qty DESC").
		Limit(5).
		Scan(&bestSellers)

	// Statistik metode pembayaran
	type PaymentStat struct {
		MetodeBayar string `json:"metode_bayar"`
		Total       int64  `json:"total"`
		JumlahUang  int64  `json:"jumlah_uang"`
	}
	var paymentStats []PaymentStat
	database.DB.Table("orders").
		Select("metode_bayar, COUNT(*) as total, SUM(total_harga) as jumlah_uang").
		Group("metode_bayar").
		Scan(&paymentStats)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"total_omset":      totalOmset,
			"total_pesanan":    totalPesanan,
			"pesanan_selesai":  pesananSelesai,
			"pesanan_aktif":    pesananAktif,
			"best_sellers":     bestSellers,
			"metode_bayar":     paymentStats,
		},
	})
}

// GetOrderHistory mengambil riwayat seluruh pesanan yang sudah selesai
func GetOrderHistory(c *gin.Context) {
	var orders []models.Order

	err := database.DB.
		Preload("Items").
		Preload("Items.Menu").
		Where("status = ?", "Selesai").
		Order("updated_at DESC").
		Limit(50).
		Find(&orders).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil riwayat pesanan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": orders})
}

