const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const bcryptjs = require('bcryptjs');
require('dotenv').config({path: 'variables.env'});
const jwt = require('jsonwebtoken');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');


const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre, apellido } = usuario;

    return jwt.sign({ id, email, nombre, apellido }, secreta, {expiresIn})
}

// Resolvers
const resolvers = {
    Query: {
        obtenerUsuario: async (_, {}, ctx) => {
            try {
                return ctx.usuario
            } catch (error) {
                throw new Error (error)
            }
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error)
            }
        },
        obtenerProducto: async (_, {id}) => {
            // Revisar si el producto existe
            const producto = await Producto.findById(id);
            if(!producto) {
                throw new Error('Producto no encontrado');
            }
            return producto;
        },
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch(error) {
                console.log('Hubo un error al querer traer los clientes')
                console.log(error)
            }
        },
        obtenerClientesVendedor: async (_, { }, ctx) => {
            try {
                const clientes = await Cliente.find({vendedor: ctx.usuario.id.toString()});
                return clientes;
            } catch(error) {
                throw new Error('Hubo un error al querer traer los clientes')
            }
        },
        obtenerCliente: async (_, {id}, ctx)  => {
            // Revisar si el Cliente existe
            const cliente = await Cliente.findById(id);

            if(!cliente) {
                throw new Error('Ese cliente no existe')
            }
            // Quien lo creo puede verlo
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            return cliente;
        },
        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                throw new Error(error);
            }
        },
        obtenerPedidosVendedor: async (_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({vendedor: ctx.usuario.id}).populate('cliente');
                console.log(pedidos)
                return pedidos;
            } catch (error) {
                throw new Error(error);
            }
        },
        obtenerPedido: async (_, {id}, ctx) => {
            //Si el pedido existe o no 
            const pedido = await Pedido.findById(id);
            if(!pedido) {
                throw new Error('Pedido no encontrado');
            }

            //Quien dio de alta este pedido lo puede ver
             if(pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
                // retornar el pedido
                return pedido;
        },
        obtenerPedidoEstado: async (_, {estado}, ctx) => {
            const pedidos = await Pedido.find({vendedor: ctx.usuario.id, estado});
            return pedidos;
        },
        mejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                { $match : { estado : "COMPLETADO" }},
                { $group : {
                    _id: "$cliente",
                    total: { $sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'cliente'
                    }
                },
                {
                    $sort : { total : -1}
                }
            ])

            return clientes;
        }, 
        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                { $match: { estado: "COMPLETADO"}},
                { $group: {
                    _id : "$vendedor",
                    total: {$sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor'
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort: { total: -1}
                }
            ]);
            return vendedores;
        }, 
        buscarProducto: async (_, {texto} ) => {
            const productos = await Producto.find({$text: {$search: texto}}).limit(10);

            return productos;
        }
    },
    Mutation: {
        nuevoUsuario: async (_, {input})  => {

            const {email, password } = input;

            // Revisar si el usuario ya está registrado
                const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario) {
                    throw new Error('El usuario ya está registrado');
            }
            
            // Hashear password
            const  salt  =  await bcryptjs.genSalt(10);
            
            input.password = await  bcryptjs.hash(password,  salt); 


            try {
            // Guardar en la BD
                const usuario = new Usuario(input)
                usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async (_, {input}) => {
            const { email, password } = input;

            // Verificar si el usuario existe
            const existeUsuario = await Usuario.findOne({email});
            if(!existeUsuario) {
                throw new Error ('El usuario no existe');
            }

            // Revisar si el password es correcto
            const passwordCorrecto = await  bcryptjs.compare(password,  existeUsuario.password); 
            if(!passwordCorrecto) {
                throw new Error ('El password es incorrecto');
            }

            // Crear el Token
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }

        },
        nuevoProducto: async (_, {input}) => {
            try {
                const nuevoProducto = new Producto(input);

                // Almacenar en la base de datos
                const productoCreado = await nuevoProducto.save();
                return productoCreado
            } catch(error) {
                console.log(error)
            }
        },
        actualizarProducto: async (_, {id, input}) => {
            // Revisar si el producto existe
            let producto = await Producto.findById(id);
            if(!producto) {
                throw new Error('Producto no encontrado');
            }
            
            // guardarlo en la base de datos
            producto = await Producto.findOneAndUpdate({_id: id}, input, {new: true});
            return producto;
        },
        eliminarProducto: async (_, {id}) => {
            // Revisar si el producto existe
            const producto = await Producto.findById(id);
            if(!producto) {
                throw new Error('Producto no encontrado');
            }
            // Eliminar
            await Producto.findOneAndDelete({_id: id});
            return "Producto Eliminado";
        },
        nuevoCliente: async (_, {input}, ctx) => {
            const {email} = input;
            console.log(ctx)

            // Verificar si el cliente ya está registrado
            const cliente = await Cliente.findOne({email});
            if(cliente) {
                throw new Error('Ese cliente ya se encuentra registrado');
            }

                const nuevoCliente = new Cliente(input);

            // Asingar un vendedor
                nuevoCliente.vendedor = ctx.usuario.id;

            // Guardarlo en la base de datos

            try {
                const resultado = await nuevoCliente.save();
                return resultado;
            } catch(error) {
                console.log(error);
            }
        },
        actualizarCliente: async (_, {id, input}, ctx) => {
            // Verificar si existe o no
            let cliente = await Cliente.findById(id);

            if(!cliente) {
                throw new Error ('Ese cliente no existe');
            }


            // Verificar si el vendedor es quien edita
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            // Guardar el cliente
            cliente = await  Cliente.findOneAndUpdate({_id: id}, input, {new: true});
            return cliente;
        },
        eliminarCliente: async (_, {id}, ctx) => {
            // Verificar si existe o no
            let cliente = await Cliente.findById(id);

            if(!cliente) {
                throw new Error ('Ese cliente no existe');
            }


            // Verificar si el vendedor es quien edita
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            
            // Eliminar Cliente
            await Cliente.findOneAndDelete({_id : id});
            return `Cliente Eliminado`;
        },
        nuevoPedido: async (_, {input}, ctx) => {
            console.log("Recibiendo un nuevo pedido:", input);
            const {cliente} = input;
            // Verificar si el cliente existe o no
            let clienteExiste = await Cliente.findById(cliente);
            if(!clienteExiste) {
                throw new Error ('Ese cliente no existe');
            }
            // Verificar si el cliente es del vendedor
            if(clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales para crear el pedido');
            }
            // Verificar que el stock este disponible
            // const {cantidad, id} = input.pedido[0];
            for await (const articulo of input.pedido) {
                const { id } = articulo;
                // Buscar el producto por el ID
                const producto = await Producto.findById(id);
                if(articulo.cantidad > producto.stock ) {
                    throw new Error(`No se puede procesar el pedido, Producto ${producto.nombre} tiene ${producto.stock} unidades disponibles.`);
                } else {
                    // Restar la cantidad a lo disponible
                    producto.stock = producto.stock - articulo.cantidad;
                    await producto.save();
                }
            }
            // Crear un nuevo Pedido
            const nuevoPedido = new Pedido(input);
            // Asignarle un vendedor
            nuevoPedido.vendedor = ctx.usuario.id;
            // Guardar pedido en la base de datos
            try {
                const resultado = await nuevoPedido.save();
                return resultado;
            } catch(error) {
                console.log(error);
            }
        },
        actualizarPedido: async (_, {id, input}, ctx) => {

            const {cliente} = input;

            console.log(cliente)
            // Si el pedido existe
            const existePedido = await Pedido.findById(id);
            if(!existePedido) {
                throw new Error('Ese pedido no existe');
            }

            // Si el cliente existe
            const existeCliente = await Cliente.findById(cliente);
            if(!existeCliente) {
                throw new Error('Ese cliente no existe');
            }

            // Si el cliente y pedido pertenecen al vendedor
            if(existePedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            // Revisar el stock
            if(input.pedido) {
            for await (const articulo of input.pedido) {
                const { id } = articulo;
                // Buscar el producto por el ID
                const producto = await Producto.findById(id);
                if(articulo.cantidad > producto.stock ) {
                    throw new Error(`No se puede procesar el pedido, Producto ${producto.nombre} tiene ${producto.stock} unidades disponibles.`);
                } else {
                    // Restar la cantidad a lo disponible
                    producto.stock = producto.stock - articulo.cantidad;
                    await producto.save();
                }
            }
        }
            // Guardar el pedido
            const resultado = await Pedido.findOneAndUpdate({_id: id}, input, {new: true});
            return resultado;
        },
        eliminarPedido: async (_, {id}, ctx) => {
            // Verificar si el pedido existe
            const existePedido = await Pedido.findById(id);
            if(!existePedido) {
                throw new Error('Ese pedido no existe');
            }
            // Verificar si el vendedor es quien intenta eliminar
            if(existePedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tiene las credenciales');
            }

            // Eliminar de la base de datos
            await Pedido.findOneAndDelete({_id: id});
            return 'Pedido Eliminado Correctamente';
        }
    }
}


module.exports = resolvers;