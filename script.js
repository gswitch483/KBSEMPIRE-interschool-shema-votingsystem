
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
let verifiedPhone = null;

document.getElementById("sendCodeBtn").onclick = async () => {
  const phone = document.getElementById("voterPhone").value.trim();
  await httpsCallable(functions, "sendOtp")({ phone });
  document.getElementById("otpSection").classList.remove("hidden");
};

document.getElementById("verifyBtn").onclick = async () => {
  const phone = document.getElementById("voterPhone").value.trim();
  const code = document.getElementById("otpInput").value.trim();
  await httpsCallable(functions, "verifyOtp")({ phone, code });
  verifiedPhone = phone;
  alert("Phone verified! You can vote.");
};

document.getElementById("votingForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!verifiedPhone) return alert("Please verify phone first.");
  const name = document.getElementById("voterName").value.trim();
  const category = document.getElementById("category").value;
  const contestant = document.querySelector('input[name="contestant"]:checked').value;
  const payment = document.querySelector(".payment-method.selected").dataset.method;
  try {
    await httpsCallable(functions, "submitVote")({ phone: verifiedPhone, name, category, contestant, payment });
    alert("Vote submitted.");
    votingForm.reset();
  } catch (err) {
    alert(err.message);
  }
};
