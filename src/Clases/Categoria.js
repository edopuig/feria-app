export default class Categoria {
    constructor(nom, color, grup) {
        this.nom = nom;
        this.color = color;
        this.grup = grup;
    }

    getCategoria() {
        return `${this.nom}: ${this.color} - $${this.grup}`;
    }

    getNom() {
        return `${this.nom}`;
    }

    getColor(){
        return`${this.color}`
    }

    getGrup(){
        return`${this.grup}`
    }
}