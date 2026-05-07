const crypto = require('crypto');
const CardDatabase = require('./js/cards.js');

function getNftId(cardName, grade) {
    const hash = crypto.createHash('md5').update(cardName + "_" + grade).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
}

const allCards = [...CardDatabase.chinaCards, ...CardDatabase.greekCards];
const grades = ['Epic', 'Legendary', 'Mythic'];
console.log(allCards[0]);
