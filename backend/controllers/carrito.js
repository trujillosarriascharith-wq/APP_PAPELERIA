import {
    obtenerOCrearCarrito,
    obtenerDetalleCarrito,
    obtenerDetalleCarritoPorProducto,
    obtenerDetallePorId,
    agregarDetalleCarrito,
    actualizarCantidadDetalle,
    actualizarDetalle,
    eliminarDetalleCarrito,
    vaciarCarritoPorUsuario,
} from '../models/carrito.js';
import { obtenerProductoPorId } from '../models/producto.js';

// Verifica que la cantidad total pedida no pase del stock real.
// Devuelve null si todo está bien, o { status, error } si no.
// Agregar al carrito NO descuenta stock: solo valida.
const validarStock = async (id_producto, cantidadTotal) => {
    const { data: prod, error } = await obtenerProductoPorId(id_producto);
    if (error || !prod) return { status: 404, error: 'El producto ya no existe' };

    const stock = Number(prod.cantidad_stock);
    if (stock <= 0) return { status: 409, error: `${prod.nombre} está agotado` };
    if (cantidadTotal > stock) {
        return { status: 409, error: `Solo hay ${stock} disponibles de ${prod.nombre}` };
    }
    return null;
};

// Obtener el carrito del usuario autenticado con sus items
export const obtenerMiCarrito = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario || req.usuario.id;

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

// Agregar un producto al carrito (o sumar cantidad si ya existe)
export const agregarProducto = async (req, res) => {
    try {
        console.log('📥 AGREGAR AL CARRITO:', req.body);
        const id_usuario = req.usuario.id_usuario || req.usuario.id;
        const id_producto = Number(req.body.id_producto);
        const cantidad = Number(req.body.cantidad);

        if (!id_producto || !cantidad || cantidad <= 0) {
            return res.status(400).json({
                error: 'El id_producto y la cantidad son requeridos'
            });
        }

        const { data: carrito, error: errorCarrito } = await obtenerOCrearCarrito(id_usuario);
        if (errorCarrito) {
            console.log(errorCarrito);
            return res.status(500).json({
                error: 'Error al obtener el carrito',
                detalle: errorCarrito.message
            });
        }

        const { data: itemExistente } = await obtenerDetalleCarritoPorProducto(carrito.id_carrito, id_producto);

        // Lo que ya tiene en el carrito + lo nuevo no puede pasar del stock
        const totalDeseado = (itemExistente ? itemExistente.cantidad : 0) + cantidad;
        const problema = await validarStock(id_producto, totalDeseado);
        if (problema) return res.status(problema.status).json({ error: problema.error });

        if (itemExistente) {
            const { data, error } = await actualizarCantidadDetalle(
                itemExistente.id_detalle_carrito,
                totalDeseado
            );
            if (error) {
                console.log(error);
                return res.status(500).json({
                    error: 'Error al actualizar el carrito',
                    detalle: error.message
                });
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
                error: 'Error al agregar el producto al carrito',
                detalle: error.message
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

// Actualizar un item del carrito: la cantidad y/o la casilla "seleccionado"
export const actualizarCantidad = async (req, res) => {
    try {
        const { id_detalle } = req.params;
        const { cantidad, seleccionado } = req.body;

        const campos = {};

        if (cantidad !== undefined) {
            if (!(Number(cantidad) > 0)) {
                return res.status(400).json({
                    error: 'La cantidad debe ser mayor a 0'
                });
            }

            // Solo se valida el stock cuando el usuario SUBE la cantidad
            const { data: detalle } = await obtenerDetallePorId(id_detalle);
            if (!detalle) {
                return res.status(404).json({ error: 'El producto no está en tu carrito' });
            }
            if (Number(cantidad) > detalle.cantidad) {
                const problema = await validarStock(detalle.id_producto, Number(cantidad));
                if (problema) return res.status(problema.status).json({ error: problema.error });
            }

            campos.cantidad = Number(cantidad);
        }
        if (seleccionado !== undefined) {
            campos.seleccionado = Boolean(seleccionado);
        }

        if (Object.keys(campos).length === 0) {
            return res.status(400).json({
                error: 'No se enviaron campos para actualizar'
            });
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
        console.error('Error en actualizar cantidad:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Eliminar un item del carrito
export const eliminarProducto = async (req, res) => {
    try {
        const { id_detalle } = req.params;

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

// Vaciar el carrito completo (borra los productos, conserva el carrito)
export const vaciarCarrito = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario || req.usuario.id;
        const { error } = await vaciarCarritoPorUsuario(id_usuario);
        if (error) throw error;
        return res.status(200).json({ message: 'Carrito vaciado' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};