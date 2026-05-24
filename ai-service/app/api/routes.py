from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.predictor import predictor

router = APIRouter()

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Endpoint appelé par le backend Spring Boot. Accepte uniquement .nii.gz"""
    filename = (file.filename or "").lower()
    if not (filename.endswith(".nii.gz") or filename.endswith(".nii")):
        raise HTTPException(
            status_code=400,
            detail="Format non supporté. Utilisez NIfTI (.nii.gz ou .nii)."
        )

    image_bytes = await file.read()
    try:
        result = predictor.predict(image_bytes, file.filename or "scan.nii.gz")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'analyse IA : {str(e)}")