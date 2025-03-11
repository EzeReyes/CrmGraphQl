const mongoose = require('mongoose');

const UsuariosSchema = mongoose.Schema({
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
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true //Dato único no puede haber dos emails o registro iguales
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now() //Dato que toma por defecto
    }
});

module.exports = mongoose.model('Usuario', UsuariosSchema);