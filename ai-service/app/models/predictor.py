import tensorflow as tf
import pickle
import numpy as np
import nibabel as nib
from scipy.ndimage import zoom
import tempfile
import os

class BrainFMRIPredictor:
    CLASS_NAMES = ["CONTROL", "SCHIZOPHRENIA", "BIPOLAR", "ADHD"]

    def __init__(self):
        self.fmri_model, self.ml_model, self.prep = self.load_models()

    @staticmethod
    def load_models():
        fmri_model = tf.keras.models.load_model("best_fmri_model.keras")
        
        with open("best_ml_model.pkl", "rb") as f:
            ml_model = pickle.load(f)
        
        with open("preprocessing.pkl", "rb") as f:
            prep = pickle.load(f)
        
        return fmri_model, ml_model, prep

    def predict(self, file_bytes: bytes) -> dict:
        # Création d'un fichier temporaire pour nibabel
        with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            nii = nib.load(tmp_path)
            data = nii.get_fdata(dtype=np.float32)
        finally:
            os.unlink(tmp_path)

        # Préprocessing identique à ton app.py Streamlit
        vol = np.mean(data, axis=3) if data.ndim == 4 else data
        target = self.prep["cnn_input_shape"]
        zf = [target[i] / vol.shape[i] for i in range(3)]
        vol = zoom(vol, zf, order=1)
        vol = (vol - self.prep["fmri_mean"]) / self.prep["fmri_std"]
        vol_input = vol[np.newaxis, ..., np.newaxis]

        # Prédiction
        fmri_proba = self.fmri_model.predict(vol_input, verbose=0)[0]
        fmri_pred = int(np.argmax(fmri_proba))

        return {
            "diagnosis": self.CLASS_NAMES[fmri_pred],
            "confidence": round(float(fmri_proba[fmri_pred]), 4),
            "all_scores": {
                name: round(float(prob), 4)
                for name, prob in zip(self.CLASS_NAMES, fmri_proba)
            }
        }


# Chargement du modèle au démarrage
predictor = BrainFMRIPredictor()