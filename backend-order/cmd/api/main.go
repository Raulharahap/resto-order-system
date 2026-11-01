package main

import (
	"os"
	"time"

	"backend-order/internal/handlers"
	"backend-order/pkg/database"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Jalankan koneksi database
	database.ConnectDB()

	// Pastikan folder uploads tersedia untuk upload gambar
	_ = os.MkdirAll("./uploads", os.ModePerm)

	// 2. Inisialisasi router Gin
	r := gin.Default()
	_ = r.SetTrustedProxies(nil)

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Port bawaan React Vite
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Static folder untuk menyajikan gambar yang di-upload
	r.Static("/uploads", "./uploads")

	// 3. Endpoint tes
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Server backend jalan dan siap melayani!",
		})
	})

	// Jalur Menu
	r.GET("/menus", handlers.GetMenus)
	r.POST("/menus", handlers.CreateMenu)
	r.PUT("/menus/:id", handlers.UpdateMenu)
	r.DELETE("/menus/:id", handlers.DeleteMenu)

	// Jalur Upload Gambar
	r.POST("/upload", handlers.UploadImage)

	// Jalur Pesanan
	r.POST("/orders", handlers.CreateOrder)
	r.GET("/orders", handlers.GetActiveOrders)                 // KDS mengambil antrean pesanan aktif
	r.GET("/orders/history", handlers.GetOrderHistory)        // Riwayat pesanan selesai
	r.GET("/orders/:id", handlers.GetOrderByID)                // Pelanggan melacak status pesanan
	r.PATCH("/orders/:id/status", handlers.UpdateOrderStatus)  // KDS mengubah status pesanan
	r.PATCH("/orders/:id/cancel", handlers.CancelOrder)        // Kasir / Staff membatalkan pesanan
	r.PATCH("/order-items/:id/toggle", handlers.ToggleOrderItemDone) // KDS mencentang item matang

	// Jalur Laporan Penjualan (Analytics)
	r.GET("/reports/summary", handlers.GetSalesReport)

	// Jalur Panggilan Pelayan (Waiter Call Bell)
	r.POST("/waiter-calls", handlers.CreateWaiterCall)
	r.GET("/waiter-calls", handlers.GetActiveWaiterCalls)
	r.PATCH("/waiter-calls/:id/done", handlers.CompleteWaiterCall)

	// Jalur Kupon Diskon & Voucher Promo
	r.GET("/vouchers", handlers.GetVouchers)
	r.POST("/vouchers", handlers.CreateVoucher)
	r.DELETE("/vouchers/:id", handlers.DeleteVoucher)
	r.POST("/vouchers/apply", handlers.ApplyVoucher)

	// Jalur Kasir POS & Pembayaran Tunai
	r.GET("/orders/cashier", handlers.GetCashierOrders)
	r.POST("/orders/:id/pay-cash", handlers.PayCashOrder)

	// 4. Nyalakan server
	r.Run(":8080")
}
