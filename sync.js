import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.DAILY_SALES_COUNTER_CONFIG || {};
const bridge = window.dailySalesCounterBridge;
const root = document.querySelector(".app-shell");
const mobileNav = document.querySelector(".mobile-nav");
const hasConfig =
  typeof config.supabaseUrl === "string" &&
  /^https:\/\/[^/]+$/.test(config.supabaseUrl) &&
  typeof config.supabaseAnonKey === "string" &&
  config.supabaseAnonKey.length > 20;
const style = document.createElement("style");

style.textContent = `
  #counter-cloud-gate{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:linear-gradient(135deg,#edf3ee,#f8f6ef)}
  #counter-cloud-gate[hidden]{display:none}
  .counter-gate-card{width:min(100%,460px);padding:30px;border:1px solid #e0e8e2;border-radius:22px;background:#fff;box-shadow:0 24px 70px #173b3020}
  .counter-gate-brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}
  .counter-gate-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:15px;background:#105844;color:#fff;font-size:23px;font-weight:800}
  .counter-gate-brand b{display:block;color:#173b30;font:700 20px system-ui}
  .counter-gate-brand small,.counter-gate-note{color:#71817b;font:13px/1.6 system-ui}
  .counter-gate-card h1{margin:0 0 8px;color:#172b27;font:700 22px system-ui}
  .counter-gate-card p{color:#66776f;font:14px/1.6 system-ui}
  .counter-gate-card label{display:block;margin:18px 0 6px;color:#50645b;font:700 12px system-ui}
  .counter-gate-card input{width:100%;height:46px;padding:0 12px;border:1px solid #dce5df;border-radius:10px;font:15px system-ui}
  .counter-gate-card button{min-height:44px;padding:0 15px;border:1px solid #dce5df;border-radius:10px;background:#fff;color:#173b30;font:700 13px system-ui;cursor:pointer}
  .counter-gate-card button.primary{border-color:#14745d;background:#14745d;color:#fff}
  .counter-gate-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}
  .counter-gate-message{min-height:20px;margin-top:12px;color:#8a4b18;font:13px/1.5 system-ui}
  .counter-cloud-status{position:fixed;right:14px;bottom:14px;z-index:90;display:flex;align-items:center;gap:9px;max-width:calc(100vw - 28px);padding:9px 12px;border:1px solid #dfe8e2;border-radius:999px;background:#fff;box-shadow:0 7px 22px #143d2b1c;color:#365347;font:700 11px system-ui}
  .counter-cloud-status button{border:0;background:transparent;color:#14745d;font:700 11px system-ui;cursor:pointer}
  .counter-cloud-status[data-mode="warning"]{border-color:#ead6a9;color:#7a5815}
  .counter-cloud-status[data-mode="local"]{color:#596a63}
  @media(max-width:700px){.counter-cloud-status{right:10px;bottom:calc(68px + env(safe-area-inset-bottom))}.mobile-nav{scrollbar-width:none}.mobile-nav::-webkit-scrollbar{display:none}.mobile-nav button{min-width:56px}}
  @media(max-width:560px){.counter-gate-card{padding:23px 20px;border-radius:18px}.counter-cloud-status{right:10px}}
`;
document.head.append(style);

const gate = document.createElement("section");
gate.id = "counter-cloud-gate";
gate.setAttribute("aria-live", "polite");
gate.innerHTML = `
  <div class="counter-gate-card">
    <div class="counter-gate-brand"><span class="counter-gate-mark">₹</span><span><b>Daily Sales Counter</b><small>Phone aur laptop par apna hisaab</small></span></div>
    <div id="counter-gate-content"></div>
  </div>`;
document.body.prepend(gate);
const gateContent = gate.querySelector("#counter-gate-content");

const status = document.createElement("div");
status.className = "counter-cloud-status";
status.hidden = true;
document.body.append(status);

function setMessage(message) {
  const target = gate.querySelector(".counter-gate-message");
  if (target) target.textContent = message;
}

