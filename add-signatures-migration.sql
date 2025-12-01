-- ===================================================================
-- Add Signature Fields Migration
-- ===================================================================
-- Run this script in Supabase SQL Editor if you already have existing tables
-- This will add signature1 and signature2 columns to your existing database

-- Add signature columns to global_settings table
ALTER TABLE global_settings 
ADD COLUMN IF NOT EXISTS signature1 TEXT,
ADD COLUMN IF NOT EXISTS signature2 TEXT;

-- Add signature columns to friends table
ALTER TABLE friends 
ADD COLUMN IF NOT EXISTS signature1 TEXT,
ADD COLUMN IF NOT EXISTS signature2 TEXT;

-- ===================================================================
-- Migration Complete! 🎄
-- ===================================================================
-- You can now use the signature fields in the admin panel
-- ===================================================================
