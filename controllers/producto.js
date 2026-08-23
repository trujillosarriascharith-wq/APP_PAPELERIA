import { obtenerTodos, obtenerPorId, obtenerPorCategoria, crearProducto, actualizarProducto,eliminarProducto } from "../models/producto.js";
export const listarProductos =  async (req, res) => {
    try {
        const {data, error} = await obtenerTodos();
        if (error) return res.status(500).json({error: 'Error al obtener'});
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
};
export const obtenerProducto = async (req, res) => {
    try{
        const {id} = req.params;
        const {data, error} = await obtenerPorId(id);
        if (error || !data) return res.status(404).json ({error: 'No encontrado'});
        return res.status (200).json(data);
    } catch (error){
        return res.status(500).json({ error: error.message});
    }
};

export const obtenerPorCat =async (req, res) =>{
    try{
        const {id_categoria } = req.params;
        const {data, error} = await obtenerPorCategoria (id_categoria);
        if (error) return res.status (500) .json ({error: 'Error'});
        return res.status (200) .json(data);
    } catch (error){
        return res.status(500) .json ({error: error.message});
    }
};
//crear el producto
export const crear =   async (req, res) =>{
    try{
        const { id_categoria, nombre, descripcion, precio, cantidad_stock,  } = req.body;

        //CLOUDINARY ALMACENA LA URL SEGURA EN REQ.FILE.PATH
        const imagen_url= req.file ? req.file.path: null;
        if (!nombre || !precio || !imagen_url) {
            return res.status (400) .json ({error:  'nombre, precio e imagen_url requeridos'});
        }
    const {data, error} = await crearProducto({id_categoria,
        nombre, descripcion, precio, cantidad_stock, imagen_url});
        if (error) return res.status (500) .json ({error: 'Error al crear'});
        return res.status (201) .json ({ message: 'Creado', producto: data [0]});
    }catch  (error) {
        return res.status (500) .json ({error: error.message});
    }
};

export const editar = async (req, res) =>{
    try{
        const {id_producto} =req.params;
        const {data, error} = await actualizarProducto (id_producto, req.body); 
        if (error) return res.status (500) .json ({ error: 'Error al actualizar'});
        return res.status (200) .json ({ message: 'Actualizado', producto: data[0]}); 
    }catch (error) {
        return res.status (500) .json ({ error: error.message});
    }
};

export const eliminar = async (req, res) => {
    try {
        const {id_producto}= req.params;
        const { error} = await eliminarProducto (id_producto);
        if (error) return res.status (500) .json ({ error: 'Error al eliminar'});
            return res.status (200) .json ({message: 'Eliminando'});
    }catch (error) {
        return res.status (500) .json ({error: error.message});
    }
};