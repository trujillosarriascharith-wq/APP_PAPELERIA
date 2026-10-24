import {
    crearProducto,
    obtenerProductos,
    obtenerProductosPorCategoria,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto
} from '../models/producto.js';
import { subirFoto } from '../utils/subirFoto.js';

// Con multipart todo llega como texto: pasa a número, o undefined si no vino
const aNumero = (v) => (v === undefined || v === '' ? undefined : Number(v));

// Mantiene el estado de acuerdo con el stock:
// sin unidades -> 'agotado'; con unidades vuelve a 'activo'. 'inactivo' no se toca.
const ajustarEstado = (estado, stock) => {
    const actual = String(estado ?? 'activo').toLowerCase();
    if (stock === undefined || actual === 'inactivo') return estado;
    if (stock <= 0 && actual === 'activo') return 'agotado';
    if (stock > 0 && actual === 'agotado') return 'activo';
    return estado;
};

// Crear producto (la foto llega en el campo "imagen")
export const crear = async (req, res) => {
    try {
        console.log("📥 Datos recibidos en CREAR PRODUCTO:", req.body);
        const { id_categoria, nombre, descripcion, estado } = req.body;
        const precio = aNumero(req.body.precio);
        const cantidad_stock = aNumero(req.body.cantidad_stock) ?? 0;

        if (!nombre || !precio || Number.isNaN(precio) || !id_categoria) {
            return res.status(400).json({
                error: 'El nombre, el precio y la categoria del producto son requeridos'
            });
        }
        if (Number.isNaN(cantidad_stock)) {
            return res.status(400).json({ error: 'La cantidad no es valida' });
        }

        // Si llega un archivo se sube a Cloudinary; si no, se acepta una URL
        let imagen = req.body.imagen || null;
        if (req.file) {
            imagen = await subirFoto(req.file.buffer, 'papeleria/productos');
        }

        const { data, error } = await crearProducto(
            Number(id_categoria), nombre, descripcion, precio, cantidad_stock, imagen,
            ajustarEstado(estado, cantidad_stock)
        );
        if (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Error al crear el producto',
                detalle: error.message
            });
        }

        return res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: data[0]
        });
    } catch (error) {
        console.error('Error en crear producto:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Listar productos (opcionalmente filtrando por categoria con ?id_categoria=)
export const listar = async (req, res) => {
    try {
        const { id_categoria } = req.query;

        const { data, error } = id_categoria
            ? await obtenerProductosPorCategoria(id_categoria)
            : await obtenerProductos();

        if (error) {
            return res.status(500).json({
                error: 'Error al obtener los productos'
            });
        }
        return res.status(200).json({ productos: data });
    } catch (error) {
        console.error('Error en listar productos:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Obtener un producto
export const obtener = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await obtenerProductoPorId(id);
        if (error) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }
        return res.status(200).json({ producto: data });
    } catch (error) {
        console.error('Error en obtener producto:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};

// Actualizar producto (solo cambia los campos que lleguen; la foto es opcional)
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const campos = {};

        for (const k of ['nombre', 'descripcion', 'estado', 'imagen']) {
            if (req.body[k] !== undefined) campos[k] = req.body[k];
        }
        for (const k of ['id_categoria', 'precio', 'cantidad_stock']) {
            const n = aNumero(req.body[k]);
            if (n !== undefined) campos[k] = n;
        }
        if (req.file) {
            campos.imagen = await subirFoto(req.file.buffer, 'papeleria/productos');
        }

        // Si cambia el stock, el estado se ajusta solo (0 = agotado, más de 0 = activo)
        if (campos.cantidad_stock !== undefined) {
            let estadoActual = campos.estado;
            if (estadoActual === undefined) {
                const { data: actual } = await obtenerProductoPorId(id);
                estadoActual = actual?.estado;
            }
            const nuevoEstado = ajustarEstado(estadoActual, campos.cantidad_stock);
            if (nuevoEstado !== undefined) campos.estado = nuevoEstado;
        }

        const { data, error } = await actualizarProducto(id, campos);
        if (error) {
            return res.status(500).json({
                error: 'Error al actualizar el producto'
            });
        }
        return res.status(200).json({
            message: 'Producto actualizado exitosamente',
            producto: data[0]
        });
    } catch (error) {
        console.error('Error en actualizar producto:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};


export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await eliminarProducto(id);

        if (error) {
            console.error('Error de Supabase al eliminar:', error);
            return res.status(500).json({
                error: 'Error al eliminar el producto',
                detalle: error.message,
                codigo: error.code
            });
        }

        return res.status(200).json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error en eliminar producto:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            detalle: error.message
        });
    }
};