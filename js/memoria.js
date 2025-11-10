"use strict";
class Memoria {

    constructor() { 
        this.tablero = true;
        this.primera_carta = null;
        this.segunda_carta = null;
        this.barajarCartas();
        this.tablero_bloqueado = false;
    }

    /*
        Método que añade el atributo data-estado con valor volteada 
        a la carta que recibe como parámetro.
    */
    voltearCarta(carta) {
        // 1. Comprobaciones de seguridad: 
        // a) La carta no debe estar deshabilitada ('revelada')
        // b) La carta no debe estar volteada ('volteada')
        // c) El tablero no debe estar bloqueado
        if (carta.getAttribute('data-estado') === 'revelada' ||
            carta.getAttribute('data-estado') === 'volteada' ||
            this.tablero_bloqueado) {
            return;
        }

        // Si las comprobaciones pasan, volteamos la carta (usando la lógica original)
        carta.setAttribute("data-estado", "volteada");
        carta.style.transform = "rotateY(180deg)";

        // 2. Control de la jugada:

        // a) Primer click: Almacena la carta y retorna
        if (this.primera_carta === null) {
            this.primera_carta = carta;
            return;
        }

        // b) Segundo click: Almacena la carta y comprueba la pareja
        if (this.segunda_carta === null) {
            this.segunda_carta = carta;
            // Invoca Tarea 2 para determinar si son pareja o no
            this.comprobarPareja();
        }
    }

    barajarCartas(){
        const mainContainer = document.querySelector('main');
        // querySelectorAll devuelve un NodeList estático.
        const cards = document.querySelectorAll('main article');

        // Convertir el NodeList a un Array para poder aplicar el algoritmo de Fisher-Yates
        const cardsArray = Array.from(cards);

        // Algoritmo de barajado Fisher-Yates (Shuffle)
        for (let i = cardsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardsArray[i], cardsArray[j]] = [cardsArray[j], cardsArray[i]];
        }

        cardsArray.forEach(card => {
            mainContainer.appendChild(card);
        });

    }

    reiniciarAtributos(){
        this.tablero_bloqueado = true;
        this.primera_carta = null;
        this.segunda_carta = null;
    }

    deshabilitarCartas() {
        this.primera_carta.setAttribute('data-estado', 'revelada');
        this.segunda_carta.setAttribute('data-estado', 'revelada');
        this.comprobarJuego();
        this.reiniciarAtributos();
    }

    comprobarJuego() {
        const cards = document.querySelectorAll('main article');
        const cartasReveladas = document.querySelectorAll('main article[data-estado="revelada"]').length;
        if (cartasReveladas === cards.length) {
            setTimeout(() => {
                alert('¡Felicidades! Has completado el juego de memoria.');
            }, 300); 
        }
    }

    cubrirCartas(){
        this.tablero_bloqueado = true;
        // Guía 2. Ejecutar acciones con retardo (1.5 segundos = 1500 ms)
        setTimeout(() => {
            // Acción 1: Quitar el atributo data-estado de las tarjetas volteadas
            this.primera_carta.removeAttribute('data-estado');
            this.segunda_carta.removeAttribute('data-estado');

            // Quitar la transformación de rotación
            this.primera_carta.style.transform = "rotateY(0deg)";
            this.segunda_carta.style.transform = "rotateY(0deg)";

            // Acción 2: Invocar Tarea 3, Ejercicio 2
            this.reiniciarAtributos();
        }, 1500);
    }

    // Tarea 2, Ejercicio 3: Comprueba si las cartas volteadas son iguales
    comprobarPareja() {
        // Bloqueamos el tablero inmediatamente antes de la comprobación
        this.tablero_bloqueado = true;

        // Para comprobar si son pareja, comparamos el atributo 'alt' de la imagen (hijo[1] de article)
        // [0] es h3, [1] es img
        const logo1 = this.primera_carta.children[1].getAttribute('alt');
        const logo2 = this.segunda_carta.children[1].getAttribute('alt');

        const sonIguales = (logo1 === logo2);

        // Operador ternario para decidir la siguiente acción
        sonIguales ? this.deshabilitarCartas() : this.cubrirCartas();
    }

}

window.memoria = new Memoria();

