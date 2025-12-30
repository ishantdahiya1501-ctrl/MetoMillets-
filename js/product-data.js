// Product Database
const products = [
    {
        id: 15,
        name: "Himalayan Pink Salt",
        category: "dark",
        subcategory: "bestseller",
        price: 299.00,
        description: "A sophisticated 72% dark chocolate bar sprinkled with mineral-rich Himalayan pink salt, creating a perfect balance of sweet and savory.",
        ingredients: ["72% cocoa", "organic honey", "Himalayan pink salt", "sorghum"],
        cocoaPercentage: 72,
        allergens: ["None"],
        origin: "Ghana",
        pairing: ["Blueberry Latte", "Whiskey", "Almonds"],
        rating: 4.9,
        reviews: 152,
        imagesByWeight: {
            '15g': '/images/products/himalayan pink salt 15g.jpg',
            '30g': '/images/products/himalayan pink salt 30g.jpg',
            '150g': '/images/products/himalayan pink salt 150g.jpg'
        },
        image: "/images/products/himalayan pink salt 150g.jpg",
        featured: true,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 16,
        name: "Berry Fusion",
        category: "dark",
        subcategory: "trending",
        price: 349.00,
        description: "A vibrant 65% dark chocolate infused with a medley of freeze-dried raspberries and blueberries for a tangy, fruity burst.",
        ingredients: ["65% cocoa", "dates", "raspberry", "blueberry", "sorghum"],
        cocoaPercentage: 65,
        allergens: ["None"],
        origin: "Ecuador",
        pairing: ["Sparkling Wine", "Green Tea", "Yogurt"],
        rating: 4.8,
        reviews: 98,
        imagesByWeight: {
            '15g': '/images/products/Berryfusion 15g.jpg',
            '30g': '/images/products/Berryfusion 30g.jpg',
            '80g': '/images/products/Berryfusion 80g.jpg',
            '150g': '/images/products/Berryfusion 150g.jpg'
        },
        image: "/images/products/Berryfusion 150g.jpg",
        featured: true,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 17,
        name: "Cranberry Punch",
        category: "dark",
        subcategory: "trending",
        price: 349.00,
        description: "Tangy cranberries and crunchy sorghum crisps embedded in a smooth 70% dark chocolate for a delightful textural experience.",
        ingredients: ["70% cocoa", "honey", "dried cranberry", "sorghum"],
        cocoaPercentage: 70,
        allergens: ["None"],
        origin: "Dominican Republic",
        pairing: ["Pinot Noir", "Herbal Tea", "Walnuts"],
        rating: 4.7,
        reviews: 85,
        imagesByWeight: {
            '15g': '/images/products/cranberry punch 15g.jpg',
            '30g': '/images/products/cranberry punch 30g.jpg',
            '80g': '/images/products/cranberry punch 80g.jpg',
            '150g': '/images/products/cranberry punch 150g.jpg'
        },
        image: "/images/products/cranberry punch 150g.jpg",
        featured: false,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 18,
        name: "Citrus Noir",
        category: "dark",
        subcategory: "bestseller",
        price: 329.00,
        description: "Intense 75% dark chocolate brightened with the zest of candied orange peel, offering a refreshing and aromatic flavor.",
        ingredients: ["75% cocoa", "dates", "candied orange peel", "sorghum"],
        cocoaPercentage: 75,
        allergens: ["None"],
        origin: "Brazil",
        pairing: ["Earl Grey Tea", "White Wine", "Pistachios"],
        rating: 4.8,
        reviews: 112,
        imagesByWeight: {
            '15g': '/images/products/citrus noir 15g.jpg',
            '30g': '/images/products/citrus noir 30g.jpg',
            '80g': '/images/products/citrus noir 80g.jpg',
            '150g': '/images/products/citrus noir 150g.jpg'
        },
        image: "/images/products/citrus noir 150g.jpg",
        featured: true,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 19,
        name: "Island Noir",
        category: "dark",
        price: 379.00,
        description: "An exotic escape in a bar. Rich 68% dark chocolate with toasted coconut flakes for a tropical, nutty crunch.",
        ingredients: ["68% cocoa", "honey", "toasted coconut", "sorghum"],
        cocoaPercentage: 68,
        allergens: ["None"],
        origin: "Madagascar",
        pairing: ["Rum", "Pineapple", "Macadamia Nuts"],
        rating: 4.6,
        reviews: 74,
        imagesByWeight: {
            '15g': '/images/products/island noir 15g.jpg',
            '30g': '/images/products/island noir 30g.jpg',
            '80g': '/images/products/island noir 80g.jpg',
            '150g': '/images/products/island noir 150g.jpg'
        },
        image: "/images/products/island noir 150g.jpg",
        featured: false,
        limited: true,
        temperatureWarning: true
    },
    {
        id: 20,
        name: "Pistashio",
        category: "dark",
        price: 399.00,
        description: "A luxurious 70% dark chocolate generously studded with roasted, lightly salted pistachios for a buttery, rich flavor.",
        ingredients: ["70% cocoa", "dates", "roasted pistachios", "sorghum"],
        cocoaPercentage: 70,
        allergens: ["Nuts"],
        origin: "Colombia",
        pairing: ["Espresso", "Cardamom Tea", "Figs"],
        rating: 4.9,
        reviews: 130,
        imagesByWeight: {
            '15g': '/images/products/pistachio 15g.jpg',
            '30g': '/images/products/pistachio 30g.jpg',
            '80g': '/images/products/pistachio 80g.jpg',
            '150g': '/images/products/pistachio 150g.jpg'
        },
        image: "/images/products/pistachio 150g.jpg",
        featured: true,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 21,
        name: "L'amande",
        category: "dark",
        subcategory: "bestseller",
        price: 389.00,
        description: "Classic and timeless. A 72% dark chocolate bar with perfectly roasted whole almonds for a satisfying crunch.",
        ingredients: ["72% cocoa", "honey", "roasted almonds", "sorghum"],
        cocoaPercentage: 72,
        allergens: ["Nuts"],
        origin: "Ghana",
        pairing: ["Americano Coffee", "Aged Cheddar", "Cherries"],
        rating: 4.8,
        reviews: 180,
        imagesByWeight: {
            '15g': "/images/products/L'amande 15g.jpg",
            '30g': "/images/products/L'amande 30g.jpg",
            '80g': "/images/products/L'amande 80g.jpg",
            '150g': "/images/products/L'amande 150g.jpg"
        },
        image: "/images/products/L'amande 150g.jpg",
        featured: false,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 22,
        name: "Findik",
        category: "dark",
        price: 399.00,
        description: "A rich and nutty delight featuring 65% dark chocolate filled with roasted Turkish hazelnuts for a rich, crunchy texture.",
        ingredients: ["65% cocoa", "dates", "roasted hazelnuts", "sorghum"],
        cocoaPercentage: 65,
        allergens: ["Nuts"],
        origin: "Ecuador",
        pairing: ["Latte", "Pears", "Brandy"],
        rating: 4.7,
        reviews: 105,
        imagesByWeight: {
            '15g': '/images/products/Findik 15g.jpg',
            '30g': '/images/products/Findik 30g.jpg',
            '80g': '/images/products/Findik 80g.jpg',
            '150g': '/images/products/Findik 150g.jpg'
        },
        image: "/images/products/Findik 150g.jpg",
        featured: false,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 23,
        name: "Blueberry",
        category: "dark",
        subcategory: "trending",
        price: 359.00,
        description: "An irresistible 70% dark chocolate with a gooey blueberry center, sweetened with dates.",
        ingredients: ["70% cocoa", "dates", "blueberry", "sorghum"],
        cocoaPercentage: 70,
        allergens: ["None"],
        origin: "Dominican Republic",
        pairing: ["Black Coffee", "Greek Yogurt", "Fresh Berries"],
        rating: 4.9,
        reviews: 210,
        imagesByWeight: {
            '15g': '/images/products/velour blue 15g.jpg',
            '30g': '/images/products/velour blue 30g.jpg',
            '80g': '/images/products/velour blue 80g.jpg',
            '150g': '/images/products/velour blue 150g.jpg'
        },
        image: "/images/products/velour blue 150g.jpg",
        featured: true,
        limited: true,
        temperatureWarning: true
    },
    {
        id: 25,
        name: "90% Dark",
        category: "dark",
        subcategory: "bestseller",
        price: 329.00,
        description: "Ultra-high cocoa dark chocolate with deep, bold notes and a clean finish.",
        ingredients: ["90% cocoa", "sorghum"],
        cocoaPercentage: 90,
        allergens: ["None"],
        origin: "Single Origin",
        pairing: ["Espresso", "Red Wine", "Toasted Nuts"],
        rating: 4.8,
        reviews: 120,
        imagesByWeight: {
            '15g': '/images/products/90%25%20dark%2015g.jpg',
            '30g': '/images/products/90%25%20dark%2030g.jpg',
            '80g': '/images/products/90%25%20dark%2080g.jpg',
            '150g': '/images/products/90%25%20dark%20150g.jpg'
        },
        image: "/images/products/90%25%20dark%20150g.jpg",
        featured: false,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 26,
        name: "70% Dark",
        category: "dark",
        subcategory: "bestseller",
        price: 299.00,
        description: "Balanced 70% dark chocolate with rounded cocoa notes and gentle sweetness.",
        ingredients: ["70% cocoa", "sorghum"],
        cocoaPercentage: 70,
        allergens: ["None"],
        origin: "Single Origin",
        pairing: ["Pour-over Coffee", "Citrus", "Almonds"],
        rating: 4.7,
        reviews: 110,
        imagesByWeight: {
            '15g': '/images/products/70%25%20dark%2015g.jpg',
            '30g': '/images/products/70%25%20dark%2030g.jpg',
            '80g': '/images/products/70%25%20dark%2080g.jpg',
            '150g': '/images/products/70%25%20dark%20150g.jpg'
        },
        image: "/images/products/70%25%20dark%20150g.jpg",
        featured: false,
        limited: false,
        temperatureWarning: true
    },
    {
        id: 27,
        name: "Assorted Mini Box",
        category: "gifts",
        subcategory: "bestseller",
        priceFixed: true,
        price: 899.00,
        description: "A curated assorted mini chocolate box for gifting and sharing. Includes 2 pcs of each type of chocolate.",
        ingredients: ["Assorted mini chocolates"],
        cocoaPercentage: 0,
        allergens: ["May contain nuts"],
        origin: "Assorted",
        pairing: ["Coffee", "Tea", "Dessert Wine"],
        rating: 4.9,
        reviews: 0,
        image: "/images/products/mini%20box%20.jpeg",
        featured: true,
        limited: false,
        temperatureWarning: false
    }
];

