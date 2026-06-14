// Script tạo tài khoản admin trong Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, get } = require('firebase/database');

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

async function createAdmin() {
  const usersRef = ref(db, 'users');
  
  // Kiểm tra xem admin đã tồn tại chưa
  const snapshot = await get(usersRef);
  const data = snapshot.val();
  
  if (data) {
    for (const key in data) {
      if (data[key].email === 'admin@coffee.com') {
        console.log('❌ Tài khoản admin đã tồn tại rồi!');
        console.log('   Email: admin@coffee.com');
        console.log('   Password: admin123');
        process.exit(0);
      }
    }
  }

  // Tạo tài khoản admin
  const adminData = {
    name: "Admin",
    email: "admin@coffee.com",
    password: "admin123",
    role: "admin",
    phone: "+84000000000",
    gender: "Male",
    birthday: "01 Jan 2000",
    location: "Da Nang",
  };

  await push(usersRef, adminData);
  console.log('✅ Tạo tài khoản admin thành công!');
  console.log('   Email: admin@coffee.com');
  console.log('   Password: admin123');
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
