"use strict";
class Memoria {

    constructor() { }

    /*
        Método que añade el atributo data-estado con valor volteada 
        a la carta que recibe como parámetro.
    */
    voltearCarta(carta) {
        carta.setAttribute("data-estado", "volteada");
        carta.style.transform = "rotateY(180deg)";
    }

}

window.memoria = new Memoria();

