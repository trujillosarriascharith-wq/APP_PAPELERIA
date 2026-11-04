// import express from "express";
// import { chatearConPapeleria, obtenerHistorialPapeleria } from "../controllers/chatPapeleriaControllers.js";

// const router = express.Router();

// router.post("/", chatearConPapeleria);
// router.get("/historial/:sesionId", obtenerHistorialPapeleria);

// export default router;
import express from "express";
import { chatearConPapeleria, obtenerHistorialPapeleria } from "../controllers/chatPapeleriaControllers.js";
import { verificarTokenOpcional } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/", verificarTokenOpcional, chatearConPapeleria);
router.get("/historial/:sesionId", obtenerHistorialPapeleria);

export default router;