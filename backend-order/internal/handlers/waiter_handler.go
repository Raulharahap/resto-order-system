package handlers

import (
	"net/http"

	"backend-order/internal/models"
	"backend-order/pkg/database"

	"github.com/gin-gonic/gin"
)

// CreateWaiterCall menyimpan permintaan bantuan/panggilan pelayan dari meja pelanggan
func CreateWaiterCall(c *gin.Context) {
	var call models.WaiterCall
	if err := c.ShouldBindJSON(&call); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data salah"})
		return
	}

	if call.Meja == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor meja harus diisi"})
		return
	}

	if call.Alasan == "" {
		call.Alasan = "Bantuan Umum"
	}
	call.Status = "Menunggu"

	if err := database.DB.Create(&call).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memanggil pelayan"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Pelayan telah dipanggil! Mohon tunggu sebentar.",
		"data":    call,
	})
}

// GetActiveWaiterCalls mengambil semua panggilan pelayan yang belum selesai (status = 'Menunggu')
func GetActiveWaiterCalls(c *gin.Context) {
	var calls []models.WaiterCall
	if err := database.DB.Where("status = ?", "Menunggu").Order("created_at desc").Find(&calls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar panggilan pelayan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": calls})
}

// CompleteWaiterCall menandai panggilan pelayan telah dilayani (status = 'Selesai')
func CompleteWaiterCall(c *gin.Context) {
	id := c.Param("id")
	var call models.WaiterCall

	if err := database.DB.First(&call, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Panggilan pelayan tidak ditemukan"})
		return
	}

	call.Status = "Selesai"
	if err := database.DB.Save(&call).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status panggilan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Panggilan meja berhasil diselesaikan!",
		"data":    call,
	})
}

