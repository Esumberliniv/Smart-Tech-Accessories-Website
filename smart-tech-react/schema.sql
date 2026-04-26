-- ============================================================
-- SmartTech Accessories — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Products table (required fields + featured flag)
CREATE TABLE IF NOT EXISTS products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC NOT NULL,
  category      TEXT,
  image_url     TEXT,
  stock_quantity INTEGER DEFAULT 0,
  featured      BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name  TEXT,
  email      TEXT,
  phone      TEXT,
  role       TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  status     TEXT DEFAULT 'active'   CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users NOT NULL,
  total      NUMERIC NOT NULL,
  status     TEXT DEFAULT 'Processing',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Trigger: auto-create profile on new signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_first TEXT;
  meta_last  TEXT;
  meta_name  TEXT;
BEGIN
  meta_first := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'given_name'
  );
  meta_last := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'family_name'
  );
  meta_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );

  IF (meta_first IS NULL OR meta_first = '') AND meta_name IS NOT NULL AND meta_name <> '' THEN
    meta_first := split_part(meta_name, ' ', 1);
  END IF;

  IF (meta_last IS NULL OR meta_last = '') AND meta_name IS NOT NULL AND meta_name <> '' THEN
    meta_last := NULLIF(regexp_replace(meta_name, '^\S+\s*', ''), '');
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    meta_first,
    meta_last
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;

-- Products: public read; authenticated admin write
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "products_update" ON products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "products_delete" ON products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles: authenticated users can read all; update own only; admins update any
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Orders: users see own orders; insert own
CREATE POLICY "orders_select" ON orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "orders_insert" ON orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Seed: 12 sample products
-- ============================================================
INSERT INTO products (name, description, price, category, image_url, stock_quantity, featured) VALUES
  ('AirPods Pro',         'Premium wireless earbuds with active noise cancellation and spatial audio.',              249, 'Earbuds',       'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80', 150, true),
  ('Smart Watch Pro',     'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.',               399, 'Smartwatches',  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',  75, true),
  ('Wireless Charger',    'Fast 15W wireless charging pad compatible with all Qi-enabled devices.',                  79, 'Accessories',   '/images/products/wireless-charger.png', 200, false),
  ('Sport Buds Elite',    'Sweat-resistant earbuds designed for intense workouts with 8-hour battery.',             149, 'Earbuds',       '/images/products/sport-buds-elite.png', 120, false),
  ('Fitness Band X',      'Slim fitness tracker with heart rate, sleep tracking, and 14-day battery.',              129, 'Smartwatches',  'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80',  90, true),
  ('Noise Cancelling Pro','Over-ear headphones with 40-hour battery and premium noise cancellation.',               349, 'Earbuds',       '/images/products/noise-cancelling-pro.png',  60, false),
  ('Portable Speaker',    'Waterproof Bluetooth speaker with 360° sound and 20-hour playtime.',                      99, 'Accessories',   'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80', 180, false),
  ('Premium Case',        'Military-grade protective case with wireless charging compatibility.',                     49, 'Accessories',   'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80', 300, false),
  ('Power Bank Ultra',    '20,000mAh power bank with 65W fast charging and dual USB-C output.',                      59, 'Accessories',   'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',   0, false),
  ('Screen Protector',    'Tempered glass screen protector with 9H hardness and anti-fingerprint coating.',          19, 'Accessories',   'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80', 500, false),
  ('Smart Glasses',       'Open-ear audio glasses with UV400 protection and built-in microphone.',                  299, 'Accessories',   '/images/products/smart-glasses.png',  45, true),
  ('USB-C Hub',           '7-in-1 USB-C hub with 4K HDMI, SD card reader, and 100W power delivery.',                89, 'Accessories',   '/images/products/usb-c-hub.png', 140, false);

-- ============================================================
-- Realtime: enable live subscriptions for admin dashboard
-- Run this ONCE after creating the tables.
-- In Supabase: Database → Replication → add tables, OR run:
-- ============================================================
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE profiles  REPLICA IDENTITY FULL;
ALTER TABLE orders    REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE products, profiles, orders;
