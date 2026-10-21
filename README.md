Etheos
El carácter divino del conocimiento a través de tus pasiones.
Etheos es una aplicación web de aprendizaje sereno: sin notificaciones ni desplazamiento infinito. La persona elige una de 16 pasiones y entra a un módulo breve con cuatro recursos seleccionados (un video, 
un artículo, una serie de referencia y una sesión interactiva). Además, un asistente de inteligencia artificial, el Guardián de Etheos, orienta el aprendizaje con un tono formal y pedagógico.
Proyecto final de la ruta avanzada "Mi emprendimiento digital" de Jóvenes CreaTIvos.
Autora: Paula Andrea Barrios Salazar.

Enlaces
Dirección:
Página (frontend, GitHub Pages) https://e-lowww.github.io/etheos-world/

API (backend, Render)	https://etheos-world-1.onrender.com
Qué incluye
Home con identidad de marca, textos de presentación y llamadas a la acción.
Catálogo de 16 pasiones. Cada tarjeta abre un módulo interno con su descripción y 4 recursos.
Buscador del catálogo: ignora mayúsculas y tildes, y busca en el nombre de la pasión.
Favoritos: corazón en cada tarjeta, guardado en el navegador (localStorage).
Formulario "Sugiere un recurso": guarda la sugerencia en la base de datos, con validaciones en el cliente y en el servidor.
Panel de administración con login: lista las sugerencias pendientes y permite aprobarlas o rechazarlas.
Guardián de Etheos: chat con IA (Google Gemini) que conoce las 16 pasiones y responde de "usted", con calma y enfoque.
Diseño responsive (menú hamburguesa en móvil), accesible (etiquetas aria, foco visible, prefers-reduced-motion), con animaciones, estados de carga y mensajes de error claros.
Tecnologías
Capa	Tecnología
Estructura	HTML5 semántico
Estilos	CSS3 (variables, grid, flexbox, @media)
Lógica del navegador	JavaScript puro (DOM, fetch, async/await, localStorage)
Servidor	Node.js + Express
Base de datos	MongoDB Atlas, con Mongoose para el modelo de datos
Autenticación	JSON Web Token (jsonwebtoken)
Protección	express-rate-limit, cors, variables de entorno con dotenv
Inteligencia artificial	Google Gemini mediante el paquete @google/genai
Publicación	GitHub Pages (frontend), Render (backend), MongoDB Atlas (datos)
Estructura del proyecto
etheos-world/
├── frontend/
│   ├── index.html        estructura de la página
│   ├── style.css         estilos
│   ├── app.js            lógica y peticiones al backend
│   └── img/              imágenes de las tarjetas
├── backend/
│   ├── index.js          servidor Express y rutas de la API
│   ├── models/
│   │   └── Sugerencias.js  modelo y validaciones (Mongoose)
│   ├── probar-ia.js      prueba rápida de la conexión con Gemini
│   ├── package.json y package-lock.json
│   └── .env              secretos (NO se sube a GitHub)
└── README.md
Cómo funciona
Navegador (HTML + CSS + JS)
        │  fetch() con datos en JSON
        ▼
Backend en Express (Render)  ──►  Google Gemini (la llave vive solo aquí)
        │  Mongoose
        ▼
MongoDB Atlas (base de datos en la nube)
La página nunca habla directamente con Gemini ni con la base de datos: todo pasa por el backend, que es quien guarda los secretos y valida los datos.

API
Método	Ruta	Acceso	Qué hace
GET	/api/prueba	Público	Comprueba que el servidor está vivo
POST	/api/auth/login	Público (limitado)	Valida usuario y clave; devuelve un token de 2 horas
POST	/api/sugerencias	Público (limitado)	Guarda una sugerencia nueva como "pendiente"
GET	/api/admin/sugerencias	Solo admin	Lista las sugerencias pendientes
PUT	/api/admin/sugerencias/:id/aprobar	Solo admin	Marca una sugerencia como aprobada
DELETE	/api/admin/sugerencias/:id	Solo admin	Elimina una sugerencia rechazada
POST	/api/guardian/chat	Público (limitado)	Envía una pregunta al Guardián y devuelve su respuesta

Variables de entorno

Se definen en backend/.env (en local) o en el panel de Render (publicado).
Variable	Para qué sirve
MONGODB_URI	Cadena de conexión de MongoDB Atlas
GEMINI_API_KEY	Llave de Google AI Studio
GEMINI_MODEL Nombre del modelo de Gemini
ADMIN_USUARIO	Usuario del administrador
ADMIN_CLAVE	Clave del administrador
JWT_SECRET	Frase secreta con la que se firman los tokens
FRONTEND_URL  Direcciones del frontend permitidas por CORS, separadas por coma
NODE_ENV	production al publicar
PORT	Puerto del servidor (Render lo asigna solo)
Ejecutar en local

Backend
Entrar a la carpeta: cd backend
Instalar los paquetes: npm install
Crear el archivo .env con las variables de la tabla anterior.
Encender el servidor: node index.js. Debe mostrar que está conectado a MongoDB Atlas y escuchando en el puerto 3000.

Frontend
Abrir frontend/index.html en el navegador (o con la extensión Live Server de VS Code). El archivo app.js detecta que está en local y usa http://localhost:3000 como dirección del backend; publicado,
usa la de Render.

Seguridad
Los secretos viven en variables de entorno, no en el código.
Las rutas del panel exigen un token firmado y con vencimiento (2 horas); las credenciales se comparan de forma segura.
Límites de uso: login (10 intentos cada 15 minutos), chat (10 consultas por minuto) y sugerencias (20 por hora). Las preguntas al chat tienen un máximo de 500 caracteres y el cuerpo de las peticiones, 10 KB.
Validaciones en el modelo de Mongoose: categoría entre las 16 permitidas, enlace que debe empezar por http:// o https://, correo con formato válido y largos máximos.
El panel pinta los datos con textContent (no con innerHTML), para que lo que escribe un visitante nunca se ejecute como código.
CORS configurable con FRONTEND_URL para aceptar solo la página oficial.
Las instrucciones del Guardián se envían como instrucción del sistema, separadas de lo que escribe la persona.
Decisiones técnicas
JavaScript puro en lugar de un framework. por comodidad.
Sin cuentas de usuario. El sitio es de acceso libre, como dice su propuesta: un refugio sin registro ni notificaciones. La única cuenta es la de administración.
Un solo administrador. El acceso al panel se mantiene discreto (el icono de la corona) y está protegido por token en el servidor.
La IA solo se consulta desde el backend, para que la llave de Google nunca viaje al navegador.
Limitaciones conocidas
Es una demo: las cifras de la portada son ilustrativas.
El Guardián usa la cuota gratuita de Google AI Studio, con límites por minuto y por día compartidos entre todos los visitantes. Si se agotan, el chat responde con un aviso amable. En el plan gratuito, Google puede usar lo que se escribe para mejorar sus productos, por lo que no deben ingresarse datos personales.
El plan gratuito de Render duerme el servidor tras 15 minutos sin visitas; la primera respuesta puede demorar.
El catálogo (16 módulos) está escrito directamente en el HTML.
Las sugerencias rechazadas se eliminan; no hay historial de revisión.