// Normalize tiered pricing across the site
const tierPrices = {
    classic: { '15g': 30, '30g': 60, '80g': 160, '150g': 250 },
    flavoured: { '15g': 35, '30g': 75, '80g': 200, '150g': 375 }
};

products.forEach(p => {
    if (p && (p.priceFixed === true || p.category === 'gifts')) {
        p.priceTier = 'fixed';
        p.weightPrices = null;
        return;
    }
    // Only 90% Dark uses the higher flavoured tier; everything else stays on the classic tier
    const tier = p.name === '90% Dark' ? 'flavoured' : 'classic';
    p.priceTier = tier;
    p.weightPrices = tierPrices[tier];
    p.price = tierPrices[tier]['150g']; // display/base price standardized to 150g
});

const categoriesConfig = [
    { id: "dark", name: "Flavoured Dark Chocolates", color: "#3D2C2E" },
    { id: "gifts", name: "Gift Hampers", color: "#D4AF37" },
    { id: "trending", name: "Trending This Week", color: "#FFA500" },
    { id: "bestseller", name: "Best Sellers", color: "#2E8B57" }
];

// Dynamically create the surprise chocolates from the main product list
// to ensure data consistency.
const surpriseChocolateNames = [
    "Himalayan Pink Salt",
    "Berry Fusion",
    "Citrus Noir",
    "Pistashio",
    "Blueberry"
];
const surpriseChocolates = products.filter(p => surpriseChocolateNames.includes(p.name));

