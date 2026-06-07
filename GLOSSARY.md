# GLOSSARY / 專業術語對照表 (林業技術高普考學習系統)

本文件定義 `Forestry-Technology-exam` 專案中所使用的專業術語，以確保命名、變數與邏輯的一致性。

| 中文名稱 | 英文名稱 | 代碼變數/路徑名稱 | 定義與說明 |
| :--- | :--- | :--- | :--- |
| **林業技術學習系統** | Forestry Technology Exam System | `Forestry-Technology-exam` | 本專案之根目錄名稱與應用程式主體 |
| **森林生態學** | Forest Ecology | `forest-ecology` | 包含保育，高考專業科目之一 |
| **育林學** | Silviculture | `silviculture` | 高考/普考專業科目之一 |
| **森林經營學** | Forest Management | `forest-management` | 高考/普考專業科目之一 |
| **林產學** | Forest Products | `forest-products` | 高考/普考專業科目之一 |
| **題目資料庫** | Questions Database | `questions_db.js` | 儲存結構化申論題目（包含年份、科目、題號、題目內文）的 JavaScript 檔案 |
| **大綱與解答資料庫** | Answers & Outlines Database | `answers_db.js` | 儲存考選部公布之答題標準或 LLM 生成之參考大綱與評分要點的資料庫 |
| **申論試題爬蟲** | Moex Essay Crawler | `download_moex_essays.py` | 用於至考選部下載 110~114 年「林業技術」高普考申論題 PDF 的 Python 腳本 |
| **申論試題解析器** | Essay Parser | `parse_essays.py` | 用於解析 PDF 內容、將試題結構化，並透過 LLM 生成參考答題大綱的 Python 腳本 |
| **學習門戶** | Study Portal | `study_portal.html` | 前端單網頁應用程式 (SPA)，提供歷年考題瀏覽、個人擬答輸入、AI 答題評估等介面 |
| **AI 智慧評估引擎** | AI Evaluation Engine | `ai_evaluator.js` | 調用 Gemini API 對使用者輸入之申論擬答進行大綱比對、評估與給予回饋的分支模組 |
