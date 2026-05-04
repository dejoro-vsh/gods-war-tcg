require('dotenv').config({path: './server/.env'});
const { createClient } = require('@supabase/supabase-js');

// Assuming URL and KEY are available, if not, I'll need to extract them from index.html
// Wait, index.html line 410 has the URL and ANON KEY! Let me just use those since it's the client key.
const supabaseUrl = 'https://xgmqqyriwoxzxtlzkmwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbXFxeXJpd294enh0bHprbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTY1OTEsImV4cCI6MjA5MzEzMjU5MX0.YnOFAdSOowCHS3AgOVihAeTT31-mkQNmQAjgfhMVhu8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInventory() {
    console.log("Checking player inventories...");
    const { data: inventories, error } = await supabase
        .from('player_inventory')
        .select('*');
        
    if (error) {
        console.error("Error fetching inventory:", error);
        return;
    }
    
    const playerStats = {};
    
    inventories.forEach(inv => {
        if (!playerStats[inv.player_id]) {
            playerStats[inv.player_id] = { total: 0, china: 0, greek: 0 };
        }
        playerStats[inv.player_id].total++;
        if (inv.faction === 'china') {
            playerStats[inv.player_id].china++;
        } else if (inv.faction === 'greek') {
            playerStats[inv.player_id].greek++;
        }
    });
    
    console.log(`Found ${Object.keys(playerStats).length} players with inventory.`);
    console.log("---------------------------------------------------");
    
    let buggyPlayers = 0;
    
    for (const [playerId, stats] of Object.entries(playerStats)) {
        console.log(`Player: ${playerId}`);
        console.log(`  Total Cards: ${stats.total}`);
        console.log(`  China Faction: ${stats.china} cards`);
        console.log(`  Greek Faction: ${stats.greek} cards`);
        
        if (stats.china > 150 || stats.greek > 150) {
            console.log(`  ❌ WARNING: Faction inventory exceeds 150 cards limit!`);
            buggyPlayers++;
        }
        console.log("---------------------------------------------------");
    }
    
    console.log(`Summary: ${buggyPlayers} players have exceeded the 150 card limit.`);
}

checkInventory();
