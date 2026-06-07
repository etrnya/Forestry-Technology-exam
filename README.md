# 🌲 林業技術歷屆申論試題學習與評估系統

本系統是專為準備**公務人員高普考「林業技術」類科**考生設計的歷屆申論題練習與 AI 評估系統。系統包含自動化考題下載爬蟲、試題文字結構化解析，以及基於 Gemini API 驅動的 **AI 申論答題大綱評估引擎**。

---

## 🚀 系統核心特色

1. **歷屆申論題庫瀏覽**：完整收錄近年考選部高普考專業核心科目試題。
2. **AI 提示答題大綱**：提供各學科核心解題切入點提示，引導考生思考。
3. **個人擬答輸入與 LocalStorage 存檔**：支援離線擬答草稿儲存。
4. **AI 智慧評審與打分**：整合大語言模型自動比對核心概念覆蓋率，並針對邏輯架構與論述深度給予評分與具體改善建議。
5. **Midnight Cosmic / Forest Green 霓虹視覺設計**：精美磨砂玻璃質感介面，提升備考專注力。

---

## 📂 專案目錄結構

* `downloads/moex/`：存放考選部原始申論題 PDF 檔案（已被 `.gitignore` 排除，保持倉庫精簡）。
* `download_moex_essays.py`：國家考試考畢試題 PDF 爬蟲下載器。
* `parse_essays.py`：PDF 試題解析器，負責文字切割與 LLM 參考答題大綱生成。
* `questions_db.js`：已結構化之試題資料庫。
* `answers_db.js`：對應的答題關鍵字與參考大綱資料庫。
* `study_portal.html` / `index.html`：單網頁應用程式 (SPA) 模擬測驗門戶。
* `GLOSSARY.md`：本專案專業術語定義。
* `RPD.md`：需求與系統設計規格說明書。

---

## 🛠️ 下載與環境安裝

### 1. 複製倉庫
```bash
git clone https://github.com/etrnya/Forestry-Technology-exam.git
cd Forestry-Technology-exam
```

### 2. 安裝 Python 依賴
```bash
pip install requests beautifulsoup4 playwright pdfplumber python-dotenv google-genai
playwright install
```

### 3. 配置環境變數
於根目錄建立 `.env` 檔案並填入您的 Gemini API 密鑰：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🔄 快速開始

### 第一步：下載歷屆考題 PDF
```bash
python download_moex_essays.py
```

### 第二步：解析 PDF 並生成結構化題庫
```bash
python parse_essays.py
```

### 第三步：開啟學習門戶
在瀏覽器中直接開啟 `study_portal.html`，即可開始瀏覽與進行 AI 答題評估練習！

---

## ⚖️ 著作權與智慧財產權宣告
* 本系統原始考題與官方公佈解答之著作權歸屬**中華民國考選部**所有。
* 本專案原始碼與 AI 評估引擎遵循 [MIT License](LICENSE) 條款開源分享。
