let verifiedPhone = null;

document.getElementById("sendCodeBtn").onclick = async () => {
  const phone = document.getElementById("voterPhone").value.trim();

  try {
    const res = await fetch("http://localhost:3000/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("otpSection").classList.remove("hidden");
      alert("OTP sent to your phone.");
    } else {
      alert("Failed to send OTP: " + data.message);
    }
  } catch (err) {
    alert("Error sending OTP: " + err.message);
  }
};

document.getElementById("verifyBtn").onclick = async () => {
  const phone = document.getElementById("voterPhone").value.trim();
  const code = document.getElementById("otpInput").value.trim();

  try {
    const res = await fetch("http://localhost:3000/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });

    const data = await res.json();
    if (data.success) {
      verifiedPhone = phone;
      alert("✅ Phone verified! You can vote now.");
    } else {
      alert("❌ Verification failed: Incorrect OTP.");
    }
  } catch (err) {
    alert("Error verifying OTP: " + err.message);
  }
};

document.getElementById("votingForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!verifiedPhone) return alert("Please verify your phone first.");

  const name = document.getElementById("voterName").value.trim();
  const category = document.getElementById("category").value;
  const contestant =
