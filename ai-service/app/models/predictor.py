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
        self.mock_mode = False

        try:
            self.fmri_model, self.ml_model, self.prep = self.load_models()
            print("✅ Real AI models loaded successfully")

        except Exception as e:
            print("⚠️ Failed to load real models")
            print(e)

            print("🚀 Starting in MOCK MODE")

            self.mock_mode = True
            self.fmri_model = None
            self.ml_model = None
            self.prep = None

    @staticmethod
    def load_models():
        base_path = os.path.join(os.getcwd(), "model")

        fmri_model = tf.keras.models.load_model(
            os.path.join(base_path, "best_fmri_model.keras")
        )

        with open(os.path.join(base_path, "best_ml_model.pkl"), "rb") as f:
            ml_model = pickle.load(f)

        with open(os.path.join(base_path, "preprocessing.pkl"), "rb") as f:
            prep = pickle.load(f)

        return fmri_model, ml_model, prep

    def predict(self, file_bytes: bytes) -> dict:

        # =========================
        # MOCK MODE
        # =========================
        if self.mock_mode:
            return {
                "diagnosis": "CONTROL",
                "confidence": 0.97,
                "all_scores": {
                    "CONTROL": 0.97,
                    "SCHIZOPHRENIA": 0.01,
                    "BIPOLAR": 0.01,
                    "ADHD": 0.01
                },
                "mode": "mock"
            }

        # =========================
        # REAL MODEL MODE
        # =========================

        with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            nii = nib.load(tmp_path)
            data = nii.get_fdata(dtype=np.float32)
        finally:
            os.unlink(tmp_path)

        vol = np.mean(data, axis=3) if data.ndim == 4 else data

        target = self.prep["cnn_input_shape"]

        zf = [target[i] / vol.shape[i] for i in range(3)]
        vol = zoom(vol, zf, order=1)

        vol = (vol - self.prep["fmri_mean"]) / self.prep["fmri_std"]

        vol_input = vol[np.newaxis, ..., np.newaxis]

        fmri_proba = self.fmri_model.predict(vol_input, verbose=0)[0]

        fmri_pred = int(np.argmax(fmri_proba))

        return {
            "diagnosis": self.CLASS_NAMES[fmri_pred],
            "confidence": round(float(fmri_proba[fmri_pred]), 4),
            "all_scores": {
                name: round(float(prob), 4)
                for name, prob in zip(self.CLASS_NAMES, fmri_proba)
            },
            "mode": "real"
        }


predictor = BrainFMRIPredictor()