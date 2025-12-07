-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS UO296143_DB;
USE UO296143_DB;

-- Tabla para valores de Género (Normalización 3FN)
CREATE TABLE IF NOT EXISTS genero (
    id_genero INT AUTO_INCREMENT PRIMARY KEY,
    nombre_genero VARCHAR(50) NOT NULL UNIQUE
);

-- Inserción de datos comunes
INSERT INTO genero (nombre_genero) VALUES ('Masculino'), ('Femenino'), ('Otro'), ('Prefiero no decir');

-- Tabla para Dispositivos (Normalización 3FN)
CREATE TABLE IF NOT EXISTS dispositivo (
    id_dispositivo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_dispositivo VARCHAR(50) NOT NULL UNIQUE
);

-- Inserción de datos comunes (Ordenador, tableta o teléfono)
INSERT INTO dispositivo (nombre_dispositivo) VALUES ('Ordenador'), ('Tableta'), ('Teléfono');

-- Tabla de Usuarios (Datos de los usuarios que hacen la prueba)
-- El ID de usuario (TEST_ID_X) es ahora la clave primaria VARCHAR.
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT PRIMARY KEY, 
    profesion VARCHAR(100), -- Profesión
    edad INT, -- Edad
    id_genero INT, -- Género (FK a tabla genero)
    pericia_informatica INT, -- Pericia informática (0-10)
    
    FOREIGN KEY (id_genero) REFERENCES genero(id_genero) ON DELETE SET NULL
);

-- Tabla de Resultados del Test (resultados del test de usabilidad realizado por el usuario)
CREATE TABLE IF NOT EXISTS resultado (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_fk INT NOT NULL, -- FK al ID de prueba (id_usuario en tabla usuario)
    id_dispositivo INT, -- Dispositivo donde se ha realizado la prueba (FK a tabla dispositivo)
    tiempo_segundos DECIMAL(10, 2), -- Tiempo que ha tardado en completar la prueba
    tarea_completada BOOLEAN, -- Si la tarea se ha completado o abandonado (true o False)
    comentarios_usuario TEXT, -- Comentarios del usuario
    propuestas_mejora TEXT, -- Propuestas de mejora del usuario
    valoracion INT, -- Valoración del usuario (0-10)
    fecha_prueba TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_dispositivo) REFERENCES dispositivo(id_dispositivo) ON DELETE SET NULL
);

-- Tabla de Observaciones del Facilitador (observaciones del facilitador con los comentarios)
CREATE TABLE IF NOT EXISTS observacion (
    id_observacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_fk INT NOT NULL, -- FK al ID de prueba (id_usuario en tabla usuario)
    comentarios_facilitador TEXT, -- Comentarios del facilitador
    
    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);