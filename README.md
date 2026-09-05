# NeuroDetect — Détection de maladies neurologiques par IRM

Application web médicale full-stack pour l'analyse d'IRM cérébrales fonctionnelles (fMRI) par intelligence artificielle. Un modèle CNN (TensorFlow) classe chaque scan dans l'une des quatre catégories :

| Classe | Signification |
|---|---|
| `CONTROL` | Sujet sain |
| `SCHIZOPHRENIA` | Schizophrénie |
| `BIPOLAR` | Trouble bipolaire |
| `ADHD` | TDAH |

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Query |
| Backend | Spring Boot 4, Java 17, Spring Security + JWT, Flyway |
| AI Service | Python 3.11, FastAPI, TensorFlow 2.18, scikit-learn, NiBabel |
| Base de données | PostgreSQL 15 |
| Infrastructure | Docker Compose |

---

## Architecture

```
Navigateur (React / Vite)
        │  http://localhost:3001
        ▼
  Backend API  ───────────────►  AI Service
  Spring Boot   http://ai-service:8000   FastAPI
  :8082                                  :8000
        │
        ▼
   PostgreSQL
   :5432
```

Les quatre conteneurs communiquent sur le réseau Docker `app-net` via leurs noms (`postgres`, `backend`, `ai-service`, `frontend`).

---

## TL;DR — lancer en 4 étapes

> Prérequis : **Docker Desktop** installé et démarré.

```bash
# 1. Récupérer le projet
git clone <url-du-repo> && cd neuro-detect

# 2. Créer le fichier de secrets (Windows : copy .env.example .env)
cp .env.example .env        # puis éditer DB_PASSWORD et JWT_SECRET

# 3. Tout lancer (premier build : 10-20 min)
docker compose up --build
```

```bash
# 4. Dans un AUTRE terminal, créer le compte admin (une seule fois)
docker exec -it neurodetect-postgres psql -U postgres -d neurodetect
```

Puis coller dans l'invite `psql`, et quitter avec `\q` :

```sql
INSERT INTO users (email, password, full_name, role, is_active)
VALUES ('admin@neurodetect.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lOXu',
        'Administrateur', 'ADMIN', true);
```

Ouvrir **http://localhost:3001** → se connecter avec `admin@neurodetect.com` / `admin123`.

> Détail de chaque étape dans les sections ci-dessous.

---

## Prérequis

Le seul logiciel requis est :

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** installé et **démarré**
- **Git** (pour cloner le dépôt)

Ressources conseillées sur la machine :

- ~6 Go d'espace disque libre (images Docker, TensorFlow inclus)
- 8 Go de RAM (le service IA réserve 2 Go, plafond 4 Go)

> Aucune installation de Java, Node ou Python n'est nécessaire pour lancer l'application : tout tourne dans Docker.

---

