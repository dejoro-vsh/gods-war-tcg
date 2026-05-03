-- 1. เพิ่มช่องในตารางผู้เล่น ว่าเคยกดรับ Starter Deck ไปหรือยัง
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS starter_claimed BOOLEAN DEFAULT FALSE;

-- 2. เพิ่มช่องในตารางกระเป๋า เพื่อแยกไพ่ฟรี กับ แยกฝั่ง (จีน/กรีก)
ALTER TABLE public.player_inventory ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;
ALTER TABLE public.player_inventory ADD COLUMN IF NOT EXISTS faction TEXT;

-- 3. ปิดระบบความปลอดภัย RLS ชั่วคราว (เพื่อให้หน้าเว็บสามารถแจกไพ่เข้ากระเป๋าได้เลย)
ALTER TABLE public.player_inventory DISABLE ROW LEVEL SECURITY;
