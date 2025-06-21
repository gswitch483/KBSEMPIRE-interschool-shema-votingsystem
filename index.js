
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
