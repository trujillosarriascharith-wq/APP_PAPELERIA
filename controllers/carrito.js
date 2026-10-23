import {
    obtenerOCrearCarrito,
    obtenerCarritoPorUsuario,
    obtenerDetalleCarrito,
    obtenerDetalleCarritoPorProducto,
    obtenerDetalleConProducto,
    agregarDetalleCarrito,
    actualizarCantidadDetalle,
    actualizarDetalle,
    eliminarDetalleCarrito,
    vaciarCarritoPorUsuario,
} from '../models/carrito.js';
import { obtenerProductoPorId } from '../models/producto.js';

// El id del usuario sale del token
const idDeUsuario = (req) => req.usuario?.id_usuario ?? req.usuario?.id;

const mensajeStock = (nombre, disponibles) =>
    disponibles > 0
        ? `No hay más piezas disponibles de "${nombre}". Disponibles: ${disponibles}`
        : `"${nombre}" está agotado`;

// Devuelve el item solo si existe y pertenece al carrito del usuario autenticado
const detalleDelUsuario = async (id_usuario, id_detalle) => {
    const { data: detalle } = await obtenerDetalleConProducto(id_detalle);
    if (!detalle) return null;
    const { data: carrito } = await obtenerCarritoPorUsuario(id_usuario);
    if (!carrito || carrito.id_carrito !== detalle.id_carrito) return null;
    return detalle;
};

// Obtener el carrito del usuario autenticado con sus items (y los datos de cada producto)
export const obtenerMiCarrito = async (req, res) => {
    try {
        const id_usuario = idDeUsuario(req);

        const { data: carrito, error: errorCarrito } = await obtenerOCrearCarrito(id_usuario);
        if (errorCarrito) {
            console.log(errorCarrito);
            return res.status(500).json({
                error: 'Error al obtener el carrito',
                detalle: errorCarrito.message
            });
        }
        const { data: items, error: errorItems } = await obtenerDetalleCarrito(carrito.id_carrito);
        if (errorItems) {
            console.log(errorItems);
            return res.status(500).json({
                error: 'Error al obtener los items del carrito',
                detalle: errorItems.message
            });
        }

        return res.status(200).json({ carrito, items });
    } catch (error) {
        console.error('Error en obtener mi carrito:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Agregar un producto al carrito (o sumar cantidad si ya existe), sin pasar del stock
export const agregarProducto = async (req, res) => {
    try {
        const id_usuario = idDeUsuario(req);
        const id_producto = Number(req.body.id_producto);
        const cantidad = Number(req.body.cantidad);

        if (!id_producto || !Number.isInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                error: 'El id_producto y una cantidad válida son requeridos'
            });
        }

        const { data: producto, error: errorProducto } = await obtenerProductoPorId(id_producto);
        if (errorProducto || !producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const { data: carrito, error: errorCarrito } = await obtenerOCrearCarrito(id_usuario);
        if (errorCarrito) {
            return res.status(500).json({
                error: 'Error al obtener el carrito'
            });
        }

        const { data: itemExistente } = await obtenerDetalleCarritoPorProducto(carrito.id_carrito, id_producto);

        // Lo que ya tiene en el carrito + lo nuevo no puede superar el stock
        const nuevaCantidad = (itemExistente ? itemExistente.cantidad : 0) + cantidad;
        if (nuevaCantidad > producto.cantidad_stock) {
            return res.status(409).json({
                error: mensajeStock(producto.nombre, producto.cantidad_stock),
                disponibles: producto.cantidad_stock
            });
        }

        if (itemExistente) {
            const { data, error } = await actualizarCantidadDetalle(
                itemExistente.id_detalle_carrito,
                nuevaCantidad
            );
            if (error) {
                return res.status(500).json({ error: 'Error al actualizar el carrito' });
            }
            return res.status(200).json({
                message: 'Cantidad actualizada en el carrito',
                item: data[0]
            });
        }

        const { data, error } = await agregarDetalleCarrito(carrito.id_carrito, id_producto, cantidad);
        if (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Error al agregar el producto al carrito'
            });
        }

        return res.status(201).json({
            message: 'Producto agregado al carrito',
            item: data[0]
        });
    } catch (error) {
        console.error('Error en agregar producto al carrito:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Actualizar un item del carrito: la cantidad (sin pasar del stock) y/o la casilla "seleccionado".
// Body: { "cantidad": 3 }  o  { "seleccionado": false }  o ambos.
export const actualizarCantidad = async (req, res) => {
    try {
        const id_usuario = idDeUsuario(req);
        const { id_detalle } = req.params;
        const campos = {};

        if (req.body.cantidad !== undefined) {
            const cantidad = Number(req.body.cantidad);
            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                return res.status(400).json({
                    error: 'La cantidad debe ser mayor a 0'
                });
            }
            campos.cantidad = cantidad;
        }

        if (req.body.seleccionado !== undefined) {
            if (typeof req.body.seleccionado !== 'boolean') {
                return res.status(400).json({
                    error: 'seleccionado debe ser true o false'
                });
            }
            campos.seleccionado = req.body.seleccionado;
        }

        if (Object.keys(campos).length === 0) {
            return res.status(400).json({
                error: 'Envía la cantidad o seleccionado'
            });
        }

        const detalle = await detalleDelUsuario(id_usuario, id_detalle);
        if (!detalle) {
            return res.status(404).json({ error: 'Producto no encontrado en tu carrito' });
        }

        // Si cambia la cantidad, no puede superar el stock
        if (campos.cantidad !== undefined) {
            const stock = detalle.productos?.cantidad_stock ?? 0;
            if (campos.cantidad > stock) {
                return res.status(409).json({
                    error: mensajeStock(detalle.productos?.nombre ?? 'este producto', stock),
                    disponibles: stock
                });
            }
        }

        const { data, error } = await actualizarDetalle(id_detalle, campos);
        if (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Error al actualizar el carrito',
                detalle: error.message
            });
        }

        return res.status(200).json({
            message: 'Carrito actualizado exitosamente',
            item: data[0]
        });
    } catch (error) {
        console.error('Error en actualizar carrito:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Eliminar un item del carrito
export const eliminarProducto = async (req, res) => {
    try {
        const id_usuario = idDeUsuario(req);
        const { id_detalle } = req.params;

        const detalle = await detalleDelUsuario(id_usuario, id_detalle);
        if (!detalle) {
            return res.status(404).json({ error: 'Producto no encontrado en tu carrito' });
        }

        const { error } = await eliminarDetalleCarrito(id_detalle);
        if (error) {
            return res.status(500).json({
                error: 'Error al eliminar el producto del carrito'
            });
        }

        return res.status(200).json({
            message: 'Producto eliminado del carrito'
        });
    } catch (error) {
        console.error('Error en eliminar producto del carrito:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Vaciar el carrito (borra sus items; el carrito del usuario se conserva)
export const vaciarCarrito = async (req, res) => {
    try {
        const id_usuario = idDeUsuario(req);
        const { error } = await vaciarCarritoPorUsuario(id_usuario);
        if (error) throw error;
        return res.status(200).json({ message: "Carrito vaciado" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};