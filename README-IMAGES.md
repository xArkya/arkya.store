# Script de Extracción de Imágenes Base64

Este script te permite convertir las imágenes almacenadas en formato base64 en el archivo `products.js` a archivos físicos en la carpeta `public/images/products/`.

## ¿Cuándo usarlo?

Usa este script cuando:
- El archivo `products.js` se vuelva muy pesado por las imágenes en base64
- Quieras optimizar el tamaño del archivo para subir a GitHub
- Quieras tener las imágenes como archivos separados para mejor organización

## ¿Qué hace el script?

1. **Crea un backup** del archivo `products.js` original
2. **Extrae todas las imágenes** en formato base64 del archivo
3. **Convierte cada imagen** a un archivo físico (JPG, PNG, etc.)
4. **Actualiza las rutas** en `products.js` para que apunten a los nuevos archivos
5. **Guarda las imágenes** en `public/images/products/` con nombres únicos

## Cómo ejecutarlo

### Opción 1: Directamente con Node.js
```bash
node scripts/extract-images.js
```

### Opción 2: Usando npm (si tienes el package.json configurado)
```bash
npm run extract-images
# o
npm run extract:images
```

## Estructura de archivos después de ejecutar

```
arkya.store/
src/
  data/
    products.js (actualizado con rutas de archivos)
    products.backup.js (backup del original)
public/
  images/
    products/
      img_1234567890_abc123_0.jpg
      img_1234567890_def456_1.png
      ... (más imágenes)
scripts/
  extract-images.js
```

## Características del script

- **Seguro**: Siempre crea un backup antes de modificar
- **Inteligente**: Detecta automáticamente el tipo de imagen (JPG, PNG, etc.)
- **Organizado**: Genera nombres únicos para cada archivo
- **Informativo**: Muestra progreso y resumen de la operación
- **Flexible**: Funciona con cualquier cantidad de productos e imágenes

## Ejemplo de salida

```
Iniciando extracción de imágenes base64...
Creando backup del archivo original...
Directorio de imágenes creado: /path/to/public/images/products

Procesando producto 1: Yotsuba To! Vol.1
  Imagen principal guardada: img_1775702191560_abc123_0.jpg
  Imagen 1 guardada: img_1775702191560_def456_1.jpg
  Imagen 2 guardada: img_1775702191560_ghi789_2.jpg
  Imagen 3 guardada: img_1775702191560_jkl012_3.jpg

=== RESUMEN ===
Total de imágenes encontradas: 4
Imágenes convertidas exitosamente: 4
Imágenes guardadas en: /path/to/public/images/products
Backup guardado en: /path/to/src/data/products.backup.js
Archivo products.js actualizado

¡Proceso completado con éxito!
Las imágenes ahora son archivos físicos y el archivo products.js es mucho más ligero.
```

## Recuperación en caso de error

Si algo sale mal, siempre puedes restaurar el archivo original desde el backup:

```bash
cp src/data/products.backup.js src/data/products.js
```

## Notas importantes

- Las imágenes base64 se eliminan del archivo `products.js` después de la conversión
- Los nombres de archivo incluyen timestamp para evitar colisiones
- El script solo procesa imágenes que empiecen con `data:image/`
- Si una imagen no está en formato base64 válido, se mantiene sin cambios

## Flujo de trabajo recomendado

1. Trabaja normalmente subiendo imágenes (se guardarán como base64)
2. Cuando sientas que el archivo está muy pesado, ejecuta el script
3. Sube los cambios a GitHub (ahora con imágenes como archivos separados)
4. Repite el proceso cuando sea necesario
