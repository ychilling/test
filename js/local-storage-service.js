window.LocalStorageService = (() => {
  const KEY = "pain_management_preview_v2";

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function seed() {
    const data = clone(window.DemoData);
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || seed(); }
    catch { return seed(); }
  }
  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
  function profileById(data, id) { return data.profiles.find(p => p.id === id) || null; }

  async function signIn(email) {
    const data = load();
    const profile = data.profiles.find(p => p.email.toLowerCase() === String(email).toLowerCase());
    if (!profile) throw new Error("Preview 找不到此帳號");
    data.currentUserId = profile.id;
    save(data);
    return profile;
  }

  async function register(displayName, email) {
    const data = load();
    if (data.profiles.some(p => p.email.toLowerCase() === String(email).toLowerCase())) throw new Error("此 Email 已經註冊");
    const id = crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}`;
    const profile = { id, email, display_name: displayName, role: "user", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    data.profiles.push(profile); data.currentUserId = id; save(data); return profile;
  }
  async function signOut() { return true; }
  async function getCurrentProfile() { const data = load(); return profileById(data, data.currentUserId); }
  async function setPreviewRole(role) {
    const data = load();
    const target = data.profiles.find(p => p.role === role);
    if (!target) throw new Error("找不到預覽角色");
    data.currentUserId = target.id; save(data); return target;
  }
  async function getOwnRecords() { const data = load(); return data.pain_records.filter(r => r.user_id === data.currentUserId).sort((a,b) => new Date(b.created_at)-new Date(a.created_at)); }
  async function createPainRecord(payload) {
    const data = load();
    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : `rec-${Date.now()}`,
      user_id: data.currentUserId,
      ...payload,
      status: "pending_intervention",
      intervention_methods: [], intervention_content: null, intervention_at: null, intervention_by: null,
      reassessment_nrs: null, reassessment_notes: null, reassessment_at: null, reassessment_by: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    data.pain_records.unshift(record); save(data); return record;
  }
  async function getAllProfiles() { return load().profiles.filter(p => p.role === "user").sort((a,b) => a.display_name.localeCompare(b.display_name, "zh-TW")); }
  async function getAllRecords() { return load().pain_records.sort((a,b) => new Date(b.created_at)-new Date(a.created_at)); }
  async function saveIntervention(recordId, payload) {
    const data = load(); const rec = data.pain_records.find(r => r.id === recordId); if (!rec) throw new Error("找不到紀錄");
    Object.assign(rec, payload, { status: "pending_reassessment", intervention_by: data.currentUserId, updated_at: new Date().toISOString() });
    save(data); return rec;
  }
  async function saveReassessment(recordId, payload) {
    const data = load(); const rec = data.pain_records.find(r => r.id === recordId); if (!rec) throw new Error("找不到紀錄");
    Object.assign(rec, payload, { status: "completed", reassessment_by: data.currentUserId, updated_at: new Date().toISOString() });
    save(data); return rec;
  }
  function reset() { return seed(); }

  return { signIn, register, signOut, getCurrentProfile, setPreviewRole, getOwnRecords, createPainRecord, getAllProfiles, getAllRecords, saveIntervention, saveReassessment, reset };
})();
