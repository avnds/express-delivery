-- Express Delivery
-- Migration 002
-- Campos complementares das entregas

ALTER TABLE deliveries
ADD COLUMN phone TEXT;

ALTER TABLE deliveries
ADD COLUMN delivery_fee REAL DEFAULT 0.00;

ALTER TABLE deliveries
ADD COLUMN completion_notes TEXT;

ALTER TABLE deliveries
ADD COLUMN longitude REAL;