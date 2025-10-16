-- Seed dim_channel with standard channels
INSERT INTO dim_channel (channel_code, name, type, commission_rate, is_active) VALUES
('AIRBNB', 'Airbnb', 'OTA', 0.15, true),
('BOOKING', 'Booking.com', 'OTA', 0.15, true),
('VRBO', 'Vrbo', 'OTA', 0.10, true),
('EXPEDIA', 'Expedia', 'OTA', 0.18, true),
('DIRECT_WEB', 'Direct Website', 'Direct', 0.00, true),
('DIRECT_PHONE', 'Direct Phone', 'Direct', 0.00, true)
ON CONFLICT (channel_code) DO NOTHING;

COMMENT ON TABLE dim_channel IS 'Distribution channels for property bookings. Seeded with standard OTA and direct channels.';