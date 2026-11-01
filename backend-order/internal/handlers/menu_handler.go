package handlers

import (
	"net/http"

	"backend-order/internal/models"
	"backend-order/pkg/database"

	"github.com/gin-gonic/gin"
)

// GetMenus berfungsi mengambil semua data menu dari database
func GetMenus(c *gin.Context) {
	var menus []models.Menu

	// database.DB.Find() adalah perintah GORM untuk "SELECT * FROM menus"
	if err := database.DB.Order("id asc").Find(&menus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data menu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": menus})
}

// CreateMenu berfungsi untuk memasukkan menu baru ke database
func CreateMenu(c *gin.Context) {
	var menu models.Menu

	// Tangkap data JSON yang dikirim (misal dari React/Postman) lalu masukkan ke struct menu
	if err := c.ShouldBindJSON(&menu); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data salah"})
		return
	}

	// database.DB.Create() adalah perintah GORM untuk "INSERT INTO menus ..."
	if err := database.DB.Create(&menu).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan menu ke database"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Menu berhasil ditambahkan!",
		"data":    menu,
	})
}

// UpdateMenu mengupdate data menu (misal ubah stok, toggle is_sold_out, ubah harga)
func UpdateMenu(c *gin.Context) {
	id := c.Param("id")
	var existingMenu models.Menu

	if err := database.DB.First(&existingMenu, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Menu tidak ditemukan"})
		return
	}

	// Bind perubahan JSON ke struct yang sudah ada
	if err := c.ShouldBindJSON(&existingMenu); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data salah"})
		return
	}

	if err := database.DB.Save(&existingMenu).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui menu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Menu berhasil diperbarui!",
		"data":    existingMenu,
	})
}

// DeleteMenu menghapus menu dari database
func DeleteMenu(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Menu{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus menu"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Menu berhasil dihapus!"})
}