function showGate(content) {
  if (root) {
    root.hidden = true;
    root.inert = true;
  }
  if (mobileNav) mobileNav.hidden = true;
  status.hidden = true;
  gate.hidden = false;
  gateContent.innerHTML = content;
}

function showApp(mode, message, user) {
  gate.hidden = true;
  if (root) {
    root.hidden = false;
    root.inert = false;
  }
  if (mobileNav) mobileNav.hidden = false;
  const storageText = mode === "cloud"
    ? "Data aapke account se phone aur laptop par sync hota hai."
    : "Data isi browser mein save hota hai; doosre device par sync nahi hota.";
  const sideFoot = document.querySelector(".side-foot");
  const note = document.querySelector(".content-area > .note");
  if (sideFoot) sideFoot.textContent = storageText;
  if (note) note.textContent = storageText + " Backup download karke safe rakhein.";
  status.hidden = false;
  status.dataset.mode = mode;
  status.replaceChildren();
  const label = document.createElement("span");
  label.textContent = message;
  status.append(label);
  if (user) {
    const account = document.createElement("span");
    account.textContent = user.email || "Signed in";
    status.append(account);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Sign out";
    button.addEventListener("click", signOut);
    status.append(button);
  } else if (mode === "local" && hasConfig) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Cloud sync sign in";
    button.addEventListener("click", () => {
      showGate(`<h1>Sign in karein</h1><p>Apne phone aur laptop par ek hi email se sign in karein; hisaab cloud mein sync rahega.</p><form id="counter-login"><label for="counter-email">Email address</label><input id="counter-email" type="email" autocomplete="email" required placeholder="you@example.com"><div class="counter-gate-actions"><button class="primary" type="submit">Email sign-in link bhejein</button><button type="button" id="local-only">Sirf is device par use karein</button></div></form><p class="counter-gate-message"></p>`);
      bindLogin();
    });
    status.append(button);
  }
}

function hasSavedActivity(data) {
  return ["sales", "receipts", "expenses", "bills", "dues", "supplierReturns", "adjustments"]
    .some((key) => Array.isArray(data?.[key]) && data[key].length > 0) ||
    (data?.closings && Object.keys(data.closings).length > 0);
}

function emptyCounter() {
  const products = [
    ["1 Liter Water Bottle", 20],
    ["Half Liter Water Bottle", 10],
    ["2 Liter Water Bottle", 30],
    ["Badam Milk", 35],
    ["Basundi", 15],
    ["Nrich Soda", 10],
    ["Bun", 10],
    ["Bread Juttu", 35],
  ];
  return {
    products: products.map(([name, price], index) => ({
      id: `p${index}`,
      name,
      price,
      lots: [],
    })),
    sales: [],
    receipts: [],
    adjustments: [],
    expenses: [],
    bills: [],
    dues: [],
    supplierReturns: [],
    suppliers: ["Milk Supplier", "Egg Supplier", "Water/Nrich Soda Supplier"],
    closings: {},
  };
}

let client;
let currentUser;
let cloudVersion;
let ready = false;
let applyingRemote = false;
let syncBlocked = false;
let localDirty = false;
let localRevision = 0;
let writingVersion = null;
let saveTimer;
let saveQueue = Promise.resolve();
let channel;

function updateStatus(mode, message) {
  status.dataset.mode = mode;
  const label = status.querySelector("span");
  if (label) label.textContent = message;
}

async function loadCloudData() {
  const { data: row, error } = await client
    .from("daily_sales_counter_ledgers")
    .select("data,version")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) throw error;
  if (row) {
    cloudVersion = Number(row.version);
    applyingRemote = true;
    bridge.replaceState(row.data);
    applyingRemote = false;
    ready = true;
    syncBlocked = false;
    localDirty = false;
    showApp("cloud", "Cloud sync on", currentUser);
    subscribeToChanges();
    return;
  }

  const local = bridge.getState();
  if (hasSavedActivity(local)) {
    showGate(`
      <h1>Is device ka purana hisaab mila</h1>
      <p>Cloud mein abhi data nahi hai. Is device ka hisaab import karein, ya naya khaata shuru karein.</p>
      <div class="counter-gate-actions"><button class="primary" id="import-local">Purana data import karein</button><button id="start-fresh">Naya khaata</button></div>
      <p class="counter-gate-message"></p>`);
    gate.querySelector("#import-local").addEventListener("click", () => initializeCloud(local));
    gate.querySelector("#start-fresh").addEventListener("click", () => initializeCloud(emptyCounter()));
    return;
  }
  await initializeCloud(local);
}

