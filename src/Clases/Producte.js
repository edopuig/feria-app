// src/models/Product.js
export default class Producte {
    //El producte es el Pare de tot, el que controla de quina categoria ets per dirigirte a on toca
    constructor(nom, preu, color, categoria) {
        this.nom = nom;
        this.preu = preu;
        this.color = color;
        this.categoria = categoria;
    }

    getProducte() {
        return `${this.nom}: ${this.preu}, ${this.color}, ${this.categoria}`;
    }

    getNom() {
        return `${this.nom}`;
    }
    getPreu() {
        return `${this.preu}`
    }
    getColor() {
        return `${this.color}`
    }
}