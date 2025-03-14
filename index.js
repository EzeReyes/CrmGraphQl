const {ApolloServer} = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers')
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});



// Conectar con la base de datos
conectarDB();



// Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        const token = req.headers['authorization'] || '';
        console.log("Token recibido:", token); // 👈 Verificar en logs
        
        if (!token) {
            console.log("No se envió token");
            return {}; // Devuelve un contexto vacío en lugar de lanzar error
        }
    
        try {
            const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
            console.log("Usuario autenticado:", usuario);
            return { usuario };
        } catch (error) {
            console.error("Error al verificar token:", error.message);
            return {}; // No lanzar error, solo devolver un contexto vacío
        }
    },
    cors: {
        origin: ['https://crm-client-weld.vercel.app/', 'http://localhost:3000'], // Cambia por tu dominio
        credentials: true
    }
});


// Arrancar el servidor
server.listen().then( ({url}) => {
    console.log(`Servidor listo en la url ${url}`)
})