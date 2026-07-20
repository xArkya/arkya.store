# Solución: Información Engañosa en Google Merchant Center

## Problema Detectado
Google ha detectado que hay información engañosa en tu tienda - específicamente que los productos no se muestran correctamente en Argentina.

## Cambios Realizados

### 1. **Feed de Google Merchant Center Actualizado** ✅
- **Archivo**: `public/google-merchant-feed.xml`
- **Cambios**:
  - ✅ Ahora solo incluye **73 productos en stock** (antes incluía productos sin stock)
  - ✅ Agregados campos `g:sale_price` y `g:sale_price_effective_date` para ofertas
  - ✅ Todas las disponibilidades marcadas como `in_stock`
  - ✅ Información de envío clara (0 ARS a Argentina)
  - ✅ Link a política de devoluciones

### 2. **Página de Política de Información Transparente** ✅
- **Ruta**: `/politica-informacion`
- **URL**: `https://arkya.store/politica-informacion`
- **Contenido**:
  - Compromiso con transparencia
  - Información clara sobre disponibilidad
  - Detalles sobre precios y ofertas
  - Políticas de devoluciones
  - Información sobre contenido adulto
  - Canales de contacto

### 3. **Página de Devoluciones** ✅
- **Ruta**: `/devoluciones`
- **URL**: `https://arkya.store/devoluciones`
- **Ya existente y correctamente vinculada**

## Pasos que Debes Realizar en Google Merchant Center

### Paso 1: Verificar el Feed
1. Ve a **Google Merchant Center** → **Feeds**
2. Selecciona tu feed de productos
3. Verifica que se haya actualizado con los 73 productos en stock
4. Comprueba que no hay errores en la validación

### Paso 2: Revisar la Sección de Problemas
1. Ve a **Problemas** en el menú lateral
2. Busca "Información engañosa"
3. Haz clic en **"Revisar ahora"** o **"Solicitar revisión"**

### Paso 3: Proporcionar Información a Google
Cuando Google pida información, proporciona:

**Sobre Disponibilidad:**
- "Solo mostramos productos disponibles en Argentina en nuestro catálogo"
- "Los productos sin stock se retiran automáticamente del feed"
- "El feed se actualiza regularmente para reflejar disponibilidad real"

**Sobre Políticas:**
- "Política de devoluciones disponible en: https://arkya.store/devoluciones"
- "Política de información transparente en: https://arkya.store/politica-informacion"
- "Contacto: arkya.store@gmail.com o @arkya.store en Instagram"

**Sobre Precios:**
- "Todos los precios incluyen impuestos aplicables"
- "Las ofertas se muestran claramente con fechas de validez"
- "No hay costos ocultos"

### Paso 4: Solicitar Revisión
1. Una vez hayas verificado que todo está correcto
2. Haz clic en **"Solicitar revisión"** en la sección de problemas
3. Google revisará en 1-3 días hábiles

## Verificación Local

Para verificar que el feed está correcto localmente:

```bash
# El feed está en:
public/google-merchant-feed.xml

# Contiene:
- 73 productos en stock
- Información completa de cada producto
- Links a políticas de devoluciones
- Precios en ARS
- Disponibilidad clara
```

## Checklist de Cumplimiento

- ✅ Feed solo contiene productos en stock
- ✅ Página de devoluciones accesible
- ✅ Página de política de información transparente
- ✅ Información clara sobre disponibilidad en Argentina
- ✅ Precios en moneda local (ARS)
- ✅ Canales de contacto disponibles
- ✅ Política de contenido adulto clara

## Próximos Pasos

1. **Hoy**: Verifica que el feed se haya actualizado en Google Merchant Center
2. **Mañana**: Solicita revisión en Google Merchant Center
3. **En 1-3 días**: Google revisará y debería resolver el problema

## Notas Importantes

- El feed se regenera automáticamente cuando cambias productos en el admin
- Los productos con `inStock: false` nunca aparecerán en el feed
- Las ofertas se incluyen automáticamente si tienen `isOnOffer: true`
- Todas las URLs son accesibles y están correctamente configuradas

## Contacto para Soporte

Si Google requiere más información:
- Email: arkya.store@gmail.com
- Instagram: @arkya.store
- Página de contacto: https://arkya.store/contacto
