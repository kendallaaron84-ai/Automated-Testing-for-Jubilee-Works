// assets/jubilee-core.js - Scalable Multi-Row Tenant Carousel Engine with WebOTP Handshake

function bootJubileeMatrix() {
  const rootContainer = document.getElementById("jubilee-catalog-root");
  if (!rootContainer) return;
  const authorSlug = rootContainer.getAttribute("data-author") || "global";
  const productType = rootContainer.getAttribute("data-type");
  renderAuthorLibrary(authorSlug, productType);
}

// NEW FUNCTION: Unlocks the door automatically if they already verified
function kobaCheckVaultState() {
  const urlParams = new URLSearchParams(window.location.search);
  const assetKey = urlParams.get('asset');
  
  if (assetKey && localStorage.getItem(`koba_vault_unlocked_${assetKey}`) === "true") {
    const vaultDoor = document.getElementById("koba-vault-door");
    const playerWrapper = document.getElementById("bloom-player-wrapper");
    if (vaultDoor) vaultDoor.style.display = "none";
    if (playerWrapper) playerWrapper.style.display = "block";
    
    // 🚀 IGNITION: Fire your actual Bloom Player script!
    if (typeof window.bootKobaPlayer === "function") {
        window.bootKobaPlayer();
    }
  }
}

