### Quick Start (local)
```bash
# /Users/jamestannock/Desktop/Applications/aggregator/backend noting we are hare
python3 -m venv .venv
source .venv/bin/activate
uvicorn main:app --reload

# front-end
cd frontend
npm install 
npm run dev
