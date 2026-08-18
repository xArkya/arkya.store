import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Divider,
  Badge,
  Icon,
  Progress,
} from '@chakra-ui/react';
import { FaInstagram, FaDownload, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const InstagramImporter = ({ onProductDataExtracted, onEditMultipleProducts }) => {
  const [urls, setUrls] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractionResults, setExtractionResults] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Función para extraer el shortcode del URL de Instagram
  const extractShortcode = (url) => {
    const regex = /instagram\.com\/p\/([A-Za-z0-9_-]+)/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Función para obtener el HTML del post de Instagram con múltiples proxies y métodos
  const fetchInstagramPost = async (shortcode) => {
    const postUrl = `https://www.instagram.com/p/${shortcode}/`;
    
    // Lista extendida de proxies CORS alternativos
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/',
      'https://proxy.cors.sh/',
      'https://cors.bridged.cc/',
      'https://api.codetabs.com/v1/proxy?quest=',
    ];
    
    // Intentar con cada proxy hasta que uno funcione
    for (let i = 0; i < proxies.length; i++) {
      try {
        const proxyUrl = proxies[i];
        const fetchUrl = i === 0 ? 
          `${proxyUrl}${encodeURIComponent(postUrl)}` :
          `${proxyUrl}${postUrl}`;
        
        console.log(`Intentando proxy ${i + 1}/${proxies.length}:`, fetchUrl);
        
        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log(`Proxy ${i + 1} funcionó, HTML length:`, html.length);
          
          // Verificar si es contenido real o página de login
          if (html.includes('shortcode_media') || html.includes('display_url')) {
            console.log('✅ Contenido real encontrado!');
            return html;
          } else {
            console.log(`❌ Proxy ${i + 1} devolvió página de login, intentando siguiente...`);
            continue;
          }
        } else {
          console.warn(`Proxy ${i + 1} falló con status:`, response.status);
        }
      } catch (error) {
        console.warn(`Proxy ${i + 1} error:`, error.message);
        continue;
      }
    }
    
    // Si todos los proxies fallan, intentar métodos alternativos
    console.log('Todos los proxies fallaron, intentando métodos alternativos...');
    return await fetchInstagramPostAlternative(shortcode);
  };

  // Método alternativo usando múltiples APIs y técnicas
  const fetchInstagramPostAlternative = async (shortcode) => {
    const postUrl = `https://www.instagram.com/p/${shortcode}/`;
    
    // Método 1: Instagram oEmbed API
    try {
      console.log('🔄 Intentando Instagram oEmbed API...');
      const oembedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      
      const response = await fetch(oembedUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.instagram.com/',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        if (html.includes('shortcode_media') || html.includes('embed')) {
          console.log('✅ oEmbed API funcionó!');
          return html;
        }
      }
    } catch (error) {
      console.warn('❌ oEmbed API falló:', error.message);
    }
    
    // Método 2: API de terceros - nitter (para Instagram)
    try {
      console.log('🔄 Intentando API de terceros...');
      const thirdPartyUrl = `https://nitter.net/p/${shortcode}`;
      
      const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(thirdPartyUrl)}`);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('shortcode_media') || html.includes('display_url')) {
          console.log('✅ API de terceros funcionó!');
          return html;
        }
      }
    } catch (error) {
      console.warn('❌ API de terceros falló:', error.message);
    }
    
    // Método 3: Scraping directo con diferentes User-Agent
    try {
      console.log('🔄 Intentando scraping directo con User-Agent móvil...');
      
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
        'Instagram 219.0.0.12.75 Android (33/13; 480dpi; 1440x3120; samsung; SM-G991B; exynos990; en_US; 49308729)',
      ];
      
      for (const userAgent of mobileUserAgents) {
        try {
          const response = await fetch(`https://corsproxy.io/?${postUrl}`, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
            },
          });
          
          if (response.ok) {
            const html = await response.text();
            if (html.includes('shortcode_media') || html.includes('display_url')) {
              console.log('✅ Scraping móvil funcionó!');
              return html;
            }
          }
        } catch {
          console.warn('❌ User-Agent móvil falló:', userAgent);
          continue;
        }
      }
    } catch (error) {
      console.warn('❌ Scraping móvil falló:', error.message);
    }
    
    // Método 4: Intentar con diferentes endpoints de Instagram
    try {
      console.log('🔄 Intentando diferentes endpoints...');
      
      const endpoints = [
        `https://www.instagram.com/p/${shortcode}/embed/`,
        `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
        `https://www.instagram.com/p/${shortcode}/?__a=1`,
        `https://www.instagram.com/p/${shortcode}/?__d=dis`,
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`https://corsproxy.io/?${endpoint}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'X-Requested-With': 'XMLHttpRequest',
            },
          });
          
          if (response.ok) {
            const content = await response.text();
            if (content.includes('shortcode_media') || content.includes('display_url') || content.includes('graphql')) {
              console.log('✅ Endpoint alternativo funcionó:', endpoint);
              return content;
            }
          }
        } catch {
          console.warn('❌ Endpoint falló:', endpoint);
          continue;
        }
      }
    } catch (error) {
      console.warn('❌ Endpoints alternativos fallaron:', error.message);
    }
    
    console.log('🚫 Todos los métodos alternativos fallaron');
    throw new Error('No se pudo acceder al contenido del post de Instagram');
  };

  // Datos de fallback para demostración
  const CreateFallbackData = (shortcode) => {
    console.log('Usando datos de demostración para shortcode:', shortcode);
    
    return `
      <html>
        <head>
          <meta property="og:image" content="https://picsum.photos/seed/instagram-${shortcode}/800/800.jpg">
          <meta property="og:image" content="https://picsum.photos/seed/instagram-${shortcode}-2/800/800.jpg">
          <meta property="og:image" content="https://picsum.photos/seed/instagram-${shortcode}-3/800/800.jpg">
          <meta property="og:description" content="Producto increíble disponible en Arkya Store. ¡No te lo pierdas! Calidad garantizada y envío rápido. #arkya #tienda #producto">
          <meta property="og:title" content="Nuevo producto en Arkya Store">
        </head>
        <body>
          <script type="application/ld+json">
          [{
            "@context": "https://schema.org",
            "@type": "SocialMediaPosting",
            "description": "Producto increíble disponible en Arkya Store. ¡No te lo pierdas! Calidad garantizada y envío rápido. #arkya #tienda #producto",
            "image": [
              "https://picsum.photos/seed/instagram-${shortcode}/800/800.jpg",
              "https://picsum.photos/seed/instagram-${shortcode}-2/800/800.jpg",
              "https://picsum.photos/seed/instagram-${shortcode}-3/800/800.jpg"
            ],
            "author": {"name": "arkya.store"},
            "datePublished": "${new Date().toISOString()}",
            "interactionStatistic": {"userInteractionCount": 150}
          }]
          </script>
        </body>
      </html>
    `;
  };

  // Función para extraer datos del HTML del post
  const extractDataFromHTML = (html) => {
    try {
      console.log('Intentando extraer datos del HTML...');
      
      // Método 1: Intentar JSON-LD script
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          console.log('JSON-LD encontrado:', jsonData);
          
          const postData = Array.isArray(jsonData) ? jsonData[0] : jsonData;
          
          // Extraer imágenes
          const images = [];
          if (postData.image) {
            if (Array.isArray(postData.image)) {
              images.push(...postData.image);
            } else {
              images.push(postData.image);
            }
          }

          // Extraer descripción
          const description = postData.description || postData.caption || '';
          
          // Extraer otros datos útiles
          const author = postData.author?.name || '';
          const publishedDate = postData.datePublished || '';
          const likes = postData.interactionStatistic?.userInteractionCount || 0;

          if (images.length > 0 || description) {
            console.log('Datos extraídos desde JSON-LD:', { images: images.length, description: description.substring(0, 100) });
            return {
              images: images.filter(img => img && typeof img === 'string'),
              description: description,
              author: author,
              publishedDate: publishedDate,
              likes: likes,
              url: postData.url || '',
            };
          }
        } catch (jsonError) {
          console.warn('Error parsing JSON-LD:', jsonError);
        }
      }

      // Método 2: Buscar datos en el script de window._sharedData
      const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.*?});/s);
      if (sharedDataMatch) {
        try {
          const sharedData = JSON.parse(sharedDataMatch[1]);
          console.log('SharedData encontrado');
          
          // Navegar por la estructura de datos de Instagram
          const entryData = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
          if (entryData) {
            const images = entryData.display_url ? [entryData.display_url] : [];
            
            // Intentar obtener más imágenes del carousel
            if (entryData.edge_sidecar_to_children?.edges) {
              entryData.edge_sidecar_to_children.edges.forEach(edge => {
                if (edge.node?.display_url) {
                  images.push(edge.node.display_url);
                }
              });
            }
            
            const description = entryData.edge_media_to_caption?.edges?.[0]?.node?.text || '';
            const likes = entryData.edge_media_preview_like?.count || 0;
            const author = entryData.owner?.username || '';
            
            console.log('Datos extraídos desde SharedData:', { images: images.length, description: description.substring(0, 100) });
            
            return {
              images: images.filter(img => img && typeof img === 'string'),
              description: description,
              author: author,
              publishedDate: entryData.taken_at_timestamp ? new Date(entryData.taken_at_timestamp * 1000).toISOString() : '',
              likes: likes,
              url: '',
            };
          }
        } catch (sharedDataError) {
          console.warn('Error parsing SharedData:', sharedDataError);
        }
      }

      // Método 3: Búsqueda avanzada en el HTML de Instagram
      console.log('Usando búsqueda avanzada en HTML...');
      
      // Buscar imágenes en múltiples formatos
      const allImages = [];
      
      // 1. Meta tags estándar
      const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi;
      const ogImageMatches = [...html.matchAll(ogImageRegex)];
      allImages.push(...ogImageMatches.map(match => match[1]));
      
      const twitterImageRegex = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/gi;
      const twitterImageMatches = [...html.matchAll(twitterImageRegex)];
      allImages.push(...twitterImageMatches.map(match => match[1]));
      
      // 2. Buscar URLs de imágenes directamente en el HTML
      const imageUrlRegex = /https:\/\/[^"\s)]+\.(?:jpg|jpeg|png|webp)/gi;
      const directImageMatches = [...html.matchAll(imageUrlRegex)];
      allImages.push(...directImageMatches.map(match => match[0]));
      
      // 3. Buscar en JSON data embedded
      const jsonImageRegex = /"display_url":"([^"]+)"/gi;
      const jsonImageMatches = [...html.matchAll(jsonImageRegex)];
      allImages.push(...jsonImageMatches.map(match => match[1].replace(/\\u002F/g, '/')));
      
      // 4. Buscar URLs de CDN de Instagram (más específico para contenido)
      const cdnImageRegex = /https:\/\/scontent[^"\s]*\.cdninstagram\.com[^"\s]*\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png)/gi;
      const cdnImageMatches = [...html.matchAll(cdnImageRegex)];
      allImages.push(...cdnImageMatches.map(match => match[0]));
      
      // 5. Buscar imágenes de posts específicas (formato /p/)
      const postImageRegex = /https:\/\/[^"\s]*cdninstagram\.com[^"\s]*\/p\/[^"\s]+\.(?:jpg|jpeg|png)/gi;
      const postImageMatches = [...html.matchAll(postImageRegex)];
      allImages.push(...postImageMatches.map(match => match[0]));
      
      // 6. Buscar imágenes con parámetros de tamaño grande
      const largeImageRegex = /https:\/\/[^"\s]*cdninstagram\.com[^"\s]*(?:1080x1080|1440x1440|640x640)[^"\s]*\.(?:jpg|jpeg|png)/gi;
      const largeImageMatches = [...html.matchAll(largeImageRegex)];
      allImages.push(...largeImageMatches.map(match => match[0]));
      
      // Filtrar y limpiar imágenes
      const images = [...new Set(allImages.filter(img => {
        if (!img || typeof img !== 'string') return false;
        
        // Eliminar recursos estáticos de Instagram
        if (img.includes('static.cdninstagram.com/rsrc.php')) return false;
        if (img.includes('rsrc.php')) return false;
        if (img.includes('.webp') && img.includes('static')) return false;
        
        // Eliminar thumbnails y imágenes de baja calidad
        if (img.includes('150x150') || img.includes('640x640') || img.includes('avatar')) return false;
        if (img.includes('profile_pic') || img.includes('favicon')) return false;
        if (img.includes('s150x150') || img.includes('s320x320')) return false;
        
        // Eliminar imágenes de UI y recursos
        if (img.includes('bz') || img.includes('bl') || img.includes('br')) return false;
        if (img.includes('static')) return false;
        
        // Buscar imágenes de contenido real (más grandes y específicas)
        const isContentImage = img.includes('cdninstagram.com') && 
                              (img.includes('/p/') || img.includes('/v/') || img.includes('/t/'));
        
        // Solo imágenes de Instagram de contenido o dominios conocidos
        return isContentImage || 
               img.includes('picsum.photos') ||
               (img.includes('cdninstagram.com') && !img.includes('static'));
      }))];
      
      // Extraer descripción de múltiples fuentes
      let description = '';
      
      // 1. Meta tags
      const descRegex = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i;
      const descMatch = html.match(descRegex);
      if (descMatch) {
        description = decodeURIComponent(descMatch[1]).replace(/&amp;/g, '&').replace(/\\u/g, '');
      }
      
      // 2. Twitter description
      if (!description) {
        const twitterDescRegex = /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i;
        const twitterDescMatch = html.match(twitterDescRegex);
        if (twitterDescMatch) {
          description = decodeURIComponent(twitterDescMatch[1]).replace(/&amp;/g, '&').replace(/\\u/g, '');
        }
      }
      
      // 3. Título
      let title = '';
      const titleRegex = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i;
      const titleMatch = html.match(titleRegex);
      if (titleMatch) {
        title = decodeURIComponent(titleMatch[1]).replace(/&amp;/g, '&').replace(/\\u/g, '');
      }
      
      // 4. Buscar caption en JSON data
      if (!description) {
        const captionRegex = /"edge_media_to_caption":\{"edges":\[\{"node":\{"text":"([^"]+)"\}\}\]\}/i;
        const captionMatch = html.match(captionRegex);
        if (captionMatch) {
          description = captionMatch[1].replace(/\\u/g, '').replace(/\\n/g, ' ');
        }
      }
      
      // 5. Buscar texto en el HTML
      if (!description && !title) {
        // Buscar cualquier texto que parezca una descripción
        const textRegex = /<title[^>]*>([^<]+)<\/title>/i;
        const textMatch = html.match(textRegex);
        if (textMatch) {
          title = textMatch[1].replace(' • Instagram', '').replace(' on Instagram', '');
        }
      }
      
      const finalDescription = description || title || 'Producto de Instagram';
      
      const debugInfo = { 
        images: images.length,
        description: finalDescription.substring(0, 100),
        hasDescription: !!description,
        hasTitle: !!title,
        imageSources: {
          ogTags: ogImageMatches.length,
          twitterTags: twitterImageMatches.length,
          directUrls: directImageMatches.length,
          jsonUrls: jsonImageMatches.length,
          cdnUrls: cdnImageMatches.length,
          postUrls: postImageMatches.length,
          largeUrls: largeImageMatches.length
        },
        sampleImages: images.slice(0, 3),
        htmlLength: html.length,
        hasHtml: !!html
      };
      
      console.log('Datos extraídos con búsqueda avanzada:', debugInfo);
      
      // Log adicional para debugging
      if (images.length === 0) {
        console.log('Muestra de HTML para debugging (primeros 1000 chars):');
        console.log(html.substring(0, 1000));
        console.log('¿Contiene "cdninstagram"?', html.includes('cdninstagram'));
        console.log('¿Contiene "display_url"?', html.includes('display_url'));
        console.log('¿Contiene "og:image"?', html.includes('og:image'));
        
        // Detectar si es página de login o bloqueo
        const isLoginPage = html.includes('login') || 
                           html.includes('Log in') || 
                           html.includes('Sign up') ||
                           html.includes('class="_9dls"') ||
                           html.includes('noarchive, noimageindex');
        
        const isPostPage = html.includes('shortcode_media') || 
                          html.includes('edge_media_to_caption') ||
                          html.includes('display_url');
        
        console.log('¿Es página de login?', isLoginPage);
        console.log('¿Es página de post?', isPostPage);
        
        if (isLoginPage && !isPostPage) {
          console.log('Instagram está bloqueando el acceso. Usando modo demostración mejorado...');
          return createEnhancedFallbackData();
        }
      }

      if (images.length > 0 || finalDescription) {
        return {
          images: images.slice(0, 10), // Limitar a 10 imágenes
          description: finalDescription,
          author: '',
          publishedDate: '',
          likes: 0,
          url: '',
        };
      }
      
      throw new Error('Instagram está bloqueando el acceso al contenido. Esto es normal debido a las restricciones de la plataforma. El sistema usará datos de demostración para que puedas probar la funcionalidad.');
      
    } catch (error) {
      console.error('Error completo en parsing:', error);
      
      // Último recurso: usar datos de demostración mejorados
      console.log('Usando datos de demostración mejorados...');
      return createEnhancedFallbackData();
    }
  };

  // Datos de fallback mejorados
  const createEnhancedFallbackData = () => {
    const timestamp = Date.now();
    
    return {
      images: [
        `https://picsum.photos/seed/instagram-${timestamp}/800/800.jpg`,
        `https://picsum.photos/seed/instagram-${timestamp}-2/800/800.jpg`,
        `https://picsum.photos/seed/instagram-${timestamp}-3/800/800.jpg`,
      ],
      description: 'Producto increíble disponible en Arkya Store. ¡No te lo pierdas! Calidad garantizada y envío rápido. #arkya #tienda #producto #calidad',
      author: 'arkya.store',
      publishedDate: new Date().toISOString(),
      likes: Math.floor(Math.random() * 500) + 100,
      url: '',
    };
  };

  // Función para extraer datos de un solo post
  const extractSinglePost = async (singleUrl) => {
    const shortcode = extractShortcode(singleUrl);
    if (!shortcode) {
      return { url: singleUrl, error: 'URL no válida', data: null };
    }

    try {
      const html = await fetchInstagramPost(shortcode);
      const data = extractDataFromHTML(html);
      const isDemoData = data.images.some(img => img.includes('picsum.photos'));
      return { url: singleUrl, shortcode, data, isDemoData, error: null };
    } catch (err) {
      return { url: singleUrl, shortcode, data: null, isDemoData: true, error: err.message };
    }
  };

  // Función principal para extraer datos de múltiples posts
  const handleExtractData = async () => {
    const urlList = urls.split(/\n|,/).map(u => u.trim()).filter(u => u.length > 0);
    
    if (urlList.length === 0) {
      setError('Por favor, ingresa al menos una URL válida de Instagram');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractionResults([]);

    // Procesar TODAS las URLs al mismo tiempo (paralelo)
    const promises = urlList.map(async (singleUrl, index) => {
      const result = await extractSinglePost(singleUrl);
      setExtractionResults(prev => {
        const updated = [...prev];
        updated[index] = result;
        return updated;
      });
      return result;
    });

    const results = await Promise.all(promises);

    setIsLoading(false);

    const successCount = results.filter(r => r.data && !r.error).length;
    const demoCount = results.filter(r => r.isDemoData).length;

    if (successCount > 0) {
      toast({
        title: `Extracción completada: ${successCount}/${urlList.length}`,
        description: demoCount > 0 
          ? `${demoCount} usaron datos de demostración debido a restricciones de Instagram.`
          : 'Todos los posts fueron extraídos correctamente.',
        status: demoCount > 0 ? 'warning' : 'success',
        duration: 4000,
        isClosable: true,
      });
      onOpen();
    } else {
      setError('No se pudieron extraer datos de ninguna URL. Verifica los links e intenta de nuevo.');
      toast({
        title: 'Error en extracción',
        description: 'Ninguna URL pudo ser procesada correctamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Agregar un producto individual desde los resultados
  const addSingleProduct = (result) => {
    if (!result.data) return;

    const parsed = parseInstagramDescription(result.data.description);
    // Rechazar productos con descripción inválida (ej: scraper falló y devolvió 'Instagram')
    if (!parsed.title || parsed.title.toLowerCase() === 'instagram' || parsed.description?.toLowerCase() === 'instagram') {
      toast({
        title: 'Extracción fallida',
        description: `No se pudo extraer la descripción de ${result.url}. Intentá de nuevo.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const productData = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      image: result.data.images[0] || '',
      images: result.data.images,
      name: parsed.title,
      description: parsed.description,
      price: parsed.price,
      category: '',
      subcategory: '',
      inStock: true,
      isNew: true,
      isOnOffer: false,
      tags: parsed.tags,
      instagramUrl: result.url,
      extractedFrom: 'instagram',
      extractionDate: new Date().toISOString(),
    };

    onProductDataExtracted(productData);
    onClose();
    // Restaurar scroll del body que Chakra UI bloquea al cerrar modal
    document.body.style.overflow = '';
    toast({
      title: 'Producto agregado',
      description: `"${parsed.title || 'Producto'}" ha sido importado correctamente.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Agregar todos los productos extraídos de una sola vez (sin abrir formulario)
  const addAllProducts = () => {
    const validResults = extractionResults.filter(r => r && r.data);
    const productsToAdd = validResults
      .map((result, index) => {
        const parsed = parseInstagramDescription(result.data.description);
        // Saltear productos con descripción inválida
        if (!parsed.title || parsed.title.toLowerCase() === 'instagram' || parsed.description?.toLowerCase() === 'instagram') {
          return null;
        }
        return {
        id: Date.now() + index,
        image: result.data.images[0] || '',
        images: result.data.images,
        name: parsed.title,
        description: parsed.description,
        price: parsed.price,
        category: '',
        subcategory: '',
        inStock: true,
        isNew: true,
        isOnOffer: false,
        tags: parsed.tags,
        instagramUrl: result.url,
        extractedFrom: 'instagram',
        extractionDate: new Date().toISOString(),
      };
      })
      .filter(Boolean);

    if (onEditMultipleProducts) {
      onEditMultipleProducts(productsToAdd);
    } else {
      // Fallback: agregar uno por uno si no hay handler de edición múltiple
      productsToAdd.forEach(product => onProductDataExtracted(product));
    }

    toast({
      title: `${productsToAdd.length} productos agregados`,
      description: 'Todos los productos extraídos han sido importados.',
      status: 'success',
      duration: 4000,
      isClosable: true,
    });

    onClose();
  };

  // Función para parsear descripción y extraer datos
  const parseInstagramDescription = (description) => {
    if (!description) description = '';
    // Limpiar líneas vacías y puntos sueltos
    let cleanedDesc = description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '.' && line !== '...' && line !== '....' && line !== '.....')
      .join('\n');

    // Limpiar comillas dobles del inicio/final y punto colgado
    cleanedDesc = cleanedDesc.trim().replace(/^"+|"+$/g, '').trim();
    cleanedDesc = cleanedDesc.replace(/\.$/, '').trim();

    // Filtrar líneas que sean solo nombre de usuario o timestamp de Instagram
    cleanedDesc = cleanedDesc
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        // Ignorar líneas que son solo username (todo minúscula/puntos/números, sin espacios)
        if (/^[a-z0-9_.]+$/.test(trimmed) && trimmed.length < 30 && !trimmed.includes(' ')) return false;
        // Ignorar líneas que parezcan timestamp (número + unidad de tiempo)
        if (/^\d+\s*(sem|semanas?|d|días?|h|horas?|min|minutos?|s|seg)$/.test(trimmed.toLowerCase())) return false;
        // Ignorar líneas que sean solo 'Instagram' o variantes
        if (/^instagram$/i.test(trimmed)) return false;
        return true;
      })
      .join('\n');

    // Extraer hashtags
    const hashtagRegex = /#[\w]+/g;
    const hashtags = cleanedDesc.match(hashtagRegex) || [];
    const uniqueHashtags = [...new Set(hashtags)].map(tag => tag.replace('#', ''));

    // Remover hashtags de la descripción
    cleanedDesc = cleanedDesc.replace(hashtagRegex, '').trim();

    // Extraer precio (buscar patrón $número)
    const priceRegex = /\$\s*([\d,]+(?:\.\d{2})?)/;
    const priceMatch = cleanedDesc.match(priceRegex);
    let price = 10000;
    let title = '';

    if (priceMatch) {
      // Convertir precio a número (remover comas)
      price = Math.round(parseFloat(priceMatch[1].replace(/,/g, '')) * 1000);
      
      // Extraer título (lo que va antes del $)
      const priceIndex = cleanedDesc.indexOf('$');
      title = cleanedDesc.substring(0, priceIndex).trim();
      
      // Remover el precio de la descripción
      cleanedDesc = cleanedDesc.replace(priceRegex, '').trim();
    }

    // Si no hay título, usar las primeras palabras de la descripción
    if (!title) {
      const words = cleanedDesc.split(' ');
      title = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
    }

    return {
      title,
      description: cleanedDesc,
      price,
      tags: uniqueHashtags
    };
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Alert status="info" borderRadius="md">
          <AlertIcon as={FaInstagram} />
          <Box>
            <AlertTitle>Importar desde Instagram</AlertTitle>
            <AlertDescription fontSize="sm">
              Pega el link de un post de Instagram para extraer automáticamente las fotos y descripción.
              Luego podrás personalizar los detalles del producto.
            </AlertDescription>
          </Box>
        </Alert>

        <Alert status="warning" borderRadius="md">
          <AlertIcon as={FaExclamationTriangle} />
          <Box>
            <AlertTitle>Restricciones de Instagram</AlertTitle>
            <AlertDescription fontSize="sm">
              <strong>Instagram bloquea el acceso directo al contenido desde páginas externas.</strong> 
              Esto es normal y ocurre con todas las herramientas de scraping. 
              El sistema usará automáticamente datos de demostración para que puedas probar la funcionalidad completa.
              <br /><br />
              <strong>Para usar en producción:</strong> Descarga manualmente las imágenes del post y cópia la descripción.
            </AlertDescription>
          </Box>
        </Alert>

        <VStack spacing={2} align="stretch">
          <Textarea
            placeholder="Pega los links de Instagram, uno por línea:&#10;https://www.instagram.com/p/ABC123/&#10;https://www.instagram.com/p/DEF456/"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            isDisabled={isLoading}
            rows={5}
            resize="vertical"
          />
          <Button
            leftIcon={<FaDownload />}
            colorScheme="pink"
            onClick={handleExtractData}
            isLoading={isLoading}
            isDisabled={!urls.trim()}
            alignSelf="flex-start"
          >
            Extraer {urls.trim() && urls.split(/\n|,/).filter(u => u.trim().length > 0).length > 0 ? `(${urls.split(/\n|,/).filter(u => u.trim().length > 0).length})` : ''}
          </Button>
        </VStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon as={FaExclamationTriangle} />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        {isLoading && (
          <VStack spacing={2} py={4} align="stretch">
            <HStack spacing={3} justify="center">
              <Spinner size="md" color="pink.500" />
              <Text fontSize="sm" color="gray.600">
                Extrayendo {urls.split(/\n|,/).filter(u => u.trim().length > 0).length} posts en paralelo...
              </Text>
            </HStack>
            <Progress size="xs" colorScheme="pink" w="full" isIndeterminate />
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Todos los posts se procesan al mismo tiempo para mayor velocidad
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Modal de vista previa múltiple */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FaInstagram} color="pink.500" />
              <Text>Resultados de extracción</Text>
              <Badge colorScheme="green">{extractionResults.filter(r => r && r.data).length}/{extractionResults.length} exitosos</Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              {extractionResults.map((result, index) => (
                result ? (
                <Box key={index} p={4} borderWidth="1px" borderRadius="md" borderColor="gray.200">
                  <HStack justify="space-between" mb={3}>
                    <Text fontWeight="bold" fontSize="sm" noOfLines={1} flex={1}>
                      {index + 1}. {result.url}
                    </Text>
                    <Badge colorScheme={result.error ? 'red' : result.isDemoData ? 'yellow' : 'green'}>
                      {result.error ? 'Error' : result.isDemoData ? 'Demo' : 'OK'}
                    </Badge>
                  </HStack>

                  {result.data ? (
                    <VStack spacing={3} align="stretch">
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="semibold">{result.data.images.length} imágenes</Text>
                        {result.data.description && (
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {result.data.description.substring(0, 60)}...
                          </Text>
                        )}
                      </HStack>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<FaCheckCircle />}
                        onClick={() => addSingleProduct(result)}
                      >
                        Agregar producto
                      </Button>
                    </VStack>
                  ) : (
                    <Alert status="error" size="sm" borderRadius="md">
                      <AlertIcon boxSize="16px" />
                      <Text fontSize="xs">{result.error || 'No se pudieron extraer datos'}</Text>
                    </Alert>
                  )}
                </Box>
                ) : null
              ))}

              {extractionResults.filter(r => r && r.data).length > 1 && (
                <Button
                  leftIcon={<FaCheckCircle />}
                  colorScheme="green"
                  size="lg"
                  onClick={addAllProducts}
                >
                  Agregar todos los productos ({extractionResults.filter(r => r && r.data).length})
                </Button>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InstagramImporter;
