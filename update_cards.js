const fs = require('fs');
const path = 'f:/antigravity/god-war/index.html';

let content = fs.readFileSync(path, 'utf8');

// 1. Add CSS for standard TCG card frame
const newCSS = `
        /* NEW STANDARD TCG CARD FRAME */
        .card { width: 88px; height: 125px; border: 2px solid var(--gold); border-radius: 8px; background: #000; position: relative; cursor: pointer; transition: transform 0.2s, margin 0.3s, z-index 0s; flex-shrink: 0; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.6); }
        .card:hover, .card:active { transform: translateY(-15px) scale(1.15) !important; z-index: 100 !important; box-shadow: 0 10px 20px rgba(0,0,0,0.8); }
        .card img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
        
        /* Card Frame Overlay */
        .card::before {
            content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 45%;
            background: linear-gradient(transparent, rgba(0,0,0,0.9) 30%, #000); z-index: 1; border-radius: 0 0 6px 6px;
        }
        
        /* Badges & Text */
        .badge { position: absolute; padding: 2px 4px; border-radius: 3px; font-size: 10px; font-weight: bold; border: 1px solid #000; z-index: 3; }
        .cost-val { position: absolute; top: 0px; left: 0px; background: radial-gradient(circle, #3498db, #2980b9); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; color: white; font-size: 14px; font-weight: bold; z-index: 3; box-shadow: 2px 2px 5px rgba(0,0,0,0.5); }
        .atk-val { position: absolute; bottom: 4px; right: 4px; background: radial-gradient(circle, #e74c3c, #c0392b); border: 2px solid #fff; color: white; border-radius: 4px; font-size: 12px; padding: 2px 6px; z-index: 3; box-shadow: -2px 2px 5px rgba(0,0,0,0.5); }
        
        .card-name-plate { position: absolute; bottom: 22px; left: 0; width: 100%; text-align: center; color: #fff; font-size: 10px; font-weight: bold; z-index: 2; text-shadow: 1px 1px 2px #000; padding: 0 2px; box-sizing: border-box; line-height: 1.1; }
        .card-type-plate { position: absolute; bottom: 4px; left: 4px; color: #aaa; font-size: 8px; z-index: 2; text-shadow: 1px 1px 1px #000; text-transform: uppercase; }
        
        /* Field tweaks */
        .field-zone .card { width: 68px; height: 98px; border-width: 1.5px; border-radius: 6px; }
        .field-zone .card::before { height: 50%; }
        .field-zone .badge { font-size: 9px; padding: 1px 3px; }
        .field-zone .cost-val { width: 18px; height: 18px; font-size: 11px; top: -3px; left: -3px; border-width: 1px; }
        .field-zone .card-name-plate { font-size: 8px; bottom: 18px; }
        .field-zone .card-type-plate { font-size: 6px; bottom: 2px; }
        
        /* Faction Colors */
        .faction-china .card { border-color: #ff4d4d; box-shadow: 0 0 5px rgba(255,77,77,0.5); }
        .faction-greek .card { border-color: #00ccff; box-shadow: 0 0 5px rgba(0,204,255,0.5); }
`;

// Replace old card CSS section
content = content.replace(/\.card\s*\{[^}]+\}\s*\.card:hover[^}]+\}\s*\.card img\s*\{[^}]+\}/m, '/* CSS REPLACED BY SCRIPT */');
content = content.replace(/\/\* Badges \*\/\s*\.badge\s*\{[^}]+\}\s*\.cost-val\s*\{[^}]+\}/m, '/* CSS REPLACED BY SCRIPT */');
// Find the <style> tag and insert new CSS
content = content.replace('</style>', newCSS + '\n    </style>');

// 2. Add Name Plate to the template literals
// Find: <img src="${c.img}" onerror="...">
// And inject the name plate right after it.
const namePlateInjection = `<div class="card-name-plate">\${c.name}</div><div class="card-type-plate">\${c.type || 'Event'}</div>`;

content = content.replace(/(<img src="\$\{c\.img\}" onerror="[^"]+">)/g, `$1${namePlateInjection}`);

fs.writeFileSync(path, content, 'utf8');
console.log('Cards CSS and HTML updated!');
