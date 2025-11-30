class Memoria {
    // #tablero = true;
    #primera_carta = null;
    #segunda_carta = null;
    #tablero_bloqueado = false;
    #cronometro;

    constructor() {
        this.#barajarCartas();
        this.#cronometro = new Cronometro();
        this.#cronometro.arrancar();
        this.#escuchandoClicks();
    }

    #escuchandoClicks() {
        const cartas = document.querySelectorAll('main article');
        cartas.forEach(carta => {
            carta.addEventListener('click', (c) => {
                this.#voltearCarta(carta);
            });
        });
    }

    #barajarCartas() {
        const mainContainer = document.querySelector('main');
        const cards = document.querySelectorAll('main article');
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

    #reiniciarAtributos() {
        this.#tablero_bloqueado = false;
        this.#primera_carta = null;
        this.#segunda_carta = null;
    }

    #deshabilitarCartas() {
        this.#primera_carta.setAttribute('data-estado', 'revelada');
        this.#segunda_carta.setAttribute('data-estado', 'revelada');
        this.#comprobarJuego();
        this.#reiniciarAtributos();
    }

    #comprobarJuego() {
        const cards = document.querySelectorAll('main article');
        const cartasReveladas = document.querySelectorAll('main article[data-estado="revelada"]').length;
        if (cartasReveladas === cards.length) {
            this.#cronometro.parar();
            setTimeout(() => {
                alert('¡Felicidades! Has completado el juego de memoria.');
            }, 300);
        }
    }

    #cubrirCartas() {
        this.#tablero_bloqueado = true;
        setTimeout(() => {
            this.#primera_carta.removeAttribute('data-estado');
            this.#segunda_carta.removeAttribute('data-estado');
            this.#primera_carta.style.transform = "rotateY(0deg)";
            this.#segunda_carta.style.transform = "rotateY(0deg)";
            this.#reiniciarAtributos();
        }, 1500);
    }

    #comprobarPareja() {
        this.#tablero_bloqueado = true;
        const logo1 = this.#primera_carta.children[1].getAttribute('alt');
        const logo2 = this.#segunda_carta.children[1].getAttribute('alt');
        const sonIguales = (logo1 === logo2);
        sonIguales ? this.#deshabilitarCartas() : this.#cubrirCartas();
    }

    #voltearCarta(carta) {
        if (carta.getAttribute('data-estado') === 'revelada' ||
            carta.getAttribute('data-estado') === 'volteada' ||
            this.#tablero_bloqueado) {
            return;
        }
        carta.setAttribute("data-estado", "volteada");
        carta.style.transform = "rotateY(180deg)";
        if (this.#primera_carta === null) {
            this.#primera_carta = carta;
            return;
        }
        if (this.#segunda_carta === null) {
            this.#segunda_carta = carta;
            this.#comprobarPareja();
        }
    }
}