async function initializeCloud(data) {
  setMessage("Cloud khaata taiyar ho raha hai…");
  const { data: row, error } = await client
    .from("daily_sales_counter_ledgers")
    .insert({ user_id: currentUser.id, data, version: 1 })
    .select("version")
    .maybeSingle();

  if (error?.code === "23505") {
    await loadCloudData();
    return;
  }
  if (error) {
    setMessage(error.message);
    return;
  }

  cloudVersion = Number(row.version);
  applyingRemote = true;
  bridge.replaceState(data);
  applyingRemote = false;
  ready = true;
  localDirty = false;
  showApp("cloud", "Cloud sync on", currentUser);
  subscribeToChanges();
}

function scheduleSave(data) {
  if (!ready || !currentUser || applyingRemote || syncBlocked) return;
  localDirty = true;
  const revision = ++localRevision;
  clearTimeout(saveTimer);
  updateStatus("warning", "Sync ho raha hai…");
  saveTimer = setTimeout(() => {
    saveQueue = saveQueue.then(() => saveCloudData(data, revision)).catch((error) => {
      updateStatus("warning", "Sync nahi hua — " + (error.message || "connection check karein"));
    });
  }, 350);
}

async function saveCloudData(data, revision) {
  if (!ready || syncBlocked) return;
  const nextVersion = cloudVersion + 1;
  writingVersion = nextVersion;
  let response;
  try {
    response = await client
      .from("daily_sales_counter_ledgers")
      .update({ data, version: nextVersion, updated_at: new Date().toISOString() })
      .eq("user_id", currentUser.id)
      .eq("version", cloudVersion)
      .select("version")
      .maybeSingle();
  } finally {
    writingVersion = null;
  }
  const { data: updated, error } = response;
  if (error) throw error;
  if (!updated) {
    ready = false;
    syncBlocked = true;
    updateStatus("warning", "Dusre device par naya data hai — reload karke latest hisaab kholein");
    return;
  }
  cloudVersion = Number(updated.version);
  if (revision === localRevision) localDirty = false;
  updateStatus("cloud", "Cloud sync on");
}

