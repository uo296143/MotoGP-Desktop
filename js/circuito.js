/**
 * Clase base que encapsula la lógica genérica de lectura de archivos
 * usando FileReader y devolviendo una Promesa.
 */
class LectorArchivosBase {
    /**
     * Lee un archivo como texto y devuelve una promesa.
     * @param {File} archivo - El objeto File a leer.
     * @returns {Promise<string>} Promesa que resuelve con el contenido del archivo como texto.
     */
    static leerComoTexto(archivo) {
        return new Promise((resolve, reject) => {
            if (!archivo) {
                return reject(new Error("Archivo no proporcionado."));
            }
            const lector = new FileReader();
            lector.onload = (evento) => resolve(evento.target.result);
            lector.onerror = (error) => reject(new Error("Error de lectura: " + error.target.error.name));
            lector.readAsText(archivo);
        });
    }

    /**
     * Configura el event listener 'change' en un input dado.
     * @param {string} selector - El selector CSS para el input.
     * @param {function(File): void} handler - La función a ejecutar con el File seleccionado.
     */
    static configurarInput(selector, handler) {
        const inputElement = document.querySelector(selector);
        if (inputElement) {
            inputElement.addEventListener('change', (event) => {
                const archivo = event.target.files[0];
                if (archivo) {
                    handler(archivo);
                }
            });
        } else {
            console.error(`Error: No se encontró el input con selector '${selector}'.`);
        }
    }
}

// ---------------------------------------------------------------------------------------
// CLASE CIRCUITO: Carga y Procesamiento del HTML
// ---------------------------------------------------------------------------------------

class Circuito {
    /** @type {HTMLElement} */
    #outputElement;
    /** @type {HTMLElement} */
    #fileInput;

    constructor() {
        this.#comprobarApiFile();
        this.#outputElement = document.querySelector('main');
        // Usa el selector basado en el title del input HTML
        this.#fileInput = document.querySelector('input[title="Selector de Archivo HTML"]');

        if (this.#fileInput && this.#outputElement) {
            this.#configurarLectorArchivo();
        } else {
            console.error("Error en Circuito: No se pudo encontrar el input HTML o el elemento <main>.");
        }
    }

    /**
     * Comprueba si el navegador soporta el uso de la API File.
     */
    #comprobarApiFile() {
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            const p = document.createElement('p');
            p.textContent = '¡¡¡ Este navegador NO soporta el API File !!!';
            document.body.appendChild(p);
        }
    }

    /**
     * Configura el evento 'change' en el input para iniciar la lectura.
     */
    #configurarLectorArchivo() {
        this.#fileInput.addEventListener('change', (event) => {
            const archivo = event.target.files[0];
            if (archivo) {
                this.#leerArchivoHTML(archivo);
            }
        });
    }

    /**
     * Lee y procesa el archivo HTML usando la clase base.
     * @param {File} archivo 
     */
    #leerArchivoHTML(archivo) {
        LectorArchivosBase.leerComoTexto(archivo)
            .then(contenidoHTML => {
                this.#procesarContenidoHTML(contenidoHTML);
            })
            .catch(error => {
                this.#outputElement.innerHTML = `<p> ❌ ${error.message || 'Error al leer el archivo.'}</p>`;
            });
    }

    /**
     * Analiza el contenido HTML y lo inyecta en el DOM.
     * @param {string} contenido - El contenido HTML cargado del archivo.
     */
    #procesarContenidoHTML(contenido) {
        if (!this.#outputElement) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(contenido, "text/html");

        const circuitoSection = doc.querySelector('section');

        if (circuitoSection) {
            // Creación de un fragmento para evitar manipulación directa del DOM en el bucle
            const newContentContainer = document.createElement('section');

            // Mover todos los hijos del circuitoSection al nuevo contenedor
            while (circuitoSection.firstChild) {
                newContentContainer.appendChild(circuitoSection.firstChild);
            }
            this.#outputElement.appendChild(newContentContainer);
        } else {
            const errorMsg = document.createElement('p');
            errorMsg.textContent = '⚠️ No se encontró la etiqueta <section> en el archivo cargado para inyectar el contenido.';
            this.#outputElement.appendChild(errorMsg);
        }
    }
}

// ---------------------------------------------------------------------------------------
// CLASE CARGADORSVG: Carga y Procesamiento del SVG
// ---------------------------------------------------------------------------------------

class CargadorSVG {
    /** @type {HTMLElement} */
    #outputElement;

    constructor() {
        this.#outputElement = document.querySelector('article');
        if (this.#outputElement) {
            // Usa la clase base para configurar el listener de forma genérica
            LectorArchivosBase.configurarInput(
                'input[title="Selector de Archivo SVG"]',
                (archivo) => this.#leerArchivoSVG(archivo)
            );
        } else {
            console.error("Error en CargadorSVG: Elemento <article> no encontrado.");
        }
    }

    /**
     * @private
     * Inserta un título h2 como primer hijo del div contenedor del mapa.
     * @param {string} textoTitulo - El texto para el título.
     */
    #insertarTituloAltimetria(textoTitulo) {
        const elementoMapa = document.querySelector('body > main > article');
        if (!elementoMapa) {
            console.error("Error: No se encontró el article para insertar el título.");
            return;
        }

        // Verificar si el título ya existe para evitar duplicados
        const tituloExistente = elementoMapa.querySelector('h2');
        if (tituloExistente && tituloExistente.textContent === textoTitulo) {
            return; // El título ya está, no hacemos nada
        }

