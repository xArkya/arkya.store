# Instagram Importer con Instaloader

Este sistema combina métodos web y un backend con Instaloader para extraer datos reales de Instagram.

## 🚀 Configuración

### 1. Instalar dependencias del servidor

```bash
# Instalar dependencias de Node.js (opcional)
npm install

# Instalar dependencias de Python
pip install instaloader

# O usar el script de npm
npm run install-python-deps
```

### 2. Iniciar el servidor backend

```bash
# Iniciar el servidor Express (puerto 3001)
npm run server
```

El servidor mostrará:
```
🚀 Instagram scraper server corriendo en http://localhost:3001
📁 Scripts en: /path/to/project/scripts
🔍 Endpoint disponible: POST /api/instagram/scrape
```

### 3. Iniciar la aplicación frontend

```bash
# En otra terminal
npm run dev
```

## 📋 Uso

### Método Web (Limitado)
- Funciona directamente en el navegador
- Puede ser bloqueado por Instagram
- No requiere servidor adicional

### Método Instaloader (Recomendado)
- Usa Python + Instaloader
- Extrae datos reales y confiables
- Requiere servidor backend corriendo

## 🔧 Componentes

### 1. InstagramImporter.jsx
- Método web con múltiples proxies
- Fallback a datos de demostración
- Integrado directamente en el frontend

### 2. InstaloaderImporter.jsx
- Interfaz dual (Web + Instaloader)
- Verificación de estado del servidor
- Datos reales del post de Instagram

### 3. server.js
- Servidor Express en puerto 3001
- Endpoint: `POST /api/instagram/scrape`
- Ejecuta script Python con Instaloader

### 4. instagram-scraper.py
- Script Python con Instaloader
- Extrae imágenes, descripción, likes, etc.
- Maneja carrousel y videos

## 📊 Flujo de datos

```
Frontend → Backend → Python Script → Instagram → Datos Reales → Frontend
```

## 🛠️ Troubleshooting

### Error: "Servidor no está corriendo"
```bash
# Inicia el servidor
npm run server
```

### Error: "Python no encontrado"
```bash
# Instala Python desde python.org
# Luego instala Instaloader
pip install instaloader
```

### Error: "No se pudo ejecutar Python"
- Asegúrate que Python está en el PATH
- Verifica la instalación con: `python --version`

## 🎯 Ventajas de Instaloader

✅ **Datos reales** - Extrae contenido completo  
✅ **Confiable** - Menos susceptible a bloqueos  
✅ **Carrousel** - Extrae todas las imágenes  
✅ **Metadatos** - Likes, comentarios, fecha  
✅ **Autor** - Username del creador  

## 🔒 Limitaciones

- Requiere Python instalado
- Necesita servidor backend corriendo
- Puede ser lento (depende de Instagram)
- Instagram puede rate-limit si se usa mucho

## 📝 Ejemplo de respuesta JSON

```json
{
  "success": true,
  "images": [
    "https://instagram.com/p/ABC123/image.jpg",
    "https://instagram.com/p/ABC123/image2.jpg"
  ],
  "description": "Descripción completa del post...",
  "author": "username",
  "likes": 1500,
  "comments": 50,
  "date": "2024-01-01T12:00:00",
  "is_video": false,
  "typename": "GraphImage",
  "shortcode": "ABC123",
  "url": "https://www.instagram.com/p/ABC123/"
}
```

## 🚀 Para producción

1. Despliega el servidor en un servicio como Heroku/Railway
2. Configura CORS para tu dominio
3. Considera rate limiting y autenticación
4. Monitorea el uso para evitar bans de Instagram
