const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xgmqqyriwoxzxtlzkmwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbXFxeXJpd294enh0bHprbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTY1OTEsImV4cCI6MjA5MzEzMjU5MX0.YnOFAdSOowCHS3AgOVihAeTT31-mkQNmQAjgfhMVhu8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMintedCards() {
    console.log("Checking minted cards on Supabase...");
    const { data: mintedCards, error } = await supabase
        .from('player_inventory')
        .select('*')
        .eq('is_minted', true);
        
    if (error) {
        console.error("Error fetching inventory:", error);
        return;
    }
    
    console.log(`Found ${mintedCards.length} minted cards!`);
    mintedCards.forEach(card => {
        console.log(`- Card: ${card.card_name} | Grade: ${card.grade} | Faction: ${card.faction} | ID in DB: ${card.id}`);
    });
}

checkMintedCards();
