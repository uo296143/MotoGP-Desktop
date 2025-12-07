<?php

class Cronometro {
    
    private $inicio; 
    private $tiempo; 

    public function __construct() {
        $this->tiempo = 0.0;
        $this->inicio = null;
    }

    public function arrancar() {
        if ($this->inicio === null) {
            $this->tiempo = 0.0; 
            $this->inicio = microtime(true);
            return "Cronómetro Arrancado a las: " . date("H:i:s");
        }
        return "El cronómetro ya está arrancado.";
    }

    public function parar() {
        if ($this->inicio !== null) {
            $fin = microtime(true);
            $this->tiempo = $fin - $this->inicio;             
            $this->inicio = null;
            return "Cronómetro Parado. Intervalo: " . $this->mostrar();
        }
        return "El cronómetro ya está parado.";
    }

    public function mostrar() {
        $t = round($this->tiempo, 1);
        $min = floor($t / 60);
        $seconds_remaining = $t - ($min * 60); 
        $sec_int = floor($seconds_remaining);
        $deci = floor(($seconds_remaining - $sec_int) * 10); 
        return sprintf("%02d:%02d.%d", $min, $sec_int, $deci);
    }

    public function getTiempoTotal() {
        return round($this->tiempo, 2);
    }

    public function setTiempoTotal($tiempo) {
        $this->tiempo = $tiempo;
    }
    
}

session_start();

if (!isset($_SESSION['cronometro'])) {
    $_SESSION['cronometro'] = new Cronometro();
}

$cronometro = $_SESSION['cronometro'];
$mensaje_cronometro = ""; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Si el POST proviene del formulario de prueba y no del formulario de prueba del cronómetro
    // Esta lógica se maneja mejor en prueba_usabilidad.php.
    
    // Si quieres que funcione solo para la prueba de cronómetro:
    if (isset($_POST['arrancar'])) {
        $mensaje_cronometro = $cronometro->arrancar();
    } elseif (isset($_POST['parar'])) {
        $mensaje_cronometro = $cronometro->parar();
    } elseif (isset($_POST['mostrar'])) {
        $mensaje_cronometro = "Tiempo Mostrado: " . $cronometro->mostrar();
    }
    
    $_SESSION['cronometro'] = $cronometro;
}

?>
