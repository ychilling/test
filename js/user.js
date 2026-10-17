(() => {
  let profile = null;
  let records = [];

  const msg = document.getElementById("globalMessage");

  function showPage(name) {
    document.querySelectorAll("[data-section]").forEach(section => {
      section.classList.toggle(
        "hidden",
        section.dataset.section !== name
      );
    });

    document.querySelectorAll(".nav button").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === name
      );
    });

    if (name === "records") {
      renderRecords();
    }
  }

  function statCard(label, value) {
    return `
      <div class="card">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
      </div>
    `;
  }

  function renderDashboard() {
    const total = records.length;

    const pendingIntervention = records.filter(
      record => record.status === "pending_intervention"
    ).length;

    const pendingReassessment = records.filter(
      record => record.status === "pending_reassessment"
    ).length;

    const completed = records.filter(
      record => record.status === "completed"
    ).length;

    const latestNrs = records[0]?.nrs;

    document.getElementById("userStats").innerHTML = [
      statCard("紀錄總數", total),
      statCard("待處置", pendingIntervention),
      statCard("待複評", pendingReassessment),
      statCard("已完成", completed),
      statCard(
        "最近一次 NRS",
        latestNrs == null ? "—" : latestNrs
      )
    ].join("");

    document.getElementById("recentRecords").innerHTML =
      renderTable(records.slice(0, 5));
  }

  function renderTable(items) {
    if (!items.length) {
      return `
        <div class="card empty">
          目前沒有疼痛紀錄。
        </div>
      `;
    }

    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>建立時間</th>
              <th>NRS</th>
              <th>疼痛部位</th>
              <th>狀態</th>
              <th>處置</th>
              <th>複評</th>
            </tr>
          </thead>

          <tbody>
            ${items.map(record => `
              <tr>
                <td>
                  ${Common.formatDate(record.created_at)}
                </td>

                <td>
                  ${Common.nrsBadge(record.nrs)}
                </td>

                <td>
                  ${Common.escapeHtml(record.location)}

                  ${
                    record.location_other
                      ? `／${Common.escapeHtml(record.location_other)}`
                      : ""
                  }
                </td>

                <td>
                  ${Common.statusBadge(record.status)}
                </td>

                <td>
                  ${
                    record.intervention_content
                      ? `
                        ${Common.escapeHtml(
                          record.intervention_content
                        )}
                        <br>
                        <small>
                          ${Common.formatDate(
                            record.intervention_at
                          )}
                        </small>
                      `
                      : "—"
                  }
                </td>

                <td>
                  ${
                    record.reassessment_nrs == null
                      ? "—"
                      : `
                        ${Common.nrsBadge(
                          record.reassessment_nrs
                        )}

                        ${Common.escapeHtml(
                          Common.nrsLevel(
                            record.reassessment_nrs
                          ).label
                        )}

                        <br>

                        <small>
                          ${Common.escapeHtml(
                            record.reassessment_notes || ""
                          )}

                          ${Common.formatDate(
                            record.reassessment_at
                          )}
                        </small>
                      `
                  }
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRecords() {
    document.getElementById("ownRecords").innerHTML =
      renderTable(records);
  }

  async function reload() {
    records = await DataService.getOwnRecords();

    renderDashboard();
    renderRecords();
  }

  async function guard() {
    if (!AppConfig.isSupabaseConfigured) {
      location.href = "index.html";
      return false;
    }

    profile = await AuthService.getCurrentProfile();

    if (!profile) {
      Common.showMessage(
        msg,
        "找不到對應的使用者資料，系統將登出並返回登入頁。",
        "error"
      );

      await AuthService.signOut().catch(() => {});

      setTimeout(() => {
        location.href = "index.html";
      }, 1200);

      return false;
    }

    if (profile.role === "admin") {
      location.href = "admin.html";
      return false;
    }

    if (profile.role !== "user") {
      throw new Error("帳號角色設定異常");
    }

    document.getElementById("profileName").textContent =
      profile.display_name || "使用者";

    document.getElementById("profileEmail").textContent =
      profile.email || "";

    return true;
  }

  document
    .querySelectorAll(".nav button")
    .forEach(button => {
      button.addEventListener("click", () => {
        showPage(button.dataset.page);
      });
    });

  document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {
      await AuthService.signOut().catch(console.error);
      location.href = "index.html";
    });

  const painStartedAt =
    document.getElementById("painStartedAt");

  painStartedAt.value =
    Common.localDateTimeValue();

  Common.createNrsControl(
    document.getElementById("nrsControl"),
    document.getElementById("nrsValue")
  );

  const assessmentForm =
    document.getElementById("assessmentForm");

  assessmentForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      /*
       * 重要：
       * 不在 await 後面使用 event.currentTarget。
       *
       * 直接使用前面已經取得的 assessmentForm，
       * 避免：
       *
       * Cannot read properties of null (reading 'reset')
       */

      const form = assessmentForm;

      const localMsg =
        document.getElementById(
          "assessmentMessage"
        );

      const submitButton =
        document.getElementById(
          "submitAssessment"
        );

      Common.clearMessage(localMsg);

      const nrsValue =
        document.getElementById(
          "nrsValue"
        ).value;

      if (nrsValue === "") {
        Common.showMessage(
          localMsg,
          "請先選擇 NRS 0–10 疼痛分數。",
          "error"
        );

        return;
      }

      const qualities =
        Common.serializeCheckboxes(
          form,
          "quality"
        );

      if (!qualities.length) {
        Common.showMessage(
          localMsg,
          "請至少選擇一項疼痛性質。",
          "error"
        );

        return;
      }

      const location =
        document.getElementById(
          "location"
        ).value;

      if (!location) {
        Common.showMessage(
          localMsg,
          "請選擇疼痛部位。",
          "error"
        );

        return;
      }

      const frequency =
        document.getElementById(
          "frequency"
        ).value;

      if (!frequency) {
        Common.showMessage(
          localMsg,
          "請選擇疼痛頻率。",
          "error"
        );

        return;
      }

      const durationValue =
        document.getElementById(
          "durationValue"
        ).value;

      if (
        durationValue === "" ||
        Number(durationValue) <= 0
      ) {
        Common.showMessage(
          localMsg,
          "請輸入正確的疼痛持續時間。",
          "error"
        );

        return;
      }

      const painStartedValue =
        document.getElementById(
          "painStartedAt"
        ).value;

      if (!painStartedValue) {
        Common.showMessage(
          localMsg,
          "請輸入疼痛開始時間。",
          "error"
        );

        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "儲存中…";

      try {
        const payload = {
          pain_started_at:
            new Date(
              painStartedValue
            ).toISOString(),

          nrs:
            Number(nrsValue),

          location,

          location_other:
            document
              .getElementById(
                "locationOther"
              )
              .value
              .trim(),

          qualities,

          quality_other:
            document
              .getElementById(
                "qualityOther"
              )
              .value
              .trim(),

          frequency,

          duration_value:
            Number(durationValue),

          duration_unit:
            document.getElementById(
              "durationUnit"
            ).value,

          notes:
            document
              .getElementById("notes")
              .value
              .trim()
        };

        await DataService.createPainRecord(
          payload
        );

        /*
         * 先重新取得最新紀錄。
         * 如果 reload 失敗，也不影響前面已成功寫入的資料。
         */
        try {
          await reload();
        } catch (reloadError) {
          console.error(
            "重新載入紀錄失敗：",
            reloadError
          );
        }

        /*
         * 使用固定的 form 變數，
         * 不使用 event.currentTarget.reset()
         */
        form.reset();

        document.getElementById(
          "painStartedAt"
        ).value =
          Common.localDateTimeValue();

        document.getElementById(
          "nrsValue"
        ).value = "";

        Common.createNrsControl(
          document.getElementById(
            "nrsControl"
          ),
          document.getElementById(
            "nrsValue"
          )
        );

        Common.showMessage(
          localMsg,
          "疼痛評估已成功送出，狀態為「待處置」。",
          "success"
        );
      } catch (error) {
        console.error(
          "疼痛評估儲存失敗：",
          error
        );

        Common.showMessage(
          localMsg,
          Common.humanError(error),
          "error"
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent =
          "送出疼痛評估";
      }
    }
  );

  (async () => {
    try {
      const allowed = await guard();

      if (allowed) {
        await reload();
      }
    } catch (error) {
      console.error(error);

      Common.showMessage(
        msg,
        Common.humanError(error),
        "error"
      );
    }
  })();
})();