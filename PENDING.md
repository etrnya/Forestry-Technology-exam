# PENDING.md (林業技術歷屆申論試題學習與評估系統待辦清單)

本清單用於追蹤 `Forestry-Technology-exam` 專案的開發與測試進度。

最後更新：2026-06-07 20:00

---

## 📅 開發進度

- [x] **第一階段：基礎設定與規劃確認**
  - [x] 建立 [GLOSSARY.md](file:///C:/Users/etrny/.gemini/antigravity/scratch/Forestry-Technology-exam/GLOSSARY.md) (字典先行)
  - [x] 建立正式的 [RPD.md](file:///C:/Users/etrny/.gemini/antigravity/scratch/Forestry-Technology-exam/RPD.md)
  - [x] 建立 `LICENSE` (MIT 授權條款) 與 `README.md` 說明文件
  - [x] 初始化專案 Git 版本控制，並建立工作分支 `feat/第一階段-基礎設定與規劃確認`

- [x] **第二階段：自動化題庫爬取與下載**
  - [x] 撰寫 `download_moex_essays.py` 使用 BeautifulSoup 至考選部下載 110~114 年林業技術高普考 4 大專業科目之申論試題 PDF

- [/] **第三階段：申論題提取與大綱生成**
  - [x] 撰寫 `parse_essays.py` 提取 PDF 申論題文字並完成結構化分割
  - [ ] 整合 LLM 針對每道申論題生成「參考答題大綱」、「評分要點」與「核心關鍵字」，輸出為 `questions_db.js` 與 `answers_db.js` (背景進行中)

- [/] **第四階段：前端申論題學習門戶與 AI 智慧評估實作**
  - [x] 移植並調整 `study_portal.html` 的色系（調整為自然森林綠），修改選單結構
  - [x] 實作「歷屆申論題庫瀏覽」與「篩選」面板（按年份、科目篩選）
  - [x] 實作「擬答大綱輸入」區塊與本地 LocalStorage 快取機制
  - [x] 整合 Gemini & DeepSeek API 實作「AI 智慧答題評估器」：自動比對擬答大綱，針對核心概念覆蓋度、邏輯架構與論述深度進行打分與回饋 (等待最終整合測試)


- [ ] **第五階段：收工與同步驗證**
  - [ ] 進行 Pre-Commit 安全門禁與 Lint 驗證
  - [ ] 同步更新全域總帳並將專案推送至 GitHub

---

## 🧪 測試結果
* 尚無 (Pending)
