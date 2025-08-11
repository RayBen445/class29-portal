const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.SECRET_KEY || "class29_secret";

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static("public"));

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync("users.json", "utf8"));
  } catch {
    return [];
  }
};
const saveUsers = (users) => {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
};

// Registration endpoint
app.post("/api/register", upload.single("image"), async (req, res) => {
  const { fullName, matric, email, password, role } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : "";

  if (!fullName || !matric || !email || !password || !role) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const users = loadUsers();
  const existing = users.find((u) => u.matric === matric);
  if (existing) return res.status(409).json({ message: "User exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { fullName, matric, email, password: hashedPassword, image, role };
  users.push(user);
  saveUsers(users);

  res.status(200).json({ message: "Registration successful", user });
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { matric, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.matric === matric);
  if (!user) return res.status(404).json({ message: "Matric not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Incorrect password" });

  const token = jwt.sign({ matric: user.matric, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ message: "Login successful", token });
});

// Other endpoints as needed...

app.get("/", (req, res) => {
  res.send("Class 29 Portal Backend ✅");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});