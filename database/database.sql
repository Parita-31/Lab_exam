
CREATE TABLE IF NOT EXISTS users (
                                     id BIGSERIAL PRIMARY KEY,
                                     name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    enrollment_number VARCHAR(50) UNIQUE,
    role VARCHAR(20) NOT NULL,
    department VARCHAR(50),
    batch VARCHAR(50),
    semester INTEGER,
    profile_image VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_user_role CHECK (role IN ('STUDENT', 'PROFESSOR')),
    CONSTRAINT check_user_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
    );


CREATE TABLE IF NOT EXISTS exams (
                                     id BIGSERIAL PRIMARY KEY,
                                     title VARCHAR(255),
    subject VARCHAR(100),
    batch VARCHAR(50),
    semester INTEGER,
    exam_date DATE,
    start_time TIME,
    duration_minutes INTEGER,
    total_marks INTEGER,
    creation_mode VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    professor_id BIGINT REFERENCES users(id),

    CONSTRAINT check_exam_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED', 'ARCHIVED'))
    );


CREATE TABLE IF NOT EXISTS exam_questions (
                                              id BIGSERIAL PRIMARY KEY,
                                              exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT,
    question_type VARCHAR(20),
    marks INTEGER,
    question_order INTEGER,
    correct_answer TEXT
    );


CREATE TABLE IF NOT EXISTS question_options (
                                                id BIGSERIAL PRIMARY KEY,
                                                question_id BIGINT NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    option_label VARCHAR(5),
    option_text TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
    );


CREATE TABLE IF NOT EXISTS exam_attempts (
                                             id BIGSERIAL PRIMARY KEY,
                                             exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,

    CONSTRAINT check_attempt_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED'))
    );


CREATE TABLE IF NOT EXISTS exam_results (
                                            id BIGSERIAL PRIMARY KEY,
                                            exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id),
    marks_obtained DOUBLE PRECISION,
    total_marks INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT check_result_status CHECK (status IN ('PENDING', 'EVALUATED', 'PUBLISHED'))
    );