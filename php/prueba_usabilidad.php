<?php
// php/prueba_usabilidad.php

// 1. Cargar la lógica del Cronómetro (define $cronometro, session_start())
require_once '../cronometro.php'; 

// 2. Cargar la clase de gestión de la base de datos
require_once 'Configuracion.php'; 

// 3. Definiciones (adaptadas a tu UO: UO296143)
$db_host = 'localhost';
$db_user = 'DBUSER2025';
$db_pswd = 'DBPSWD2025';
$db_name = 'UO296143_DB';

// NOTA: Debes completar el resto de las 10 preguntas.
$preguntas = [
    1 => '¿En que país se encuentra el circuito de Moto GP?',
    2 => '¿Cómo se llama el piloto de Moto GP?',
    3 => '¿En qué ciudad italiana nació este piloto?',
    4 => '¿Qué es una chicane?',
    5 => '¿Cuántos metros mide el circuito?',
    6 => '¿Quién fue el ganador en este circuito este año?',
    7 => '¿En que ciudad está el circuito?',
    8 => '¿Cuánta población tiene dicha ciudad?',
    9 => '¿Cuál fue el tiempo que le llevó al piloto de este año ganar la prueba?',
    10 => '¿Quién fue el segundo clasificado este año?',
];

// Función auxiliar para obtener ID 
function obtenerId($conn, $tabla, $columna_nombre, $valor) {
    $stmt = $conn->prepare("SELECT id_{$tabla} FROM {$tabla} WHERE {$columna_nombre} = ?");
    $stmt->bind_param("s", $valor);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $stmt->close();
        return $row["id_{$tabla}"];
    }
    $stmt->close();
    return null; 
}

// 4. Lógica de Estado y Formulario
// Los estados serán: 'inicio', 'preguntas', 'revision'
$estado = $_SESSION['estado'] ?? 'inicio';
$mensaje_al_usuario = "";

