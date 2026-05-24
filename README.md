# NeuroDetect — Détection de maladies neurologiques par IRM

Application web médicale full-stack permettant l'analyse d'IRM cérébrales (fMRI) par intelligence artificielle. Le modèle CNN classe chaque scan dans l'une des quatre catégories :

| Classe | Description |
|---|---|
| `CONTROL` | Sujet sain |
| `SCHIZOPHRENIA` | Schizophrénie détectée |
| `BIPOLAR` | Trouble bipolaire détecté |
| `ADHD` | TDAH détecté |

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Query |
| Backend | Spring Boot 4, Java 17, Spring Security + JWT, Flyway |
| AI Service | Python 3.11, FastAPI, TensorFlow 2.18, scikit-learn, NiBabel |
| Base de données | PostgreSQL 15 |
| Infrastructure | Docker, Docker Compose |

---

## Architecture

```
Navigateur (React)
       │  HTTP :3001
       ▼
  Backend API  ──────────────► AI Service
  Spring Boot                   FastAPI
  :8082                         :8000
       │
       ▼
  PostgreSQL
  :5432
```

Les trois services communiquent sur le réseau Docker `app-net` via leurs noms de conteneurs (`backend`, `ai-service`, `postgres`).

---

## Lancer l'application

### Prérequis

- **Docker Desktop** installé et démarré — c'est le seul outil nécessaire

### Étape 1 — Cloner le dépôt

```bash
git clone <url-du-repo>
cd neuro-detect
```

### Étape 2 — Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ouvrir `.env` et remplir les deux valeurs :

```
DB_PASSWORD=un_mot_de_passe_fort
JWT_SECRET=une_chaine_tres_longue_et_aleatoire_min_32_caracteres
```

### Étape 3 — Placer les fichiers modèle IA

> **Important** : les fichiers modèle (`.keras`, `.pkl`) ne sont **pas** inclus dans le dépôt Git car ils sont trop volumineux (plusieurs centaines de Mo).

Les placer manuellement dans :

```
ai-service/app/model/
```

Structure attendue :

```
ai-service/
└── app/
    └── model/
        ├── model.keras      ← modèle CNN TensorFlow
        └── scaler.pkl       ← scaler scikit-learn
```

Si les fichiers sont absents, le service bascule automatiquement en **mode mock** : il retourne des prédictions simulées, ce qui permet de développer le frontend et le backend sans les vrais modèles.

### Étape 4 — Lancer tous les services

```bash
docker-compose up --build
```

Le premier build télécharge toutes les dépendances (TensorFlow ~600 Mo) — prévoir 10–20 minutes selon la connexion. Les builds suivants sont beaucoup plus rapides grâce au cache Docker.

### URLs d'accès

| Service | URL |
|---|---|
| Application web (frontend) | http://localhost:3001 |
| API backend | http://localhost:8082 |
| AI service | http://localhost:8000 |
| Documentation AI (Swagger) | http://localhost:8000/docs |

---

## Premier démarrage — Créer le compte Administrateur

La base de données est vide au premier lancement. Il faut insérer un compte ADMIN manuellement via SQL.

**1. Se connecter au conteneur PostgreSQL :**

```bash
docker exec -it neurodetect-postgres psql -U postgres -d neurodetect
```

**2. Insérer l'administrateur :**

```sql
INSERT INTO users (email, password, full_name, role, is_active)
VALUES (
  'admin@neurodetect.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lOXu',
  'Administrateur',
  'ADMIN',
  true
);
```

> Le hash correspond au mot de passe `admin123`. Le changer en production via un générateur BCrypt (cost 10).

**3. Se connecter sur http://localhost:3001 avec :**
- Email : `admin@neurodetect.com`
- Mot de passe : `admin123`

---

## Rôles et permissions

| Action | ADMIN | MEDECIN |
|---|:---:|:---:|
| Créer des comptes médecin | ✓ | |
| Activer / désactiver un compte | ✓ | |
| Voir le dashboard avec statistiques | ✓ | |
| Gérer les patients (CRUD) | | ✓ |
| Uploader et analyser une IRM | | ✓ |
| Générer et télécharger un rapport PDF | | ✓ |
| Consulter la liste des rapports | ✓ | ✓ |

**Workflow normal :**
1. L'ADMIN se connecte et crée les comptes médecin via la page Admin
2. Chaque MEDECIN se connecte et crée ses patients
3. Le MEDECIN uploade un fichier IRM (`.nii` ou `.nii.gz`) depuis la page Upload
4. L'IA analyse le scan et retourne le diagnostic avec les scores de confiance
5. Le MEDECIN génère un rapport PDF depuis la fiche patient ou la page Upload
6. Les rapports sont téléchargeables et consultables dans la page Reports

---

## Fonctionnalités implémentées

| Feature | Description |
|---|---|
| **F1 — Authentification** | Login JWT, sessions stateless, protection des routes par rôle |
| **F2 — Gestion patients** | CRUD complet, recherche, pagination, suppression en cascade |
| **F3 — Analyse IRM** | Upload `.nii`/`.nii.gz`, appel à l'AI service, affichage des scores par classe |
| **F4 — Rapports PDF** | Génération iTextPDF, nommage `rapport_nom_prenom_N.pdf`, téléchargement |
| **F5 — Dashboard & Admin** | KPI cards, graphiques (analyses/mois, distribution diagnostics), gestion utilisateurs |

---

## Pour les développeurs

> Cette section est optionnelle. Elle permet de modifier le code sans Docker, en lançant chaque service séparément.

### Prérequis

- Java 17 + Maven
- Node.js 20+
- Python 3.11
- PostgreSQL local (ou garder le conteneur Docker : `docker-compose up postgres`)

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Créer `frontend/.env.local` :
```
VITE_API_URL=http://localhost:8082
```

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Nécessite un PostgreSQL sur `localhost:5432` avec la base `neurodetect`. Les migrations Flyway s'appliquent automatiquement au démarrage.

### AI Service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
