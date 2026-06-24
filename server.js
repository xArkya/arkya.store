const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
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
    
    // Ejecutar el script de Python
    const pythonScript = path.join(__dirname, 'scripts', 'instagram-scraper.py');
    
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
  console.log('🔍 Endpoint disponible: POST /api/instagram/scrape');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
