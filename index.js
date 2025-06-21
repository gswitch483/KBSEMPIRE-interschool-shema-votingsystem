const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const twilio = require("twilio");

// Twilio secrets from Firebase environment config
const accountSid = functions.config().twilio.sid;
const authToken = functions.config().twilio.token;
const verifySid = functions.config().twilio.verify_sid;

const client = twilio(accountSid, authToken);

// Send OTP using Twilio Verify
exports.sendCode = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { phone } = req.body;

    if (!phone || !phone.startsWith("+")) {
      return res.status(400).json({ success: false, message: "Phone must be in international format (+XXX...)." });
    }

    try {
      await client.verify.v2.services(verifySid)
        .verifications
        .create({ to: phone, channel: "sms" });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Twilio sendCode error:", err.message);
      return res.status(500).json({ success: false, message: "Failed to send OTP." });
    }
  });
});

// Verify OTP
exports.verifyCode = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: "Phone and code are required." });
    }

    try {
      const verificationCheck = await client.verify.v2.services(verifySid)
        .verificationChecks
        .create({ to: phone, code });

      if (verificationCheck.status === "approved") {
        return res.status(200).json({ success: true });
      } else {
        return res.status(401).json({ success: false, message: "Invalid code." });
      }
    } catch (err) {
      console.error("Twilio verifyCode error:", err.message);
      return res.status(500).json({ success: false, message: "Failed to verify code." });
    }
  });
});
