package handlers

import (
	"fmt"
	"net/http"
	"time"

	"backend-order/internal/models"
	"backend-order/pkg/database"

	"github.com/gin-gonic/gin"
)

// GetCashierOrders mengambil semua pesanan untuk meja kasir depan
func GetCashierOrders(c *gin.Context) {
	// Auto-expire pesanan tunai yang tidak dibayar lebih dari 2 jam (aman dari antrean kasir panjang)
	_ = database.DB.Model(&models.Order{}).
		Where("status_bayar = ? AND status = ? AND created_at < ?", "Menunggu Bayar", "Menunggu", time.Now().Add(-2*time.Hour)).
		Updates(map[string]interface{}{
			"status":       "Dibatalkan",
			"status_bayar": "Expired",
		})

	var orders []models.Order

	// Ambil pesanan yang aktif atau baru saja selesai, preloaded dengan items & menu
	if err := database.DB.Preload("Items.Menu").
		Order("created_at desc").
		Limit(50).
		Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pesanan kasir"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": orders})
}

// PayCashReq payload untuk pembayaran tunai di kasir
type PayCashReq struct {
	UangDiterima int `json:"uang_diterima"`
}

// PayCashOrder memproses pembayaran tunai, menghitung kembalian, dan mengirim pesanan ke koki
func PayCashOrder(c *gin.Context) {
	id := c.Param("id")
	var req PayCashReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data salah"})
		return
	}

	var order models.Order
	if err := database.DB.Preload("Items.Menu").First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	if req.UangDiterima < order.TotalHarga {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Uang pembayaran kurang! Total tagihan: Rp %d, Uang diterima: Rp %d", order.TotalHarga, req.UangDiterima),
		})
		return
	}

	kembalian := req.UangDiterima - order.TotalHarga

	order.UangDiterima = req.UangDiterima
	order.Kembalian = kembalian
	order.StatusBayar = "Lunas"

	// Jika pesanan masih berstatus "Menunggu", naikkan langsung jadi "Dimasak" agar koki KDS langsung memasak
	if order.Status == "Menunggu" {
		order.Status = "Dimasak"
	}

	if err := database.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses pembayaran di database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Pembayaran tunai berhasil! Tiket langsung diteruskan ke koki dapur.",
		"data":      order,
		"kembalian": kembalian,
	})
}

