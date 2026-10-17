# 疼痛管理系統｜唯一完整生成 Prompt

將「Prompt 開始」到「Prompt 結束」完整複製到新的 AI 對話，即可重新產生完整專案、SQL、操作教學與 ZIP。

---

## Prompt 開始

你是一位擅長協助初學者的前端工程師、Supabase 工程師與系統分析師。

請使用下列技術建立一套小型疼痛管理系統：

- HTML
- CSS
- 原生 JavaScript
- Supabase Authentication
- Supabase Database
- Supabase Row Level Security
- Supabase SECURITY DEFINER RPC

請直接交付完整可執行專案、完整 SQL、完整初學者教學與 ZIP，不要只提供規格、概念或零碎程式碼。

# 一、交付原則

1. 使用繁體中文。
2. 我是初學者，只負責下載、解壓縮、完整複製貼上、執行 SQL、填入公開連線資訊與測試。
3. 不要要求我尋找第幾行、插入片段或自行組合程式碼。
4. 所有修改都要提供完整可替換檔案；大型更新直接提供完整新版 ZIP。
5. 不使用 React、Vue、Vite、Node.js、npm、TypeScript 或自建後端。
6. 專案必須能以 Python HTTP Server 啟動，固定使用 port 5000。
7. 本次只做到 Supabase 本機串接完整操作，不進行正式上線部署。
8. 不得使用或內建真實病人與敏感資料。
9. 不要先詢問是否開始，請直接建立、檢查與輸出完整檔案。
10. 不要產生修改歷史、版本比較或重複用途的 Markdown。
11. Markdown 只保留 README、唯一主 Prompt、系統架構、Supabase 操作教學四份。

# 二、正式入口與預覽入口

專案必須包含：

```text
index.html    正式登入與使用者申請入口
preview.html  介面預覽入口
user.html     一般使用者介面
admin.html    管理者介面
```

## index.html

必須是乾淨正式的單一入口，提供：

```text
登入系統
申請使用者
```

不得顯示：

- 展示模式
- 快速進入使用者或管理者
- Project URL 或 key 輸入表單
- 範例 Email 或密碼
- 使用者角色選擇
- 管理者註冊選項

尚未設定 Supabase 時，仍維持正式外觀並顯示友善提示。

## preview.html

- 只供開發者檢視介面
- 使用 localStorage 與虛擬資料
- 可預覽 user 與 admin
- 可重設範例資料
- 可測試評估、處置、複評
- 不呼叫 Supabase
- 不建立正式 Auth 帳號
- 不寫入正式資料庫

# 三、角色規則

系統只有：

```text
user
admin
```

不支援雙重角色。

每個帳號只能是一種角色。

所有前端新申請帳號一律：

```text
role = user
```

前端不可讓使用者自行選擇或修改 admin。

管理者建立方式：

```text
先建立一般 Auth 帳號
→ Trigger 自動建立 profile
→ 後台將 profiles.role 改成 admin
→ 登出並重新登入
→ 進入 admin.html
```

# 四、前端申請使用者

申請欄位：

- 使用者名稱
- Email
- 密碼
- 再次輸入密碼

驗證：

- 名稱必填
- Email 格式正確
- 密碼至少 8 碼
- 兩次密碼一致
- 防止重複提交
- 顯示處理中、成功與失敗訊息

使用：

```javascript
supabase.auth.signUp({
  email,
  password,
  options: {
    data: { display_name: displayName }
  }
})
```

註冊流程：

```text
signUp()
→ auth.users
→ Trigger 建立 public.profiles
→ role = user
→ 取得 Session
→ user.html
```

本機示範階段教學需設定：

```text
Allow new users to sign up：開啟
Confirm email：關閉
```

若沒有取得 Session，要顯示 Email 確認相關提示，不可完全沒有反應。

必須處理 429 `email rate limit exceeded`，顯示明確繁體中文訊息，說明檢查正確 Project、關閉並儲存 Confirm email、停止重複送出、使用新測試 Email或等待配額恢復。

# 五、Authentication 與 Profile

Authentication 使用：

```text
auth.users
```

Profile 使用：

```text
public.profiles
```

`profiles` 至少包含：

```text
id uuid primary key references auth.users(id)
email text
display_name text
role text check (role in ('user','admin'))
created_at timestamptz
updated_at timestamptz
```

必須符合：

```text
profiles.id = auth.users.id
```

新帳號 Trigger 必須讀取：

```text
raw_user_meta_data.display_name
```

並預設 role 為 user。

SQL 必須回補執行前已存在的 Auth 帳號。

# 六、登入與角色導向

登入使用：

```javascript
supabase.auth.signInWithPassword()
```

流程：

