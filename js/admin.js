(() => {
  let profile = null, profiles = [], records = [];
  const profileMap = () => Object.fromEntries(profiles.map(p => [p.id, p]));

  function showPage(name) {
    document.querySelectorAll("[data-section]").forEach(s => s.classList.toggle("hidden", s.dataset.section !== name));
    document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("active", b.dataset.page === name));
    if (name === "records") renderAllRecords();
    if (name === "pending") renderPending();
  }
  function statCard(label, value) { return `<div class="card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`; }
  function userLabel(id) { const p = profileMap()[id]; return p ? `${Common.escapeHtml(p.display_name)}<br><small>${Common.escapeHtml(p.email)}</small>` : "未知使用者"; }

  function renderDashboard() {
    const today = new Date(); today.setHours(0,0,0,0);
    const total = records.length, todayCount = records.filter(r => new Date(r.created_at) >= today).length;
    const pI = records.filter(r => r.status === "pending_intervention").length, pR = records.filter(r => r.status === "pending_reassessment").length, done = records.filter(r => r.status === "completed").length;
    const avg = total ? (records.reduce((s,r)=>s+Number(r.nrs||0),0)/total).toFixed(1) : "—";
    document.getElementById("adminStats").innerHTML = [statCard("全部紀錄", total),statCard("今日新增",todayCount),statCard("待處置",pI),statCard("待複評",pR),statCard("已完成",done),statCard("平均 NRS",avg)].join("");
    document.getElementById("recentRecords").innerHTML = renderTable(records.slice(0,6));
  }

  function renderTable(items) {
    if (!items.length) return `<div class="card empty">目前沒有符合條件的紀錄。</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>使用者</th><th>建立時間</th><th>NRS</th><th>部位</th><th>狀態</th><th>處理</th></tr></thead><tbody>${items.map(r => `<tr><td>${userLabel(r.user_id)}</td><td>${Common.formatDate(r.created_at)}</td><td>${Common.nrsBadge(r.nrs)} ${Common.escapeHtml(Common.nrsLevel(r.nrs).label)}</td><td>${Common.escapeHtml(r.location)}${r.location_other?`／${Common.escapeHtml(r.location_other)}`:""}</td><td>${Common.statusBadge(r.status)}</td><td>${r.status === "pending_intervention" ? `<button class="btn btn-primary" data-action="intervention" data-id="${r.id}">進行處置</button>` : r.status === "pending_reassessment" ? `<button class="btn btn-primary" data-action="reassessment" data-id="${r.id}">進行複評</button>` : `<button class="btn btn-secondary" data-action="detail" data-id="${r.id}">查看詳情</button>`}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function bindActionButtons(root=document) {
    root.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => {
      const r = records.find(x => String(x.id) === String(btn.dataset.id)); if (!r) return;
      if (btn.dataset.action === "intervention") openIntervention(r);
      else if (btn.dataset.action === "reassessment") openReassessment(r);
      else openDetail(r);
    }));
  }

  function renderAllRecords() {
    let items = [...records];
    const u = document.getElementById("filterUser").value, s = document.getElementById("filterStatus").value, start = document.getElementById("filterStart").value, end = document.getElementById("filterEnd").value;
    if (u) items = items.filter(r => r.user_id === u); if (s) items = items.filter(r => r.status === s);
    if (start) items = items.filter(r => new Date(r.created_at) >= new Date(`${start}T00:00:00`));
    if (end) items = items.filter(r => new Date(r.created_at) <= new Date(`${end}T23:59:59`));
    document.getElementById("allRecords").innerHTML = renderTable(items); bindActionButtons(document.getElementById("allRecords"));
  }
  function renderPending() { const el=document.getElementById("pendingRecords"); el.innerHTML=renderTable(records.filter(r=>r.status!=="completed")); bindActionButtons(el); }
  function renderSingleUser() {
    const id = document.getElementById("singleUserSelect").value, summary=document.getElementById("singleUserSummary"), list=document.getElementById("singleUserRecords");
    if (!id) { summary.innerHTML=""; list.innerHTML=`<div class="card empty">請先選擇使用者。</div>`; return; }
    const p=profiles.find(x=>x.id===id), items=records.filter(r=>r.user_id===id); summary.innerHTML=`<div class="card" style="margin-bottom:14px"><strong>${Common.escapeHtml(p.display_name)}</strong><div class="help">${Common.escapeHtml(p.email)}｜紀錄 ${items.length} 筆</div></div>`; list.innerHTML=renderTable(items); bindActionButtons(list);
  }

  function modalShell(title, body) { document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h3>${title}</h3><button id="closeModal" class="btn btn-ghost">關閉</button></div>${body}</div></div>`; document.getElementById("closeModal").addEventListener("click", closeModal); }
  function closeModal(){ document.getElementById("modalRoot").innerHTML=""; }
  function assessmentSummary(r) { return `<div class="detail-list"><div class="detail-item"><small>原始 NRS</small>${Common.nrsBadge(r.nrs)} ${Common.escapeHtml(Common.nrsLevel(r.nrs).label)}</div><div class="detail-item"><small>疼痛部位</small>${Common.escapeHtml(r.location)}${r.location_other?`／${Common.escapeHtml(r.location_other)}`:""}</div><div class="detail-item"><small>疼痛性質</small>${Common.escapeHtml((r.qualities||[]).join("、"))}${r.quality_other?`／${Common.escapeHtml(r.quality_other)}`:""}</div><div class="detail-item"><small>頻率／持續時間</small>${Common.escapeHtml(r.frequency)}／${Common.escapeHtml(r.duration_value)} ${Common.escapeHtml(r.duration_unit)}</div><div class="detail-item"><small>疼痛開始</small>${Common.formatDate(r.pain_started_at)}</div><div class="detail-item"><small>備註</small>${Common.escapeHtml(r.notes||"—")}</div></div>`; }

  function openDetail(r){ modalShell("疼痛紀錄詳情", `${assessmentSummary(r)}<div class="section-title"><h3>處置與複評</h3></div><div class="detail-list"><div class="detail-item"><small>處置方式</small>${Common.escapeHtml((r.intervention_methods||[]).join("、")||"—")}</div><div class="detail-item"><small>處置內容</small>${Common.escapeHtml(r.intervention_content||"—")}</div><div class="detail-item"><small>處置時間</small>${Common.formatDate(r.intervention_at)}</div><div class="detail-item"><small>複評 NRS</small>${r.reassessment_nrs==null?"—":`${Common.nrsBadge(r.reassessment_nrs)} ${Common.escapeHtml(Common.nrsLevel(r.reassessment_nrs).label)}`}</div><div class="detail-item"><small>複評備註</small>${Common.escapeHtml(r.reassessment_notes||"—")}</div><div class="detail-item"><small>複評時間</small>${Common.formatDate(r.reassessment_at)}</div></div>`); }

  function openIntervention(r){ modalShell("疼痛處置", `${assessmentSummary(r)}<form id="interventionForm"><div class="section-title"><h3>處置內容</h3></div><div class="field"><label>處置方式（可複選）</label><div class="checkbox-grid"><label class="check-chip"><input type="checkbox" name="method" value="藥物處置">藥物處置</label><label class="check-chip"><input type="checkbox" name="method" value="非藥物處置">非藥物處置</label><label class="check-chip"><input type="checkbox" name="method" value="姿勢調整">姿勢調整</label><label class="check-chip"><input type="checkbox" name="method" value="冷熱敷">冷熱敷</label><label class="check-chip"><input type="checkbox" name="method" value="其他">其他</label></div></div><div class="field" style="margin-top:14px"><label>處置內容</label><textarea id="interventionContent" required></textarea></div><div class="field" style="margin-top:14px"><label>處置時間</label><input id="interventionAt" type="datetime-local" value="${Common.localDateTimeValue()}" required></div><div id="modalMessage" class="message hidden"></div><div class="actions"><button class="btn btn-primary" type="submit">儲存處置</button></div></form>`);
    document.getElementById("interventionForm").addEventListener("submit", async e=>{e.preventDefault();const m=Common.serializeCheckboxes(e.currentTarget,"method");const msg=document.getElementById("modalMessage");if(!m.length)return Common.showMessage(msg,"請至少選擇一項處置方式。","error");const b=e.currentTarget.querySelector("button[type=submit]");b.disabled=true;try{await DataService.saveIntervention(r.id,{intervention_methods:m,intervention_content:document.getElementById("interventionContent").value.trim(),intervention_at:new Date(document.getElementById("interventionAt").value).toISOString()});closeModal();await reload();}catch(err){console.error(err);Common.showMessage(msg,Common.humanError(err),"error");b.disabled=false;}});
  }

  function openReassessment(r){ modalShell("疼痛複評", `${assessmentSummary(r)}<form id="reassessmentForm"><div class="section-title"><h3>複評疼痛程度</h3></div><input id="reNrs" type="hidden"><div id="reNrsControl"></div><div class="field" style="margin-top:14px"><label>複評備註</label><textarea id="reNotes"></textarea></div><div class="field" style="margin-top:14px"><label>複評時間</label><input id="reAt" type="datetime-local" value="${Common.localDateTimeValue()}" required></div><div id="modalMessage" class="message hidden"></div><div class="actions"><button class="btn btn-primary" type="submit">完成複評</button></div></form>`);Common.createNrsControl(document.getElementById("reNrsControl"),document.getElementById("reNrs"));document.getElementById("reassessmentForm").addEventListener("submit",async e=>{e.preventDefault();const msg=document.getElementById("modalMessage"),n=document.getElementById("reNrs").value;if(n==="")return Common.showMessage(msg,"請選擇複評 NRS。","error");const b=e.currentTarget.querySelector("button[type=submit]");b.disabled=true;try{await DataService.saveReassessment(r.id,{reassessment_nrs:Number(n),reassessment_notes:document.getElementById("reNotes").value.trim(),reassessment_at:new Date(document.getElementById("reAt").value).toISOString()});closeModal();await reload();}catch(err){console.error(err);Common.showMessage(msg,Common.humanError(err),"error");b.disabled=false;}}); }

  function fillUserSelects(){const options=profiles.map(p=>`<option value="${p.id}">${Common.escapeHtml(p.display_name)}｜${Common.escapeHtml(p.email)}</option>`).join("");document.getElementById("filterUser").innerHTML=`<option value="">全部使用者</option>${options}`;document.getElementById("singleUserSelect").innerHTML=`<option value="">請選擇使用者</option>${options}`;}
  async function reload(){[profiles,records]=await Promise.all([DataService.getAllProfiles(),DataService.getAllRecords()]);fillUserSelects();renderDashboard();renderAllRecords();renderPending();renderSingleUser();bindActionButtons(document.getElementById("recentRecords"));}
  async function guard(){if(!AppConfig.isSupabaseConfigured){location.href="index.html";return false;}profile=await AuthService.getCurrentProfile();if(!profile){Common.showMessage(document.getElementById("globalMessage"),"找不到對應的使用者資料，系統將登出並返回登入頁。","error");await AuthService.signOut().catch(()=>{});setTimeout(()=>{location.href="index.html";},1200);return false;}if(profile.role==="user"){location.href="user.html";return false;}if(profile.role!=="admin")throw new Error("帳號角色設定異常");document.getElementById("profileName").textContent=profile.display_name||"管理者";document.getElementById("profileEmail").textContent=profile.email||"";return true;}

  document.querySelectorAll(".nav button").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));document.getElementById("logoutButton").addEventListener("click",async()=>{await AuthService.signOut().catch(console.error);location.href="index.html";});["filterUser","filterStatus","filterStart","filterEnd"].forEach(id=>document.getElementById(id).addEventListener("change",renderAllRecords));document.getElementById("clearFilters").addEventListener("click",()=>{["filterUser","filterStatus","filterStart","filterEnd"].forEach(id=>document.getElementById(id).value="");renderAllRecords();});document.getElementById("singleUserSelect").addEventListener("change",renderSingleUser);
  (async()=>{try{if(await guard())await reload();}catch(err){console.error(err);Common.showMessage(document.getElementById("globalMessage"),Common.humanError(err),"error");}})();
})();
