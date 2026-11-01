package models

import "time"

// WaiterCall merepresentasikan panggilan bantuan dari meja tamu ke pelayan/dapur
type WaiterCall struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Meja      string    `gorm:"type:varchar(20);not null" json:"meja"`
	Alasan    string    `gorm:"type:varchar(255);not null" json:"alasan"` // Contoh: "Minta Sendok/Garpu", "Tisu", "Bersihkan Meja"
	Catatan   string    `gorm:"type:text" json:"catatan"`
	Status    string    `gorm:"type:varchar(30);default:'Menunggu'" json:"status"` // "Menunggu", "Selesai"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

