<?php
// Configuracion.php

class Configuracion {
    private $db_name = 'UO296143_DB';
    private $db_user = 'DBUSER2025';
    private $db_pswd = 'DBPSWD2025';
    private $db_host = 'localhost';
    private $conn;

    public function __construct() {
        // La conexión se hace en cada método para evitar problemas de persistencia
    }

    private function conectar() {
        $this->conn = new mysqli($this->db_host, $this->db_user, $this->db_pswd, $this->db_name);
        if ($this->conn->connect_error) {
            die("Conexión fallida: " . $this->conn->connect_error);
        }
    }

    private function conectarSinDB() {
        $this->conn = new mysqli($this->db_host, $this->db_user, $this->db_pswd);
        if ($this->conn->connect_error) {
            die("Conexión fallida al servidor: " . $this->conn->connect_error);
        }
    }

    /**
     * Reinicia la base de datos (borra todos los datos de las tablas).
     * Se vacían las tablas principales.
     */
    public function reiniciarBaseDeDatos() {
        try {
            $this->conectar();
            
            // Deshabilitar FK checks temporalmente
            $this->conn->query("SET FOREIGN_KEY_CHECKS=0");

            // Vaciar las tablas principales (la tabla usuario ahora usa id_usuario como PK)
            $tablas = ['observacion', 'resultado', 'usuario'];
            foreach ($tablas as $tabla) {
                $this->conn->query("TRUNCATE TABLE $tabla");
            }
            
            // Habilitar FK checks
            $this->conn->query("SET FOREIGN_KEY_CHECKS=1");
            
            $this->conn->close();
            return "✅ Datos de las tablas reiniciados correctamente (Tablas: " . implode(', ', $tablas) . ").";
        } catch (Exception $e) {
            return "❌ Error al reiniciar la base de datos: " . $e->getMessage();
        }
    }

    /**
     * Elimina la base de datos y todos sus datos.
     */
    public function eliminarBaseDeDatos() {
        try {
            $this->conectarSinDB();
            $sql = "DROP DATABASE IF EXISTS " . $this->db_name;
            if ($this->conn->query($sql) === TRUE) {
                $this->conn->close();
                return "✅ Base de datos '" . $this->db_name . "' eliminada correctamente.";
            } else {
                $this->conn->close();
                return "❌ Error al eliminar la base de datos: " . $this->conn->error;
            }
        } catch (Exception $e) {
            return "❌ Error al eliminar la base de datos: " . $e->getMessage();
        }
    }

    /**
     * Exporta datos de las tablas a un archivo CSV.
     * @return string Mensaje de estado.
     */
    public function exportarDatosCSV() {
        $filename = 'export_usabilidad_' . date('Ymd_His') . '.csv';
        $filepath = 'export/' . $filename; // Crea una carpeta 'export' si no existe
        
        try {
            $this->conectar();
            
            // La consulta usa u.id_usuario (la nueva PK) y r.id_usuario_fk (la nueva FK)
            $sql = "SELECT 
                        u.id_usuario AS 'ID_Usuario', 
                        u.profesion AS 'Profesion', 
                        u.edad AS 'Edad', 
                        g.nombre_genero AS 'Genero', 
                        u.pericia_informatica AS 'Pericia_Informatica',
                        d.nombre_dispositivo AS 'Dispositivo_Prueba',
                        r.tiempo_segundos AS 'Tiempo_Segundos',
                        r.tarea_completada AS 'Tarea_Completada',
                        r.comentarios_usuario AS 'Comentarios_Usuario',
                        r.propuestas_mejora AS 'Propuestas_Mejora',
                        r.valoracion AS 'Valoracion'                  
                    FROM resultado r
                    JOIN usuario u ON r.id_usuario_fk = u.id_usuario
                    LEFT JOIN genero g ON u.id_genero = g.id_genero
                    LEFT JOIN dispositivo d ON r.id_dispositivo = d.id_dispositivo
                    LEFT JOIN observacion o ON u.id_usuario = o.id_usuario_fk";

            $result = $this->conn->query($sql);

            if ($result->num_rows > 0) {
                if (!is_dir('export')) {
                    mkdir('export', 0777, true);
                }
                $file = fopen($filepath, 'w');
                
                // Headers CSV
                $headers = array('ID_Usuario', 'Profesion', 'Edad', 'Genero', 'Pericia_Informatica', 'Dispositivo_Prueba', 'Tiempo_Segundos', 'Tarea_Completada', 'Comentarios_Usuario', 'Propuestas_Mejora', 'Valoracion');
                fputcsv($file, $headers);

                // Datos
                while ($row = $result->fetch_assoc()) {
                    // Convertir el booleano 'Tarea_Completada' a 'True'/'False'
                    $row['Tarea_Completada'] = $row['Tarea_Completada'] ? 'True' : 'False';
                    fputcsv($file, $row);
                }
                
                fclose($file);
                $this->conn->close();
                return "✅ Datos exportados a **$filename** en formato CSV.";
            } else {
                $this->conn->close();
                return "⚠️ No hay datos para exportar.";
            }
        } catch (Exception $e) {
            return "❌ Error durante la exportación: " . $e->getMessage();
        }
    }
    
    // Método para crear la base de datos (Adicionalmente, si ya se eliminó)
    public function crearBaseDeDatos() {
        try {
            $this->conectarSinDB();
            $sql = "CREATE DATABASE IF NOT EXISTS " . $this->db_name;
            if ($this->conn->query($sql) === TRUE) {
                $this->conn->close();
                // Ejecutar el script SQL para crear las tablas
                $script_sql = file_get_contents('crear_db.sql');
                $this->conectar();
                if ($this->conn->multi_query($script_sql)) {
                     // Leer y descartar los resultados de multi_query
                    do {
                        if ($result = $this->conn->store_result()) {
                            $result->free();
                        }
                    } while ($this->conn->more_results() && $this->conn->next_result());
                    $this->conn->close();
                    return "✅ Base de datos y tablas creadas/recreadas correctamente.";
                } else {
                    $error = $this->conn->error;
                    $this->conn->close();
                    return "❌ Error al crear las tablas: " . $error;
                }
            } else {
                $this->conn->close();
                return "❌ Error al crear la base de datos: " . $this->conn->error;
            }
        } catch (Exception $e) {
            return "❌ Error al crear la base de datos: " . $e->getMessage();
        }
    }
}