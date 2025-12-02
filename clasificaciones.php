<?php

class Clasificacion {
    
    private $documento; // Almacena la ruta del documento XML
    private $xml;       // Almacena el objeto SimpleXMLElement con los datos

    public function __construct() {
        $this->documento = 'xml/circuitoEsquema.xml';
        $this->xml = null;
    }

    public function consultar() {

        $xml_data = @simplexml_load_file($this->documento);
        
        if ($xml_data === false) {
            return "Error: No se pudo cargar el archivo XML en la ruta '{$this->documento}'. Asegúrese de que el archivo existe y es accesible.";
        }
        
        $this->xml = $xml_data;
        return "Documento XML cargado correctamente desde el servidor.";

    }

    private function formatearTiempoISO($isoDuration) {
        // Expresión regular para extraer Minutos (M) y Segundos (S)
        if (preg_match('/PT(\d+)M([\d.]+?)S/', $isoDuration, $matches)) {
            $minutos = $matches[1];
            $segundos_completo = $matches[2];
            
            // Asegura que los minutos tengan dos dígitos y los milisegundos tres decimales
            return sprintf("%02d:%05.3f", $minutos, $segundos_completo);
        }
        // Si el formato no coincide, devuelve el original
        return $isoDuration;
    }

    public function mostrarGanador() {
        if (!$this->xml) { return "<article><p>No hay datos de clasificación cargados.</p></article>"; }
        
        // Ahora leemos desde <vencedor> y el nombre del circuito <nombre>
        $vencedor = $this->xml->vencedor;
        
        $nombre = (string)$vencedor->piloto;
        $tiempo_iso = (string)$vencedor->tiempoTotal;
        $gp_nombre = (string)$this->xml->nombre; // Nombre del circuito

        // --- Aplicamos el formateo de tiempo aquí ---
        $tiempo_formateado = $this->formatearTiempoISO($tiempo_iso);

        // Estructura simple con elementos HTML (<article>, <p>)
        $html = "<article>";
        $html .= "<h3>Ganador del {$gp_nombre}</h3>";
        // Tarea corregida: Reintegración de <span> para aplicar estilos
        $html .= "<p>El ganador de la carrera es {$nombre} con un tiempo total de {$tiempo_formateado}.</p>";
        $html .= "</article>";
        return $html;
    }

    /**
     * Tarea 5: Muestra la clasificación del mundial.
     * Lee desde el nodo <clasificacionMundial> (nodos pos1, pos2, etc.).
     */
    public function mostrarClasificacionMundial() {
        if (!$this->xml) { return ""; }
        
        $html = "<section>";
        $html .= "<h3>Clasificación Mundial tras la carrera</h3>";
        
        // Estructura simple con elementos de tabla
        $html .= "<table>";
        // En este XML solo tenemos la posición y el piloto, no los puntos
        $html .= "<thead><tr><th>Posición</th><th>Piloto</th></tr></thead>";
        $html .= "<tbody>";

        $i = 1;
        // Tarea 5: Guía 5: Iterar sobre la información de <clasificacionMundial>
        foreach ($this->xml->clasificacionMundial->children() as $posicion_node) {
            $nombre = (string)$posicion_node->piloto;
            
            $html .= "<tr>";
            $html .= "<td>{$i}</td>"; // Usamos $i como posición (1, 2, 3...)
            $html .= "<td>{$nombre}</td>";
            $html .= "</tr>";
            $i++;
        }
        
        $html .= "</tbody></table>";
        $html .= "</section>";
        return $html;
    }
}

$clasificacion = new Clasificacion();
$mensaje_carga = $clasificacion->consultar(); 

?>
    

<!DOCTYPE HTML>

<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="author" content="Juan Fernández López" />
    <meta name="description" content="Documento para utilizar en otro módulos de la asignatura" />
    <meta name="keywords" content="MotoGP, motos, piloto, clasificaciones" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MotoGP-Clasificaciones</title>
    <link href="multimedia/favicon.ico" rel="icon" />
    <link rel="stylesheet" type="text/css" href="estilo/estilo.css">
    <link rel="stylesheet" type="text/css" href="estilo/layout.css">
</head>

<body>
    <header>
        <h1><a href="index.html" title="Página principal">MotoGP Desktop</a></h1>
        <nav>
            <a href="index.html" title="Página principal">Inicio</a>
            <a href="piloto.html" title="Página dedicada a información más personal del piloto">Piloto</a>
            <a href="circuito.html" title="Página dedicada a información a cerca del circuito X del mundial de MotoGP">Circuito</a>
            <a href="meteorologia.html" title="Página dedicada al tiempo">Meteorología</a>
            <a href="clasificaciones.php" title="Página dedicada a las clasificaciones" class="active">Clasificaciones</a>
            <a href="juegos.html" title="Página dedicada a juegos">Juegos</a>
            <a href="ayuda.html" title="Página dedicada a la ayuda del sitio web">Ayuda</a>
        </nav>
    </header>
    <p>Estás en: <a href="index.html" title="Página principal">Inicio</a> | <strong>Clasificaciones</strong></p>
    <h2>Clasificaciones de MotoGP-Desktop</h2>
     <?php 
        if (strpos($mensaje_carga, 'Error') !== false) {
            echo "<p>{$mensaje_carga}</p>";
        }
        ?>

    <?php echo $clasificacion->mostrarGanador(); ?>
    <?php echo $clasificacion->mostrarClasificacionMundial(); ?>
</body>
</html>