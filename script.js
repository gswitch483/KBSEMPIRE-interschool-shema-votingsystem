let verifiedPhone = null;

const API_BASE = "https://us-central1-eventvotingapp-4cb94-2a6c9.cloudfunctions.net/api"; // Replace with your deployed Firebase Function URL

// Send OTP
document.getElementById("sendCodeBtn").onclick = async () => {
  const phone = document.getElementById("voterPhone").value.trim();
  if (!phone) return alert("Please enter your phone number.");

  try {
    const res = await fetch(`${API_BASE}/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();

    if (data.success) {
      if (data.alreadyVerified) {
        verifiedPhone = phone;
        alert("Phone already verified!");
        document.getElementById("otpSection").classList.add("hidden");
      } else {
        alert("OTP sent! Please check your phone.");
        document.getElementById("otpSection").classList.remove("hidden");
      }
    } else {
      alert("Failed to send OTP: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    alert("Error sending OTP: " + err.message);
  }
};

// Verify OTP
document.getElementById("verifyBtn").onclick = async () => {
  const phone = document.getElementById("voterPhone").value.trim();
  const code = document.getElementById("otpInput").value.trim();
  if (!phone || !code) return alert("Please enter both phone and OTP code.");

  try {
    const res = await fetch(`${API_BASE}/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();

    if (data.success) {
      verifiedPhone = phone;
      alert("Phone verified successfully!");
      document.getElementById("otpSection").classList.add("hidden");
    } else {
      alert("Verification failed: " + (data.message || "Invalid code"));
    }
  } catch (err) {
    alert("Error verifying OTP: " + err.message);
  }
};

// Payment method selection UI
document.querySelectorAll(".payment-method").forEach((el) => {
  el.onclick = () => {
    document.querySelectorAll(".payment-method").forEach((e) => e.classList.remove("selected"));
    el.classList.add("selected");
  };
});

// Voting form submission
document.getElementById("votingForm").onsubmit = async (e) => {
  e.preventDefault();

  if (!verifiedPhone) return alert("Please verify your phone first.");

  const name = document.getElementById("voterName").value.trim();
  const category = document.getElementById("category").value;
  const contestantInput = document.querySelector('input[name="contestant"]:checked');
  if (!contestantInput) return alert("Please select a contestant.");
  const contestant = contestantInput.value;

  const paymentEl = document.querySelector(".payment-method.selected");
  if (!paymentEl) return alert("Please select a payment method.");
  const payment = paymentEl.dataset.method;

  try {
    const res = await fetch(`${API_BASE}/submit-vote`, {
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
      document.querySelectorAll(".payment-method").forEach((e) => e.classList.remove("selected"));
    } else {
      alert("Failed to submit vote: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    alert("Error submitting vote: " + err.message);
  }
};