// Lógica de transición de estados y procesamiento POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    if (isset($_POST['iniciar_prueba'])) {
        // Guardar datos de usuario en sesión
        $_SESSION['datos_usuario'] = [
            'id_prueba' => $_POST['id_prueba'] ?? 1, // Nuevo nombre de campo para el ID
            'profesion' => $_POST['profesion'] ?? '',
            'edad' => $_POST['edad'] ?? 0,
            'genero' => $_POST['genero'] ?? '',
            'pericia' => $_POST['pericia'] ?? 0,
            'dispositivo' => $_POST['dispositivo'] ?? '',
        ];
        
        // Iniciar Cronómetro y cambiar estado
        $cronometro->arrancar(); // Reinicia y arranca
        $_SESSION['cronometro'] = $cronometro;
        $_SESSION['estado'] = 'preguntas';
        $estado = 'preguntas';
        $mensaje_al_usuario = "¡Prueba Iniciada! El tiempo ya está corriendo. Responda las 10 preguntas.";

    } elseif (isset($_POST['terminar_cuestionario'])) {
        
        // Parar Cronómetro y obtener tiempo
        $cronometro->parar();
        $tiempo_total = $cronometro->getTiempoTotal();
        
        // Guardar el tiempo y cambiar estado
        $_SESSION['tiempo_total'] = $tiempo_total;
        
        // Se podrían guardar las respuestas de las 10 preguntas aquí en la sesión si fueran necesarias, 
        // pero solo guardamos el tiempo para cumplir el objetivo del formulario final.
        
        $_SESSION['estado'] = 'revision';
        $estado = 'revision';
        $mensaje_al_usuario = "Tiempo registrado ({$tiempo_total}s). Por favor, complete la valoración y comentarios.";
        
    } elseif (isset($_POST['finalizar_guardar'])) {
        
        // 5. Conexión y Guardado (Lógica completa de guardar)
        $tiempo_total = $_SESSION['tiempo_total'] ?? 0.0;
        $datos_usuario = $_SESSION['datos_usuario'] ?? [];

        $conn = new mysqli($db_host, $db_user, $db_pswd, $db_name);
        if ($conn->connect_error) {
            $mensaje_al_usuario = "❌ Error de conexión a la base de datos: " . $conn->connect_error;
        } else {
            $id_usuario = intval($datos_usuario['id_prueba'] ?? 0);
            $profesion = $datos_usuario['profesion'] ?? '';
            $edad = intval($datos_usuario['edad'] ?? 0);
            $genero_nombre = $datos_usuario['genero'] ?? '';
            $pericia = intval($datos_usuario['pericia'] ?? 0);
            $dispositivo_nombre = $datos_usuario['dispositivo'] ?? '';

            $tarea_completada = isset($_POST['tarea_completada']) ? 1 : 0; 
            $comentarios_usuario = $_POST['comentarios_usuario'] ?? '';
            $propuestas_mejora = $_POST['propuestas_mejora'] ?? '';
            $valoracion = intval($_POST['valoracion'] ?? 0);
            $comentarios_facilitador = $_POST['comentarios_facilitador'] ?? ''; // TAREA 3

            // Obtener IDs de tablas normalizadas
            $id_genero = obtenerId($conn, 'genero', 'nombre_genero', $genero_nombre);
            $id_dispositivo = obtenerId($conn, 'dispositivo', 'nombre_dispositivo', $dispositivo_nombre);

            // --- Lógica de Inserción/Actualización de Usuario (id_usuario es la PK VARCHAR) ---
            
            // 1. Intentar buscar el usuario por el id_usuario (TEST_ID_X)
            $stmt_select = $conn->prepare("SELECT id_usuario FROM usuario WHERE id_usuario = ?");
            $stmt_select->bind_param("s", $id_usuario);
            $stmt_select->execute();
            $result_select = $stmt_select->get_result();

            if ($row = $result_select->fetch_assoc()) {
                // Usuario existente: Actualizar sus datos (profesión, edad, género, pericia)
                $stmt_update = $conn->prepare("UPDATE usuario SET profesion=?, edad=?, id_genero=?, pericia_informatica=? WHERE id_usuario = ?");
                $stmt_update->bind_param("siiis", $profesion, $edad, $id_genero, $pericia, $id_usuario);
                $stmt_update->execute();
                $stmt_update->close();
            } else {
                // Nuevo usuario: Insertar (id_usuario es la PK)
                $stmt_insert = $conn->prepare("INSERT INTO usuario (id_usuario, profesion, edad, id_genero, pericia_informatica) VALUES (?, ?, ?, ?, ?)");
                $stmt_insert->bind_param("ssiii", $id_usuario, $profesion, $edad, $id_genero, $pericia);
                $stmt_insert->execute();
                $stmt_insert->close();
            }
            $stmt_select->close();
            // --- Fin Lógica de Inserción/Actualización de Usuario ---

            if (!empty($id_usuario)) {
                // Inserción en la tabla 'resultado' (usando id_usuario_fk)
                $stmt_r = $conn->prepare("INSERT INTO resultado (id_usuario_fk, id_dispositivo, tiempo_segundos, tarea_completada, comentarios_usuario, propuestas_mejora, valoracion) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt_r->bind_param("sidissi", $id_usuario, $id_dispositivo, $tiempo_total, $tarea_completada, $comentarios_usuario, $propuestas_mejora, $valoracion);
                $stmt_r->execute();
                $stmt_r->close();

                // TAREA 3: Inserción en la tabla 'observacion'
                if (!empty($comentarios_facilitador)) {
                    $stmt_o = $conn->prepare("INSERT INTO observacion (id_usuario_fk, comentarios_facilitador) VALUES (?, ?)");
                    $stmt_o->bind_param("ss", $id_usuario, $comentarios_facilitador);
                    $stmt_o->execute();
                    $stmt_o->close();
                }

                $mensaje_al_usuario = "✅ Prueba completada. Resultados guardados en la DB";
            } else {
                 $mensaje_al_usuario = "❌ Error al guardar datos de usuario. ID no válido.";
            }

            $conn->close();
        }

        // Resetear y volver al inicio
        $cronometro->setTiempoTotal(0.0);
        $_SESSION['cronometro'] = $cronometro;
        unset($_SESSION['datos_usuario']);
        unset($_SESSION['tiempo_total']);
        $_SESSION['estado'] = 'inicio';
        $estado = 'inicio';

   } 
}

// Variables auxiliares para los campos
$datos_precargados = $_SESSION['datos_usuario'] ?? [];
$get_value = function($field, $default = '') use ($datos_precargados) {
    return htmlspecialchars($_POST[$field] ?? $datos_precargados[$field] ?? $default);
};
$is_selected = function($field, $option_value) use ($datos_precargados) {
    $current_value = $_POST[$field] ?? $datos_precargados[$field] ?? '';
    return ($current_value === $option_value) ? 'selected' : '';
};

// Determinar si los campos deben estar deshabilitados
$bloqueo_campos = ($estado !== 'inicio');
$estado_campos = $bloqueo_campos ? 'readonly disabled' : 'required';
$estado_selects = $bloqueo_campos ? 'disabled' : 'required';
$required_atributos = 'required'; // Las preguntas y valoraciones siempre son requeridas en su fase.

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8"/>  
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Prueba de Usabilidad - MotoGP Desktop</title>
    <link rel="stylesheet" type="text/css" href="../estilo/estilo.css">
    <link rel="stylesheet" type="text/css" href="../estilo/layout.css">
