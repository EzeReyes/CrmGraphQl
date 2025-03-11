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
    context: ({req}) => {
        // console.log(req.headers['authorization']);

            // console.log(req.headers)


        const token = req.headers['authorization'] || '';
        if(token) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
                console.log(usuario);
                return { 
                    usuario 
                }
            } catch(error) {
                if(error.message === "jwt expired" ) {
                    throw new Error('Debe iniciar sesión...')
            }
        }}
    }
});


// Arrancar el servidor
server.listen().then( ({url}) => {
    console.log(`Servidor listo en la url ${url}`)
})