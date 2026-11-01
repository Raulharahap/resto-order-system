package database

import (
	"fmt"
	"log"

	"backend-order/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// Koneksi PostgreSQL resto_order_db
	dsn := "host=localhost user=postgres password=root dbname=resto_order_db port=5432 sslmode=disable TimeZone=Asia/Jakarta"

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal terhubung ke database: ", err)
	}

	fmt.Println("✅ Berhasil terhubung ke database PostgreSQL (resto_order_db)!")

	// AutoMigrate seluruh tabel
	err = database.AutoMigrate(
		&models.Menu{},
		&models.Order{},
		&models.OrderItem{},
		&models.WaiterCall{},
		&models.Voucher{},
	)
	if err != nil {
		log.Println("Peringatan saat AutoMigrate:", err)
	} else {
		fmt.Println("✅ Semua Tabel (Menu, Order, OrderItem, WaiterCall, Voucher) berhasil di-migrate!")
	}

	// Seed Voucher Default jika belum ada
	var voucherCount int64
	database.Model(&models.Voucher{}).Count(&voucherCount)
	if voucherCount == 0 {
		defaultVouchers := []models.Voucher{
			{
				Kode:        "GACOANHEMAT",
				Judul:       "Diskon 15% Spesial Gacoan",
				Tipe:        "percent",
				Nilai:       15,
				MinBelanja:  30000,
				MaxPotongan: 15000,
				IsActive:    true,
			},
			{
				Kode:        "DISKON5RB",
				Judul:       "Potongan Rp 5.000",
				Tipe:        "nominal",
				Nilai:       5000,
				MinBelanja:  25000,
				MaxPotongan: 5000,
				IsActive:    true,
			},
		}
		database.Create(&defaultVouchers)
		fmt.Println("✅ Default Vouchers (GACOANHEMAT, DISKON5RB) berhasil di-seed!")
	}

	DB = database
}
