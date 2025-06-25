import os
from flask import Flask, render_template, request
from openai import OpenAI
import pdfplumber
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# —— Configure your OpenAI client —— 
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def load_legislation_texts(folder="SFV Legislation"):
    texts = []
    for fname in os.listdir(folder):
        if fname.lower().endswith(".pdf"):
            path = os.path.join(folder, fname)
            with pdfplumber.open(path) as pdf:
                texts.append(
                    "\n\n".join(page.extract_text() or "" for page in pdf.pages)
                )
    return texts

def extract_obligations(company_desc):
    # —— STUB: replace with PDF-chunking + FAISS/semantic search + GPT prompt
    prompt = (
        f"Company description:\n{company_desc}\n\n"
        "Scan relevant legislation and list the top 5 regulatory obligations "
        "that would apply to this company. Provide each as a short sentence."
    )
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    text = resp.choices[0].message.content
    return [line.strip() for line in text.splitlines() if line.strip()]

@app.route("/", methods=["GET", "POST"])
def index():
    obligations = None
    if request.method == "POST":
        desc = request.form.get("company_desc", "").strip()
        if desc:
            obligations = extract_obligations(desc)
    return render_template("index.html", obligations=obligations)

if __name__ == "__main__":
    # Accessible only on localhost by default
    app.run(host="127.0.0.1", port=5000, debug=True)
