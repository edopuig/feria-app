export default class Item {
    //Els items son lo que seria el charm de margarita, el cor blanc, etc...
    constructor(nom, color, categoria) {
        this.nom = nom;
        this.color = color;
        this.categoria = categoria;
    }

    getCategoria() {
        return `${this.nom}: ${this.color} - $${this.categoria}`;
    }

    getNom() {
        return `${this.nom}`;
    }

    getColor(){
        return`${this.color}`
    }

    getCategoria(){
        return`${this.categoria}`
    }
}