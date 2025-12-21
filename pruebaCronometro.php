<?php
    require_once 'cronometro.php'; 
?>

<!DOCTYPE HTML>
<html lang="es">

    <head>
        <meta charset="UTF-8" />
        <meta name="author" content="Juan Fernández López" />
        <meta name="description" content="Página de prueba para la clase Cronómetro en PHP con actualización de JS" />
        <meta name="keywords" content="cronómetro, php, tiempo, motogp" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Cronometro PHP - MotoGP Desktop</title>
        <link href="multimedia/favicon.ico" rel="icon" />
        <link rel="stylesheet" type="text/css" href="estilo/estilo.css">
        <link rel="stylesheet" type="text/css" href="estilo/layout.css">
    </head>

    <body>
        <!-- HEADER PROPORCIONADO POR EL USUARIO -->
        <header>
            <h1><a href="index.html" title="Página principal">MotoGP Desktop</a></h1>
            <nav>
                <a href="index.html" title="Página principal">Inicio</a>
                <a href="piloto.html" title="Página dedicada a información más personal del piloto">Piloto</a>
                <a href="circuito.html" title="Página dedicada a información a cerca del circuito X del mundial de MotoGP">Circuito</a>
                <a href="meteorologia.html" title="Página dedicada al tiempo">Meteorología</a>
                <a href="clasificaciones.php" title="Página dedicada a las clasificaciones">Clasificaciones</a>
                <a href="juegos.html" title="Página dedicada a juegos">Juegos</a>
                <a href="ayuda.html" title="Página dedicada a la ayuda del sitio web">Ayuda</a>
            </nav>
        </header>

        <main>
            <p>Estás en: <a href="index.html" title="Página principal">Inicio</a> | <a href="juegos.html" title="Juegos">Juegos</a> | <strong>Cronometro PHP</strong></p>
            <article>

                <h2>Prueba de la Clase Cronómetro</h2>

                <p>
                    <?php echo $cronometro->mostrar(); ?>
                </p>

                <form method="POST">
                    <button type="submit" name="arrancar">Arrancar</button>
                    <button type="submit" name="parar">Parar</button>
                    <button type="submit" name="mostrar">Mostrar Último Tiempo</button>
                </form>

                <?php if (!empty($mensaje_cronometro)): ?>
                    <p>Resultado: <?php echo $mensaje_cronometro; ?></p>
                <?php endif; ?>

            </article>
        </main>

    </body>
</html>