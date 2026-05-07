# 📜 Gods War TCG - Master Game Manual & Technical Specs

คู่มือนี้รวบรวมระบบ กฎการเล่น และสถาปัตยกรรมทั้งหมดของเกม **Gods War TCG** เพื่อเป็นแหล่งข้อมูลอ้างอิงหลัก (Single Source of Truth) สำหรับการพัฒนาและขยายระบบในอนาคต

---

## 1. ⚔️ ภาพรวมของเกม (Game Overview)
- **Gods War TCG** เป็นเกมการ์ดดวลกันแบบ 1v1 (Multiplayer) ผ่าน WebSockets (`socket.io`)
- **เป้าหมาย:** ผู้เล่นแต่ละคนมีพลังชีวิต (HP) เริ่มต้น **5 หน่วย** ใครที่ HP ลดเหลือ 0 ก่อนจะเป็นผู้แพ้
- **เผ่าพันธุ์ (Factions):** แบ่งเป็น 2 ฝ่ายหลักคือ **ตำนานเทพเจ้าจีน (China)** และ **ตำนานเทพเจ้ากรีก (Greek)**

## 2. 💎 ระบบทรัพยากร (Essence System)
- การใช้การ์ดและการโจมตีในเกมนี้ ต้องใช้ทรัพยากรที่เรียกว่า **Essence (มานา)**
- **ผู้เล่นคนที่ 1 (First Player):** เริ่มเกมด้วย 1 Max Essence
- **ผู้เล่นคนที่ 2 (Second Player):** เริ่มเทิร์นแรกของตัวเองจะได้ 2 Max Essence เพื่อชดเชยที่เล่นทีหลัง
- **การเพิ่ม Essence:** เมื่อเริ่มเทิร์นใหม่ Max Essence จะเพิ่มขึ้น 2 หน่วยเสมอ (สูงสุด 10 หน่วย) และ Essence จะถูกเติมให้เต็มเท่ากับ Max Essence
- **ค่าใช้จ่าย:**
  - `cost`: ค่า Essence ที่ใช้ร่ายการ์ดลงสนาม
  - `atkCost`: **(ระบบเด่น)** การโจมตีของการ์ดแต่ละใบจะต้องจ่าย Essence ตามที่ระบุไว้ด้วย (ทำให้ผู้เล่นต้องบริหารมานาทั้งตอนร่ายและตอนตี)

