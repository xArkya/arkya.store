# Tienda Instagram

Una elegante tienda virtual para GitHub Pages que muestra productos y redirige a los usuarios a tu chat de Instagram para realizar compras.

![Tienda Instagram](https://images.unsplash.com/photo-1589642380614-1a336c928de0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80)

## Características

- Diseño moderno y responsivo con Chakra UI
- Catálogo de productos con filtros por categoría
- Páginas de detalle de producto
- Redirección a Instagram para compras
- Formulario de contacto
- Optimizado para SEO
- Fácil de personalizar

## Tecnologías Utilizadas

- React 18
- Vite
- Chakra UI
- React Router
- React Icons
- GitHub Pages

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/instagram-store.git
   cd instagram-store
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre tu navegador en `http://localhost:5173`

## Personalización

### Cambiar el usuario de Instagram

Edita el archivo `src/data/products.js` y actualiza la propiedad `instagram` en cada producto con tu nombre de usuario de Instagram:

```javascript
instagram: 'https://instagram.com/tu_usuario'
```

También actualiza los enlaces a Instagram en los componentes `Header.jsx`, `Footer.jsx` y `Hero.jsx`.

### Agregar o modificar productos

Edita el archivo `src/data/products.js` para agregar, eliminar o modificar productos.

### Cambiar colores y tema

Edita el tema en `src/main.jsx` para personalizar los colores de la aplicación.

## Despliegue en GitHub Pages

1. Actualiza la configuración de base en `vite.config.js` con el nombre de tu repositorio:
   ```javascript
   base: '/nombre-de-tu-repositorio/',
   ```

2. Crea un repositorio en GitHub y sube tu código:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/nombre-de-tu-repositorio.git
   git push -u origin main
   ```

3. Activa GitHub Pages en la configuración de tu repositorio:
   - Ve a Settings > Pages
   - En Source, selecciona "GitHub Actions"
   - El flujo de trabajo ya configurado se encargará del despliegue automático

## Licencia

MIT
