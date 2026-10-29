import {
    crearComprobante,
    obtenerComprobantePorId,
    obtenerComprobanteVigente,
    listarComprobantes,
    actualizarEstadoComprobante,
} from '../models/comprobantes.js';
import { subirFoto } from '../utils/subirFoto.js';
import { notificar, notificarAdmins } from '../utils/notificar.js'; //[cite: 1, 2]

const CARPETA_COMPROBANTES = 'papeleria/comprobantes';
const idDelToken = (req) => req.usuario.id_usuario || req.usuario.id;

// El cliente sube la imagen del comprobante (queda "pendiente")
export const subir = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Adjunta la imagen del comprobante' });
        }
        const id_usuario = idDelToken(req);

        const imagen = await subirFoto(req.file.buffer, CARPETA_COMPROBANTES);
        const { data, error } = await crearComprobante({ id_usuario, imagen });
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al guardar el comprobante', detalle: error.message });
        }

        // Notificar a los administradores sobre el nuevo comprobante pendiente
        notificarAdmins(`Nuevo comprobante de pago #${data[0].id_comprobante} pendiente de validar.`); //[cite: 1, 2]

        return res.status(201).json({ message: 'Comprobante enviado', comprobante: data[0] });
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