```text
驗證 Email／密碼
→ 取得 Session
→ 查詢 profiles
→ role = user 進入 user.html
→ role = admin 進入 admin.html
```

禁止依 Email 寫死管理者，例如禁止：

```javascript
if (email === "admin@example.com")
```

角色只能依 `profiles.role` 判斷。

Supabase Client 必須在同一頁共用單一實例，不得因 AuthService、DataService 各自建立而出現 `Multiple GoTrueClient instances detected`。

# 七、頁面保護

## user.html

- 未登入導回 index.html
- role=user 正常顯示
- role=admin 導向 admin.html
- 找不到 profile 時登出並顯示錯誤

## admin.html

- 未登入導回 index.html
- role=admin 正常顯示
- role=user 導向 user.html
- 找不到 profile 時登出並顯示錯誤

真正資料權限必須由 RLS 保護，不可只靠隱藏按鈕或網址導向。

# 八、使用者與個案識別規則

本系統定義：

```text
一個登入帳號 = 一位使用者本人
```

使用者不需要輸入個案代碼。

疼痛評估表單、使用者紀錄、管理者列表、管理者篩選與紀錄詳情都不得顯示或要求「個案代碼」。

每筆紀錄的真正歸屬必須是：

```text
pain_records.user_id = auth.uid()
```

管理者以使用者名稱與 Email 辨識資料。

為了與既有資料結構相容，SQL 可以保留：

```text
pain_records.case_code
```

但必須符合：

- 只作為內部相容欄位
- 前端不傳送
- 前端不顯示
- 使用者不輸入
- 管理者不依它篩選
- 由 Before Insert Trigger 根據 `user_id` 自動產生固定內部值
- authenticated 的 INSERT 欄位權限不包含 `case_code`

# 九、一般使用者功能

內部分頁：

```text
我的首頁
疼痛評估
我的紀錄
```

內部分頁切換不改變網址。

## 我的首頁

顯示：

- 紀錄總數
- 待處置數
- 待複評數
- 已完成數
- 最近一次 NRS
- 最近紀錄

## 疼痛評估

欄位：

- 疼痛開始時間
- NRS 0～10 大型按鈕
- 疼痛部位
- 其他部位說明
- 疼痛性質，可複選
- 其他性質說明
- 疼痛頻率
- 持續時間數值
- 持續時間單位：分鐘、小時、天、週
- 備註

不得包含個案代碼輸入欄位。

NRS 分級：

```text
0 不痛
1～3 輕微痛
4～6 中度疼痛
7～10 嚴重疼痛
```

NRS 視覺與互動規則：

- 依臨床提供之 NRS 參考圖，將 0～10 以大型可點選數字按鈕水平排列。
- 顯示 0～10 的視覺刻度線，並在數字下方顯示四段疼痛分級。
- 0 使用綠色，標示「不痛」。
- 1～3 使用藍色，標示「輕微痛」。
- 4～6 使用橘色，標示「中度疼痛」。
- 7～10 使用紅色，標示「嚴重疼痛」。
- 點選後，該 NRS 數字以所屬分級顏色突出，並顯示「已選擇：NRS X｜分級」。
- 疼痛複評也使用同一套 NRS 0～10 元件與分級。
- 列表中的 NRS 使用同分級色彩標籤快速辨識。
- 不直接依賴外部 NRS 圖片，需以 HTML/CSS/JavaScript 重建介面。

送出後狀態：

```text
pending_intervention
```

## 我的紀錄

可查看：

- 原始評估
- 建立時間
- 疼痛部位
- NRS
- 狀態
- 管理者處置
- 處置時間
- 複評 NRS
- 複評備註
- 複評時間

一般使用者不可修改管理者處置或複評。

# 十、管理者功能

內部分頁：

```text
管理首頁
全部紀錄
單一使用者
待處理紀錄
```

## 管理首頁

顯示：

- 全部紀錄
- 今日新增
- 待處置
- 待複評
- 已完成
- 平均 NRS
- 最近紀錄

## 全部紀錄

可依：

- 使用者
- 狀態
- 開始日期
- 結束日期

篩選。

不得包含個案代碼篩選。

管理者列表使用：

```text
使用者名稱
Email
```

辨識紀錄。

## 單一使用者

可查看該使用者基本資料、全部紀錄、處置與複評歷史。

## 疼痛處置

欄位：

- 處置方式，可複選
- 處置內容
- 處置時間

完成後：

```text
pending_reassessment
```

## 疼痛複評

欄位：

- 複評 NRS 0～10
- 複評備註
- 複評時間

完成後：

```text
completed
```

# 十一、資料隔離

每個 Auth 使用者有獨立 UUID。

新增紀錄時：

```text
pain_records.user_id = auth.uid()
```

RLS 必須確保：

