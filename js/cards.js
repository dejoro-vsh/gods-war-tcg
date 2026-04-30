// Database of all cards in the game
const CardDatabase = {
    chinaCards: [
        { 
            name: "Wukong", 
            atk: 6000, 
            cost: 5, 
            atkCost: 2, 
            skills: ["rush"], 
            type: "warrior",
            faction: "china",
            img: "https://res.cloudinary.com/dju44op8w/image/upload/v1777467648/Gemini_Generated_Image_4wo9z44wo9z44wo9_ry0w3f.jpg" 
        },
        { 
            name: "Guan Yu", 
            atk: 6500, 
            cost: 4, 
            atkCost: 1, 
            type: "blocker",
            faction: "china", 
            img: "./assets/images/china_guanyu.png" 
        },
        { 
            name: "Erlang", 
            atk: 4500, 
            cost: 2, 
            atkCost: 1, 
            type: "blocker",
            faction: "china", 
            img: "https://res.cloudinary.com/dju44op8w/image/upload/v1777472457/Gemini_Generated_Image_s7osias7osias7os_fabxbv.jpg" 
        },
        { 
            name: "Nezha", 
            atk: 5500, 
            cost: 3, 
            atkCost: 1, 
            type: "warrior",
            counter: 2000, 
            skills: ["on_play:draw_1"],
            faction: "china",
            img: "https://res.cloudinary.com/dju44op8w/image/upload/v1777472501/Gemini_Generated_Image_m8c3vam8c3vam8c3_pqnpqt.jpg" 
        },
        { 
            name: "Meditation", 
            type: "event", 
            effect: "draw_2", 
            cost: 2,
            faction: "china", 
            img: "./assets/images/event_meditation.png" 
        },
        { 
            name: "Divine Elixir", 
            type: "event", 
            effect: "heal_1", 
            cost: 1,
            faction: "china", 
            img: "./assets/images/event_elixir.png" 
        },
        { 
            name: "Zhu Bajie", 
            atk: 5000, 
            cost: 3, 
            atkCost: 1, 
            type: "warrior",
            faction: "china", 
            img: "./assets/images/china_zhubajie.png" 
        },
        { 
            name: "Nuwa's Flood", 
            type: "event", 
            effect: "board_wipe", 
            cost: 8,
            faction: "china", 
            img: "./assets/images/event_nuwa_flood.png" 
        }
    ],
    greekCards: [
        { 
            name: "Hercules", 
            atk: 5500, 
            cost: 4, 
            atkCost: 2, 
            type: "warrior",
            faction: "greek",
            img: "./assets/images/greek_hercules.png" 
        },
        { 
            name: "Spartan", 
            atk: 4000, 
            cost: 2, 
            atkCost: 1, 
            type: "blocker",
            faction: "greek", 
            img: "./assets/images/greek_spartan.png" 
        },
        { 
            name: "Valkyrie", 
            atk: 4500, 
            cost: 3, 
            atkCost: 1, 
            type: "warrior",
            faction: "greek", 
            img: "./assets/images/greek_valkyrie.png" 
        },
        { 
            name: "Oracle's Vision", 
            type: "event", 
            effect: "ai_summon", 
            cost: 2,
            faction: "greek", 
            img: "./assets/images/event_oracle.png" 
        },
        { 
            name: "Ambrosia", 
            type: "event", 
            effect: "heal_1", 
            cost: 1,
            faction: "greek", 
            img: "./assets/images/event_ambrosia.png" 
        },
        { 
            name: "Ares", 
            atk: 6000, 
            cost: 5, 
            atkCost: 2, 
            skills: ["rush"], 
            type: "warrior",
            faction: "greek", 
            img: "./assets/images/greek_ares.png" 
        },
        { 
            name: "Zeus's Wrath", 
            type: "event", 
            effect: "board_wipe", 
            cost: 8,
            faction: "greek", 
            img: "./assets/images/event_zeus_wrath.png" 
        }
    ]
};

// Expose to global scope for index.html to use
window.CardDatabase = CardDatabase;
