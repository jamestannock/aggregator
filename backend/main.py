from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.extract import router as extract_router

app = FastAPI(title="Aggregator API", version="1.0.0")

# CORS: allow Vite dev server + future prod origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",                    # <-- tighten before prod
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract_router)
