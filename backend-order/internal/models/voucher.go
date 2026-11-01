package models

import "time"

// Voucher merepresentasikan kupon diskon/promo restoran
type Voucher struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Kode        string    `gorm:"type:varchar(50);unique;not null" json:"kode"`   // Contoh: GACOANHEMAT
	Judul       string    `gorm:"type:varchar(100);not null" json:"judul"`        // Contoh: Promo Hemat 15%
	Tipe        string    `gorm:"type:varchar(20);default:'percent'" json:"tipe"` // "percent" atau "nominal"
	Nilai       int       `gorm:"not null" json:"nilai"`                          // 15 (15%) atau 5000 (Rp 5.000)
	MinBelanja  int       `gorm:"default:0" json:"min_belanja"`                   // Minimal belanja subtotal
	MaxPotongan int       `gorm:"default:0" json:"max_potongan"`                  // Batas maksimal diskon jika tipe percent
	IsActive    bool      `gorm:"default:true" json:"is_active"`                  // Status kupon aktif/nonaktif
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

