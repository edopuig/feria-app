// src/models/Product.js
export default class Producte {
    constructor(nom, preu, color, categoria) {
        this.nom = nom;
        this.preu = preu;
        this.color = color;
        this.categoria = categoria;
    }

    getProducte() {
        return `${this.nom}: ${this.preu} - $${this.color}`;
    }

    getNom() {
        return `${this.nom}`;
    }
    getPreu(){
        return`${this.preu}`
    }
    getColor(){
        return`${this.color}`
    }
}