async function renderAuthorLibrary(authorSlug, productType) {
  const container = document.getElementById("jubilee-catalog-root");
  if (!container) return;

  // 👈 NEW: Safety check to prevent fatal JS crashes on non-library pages
  if (typeof JubileeConfig === "undefined") {
    console.warn("JubileeConfig safely bypassed on non-library page.");
    return; 
  }

  try {
    // Safely parse existing URL and append new parameters without breaking the chain
    const targetUrl = new URL(JubileeConfig.apiUrl);
    targetUrl.searchParams.set("author", authorSlug);
    if (productType) {
      targetUrl.searchParams.set("type", productType);
    }

    const response = await fetch(targetUrl.toString());
    const result = await response.json();

    if (!result.success || !result.products || !result.products.length) {
      container.innerHTML = "<p style='color:#a3a3a3; text-align:center; padding:40px; font-family:system-ui,sans-serif;'>No active items found in this catalog space.</p>";
      return;
    }

    container.innerHTML = ""; // Clear out native skeletons or fallback messages

    // 📦 STEP 1: Dynamic Multi-Genre Grouping Logic
    const shelves = {};
    result.products.forEach(product => {
      const sections = product.sections && product.sections.length ? product.sections : ["Featured Publications"];
      sections.forEach(section => {
        if (!shelves[section]) shelves[section] = [];
        shelves[section].push(product);
      });
    });

    // 📦 STEP 2: Loop Through Shelves and Build Segmented Carousel Grids
    for (const [sectionHeader, products] of Object.entries(shelves)) {
      const sectionBlock = document.createElement("div");
      sectionBlock.style.marginBottom = "40px";
      sectionBlock.style.width = "100%";
      
      sectionBlock.innerHTML = `
        <h2 style="color:#fff; font-family:system-ui, sans-serif; font-size:1.5rem; margin:0 0 15px 0; border-left:4px solid #f97316; padding-left:12px; font-weight:700;">${sectionHeader}</h2>
        <div style="display:flex; gap:20px; overflow-x:auto; padding-bottom:15px; scrollbar-width: none; -ms-overflow-style: none;">
          ${products.map(item => {
            const actionButtonColor = item.accentColor || "#f97316";
            
            // Local storage device bypass check paired with server entitlement array
            const isOwned = (result.entitlements && result.entitlements.includes(item.assetKey)) || 
                            (localStorage.getItem(`koba_vault_unlocked_${item.assetKey}`) === "true");

            return `
              <div class="koba-card-container" style="min-width:240px; width:240px; height:380px; perspective: 1000px; font-family:system-ui, sans-serif;">
                <div class="koba-card-inner" style="position: relative; width:100%; height:100%; text-align:center; transition: transform 0.6s; transform-style: preserve-3d; cursor:pointer;" onclick="this.classList.toggle('flipped')">
                  
                  <div class="koba-card-front" style="position: absolute; width:100%; height:100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; background:#161b22; border: 1px solid #30363d; border-radius:8px; padding:15px; display:flex; flex-direction:column; justify-content:space-between; box-sizing: border-box;">
                    <div style="width:100%; height:210px; background:#0a0a0a; border-radius:6px; overflow:hidden; position:relative;">
                      <img src="${item.coverUrl || item.coverArtUrl || item.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}" style="width:100%; height:100%; object-fit:cover;" alt="${item.title}" />
                    </div>
                    <div style="text-align:left; margin-top:8px;">
                      <h4 style="color:#fff; font-size:1.05rem; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.title}">${item.title}</h4>
                      <p style="color:#a3a3a3; font-size:0.85rem; margin:4px 0 0 0;">$${parseFloat(item.price || 0).toFixed(2)}</p>
                    </div>
                    
                    ${isOwned ? `
                      <a href="/koba_publication/${item.assetKey}/" 
                         onclick="event.stopPropagation();"
                         style="display:block; text-align:center; width:100%; padding:12px; border:none; border-radius:6px; background:#10b981; color:#fff; font-weight:bold; text-decoration:none; box-sizing:border-box; font-size:0.95rem;">
                        🎉 ${item.type === "E-Book" ? "Read Now" : "Listen Now"}
                      </a>
                    ` : `
                      <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
                        <button id="btn-${item.assetKey}" onclick="event.stopPropagation(); triggerCheckout('${item.assetKey}', '${item.title}', '${item.price}', '${item.type}', '${item.stripeConnectId || ''}')" 
                                style="width:100%; padding:12px; border:none; border-radius:6px; background:${actionButtonColor}; color:${actionButtonColor === '#fff' ? '#000' : '#fff'}; font-weight:bold; cursor:pointer; font-family:system-ui, sans-serif; transition:all 0.2s; font-size:0.95rem;">
                          Buy Now
                        </button>
                        <p onclick="event.stopPropagation(); openSMSVerificationModal('${item.assetKey}')" 
                           style="color:#a3a3a3; font-size:0.8rem; font-style:italic; text-align:center; margin:4px 0 0 0; cursor:pointer; text-decoration:underline; transition:color 0.2s;"
                           onmouseover="this.style.color='#f97316'" onmouseout="this.style.color='#a3a3a3'">
                          Already purchased? Verify your mobile number
                        </p>
                      </div>
                    `}
                  </div>

                  <div class="koba-card-back" style="position: absolute; width:100%; height:100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; background:#0d1117; border: 1px solid #30363d; border-radius:8px; padding:15px; transform: rotateY(180deg); display:flex; flex-direction:column; justify-content:space-between; text-align:left; box-sizing: border-box;">
                    <div style="display:flex; flex-direction:column; height:90%;">
                      <h5 style="color:#fff; margin:0 0 8px 0; font-size:1rem; border-bottom:1px solid #30363d; padding-bottom:4px; font-weight:600;">Synopsis</h5>
                      <div style="color:#c9d1d9; font-size:0.85rem; line-height:1.5; margin:0; overflow-y:auto; flex-grow:1; padding-right:4px;">
                        ${item.synopsis || 'No alternative synopsis specified for this active volume.'}
                      </div>
                    </div>
                    <span style="font-size:0.75rem; color:#8b949e; text-align:center; display:block; width:100%; margin-top:5px;">Click to view front frame</span>
                  </div>

                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      container.appendChild(sectionBlock);
    }

    if (!document.getElementById("koba-matrix-core-styles")) {
      const styleElement = document.createElement("style");
      styleElement.id = "koba-matrix-core-styles";
      styleElement.innerHTML = `
        .koba-card-inner.flipped { transform: rotateY(180deg); }
        div::-webkit-scrollbar { display: none; }
      `;
      document.head.appendChild(styleElement);
    }

  } catch (err) {
    console.error("❌ Critical Matrix Render Exception Intercepted:", err);
    container.innerHTML = "<p style='color:#ef4444; text-align:center; padding:20px;'>Unable to load secure digital catalog.</p>";
  }
}

