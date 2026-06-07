import os
import re
import json
import sys
import time
import pypdf
from dotenv import load_dotenv

# 強制 stdout 使用 UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# 載入環境變數
load_dotenv()

MOEX_DIR = "downloads/moex"
OUTPUT_QUESTIONS_JS = "questions_db.js"
OUTPUT_ANSWERS_JS = "answers_db.js"

# 4 大專業考科對照表
SUBJECT_NAME_MAP = {
    "forest-ecology": "森林生態學",
    "silviculture": "育林學",
    "forest-management": "森林經營學",
    "forest-products": "林產學",
    "ecology-management": "森林生態學與森林經營學"
}

# 標籤關鍵字字典，用於本地輔助貼標
TAGS_KEYWORDS = {
    "生態學": ["生態", "演替", "氣候", "演化", "群落", "多樣性", "食物網", "棲地", "保育", "林火", "擾動"],
    "育林學": ["育林", "苗木", "造林", "撫育", "疏伐", "採種", "無性繁殖", "扦插", "整地", "林分", "更新"],
    "經營學": ["經營", "收穫", "測樹", "生長量", "碳吸存", "永續", "林道", "遙測", "GIS", "森林計畫", "估價"],
    "林產學": ["林產", "木材", "纖維", "製漿", "乾燥", "防腐", "塗裝", "力學", "物理性質", "化學性質", "竹材"]
}

gemini_client = None

def init_llm():
    global gemini_client
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("[ERROR] 未在環境變數中找到 GEMINI_API_KEY。請於根目錄 .env 檔案中設定。")
        sys.exit(1)
        
    try:
        from google import genai
        gemini_client = genai.Client(api_key=gemini_key)
        print("[INFO] 已成功初始化 Gemini 2.5 引擎。")
    except ImportError:
        print("[ERROR] 未安裝 google-genai 套件，請先執行 pip install google-genai")
        sys.exit(1)

def ask_gemini_for_structure(subject, question_text):
    """呼叫 Gemini 對申論題進行核心剖析，產生提示大綱、關鍵字與擬答要點"""
    prompt = f"""
    你是一位台灣林業技術高普考的專家。請針對以下「{subject}」學科的申論題進行深度解析：
    
    【題目】
    {question_text}
    
    請以繁體中文分析並回傳一個 JSON 物件，格式必須嚴格如下：
    {{
      "difficulty": "中等",
      "tags": ["關鍵字1", "關鍵字2"],
      "ai_hints": [
        "第一部分：寫作要點提示...",
        "第二部分：寫作要點提示..."
      ],
      "key_concepts": ["核心名詞1", "核心名詞2", "核心名詞3"],
      "standard_outline": [
        "1. 解題大綱步驟一...",
        "2. 解題大綱步驟二...",
        "3. 解題大綱步驟三..."
      ]
    }}
    
    規則：
    1. difficulty: 只能是 "易"、"中等"、"難" 之一。
    2. tags: 2-3 個與此題領域最相關的學科分支標籤。
    3. ai_hints: 考生在作答本題時，AI 應給予考生哪些引導思考的大綱提示（2-4 個步驟提示）。
    4. key_concepts: 評分委員最看重、本題答案必須涵蓋的核心學術名詞（3-5 個名詞）。
    5. standard_outline: 建議的標準作答架構與子標題規劃（3-5 個要點）。
    """
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "Quota exceeded" in err_msg:
                sleep_sec = 30 * (attempt + 1)
                print(f"  [WARN] 頻率限制 (429)。等待 {sleep_sec} 秒後重試...")
                time.sleep(sleep_sec)
                continue
            else:
                print(f"  [WARN] Gemini API 呼叫失敗: {e}")
                return None
    return None

def extract_questions_from_pdf(pdf_path):
    """從 PDF 中提取文字，並以國字數字（一、二、三、四）切割申論題"""
    try:
        reader = pypdf.PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
                
        # 清除考選部浮水印或標頭雜訊
        lines = full_text.split("\n")
        cleaned_lines = []
        for line in lines:
            if re.search(r"代號：|頁次：|注意：|等 考 試|類 科：|科 目：|考試時間：|等考試", line):
                continue
            cleaned_lines.append(line)
        cleaned_text = "\n".join(cleaned_lines)
        
        # 使用台灣國考標準題號 (一、二、三、四、五) 進行分割
        pattern = r"\n\s*(一|二|三|四|五)\s*、\s*(.*?)(?=\n\s*(?:一|二|三|四|五)\s*、|\Z)"
        matches = re.findall(pattern, "\n" + cleaned_text, re.DOTALL)
        
        questions = []
        for q_num_cn, q_content in matches:
            # 將中文數字轉為阿拉伯數字
            cn_map = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5}
            q_num = cn_map.get(q_num_cn.strip(), 1)
            
            # 清理題目文字中的多餘空行
            clean_q = re.sub(r"\s+", " ", q_content).strip()
            # 移除分數標記，如 (25分) 或 (二十分)
            clean_q = re.sub(r"\(\s*\d+\s*分\s*\)", "", clean_q)
            clean_q = re.sub(r"（\s*\d+\s*分\s*）", "", clean_q)
            clean_q = clean_q.strip()
            
            questions.append((q_num, clean_q))
            
        return questions
    except Exception as e:
        print(f"  [ERROR] 解析 PDF 失敗 {pdf_path}: {e}")
        return []