</head>
<body>
    <header>
        <h1>Test de Usabilidad - Proyecto MotoGP Desktop</h1>
    </header>

    <main>
        <section>
            <h2>Estado de la Prueba</h2>
            <p><?php echo $mensaje_al_usuario; ?></p>
        </section>
        
        <article>
            <form method="post" action="prueba_usabilidad.php">

            <?php if ($estado === 'inicio'): // PANTALLA 1: DATOS DE USUARIO ?>

                <h3>1. Datos del Usuario (Introducidos por el observador)</h3>
                
                <label for="id_prueba">ID de Prueba (1 a 12):</label>
                <input type="number" id="id_prueba" name="id_prueba" min="1" max="12" 
                    value="<?php echo $get_value('id_prueba', ''); ?>" required />
                
                <label for="profesion">Profesión:</label>
                <input type="text" id="profesion" name="profesion" 
                    value="<?php echo $get_value('profesion'); ?>" required />
                
                <label for="edad">Edad:</label>
                <input type="number" id="edad" name="edad" min="16" max="100" 
                    value="<?php echo $get_value('edad'); ?>" required />
                
                <label for="genero">Género:</label>
                <select id="genero" name="genero" required>
                    <option value="">Seleccione</option>
                    <option value="Masculino" <?php echo $is_selected('genero', 'Masculino'); ?>>Masculino</option>
                    <option value="Femenino" <?php echo $is_selected('genero', 'Femenino'); ?>>Femenino</option>
                    <option value="Otro" <?php echo $is_selected('genero', 'Otro'); ?>>Otro</option>
                </select>

                <label for="pericia">Pericia Informática (0 a 10):</label>
                <input type="number" id="pericia" name="pericia" min="0" max="10" 
                    value="<?php echo $get_value('pericia'); ?>" required />

                <label for="dispositivo">Dispositivo de la Prueba:</label>
                <select id="dispositivo" name="dispositivo" required>
                    <option value="">Seleccione</option>
                    <option value="Ordenador" <?php echo $is_selected('dispositivo', 'Ordenador'); ?>>Ordenador de escritorio</option>
                    <option value="Tableta" <?php echo $is_selected('dispositivo', 'Tableta'); ?>>Tableta</option>
                    <option value="Teléfono" <?php echo $is_selected('dispositivo', 'Teléfono'); ?>>Teléfono</option>
                </select>
                
                <button type="submit" name="iniciar_prueba">Iniciar</button>

            <?php elseif ($estado === 'preguntas'): // PANTALLA 2: PREGUNTAS ?>
                
                <h3>2. Conteste las siguientes preguntas</h3>

                <?php 
                // Input oculto para mantener el ID de prueba en el POST
                echo '<input type="hidden" name="id_prueba" value="' . $get_value('id_prueba', 1) . '" />';
                ?>

                <?php foreach ($preguntas as $num => $pregunta): ?>
                    <fieldset>
                        <legend>Tarea <?php echo $num; ?></legend>
                        <p><?php echo $pregunta; ?></p>
                        <label for="respuesta_<?php echo $num; ?>">Respuesta Encontrada:</label>
                        <textarea id="respuesta_<?php echo $num; ?>" name="respuesta_<?php echo $num; ?>" rows="2" required></textarea>
                    </fieldset>
                <?php endforeach; ?>

                <button type="submit" name="terminar_cuestionario">Finalizar</button>
            
            <?php elseif ($estado === 'revision'): // PANTALLA 3: COMENTARIOS Y VALORACIÓN ?>
                
                <h3>3. Revisión, Comentarios y Valoración</h3>
                
                <label for="tarea_completada">Tarea de Usabilidad Completada (Todas las 10 preguntas):</label>
                <input type="checkbox" id="tarea_completada" name="tarea_completada" value="1" checked/>
                
                <label for="comentarios_usuario">Comentarios del Usuario (Problemas encontrados):</label>
                <textarea id="comentarios_usuario" name="comentarios_usuario" rows="4" required></textarea>

                <label for="propuestas_mejora">Propuestas de Mejora del Usuario:</label>
                <textarea id="propuestas_mejora" name="propuestas_mejora" rows="4" required></textarea>

                <label for="valoracion">Valoración de la aplicación (0 a 10):</label>
                <input type="number" id="valoracion" name="valoracion" min="0" max="10" required/>
                
                <label for="comentarios_facilitador">Comentarios Adicionales del Observador</label>
                <textarea id="comentarios_facilitador" name="comentarios_facilitador" rows="4" required></textarea> 

                <button type="submit" name="finalizar_guardar">Finalizar y Guardar Resultados</button>

            <?php endif; ?>

            </form>
        </article>
    </main>
</body>
</html>