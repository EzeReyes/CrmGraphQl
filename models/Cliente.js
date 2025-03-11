const mongoose = require('mongoose');
const Usuario = require('./Usuario');

const ClientesSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true, //campo que se requiere obligatoriamente
        trim: true //trim elimina los espacios al inicio y al final
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    empresa: {
        type: String,
        require: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true //Dato único no puede haber dos emails o registro iguales
    },
    telefono: {
        type: String,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now() //Dato que toma por defecto
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        reference: Usuario
    }
});

module.exports = mongoose.model('Cliente', ClientesSchema);