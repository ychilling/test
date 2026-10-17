window.DemoData = (() => {
  const now = Date.now();
  const iso = offsetHours => new Date(now + offsetHours * 3600000).toISOString();
  return {
    currentUserId: "demo-user-1",
    profiles: [
      { id: "demo-user-1", email: "user@example.test", display_name: "王小明", role: "user", created_at: iso(-120), updated_at: iso(-120) },
      { id: "demo-user-2", email: "patient2@example.test", display_name: "林怡君", role: "user", created_at: iso(-240), updated_at: iso(-240) },
      { id: "demo-admin-1", email: "admin@example.test", display_name: "管理者", role: "admin", created_at: iso(-500), updated_at: iso(-500) }
    ],
    pain_records: [
      {
        id: "demo-rec-1", user_id: "demo-user-1", nrs: 6, location: "下背部", location_other: "", qualities: ["痠痛", "抽痛"], quality_other: "",
        frequency: "間歇性", pain_started_at: iso(-30), duration_value: 2, duration_unit: "小時", notes: "活動後加劇",
        status: "pending_intervention", intervention_methods: [], intervention_content: null, intervention_at: null, intervention_by: null,
        reassessment_nrs: null, reassessment_notes: null, reassessment_at: null, reassessment_by: null, created_at: iso(-29.5), updated_at: iso(-29.5)
      },
      {
        id: "demo-rec-2", user_id: "demo-user-1", nrs: 8, location: "右膝", location_other: "", qualities: ["刺痛"], quality_other: "",
        frequency: "持續性", pain_started_at: iso(-72), duration_value: 1, duration_unit: "天", notes: "上下樓梯明顯",
        status: "completed", intervention_methods: ["非藥物處置", "藥物處置"], intervention_content: "依醫囑給藥並冰敷", intervention_at: iso(-70), intervention_by: "demo-admin-1",
        reassessment_nrs: 3, reassessment_notes: "疼痛明顯改善", reassessment_at: iso(-68), reassessment_by: "demo-admin-1", created_at: iso(-72), updated_at: iso(-68)
      },
      {
        id: "demo-rec-3", user_id: "demo-user-2", nrs: 4, location: "腹部", location_other: "", qualities: ["脹痛"], quality_other: "",
        frequency: "間歇性", pain_started_at: iso(-7), duration_value: 30, duration_unit: "分鐘", notes: "餐後較明顯",
        status: "pending_reassessment", intervention_methods: ["姿勢調整"], intervention_content: "協助舒適姿勢與觀察", intervention_at: iso(-5), intervention_by: "demo-admin-1",
        reassessment_nrs: null, reassessment_notes: null, reassessment_at: null, reassessment_by: null, created_at: iso(-7), updated_at: iso(-5)
      }
    ]
  };
})();
