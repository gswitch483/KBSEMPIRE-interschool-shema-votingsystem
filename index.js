const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();
const db = admin.database();

const accountSid = "ACc5d16a844574c6278120710388c7f79c";
const authToken = "[AuthToken]";
const verifySid = "VA0b849af60b0ad4bca381373f687ec834";
const client = twilio(accountSid, authToken);

// Send OTP
exports.sendOtp = functions.https.onCall(async ({ phone }) => {
  await client.verify.v2.services(verifySid)
    .verifications.create({ to: phone, channel: "sms" });
  return { success: true };
});

// Verify OTP
exports.verifyOtp = functions.https.onCall(async ({ phone, code }) => {
  const resp = await client.verify.v2.services(verifySid)
    .verificationChecks.create({ to: phone, code });
  if (resp.status === "approved") {
    await db.ref(`verifiedPhones/${phone}`).set({ verified: true, timestamp: Date.now() });
    return { success: true };
  }
  throw new functions.https.HttpsError("invalid-argument", "Invalid code");
});

// Submit vote
exports.submitVote = functions.https.onCall(async (data) => {
  const { phone, name, category, contestant, payment } = data;
  const vr = await db.ref(`verifiedPhones/${phone}`).get();
  if (!vr.exists()) throw new functions.https.HttpsError("failed-precondition", "Phone not verified");

  const voteRef = db.ref(`votes/${category}/${encodeURIComponent(phone)}`);
  const existing = await voteRef.get();
  if (existing.exists()) throw new functions.https.HttpsError("already-exists", "Already voted in this category");

  await voteRef.set({ name, contestant, payment, timestamp: Date.now() });
  await db.ref(`verifiedPhones/${phone}`).remove();

  return { success: true };
});
app.post('/submit-vote', async (req, res) => {
  const { phone, name, category, contestant, payment } = req.body;

  // Optional: Save vote to a database or send confirmation SMS
  console.log('New vote received:', { phone, name, category, contestant, payment });

  try {
    // You can also send a confirmation SMS
    await client.messages.create({
      body: `Hi ${name}, your vote for ${contestant} in the ${category} category was received!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.json({ success: true, message: "Vote submitted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
document.getElementById("votingForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!verifiedPhone) return alert("Please verify your phone first.");

  const name = document.getElementById("voterName").value.trim();
  const category = document.getElementById("category").value;
  const contestant = document.querySelector('input[name="contestant"]:checked').value;
  const paymentEl = document.querySelector(".payment-method.selected");
  const payment = paymentEl ? paymentEl.dataset.method : null;

  if (!payment) return alert("Please select a payment method.");

  try {
    const res = await fetch("http://localhost:3000/submit-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: verifiedPhone, name, category, contestant, payment }),
    });

    const data = await res.json();
    if (data.success) {
      alert("🎉 Vote submitted successfully!");
      document.getElementById("votingForm").reset();
      verifiedPhone = null;
      document.getElementById("otpSection").classList.add("hidden");
    } else {
      alert("Failed to submit vote: " + data.message);
    }
  } catch (err) {
    alert("Error submitting vote: " + err.message);
  }
};
document.querySelectorAll(".payment-method").forEach(el => {
  el.onclick = () => {
    document.querySelectorAll(".payment-method").forEach(e => e.classList.remove("selected"));
    el.classList.add("selected");
  };
});