## Démarrage rapide

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd neuro-detect
```

### 2. Créer le fichier `.env`

```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```

Ouvrir `.env` et renseigner les deux variables :

```dotenv
DB_PASSWORD=un_mot_de_passe_fort
JWT_SECRET=une_chaine_aleatoire_de_32_caracteres_minimum
```

> Le `docker-compose.yml` fournit des valeurs par défaut : l'application démarre même sans `.env`, mais **créez-le quand même** pour ne pas utiliser les secrets par défaut.

### 3. Les modèles IA

Les fichiers du modèle sont **déjà inclus dans le dépôt** (`ai-service/model/`, ~13 Mo) :

```
ai-service/model/
├── best_fmri_model.keras   ← modèle CNN TensorFlow
├── best_ml_model.pkl       ← modèle scikit-learn
└── preprocessing.pkl       ← paramètres de prétraitement
```

Rien à télécharger. Si ces fichiers sont absents ou corrompus, le service IA bascule
automatiquement en **mode mock** (prédictions simulées) : l'application reste utilisable
pour tester le frontend et le backend.

### 4. Lancer toute la stack

```bash
docker compose up --build
```

Le **premier build** télécharge toutes les dépendances (image TensorFlow ~600 Mo) :
comptez **10 à 20 minutes** selon la connexion. Les lancements suivants prennent quelques secondes grâce au cache Docker.

L'application est prête quand les logs affichent que le backend écoute sur `:8082` et le frontend sur `:5173`.

### 5. URLs d'accès

| Service | URL |
|---|---|
| Application web | http://localhost:3001 |
| API backend | http://localhost:8082 |
| Service IA | http://localhost:8000 |
| Swagger (doc API IA) | http://localhost:8000/docs |

Pour arrêter : `Ctrl+C`, puis `docker compose down` (ajouter `-v` pour supprimer aussi la base de données).

---

## Premier lancement — créer le compte administrateur

La base est vide au démarrage et il n'existe **aucun compte par défaut**. La création
de nouveaux comptes passe par un ADMIN, il faut donc insérer le premier ADMIN
directement en base.

**1. Ouvrir un shell PostgreSQL dans le conteneur :**

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

Puis `\q` pour quitter.

> Ce hash correspond au mot de passe **`admin123`**.
> Au démarrage, le backend écrit aussi dans ses logs un hash BCrypt frais de `admin123`
> (`=== BCrypt hash of 'admin123': ... ===`) — pratique si vous voulez un hash à jour.
> **Changez ce mot de passe après la première connexion.**

**3. Se connecter sur http://localhost:3001 :**

- Email : `admin@neurodetect.com`
- Mot de passe : `admin123`

---

## Rôles et permissions

| Action | ADMIN | MEDECIN |
|---|:---:|:---:|
| Créer des comptes médecin | ✓ | |
| Activer / désactiver un compte | ✓ | |
| Dashboard & statistiques | ✓ | |
| Gérer les patients (CRUD) | | ✓ |
| Uploader et analyser une IRM | | ✓ |
| Générer / télécharger un rapport PDF | | ✓ |
| Consulter la liste des rapports | ✓ | ✓ |

**Workflow type :**

1. L'ADMIN se connecte et crée les comptes médecin.
2. Chaque MEDECIN se connecte et enregistre ses patients.
3. Le MEDECIN uploade un fichier IRM (**`.nii` ou `.nii.gz`**) depuis la page Upload.
4. Le service IA analyse le scan et renvoie le diagnostic + les scores de confiance par classe.
5. Le MEDECIN génère un rapport PDF depuis la fiche patient ou la page Upload.
6. Les rapports sont consultables et téléchargeables dans la page Reports.

---

## Fonctionnalités

| # | Fonctionnalité | Détail |
|---|---|---|
| F1 | Authentification | Login JWT, sessions stateless, routes protégées par rôle |
| F2 | Gestion des patients | CRUD, recherche, pagination, suppression en cascade |
| F3 | Analyse IRM | Upload `.nii`/`.nii.gz`, appel au service IA, scores par classe |
| F4 | Rapports PDF | Génération iTextPDF, nommage `rapport_nom_prenom_N.pdf` |
| F5 | Dashboard & Admin | KPI, graphiques (analyses/mois, distribution des diagnostics), gestion des utilisateurs |

---

## Dépannage

| Problème | Cause probable / solution |
|---|---|
| `port is already allocated` (3001, 8082, 8000 ou 5432) | Un autre programme occupe le port. Le libérer, ou modifier le mapping dans `docker-compose.yml`. |
| Le build du backend échoue au téléchargement Maven | Connexion instable. Relancer `docker compose up --build`. |
| `ai-service` en `MOCK MODE` dans les logs | Modèles absents/illisibles. Vérifier que `ai-service/model/` contient bien les 3 fichiers. |
| Le frontend affiche des erreurs réseau / 401 | Le backend n'est pas encore prêt. Attendre la fin de son démarrage, puis rafraîchir. |
| `relation "users" does not exist` | Les migrations Flyway n'ont pas tourné. Relancer avec une base propre : `docker compose down -v` puis `docker compose up`. |
| Le service IA est tué (OOM) | Augmenter la RAM allouée à Docker Desktop (Settings → Resources) à au moins 6 Go. |
| Modifications de code non prises en compte | Rebuild : `docker compose up --build`. |

---

## Développement sans Docker (optionnel)

Pour modifier le code service par service.

### Prérequis

- Java 17 + Maven · Node.js 20+ · Python 3.11
- Un PostgreSQL local, ou seulement la base via Docker : `docker compose up postgres`

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

`frontend/.env` contient déjà `VITE_API_URL=http://localhost:8082`.

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Les valeurs par défaut sont dans `backend/src/main/resources/application.properties` :
PostgreSQL sur `localhost:5432`, base `neurodetect`, user `postgres`, mot de passe
`devpassword123`. Les migrations Flyway s'appliquent automatiquement au démarrage.

Surchargeables par variables d'environnement : `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `AI_SERVICE_URL`.

### Service IA

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux / macOS
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Commandes utiles

```bash
cd frontend && npm run lint            # ESLint
cd frontend && npm run build           # type-check + bundle
cd backend  && ./mvnw test             # tests backend
cd ai-service && pytest                # tests service IA
```

---

## Structure du dépôt

```
neuro-detect/
├── docker-compose.yml        # orchestration des 4 services
├── .env.example              # gabarit des secrets
├── frontend/                 # React + Vite (port 3001 → 5173)
├── backend/                  # Spring Boot (port 8082)
│   └── src/main/resources/db/migration/   # migrations Flyway
├── ai-service/               # FastAPI (port 8000)
│   ├── app/                  # code du service
│   └── model/                # modèles entraînés (inclus)
└── docs/                     # documentation technique
```

---

## Base de données

Quatre tables gérées par Flyway (`backend/src/main/resources/db/migration/`) :

- `users` — comptes du personnel médical (`ADMIN` / `MEDECIN`)
- `patients` — dossiers patients
- `analyses` — résultats d'analyse IRM (colonne `all_scores` en JSONB)
- `reports` — rapports PDF générés

Ne jamais modifier le schéma à la main : ajouter une migration `V{n}__*.sql`.