def main():
    print("=" * 60)
    print("[INFO] 林業技術申論試題結構化解析器啟動...")
    print("=" * 60)
    
    init_llm()
    
    # 載入既有快取 (避免重複呼叫 Gemini 浪費 Token)
    cached_questions = {}
    cached_answers = {}
    if os.path.exists(OUTPUT_QUESTIONS_JS) and os.path.exists(OUTPUT_ANSWERS_JS):
        try:
            with open(OUTPUT_QUESTIONS_JS, "r", encoding="utf-8") as f:
                content = f.read()
                # 提取 JSON 欄位
                json_str = content.split("const questions_db = ")[1].split(";")[0].strip()
                q_list = json.loads(json_str)
                for q in q_list:
                    cached_questions[q["id"]] = q
            with open(OUTPUT_ANSWERS_JS, "r", encoding="utf-8") as f:
                content = f.read()
                json_str = content.split("const answers_db = ")[1].split(";")[0].strip()
                ans_map = json.loads(json_str)
                cached_answers = ans_map
            print(f"[INFO] 已載入既有快取 (試題: {len(cached_questions)} 筆，解答: {len(cached_answers)} 筆)")
        except Exception as e:
            print(f"[WARN] 快取載入失敗，將重新生成: {e}")
            
    files = sorted(os.listdir(MOEX_DIR))
    all_questions = []
    all_answers = {}
    
    for f in files:
        if not (f.startswith("moex-") and f.endswith("-question.pdf")):
            continue
            
        # 檔名解析: moex-{year}-{level}-{session}-{subject_code}-question.pdf
        match = re.search(r"moex-(\d+)-(high|normal)-(\d+)-([a-z-]+)-question\.pdf", f)
        if not match:
            continue
            
        year = int(match.group(1))
        level_code = match.group(2)
        session = int(match.group(3))
        subject_code = match.group(4)
        
        level_name = "高考三級" if level_code == "high" else "普通考試"
        subject_name = SUBJECT_NAME_MAP.get(subject_code, "未分類")
        
        pdf_path = os.path.join(MOEX_DIR, f)
        print(f"\n[+] 正在處理: {f} ({year}年 | {level_name} | {subject_name})")
        
        # 提取試題
        extracted = extract_questions_from_pdf(pdf_path)
        if not extracted:
            print("  [WARN] 未提取到任何題目，跳過。")
            continue
            
        print(f"  成功提取到 {len(extracted)} 道申論題，進行結構化建置...")
        
        for q_num, question_text in extracted:
            q_id = f"moex-{year}-{level_code}-{session}-{subject_code}-{q_num:02d}"
            
            # 優先採用快取
            if q_id in cached_questions and q_id in cached_answers:
                print(f"  [-] 題目 {q_id} 命中快取，跳過 API 呼叫。")
                all_questions.append(cached_questions[q_id])
                all_answers[q_id] = cached_answers[q_id]
                continue
                
            print(f"  [+] 正在分析第 {q_num} 題 -> {question_text[:25]}...")
            
            # 呼叫 Gemini 分析大綱與核心要點
            llm_result = ask_gemini_for_structure(subject_name, question_text)
            
            if not llm_result:
                print("  [ERROR] Gemini 評估失敗，跳過此題。")
                continue
                
            # 重構試題結構
            q_entry = {
                "id": q_id,
                "year": year,
                "session": session,
                "subject": subject_name,
                "subject_code": subject_code,
                "category": level_name,
                "q_num": q_num,
                "question": question_text,
                "tags": llm_result.get("tags", [subject_name]),
                "difficulty": llm_result.get("difficulty", "中等"),
                "ai_hints": llm_result.get("ai_hints", [])
            }
            
            ans_entry = {
                "key_concepts": llm_result.get("key_concepts", []),
                "standard_outline": llm_result.get("standard_outline", [])
            }
            
            all_questions.append(q_entry)
            all_answers[q_id] = ans_entry
            
            # 隨機延遲避免觸發 API 上限
            time.sleep(1.0)
            
    # 寫入輸出 JavaScript 檔案
    print(f"\n[INFO] 解析完成！共處理 {len(all_questions)} 筆申論試題。正在寫入檔案...")
    
    with open(OUTPUT_QUESTIONS_JS, "w", encoding="utf-8") as f:
        f.write("/* eslint-disable */\n")
        f.write("const questions_db = ")
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
        f.write(";\n\nif (typeof module !== 'undefined') { module.exports = { questions_db }; }\n")
        
    with open(OUTPUT_ANSWERS_JS, "w", encoding="utf-8") as f:
        f.write("/* eslint-disable */\n")
        f.write("const answers_db = ")
        json.dump(all_answers, f, ensure_ascii=False, indent=2)
        f.write(";\n\nif (typeof module !== 'undefined') { module.exports = { answers_db }; }\n")
        
    print("[OK] questions_db.js 與 answers_db.js 寫入成功！")

if __name__ == "__main__":
    main()
