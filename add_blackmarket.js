const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Black Market Button
const marketplaceBtn = `<button id="btn-view-marketplace" onclick="openMarketplace()" style="background: linear-gradient(90deg, #e74c3c, #c0392b); border:none; padding:12px 15px; border-radius:8px; font-weight:bold; cursor:pointer; color:white; width:100%; box-shadow: 0 4px 15px rgba(231,76,60,0.4); margin-top:10px;">🏪 กระดานโฆษณาซื้อขายการ์ด (VIP Ads)</button>`;

const newButtons = marketplaceBtn + `
                <button id="btn-view-blackmarket" onclick="openBlackMarket()" style="background: linear-gradient(90deg, #111, #333); border:2px solid #8e44ad; padding:12px 15px; border-radius:8px; font-weight:bold; cursor:pointer; color:#e056fd; width:100%; box-shadow: 0 4px 15px rgba(142,68,173,0.6); margin-top:10px; font-size: 16px; text-shadow: 0 0 5px #e056fd;">🛒 ตลาดมืด (Black Market)</button>`;

html = html.replace(marketplaceBtn, newButtons);

// 2. Add Modal UI
const modalUI = `
    <!-- BLACK MARKET SCREEN -->
    <div id="blackmarket-screen" style="display:none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 5000; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
        <div style="width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; background: linear-gradient(180deg, #1a0b2e 0%, #000000 100%); padding: 25px; border-radius: 20px; border: 2px solid #8e44ad; color: white; display: flex; flex-direction: column; gap: 15px; box-shadow: 0 10px 50px rgba(142,68,173,0.5);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2 style="margin:0; color:#e056fd; text-shadow: 0 0 10px #8e44ad;">🛒 ตลาดมืด (Black Market)</h2>
                <button onclick="document.getElementById('blackmarket-screen').style.display='none'" style="background:none; border:none; color:#888; font-size:24px; cursor:pointer;">❌</button>
            </div>
            
            <div style="font-size:12px; color:#aaa; text-align:center; margin-bottom: 10px;">สถานที่ค้าขายของเถื่อนด้วยเงินจริง (Stripe Test Mode)</div>
            
            <!-- TABS -->
            <div style="display:flex; gap:10px;">
                <button onclick="switchBMTab('slots')" id="bm-tab-slots" style="flex:1; padding:10px; background:#8e44ad; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🎒 เช่ากระเป๋า</button>
                <button onclick="switchBMTab('cards')" id="bm-tab-cards" style="flex:1; padding:10px; background:#333; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🔮 การ์ดเทพ SP</button>
            </div>

            <!-- CONTENT: SLOTS -->
            <div id="bm-content-slots" style="display:block;">
                <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; border:1px solid rgba(142,68,173,0.3);">
                    <h3 style="margin-top:0; color:#FFD700;">🎒 สัญญาเช่าพื้นที่กระเป๋า (30 วัน)</h3>
                    <p style="font-size:13px; color:#ccc;">จ่ายค่าเช่ารายเดือนเพื่อเพิ่มช่องเก็บการ์ด <br><b style="color:red;">หมดอายุแล้วการ์ดไม่หาย แต่เปิดซองรับการ์ดใหม่ไม่ได้</b></p>
                    <div style="display:flex; align-items:center; gap:15px; margin:20px 0;">
                        <input type="number" id="bm-slot-qty" value="10" min="1" max="100" onchange="calcBMSlotPrice()" style="width:100px; padding:10px; font-size:20px; background:#000; color:white; border:2px solid #8e44ad; border-radius:8px; text-align:center;">
                        <span style="font-size:18px;">ช่อง (+<span id="bm-slot-qty-disp">10</span> ช่อง)</span>
                    </div>
                    <div style="font-size:24px; font-weight:bold; color:#FFD700; text-align:right; margin-bottom:15px;">ราคา: <span id="bm-slot-price">650</span> ฿</div>
                    <button onclick="buyBlackMarket('buy_slots')" style="width:100%; padding:15px; background:linear-gradient(90deg, #8e44ad, #9b59b6); border:none; border-radius:10px; font-size:16px; font-weight:bold; color:white; cursor:pointer; box-shadow: 0 0 15px rgba(142,68,173,0.6);">จ่ายเงินซื้อพื้นที่กระเป๋า</button>
                </div>
            </div>

            <!-- CONTENT: CARDS -->
            <div id="bm-content-cards" style="display:none;">
                <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; border:1px solid rgba(142,68,173,0.3);">
                    <h3 style="margin-top:0; color:#FFD700;">🔮 อัญเชิญเทพจุติ (SP Grade)</h3>
                    <p style="font-size:13px; color:#ccc;">การ์ดเกรดพิเศษ SP ไม่มีในตู้สุ่มปกติ!</p>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:15px;">
                        
                        <div style="text-align:center; border:1px solid #555; border-radius:8px; padding:5px; background:#000;">
                            <img src="./assets/images/sp_zeus.png" style="width:100%; border-radius:5px; margin-bottom:5px;">
                            <div style="font-size:12px; font-weight:bold; margin-bottom:5px;">Zeus SP</div>
                            <button onclick="buyBlackMarket('buy_sp_card', 'Zeus SP', 'greek')" style="width:100%; padding:8px; background:#e67e22; border:none; border-radius:5px; color:white; font-weight:bold; cursor:pointer;">999 ฿</button>
                        </div>
                        
                        <div style="text-align:center; border:1px solid #555; border-radius:8px; padding:5px; background:#000;">
                            <img src="./assets/images/sp_poseidon.png" style="width:100%; border-radius:5px; margin-bottom:5px;">
                            <div style="font-size:12px; font-weight:bold; margin-bottom:5px;">Poseidon SP</div>
                            <button onclick="buyBlackMarket('buy_sp_card', 'Poseidon SP', 'greek')" style="width:100%; padding:8px; background:#e67e22; border:none; border-radius:5px; color:white; font-weight:bold; cursor:pointer;">999 ฿</button>
                        </div>
                        
                        <div style="text-align:center; border:1px solid #555; border-radius:8px; padding:5px; background:#000;">
                            <img src="./assets/images/sp_jade_emperor.png" style="width:100%; border-radius:5px; margin-bottom:5px;">
                            <div style="font-size:12px; font-weight:bold; margin-bottom:5px;">Jade Emperor SP</div>
                            <button onclick="buyBlackMarket('buy_sp_card', 'Jade Emperor SP', 'china')" style="width:100%; padding:8px; background:#e67e22; border:none; border-radius:5px; color:white; font-weight:bold; cursor:pointer;">999 ฿</button>
                        </div>

                        <div style="text-align:center; border:1px solid #555; border-radius:8px; padding:5px; background:#000;">
                            <img src="./assets/images/sp_sun_wukong.png" style="width:100%; border-radius:5px; margin-bottom:5px;">
                            <div style="font-size:12px; font-weight:bold; margin-bottom:5px;">Sun Wukong SP</div>
                            <button onclick="buyBlackMarket('buy_sp_card', 'Sun Wukong SP', 'china')" style="width:100%; padding:8px; background:#e67e22; border:none; border-radius:5px; color:white; font-weight:bold; cursor:pointer;">999 ฿</button>
                        </div>
                        
                    </div>
                </div>
            </div>

        </div>
    </div>
    
</body>`;

