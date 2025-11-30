
class Circuito {

    constructor() {
        this.comprobarApiFile()
        this.outputElement = document.querySelector('main');
        this.fileInput = document.querySelector('input');
        // Comprueba si los elementos necesarios existen
        if (this.fileInput && this.outputElement) {
            this.configurarLectorArchivo();
        } else {
            console.error("No se pudo encontrar el <input type='file'> o el elemento de salida <main>.");
        }
    }

    /**
     * Comprueba si el navegador soporta el uso de la API File.
     */
    comprobarApiFile() {
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            const p = document.createElement('p');
            p.textContent = '¡¡¡ Este navegador NO soporta el API File !!!';
            document.body.appendChild(p);
        }
    }

    /**
     * Configura el evento 'change' en el input para iniciar la lectura.
     */
    configurarLectorArchivo() {
        this.fileInput.addEventListener('change', (event) => {
            const archivo = event.target.files[0];
            if (archivo) {
                this.leerArchivoHTML(archivo);
            }
        });
    }

    leerArchivoHTML(archivo) {
        const lector = new FileReader();
        lector.onload = (evento) => {
            const contenidoHTML = evento.target.result;
            this.procesarContenidoHTML(contenidoHTML);
        }

        // Se inicia la lectura del archivo como texto
        lector.readAsText(archivo);

        // Manejo de errores
        lector.onerror = () => {
            this.outputElement.innerHTML = "<p> ❌ Error al leer el archivo.</p>";
        };
    }

    /**
     * Limpia todo el contenido dentro de <main> que viene después del <input type="file">.
     */
    limpiarOutput() {
        if (!this.outputElement) return;

        // Buscamos el input para saber desde dónde empezar a limpiar.
        const inputElement = this.outputElement.querySelector('input[type="file"]');

        // Creamos un array de elementos a mantener (label, input, p con soporte API)
        const elementosBase = Array.from(this.outputElement.children).filter(child => {
            return child.tagName !== 'P' || !child.textContent.includes('API File');
        });

        // Mantenemos solo el label y el input.
        // Si quieres limpiar TODO lo que venga después del input, tu lógica es casi correcta,
        // pero hay que considerar el elemento <p> del 'comprobarApiFile'.
        // Para ser más seguros y simple, solo eliminamos los elementos <section> y mensajes de éxito/error.

        let currentElement = inputElement ? inputElement.nextElementSibling : this.outputElement.firstElementChild;

        while (currentElement) {
            const next = currentElement.nextElementSibling;

            // Eliminamos mensajes de éxito/error (<p>) y la sección de contenido
            if (currentElement.tagName === 'P' || currentElement.tagName === 'SECTION') {
                currentElement.remove();
            }
            currentElement = next;
        }
    }

    /**
     * TAREA 4: Analiza el contenido HTML y lo inyecta en el DOM de circuito.html.
     * @param {string} contenido - El contenido HTML cargado del archivo.
     */
    procesarContenidoHTML(contenido) {
        if (!this.outputElement) return;

        this.limpiarOutput();

        // 1. Analizar el contenido HTML para obtener un objeto Document
        const parser = new DOMParser();
        const doc = parser.parseFromString(contenido, "text/html");

        // 2. Localizar la <section> de información dentro del archivo cargado
        const circuitoSection = doc.querySelector('section');

        if (circuitoSection) {
            // 3. Crear un nuevo contenedor <section> para mantener la estructura
            const newContentContainer = document.createElement('section');

            // 4. Mover todos los hijos del circuitoSection al nuevo contenedor 
            // Esto es eficiente y evita el riesgo de XSS asociado a innerHTML = body.innerHTML
            while (circuitoSection.firstChild) {
                newContentContainer.appendChild(circuitoSection.firstChild);
            }

            // 6. Agregar el contenedor con todo el contenido del circuito al <main> de circuito.html
            this.outputElement.appendChild(newContentContainer);
        } else {
            const errorMsg = document.createElement('p');
            errorMsg.style.color = 'orange';
            errorMsg.innerHTML = '⚠️ No se encontró la etiqueta &lt;section&gt; en el archivo cargado para inyectar el contenido.';
            this.outputElement.appendChild(errorMsg);
        }

        console.log("Tarea 4 completada: Contenido del circuito inyectado en el DOM.");
    }

}

class CargadorSVG {

    // Propiedad para almacenar una referencia al elemento <article> de salida
    outputElement;

    constructor() {
        // Buscamos el primer (y único) elemento <article> como contenedor de salida
        this.outputElement = document.querySelector('article');
        if (!this.outputElement) {
            console.error("Error: Elemento <article> no encontrado.");
        }
    }

