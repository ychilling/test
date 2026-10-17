window.SupabaseService = (() => {
  let client = null;

  function getClient() {
    if (client) return client;
    if (!window.AppConfig.isSupabaseConfigured) throw new Error("Supabase 尚未設定");
    if (!window.supabase?.createClient) throw new Error("Supabase SDK 載入失敗");
    client = window.supabase.createClient(window.AppConfig.supabaseUrl, window.AppConfig.supabaseKey);
    return client;
  }

  async function signIn(email, password) {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function register(displayName, email, password) {
    const { data, error } = await getClient().auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
  }

  async function getSessionUser() {
    const { data, error } = await getClient().auth.getUser();
    if (error) throw error;
    return data.user || null;
  }

  async function getCurrentProfile() {
    const user = await getSessionUser();
    if (!user) return null;
    const { data, error } = await getClient().from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function getOwnRecords() {
    const { data, error } = await getClient().from("pain_records").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function createPainRecord(payload) {
    const user = await getSessionUser();
    if (!user) throw new Error("尚未登入");
    const insert = {
      user_id: user.id,
      nrs: Number(payload.nrs),
      location: payload.location,
      location_other: payload.location_other || null,
      qualities: payload.qualities || [],
      quality_other: payload.quality_other || null,
      frequency: payload.frequency,
      pain_started_at: payload.pain_started_at,
      duration_value: Number(payload.duration_value),
      duration_unit: payload.duration_unit,
      notes: payload.notes || null
    };
    const { data, error } = await getClient().from("pain_records").insert(insert).select().single();
    if (error) throw error;
    return data;
  }

  async function getAllProfiles() {
    const { data, error } = await getClient().from("profiles").select("*").eq("role", "user").order("display_name");
    if (error) throw error;
    return data || [];
  }

  async function getAllRecords() {
    const { data, error } = await getClient().from("pain_records").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function saveIntervention(recordId, payload) {
    const { data, error } = await getClient().rpc("admin_save_intervention", {
      p_record_id: recordId,
      p_methods: payload.intervention_methods,
      p_content: payload.intervention_content,
      p_intervention_at: payload.intervention_at
    });
    if (error) throw error;
    return data;
  }

  async function saveReassessment(recordId, payload) {
    const { data, error } = await getClient().rpc("admin_save_reassessment", {
      p_record_id: recordId,
      p_nrs: Number(payload.reassessment_nrs),
      p_notes: payload.reassessment_notes || null,
      p_reassessment_at: payload.reassessment_at
    });
    if (error) throw error;
    return data;
  }

  return { getClient, signIn, register, signOut, getCurrentProfile, getOwnRecords, createPainRecord, getAllProfiles, getAllRecords, saveIntervention, saveReassessment };
})();
