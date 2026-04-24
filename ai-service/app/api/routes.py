from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.predictor import predictor

router = APIRouter()

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Endpoint appelé par le backend Spring Boot"""
    if not file.content_type.startswith("image/") and not file.filename.lower().endswith(".dcm"):
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez JPEG, PNG ou DICOM.")
    
    image_bytes = await file.read()
    try:
        result = predictor.predict(image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'analyse IA : {str(e)}")