## 3. 🃏 ประเภทการ์ด (Card Types & Mechanics)
การ์ดในเกมแบ่งออกเป็น 4 ประเภทหลัก:
1. **Warrior (นักรบ):** ยูนิตโจมตีหลัก เมื่อลงสนามจะติดสถานะ "พัก (Rest/Sleep)" โจมตีไม่ได้ทันที ยกเว้นจะมีสกิล `rush`
2. **Blocker (ตัวบล็อก):** ยูนิตสายป้องกัน
3. **Event (เวทมนตร์):** ร่ายแล้วเกิดผลทันที เช่น
   - `draw_2`: จั่วการ์ด 2 ใบ (เช่น การ์ด Meditation)
   - `heal_1` / `heal_2`: ฟื้นฟู HP (เช่น Divine Elixir, Mazu)
   - `board_wipe`: ล้างสนาม (เช่น Nuwa's Flood, Zeus's Wrath)
   - `destroy_weak`: ทำลายตัวอ่อนแอ (เช่น Medusa)
   - `ai_summon`: เรียก Token (เช่น Oracle's Vision)
4. **Stage (ฟิลด์):** การ์ดสนามที่ให้บัฟกับเผ่าของตัวเอง (เช่น Heavenly Court, Mount Olympus)

## 4. ✨ สกิลติดตัว (Keywords & Skills)
- `rush`: ลงสนามแล้วสามารถสั่งโจมตีได้ทันที ไม่ต้องรอเทิร์นหน้า (เช่น Wukong, Ares)
- `on_play:draw_1`: เมื่อลงสนามให้จั่วการ์ด 1 ใบ (เช่น Nezha)
- `on_play:buff_all`: เมื่อลงสนามบัฟพลังให้เพื่อนทุกคน (เช่น Qilin)
- `on_play:stun`: สตันศัตรู (เช่น Poseidon)
- `evade`: หลบการทำลายได้ 1 ครั้ง (เช่น Pegasus)
- `pierce`: โจมตีทะลุพลังป้องกัน (เช่น Jade Emperor, Zeus)
- `snipe`: สามารถล็อคเป้าโจมตีได้ (เช่น Hou Yi)

## 5. 🗡️ ระบบการต่อสู้ (Combat Mechanics)
- **Leader (ผู้เล่น/อวาตาร์):** นอกจากการ์ดบนสนามแล้ว ตัว Leader เองมีพลังโจมตี (ATK) 5,000 หน่วย และสามารถสั่งโจมตีได้ 1 ครั้งต่อเทิร์น (หากโจมตีแล้ว สถานะจะเป็น `leaderRest = true`)
- **เป้าหมาย:** สามารถเลือกตี การ์ดบนสนาม หรือ ตี Leader ฝ่ายตรงข้ามโดยตรง (ถ้าไม่มี Blocker ขวาง)
- **ความเสียหาย:** การโจมตีเข้า Leader สำเร็จ จะลด HP ศัตรูลง 1 หน่วยเสมอ

## 6. 💰 ระบบเศรษฐกิจและกาชา (Economy & Gacha)
- **หน่วยเงินในเกม:** Gold (เหรียญทอง) ใช้สำหรับซื้อซองการ์ด
- **ระบบเติมเงิน (Stripe):** ใช้ Stripe Webhook (`checkout.session.completed`) ในการตัดบัตรเครดิต/PromptPay แล้วเพิ่ม Gold เข้า Database อัตโนมัติตาม `metadata.gold_amount`
- **ระบบสุ่มการ์ด (Pack Types):**
  1. **Basic Pack:** 1,000 Gold ได้การ์ด 3 ใบ
  2. **Premium Pack:** 3,000 Gold ได้การ์ด 5 ใบ (การันตีขั้นต่ำระดับ Rare)
  3. **God Pack:** 12,000 Gold ได้การ์ด 5 ใบ (การันตีขั้นต่ำระดับ Epic)
- **ระดับความแรร์ (Grades):** Normal (50%), Rare (30%), Epic (15%), Legendary (4%), Mythic (1%)
- **อาร์ตสไตล์ (Styles):** Original, Disney, Pixar, Anime, Bishounen
- **จำกัดช่องเก็บของ (Inventory Limit):** เก็บการ์ดได้สูงสุด 150 ใบต่อ 1 เผ่า (หากเกินถือเป็น overflow ต้องนำไปย่อยหรือผสม)

## 7. 🌐 ระบบ Web3 / NFT
- **Smart Contract:** Polygon Network ERC-1155 (Address: `0x4ECaFff2F1412297Ef24Ea7906940825623580f4`)
- **Gasless Minting:** ผู้เล่นไม่ต้องเสียค่าแก๊ส เซิร์ฟเวอร์จะเซ็น Signature ด้วย `PRIVATE_KEY` ผ่าน `ethers.js` ให้
- **Marketplace (กำลังพัฒนา):** ระบบตลาดรองที่ให้ผู้เล่นลงโฆษณาขายการ์ดด้วยเหรียญ USDT โดยหักค่าธรรมเนียม Royalty Fee 5% ให้ Developer

## 8. 🛠️ สถาปัตยกรรมของระบบ (Tech Stack)
- **Frontend:** HTML5, CSS, Vanilla JavaScript (ออกแบบสไตล์ Modern Glassmorphism/Dark Mode)
- **Backend:** Node.js, Express, `socket.io` (Real-time Multiplayer)
- **Database:** Supabase (PostgreSQL + REST API)
- **Hosting:** Vercel (Frontend) / Render (Backend)

---
*ความรู้นี้ถูกฝัง (Embedded) ไว้ในสมองของ AI ประจำ Workspace นี้แล้ว ทุกครั้งที่คุณสั่งงาน AI จะสามารถดึงบริบทเหล่านี้มาใช้ตัดสินใจเขียนโค้ดและตอบคำถามได้อย่างแม่นยำ*