function subscribeToChanges() {
  if (channel) client.removeChannel(channel);
  channel = client
    .channel(`daily-sales-counter-${currentUser.id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "daily_sales_counter_ledgers",
        filter: `user_id=eq.${currentUser.id}`,
      },
      (payload) => {
        const incomingVersion = Number(payload.new.version);
        if (incomingVersion <= cloudVersion || !ready) return;
        if (incomingVersion === writingVersion) return;
        if (localDirty) {
          updateStatus("warning", "Dusre device par naya data hai — reload karke latest hisaab kholein");
          ready = false;
          syncBlocked = true;
          return;
        }
        cloudVersion = incomingVersion;
        applyingRemote = true;
        bridge.replaceState(payload.new.data);
        applyingRemote = false;
        updateStatus("cloud", "Dusre device se sync hua");
      },
    )
    .subscribe();
}

async function signOut() {
  const { error } = await client.auth.signOut();
  if (error) {
    showApp("warning", "Sign out nahi hua — " + error.message, currentUser);
    return;
  }
  ready = false;
  if (channel) await client.removeChannel(channel);
  currentUser = null;
  localStorage.removeItem(bridge.key);
  bridge.replaceState(emptyCounter());
  localStorage.removeItem(bridge.key);
  showGate(`<h1>Sign in karein</h1><p>Apne phone aur laptop par ek hi email se sign in karein; hisaab cloud mein sync rahega.</p><form id="counter-login"><label for="counter-email">Email address</label><input id="counter-email" type="email" autocomplete="email" required placeholder="you@example.com"><div class="counter-gate-actions"><button class="primary" type="submit">Email sign-in link bhejein</button><button type="button" id="local-only">Sirf is device par use karein</button></div></form><p class="counter-gate-message"></p>`);
  bindLogin();
}

function bindLogin() {
  const form = gate.querySelector("#counter-login");
  if (form) form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = gate.querySelector("#counter-email").value.trim();
    setMessage("Sign-in link bhej rahe hain…");
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    setMessage(error ? error.message : "Email mein sign-in link check karein, phir isi device par kholein.");
  });
  const localOnly = gate.querySelector("#local-only");
  if (localOnly) localOnly.addEventListener("click", () => showApp("local", "Sirf is device par — sync off"));
}

function showSetup() {
  showGate(`
    <h1>Cloud sync setup baqi hai</h1>
    <p>Is website ka cloud sync abhi Supabase project URL/public key aur table setup ka intezar kar raha hai. Public key ko hi website config mein use karein; service-role key kabhi nahi.</p>
    <p class="counter-gate-note">Cloud sync setup hone tak app ko local device par chala sakte hain. Local data doosre device par nahi dikhega.</p>
    <div class="counter-gate-actions"><button class="primary" id="local-only">Sirf is device par use karein</button></div>`);
  gate.querySelector("#local-only").addEventListener("click", () => showApp("local", "Sirf is device par — sync off"));
}

async function start() {
  if (!bridge || !root) {
    showGate("<h1>App load nahi hua</h1><p>Counter page ko dobara khol kar dekhein.</p>");
    return;
  }
  if (!hasConfig) {
    showSetup();
    return;
  }

  try {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  } catch (error) {
    showGate("<h1>Cloud sync connect nahi hua</h1><p id=\"counter-error\"></p>");
    gate.querySelector("#counter-error").textContent = error.message;
    return;
  }

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    showGate("<h1>Sign in check nahi hua</h1><p id=\"counter-error\"></p>");
    gate.querySelector("#counter-error").textContent = sessionError.message;
    return;
  }
  currentUser = sessionData.session?.user || null;
  if (!currentUser) {
    showGate(`<h1>Sign in karein</h1><p>Apne phone aur laptop par ek hi email se sign in karein; hisaab cloud mein sync rahega.</p><form id="counter-login"><label for="counter-email">Email address</label><input id="counter-email" type="email" autocomplete="email" required placeholder="you@example.com"><div class="counter-gate-actions"><button class="primary" type="submit">Email sign-in link bhejein</button><button type="button" id="local-only">Sirf is device par use karein</button></div></form><p class="counter-gate-message"></p>`);
    bindLogin();
    return;
  }

  showGate("<h1>Cloud hisaab load ho raha hai…</h1><p>Thoda intezar karein.</p>");
  try {
    await loadCloudData();
  } catch (error) {
    showGate("<h1>Cloud data load nahi hua</h1><p id=\"counter-error\"></p><p class=\"counter-gate-note\">Supabase mein <code>daily-sales-counter/schema.sql</code> chalane ke baad dobara try karein.</p><div class=\"counter-gate-actions\"><button id=\"retry-cloud\">Dobara try karein</button><button id=\"local-only\">Sirf is device par use karein</button></div>");
    gate.querySelector("#counter-error").textContent = error.message;
    gate.querySelector("#retry-cloud").addEventListener("click", start);
    gate.querySelector("#local-only").addEventListener("click", () => showApp("local", "Sirf is device par — sync off"));
  }
}

if (bridge) {
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === bridge.key && ready && !applyingRemote) {
      try {
        scheduleSave(JSON.parse(value));
      } catch (error) {
        updateStatus("warning", "Data sync nahi hua — " + error.message);
      }
    }
  };
}

start();