async function triggerCheckout(assetId, title, price, productType, stripeConnectId) {
  try {
    const btn = document.getElementById(`btn-${assetId}`);
    if (!btn) return;
    
    const originalText = btn.innerText;
    btn.innerText = "Connecting to Secure Checkout...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    const payload = {
      assetId,
      title,
      price: price.toString(),
      product_type: productType,
      stripeConnectId: stripeConnectId || "",
      origin_domain: window.location.host
    };

    const response = await fetch(JubileeConfig.checkoutUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const sessionResult = await response.json();

    if (sessionResult.success) {
      if (sessionResult.isFreeUnlock) {
        alert("🎁 Your free item has been unlocked! Access is granted.");
        window.location.reload();
      } else if (sessionResult.url) {
        window.location.href = sessionResult.url;
      }
    } else {
      alert("Checkout sequence error: " + sessionResult.error);
      btn.innerText = originalText;
      btn.style.opacity = "1";
      btn.disabled = false;
    }
  } catch (err) {
    console.error("❌ Checkout routing initialization error:", err);
    alert("Unable to reach the payment gateway. Please try again.");
    const fallbackBtn = document.getElementById(`btn-${assetId}`);
    if (fallbackBtn) {
      fallbackBtn.innerText = "Buy Now";
      fallbackBtn.disabled = false;
      fallbackBtn.style.opacity = "1";
    }
  }
}

