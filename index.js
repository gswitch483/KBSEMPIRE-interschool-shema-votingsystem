const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.database();

// Load env variables in functions folder (optional if using Firebase config)
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Twilio credentials from env variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// Check if phone is verified
app.post("/check-phone-verified", async (req, res) => {
  const { phone } = req.body;
  try {
    const snapshot = await db.ref(`verifiedPhones/${phone}`).get();
    res.json({ success: true, alreadyVerified: snapshot.exists() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send OTP (only if not verified)
app.post("/send-code", async (req, res) => {
  const { phone } = req.body;
  try {
    const snapshot = await db.ref(`verifiedPhones/${phone}`).get();
    if (snapshot.exists()) {
      return res.json({ success: true, alreadyVerified: true });
    }
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phone, channel: "sms" });
    res.json({ success: true, sid: verification.sid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify OTP
app.post("/verify-code", async (req, res) => {
  const { phone, code } = req.body;
  try {
    const check = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phone, code });
    if (check.status === "approved") {
      await db.ref(`verifiedPhones/${phone}`).set({
        verified: true,
        timestamp: Date.now(),
      });
      return res.json({ success: true });
    }
    res.json({ success: false, message: "Invalid code" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit vote
app.post("/submit-vote", async (req, res) => {
  const { phone, name, category, contestant, payment } = req.body;
  try {
    const verifiedSnapshot = await db.ref(`verifiedPhones/${phone}`).get();
    if (!verifiedSnapshot.exists()) {
      return res
        .status(400)
        .json({ success: false, message: "Phone not verified" });
    }

    const voteRef = db.ref(`votes/${category}/${encodeURIComponent(phone)}`);
    const existingVote = await voteRef.get();
    if (existingVote.exists()) {
      return res
        .status(400)
        .json({ success: false, message: "Already voted in this category" });
    }

    await voteRef.set({ name, contestant, payment, timestamp: Date.now() });

    // Optional: send confirmation SMS
    await client.messages.create({
      body: `Hi ${name}, your vote for ${contestant} in the ${category} category was received!`,
      from: twilioPhoneNumber,
      to: phone,
    });

    res.json({ success: true, message: "Vote submitted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
