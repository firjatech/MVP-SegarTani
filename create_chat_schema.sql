-- ==========================================
-- Skema Tabel Live Chat (Penjual & Pembeli)
-- ==========================================

-- 1. Tabel Chats (Daftar percakapan)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id INT8 REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(buyer_id, seller_id, product_id) -- Hindari duplikasi ruang chat untuk produk yang sama
);

-- 2. Tabel Messages (Isi pesan)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- Keamanan (Row Level Security - RLS)
-- ==========================================

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk Chats: Hanya pembeli atau penjual yang terlibat yang bisa mengakses
DROP POLICY IF EXISTS "Users can access their own chats" ON public.chats;
CREATE POLICY "Users can access their own chats" ON public.chats
  FOR ALL
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Kebijakan untuk Messages: Hanya pembeli atau penjual dalam chat tersebut yang bisa mengakses
DROP POLICY IF EXISTS "Users can access messages of their chats" ON public.messages;
CREATE POLICY "Users can access messages of their chats" ON public.messages
  FOR ALL
  USING (
    sender_id = auth.uid() OR 
    chat_id IN (
      SELECT id FROM public.chats 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- ==========================================
-- Mengaktifkan Realtime Supabase
-- ==========================================
-- Agar aplikasi bisa mendengarkan pesan masuk secara real-time
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
