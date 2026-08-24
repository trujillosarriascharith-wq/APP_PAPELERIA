import * as CarritoModel from "../models/carrito.js";

// 1. Ver carrito de un usuario
export const obtenerCarrito = async (req, res) => {
  try {
    const { id_usuario } = req.params; // GET /carrito/:id_usuario

    const { data: carrito, error } = await CarritoModel.obtenerCarritoPorUsuario(id_usuario);

    if (error || !carrito) {
      return res.status(200).json({ carrito: null, productos: [] });
    }

    const { data: productos, error: errorDetalle } = await CarritoModel.obtenerDetalleCarrito(carrito.id_carrito);

    if (errorDetalle) {
      return res.status(500).json({ error: "Error al obtener detalle", detalle: errorDetalle });
    }

    res.json({ carrito, productos });

  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};

// 2. Agregar producto al carrito
export const agregarAlCarrito = async (req, res) => {
  try {
    const { id_usuario, id_producto, cantidad } = req.body;

    if (!id_usuario || !id_producto) {
      return res.status(400).json({ error: "id_usuario y id_producto son obligatorios" });
    }

    // Buscar si el usuario ya tiene carrito, si no, crearlo
    let { data: carrito } = await CarritoModel.obtenerCarritoPorUsuario(id_usuario);

    if (!carrito) {
      const { data: nuevoCarrito, error: errorCrear } = await CarritoModel.crearCarrito(id_usuario);
      if (errorCrear) return res.status(500).json({ error: "Error al crear carrito", detalle: errorCrear });
      carrito = nuevoCarrito;
    }

    const { data, error } = await CarritoModel.agregarProductoCarrito(
      carrito.id_carrito,
      id_producto,
      cantidad || 1
    );

    if (error) return res.status(500).json({ error: "Error al agregar", detalle: error });

    res.status(201).json({ mensaje: "Producto agregado al carrito", data });

  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};

// 3. Actualizar cantidad
export const actualizarCantidadCarrito = async (req, res) => {
  try {
    const { id_detalle_carrito } = req.params;
    const { cantidad } = req.body;

    if (cantidad < 1) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
    }

    const { data, error } = await CarritoModel.actualizarCantidad(id_detalle_carrito, cantidad);
    if (error) return res.status(500).json({ error: "Error al actualizar", detalle: error });

    res.json({ mensaje: "Cantidad actualizada", data });
  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};

// 4. Eliminar un producto del carrito
export const eliminarDelCarrito = async (req, res) => {
  try {
    const { id_detalle_carrito } = req.params;
    const { error } = await CarritoModel.eliminarProductoCarrito(id_detalle_carrito);

    if (error) return res.status(500).json({ error: "Error al eliminar", detalle: error });

    res.json({ mensaje: "Producto eliminado del carrito" });
  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};

// 5. Vaciar todo el carrito
export const vaciarCarrito = async (req, res) => {
  try {
    const { id_carrito } = req.params;
    const { error } = await CarritoModel.vaciarCarrito(id_carrito);

    if (error) return res.status(500).json({ error: "Error al vaciar carrito", detalle: error });

    res.json({ mensaje: "Carrito vaciado" });
  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};