    /**
     * Muestra el contenido SVG en el elemento <article>.
     * @param {string} contenidoSVG - La cadena de texto que contiene el código SVG.
     * (Tarea 3)
     */
    insertarSVG(contenidoSVG) {
        if (this.outputElement) {
            // Inyecta el código SVG directamente en el DOM
            // Limpia marca previa
            this.outputElement.classList.remove('has-svg');

            // Inyectamos el SVG
            this.outputElement.innerHTML = contenidoSVG;

            // Asegurar que el contenedor se muestra como bloque (no centrar)
            this.outputElement.style.display = 'block';

            // Normalizar el SVG insertado para evitar recortes y forzar comportamiento responsivo
            const svgEl = this.outputElement.querySelector('svg');
            if (svgEl) {
                // remover atributos width/height si existen para que CSS gestione el escalado
                svgEl.removeAttribute('width');
                svgEl.removeAttribute('height');
                svgEl.style.width = '100%';
                svgEl.style.height = 'auto';
                svgEl.style.display = 'block';

                // Si el SVG no tiene viewBox intentamos añadir uno (usa getBBox si es posible)
                if (!svgEl.hasAttribute('viewBox')) {
                    try {
                        // getBBox puede lanzar si el SVG no está en el DOM todavía; lo encapsulamos
                        const bbox = svgEl.getBBox();
                        // Evitar valores 0,0 si falla
                        const w = bbox.width || 1100;
                        const h = bbox.height || 480;
                        svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
                    } catch (e) {
                        // Valor por defecto razonable para las altimetrías comunes en este proyecto
                        svgEl.setAttribute('viewBox', '0 0 1100 480');
                    }
                }

                // Añadir clase al contenedor para que CSS cambie la presentación y deje crecer el artículo
                this.outputElement.classList.add('has-svg');
            }
        }
    }

    /**
     * Carga un archivo SVG desde la máquina cliente usando API File.
     * @param {File} file - El objeto File seleccionado.
     * (Tarea 1 y Tarea 2)
     */
    leerArchivoSVG(file) {
        const lector = new FileReader();
        const self = this; // Referencia a la instancia de la clase

        // Validación simple de tipo
        const tipoSVG = /image\/svg\+xml/;
        if (!file.type.match(tipoSVG)) {
            if (self.outputElement) {
                self.outputElement.innerHTML = `<p style="color: red;">Error: ¡Archivo no válido! Selecciona un SVG.</p>`;
            }
            return;
        }

        // Callback cuando la lectura del archivo finaliza
        lector.onload = function (evento) {
            const contenidoSVG = lector.result;
            // Llama al método de inserción con el contenido leído
            self.insertarSVG(contenidoSVG);
        };

        // Callback si ocurre un error de lectura
        lector.onerror = function () {
            if (self.outputElement) {
                self.outputElement.innerHTML = `<p style="color: red;">Error: Falló la lectura del archivo.</p>`;
            }
        };

        // Inicia la lectura del archivo como texto plano
        lector.readAsText(file);
    }

    /**
     * Inicializa la escucha de eventos en el input file.
     * No usamos ID ni Class, sino el selector de tipo de input.
     */
    configurarInput() {
        const inputElement = document.querySelector('input[title="Selector de Archivo SVG"]');

        if (inputElement) {
            // Adjuntar el listener de cambio
            inputElement.addEventListener('change', (event) => {
                // Pasamos el primer archivo de la lista al método leerArchivoSVG
                if (event.target.files.length > 0) {
                    this.leerArchivoSVG(event.target.files[0]);
                }
            });
        } else {
            console.error("No se encontró el input 'file' para configurar el cargador.");
        }
    }
}

/**
 * Clase para cargar, procesar un archivo KML y representar su contenido en un mapa dinámico.
 *
 * NOTA: Esta clase asume que la biblioteca de Google Maps API ya está cargada
 * a través de la etiqueta <script> en circuito.html, y utiliza la función
 * global initMapKML como callback inicial.
 */
class CargadorKML {
    #mapa;

    constructor() {
        this.#mapa = null;
    }

    /**
     * @private
     * Inicializa el mapa dinámico de Google Maps en el div anónimo.
     * Este método se llama como callback inicial de la API de Google Maps.
     */
    #initMap() {
        const centroInicial = { lat: 40.416775, lng: -3.703790 }; // Centro de España (por defecto)
        const opciones = {
            zoom: 5,
            center: centroInicial,
            mapTypeId: 'roadmap'
        };

