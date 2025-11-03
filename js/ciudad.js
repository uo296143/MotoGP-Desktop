// Archivo: js/ciudad.js

// Clase Ciudad que representa la información de la ciudad Argentina Termas de Río Hondo.
"use strict";
class Ciudad {
    /**
     * Crea una nueva instancia de Ciudad.
     * @param {string} nombre - Nombre de la ciudad.
     * @param {string} pais - País donde se encuentra la ciudad.
     * @param {string} gentilicio - Gentilicio de los habitantes.
     * @param {number} poblacion - Cantidad de población.
     * @param {{ lat: number, lon: number }} coordenadas - Coordenadas del punto central de la ciudad.
     */
    constructor(nombre, pais, gentilicio) {
        this.nombre = nombre;
        this.pais = pais;
        this.gentilicio = gentilicio;
    }

    rellenarAtributos(poblacion, coordenadas) {
        this.poblacion = poblacion;
        this.coordenadas = coordenadas;
    }

    getCiudad() {
        return `El nombre de la ciudad es : ${this.nombre}`;
    }

    getPais() {
        return `El nombre del país es : ${this.pais}`;
    }

    getInfoSecundaria() {
        const mensaje = `
      <ul>
        <li><strong>Gentilicio:</strong> ${this.gentilicio}</li>
        <li><strong>Población:</strong> ${this.poblacion.toLocaleString()} habitantes</li>
      </ul>
    `;
        return mensaje;
    }

    escribirCoordenadas() {
        document.write(`
      <p>
        Coordenadas del punto central:<br>
        Latitud: ${this.coordenadas.lat}<br>
        Longitud: ${this.coordenadas.lon}
      </p>
    `);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let termasDeRioHondo = new Ciudad("Termas de Río Hondo", "Argentina", "termense");
    termasDeRioHondo.rellenarAtributos(36137, {lat: -27.4931, lon: -64.8594});

    // Crear un párrafo para la ciudad
    const parrafoCiudad = document.createElement("p");
    parrafoCiudad.textContent = "Ciudad: " + termasDeRioHondo.getCiudad();

    // Crear otro párrafo para el país
    const parrafoPais = document.createElement("p");
    parrafoPais.textContent = "País: " + termasDeRioHondo.getPais();

    // Añadir ambos párrafos al documento
    document.body.appendChild(parrafoCiudad);
    document.body.appendChild(parrafoPais);
});
