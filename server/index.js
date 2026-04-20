const express = require("express");
const cors = require("cors");
require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const axios = require("axios");
const mongoose = require("mongoose");
const Plan = require("./models/Plan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
}));

app.use(express.json());

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // max 10 requests per IP per 10 min
  message: { error: "Too many requests, slow down!" }
});

app.use("/plan", aiLimiter);
app.use("/regenerate-day", aiLimiter);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

function cleanJSON(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

async function getImageForDay(destination, activities) {
  try {
    if (!activities.length) {
      return `https://picsum.photos/800/500?random=${Math.random()}`;
    }

    // Try to find a "real place-like" phrase
    const pickBestActivity = (activities) => {
      return activities.find(a =>
        a.split(" ").length >= 3 && // longer = more specific
        !a.toLowerCase().includes("walk") &&
        !a.toLowerCase().includes("explore")
      ) || activities[0];
    };

    const activity = pickBestActivity(activities);

    // Clean (remove filler words)
    const clean = activity
      .replace(/visit|explore|go to|the|to|walk through|discover/gi, "")
      .trim();

    const query = `${destination} ${clean}`;

    console.log("🖼 Image query:", query);

    const imgRes = await axios.get(
      "https://api.unsplash.com/search/photos",
      {
        params: {
          query,
          per_page: 1,
          orientation: "landscape"
        },
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_KEY}`,
        },
        timeout: 5000,
      }
    );

    if (imgRes.data.results?.length) {
      return imgRes.data.results[0].urls.regular;
    }

    return `https://picsum.photos/800/500?random=${Math.random()}`;
  } catch (err) {
    return `https://picsum.photos/800/500?random=${Math.random()}`;
  }
}

{/* GENERATE PLAN */ }
app.post("/plan", async (req, res) => {
  const { destination, days, style, interests } = req.body;

  if (!destination || !days || !style || !interests || !Array.isArray(interests)) {
    return res.status(400).json({ error: "Missing or invalid input" });
  }

  if (days < 1 || days > 10) {
    return res.status(400).json({ error: "Days must be between 1 and 10" });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `
Create a ${days}-day travel plan for ${destination}.

Travel style: ${style}
Interests: ${interests.join(", ")}

Return ONLY JSON in this format:

{
  "days": [
    {
      "day": 1,
      "morning": ["activity1", "activity2", ...],
      "afternoon": ["activity1", "activity2", ...],
      "evening": ["activity1", "activity2", ...]
    }
  ]
}

Rules:
- Each item must be SHORT but informative (max 30 words)
- Use REAL specific places (restaurants, beaches, clubs)
- Make it exciting and unique (not generic)
- Match strongly to interests
- Little to no explanations
- Include famous + hidden gems
- Ensure geographic realism (group nearby places)
`,
        },
      ],
    });

    const rawText = response.content[0].text;
    const text = cleanJSON(rawText);

    console.log("RAW AI OUTPUT:", rawText);

    let plan;

    try {
      plan = JSON.parse(text);
    } catch (e) {
      console.log("JSON parse failed AFTER CLEANING:", text);

      return res.status(500).json({
        plan: null,
        error: "Invalid JSON from AI",
        raw: rawText,
      });
    }

    await Promise.all(
      plan.days.map(async (day) => {
        const activities = [
          ...(day.morning || []),
          ...(day.afternoon || []),
          ...(day.evening || []),
        ];

        day.image = await getImageForDay(destination, activities);
      })
    );

    return res.json({ plan });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      plan: null,
      error: "Server error",
    });
  }
});

{/* SAVE PLAN */ }
app.post("/save-plan", authMiddleware, async (req, res) => {
  try {
    const { destination, days, style, interests } = req.body;

    if (!destination || !days) {
      return res.status(400).json({ error: "Missing data" });
    }

    const newPlan = new Plan({
      destination,
      days,
      style,
      interests,
      userId: req.userId,
    });

    await newPlan.save();

    res.json({ success: true, plan: newPlan });

  } catch (err) {
    console.error(err);
    res.json({ error: "Failed to save plan" });
  }
});

{/* GET PLANS */ }
app.get("/plans", authMiddleware, async (req, res) => {
  try {
    const plans = await Plan.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ plans });
  } catch (err) {
    console.error(err);
    res.json({ error: "Failed to fetch plans" });
  }
});

{/* DELETE PLAN */ }
app.delete("/plans/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await Plan.findOneAndDelete({ _id: id, userId: req.userId });

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

{/* REGENERATE DAY */ }
app.post("/regenerate-day", authMiddleware, async (req, res) => {
  const { destination, style, interests, dayNumber } = req.body;

  if (!destination || !style || !interests || !dayNumber) {
    return res.status(400).json({ error: "Missing or invalid input" });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `
                  Regenerate ONLY Day ${dayNumber} for a travel plan in ${destination}.

                  Travel style: ${style}
                  Interests: ${interests.join(", ")}

                  Return ONLY JSON:

                  {
                    "day": ${dayNumber},
                    "morning": ["activity", "activity"],
                    "afternoon": ["activity", "activity"],
                    "evening": ["activity", "activity"]
                  }

                  Rules:
                  - Each item must be SHORT but informative (max 20 words)
                  - Use REAL specific places (restaurants, beaches, clubs)
                  - Match strongly to interests
                  - Little to no explanations
                  - Include famous + hidden gems
                  - Ensure geographic realism (group nearby places)
        `
        }
      ]
    });
    const rawText = response.content[0].text;
    const text = cleanJSON(rawText);

    let newDay;

    try {
      newDay = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        day: null,
        error: "Invalid JSON from AI"
      });
    }

    const activities = [
      ...(newDay.morning || []),
      ...(newDay.afternoon || []),
      ...(newDay.evening || []),
    ];

    newDay.image = await getImageForDay(destination, activities);

    return res.json({ day: newDay });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      day: null,
      error: "Failed to regenerate day",
    });
  }
});

{/* USER REGISTER */ }
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 6);  // encrypt password

    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Register failed" });
  }
});

{/* USER LOGIN */ }
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }  // user stays logged in for 1 day
    );

    res.json({ token });
  } catch (err) {
    res.json({ error: "Login failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});