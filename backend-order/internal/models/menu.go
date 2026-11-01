package models

import "time"

type Menu struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Nama         string `gorm:"type:varchar(100);not null" json:"nama"`
	Kategori     string `gorm:"type:varchar(50);not null" json:"kategori"`
	Harga        int    `gorm:"not null" json:"harga"`
	Stok         int    `gorm:"default:0" json:"stok"`
	HasLevel     bool   `gorm:"default:false" json:"has_level"`
	LevelOptions string `gorm:"type:varchar(50)" json:"level_options"`

	// --- KOLOM BARU UNTUK FOTO ---
	Gambar string `gorm:"type:varchar(255)" json:"gambar"`

	IsSoldOut bool      `gorm:"default:false" json:"is_sold_out"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
