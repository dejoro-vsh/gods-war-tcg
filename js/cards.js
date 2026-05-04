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
            img: "./assets/images/china_wukong.png" 
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
            img: "./assets/images/china_erlang.png" 
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
            img: "./assets/images/china_nezha.png" 
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
        },
        { 
            name: "Heavenly Court", 
            type: "stage", 
            cost: 2,
            faction: "china", 
            img: "./assets/images/stage_heavenly_court.png" 
        },
        { 
            name: "Hou Yi", 
            atk: 5000, 
            cost: 4, 
            atkCost: 1, 
            skills: ["snipe"], 
            type: "warrior",
            faction: "china", 
            img: "./assets/images/china_houyi.png" 
        },
        { 
            name: "Qilin", 
            atk: 3500, 
            cost: 3, 
            atkCost: 1, 
            skills: ["on_play:buff_all"], 
            type: "blocker",
            faction: "china", 
            img: "./assets/images/china_qilin.png" 
        },
        { 
            name: "Mazu", 
            type: "event", 
            effect: "heal_2", 
            cost: 3,
            faction: "china", 
            img: "./assets/images/china_mazu.png" 
        },
        { 
            name: "Jade Emperor", 
            atk: 8000, 
            cost: 6, 
            atkCost: 2, 
            skills: ["pierce"], 
            type: "warrior",
            faction: "china", 
            img: "./assets/images/leader_jade_emperor.png" 
        }
    ],
    greekCards: [
        { 
            name: "Achilles", 
            atk: 6500, 
            cost: 4, 
            atkCost: 1, 
            type: "blocker",
            faction: "greek",
            img: "./assets/images/greek_achilles.png" 
        },
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
            counter: 2000,
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
        },
        { 
            name: "Mount Olympus", 
            type: "stage", 
            cost: 2,
            faction: "greek", 
            img: "./assets/images/stage_mount_olympus.png" 
        },
        { 
            name: "Poseidon", 
            atk: 5500, 
            cost: 4, 
            atkCost: 2, 
            skills: ["on_play:stun"], 
            type: "warrior",
            faction: "greek", 
            img: "./assets/images/greek_poseidon.png" 
        },
        { 
            name: "Medusa", 
            type: "event", 
            effect: "destroy_weak", 
            cost: 4,
            faction: "greek", 
            img: "./assets/images/greek_medusa.png" 
        },
        { 
            name: "Pegasus", 
            atk: 4500, 
            cost: 3, 
            atkCost: 1, 
            skills: ["evade"], 
            type: "warrior",
            faction: "greek", 
            img: "./assets/images/greek_pegasus.png" 
        },
        { 
            name: "Zeus", 
            atk: 8000, 
            cost: 6, 
            atkCost: 2, 
            skills: ["pierce"], 
            type: "warrior",
            faction: "greek", 
            img: "./assets/images/leader_zeus.png" 
        }
    ]
};

// Expose to global scope for index.html to use
window.CardDatabase = CardDatabase;
