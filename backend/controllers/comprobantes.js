import {
    crearComprobante,
    obtenerComprobantePorId,
    obtenerComprobanteVigente,
    listarComprobantes,
    actualizarEstadoComprobante,
} from '../models/comprobantes.js';
import { obtenerProductosPorIds } from '../models/pedido.js';
import { subirFoto } from '../utils/subirFoto.js';
import { notificar, notificarAdmins } from '../utils/notificar.js';

const CARPETA_COMPROBANTES = 'papeleria/comprobantes';
const idDelToken = (req) => req.usuario.id_usuario || req.usuario.id;
const pesos = (n) => `$${Number(n).toLocaleString('es-CO')}`;

// En multipart los productos llegan como texto JSON: [{"id_producto":1,"cantidad":2}]
const leerItems = (valor) => {
    try {
        const lista = typeof valor === 'string' ? JSON.parse(valor) : valor;
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
};

// Texto que ve el administrador en la notificación
const armarMensaje = (id_comprobante, d) =>
    [
        `Nuevo comprobante de pago #${id_comprobante} por validar`,
        `Cliente: ${d.nombre}`,
        `Dirección: ${d.direccion}`,
        `Teléfono: ${d.telefono}`,
        'Productos:',
        ...d.items.map(
            (i) => `• ${i.cantidad} x ${i.nombre} (${pesos(i.precio)} c/u) = ${pesos(i.subtotal)}`
        ),
        `Total: ${pesos(d.total)}`,
    ].join('\n');

// El cliente sube la imagen del comprobante junto con los datos del pedido (queda "pendiente")
export const subir = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Adjunta la imagen del comprobante' });
        }
        const id_usuario = idDelToken(req);

        const { nombre, direccion, telefono } = req.body || {};
        if (!nombre?.trim() || !direccion?.trim() || !telefono?.trim()) {
            return res.status(400).json({
                error: 'Completa nombre, dirección y teléfono antes de adjuntar el comprobante',
            });
        }
        const pedidos = leerItems(req.body?.items);
        if (pedidos.length === 0) {
            return res.status(400).json({ error: 'El pedido no tiene productos' });
        }

        // Nombres y precios salen de la base de datos, no del celular
        const ids = pedidos.map((i) => Number(i.id_producto));
        const { data: productos, error: errorProd } = await obtenerProductosPorIds(ids);
        if (errorProd) {
            return res.status(500).json({ error: 'Error al consultar los productos', detalle: errorProd.message });
        }

        const items = [];
        let total = 0;
        for (const p of pedidos) {
            const id_producto = Number(p.id_producto);
            const cantidad = Number(p.cantidad);
            const prod = (productos || []).find((x) => Number(x.id_producto) === id_producto);
            if (!prod) {
                return res.status(400).json({ error: `El producto ${id_producto} ya no existe` });
            }
            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                return res.status(400).json({ error: `Cantidad inválida para ${prod.nombre}` });
            }
            const precio = Number(prod.precio);
            const subtotal = precio * cantidad;
            total += subtotal;
            items.push({ id_producto, nombre: prod.nombre, cantidad, precio, subtotal });
        }

        const datos = {
            nombre: nombre.trim(),
            direccion: direccion.trim(),
            telefono: String(telefono).trim(),
            items,
            total,
        };

        const imagen = await subirFoto(req.file.buffer, CARPETA_COMPROBANTES);
        const { data, error } = await crearComprobante({ id_usuario, imagen, datos });
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al guardar el comprobante', detalle: error.message });
        }
        const comprobante = data[0];

        // Aviso a los administradores: datos del pedido + foto + botones (id_comprobante)
        notificarAdmins(armarMensaje(comprobante.id_comprobante, datos), {
            imagen,
            id_comprobante: comprobante.id_comprobante,
        });

        return res.status(201).json({ message: 'Comprobante enviado', comprobante });
    } catch (error) {
        console.error('Error en subir comprobante:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Consultar un comprobante (solo su dueño o un administrador)
export const consultar = async (req, res) => {
    try {
        const { data, error } = await obtenerComprobantePorId(req.params.id);
        if (error || !data) {
            return res.status(404).json({ error: 'Comprobante no encontrado' });
        }
        const esDueno = data.id_usuario === idDelToken(req);
        if (!esDueno && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permiso para ver este comprobante' });
        }
        return res.status(200).json({ comprobante: data });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Último comprobante del cliente que aún se puede usar (o null)
export const vigente = async (req, res) => {
    try {
        const { data, error } = await obtenerComprobanteVigente(idDelToken(req));
        if (error) {
            return res.status(500).json({ error: 'Error al consultar el comprobante', detalle: error.message });
        }
        return res.status(200).json({ comprobante: data || null });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Administrador: lista los comprobantes (?estado=pendiente)
export const listar = async (req, res) => {
    try {
        const { data, error } = await listarComprobantes(req.query.estado);
        if (error) {
            return res.status(500).json({ error: 'Error al listar los comprobantes', detalle: error.message });
        }
        return res.status(200).json({ comprobantes: data });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

// Administrador: aprueba o rechaza y avisa al cliente
export const validar = async (req, res) => {
    try {
        const { estado, motivo } = req.body || {};
        if (!['aprobado', 'rechazado'].includes(estado)) {
            return res.status(400).json({ error: 'estado debe ser aprobado o rechazado' });
        }

        const { data, error } = await actualizarEstadoComprobante(req.params.id, estado, idDelToken(req));
        if (error || !data || data.length === 0) {
            return res.status(500).json({ error: 'No se pudo validar el comprobante', detalle: error?.message });
        }
        const comprobante = data[0];

        if (estado === 'aprobado') {
            notificar(comprobante.id_usuario, 'Tu pago por Nequi fue validado. Ya puedes realizar tu pedido.');
        } else {
            notificar(
                comprobante.id_usuario,
                `Tu comprobante de pago fue rechazado${motivo ? `. Motivo: ${motivo}` : ''}. Adjunta uno nuevo.`
            );
        }

        return res.status(200).json({ message: `Comprobante ${estado}`, comprobante });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};