# Carrera de Mecanografía - Uso de Dedos

Pequeña aplicación web para competir escribiendo palabras. Incluye una verificación sencilla del uso de dedos (heurística) y la posibilidad de invitar a otra persona a una sala para competir en tiempo real.

Cómo usar localmente (Windows PowerShell):

1. Instalar dependencias:

```powershell
npm install
```

2. Iniciar servidor:

```powershell
npm start
```

3. Abrir en el navegador http://localhost:3000, crear una sala y compartir el código o la URL con un amigo.

Notas:
- La comprobación de "usar todos los dedos" es una heurística basada en el mapeo de teclas a dedos; no puede garantizar la postura exacta.
- Mejores mejoras: cálculo real de WPM por tiempo transcurrido, historial de partidas, autenticación de usuarios.

## Desplegar para juego público (remoto)

Puedes desplegar esta app en cualquier servicio que ejecute una instancia de Node.js o a través de un contenedor Docker. A continuación tienes instrucciones rápidas para varios proveedores y para ejecutar con Docker localmente.

Requisitos generales:
- La app escucha el puerto indicado por la variable `PORT` (por defecto 3000). Asegúrate de que el host o el proveedor expone ese puerto.

1) Deploy con Fly.io (rápido):

- Instala fly: https://fly.io/docs/getting-started/install/
- Inicia sesión e inicializa la app en la carpeta del proyecto:

```bash
fly launch --name typing-race-fingers --no-deploy
```

- Fly crea un `fly.toml`. Para desplegar:

```bash
fly deploy
```

2) Deploy en Render (servicio web):

- Crear un nuevo Web Service en https://render.com y conectar el repositorio (GitHub/GitLab). Configura el comando de start a `npm start` y el puerto a `3000` (Render usa la variable `PORT` automáticamente).

3) Deploy en Railway / Railway.app:

- Conecta el repositorio a Railway y crea un nuevo proyecto. Añade `PORT` si quieres un valor fijo (no necesario normalmente). Start command: `npm start`.

4) Usar Docker (cualquiera proveedor o local)

- Construir la imagen:

```powershell
docker build -t typing-race-fingers:latest .
```

- Ejecutar localmente (mapea puerto 3000):

```powershell
docker run -p 3000:3000 --env PORT=3000 typing-race-fingers:latest
```

5) Puntos a considerar tras desplegar

- Comparte la URL pública que te asigne el proveedor; los clientes cargarán la página y se conectarán por WebSocket (Socket.io) al mismo host.
- Si pones la app detrás de un proxy o CDN, asegúrate de que soporte WebSockets o configura sticky sessions si es necesario.

Si quieres, puedo añadir un archivo de configuración específico para un proveedor (por ejemplo `fly.toml`) o crear una acción de GitHub que despliegue automáticamente al push. ¿Qué proveedor prefieres para desplegar ahora?
