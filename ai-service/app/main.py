from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title="NeuroDetect AI Service",
    description="Microservice d'analyse IRM par Intelligence Artificielle",
    version="1.0.0"
)

# CORS : important pour que Spring Boot et React puissent appeler le service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # À restreindre plus tard en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)