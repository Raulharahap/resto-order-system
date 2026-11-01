package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadImage menangani upload foto menu dari laptop/HP ke server backend
func UploadImage(c *gin.Context) {
	// Ambil file dari form data dengan key "image"
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File gambar tidak ditemukan atau rusak"})
		return
	}

	// Pastikan folder uploads tersedia
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat direktori upload"})
		return
	}

	// Buat nama file unik menggunakan timestamp
	ext := filepath.Ext(file.Filename)
	uniqueFilename := fmt.Sprintf("menu_%d%s", time.Now().UnixNano(), ext)
	dst := filepath.Join(uploadDir, uniqueFilename)

	// Simpan file ke folder ./uploads
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file gambar"})
		return
	}

	// URL gambar yang bisa diakses publik oleh frontend
	fileURL := fmt.Sprintf("http://localhost:8080/uploads/%s", uniqueFilename)

	c.JSON(http.StatusOK, gin.H{
		"message":  "Foto berhasil di-upload!",
		"filename": uniqueFilename,
		"url":      fileURL,
	})
}

