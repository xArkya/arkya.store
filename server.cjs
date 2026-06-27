const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3001;

// Middleware
// Restringir CORS solo a tu dominio
app.use(cors({
  origin: [
    'https://arkya.store',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Ruta para scraping con Instaloader
app.post('/api/instagram/scrape', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere una URL de Instagram' 
    });
  }

  try {
    console.log(`🔄 Iniciando scraping de: ${url}`);
    
    // Ejecutar el script de Python con Selenium
    const pythonScript = path.join(__dirname, 'scripts', 'selenium-instagram-scraper.py');
    
    return new Promise((resolve, reject) => {
      const python = spawn('python', [pythonScript, url]);
      let dataString = '';
      let errorString = '';

      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
        console.error('Python stderr:', data.toString());
      });

      python.on('close', (code) => {
        console.log(`Python script exited with code: ${code}`);
        
        if (code !== 0) {
          console.error('Error en script Python:', errorString);
          return reject(new Error('Error ejecutando el script de Python'));
        }

        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (parseError) {
          console.error('Error parseando JSON:', parseError);
          console.error('Data recibida:', dataString);
          reject(new Error('Error procesando la respuesta del scraper'));
        }
      });

      python.on('error', (error) => {
        console.error('Error ejecutando Python:', error);
        reject(new Error('No se pudo ejecutar Python. Asegúrate que Python está instalado'));
      });
    }).then(result => {
      console.log('✅ Scraping completado exitosamente');
      res.json(result);
    }).catch(error => {
      console.error('❌ Error en scraping:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    });

  } catch (error) {
    console.error('Error general:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener extensión del archivo desde URL
function getFileExtension(url) {
  const urlPath = url.split('?')[0];
  let ext = require('path').extname(urlPath) || '.jpg';
  if (ext === '.heic' || ext === '.heif') ext = '.jpg';
  return ext;
}

// Función para descargar una imagen
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { timeout: 10000 }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Ruta para descargar imágenes de Instagram
app.post('/api/instagram/download-images', async (req, res) => {
  const { productId, imageUrls } = req.body;
  
  if (!productId || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere productId e imageUrls (array)'
    });
  }

  try {
    console.log(`\n📥 Descargando ${imageUrls.length} imágenes para producto: ${productId}`);
    
    const imagesDir = path.join(__dirname, 'public', 'images', 'products');
    
    // Crear directorio si no existe
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const downloadedImages = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      const ext = getFileExtension(url);
      const filename = `product-${productId}-${i}${ext}`;
      const filepath = path.join(imagesDir, filename);
      
      try {
        console.log(`  [${i + 1}/${imageUrls.length}] Descargando: ${filename}`);
        await downloadImage(url, filepath);
        
        const localUrl = `/images/products/${filename}`;
        downloadedImages.push(localUrl);
        successCount++;
        console.log(`  ✅ Guardado: ${localUrl}`);
      } catch (error) {
        failureCount++;
        console.error(`  ❌ Error descargando imagen ${i + 1}: ${error.message}`);
      }
    }

    console.log(`\n✅ Descarga completada: ${successCount} exitosas, ${failureCount} fallidas\n`);
    
    res.json({
      success: true,
      productId,
      downloadedImages,
      successCount,
      failureCount,
      totalRequested: imageUrls.length
    });
  } catch (error) {
    console.error('Error en descarga de imágenes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta de health check
app.get('/api/instagram/scrape', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Instagram scraper server is running',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Instagram scraper server corriendo en http://localhost:${PORT}`);
  console.log(`📁 Scripts en: ${path.join(__dirname, 'scripts')}`);
  console.log('🔍 Endpoints disponibles:');
  console.log('   - POST /api/instagram/scrape');
  console.log('   - POST /api/instagram/download-images');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