        const titulo = document.createElement('h2');
        titulo.textContent = textoTitulo;

        // Usamos prepend() para asegurar que se inserte como el PRIMER hijo.
        // Si ya había un título diferente, lo reemplaza o lo mantiene al inicio.
        if (tituloExistente) {
            tituloExistente.remove(); // Opcional: si quieres asegurar que solo haya UNO
        }
        elementoMapa.before(titulo);
    }

    /**
     * Muestra el contenido SVG en el elemento <article>.
     * @param {string} contenidoSVG - La cadena de texto que contiene el código SVG.
     */
    #insertarSVG(contenidoSVG) {
        if (!this.#outputElement) return;

        this.#insertarTituloAltimetria("Altimetría del circuito");
        this.#outputElement.innerHTML = contenidoSVG;

        const svgEl = this.#outputElement.querySelector('svg');
        if (svgEl) {
            // Optimización de SVG
            svgEl.removeAttribute('width');
            svgEl.removeAttribute('height');

            // Normalización de viewBox
            if (!svgEl.hasAttribute('viewBox')) {
                try {
                    const bbox = svgEl.getBBox();
                    const w = bbox.width || 1100;
                    const h = bbox.height || 480;
                    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
                } catch (e) {
                    svgEl.setAttribute('viewBox', '0 0 1100 480');
                }
            }
        }
    }

    /**
     * Carga un archivo SVG desde la máquina cliente usando API File.
     * @param {File} file - El objeto File seleccionado.
     */
    #leerArchivoSVG(file) {
        const tipoSVG = /image\/svg\+xml/;
        if (!file.type.match(tipoSVG)) {
            this.#outputElement.innerHTML = `<p>Error: ¡Archivo no válido! Selecciona un SVG.</p>`;
            return;
        }

        LectorArchivosBase.leerComoTexto(file)
            .then(contenidoSVG => {
                this.#insertarSVG(contenidoSVG);
            })
            .catch(error => {
                this.#outputElement.innerHTML = `<p>Error: Falló la lectura del archivo. ${error.message}</p>`;
            });
    }
}

// ---------------------------------------------------------------------------------------
// CLASE CARGADORKML: Carga y Procesamiento del KML
// ---------------------------------------------------------------------------------------

class CargadorKML {
    #mapa;

    constructor() {
        this.#mapa = null;
        this.#configurarInputKML();
    }

    /**
     * Configura la escucha de eventos en el input KML.
     */
    #configurarInputKML() {
        // Usa la clase base para configurar el listener de forma genérica
        LectorArchivosBase.configurarInput(
            'input[title="Selector de Archivo KML"]',
            (archivo) => this.#leerArchivoKML(archivo)
        );
    }

    // ... (El resto de los métodos se mantiene igual, pero renombramos initMap a #initMap, drawCircuit a #drawCircuit, etc.) ...
    // ... (Mantén los métodos #initMap, #parseCoordinates, #drawCircuit como privados) ...
    // ... (Mantén initMapKML como público) ...

    /**
     * Tarea 4: Lectura del archivo circuito.kml usando la clase base.
     * @param {File} archivo - El objeto File seleccionado.
     */
    #leerArchivoKML(archivo) {
        LectorArchivosBase.leerComoTexto(archivo)
            .then(contenidoKML => {
                this.#insertarCapaKML(contenidoKML);
            })
            .catch(error => {
                alert(`Error: Falló la lectura del archivo KML. ${error.message}`);
            });
    }

    /**
     * @private
     * Inserta un título h2 como primer hijo del div contenedor del mapa.
     * @param {string} textoTitulo - El texto para el título.
     */
    #insertarTituloMapa(textoTitulo) {
        const elementoMapa = document.querySelector('body > main > div');
        if (!elementoMapa) {
            console.error("Error: No se encontró el div del mapa para insertar el título.");
            return;
        }

        // Verificar si el título ya existe para evitar duplicados
        const tituloExistente = elementoMapa.querySelector('h2');
        if (tituloExistente && tituloExistente.textContent === textoTitulo) {
            return; // El título ya está, no hacemos nada
        }

        const titulo = document.createElement('h2');
        titulo.textContent = textoTitulo;

        // Usamos prepend() para asegurar que se inserte como el PRIMER hijo.
        // Si ya había un título diferente, lo reemplaza o lo mantiene al inicio.
        if (tituloExistente) {
            tituloExistente.remove(); // Opcional: si quieres asegurar que solo haya UNO
        }
        elementoMapa.before(titulo);
    }

    /**
    * Tarea 5: Representar el circuito en un mapa dinámico.
    * Superpone un archivo KML en el mapa: extrae coordenadas y dibuja el circuito.
    * @param {string} contenidoKML - La cadena de texto que contiene el código KML.
    */
    #insertarCapaKML(contenidoKML) {
        if (!this.#mapa) {
            alert("Error: El mapa dinámico no se ha inicializado. Espera la carga de Google Maps.");
            return;
        }

        this.#insertarTituloMapa("Localización del circuito");

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

    // Mantenemos este método público para el callback de Google Maps
    initMapKML() {
        this.#initMap();
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

}


// ---------------------------------------------------------------------------------------
// INICIALIZACIÓN
// ---------------------------------------------------------------------------------------


// 2. Definir la función global que Google Maps llama al cargarse (callback).
window.initMapKML = function () {
    cargadorKML.initMapKML();
};



const circuito = new Circuito();
const cargadorKML = new CargadorKML();
const svgCargador = new CargadorSVG();
