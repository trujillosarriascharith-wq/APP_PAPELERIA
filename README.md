PAPELERIA Y VARIEDADES JUAN JOSE-SISTEMA DE PEDIDOS DE PRODUCTOS ESCOLARES

APLICACION MOVIL PARA GESTIONAR EL CATÁLAGO DE PRODUCTOS,USUARIOS Y PEDIDOS DE UNA PAPELERIA

🛠️Stack Tecnológico

El proyecto utiliza una arquitectura moderna basada en un cliente móvil, un servidor backend y una base de datos en la nube , integrando las siguientes tecnologías:

•	Node.js + express (backend)

•	Superbase

•	Flutter (frontend)

•	JWT para el manejo de sesiones


Características del Proyecto

🔒 1. Autenticación y Seguridad

•	Registro e Inicio de Sesión: Autenticación segura para usuarios mediante tokens (JWT).

•	Control de Acceso Basado en Roles (RBAC): Vistas y permisos diferenciados para perfiles Cliente y Administrador.


•	Protección de Rutas: Middlewares en el backend para restringir el acceso a endpoints sensibles según el rol.


⚙️ Instalación y Configuración

•	Clonar el repositoriogit clone https://github.com/trujillosarriascharith-wq/APP_PAPELERIA.git

•	Instalacion de node


•	instalar npm install

•	Instalar libreria de node express


•	Instalar libreria de superbase


2.ejecutar el Servidor 


**nmp run dev


Estructura del programa 


APP_PAPELERIAS/
└── backend/
    ├── config/             # Configuraciones (Cloudinary, Supabase, etc.)
    │   ├── cloudinary.js
    │   └── supabase.js
    ├── controllers/        # Lógica de negocio de la aplicación
    ├── middlewares/        # Validaciones, autenticación y middleware
    ├── models/             # Modelos y esquemas de datos
    ├── node_modules/       # Dependencias instaladas del proyecto
    ├── routes/             # Definición de rutas y endpoints del API
    ├── services/           # Servicios externos y lógica de soporte
    ├── uploads/            # Archivos y recursos subidos localmente
    ├── utils/              # Funciones auxiliares y helpers
    ├── .env                # Variables de entorno secretas (Local)
    ├── .gitignore          # Exclusiones de control de versiones
    ├── index.js            # Punto de entrada y servidor principal
    ├── package-lock.json   # Registro exacto de versiones de dependencias
    ├── package.json        # Dependencias y scripts de Node.js
    └── README.md           # Documentación principal del proyecto



**👩‍💻Autor**


* **Charlie Briyet Trujillo Sarrias**
* *Tecnóloga en Análisis y Desarrollo de Software (ADSO)*










