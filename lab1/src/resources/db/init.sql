CREATE TABLE IF NOT EXISTS location (
    id BIGSERIAL PRIMARY KEY,
    x BIGINT NOT NULL,
    y REAL NOT NULL,
    z REAL NOT NULL,
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS address (
    id BIGSERIAL PRIMARY KEY,
    zip_code VARCHAR(255) NOT NULL,
    town_id BIGINT NOT NULL REFERENCES location(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS coordinates (
    id BIGSERIAL PRIMARY KEY,
    x REAL NOT NULL,
    y REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS organization (
    id BIGSERIAL PRIMARY KEY,
    official_address_id BIGINT NOT NULL REFERENCES address(id) ON DELETE RESTRICT,
    annual_turnover DOUBLE PRECISION NOT NULL CHECK (annual_turnover > 0),
    employees_count BIGINT NOT NULL CHECK (employees_count > 0),
    full_name VARCHAR(255),
    type VARCHAR(255) NOT NULL,
    postal_address_id BIGINT REFERENCES address(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS person (
    id BIGSERIAL PRIMARY KEY,
    eye_color VARCHAR(255) NOT NULL,
    hair_color VARCHAR(255),
    location_id BIGINT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
    weight DOUBLE PRECISION NOT NULL CHECK (weight > 0),
    nationality VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS worker (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
    coordinates_id BIGINT NOT NULL REFERENCES coordinates(id) ON DELETE RESTRICT,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    organization_id BIGINT NOT NULL REFERENCES organization(id) ON DELETE RESTRICT,
    salary DOUBLE PRECISION NOT NULL CHECK (salary > 0),
    rating INTEGER NOT NULL CHECK (rating > 0),
    position VARCHAR(255) NOT NULL,
    status VARCHAR(255),
    person_id BIGINT NOT NULL REFERENCES person(id) ON DELETE RESTRICT
);

-- сгруппировать объекты по значению поля rating, вернуть количество элементов в каждой группе
CREATE OR REPLACE FUNCTION group_workers_by_rating()
RETURNS TABLE(rating INTEGER, cnt BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT w.rating, COUNT(*)
    FROM worker w
    GROUP BY w.rating
    ORDER BY w.rating;
END;
$$ LANGUAGE plpgsql;

-- вернуть количество объектов, значение поля rating которых равно заданному
CREATE OR REPLACE FUNCTION count_workers_by_rating(p_rating INTEGER)
RETURNS BIGINT AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM worker w
    WHERE w.rating = p_rating;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- вернуть массив уникальных значений поля rating по всем объектам
CREATE OR REPLACE FUNCTION get_unique_ratings()
RETURNS INTEGER[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT DISTINCT w.rating
        FROM worker w
        ORDER BY w.rating
    );
END;
$$ LANGUAGE plpgsql;

-- переместить сотрудника из одной организации в другую с сохранением должности и заработной платы
CREATE OR REPLACE FUNCTION move_worker_to_organization(p_worker_id BIGINT, p_new_org_id BIGINT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM worker WHERE id = p_worker_id) THEN
        RAISE EXCEPTION 'Сотрудник с ID % не найден', p_worker_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM organization WHERE id = p_new_org_id) THEN
        RAISE EXCEPTION 'Организация с ID % не найдена', p_new_org_id;
    END IF;

    UPDATE worker
    SET organization_id = p_new_org_id
    WHERE id = p_worker_id;
END;
$$ LANGUAGE plpgsql;

-- проиндексировать заработную плату указанному сотруднику на заданный коэффициент
CREATE OR REPLACE FUNCTION index_worker_salary(p_worker_id BIGINT, p_coeff DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    v_new_salary DOUBLE PRECISION;
BEGIN
    IF p_coeff IS NULL OR p_coeff <= 0 THEN
        RAISE EXCEPTION 'Коэффициент индексации должен быть больше 0';
    END IF;

    UPDATE worker
    SET salary = salary * p_coeff
    WHERE id = p_worker_id
    RETURNING salary INTO v_new_salary;

    IF v_new_salary IS NULL THEN
        RAISE EXCEPTION 'Сотрудник с ID % не найден', p_worker_id;
    END IF;

    RETURN v_new_salary;
END;
$$ LANGUAGE plpgsql;