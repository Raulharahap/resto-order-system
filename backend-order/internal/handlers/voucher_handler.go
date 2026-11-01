package handlers

import (
	"net/http"
	"strings"

	"backend-order/internal/models"
	"backend-order/pkg/database"

	"github.com/gin-gonic/gin"
)

// GetVouchers mengambil semua kupon promo/diskon
func GetVouchers(c *gin.Context) {
	var vouchers []models.Voucher
	if err := database.DB.Order("id desc").Find(&vouchers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar voucher"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": vouchers})
}

// CreateVoucher membuat kupon promo baru
func CreateVoucher(c *gin.Context) {
	var voucher models.Voucher
	if err := c.ShouldBindJSON(&voucher); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data voucher salah"})
		return
	}

	voucher.Kode = strings.ToUpper(strings.TrimSpace(voucher.Kode))
	if voucher.Kode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode voucher tidak boleh kosong"})
		return
	}

	if voucher.Nilai <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nilai diskon harus lebih besar dari 0"})
		return
	}

	if err := database.DB.Create(&voucher).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kode voucher sudah ada atau database error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Voucher berhasil ditambahkan!",
		"data":    voucher,
	})
}

// DeleteVoucher menghapus voucher
func DeleteVoucher(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Voucher{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus voucher"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Voucher berhasil dihapus!"})
}

// ApplyVoucherReq payload untuk validasi kode voucher
type ApplyVoucherReq struct {
	Kode     string `json:"kode"`
	Subtotal int    `json:"subtotal"`
}

// ApplyVoucher memvalidasi kode promo dan menghitung nominal potongan diskon
func ApplyVoucher(c *gin.Context) {
	var req ApplyVoucherReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data salah"})
		return
	}

	cleanKode := strings.ToUpper(strings.TrimSpace(req.Kode))
	if cleanKode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode voucher tidak boleh kosong"})
		return
	}

	var voucher models.Voucher
	if err := database.DB.Where("UPPER(kode) = ? AND is_active = ?", cleanKode, true).First(&voucher).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kode voucher tidak ditemukan atau sudah tidak aktif"})
		return
	}

	// Cek minimal belanja
	if req.Subtotal < voucher.MinBelanja {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Belum memenuhi minimal belanja Rp " + formatRupiah(voucher.MinBelanja),
		})
		return
	}

	// Hitung diskon
	var diskon int
	if voucher.Tipe == "percent" {
		diskon = (req.Subtotal * voucher.Nilai) / 100
		if voucher.MaxPotongan > 0 && diskon > voucher.MaxPotongan {
			diskon = voucher.MaxPotongan
		}
	} else {
		diskon = voucher.Nilai
		if diskon > req.Subtotal {
			diskon = req.Subtotal
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":   true,
		"message": "Voucher berhasil digunakan!",
		"diskon":  diskon,
		"voucher": voucher,
	})
}

func formatRupiah(val int) string {
	return strings.ReplaceAll(string(rune(val)), "", "")
}