function openSMSVerificationModal(assetKey) {
  const oldModal = document.getElementById("koba-sms-modal-root");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "koba-sms-modal-root";
  modal.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); z-index:999999; display:flex; align-items:center; justify-content:center; font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif; backdrop-filter: blur(8px);";
  
  modal.innerHTML = `
    <div style="background:#ffffff; border:1px solid #e2e8f0; padding:35px; border-radius:16px; width:90%; max-width:420px; box-sizing:border-box; color:#1e293b; position:relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
      <span onclick="document.getElementById('koba-sms-modal-root').remove()" style="position:absolute; top:15px; right:20px; color:#94a3b8; cursor:pointer; font-size:1.5rem; font-weight:400; transition:color 0.2s;" onmouseover="this.style.color='#1e293b'" onmouseout="this.style.color='#94a3b8'">&times;</span>
      
      <h3 style="margin:0 0 10px 0; font-size:1.4rem; color:#1d4ed8; font-weight:700; letter-spacing:-0.025em;">🔒 Access Your Audiobook Vault</h3>
      <p style="margin:0 0 24px 0; font-size:0.9rem; color:#64748b; line-height:1.6;">Enter the mobile number used during checkout. We will text a 6-digit code to instantly unlock your tracks.</p>
      
      <div id="sms-step-1">
        <label style="display:block; font-size:0.8rem; font-weight:600; color:#475569; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Mobile Number</label>
        <input type="tel" id="koba-verify-phone" placeholder="(210) 555-1234" autocomplete="tel"
               style="width:100%; padding:14px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; color:#0f172a; font-size:1.05rem; margin-bottom:20px; box-sizing:border-box; transition:all 0.2s; outline:none;"
               onfocus="this.style.border='1px solid #2563eb'; this.style.background='#ffffff';">
        <button onclick="window.submitSmsRequest('${assetKey}')" id="btn-sms-send"
                style="width:100%; padding:14px; background:#2563eb; border:none; border-radius:8px; color:#ffffff; font-weight:600; font-size:1rem; cursor:pointer; transition:background 0.2s; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2);"
                onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
          Send Verification Code
        </button>
      </div>

      <div id="sms-step-2" style="display:none;">
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; margin-bottom:20px;">
          <p style="font-size:0.85rem; color:#166534; margin:0; font-weight:500; line-height:1.4;">✔ Code sent! Tap the code appearing right above your keyboard layout.</p>
        </div>
        <label style="display:block; font-size:0.8rem; font-weight:600; color:#475569; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em; text-align:center;">Enter 6-Digit Security PIN</label>
        <input type="text" id="koba-verify-pin" placeholder="000000" 
              inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code"
              style="width:100%; padding:14px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; color:#0f172a; font-size:1.6rem; text-align:center; letter-spacing:6px; margin-bottom:20px; box-sizing:border-box; font-weight:700; outline:none;"
              onfocus="this.style.border='1px solid #2563eb'; this.style.background='#ffffff';">
        <button onclick="window.submitPinVerify('${assetKey}')" id="btn-pin-verify"
                style="width:100%; padding:14px; background:#16a34a; border:none; border-radius:8px; color:#ffffff; font-weight:600; font-size:1rem; cursor:pointer; transition:background 0.2s; box-shadow: 0 4px 6px -1px rgba(22,163,74,0.2);"
                onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
          Unlock Vault Now
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// REQUEST TWILIO VIA NEXT.JS HANDSHAKE
window.submitSmsRequest = async function(assetKey) {
  const phoneInput = document.getElementById("koba-verify-phone");
  const sendBtn = document.getElementById("btn-sms-send");
  if (!phoneInput || !phoneInput.value.trim()) return alert("Please specify a valid phone number format.");

  sendBtn.innerText = "Checking Vault Registry...";
  sendBtn.disabled = true;

  try {
    const res = await fetch("http://localhost:3000/api/auth/sms-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        phoneNumber: phoneInput.value.trim(),
        assetKey: assetKey // 👈 THIS IS THE MATCHING LINK TO ALIGN FIRESTORE
      })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById("sms-step-1").style.display = "none";
      document.getElementById("sms-step-2").style.display = "block";
      
      if ('OTPCredential' in window) {
        navigator.credentials.get({ otp: { transport: ['sms'] } })
          .then(otp => {
            document.getElementById("koba-verify-pin").value = otp.code;
            submitPinVerify(assetKey);
          }).catch(err => console.log("WebOTP capture skipped safely."));
      }
    } else {
      alert(data.error || "Registry error tracking asset ownership.");
      sendBtn.innerText = "Send Verification Code";
      sendBtn.disabled = false;
    }
  } catch (err) {
    alert("Connection to the authentication gateway broke.");
    sendBtn.disabled = false;
  }
}

// 2. Inside submitPinVerify() validation length gate:
window.submitPinVerify = async function(assetKey) {
  const pinInput = document.getElementById("koba-verify-pin");
  const phoneInput = document.getElementById("koba-verify-phone");
  const verifyBtn = document.getElementById("btn-pin-verify");

  if (!pinInput || pinInput.value.trim().length < 6) return alert("Please present a complete 6-digit token layout.");

  verifyBtn.innerText = "Unlocking Secure Tracks...";
  verifyBtn.disabled = true;

  try {
    const res = await fetch("http://localhost:3000/api/auth/sms-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phoneInput.value.trim(), code: pinInput.value.trim() })
    });
    const data = await res.json();

    // Inside submitPinVerify()
    if (data.success) {
      localStorage.setItem(`koba_vault_unlocked_${assetKey}`, "true");
      
      // 1. Destroy the Modal
      const modal = document.getElementById("koba-sms-modal-root");
      if (modal) modal.remove();

      // 2. Instantly slide away the vault door without reloading the page!
      const vaultDoor = document.getElementById("koba-vault-door");
      const player = document.getElementById("bloom-player-root");
      if (vaultDoor) vaultDoor.style.display = "none";
      if (player) player.style.display = "block";

      alert("🎉 Security Access Granted! Your device signature has been mapped.");
      
    } else {
      alert(data.error || "Token validation mismatch.");
      verifyBtn.innerText = "Unlock Vault Now";
      verifyBtn.disabled = false;
    }
  } catch (err) {
    alert("Verification transaction failure.");
    verifyBtn.disabled = false;
  }
  // 🚀 IGNITION: Fire your actual Bloom Player script!
    if (typeof window.bootKobaPlayer === "function") {
        window.bootKobaPlayer();
    }
  }
// NEW INITIALIZER: Guarantees execution regardless of server rendering speed
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        bootJubileeMatrix();
        kobaCheckVaultState();
    });
} else {
    // DOM is already active! Boot the application pipelines right now
    bootJubileeMatrix();
    kobaCheckVaultState();
}