html = html.replace('</body>', modalUI);

// 3. Add JS Logic
const newJS = `
        function openBlackMarket() {
            document.getElementById('profile-screen').style.display = 'none';
            document.getElementById('blackmarket-screen').style.display = 'flex';
            switchBMTab('slots');
        }

        function switchBMTab(tab) {
            document.getElementById('bm-content-slots').style.display = tab === 'slots' ? 'block' : 'none';
            document.getElementById('bm-content-cards').style.display = tab === 'cards' ? 'block' : 'none';
            document.getElementById('bm-tab-slots').style.background = tab === 'slots' ? '#8e44ad' : '#333';
            document.getElementById('bm-tab-cards').style.background = tab === 'cards' ? '#8e44ad' : '#333';
        }

        function calcBMSlotPrice() {
            const qty = parseInt(document.getElementById('bm-slot-qty').value) || 1;
            document.getElementById('bm-slot-qty-disp').innerText = qty;
            document.getElementById('bm-slot-price').innerText = (qty * 65).toLocaleString();
        }

        async function buyBlackMarket(packType, cardName = null, faction = null) {
            const btn = event.currentTarget;
            const originalText = btn.innerText;
            btn.innerText = "กำลังสร้างบิล...";
            btn.disabled = true;

            const quantity = parseInt(document.getElementById('bm-slot-qty').value) || 1;

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const serverUrl = isLocal ? 'http://localhost:3000' : (window.location.hostname.includes('staging') ? 'https://gods-war-tcg.onrender.com' : 'https://gods-war-tcg-server.onrender.com');

            try {
                const res = await fetch(\`\${serverUrl}/api/checkout/create-session\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerId, packType, quantity, cardName, faction })
                });
                
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                
                if (data.url) {
                    window.location.href = data.url;
                }
            } catch(e) {
                alert("เกิดข้อผิดพลาด: " + e.message);
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    </script>`;

html = html.replace('</script>', newJS);

// 4. Update Inventory Limit Logic
const invLimitSearch = `ฝ่ายจีน (<span id="inv-count-china">0</span>/150)`;
const invLimitReplace = `ฝ่ายจีน (<span id="inv-count-china">0</span>/<span id="inv-max-china">150</span>)`;
html = html.replace(invLimitSearch, invLimitReplace);

const invLimitGreekSearch = `ฝ่ายกรีก (<span id="inv-count-greek">0</span>/150)`;
const invLimitGreekReplace = `ฝ่ายกรีก (<span id="inv-count-greek">0</span>/<span id="inv-max-greek">150</span>)`;
html = html.replace(invLimitGreekSearch, invLimitGreekReplace);

// Update logic in DB fetch
const renderInventorySearch = `document.getElementById('inv-count-greek').innerText = currentGreek;`;
const renderInventoryReplace = `document.getElementById('inv-count-greek').innerText = currentGreek;
                
                // Calculate Dynamic Max Capacity
                let currentMax = 150;
                if (playerStats.inv_bonus_slots && playerStats.inv_bonus_expires_at) {
                    const expiry = new Date(playerStats.inv_bonus_expires_at);
                    if (expiry > new Date()) {
                        currentMax += playerStats.inv_bonus_slots;
                    }
                }
                document.getElementById('inv-max-china').innerText = currentMax;
                document.getElementById('inv-max-greek').innerText = currentMax;`;
html = html.replace(renderInventorySearch, renderInventoryReplace);

// Exclude SP cards from buyPack
const gachaExcludeSearch = `const allCardsNames = [...chinaCards, ...greekCards];`;
const gachaExcludeReplace = `const allCardsNames = [...chinaCards, ...greekCards].filter(c => !c.is_special).map(c => c.name);`;
// Wait, the client-side gacha is disabled anyway, it's done server-side. But let's fix it just in case.
html = html.replace(gachaExcludeSearch, gachaExcludeReplace);

fs.writeFileSync('index.html', html);
console.log('Black Market patched successfully!');
