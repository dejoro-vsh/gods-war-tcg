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
            img: "https://res.cloudinary.com/dju44op8w/image/upload/v1777467648/Gemini_Generated_Image_4wo9z44wo9z44wo9_ry0w3f.jpg" 
        },
        { 
            name: "Erlang", 
            atk: 4500, 
            cost: 2, 
            atkCost: 1, 
            type: "blocker", 
            img: "https://res.cloudinary.com/dju44op8w/image/upload/v1777472457/Gemini_Generated_Image_s7osias7osias7os_fabxbv.jpg" 
        },
        { 
            name: "Nezha", 
            atk: 5500, 
            cost: 3, 
            atkCost: 1, 
            type: "warrior",
            counter: 2000, 
            skills: ["on_play:draw_1"], // When played, draw 1 card
            img: "https://res.cloudinary.com/dju44op8w/image/upload/v1777472501/Gemini_Generated_Image_m8c3vam8c3vam8c3_pqnpqt.jpg" 
        },
        { 
            name: "Meditation", 
            type: "event", 
            effect: "draw_2", 
            cost: 2, 
            img: "./assets/images/event_meditation.png" 
        },
        { 
            name: "Divine Elixir", 
            type: "event", 
            effect: "heal_1", 
            cost: 1, 
            img: "./assets/images/event_elixir.png" 
        }
    ],
    greekCards: [
        { 
            name: "Hercules", 
            atk: 5500, 
            cost: 4, 
            atkCost: 2, 
            type: "warrior",
            img: "https://res.cloudinary.com/dju44op8w/image/upload/v1777472328/Gemini_Generated_Image_3r1qj3r1qj3r1qj3_huokog.jpg" 
        },
        { 
            name: "Spartan", 
            atk: 4000, 
            cost: 2, 
            atkCost: 1, 
            type: "blocker", 
            img: "https://res.cloudinary.com/dju446p8w/image/upload/v1777467845/Gemini_Generated_Image_b5bzkyb5bzkyb5bz_dufa4t.jpg" 
        }
    ]
};

// Expose to global scope for index.html to use
window.CardDatabase = CardDatabase;
