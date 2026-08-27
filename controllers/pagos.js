import { crearPago, obtenerPagos, obtenerPagoPorPedido, actualizarEstadoPago, eliminarPago } from '../models/pagos.js';
import { actualizarEstadoPedido } from '../models/pedido.js';

//registrar un pago
export const registrarPago = async (req, res) => {
    try {
        console.log("💳 Datos recibidos en CREAR PAGO:", req.body);
        const { id_pedido, metodo_pago, monto } = req.body;

        if (!id_pedido || !metodo_pago || !monto) {
            return res.status(400).json({ error: 'id_pedido, metodo_pago y monto son requeridos' });
        }

        const { data, error } = await crearPago(id_pedido, metodo_pago, monto);
        if (error) return res.status(500).json({ error: 'Error al registrar el pago' });

        return res.status(201).json({ message: 'Pago registrado exitosamente', pago: data[0] });
    } catch (error) {
        console.error('Error en registrar pago:', error);
        res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
    }
};

//listar todos los pagos
export const listarPagos = async (req, res) => {
    try {
        const { data, error } = await obtenerPagos();
        if (error) return res.status(500).json({ error: 'Error al obtener los pagos' });
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error en listar pagos:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

//obtener el pago de un pedido
export const obtenerPago = async (req, res) => {
    try {
        const { id_pedido } = req.params;
        const { data, error } = await obtenerPagoPorPedido(id_pedido);
        if (error || !data) return res.status(404).json({ error: 'Pago no encontrado' });
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error en obtener pago:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

//confirmar o actualizar estado de un pago
export const editarEstadoPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, id_pedido } = req.body;

        if (!estado) return res.status(400).json({ error: 'estado es requerido' });

        const { data, error } = await actualizarEstadoPago(id, estado);
        if (error) return res.status(500).json({ error: 'Error al actualizar el estado del pago' });

        //si el pago se confirma, actualizar el pedido a pagado
        if (estado === 'confirmado' && id_pedido) {
            await actualizarEstadoPedido(id_pedido, 'pagado');
        }

        return res.status(200).json({ message: 'Estado del pago actualizado', pago: data[0] });
    } catch (error) {
        console.error('Error en editar estado pago:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

//eliminar un pago
export const borrarPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await eliminarPago(id);
        if (error) return res.status(500).json({ error: 'Error al eliminar el pago' });
        return res.status(200).json({ message: 'Pago eliminado' });
    } catch (error) {
        console.error('Error en borrar pago:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};