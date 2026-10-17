window.Common = (() => {
  const statusText = {
    pending_intervention: "待處置",
    pending_reassessment: "待複評",
    completed: "已完成"
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).format(d);
  }

  function localDateTimeValue(date = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function nrsLevel(nrs) {
    const n = Number(nrs);
    if (n === 0) return { key: "none", label: "不痛", className: "nrs-none" };
    if (n <= 3) return { key: "mild", label: "輕微痛", className: "nrs-mild" };
    if (n <= 6) return { key: "moderate", label: "中度疼痛", className: "nrs-moderate" };
    return { key: "severe", label: "嚴重疼痛", className: "nrs-severe" };
  }

  function nrsBadge(nrs) {
    const l = nrsLevel(nrs);
    return `<span class="nrs-mini ${l.className}" title="${l.label}">${escapeHtml(nrs)}</span>`;
  }

  function statusBadge(status) {
    return `<span class="status status-${escapeHtml(status)}">${escapeHtml(statusText[status] || status)}</span>`;
  }

  function showMessage(target, text, type = "info") {
    if (!target) return;
    target.className = `message ${type}`;
    target.textContent = text;
    target.classList.remove("hidden");
  }

  function clearMessage(target) {
    if (!target) return;
    target.textContent = "";
    target.className = "message hidden";
  }

  function createNrsControl(container, hiddenInput, initialValue = null) {
    if (!container || !hiddenInput) return;
    container.innerHTML = `
      <div class="nrs-panel">
        <div class="nrs-title">數字等級量表（Numerical Rating Scale, NRS）</div>
        <div class="nrs-subtitle">請以 0–10 分表示目前疼痛程度；0 代表不痛，10 代表可想像的最嚴重疼痛。</div>
        <div class="nrs-scale-wrap">
          <div class="nrs-line"></div>
          <div class="nrs-buttons">
            ${Array.from({length: 11}, (_, n) => {
              const level = nrsLevel(n).key;
              return `<button class="nrs-btn" type="button" data-value="${n}" data-level="${level}" aria-label="NRS ${n}">${n}</button>`;
            }).join("")}
          </div>
          <div class="nrs-groups" aria-hidden="true">
            <div class="nrs-group none">0 不痛</div>
            <div class="nrs-group mild">1–3 輕微痛</div>
            <div class="nrs-group moderate">4–6 中度疼痛</div>
            <div class="nrs-group severe">7–10 嚴重疼痛</div>
          </div>
          <div class="nrs-selected-text">尚未選擇疼痛分數</div>
        </div>
      </div>`;

    const text = container.querySelector(".nrs-selected-text");
    const buttons = [...container.querySelectorAll(".nrs-btn")];

    function setValue(value) {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > 10) return;
      hiddenInput.value = String(n);
      buttons.forEach(btn => btn.classList.toggle("selected", Number(btn.dataset.value) === n));
      const level = nrsLevel(n);
      text.textContent = `已選擇：NRS ${n}｜${level.label}`;
      hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    buttons.forEach(btn => btn.addEventListener("click", () => setValue(btn.dataset.value)));
    if (initialValue !== null && initialValue !== "") setValue(initialValue);
    return { setValue };
  }

  function serializeCheckboxes(form, name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
  }

  function humanError(error) {
    const raw = `${error?.message || error || ""}`.toLowerCase();
    if (raw.includes("invalid login credentials")) return "帳號或密碼錯誤。";
    if (raw.includes("email not confirmed")) return "Email 尚未確認，請先完成確認後再登入。";
    if (raw.includes("already registered") || raw.includes("user already registered")) return "此 Email 已經註冊。";
    if (raw.includes("password") && raw.includes("least")) return "密碼至少需要 8 碼。";
    if (raw.includes("signups not allowed")) return "尚未開放使用者申請。";
    if (raw.includes("rate limit") || raw.includes("429")) return "Supabase Email 寄送已達速率限制（429）。請確認使用正確 Project、關閉並儲存 Confirm email、停止重複送出，改用新的測試 Email 或等待配額恢復。";
    if (raw.includes("failed to fetch") || raw.includes("network")) return "無法連線到 Supabase，請檢查網路、Project URL 與 Publishable key。";
    return error?.message ? `操作失敗：${error.message}` : "操作失敗，請稍後再試。";
  }

  return {
    escapeHtml, formatDate, localDateTimeValue, nrsLevel, nrsBadge,
    statusBadge, statusText, showMessage, clearMessage, createNrsControl,
    serializeCheckboxes, humanError
  };
})();
