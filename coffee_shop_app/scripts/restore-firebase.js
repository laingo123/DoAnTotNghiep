// Script khôi phục toàn bộ dữ liệu Firebase
// Chạy bằng: npx tsx scripts/restore-firebase.ts
// Hoặc copy nội dung JSON bên dưới vào Firebase Console → Import JSON

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAforj9HuMuBgP5mrpMcKoGJDShOftCewc",
  authDomain: "coffeeshop-app-b691e.firebaseapp.com",
  databaseURL: "https://coffeeshop-app-b691e-default-rtdb.firebaseio.com",
  projectId: "coffeeshop-app-b691e",
  storageBucket: "coffeeshop-app-b691e.firebasestorage.app",
  messagingSenderId: "501938539871",
  appId: "1:501938539871:web:2140b376600c1656327aea",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== TOÀN BỘ DỮ LIỆU CẦN KHÔI PHỤC =====
const fullData = {
  "products": {
    "product_01": {
      "name": "Cappuccino",
      "category": "Coffee",
      "description": "A rich and creamy cappuccino made with freshly brewed espresso, steamed milk, and a frothy milk cap. This delightful drink offers a perfect balance of bold coffee flavor and smooth milk, making it an ideal companion for relaxing mornings or lively conversations.",
      "price": 4.50,
      "rating": 4.7,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Cappuccino_at_Sightglass_Coffee.jpg"
    },
    "product_02": {
      "name": "Latte",
      "category": "Coffee",
      "description": "Smooth and creamy, our latte combines rich espresso with velvety steamed milk, creating a perfect balance of flavor and texture. Enjoy it as a comforting treat any time of day.",
      "price": 4.75,
      "rating": 4.8,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Latte_art.jpg"
    },
    "product_03": {
      "name": "Espresso shot",
      "category": "Coffee",
      "description": "A bold shot of rich espresso, crafted from the finest beans to deliver a robust flavor in every sip. Perfect for a quick pick-me-up.",
      "price": 2.00,
      "rating": 4.9,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Tazzina_di_caff%C3%A8_a_Ventimiglia.jpg"
    },
    "product_04": {
      "name": "Dark chocolate",
      "category": "Drinking Chocolate",
      "description": "Rich and indulgent, our dark chocolate drinking chocolate is made with premium cocoa. Perfect for a cozy treat on a chilly day.",
      "price": 5.00,
      "rating": 4.7,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/2/2d/Chocolat_chaud.jpg"
    },
    "product_05": {
      "name": "Jumbo Savory Scone",
      "category": "Bakery",
      "description": "Deliciously flaky and buttery, this jumbo savory scone is filled with herbs and cheese, creating a mouthwatering experience.",
      "price": 3.25,
      "rating": 4.3,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Scone_-_finger_lakes.jpg"
    },
    "product_06": {
      "name": "Chocolate Chip Biscotti",
      "category": "Bakery",
      "description": "Crunchy and delightful, this chocolate chip biscotti is perfect for dipping in your coffee or enjoying on its own.",
      "price": 2.50,
      "rating": 4.6,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Biscotti_-_Kohala_Coast.jpg"
    },
    "product_07": {
      "name": "Chocolate Croissant",
      "category": "Bakery",
      "description": "Flaky and buttery, our chocolate croissant is filled with rich chocolate, making it a delightful pastry for any time.",
      "price": 3.75,
      "rating": 4.8,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Pain_au_chocolat_Luc_Viatour.jpg"
    },
    "product_08": {
      "name": "Cranberry Scone",
      "category": "Bakery",
      "description": "This delightful cranberry scone combines sweet and tart flavors, making it perfect for a breakfast treat or afternoon snack.",
      "price": 3.50,
      "rating": 4.5,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Cranberry_scone.jpg"
    },
    "product_09": {
      "name": "Croissant",
      "category": "Bakery",
      "description": "Our classic croissant is flaky and buttery, offering a delightful crunch with each bite.",
      "price": 3.25,
      "rating": 4.7,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/2/28/Croissant%2C_August_2010.jpg"
    },
    "product_10": {
      "name": "Almond Croissant",
      "category": "Bakery",
      "description": "A delightful twist on the classic croissant, filled with almond cream and topped with slivered almonds for added crunch.",
      "price": 4.00,
      "rating": 4.8,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Pain_au_chocolat_Luc_Viatour.jpg"
    },
    "product_11": {
      "name": "Hazelnut Biscotti",
      "category": "Bakery",
      "description": "These delicious hazelnut biscotti are perfect for a crunchy treat alongside your coffee.",
      "price": 2.75,
      "rating": 4.4,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Biscotti_-_Kohala_Coast.jpg"
    },
    "product_12": {
      "name": "Ginger Biscotti",
      "category": "Bakery",
      "description": "These spicy ginger biscotti are perfect for dipping and provide a delightful crunch with every bite.",
      "price": 2.50,
      "rating": 4.7,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Biscotti_-_Kohala_Coast.jpg"
    },
    "product_13": {
      "name": "Oatmeal Scone",
      "category": "Bakery",
      "description": "Nutty and wholesome, our oatmeal scone is a perfect snack for any time. Made with rolled oats and a hint of sweetness.",
      "price": 3.25,
      "rating": 4.3,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Scone_-_finger_lakes.jpg"
    },
    "product_14": {
      "name": "Ginger Scone",
      "category": "Bakery",
      "description": "Soft and fragrant, our ginger scone is perfect for a morning treat, infused with the warm spice of ginger.",
      "price": 3.50,
      "rating": 4.5,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Scone_-_finger_lakes.jpg"
    },
    "product_15": {
      "name": "Chocolate syrup",
      "category": "Flavours",
      "description": "Our rich chocolate syrup is perfect for drizzling over desserts or adding to your favorite beverages.",
      "price": 1.50,
      "rating": 4.8,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/09/Chocolate_syrup.jpg"
    },
    "product_16": {
      "name": "Hazelnut syrup",
      "category": "Flavours",
      "description": "Add a nutty flavor to your drinks with our hazelnut syrup, perfect for lattes and desserts.",
      "price": 1.50,
      "rating": 4.7,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/7/78/Torani_syrup_bottles.jpg"
    },
    "product_17": {
      "name": "Carmel syrup",
      "category": "Flavours",
      "description": "Sweet and creamy, our caramel syrup is ideal for topping your drinks and desserts with a rich caramel flavor.",
      "price": 1.50,
      "rating": 4.9,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/7/78/Torani_syrup_bottles.jpg"
    },
    "product_18": {
      "name": "Sugar Free Vanilla syrup",
      "category": "Flavours",
      "description": "Enjoy the sweet flavor of vanilla without the sugar, making it perfect for your coffee or dessert.",
      "price": 1.50,
      "rating": 4.4,
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/7/78/Torani_syrup_bottles.jpg"
    }
  },
  "users": {
    "admin_001": {
      "name": "Admin",
      "email": "admin@coffee.com",
      "password": "admin123",
      "role": "admin"
    }
  }
};

async function restore() {
  try {
    const rootRef = ref(db);
    await set(rootRef, fullData);
    console.log('✅ Khôi phục dữ liệu thành công!');
    console.log('   - 18 sản phẩm trong "products"');
    console.log('   - 1 tài khoản admin trong "users"');
    console.log('   Email admin: admin@coffee.com / Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

restore();
