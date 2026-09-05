CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    role        VARCHAR(50) NOT NULL DEFAULT 'MEDECIN',
    is_active   BOOLEAN DEFAULT TRUE,
    phone       VARCHAR(20),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE patients (
    id              BIGSERIAL PRIMARY KEY,
    first_name      VARCHAR(255) NOT NULL,
    last_name       VARCHAR(255) NOT NULL,
    date_of_birth   DATE,
    gender          VARCHAR(10),
    cin             VARCHAR(50) UNIQUE,
    phone           VARCHAR(20),
    address         TEXT,
    notes           TEXT,
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analyses (
    id              BIGSERIAL PRIMARY KEY,
    patient_id      BIGINT NOT NULL REFERENCES patients(id),
    performed_by    BIGINT NOT NULL REFERENCES users(id),
    image_path      VARCHAR(500) NOT NULL,
    image_format    VARCHAR(10),
    diagnosis       VARCHAR(255),
    confidence      DECIMAL(5,4),
    all_scores      JSONB,
    notes           TEXT,
    status          VARCHAR(20) DEFAULT 'PENDING',
    analyzed_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reports (
    id              BIGSERIAL PRIMARY KEY,
    analysis_id     BIGINT NOT NULL REFERENCES analyses(id),
    generated_by    BIGINT NOT NULL REFERENCES users(id),
    pdf_path        VARCHAR(500) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analyses_patient ON analyses(patient_id);
CREATE INDEX idx_analyses_doctor ON analyses(performed_by);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);