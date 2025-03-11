const mongoose = require('mongoose');

const ProductosSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true, //campo que se requiere obligatoriamente
        trim: true //trim elimina los espacios al inicio y al final
    },
    stock: {
        type: Number,
        required: true,
        trim: true
    },
    precio: {
        type: Number,
        required: true,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now() //Dato que toma por defecto
    }
});

ProductosSchema.index({ nombre: 'text'});

module.exports = mongoose.model('Producto', ProductosSchema);