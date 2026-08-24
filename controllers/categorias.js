import * as CategoriaModel from "../models/categorias.js";

// 1. Obtener todas las categorias
export const getCategorias = async (req, res) => {
  try {
    const { data, error } = await CategoriaModel.obtenerCategorias();
    if (error) return res.status(500).json({ error: "Error al obtener categorias", detalle: error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};

// 2. Obtener una categoria por ID
export const getCategoriaPorId = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const { data, error } = await CategoriaModel.obtenerCategoriaPorId(id_categoria);

    if (error) return res.status(404).json({ error: "Categoria no encontrada" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};

// 3. Crear categoria
export const createCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, imagen } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const { data, error } = await CategoriaModel.crearCategoria({
      nombre,
      descripcion,
      imagen
    });

    if (error) return res.status(500).json({ error: "Error al crear", detalle: error });
    res.status(201).json({ mensaje: "Categoria creada", data });
  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};

// 4. Actualizar categoria
export const updateCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const { nombre, descripcion, imagen } = req.body;

    const { data, error } = await CategoriaModel.actualizarCategoria(id_categoria, {
      nombre,
      descripcion,
      imagen
    });

    if (error) return res.status(500).json({ error: "Error al actualizar", detalle: error });
    res.json({ mensaje: "Categoria actualizada", data });
  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};

// 5. Eliminar categoria
export const deleteCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const { error } = await CategoriaModel.eliminarCategoria(id_categoria);

    if (error) return res.status(500).json({ error: "Error al eliminar", detalle: error });
    res.json({ mensaje: "Categoria eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error en servidor", detalle: err.message });
  }
};