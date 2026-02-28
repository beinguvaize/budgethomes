// ── Demo seed data ──────────────────────────────────────────
import { uid } from '../core/utils.js';

export function seedData() {
    return {
        settings: {
            restaurantName: 'RestroFlow',
            taxRate: 10,          // percent
            serviceChargeRate: 5, // percent
            currency: 'USD'
        },

        users: [
            { id: 'u1', name: 'Alex', pin: '1111', role: 'manager', active: true },
            { id: 'u2', name: 'Maria', pin: '2222', role: 'waiter', active: true },
            { id: 'u3', name: 'James', pin: '3333', role: 'waiter', active: true },
            { id: 'u4', name: 'Chef K', pin: '4444', role: 'kitchen', active: true },
            { id: 'u5', name: 'Sam', pin: '5555', role: 'cashier', active: true },
        ],

        categories: [
            { id: 'cat1', name: 'Starters', sortOrder: 1, icon: '🥗' },
            { id: 'cat2', name: 'Mains', sortOrder: 2, icon: '🍽️' },
            { id: 'cat3', name: 'Pizza', sortOrder: 3, icon: '🍕' },
            { id: 'cat4', name: 'Pasta', sortOrder: 4, icon: '🍝' },
            { id: 'cat5', name: 'Burgers', sortOrder: 5, icon: '🍔' },
            { id: 'cat6', name: 'Desserts', sortOrder: 6, icon: '🍰' },
            { id: 'cat7', name: 'Drinks', sortOrder: 7, icon: '🥤' },
            { id: 'cat8', name: 'Sides', sortOrder: 8, icon: '🍟' },
        ],

        modifierGroups: [
            {
                id: 'mg1', name: 'Size', required: true, multiSelect: false,
                options: [
                    { id: 'mg1-s', name: 'Small', price: 0 },
                    { id: 'mg1-m', name: 'Medium', price: 200 },
                    { id: 'mg1-l', name: 'Large', price: 400 },
                ]
            },
            {
                id: 'mg2', name: 'Spice Level', required: false, multiSelect: false,
                options: [
                    { id: 'mg2-mild', name: 'Mild', price: 0 },
                    { id: 'mg2-medium', name: 'Medium', price: 0 },
                    { id: 'mg2-hot', name: 'Hot', price: 0 },
                    { id: 'mg2-extra', name: 'Extra Hot', price: 0 },
                ]
            },
            {
                id: 'mg3', name: 'Add-ons', required: false, multiSelect: true,
                options: [
                    { id: 'mg3-cheese', name: 'Extra Cheese', price: 150 },
                    { id: 'mg3-bacon', name: 'Bacon', price: 200 },
                    { id: 'mg3-avocado', name: 'Avocado', price: 250 },
                    { id: 'mg3-egg', name: 'Fried Egg', price: 150 },
                    { id: 'mg3-mushroom', name: 'Mushrooms', price: 100 },
                ]
            },
            {
                id: 'mg4', name: 'Cooking', required: false, multiSelect: false,
                options: [
                    { id: 'mg4-rare', name: 'Rare', price: 0 },
                    { id: 'mg4-mr', name: 'Medium Rare', price: 0 },
                    { id: 'mg4-med', name: 'Medium', price: 0 },
                    { id: 'mg4-mw', name: 'Medium Well', price: 0 },
                    { id: 'mg4-well', name: 'Well Done', price: 0 },
                ]
            },
            {
                id: 'mg5', name: 'Drink Size', required: true, multiSelect: false,
                options: [
                    { id: 'mg5-s', name: 'Regular', price: 0 },
                    { id: 'mg5-l', name: 'Large', price: 150 },
                ]
            },
        ],

        menuItems: [
            // Starters
            { id: 'mi1', categoryId: 'cat1', name: 'Bruschetta', price: 850, description: 'Toasted bread with tomato & basil', modifierGroups: [], available: true, image: '/images/bruschetta.png', featured: true },
            { id: 'mi2', categoryId: 'cat1', name: 'Calamari Fritti', price: 1100, description: 'Crispy fried squid with aioli', modifierGroups: ['mg2'], available: true, image: '/images/calamari.png', featured: true },
            { id: 'mi3', categoryId: 'cat1', name: 'Caesar Salad', price: 950, description: 'Romaine, croutons, parmesan', modifierGroups: ['mg3'], available: true, image: '/images/caesar_salad.webp' },
            { id: 'mi4', categoryId: 'cat1', name: 'Soup of the Day', price: 700, description: 'Ask your server for today\'s special', modifierGroups: ['mg1'], available: true, image: '/images/soup.webp' },
            { id: 'mi5', categoryId: 'cat1', name: 'Garlic Bread', price: 550, description: 'With melted mozzarella', modifierGroups: ['mg3'], available: true, image: '/images/garlic_bread.webp' },

            // Mains
            { id: 'mi6', categoryId: 'cat2', name: 'Grilled Salmon', price: 2200, description: 'Atlantic salmon with herb butter', modifierGroups: ['mg2'], available: true, image: '/images/salmon.png', featured: true },
            { id: 'mi7', categoryId: 'cat2', name: 'Ribeye Steak', price: 2800, description: '10oz prime cut, choice of sides', modifierGroups: ['mg4', 'mg2'], available: true, image: '/images/steak.png', featured: true },
            { id: 'mi8', categoryId: 'cat2', name: 'Chicken Parmesan', price: 1800, description: 'Breaded chicken with marinara', modifierGroups: ['mg2'], available: true, image: '/images/chicken_parm.webp' },
            { id: 'mi9', categoryId: 'cat2', name: 'Fish & Chips', price: 1600, description: 'Beer-battered cod with fries', modifierGroups: [], available: true, image: '/images/fish_chips.webp' },
            { id: 'mi10', categoryId: 'cat2', name: 'Lamb Chops', price: 2600, description: 'Herb-crusted with rosemary jus', modifierGroups: ['mg4'], available: false, image: '/images/lamb.webp' },

            // Pizza
            { id: 'mi11', categoryId: 'cat3', name: 'Margherita', price: 1400, description: 'Tomato, mozzarella, fresh basil', modifierGroups: ['mg1', 'mg3'], available: true, image: '/images/margherita.png', featured: true },
            { id: 'mi12', categoryId: 'cat3', name: 'Pepperoni', price: 1600, description: 'Classic pepperoni with mozzarella', modifierGroups: ['mg1', 'mg3'], available: true, image: '/images/pepperoni.webp' },
            { id: 'mi13', categoryId: 'cat3', name: 'BBQ Chicken', price: 1700, description: 'BBQ sauce, chicken, red onion', modifierGroups: ['mg1', 'mg3'], available: true, image: '/images/bbq_chicken_pizza.webp' },
            { id: 'mi14', categoryId: 'cat3', name: 'Four Cheese', price: 1500, description: 'Mozzarella, gorgonzola, gouda, parmesan', modifierGroups: ['mg1'], available: true, image: '/images/four_cheese.webp' },

            // Pasta
            { id: 'mi15', categoryId: 'cat4', name: 'Spaghetti Bolognese', price: 1400, description: 'Slow-cooked beef ragu', modifierGroups: ['mg2', 'mg3'], available: true, image: '/images/bolognese.webp' },
            { id: 'mi16', categoryId: 'cat4', name: 'Fettuccine Alfredo', price: 1300, description: 'Creamy parmesan sauce', modifierGroups: ['mg3'], available: true, image: '/images/alfredo.webp' },
            { id: 'mi17', categoryId: 'cat4', name: 'Penne Arrabiata', price: 1200, description: 'Spicy tomato sauce', modifierGroups: ['mg2', 'mg3'], available: true, image: '/images/arrabiata.webp' },
            { id: 'mi18', categoryId: 'cat4', name: 'Carbonara', price: 1500, description: 'Pancetta, egg, pecorino', modifierGroups: ['mg3'], available: true, image: '/images/carbonara.png', featured: true },

            // Burgers
            { id: 'mi19', categoryId: 'cat5', name: 'Classic Burger', price: 1400, description: 'Beef patty, lettuce, tomato, pickles', modifierGroups: ['mg4', 'mg3'], available: true, image: '/images/classic_burger.webp' },
            { id: 'mi20', categoryId: 'cat5', name: 'Cheese Burger', price: 1500, description: 'With cheddar & special sauce', modifierGroups: ['mg4', 'mg3'], available: true, image: '/images/cheese_burger.webp' },
            { id: 'mi21', categoryId: 'cat5', name: 'Chicken Burger', price: 1400, description: 'Grilled chicken with mayo', modifierGroups: ['mg3'], available: true, image: '/images/chicken_burger.webp' },
            { id: 'mi22', categoryId: 'cat5', name: 'Veggie Burger', price: 1300, description: 'Plant-based patty with avocado', modifierGroups: ['mg3'], available: true, image: '/images/veggie_burger.webp' },

            // Desserts
            { id: 'mi23', categoryId: 'cat6', name: 'Tiramisu', price: 900, description: 'Classic Italian coffee dessert', modifierGroups: [], available: true, image: '/images/tiramisu.webp' },
            { id: 'mi24', categoryId: 'cat6', name: 'Chocolate Lava Cake', price: 1000, description: 'Warm center with vanilla ice cream', modifierGroups: [], available: true, image: '/images/lava_cake.webp' },
            { id: 'mi25', categoryId: 'cat6', name: 'Cheesecake', price: 850, description: 'New York style with berry compote', modifierGroups: [], available: true, image: '/images/cheesecake.webp' },
            { id: 'mi26', categoryId: 'cat6', name: 'Gelato', price: 650, description: 'Three scoops, ask for flavors', modifierGroups: [], available: true, image: '/images/gelato.webp' },

            // Drinks
            { id: 'mi27', categoryId: 'cat7', name: 'Coca-Cola', price: 350, description: '', modifierGroups: ['mg5'], available: true, image: '/images/cola.webp' },
            { id: 'mi28', categoryId: 'cat7', name: 'Fresh Juice', price: 500, description: 'Orange, apple, or mango', modifierGroups: ['mg5'], available: true, image: '/images/juice.webp' },
            { id: 'mi29', categoryId: 'cat7', name: 'Sparkling Water', price: 300, description: '500ml', modifierGroups: [], available: true, image: '/images/sparkling_water.webp' },
            { id: 'mi30', categoryId: 'cat7', name: 'Coffee', price: 400, description: 'Espresso, latte, or cappuccino', modifierGroups: ['mg5'], available: true, image: '/images/coffee.webp' },
            { id: 'mi31', categoryId: 'cat7', name: 'Iced Tea', price: 400, description: 'Lemon or peach', modifierGroups: ['mg5'], available: true, image: '/images/iced_tea.webp' },
            { id: 'mi32', categoryId: 'cat7', name: 'Beer (Draft)', price: 600, description: 'Ask for available taps', modifierGroups: ['mg5'], available: true, image: '/images/beer.webp' },
            { id: 'mi33', categoryId: 'cat7', name: 'House Wine', price: 800, description: 'Red or white, by the glass', modifierGroups: [], available: true, image: '/images/wine.webp' },

            // Sides
            { id: 'mi34', categoryId: 'cat8', name: 'French Fries', price: 450, description: 'Crispy golden fries', modifierGroups: ['mg1'], available: true, image: '/images/fries.webp' },
            { id: 'mi35', categoryId: 'cat8', name: 'Onion Rings', price: 500, description: 'Beer-battered', modifierGroups: [], available: true, image: '/images/onion_rings.webp' },
            { id: 'mi36', categoryId: 'cat8', name: 'Coleslaw', price: 350, description: 'Creamy house-made', modifierGroups: [], available: true, image: '/images/coleslaw.webp' },
            { id: 'mi37', categoryId: 'cat8', name: 'Mashed Potatoes', price: 400, description: 'Buttery & smooth', modifierGroups: [], available: true, image: '/images/mashed_potatoes.webp' },
            { id: 'mi38', categoryId: 'cat8', name: 'Grilled Vegetables', price: 500, description: 'Seasonal selection', modifierGroups: [], available: true, image: '/images/grilled_veg.webp' },
        ],

        tables: [
            { id: 't1', name: 'Table 1', section: 'Main Floor', capacity: 2, status: 'available', sessionId: null, waiterId: null },
            { id: 't2', name: 'Table 2', section: 'Main Floor', capacity: 2, status: 'available', sessionId: null, waiterId: null },
            { id: 't3', name: 'Table 3', section: 'Main Floor', capacity: 4, status: 'available', sessionId: null, waiterId: null },
            { id: 't4', name: 'Table 4', section: 'Main Floor', capacity: 4, status: 'available', sessionId: null, waiterId: null },
            { id: 't5', name: 'Table 5', section: 'Main Floor', capacity: 6, status: 'available', sessionId: null, waiterId: null },
            { id: 't6', name: 'Table 6', section: 'Main Floor', capacity: 6, status: 'available', sessionId: null, waiterId: null },
            { id: 't7', name: 'Table 7', section: 'Patio', capacity: 4, status: 'available', sessionId: null, waiterId: null },
            { id: 't8', name: 'Table 8', section: 'Patio', capacity: 4, status: 'available', sessionId: null, waiterId: null },
            { id: 't9', name: 'Table 9', section: 'Patio', capacity: 2, status: 'available', sessionId: null, waiterId: null },
            { id: 't10', name: 'Table 10', section: 'VIP Room', capacity: 8, status: 'available', sessionId: null, waiterId: null },
            { id: 't11', name: 'Table 11', section: 'VIP Room', capacity: 10, status: 'available', sessionId: null, waiterId: null },
            { id: 't12', name: 'Table 12', section: 'Bar', capacity: 2, status: 'available', sessionId: null, waiterId: null },
        ],

        sessions: [],
        orders: [],
        bills: [],
        auditLog: [],
    };
}