        // Usamos document.querySelector('body > main > div') para seleccionar el div del mapa
        const elementoMapa = document.querySelector('body > main > div');
        if (elementoMapa) {
            this.#mapa = new google.maps.Map(elementoMapa, opciones);
        } else {
            console.error("Error: No se encontró el elemento div para el mapa.");
        }
    }

    /**
     * @private
     * Parsea la cadena de coordenadas del KML (ej: "-5.84,43.36,0 -5.85,43.37,0").
     * @param {string} coordsString - Cadena de coordenadas (Lng,Lat,Alt).
     * @returns {Array<Object>} Array de objetos de coordenadas { lat: number, lng: number }.
     */
    #parseCoordinates(coordsString) {
        // Limpiar espacios, saltos de línea y separar por grupos de coordenadas
        const groups = coordsString.trim().split(/\s+/);
        const coordinates = [];

        for (const group of groups) {
            const parts = group.split(',');
            if (parts.length >= 2) {
                // KML usa Longitud (Lng), Latitud (Lat), Altitud (Alt)
                const lng = parseFloat(parts[0]);
                const lat = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    coordinates.push({ lat: lat, lng: lng });
                }
            }
        }
        return coordinates;
    }

    /**
     * @private
     * Dibuja una polilínea y el marcador de origen en el mapa, y ajusta la vista.
     * @param {Array<Object>} pathCoordinates - Array de objetos de coordenadas del circuito.
     */
    #drawCircuit(pathCoordinates) {
        if (!this.#mapa || pathCoordinates.length === 0) return;

        // 1. Representar los tramos del circuito con una poli-línea
        const polyline = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: '#FF0000', // Rojo
            strokeOpacity: 0.8,
            strokeWeight: 4
        });
        polyline.setMap(this.#mapa);

        // 2. Colocar/fijar el punto origen del circuito sobre el mapa dinámico
        const originCoordinates = pathCoordinates[0];
        new google.maps.Marker({
            position: originCoordinates,
            map: this.#mapa,
            title: "Punto de Origen del Circuito"
        });

        // 3. Ajustar el mapa para que se centre en la polilínea (adaptabilidad visual)
        const bounds = new google.maps.LatLngBounds();
        pathCoordinates.forEach(coord => bounds.extend(coord));
        this.#mapa.fitBounds(bounds);
    }

    /**
     * Tarea 4: Lectura del archivo circuito.kml.
     * Carga un archivo KML desde la máquina cliente usando API File.
     * @param {FileList} files - La lista de archivos seleccionados (del input file).
     */
    leerArchivoKML(files) {
        const archivo = files[0];

        const lector = new FileReader();

        lector.onload = (evento) => {
            const contenidoKML = lector.result;
            this.insertarCapaKML(contenidoKML); // Llama al método de la Tarea 5
        };

        lector.onerror = () => {
            alert("Error: Falló la lectura del archivo.");
        };

        lector.readAsText(archivo);
    }

    /**
     * Tarea 5: Representar el circuito en un mapa dinámico.
     * Superpone un archivo KML en el mapa: extrae coordenadas y dibuja el circuito.
     * @param {string} contenidoKML - La cadena de texto que contiene el código KML.
     */
    insertarCapaKML(contenidoKML) {
        if (!this.#mapa) {
            alert("Error: El mapa dinámico no se ha inicializado. Espera la carga de Google Maps.");
            return;
        }

        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(contenidoKML, "text/xml");

        // Extraer Coordenadas de la Polilínea (LineString) del circuito.
        let pathCoordinates = [];
        // Se asume que el circuito está definido en un <coordinates> dentro de <LineString>
        const lineStringElement = kmlDoc.querySelector('LineString coordinates');

        if (lineStringElement) {
            pathCoordinates = this.#parseCoordinates(lineStringElement.textContent);
            if (pathCoordinates.length > 1) {
                this.#drawCircuit(pathCoordinates);
            } else {
                console.warn("Advertencia: Se encontró LineString pero no suficientes coordenadas válidas.");
            }
        } else {
            console.error("Error: No se encontró la estructura LineString coordinates en el KML.");
        }
    }

    /**
     * Método público para acceder a la inicialización del mapa desde el HTML (callback).
     */
    initMapKML() {
        this.#initMap();
    }
}

// 1. Instanciar la clase CargadorKML de forma global para que sea accesible desde el input (onchange)
// y para que su método initMapKML pueda ser usado como callback.
const cargadorKML = new CargadorKML();

// 2. Definir la función global que Google Maps llama al cargarse.
// Esto permite que el HTML use un callback simple sin hacer la instancia global manualmente.
window.initMapKML = function () {
    cargadorKML.initMapKML();
};

const svgCargador = new CargadorSVG();
svgCargador.configurarInput();