- 一般使用者只能查看自己的 profile
- 一般使用者只能查看自己的 pain_records
- 一般使用者只能新增自己的原始評估
- 一般使用者不能修改處置、複評、狀態與角色
- 管理者可以查看全部 profiles 與 pain_records

範例帳號只能存在 preview 虛擬資料，不得綁定正式系統。

# 十二、資料服務抽離

建立：

```text
js/runtime-config.js
js/config.js
js/common.js
js/local-storage-service.js
js/supabase-service.js
js/data-service.js
js/auth-service.js
```

一致方法至少包含：

```javascript
signIn(email, password)
register(displayName, email, password)
signOut()
getCurrentProfile()
getOwnRecords()
createPainRecord(payload)
getAllProfiles()
getAllRecords()
saveIntervention(recordId, payload)
saveReassessment(recordId, payload)
```

Preview 使用 LocalStorageService；正式模式使用 SupabaseService。

接上 Supabase 時不得重寫畫面、表格或表單。

# 十三、資料表

## profiles

至少包含：

```text
id
email
display_name
role
created_at
updated_at
```

## pain_records

至少包含：

```text
id
user_id
case_code（僅內部相容，不提供前端）
nrs
location
location_other
qualities
quality_other
frequency
pain_started_at
duration_value
duration_unit
notes
status
intervention_methods
intervention_content
intervention_at
intervention_by
reassessment_nrs
reassessment_notes
reassessment_at
reassessment_by
created_at
updated_at
```

# 十四、Supabase SQL

請提供完整 SQL。

至少包含：

1. `profiles` 資料表。
2. `pain_records` 資料表。
3. 欄位限制與索引。
4. updated_at Trigger。
5. 新 Auth 帳號自動建立 profile 的 Trigger。
6. 既有 Auth 帳號 profile 回補。
7. `case_code` 內部自動產生 Trigger。
8. 預設新帳號角色為 user。
9. RLS。
10. 一般使用者只能查詢自己的 profile。
11. 管理者可以查詢全部 profile。
12. 一般使用者只能查詢自己的 pain_records。
13. 一般使用者只能新增自己的原始疼痛評估。
14. authenticated 的欄位 INSERT 權限不包含 case_code、status、處置或複評欄位。
15. 一般使用者不能直接更新管理者欄位。
16. 管理者可以查看全部 pain_records。
17. `private.is_admin()` 安全函式。
18. SECURITY DEFINER 處置 RPC。
19. SECURITY DEFINER 複評 RPC。
20. 最早帳號設為管理者的 SQL。
21. 依 Email 將 user 改成 admin 的 SQL。
22. 依 Email 將 admin 改回 user 的 SQL。
23. 安裝檢查 SQL。
24. 帳號診斷 SQL。
25. RLS、Trigger、函式與欄位權限檢查。

SQL 檔案：

```text
sql/
├── 01-setup.sql
├── 02-set-first-user-admin.sql
├── 03-check-setup.sql
├── 04-account-diagnostics.sql
└── 05-role-management.sql
```

# 十五、安全限制

瀏覽器只能使用：

```text
Project URL
Publishable key
```

禁止使用：

```text
Secret key
sb_secret_...
service_role
Database password
```

不得讓前端使用者自行變更 `profiles.role`。

不得建立允許一般使用者更新 role 的 RLS policy。

不得透過 `user_metadata` 決定管理者權限。

正式資料權限必須依靠 RLS、欄位權限與安全 RPC。

# 十六、錯誤處理

必須提供清楚繁體中文訊息，至少包含：

```text
帳號或密碼錯誤
Email 尚未確認
此 Email 已經註冊
密碼至少需要 8 碼
兩次輸入的密碼不一致
尚未開放使用者申請
找不到對應的使用者資料
帳號角色設定異常
沒有管理者權限
資料儲存失敗
Supabase 尚未設定
無法連線到 Supabase
Supabase 429 Email rate limit exceeded
```

登入、申請及儲存操作必須：

- 顯示處理中
- 暫時停用按鈕
- 防止重複提交
- 失敗後恢復按鈕
- 成功後導向或更新畫面
- Console 保留完整技術錯誤
- 畫面顯示友善繁體中文訊息

# 十七、視覺設計

- 醫療白色
- 藍綠色
- 少量專業藍色
- 舒適、正式、乾淨、專業
- 電腦與平板優先
- 手機可操作
- 側邊欄
- 統計卡片
- 表格
- 狀態標籤
- Modal
- NRS 使用綠、藍、橘、紅
- 登入與申請視覺一致
- 不依賴外部圖片
- 不使用付費字型

# 十八、完整檔案結構

至少輸出：

