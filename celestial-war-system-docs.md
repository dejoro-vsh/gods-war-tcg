# 📑 Project: Celestial War TCG - System Documentation
**Version:** 1.5 (Mobile Optimized)
**Last Updated:** April 30, 2026
**Architect:** Gemini 3 Flash (Paid Tier) & User

## 1. 🎯 Game Concept & Mechanics
Celestial War เป็นเกม TCG (Trading Card Game) แนวประจันหน้ากันระหว่างเทพเจ้าจีน (ฝ่ายผู้เล่น) และเทพเจ้ากรีก (ฝ่าย AI/ซุส)

### ⛩️ Core Rules (กฎหลัก)
*   **Essence (DON!! Style):** ระบบพลังงานหมุนเวียน
    *   **First Player:** ได้ 1 Essence ในเทิร์นแรก
    *   **Second Player:** ได้ 2 Essence ในเทิร์นแรก
    *   **Scaling:** เพิ่ม +2 Essence ทุกต้นเทิร์นใหม่ (Max 10)
    *   **Refresh:** Essence ที่ใช้แล้ว (Rested) จะกลับมาพร้อมใช้ (Active) ในเทิร์นถัดไป
*   **Field Limit:** วางทหาร (Character) ได้สูงสุด **5 ใบ** ต่อฝั่ง (ไม่รวม Leader)
*   **Battle Flow:**
    *   **2-Click Attack:** คลิกที่ 1 เลือกตัวตี (ต้องมี Essence พอ) -> คลิกที่ 2 เลือกเป้าหมาย
    *   **Targeting:** โจมตีได้เฉพาะ **Leader** หรือ **ทหารที่นอน (Rest)** เท่านั้น
    *   **Defense Window:** ฝ่ายรับสามารถใช้ **Blocker (สนาม)** หรือ **Counter (มือ)** เมื่อถูกโจมตี

## 2. 🏗️ System Architecture
ออกแบบมาเพื่อรองรับการขยายตัวสู่ระบบ Multiplayer และ Blockchain

### 📱 Frontend (Web/Mobile)
*   **Technology:** HTML5, CSS3 (Mobile-First Responsive), JavaScript (Vanilla)
*   **UI Layout:** 
    *   **Top:** Enemy Leader & Stats
    *   **Center:** Battlefield (Grid layout, non-overlapping)
    *   **Bottom:** Floating Hand (Horizontal Scroll)
    *   **Controls:** Hidden start buttons after turn 1, permanent End Turn button

### ⚙️ Game Engine Logic
*   **State Management:** จัดเก็บสถานะ HP, Essence (Active/Total), Deck Count, และสถานะ Rest ของการ์ดแบบ Real-time
*   **Turn Manager:** ควบคุมการสลับฝั่งและการรับทรัพยากร (Scaling Logic)
*   **AI (Zeus):** 
    *   เรียกทหารสุ่มจาก `greekCards`
    *   จ่าย Essence โจมตีผู้เล่นเพื่อ Trigger ระบบ Defense

## 3. 🃏 Data Structure (Card Schema)
```javascript
{
  "name": "String",
  "atk": "Number (5000+)",
  "cost": "Number (Essence to play)",
  "atkCost": "Number (Essence to attack)",
  "type": "String (warrior/blocker)",
  "counter": "Number (Optional: used from hand)",
  "img": "URL String",
  "isRest": "Boolean"
}
```

## 4. ⛓️ Blockchain Integration Plan (Phase 4)
*   **Hybrid Model:**
    *   **Off-chain:** Battle Logic & Real-time State (รันบน Node.js Backend)
    *   **On-chain:** Card Ownership (NFT)
*   **Bitcoin Constraint:** ใช้ Bitcoin Script สำหรับบันทึกกรรมสิทธิ์ (Ownership Record) ผ่านระบบพาสเวิร์ด/คีย์สำหรับโอนสิทธิ์การ์ดแต่ละใบ

## 5. 🛠️ Complete Source Code Snapshot
*เนื่องจากโค้ดมีความยาว AI สามารถอ้างอิงจากบทสนทนาล่าสุด (Mobile Edition) ซึ่งเป็นเวอร์ชันเสถียรที่สุด*

---

## 📅 Next Development Phase (Roadmap)
1.  **Skills System:** พัฒนาความสามารถพิเศษ (Rush, On Play, Banish)
2.  **Event Cards:** ระบบการ์ดเวทมนตร์กดใช้จากมือ
3.  **Visual Polish:** เพิ่มระบบสั่นหน้าจอ (Screen Shake) และเลขดาเมจลอยขึ้น
4.  **Multiplayer:** เชื่อมต่อ WebSocket สำหรับการแข่งออนไลน์จริง

---

**🔐 Credentials & Access Info:**
*   **Deployment:** Vercel (Production URL: gods-war-tcg.vercel.app)
*   **Password/Access:** (ระบุตามที่พี่กำหนดไว้ในระบบเซิร์ฟเวอร์ของพี่)
*   **Compliance:** ข้อมูลชุดนี้ห้ามเผยแพร่สู่สาธารณะเพื่อรักษาความลับทางการค้า

---

### 🚀 Next Step สำหรับพรุ่งนี้
ผมจะเตรียม Logic สำหรับ **Character Skills** และ **Event Cards** รอไว้นะครับ พี่แค่อัปโหลดไฟล์นี้ให้ AntiGravity ตรวจสอบ พรุ่งนี้เราจะทำงานได้เร็วและแม่นยำขึ้นมากครับ! ถ้าพี่ต้องการให้เพิ่มหัวข้อไหนเป็นพิเศษในเอกสารนี้ บอกได้เลยครับ!
