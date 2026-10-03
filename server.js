const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Stripe = require("stripe");

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const catalogPath = path.join(dataDir, "catalog.json");
const usersPath = path.join(dataDir, "users.json");
const ordersPath = path.join(dataDir, "orders.json");
const progressPath = path.join(dataDir, "progress.json");
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(catalogPath)) {
    const catalog = {
      products: [
        {
          tag: "CV",
          title: "Executive Resume Kit",
          description: "A polished resume package for professionals, recruiters, and career switchers.",
          image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
          price: 10,
          editable: true,
          fileName: "executive-resume-kit.pdf"
        },
        {
          tag: "Portfolio",
          title: "Minimal Portfolio Pack",
          description: "Elegant portfolio templates for designers, creatives, and developers.",
          image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
          price: 11,
          editable: true,
          fileName: "minimal-portfolio-pack.pdf"
        },
        {
          tag: "Poster",
          title: "Campaign Poster Set",
          description: "High-impact promotional posters for launches, events, and campaigns.",
          image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
          price: 9,
          editable: true,
          fileName: "campaign-poster-set.pdf"
        },
        {
          tag: "Cards",
          title: "Brand Card Bundle",
          description: "Business cards, contact cards, and social-ready brand assets.",
          image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
          price: 11,
          editable: true,
          fileName: "brand-card-bundle.pdf"
        }
      ],
      courses: [
        {
          title: "Graphic Design Fundamentals",
          level: "Beginner",
          lessons: "18 lessons",
          price: 49,
        },
        {
          title: "HTML & CSS for Creatives",
          level: "Intermediate",
          lessons: "22 lessons",
          price: 59,
        },
        {
          title: "Portfolio Building That Sells",
          level: "Advanced",
          lessons: "14 lessons",
          price: 69,
        }
      ]
    };
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  }

  if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, JSON.stringify([], null, 2));
  if (!fs.existsSync(ordersPath)) fs.writeFileSync(ordersPath, JSON.stringify([], null, 2));
  if (!fs.existsSync(progressPath)) fs.writeFileSync(progressPath, JSON.stringify([], null, 2));
}

function readJSON(filePath, fallback) {
  ensureStore();
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJSON(filePath, value) {
  ensureStore();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getCatalog() {
  return readJSON(catalogPath, { products: [], courses: [] });
}

function saveCatalog(data) {
  writeJSON(catalogPath, data);
}

function getUsers() {
  return readJSON(usersPath, []);
}

function saveUsers(users) {
  writeJSON(usersPath, users);
}

function getOrders() {
  return readJSON(ordersPath, []);
}

function saveOrders(orders) {
  writeJSON(ordersPath, orders);
}

function getProgress() {
  return readJSON(progressPath, []);
}

function saveProgress(progress) {
  writeJSON(progressPath, progress);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, stripe: Boolean(stripe) });
});

app.get("/api/products", (req, res) => {
  const catalog = getCatalog();
  res.json(catalog.products || []);
});

app.get("/api/courses", (req, res) => {
  const catalog = getCatalog();
  res.json(catalog.courses || []);
});

app.post("/api/products", (req, res) => {
  const { tag, title, description, image, price, editable, fileData, fileName } = req.body || {};
  if (!tag || !title || !description || !image || price === undefined) {
    return res.status(400).json({ message: "Missing product details." });
  }

  const catalog = getCatalog();
  const product = {
    tag,
    title,
    description,
    image,
    price: Number(price),
    editable: editable === true || editable === "true",
    fileData: fileData || "",
    fileName: fileName || `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`
  };

  catalog.products.push(product);
  saveCatalog(catalog);
  return res.status(201).json({ success: true, product: catalog.products[catalog.products.length - 1] });
});

app.post("/api/courses", (req, res) => {
  const { title, level, lessons, price } = req.body || {};
  if (!title || !level || !lessons || price === undefined) {
    return res.status(400).json({ message: "Missing course details." });
  }

  const catalog = getCatalog();
  catalog.courses.push({ title, level, lessons, price: Number(price) });
  saveCatalog(catalog);
  return res.status(201).json({ success: true, course: catalog.courses[catalog.courses.length - 1] });
});

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing user details." });
  }

  const users = getUsers();
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: "User already exists." });
  }

  const user = {
    id: Date.now().toString(),
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    purchases: []
  };

  users.push(user);
  saveUsers(users);
  return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Missing login details." });
  }

  const users = getUsers();
  const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.get("/api/account", (req, res) => {
  const { email } = req.query || {};
  if (!email) return res.status(400).json({ message: "Email required." });

  const users = getUsers();
  const user = users.find((entry) => entry.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(404).json({ message: "User not found." });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    purchases: user.purchases || []
  });
});

app.get("/api/orders", (req, res) => {
  const { email } = req.query || {};
  const orders = getOrders();
  if (!email) return res.json(orders);
  return res.json(orders.filter((order) => order.email.toLowerCase() === String(email).toLowerCase()));
});

app.post("/api/checkout", async (req, res) => {
  const { name, email, items, paymentMethod, amount } = req.body || {};

  if (!name || !email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing checkout details." });
  }

  const total = Number(amount || items.reduce((sum, item) => sum + Number(item.price || 0), 0));
  const order = {
    id: Date.now().toString(),
    name,
    email: email.toLowerCase(),
    items,
    paymentMethod: paymentMethod || "Stripe",
    total,
    status: "paid",
    createdAt: new Date().toISOString()
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);

  const users = getUsers();
  const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (user) {
    user.purchases = user.purchases || [];
    user.purchases.unshift({
      orderId: order.id,
      total,
      items: items.map((item) => item.title || item.name || "Product"),
      createdAt: order.createdAt
    });
    saveUsers(users);
  }

  if (stripe && paymentMethod === "Stripe") {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map((item) => ({
          price_data: {
            currency: "usd",
            unit_amount: Math.round(Number(item.price || 0) * 100),
            product_data: {
              name: item.title || item.name || "Craftkit digital product"
            }
          },
          quantity: 1
        })),
        mode: "payment",
        success_url: "http://localhost:3000/dashboard.html",
        cancel_url: "http://localhost:3000/"
      });

      return res.json({ success: true, receipt: order, checkoutUrl: session.url });
    } catch (error) {
      console.warn("Stripe not configured or checkout failed", error);
    }
  }

  return res.json({ success: true, receipt: order });
});

app.get("/api/progress", (req, res) => {
  const { email } = req.query || {};
  const progress = getProgress();
  if (!email) return res.json(progress);
  return res.json(progress.filter((entry) => entry.email.toLowerCase() === String(email).toLowerCase()));
});

app.post("/api/progress", (req, res) => {
  const { email, course, progressValue } = req.body || {};
  if (!email || !course || progressValue === undefined) {
    return res.status(400).json({ message: "Missing progress details." });
  }

  const progress = getProgress();
  const existing = progress.find((entry) => entry.email.toLowerCase() === String(email).toLowerCase() && entry.course === course);

  if (existing) {
    existing.progressValue = Number(progressValue);
    existing.updatedAt = new Date().toISOString();
  } else {
    progress.push({
      email: String(email).toLowerCase(),
      course,
      progressValue: Number(progressValue),
      updatedAt: new Date().toISOString()
    });
  }

  saveProgress(progress);
  return res.json({ success: true, progress: progress.find((entry) => entry.email.toLowerCase() === String(email).toLowerCase() && entry.course === course) });
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

ensureStore();
app.listen(port, () => {
  console.log(`CRAFTKIT Studio server running on http://localhost:${port}`);
});
