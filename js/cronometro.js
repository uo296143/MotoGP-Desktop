"use strict";
class Cronometro {
    constructor() {
        this.tiempo = 0;
    }

    arrancar() {
        console.log("ARRANCAR: Llamada recibida."); // <-- AÑADE ESTO
        try {
            this.inicio = Temporal.Now.instant();
        } catch (err) {
            this.inicio = new Date();
        }
        this.corriendo = setInterval(this.actualizar.bind(this), 100);
        console.log("ARRANCAR: Intervalo iniciado. ID:", this.corriendo); // <-- AÑADE ESTO
    }

    actualizar() {
        console.log("ACTUALIZAR: Bucle en ejecución."); // <-- AÑADE ESTO
        let tiempoActual;
        let duration;
        try {
            tiempoActual = Temporal.Now().instant();
            duration = tiempoActual.since(this.inicio);

        } catch (err) {
            tiempoActual = new Date();
            duration = tiempoActual.getTime() - this.inicio.getTime();
        }
        this.tiempo = duration
        mostrar();
    }

    mostrar() {
        const pantalla = document.querySelector('main p');
        const totalMs = this.tiempo;
        const decimas = Math.floor((totalMs % 1000) / 100);
        const totalSegundos = Math.floor(totalMs / 1000);
        const segundos = totalSegundos % 60;
        const minutos = Math.floor(totalSegundos / 60);
        const pad = (num) => String(num).padStart(2, '0');
        const tiempoFormateado = `${pad(minutos)}:${pad(segundos)}.${decimas}`;

        // 4. Inyectar el valor en el DOM
        if (pantalla) {
            pantalla.textContent = tiempoFormateado;
        } else {
            console.error("No se encontró el elemento con ID 'pantalla' para mostrar el cronómetro.");
        }

        // return tiempoFormateado;
    }

    parar() {
        clearInterval(this.corriendo);
    }

    reiniciar() {
        clearInterval(this.corriendo);
        this.corriendo = null;
        this.tiempo = 0;
        this.mostrar();
    }
}

const cronometro = new Cronometro();