```text
pain-management-system-complete/
├── README.md
├── MASTER-BUILD-PROMPT.md
├── SYSTEM-ARCHITECTURE.md
├── SUPABASE-SETUP-GUIDE.md
├── index.html
├── preview.html
├── user.html
├── admin.html
├── start-server.command
├── start-server.bat
├── css/
│   └── style.css
├── js/
│   ├── runtime-config.js
│   ├── config.js
│   ├── common.js
│   ├── demo-data.js
│   ├── local-storage-service.js
│   ├── supabase-service.js
│   ├── data-service.js
│   ├── auth-service.js
│   ├── index.js
│   ├── preview.js
│   ├── user.js
│   └── admin.js
└── sql/
    ├── 01-setup.sql
    ├── 02-set-first-user-admin.sql
    ├── 03-check-setup.sql
    ├── 04-account-diagnostics.sql
    └── 05-role-management.sql
```

同時輸出完整 ZIP。

# 十九、教學文件順序

`SUPABASE-SETUP-GUIDE.md` 必須適合初學者完整照做，包含：

1. Python 檢查與替代啟動方式。
2. 建立 Supabase Project。
3. Email Provider 設定。
4. 開啟 Allow new users to sign up。
5. 關閉 Confirm email。
6. 執行 `01-setup.sql`。
7. 取得 Project URL 與 Publishable key。
8. 完整替換 `runtime-config.js`。
9. 啟動 port 5000。
10. 從前端申請第一個帳號。
11. 執行 `02-set-first-user-admin.sql`。
12. 登出並重新登入管理者。
13. 申請一般使用者。
14. 執行 `03-check-setup.sql`。
15. 測試一般使用者新增疼痛評估。
16. 明確說明使用者不需要輸入個案代碼。
17. 測試管理者處置。
18. 測試管理者複評。
19. 測試使用者資料隔離。
20. 測試頁面角色保護。
21. 教學修改 user/admin 角色。
22. 教學使用帳號診斷 SQL。
23. 教學排除 429 email rate limit。
24. 教學排除 Python、port 5000、快取、RLS、Trigger 與 profile 問題。

# 二十、驗收標準

必須檢查：

- [ ] index.html 可切換登入與申請
- [ ] 使用者可從前端建立帳號
- [ ] 帳號出現在 Authentication
- [ ] profile 自動建立
- [ ] profile role 預設為 user
- [ ] user 導向 user.html
- [ ] admin 導向 admin.html
- [ ] 使用者不能自行選 admin
- [ ] 使用者不能修改自己的 role
- [ ] 管理者可由後台設定
- [ ] 每位使用者有自己的 UUID
- [ ] 使用者表單沒有個案代碼
- [ ] 使用者紀錄沒有個案代碼
- [ ] 管理者列表與篩選沒有個案代碼
- [ ] case_code 由資料庫 Trigger 自動補值
- [ ] 前端新增資料不傳 case_code
- [ ] 每位使用者只能看到自己的紀錄
- [ ] 管理者可以看到全部紀錄
- [ ] 疼痛評估可寫入 Supabase
- [ ] 處置可儲存
- [ ] 複評可儲存
- [ ] 使用者可查看處置與複評
- [ ] 一般使用者不可進入 admin.html
- [ ] 未登入者不可進入保護頁面
- [ ] preview 模式只使用 localStorage
- [ ] 正式模式沒有寫死範例 Email
- [ ] 同一頁只建立一個 Supabase Auth Client
- [ ] RLS 保持啟用
- [ ] 瀏覽器沒有 Secret key
- [ ] localhost:5000 可完整操作
- [ ] 所有 JavaScript 通過語法檢查
- [ ] 所有 HTML 引用檔案存在
- [ ] ZIP 可正常解壓縮
- [ ] Markdown 只保留四份核心文件

# 二十一、本階段不製作

- 雙重角色
- 同帳號切換 user/admin
- 前端申請管理者
- 前端角色管理頁
- 忘記密碼
- 正式 Email 驗證流程
- 手機簡訊驗證
- Google 登入
- 正式部署
- 正式網域
- 真實醫療資料
- 院內系統串接
- 多機構
- 多個案代填
- 稽核軌跡
- AI API

# 二十二、Token 說明

請明確說明：

1. 此 HTML／Supabase 系統沒有串接生成式 AI API。
2. 正常操作消耗 0 個 OpenAI／Gemini Token。
3. Supabase Auth 與 Database 請求不是 LLM Token。
4. AI 對話精確 Token 使用量若平台未顯示，模型不能捏造。
5. 可以提供粗略估算，但必須標示為估算。

請直接建立完整可執行專案、完整 SQL、四份核心文件與 ZIP。

不要只輸出規格。

不要只輸出程式碼片段。

不要要求我先建立空白檔案。

不要要求我自行修改某幾行。

所有更新請提供完整可替換檔案。

## Prompt 結束
