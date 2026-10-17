(() => {
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginPanel = document.getElementById("loginPanel");
  const registerPanel = document.getElementById("registerPanel");
  const configMessage = document.getElementById("configMessage");

  if (!window.AppConfig.isSupabaseConfigured) {
    Common.showMessage(configMessage, "系統目前尚未完成 Supabase 連線設定，請由系統管理者完成設定後再使用。", "info");
  }

  function setTab(name) {
    const login = name === "login";
    loginTab.classList.toggle("active", login);
    registerTab.classList.toggle("active", !login);
    loginPanel.classList.toggle("hidden", !login);
    registerPanel.classList.toggle("hidden", login);
  }
  loginTab.addEventListener("click", () => setTab("login"));
  registerTab.addEventListener("click", () => setTab("register"));

  async function routeByRole() {
    const profile = await AuthService.getCurrentProfile();
    if (!profile) {
      await AuthService.signOut().catch(() => {});
      throw new Error("找不到對應的使用者資料");
    }
    if (profile.role === "admin") location.href = "admin.html";
    else if (profile.role === "user") location.href = "user.html";
    else throw new Error("帳號角色設定異常");
  }

  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = document.getElementById("loginButton");
    const msg = document.getElementById("loginMessage");
    Common.clearMessage(msg);
    if (!AppConfig.isSupabaseConfigured) return Common.showMessage(msg, "Supabase 尚未設定。", "error");
    btn.disabled = true; btn.textContent = "登入中…";
    try {
      await AuthService.signIn(document.getElementById("loginEmail").value.trim(), document.getElementById("loginPassword").value);
      await routeByRole();
    } catch (err) {
      console.error(err); Common.showMessage(msg, Common.humanError(err), "error");
      btn.disabled = false; btn.textContent = "登入系統";
    }
  });

  document.getElementById("registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = document.getElementById("registerButton");
    const msg = document.getElementById("registerMessage");
    Common.clearMessage(msg);
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const p1 = document.getElementById("registerPassword").value;
    const p2 = document.getElementById("registerPassword2").value;
    if (!AppConfig.isSupabaseConfigured) return Common.showMessage(msg, "Supabase 尚未設定。", "error");
    if (!name) return Common.showMessage(msg, "請輸入使用者名稱。", "error");
    if (p1.length < 8) return Common.showMessage(msg, "密碼至少需要 8 碼。", "error");
    if (p1 !== p2) return Common.showMessage(msg, "兩次輸入的密碼不一致。", "error");
    btn.disabled = true; btn.textContent = "申請中…";
    try {
      const result = await AuthService.register(name, email, p1);
      if (!result?.session) {
        Common.showMessage(msg, "申請已送出，但目前尚未取得登入 Session。若專案啟用 Email 確認，請先完成 Email 確認後再登入。", "success");
        btn.disabled = false; btn.textContent = "申請使用者"; return;
      }
      await routeByRole();
    } catch (err) {
      console.error(err); Common.showMessage(msg, Common.humanError(err), "error");
      btn.disabled = false; btn.textContent = "申請使用者";
    }
  });
})();
