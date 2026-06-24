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

const InstagramImporter = ({ onProductDataExtracted }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
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

  // Función principal para extraer datos del post
  const handleExtractData = async () => {
    if (!url.trim()) {
      setError('Por favor, ingresa una URL válida de Instagram');
      return;
    }

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      setError('URL de Instagram no válida. Debe ser del tipo: https://www.instagram.com/p/CODIGO/');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const html = await fetchInstagramPost(shortcode);
      const data = extractDataFromHTML(html);
      
      setExtractedData(data);
      onOpen();
      
      // Verificar si se usaron datos de demostración
      const isDemoData = data.images.some(img => img.includes('picsum.photos'));
      
      toast({
        title: isDemoData ? 'Datos de demostración cargados' : 'Datos extraídos exitosamente',
        description: isDemoData 
          ? 'Se usaron datos de demostración debido a restricciones de Instagram. Puedes editar las imágenes y descripción.'
          : `Se encontraron ${data.images.length} imágenes`,
        status: isDemoData ? 'warning' : 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      setError(error.message);
      toast({
        title: 'Error al extraer datos',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para parsear descripción y extraer datos
  const parseInstagramDescription = (description) => {
    // Limpiar líneas vacías y puntos sueltos
    let cleanedDesc = description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '.' && line !== '...' && line !== '....' && line !== '.....')
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

  // Función para convertir los datos extraídos a formato de producto
  const convertToProduct = () => {
    if (!extractedData) return;

    const parsed = parseInstagramDescription(extractedData.description);

    const productData = {
      // Generar un ID único basado en el timestamp
      id: Date.now(),
      
      // Usar la primera imagen como imagen principal
      image: extractedData.images[0] || '',
      
      // Guardar todas las imágenes
      images: extractedData.images,
      
      // Usar título extraído
      name: parsed.title,
      
      // Descripción limpia
      description: parsed.description,
      
      // Precio extraído de la descripción
      price: parsed.price,
      category: '',
      subcategory: '',
      inStock: true,
      isNew: true,
      isOnOffer: false,
      tags: parsed.tags,
      
      // Metadatos del post de Instagram
      instagramUrl: url,
      extractedFrom: 'instagram',
      extractionDate: new Date().toISOString(),
    };

    onProductDataExtracted(productData);
    onClose();
    
    toast({
      title: 'Producto creado',
      description: 'Los datos del post de Instagram han sido importados. Ahora puedes personalizar los detalles.',
      status: 'success',
      duration: 4000,
      isClosable: true,
    });
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

        <HStack spacing={2}>
          <Input
            placeholder="https://www.instagram.com/p/DZ3QE10lFQH/"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleExtractData()}
            isDisabled={isLoading}
          />
          <Button
            leftIcon={<FaDownload />}
            colorScheme="pink"
            onClick={handleExtractData}
            isLoading={isLoading}
            isDisabled={!url.trim()}
          >
            Extraer
          </Button>
        </HStack>

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
          <VStack spacing={2} py={4}>
            <Spinner size="lg" color="pink.500" />
            <Text fontSize="sm" color="gray.600">
              Extrayendo datos del post de Instagram...
            </Text>
            <Progress size="xs" isIndeterminate colorScheme="pink" w="full" />
          </VStack>
        )}
      </VStack>

      {/* Modal de vista previa */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FaInstagram} color="pink.500" />
              <Text>Vista previa de datos extraídos</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {extractedData && (
              <VStack spacing={4} align="stretch">
                {/* Imágenes encontradas */}
                <Box>
                  <FormLabel mb={2}>
                    <HStack spacing={2}>
                      <Text fontWeight="bold">Imágenes encontradas</Text>
                      <Badge colorScheme="green">{extractedData.images.length}</Badge>
                    </HStack>
                  </FormLabel>
                  <Box 
                    display="grid" 
                    gridTemplateColumns="repeat(auto-fit, minmax(100px, 1fr))" 
                    gap={2}
                    maxH="200px"
                    overflowY="auto"
                    p={2}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    {extractedData.images.map((img, index) => (
                      <Image
                        key={index}
                        src={img}
                        alt={`Imagen ${index + 1}`}
                        boxSize="100px"
                        objectFit="cover"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                      />
                    ))}
                  </Box>
                </Box>

                <Divider />

                {/* Descripción extraída */}
                <FormControl>
                  <FormLabel fontWeight="bold">Descripción extraída</FormLabel>
                  <Textarea
                    value={extractedData.description}
                    readOnly
                    rows={4}
                    resize="none"
                    bg="gray.50"
                  />
                </FormControl>

                {/* Información adicional */}
                <HStack spacing={4} fontSize="sm" color="gray.600">
                  {extractedData.author && (
                    <Text>Autor: {extractedData.author}</Text>
                  )}
                  {extractedData.likes > 0 && (
                    <Text>❤️ {extractedData.likes.toLocaleString()} likes</Text>
                  )}
                </HStack>

                <Divider />

                {/* Acciones */}
                <HStack spacing={3} justify="space-between">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    leftIcon={<FaCheckCircle />}
                    colorScheme="green"
                    onClick={convertToProduct}
                  >
                    Crear producto con estos datos
                  </Button>
                </HStack>

                {extractedData.images.some(img => img.includes('picsum.photos')) && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">Modo demostración</AlertTitle>
                    <AlertDescription fontSize="xs">
                      Estas son imágenes de demostración generadas automáticamente. 
                      Reemplaza las imágenes con las reales del post de Instagram y ajusta la descripción según necesites.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">¡Datos listos!</AlertTitle>
                    <AlertDescription fontSize="xs">
                      Podrás personalizar el nombre, precio, categorías y otros detalles después de crear el producto.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InstagramImporter;
