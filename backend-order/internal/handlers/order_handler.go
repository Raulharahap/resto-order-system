package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"backend-order/internal/models"
	"backend-order/pkg/database"

	"github.com/gin-gonic/gin"
)

// Struktur data JSON yang akan diterima dari React saat Checkout
type OrderRequestPayload struct {
	NomorAntrean  string `json:"nomor_antrean"`
	NamaPelanggan string `json:"nama_pelanggan"`
	Meja          string `json:"meja"`
	JumlahTamu    int    `json:"jumlah_tamu"`
	CatatanMeja   string `json:"catatan_meja"`
	MetodeBayar   string `json:"metode_bayar"`
	TotalHarga    int    `json:"total_harga"`
	KodeVoucher   string `json:"kode_voucher"`
	Diskon        int    `json:"diskon"`
	Items         []struct {
		MenuID      uint   `json:"menu_id"`
		Qty         int    `json:"qty"`
		HargaSatuan int    `json:"harga_satuan"`
		LevelPedas  int    `json:"level_pedas"`
		Catatan     string `json:"catatan"`
	} `json:"items"`
}

// CreateOrder berfungsi menerima pesanan dari HP Pelanggan
func CreateOrder(c *gin.Context) {
	var payload OrderRequestPayload

	// 1. Tangkap JSON dari Frontend
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data pesanan tidak lengkap atau salah format"})
		return
	}

	namaPelanggan := strings.TrimSpace(payload.NamaPelanggan)
	if namaPelanggan == "" {
		namaPelanggan = "Tamu Meja"
	}

	statusBayar := "Lunas"
	if strings.Contains(strings.ToLower(payload.MetodeBayar), "tunai") || strings.Contains(strings.ToLower(payload.MetodeBayar), "cash") {
		statusBayar = "Menunggu Bayar"
	}

	// 2. Siapkan data Order Utama
	newOrder := models.Order{
		NomorAntrean:  payload.NomorAntrean,
		NamaPelanggan: namaPelanggan,
		Meja:          payload.Meja,
		JumlahTamu:    payload.JumlahTamu,
		CatatanMeja:   payload.CatatanMeja,
		MetodeBayar:   payload.MetodeBayar,
		TotalHarga:    payload.TotalHarga,
		KodeVoucher:   payload.KodeVoucher,
		Diskon:        payload.Diskon,
		StatusBayar:   statusBayar,
		Status:        "Menunggu", // Status awal saat baru masuk
	}

	// 3. Masukkan item makanan ke dalam Order Utama
	for _, item := range payload.Items {
		orderItem := models.OrderItem{
			MenuID:      item.MenuID,
			Qty:         item.Qty,
			HargaSatuan: item.HargaSatuan,
			LevelPedas:  item.LevelPedas,
			Catatan:     item.Catatan,
		}
		newOrder.Items = append(newOrder.Items, orderItem)
	}

	// 4. Simpan ke Database (GORM otomatis menyimpan Order beserta Items-nya)
	if err := database.DB.Create(&newOrder).Error; err != nil {
		fmt.Println("Error simpan pesanan:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan pesanan ke dapur"})
		return
	}

	// 5. Beri balasan ke Frontend
	c.JSON(http.StatusCreated, gin.H{
		"message":  "Pesanan berhasil masuk ke dapur!",
		"order_id": newOrder.ID,
		"data":     newOrder,
	})
}

// GetOrderByID mengambil detail 1 pesanan berdasarkan ID untuk halaman Tracking pelanggan
func GetOrderByID(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if err := database.DB.Preload("Items").Preload("Items.Menu").First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": order})
}

// GetActiveOrders berfungsi untuk mengambil pesanan yang belum selesai (Untuk Layar KDS)
func GetActiveOrders(c *gin.Context) {
	var orders []models.Order

	// Dapur (KDS) HANYA mengambil tiket yang harus dimasak: "Menunggu", "Dimasak", "Siap"
	// Tiket "Selesai" dan "Dibatalkan" OTOMATIS HILANG dari monitor dapur!
	err := database.DB.
		Preload("Items").
		Preload("Items.Menu").
		Where("status IN ?", []string{"Menunggu", "Dimasak", "Siap"}).
		Order("id ASC").
		Find(&orders).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pesanan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": orders})
}

// UpdateOrderStatus berfungsi untuk koki menekan tombol "Mulai Masak" atau "Siap Saji"
func UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id") // Menangkap ID pesanan dari URL (contoh: /orders/1/status)

	var input struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format status salah"})
		return
	}

	var order models.Order
	if err := database.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	// Cegah koki memasak jika pesanan belum dibayar di kasir
	if (input.Status == "Dimasak" || input.Status == "Siap") && order.StatusBayar == "Menunggu Bayar" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Pesanan belum dibayar di kasir! Kasir harus memvalidasi pembayaran terlebih dahulu sebelum koki memasak.",
		})
		return
	}

	// Update statusnya
	order.Status = input.Status
	database.DB.Save(&order)

	c.JSON(http.StatusOK, gin.H{
		"message": "Status pesanan berhasil diperbarui menjadi " + input.Status,
		"data":    order,
	})
}

// ToggleOrderItemDone mengubah status centang makanan di KDS dapur (misal mie sudah matang duluan)
func ToggleOrderItemDone(c *gin.Context) {
	itemID := c.Param("id")

	var item models.OrderItem
	if err := database.DB.First(&item, itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item makanan tidak ditemukan"})
		return
	}

	item.IsDone = !item.IsDone
	database.DB.Save(&item)

	c.JSON(http.StatusOK, gin.H{
		"message": "Status item berhasil diperbarui",
		"data":    item,
	})
}

// CancelOrder membatalkan pesanan (oleh kasir atau sistem auto-expire)
func CancelOrder(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if err := database.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	order.Status = "Dibatalkan"
	order.StatusBayar = "Dibatalkan"
	database.DB.Save(&order)

	c.JSON(http.StatusOK, gin.H{
		"message": "Pesanan berhasil dibatalkan",
		"data":    order,
	})
}
