// index.js
const express = require("express"); // เรียกใช้งาน Express
const mongoose = require("mongoose"); // เรียกใช้งาน Mongoose สำหรับเชื่อม MongoDB
const cors = require("cors"); // ป้องกันปัญหาเวลาเชื่อมจาก React

const app = express();
app.use(express.json());
app.use(cors());

// 🔌 เชื่อมต่อกับ MongoDB ที่อยู่ในเครื่อง
mongoose.connect("mongodb://localhost:27017/tetrisdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 🧱 สร้างรูปแบบข้อมูลที่เราจะเก็บ เช่น ชื่อกับอีเมล
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});
const User = mongoose.model("User", UserSchema);

// 📤 POST: เพิ่มข้อมูลเข้า database
app.post("/api/users", async (req, res) => {
  const user = new User(req.body); // รับข้อมูลจาก React
  await user.save(); // บันทึกลง MongoDB
  res.json(user); // ส่งกลับ
});

// 📥 GET: ดึงข้อมูลทั้งหมด
app.get("/api/users", async (req, res) => {
  const users = await User.find(); // ค้นหาทั้งหมด
  res.json(users); // ส่งกลับ
});

// ▶️ เริ่มให้ server ทำงานที่ port 5000
app.listen(5000, () => console.log("✅ Server started on http://localhost:5000"));