const heroSlides = [
    {
        title: "Pure Indulgence, Zero Guilt",
        subtitle: "Experience our 85% dark chocolate with rich cocoa notes.",
        image: "/images/products/90%25%20dark%20150g.jpg",
        buttonText: "Shop 90% Dark",
        buttonLink: "pages/products.html?product=25"
    },
    {
        title: "A Berry-Rich Sensation",
        subtitle: "Discover the vibrant fusion of tangy raspberries and smooth 65% dark chocolate.",
        image: "/images/products/Berryfusion 150g.jpg",
        buttonText: "Explore Berry Fusion",
        buttonLink: "pages/products.html?product=16"
    },
    {
        title: "The Perfect Gift Awaits",
        subtitle: "Curated gift hampers for every occasion, wrapped in luxury and crafted with love.",
        image: "/images/products/himalayan pink salt 150g.jpg",
        buttonText: "Find a Gift",
        buttonLink: "pages/products.html?category=gifts"
    }
];

const flavorProfiles = {
    "cocoa-bomb": {
        title: "Intense Cocoa Bomb",
        description: "For the purist. These chocolates are high in cocoa percentage, offering deep, robust, and slightly bitter notes with a long-lasting finish.",
        products: ["90% Dark", "Himalayan Pink Salt"]
    },
    "dark-berry": {
        title: "Dark & Berry",
        description: "A beautiful marriage of rich dark chocolate and the bright, tangy notes of red and dark berries. Expect a vibrant, fruity acidity.",
        products: ["Berry Fusion", "Cranberry Punch"]
    },
    "nutty-smooth": {
        title: "Nutty & Smooth",
        description: "Rich and satisfying, these bars feature the buttery flavors of roasted nuts perfectly balanced with smooth dark chocolate.",
        products: ["Pistashio", "L'amande", "Findik"]
    },
    "sweet-mellow": {
        title: "Sweet & Mellow",
        description: "Naturally sweet and mellow. These chocolates use dates and honey to create a gentle sweetness with a smooth, melt-in-your-mouth texture.",
        products: ["Island Noir", "Blueberry"]
    },
    "fruity-tangy": {
        title: "Fruity & Tangy",
        description: "An explosion of bright, zesty fruit notes. Perfect for those who love a refreshing and aromatic chocolate experience.",
        products: ["Citrus Noir", "Berry Fusion"]
    },
    "herbal-spice": {
        title: "Earthy & Herbal",
        description: "Complex and aromatic, these chocolates have underlying earthy or spicy notes from unique cocoa origins and ingredients.",
        products: ["Himalayan Pink Salt"]
    }
};

// Function to get category counts
function getCategoryCounts() {
    const counts = {
        all: products.length,
        dark: products.filter(p => p.category === 'dark').length,
        gifts: products.filter(p => p.category === 'gifts').length,
        trending: products.filter(p => p.subcategory === 'trending').length,
        bestseller: products.filter(p => p.subcategory === 'bestseller').length
    };
    return counts;
}

// Build categories with counts
const categories = categoriesConfig.map(cat => ({
    ...cat,
    count: getCategoryCounts()[cat.id]
}));

// Export data
window.productData = {
    products,
    categories,
    categoriesConfig,
    surpriseChocolates,
    getCategoryCounts,
    heroSlides,
    flavorProfiles
};