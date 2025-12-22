<?php
// configuracion_test.php
require_once 'Configuracion.php'; // Asegúrate de que este archivo esté en la misma carpeta

$configuracion = new Configuracion();
$mensaje = '';

// Procesamiento del formulario de configuración
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['reiniciar'])) {
        $mensaje = $configuracion->reiniciarBaseDeDatos();
    } elseif (isset($_POST['eliminar'])) {
        $mensaje = $configuracion->eliminarBaseDeDatos();
    } elseif (isset($_POST['exportar'])) {
        $mensaje = $configuracion->exportarDatosCSV();
    } elseif (isset($_POST['crear'])) {
        $mensaje = $configuracion->crearBaseDeDatos();
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8"/>  
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Configuración DB - MotoGP Desktop</title>
    <link rel="stylesheet" type="text/css" href="../estilo/estilo.css">
    <link rel="stylesheet" type="text/css" href="../estilo/layout.css">
</head>
<body>
    <header>
        <h1>Configuración de la Base de Datos de Usabilidad</h1>
    </header>

    <main>
        <section>
            <h2>Gestión de la Base de Datos UO296143_DB</h2>

            <?php if (!empty($mensaje)): ?>
                <p><?php echo $mensaje; ?></p>
            <?php endif; ?>

            <form method="post" action="configuracion_test.php">
                <h3>Operaciones de Mantenimiento</h3>
                <ul>
                    <li>
                        <button type="submit" name="crear">Crear Base de Datos y Tablas</button>
                        <p>Crea/recrea la base de datos UO296143_DB y todas sus tablas.</p>
                    </li>
                    <li>
                        <button type="submit" name="reiniciar">Reiniciar Datos</button>
                        <p>Borra **todos los datos** de las tablas principales (usuario, resultado, observacion).</p>
                    </li>
                    <li>
                        <button type="submit" name="eliminar" onclick="return confirm('¿Estás seguro de que quieres ELIMINAR COMPLETAMENTE la base de datos UO296143_DB? Esta acción es irreversible.');">Eliminar Base de Datos</button>
                        <p>Borra la base de datos UO296143_DB, sus tablas y todos los datos.</p>
                    </li>
                    <li>
                        <button type="submit" name="exportar">Exportar Datos (.csv)</button>
                        <p>Exporta todos los datos del test de usabilidad a un archivo CSV.</p>
                    </li>
                </ul>
            </form>
        </section>
    </main>
</body>
</html>