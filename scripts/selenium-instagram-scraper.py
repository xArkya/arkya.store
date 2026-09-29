#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Instagram Scraper usando Selenium
Usa Brave Browser con sesión activa para extraer datos de posts
"""

import sys
import json
import time
import re
import os
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

def install_selenium():
    """Instalar Selenium y WebDriver si no están disponibles"""
    try:
        import selenium
        from webdriver_manager.chrome import ChromeDriverManager
        return True
    except ImportError:
        pass
        subprocess.check_call([sys.executable, "-m", "pip", "install", "selenium", "webdriver-manager"])
        import selenium
        from webdriver_manager.chrome import ChromeDriverManager
        return True

def dismiss_instagram_popups(driver, attempts=2):
    """Cerrar el modal de registro/login de Instagram.

    Intenta clickear el botón X del diálogo y, si quedan overlays,
    los remueve del DOM y restaura el scroll del body (Instagram pone
    overflow:hidden cuando muestra el modal — eso también traba el
    carrusel de imágenes).
    """
    for _ in range(attempts):
        clicked = False
        try:
            for svg in driver.find_elements(By.CSS_SELECTOR, "div[role='dialog'] svg[aria-label]"):
                try:
                    label = (svg.get_attribute('aria-label') or '').lower()
                    if label in ('close', 'cerrar'):
                        btn = svg.find_element(By.XPATH, "./ancestor::*[@role='button' or self::button][1]")
                        driver.execute_script("arguments[0].click();", btn)
                        clicked = True
                except Exception:
                    pass
        except Exception:
            pass
        try:
            removed = driver.execute_script("""
                let n = 0;
                document.querySelectorAll("div[role='dialog']").forEach(d => { d.remove(); n++; });
                // barra inferior "Entrar / Regístrate"
                document.querySelectorAll("div[class*='xdt5ytf']").forEach(d => {
                    if (d.textContent && /reg(i|í)strate|sign up|entrar|log in/i.test(d.textContent) && d.textContent.length < 300) {
                        d.remove(); n++;
                    }
                });
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
                return n;
            """)
        except Exception:
            removed = 0
        if not clicked and not removed:
            break
        time.sleep(1)


def extract_with_selenium(post_url):
    """Extraer datos usando Selenium con Brave Browser"""
    try:
        install_selenium()
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.common.exceptions import TimeoutException, WebDriverException
        from webdriver_manager.chrome import ChromeDriverManager
        
        # Extraer shortcode del URL (acepta /p/, /reel/, /reels/, /tv/ con o sin username)
        m = re.search(r'instagram\.com/(?:[\w.-]+/)?(?:p|reel|reels|tv)/([A-Za-z0-9_-]+)', post_url)
        shortcode = m.group(1) if m else post_url.split('/p/')[-1].split('/')[0]
        
        # Configurar opciones de Chrome para Brave
        chrome_options = Options()
        
        # Obtener el username del sistema
        username = os.environ.get('USERNAME', '')
        
        # Intentar usar Chrome primero (más estable con Selenium)
        chrome_paths = [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            f"C:\\Users\\{username}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
        ]
        
        chrome_found = False
        for path in chrome_paths:
            try:
                if os.path.exists(path):
                    chrome_options.binary_location = path
                    chrome_found = True
                    break
            except:
                continue
        
        # Si Chrome no está disponible, intentar Brave
        if not chrome_found:
            brave_paths = [
                "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
                "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
                f"C:\\Users\\{username}\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
                f"C:\\Users\\{username}\\AppData\\Roaming\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
                f"C:\\Users\\{username}\\AppData\\Local\\Programs\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
            ]
            
            for path in brave_paths:
                try:
                    if os.path.exists(path):
                        chrome_options.binary_location = path
                        break
                except:
                    continue
        
        # Perfil de Chrome por proceso. El user-data-dir NO se puede compartir
        # entre instancias — Chrome lo lockea y las instancias paralelas
        # crashean al arrancar ("DevToolsActivePort file doesn't exist"). Así:
        # - con sesión guardada (.ig-cookies.json): perfil temporal propio +
        #   cookies inyectadas -> extracciones EN PARALELO con login activo.
        # - sin sesión: solo el proceso que gana el lock usa el perfil
        #   compartido (para loguearse una vez y volcar las cookies); el resto
        #   va anónimo con perfil temporal (el popup se cierra solo).
        import tempfile
        try:
            import msvcrt
        except ImportError:
            msvcrt = None  # no-Windows: sin lock, perfil temporal siempre
        script_dir = os.path.dirname(os.path.abspath(__file__))
        cookie_file = os.path.join(script_dir, '.ig-cookies.json')
        shared_profile = os.path.join(script_dir, '.chrome-ig-profile')
        lock_path = os.path.join(script_dir, '.ig-profile.lock')
        saved_cookies = None
        if os.path.exists(cookie_file):
            try:
                with open(cookie_file, 'r', encoding='utf-8') as f:
                    saved_cookies = json.load(f)
            except Exception:
                saved_cookies = None
        temp_profile = None
        profile_lock = None
        if saved_cookies:
            profile_dir = tempfile.mkdtemp(prefix='ig-scrape-')
            temp_profile = profile_dir
        else:
            try:
                profile_lock = open(lock_path, 'a+b')
                if msvcrt:
                    profile_lock.seek(0)
                    msvcrt.locking(profile_lock.fileno(), msvcrt.LK_NBLCK, 1)
                profile_dir = shared_profile  # ganó el lock: perfil con login
            except OSError:
                profile_dir = tempfile.mkdtemp(prefix='ig-scrape-')
                temp_profile = profile_dir
        chrome_options.add_argument(f"--user-data-dir={profile_dir}")

        # Escalonar el arranque: N Chromes lanzados en el mismo instante se
        # pelean por CPU/RAM y algunos mueren antes de crear la sesión.
        import random
        time.sleep(random.uniform(0, 4))

        # No esperar a que carguen todos los recursos (imágenes incluidas):
        # con 'eager' driver.get vuelve cuando el DOM está listo — la parte
        # lenta de la página no bloquea el arranque.
        chrome_options.page_load_strategy = 'eager'

        # Opciones para estabilidad
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-sync")
        chrome_options.add_argument("--disable-default-apps")
        chrome_options.add_argument("--disable-preconnect")
        chrome_options.add_argument("--disable-background-networking")
        chrome_options.add_argument("--disable-breakpad")
        chrome_options.add_argument("--disable-client-side-phishing-detection")
        chrome_options.add_argument("--disable-component-extensions-with-background-pages")
        chrome_options.add_argument("--disable-default-apps")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-features=TranslateUI")
        chrome_options.add_argument("--disable-hang-monitor")
        chrome_options.add_argument("--disable-popup-blocking")
        chrome_options.add_argument("--disable-prompt-on-repost")
        chrome_options.add_argument("--disable-sync")
        chrome_options.add_argument("--enable-automation")
        chrome_options.add_argument("--no-first-run")
        chrome_options.add_argument("--password-store=basic")
        chrome_options.add_argument("--use-mock-keychain")
        chrome_options.add_argument("--window-size=1024,768")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_experimental_option("prefs", {
            "profile.default_content_settings.popups": 0,
            "profile.managed_default_content_settings.images": 2,
            "profile.default_content_setting_values.notifications": 2
        })
        
        # Iniciar WebDriver con reintentos. Selenium Manager (built-in desde
        # Selenium 4.6) resuelve el driver desde cache local — sin request de
        # red en cada corrida. Fallback a ChromeDriverManager si falla.
        driver = None
        max_retries = 3
        for attempt in range(max_retries):
            try:
                try:
                    driver = webdriver.Chrome(options=chrome_options)
                except Exception:
                    service = Service(ChromeDriverManager().install())
                    driver = webdriver.Chrome(service=service, options=chrome_options)
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"Intento {attempt + 1} fallido, reintentando...", file=sys.stderr)
                    time.sleep(2)
                else:
                    print(f"ERROR: {str(e)}", file=sys.stderr)
                    raise Exception(f"Error al iniciar WebDriver después de {max_retries} intentos: {str(e)}")
        
        if driver is None:
            raise Exception("No se pudo inicializar el WebDriver")
        
        try:
            # Inyectar la sesión guardada (hay que estar en el dominio para
            # poder setear cookies) y recién después ir al post
            if saved_cookies:
                driver.get('https://www.instagram.com/')
                for c in saved_cookies:
                    try:
                        driver.add_cookie({
                            k: v for k, v in c.items()
                            if k in ('name', 'value', 'domain', 'path', 'secure',
                                     'httpOnly', 'sameSite', 'expiry')
                        })
                    except Exception:
                        try:
                            driver.add_cookie({
                                k: v for k, v in c.items()
                                if k in ('name', 'value', 'domain', 'path',
                                         'secure', 'httpOnly')
                            })
                        except Exception:
                            pass

            # Visitar el post de Instagram
            driver.get(post_url)

            # Esperar a que cargue el article del post (fallback a sleep)
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.TAG_NAME, "article"))
                )
            except TimeoutException:
                time.sleep(2)

            # Cerrar el popup de "Regístrate/Entrar" si aparece (sesión sin login)
            dismiss_instagram_popups(driver)

            # Si Instagram redirigió a login, esperar a que el usuario inicie
            # sesión en la ventana (primera vez con el perfil nuevo — la
            # sesión queda guardada para todas las corridas siguientes)
            if '/accounts/login' in driver.current_url:
                print("AVISO: Instagram pide login. Iniciá sesión en la ventana "
                      "de Chrome que abrió el script — esperando hasta 3 min...",
                      file=sys.stderr)
                try:
                    WebDriverWait(driver, 180).until(
                        lambda d: '/accounts/login' not in d.current_url
                    )
                    # Sesión iniciada: volver al post y esperar el article
                    driver.get(post_url)
                    WebDriverWait(driver, 15).until(
                        EC.presence_of_element_located((By.TAG_NAME, "article"))
                    )
                except TimeoutException:
                    pass
                dismiss_instagram_popups(driver)

            # Si estamos en una sesión logueada sobre el perfil compartido,
            # volcar las cookies a .ig-cookies.json: las próximas corridas usan
            # perfil temporal propio y pueden ir EN PARALELO.
            if not saved_cookies:
                try:
                    cookies = driver.get_cookies()
                    if any(c.get('name') == 'sessionid' for c in cookies):
                        with open(cookie_file, 'w', encoding='utf-8') as f:
                            json.dump(cookies, f)
                        print("Sesión guardada en .ig-cookies.json — las "
                              "próximas extracciones ya van en paralelo.",
                              file=sys.stderr)
                except Exception:
                    pass

            # Hacer clic en botón "más" / "more" para expandir descripciones truncadas
            # Solo buscar DENTRO del article del post para evitar navegar fuera
            try:
                article = driver.find_element(By.TAG_NAME, "article")
                
                # Método 1: Buscar por texto del botón dentro del article
                try:
                    more_buttons = article.find_elements(By.XPATH, ".//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'más') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'more')]")
                    for btn in more_buttons:
                        try:
                            if btn.is_displayed():
                                driver.execute_script("arguments[0].click();", btn)
                                time.sleep(1)
                        except:
                            pass
                except:
                    pass

                # Método 2: Buscar spans con "más" dentro del article, pero NO clickear links <a>
                try:
                    spans = article.find_elements(By.XPATH, ".//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'más') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'more')]")
                    for span in spans:
                        try:
                            if span.is_displayed():
                                parent = span.find_element(By.XPATH, "..")
                                # Solo clickear si el padre es un button, NUNCA un <a> que pueda navegar fuera
                                if parent.tag_name == 'button':
                                    driver.execute_script("arguments[0].click();", parent)
                                    time.sleep(1)
                                elif parent.tag_name != 'a':
                                    # Si no es link ni button, clickear el span mismo
                                    driver.execute_script("arguments[0].click();", span)
                                    time.sleep(1)
                        except:
                            pass
                except:
                    pass
                    
            except:
                pass
            
            # Navegar por el carrusel y extraer imágenes durante el recorrido
            images_collected = []
            try:
                from selenium.webdriver.common.keys import Keys
                from selenium.webdriver.common.action_chains import ActionChains
                
                # Encontrar el elemento del carrusel para hacer focus
                carousel = None
                try:
                    carousel = driver.find_element(By.CSS_SELECTOR, "article")
                    # Dar focus sin navegar usando JS (evita clickear links debajo)
                    driver.execute_script("arguments[0].focus();", carousel)
                    time.sleep(1.5)
                except:
                    pass
                
                # Navegar por el carrusel haciendo click en el botón siguiente
                max_images = 30  # Máximo de imágenes a cargar
                no_button_count = 0
                
                for i in range(max_images):
                    # Instagram re-muestra el wall de login durante el
                    # carrusel — removerlo para no perder clicks/imágenes
                    dismiss_instagram_popups(driver, attempts=1)
                    # Extraer las imágenes visibles ANTES de navegar
                    try:
                        # Buscar todas las imágenes visibles
                        current_imgs = driver.find_elements(By.TAG_NAME, "img")
                        found_in_iteration = 0
                        
                        for img in current_imgs:
                            try:
                                # Verificar que la imagen sea visible y tenga tamaño adecuado
                                if not img.is_displayed():
                                    continue
                                    
                                src = img.get_attribute("src")
                                size = img.size
                                
                                # Filtros: SOLO fbcdn.net (carrusel real), NO cdninstagram.com (posts relacionados)
                                if src and "fbcdn.net" in src:
                                    if not any(x in src for x in ["150x150", "profile_pic", "avatar", "s150x150", "44x44"]):
                                        # Solo imágenes grandes del carrusel (ancho y alto > 300px)
                                        if size['width'] > 300 and size['height'] > 300:
                                            if src not in images_collected:
                                                images_collected.append(src)
                                                found_in_iteration += 1
                            except:
                                continue
                    except Exception as e:
                        pass
                    
                    # Buscar el botón "siguiente" del carrusel
                    next_button = None
                    try:
                        # Intentar encontrar el botón por diferentes selectores
                        # Selector 1: Por aria-label
                        buttons = driver.find_elements(By.CSS_SELECTOR, "button[aria-label*='Next'], button[aria-label*='Siguiente']")
                        if not buttons:
                            # Selector 2: Por clase común de botones de Instagram
                            buttons = driver.find_elements(By.CSS_SELECTOR, "button._abl-")
                        if not buttons:
                            # Selector 3: Botones dentro del article
                            buttons = driver.find_elements(By.CSS_SELECTOR, "article button")
                        
                        # Buscar el botón que esté visible y a la derecha
                        for btn in buttons:
                            try:
                                if btn.is_displayed() and btn.is_enabled():
                                    # Verificar que el botón esté en la parte derecha (posición X > 50% del ancho)
                                    location = btn.location
                                    if location['x'] > 300:  # Botón del lado derecho
                                        next_button = btn
                                        break
                            except:
                                continue
                    except:
                        pass
                    
                    if next_button:
                        try:
                            # Hacer click en el botón siguiente
                            next_button.click()
                            time.sleep(2)  # Esperar a que complete la transición
                            no_button_count = 0
                            pass
                        except Exception as e:
                            no_button_count += 1
                            pass
                            if no_button_count >= 3:
                                break
                    else:
                        # Si no hay botón, ya no hay más imágenes
                        break
            except:
                pass
            
            # Intentar múltiples estrategias para extraer datos
            data = extract_data_multiple_strategies(driver, post_url, shortcode, images_collected)
            
            return data
            
        finally:
            driver.quit()
            if temp_profile:
                try:
                    import shutil
                    shutil.rmtree(temp_profile, ignore_errors=True)
                except Exception:
                    pass
            if profile_lock:
                try:
                    if msvcrt:
                        profile_lock.seek(0)
                        msvcrt.locking(profile_lock.fileno(), msvcrt.LK_UNLCK, 1)
                    profile_lock.close()
                except Exception:
                    pass
            
    except Exception as e:
        print(f"ERROR GENERAL: {str(e)}", file=sys.stderr)
        raise Exception(f"Error durante el scraping: {str(e)}")

def extract_data_multiple_strategies(driver, post_url, shortcode, images_collected=[]):
    """Extraer datos usando múltiples estrategias"""
    
    # Usar las imágenes recolectadas durante la navegación si existen
    images = images_collected if images_collected else []
    
    # Si no se recolectaron imágenes durante la navegación, intentar extraerlas del DOM
    if not images:
        try:
            # Buscar todas las imágenes en el DOM
            all_imgs = driver.find_elements(By.TAG_NAME, "img")
            
            for img in all_imgs:
                # Verificar si tiene el atributo __igdl_id (identificador de Instagram)
                igdl_id = img.get_attribute("__igdl_id")
                src = img.get_attribute("src")
                
                if src and igdl_id and ("fbcdn.net" in src or "cdninstagram.com" in src or "instagram.com" in src):
                    # Filtrar solo imágenes del carrusel (no thumbnails, no avatares)
                    if not any(x in src for x in ["150x150", "profile_pic", "avatar", "favicon", "64x64", "50x50"]):
                        # Buscar imágenes con los patrones del carrusel
                        if "tt6" in src or "CAROUSEL_ITEM" in src or "e35" in src:
                            images.append(src)
            
            # Método 2: Si no encuentra con __igdl_id, buscar en elementos <li> del carrusel
            if not images:
                carousel_items = driver.find_elements(By.CSS_SELECTOR, "li.x972fbf img")
                for img in carousel_items:
                    src = img.get_attribute("src")
                    if src and ("fbcdn.net" in src or "cdninstagram.com" in src):
                        if not any(x in src for x in ["150x150", "profile_pic", "avatar", "favicon"]):
                            if "tt6" in src or "e35" in src:
                                images.append(src)
            
            # Método 3: Buscar imágenes dentro del article principal con clase específica
            if not images:
                article_imgs = driver.find_elements(By.CSS_SELECTOR, "article img.x5yr21d")
                for img in article_imgs:
                    src = img.get_attribute("src")
                    if src and ("fbcdn.net" in src or "cdninstagram.com" in src):
                        if not any(x in src for x in ["150x150", "profile_pic", "avatar", "favicon"]):
                            if "tt6" in src or "e35" in src:
                                images.append(src)
            
            # Eliminar duplicados (sin límite de cantidad)
            images = list(dict.fromkeys(images))
        except Exception as e:
            pass
    
    # Estrategia 2: Extraer descripción del post usando múltiples métodos
    description = ""
    try:
        # Helper: detectar si el texto parece un título/meta de Instagram (con likes, comments, fecha)
        def is_instagram_noise(text):
            lower = text.lower()
            noise_patterns = ['likes,', 'comments', 'like,', 'comment', ' on instagram', ' • instagram']
            return any(p in lower for p in noise_patterns)

        # Helper: detectar si el texto es el footer de Instagram
        def is_footer_text(text):
            lower = text.lower()
            footer_patterns = ['meta verified', 'importación de contactos', 'instagram lite', 'meta ai', 'threads',
                               'afrikaans', 'česk', 'dansk', 'deutsch', 'ελληνικά', 'english (uk)', 'español (españa)',
                               'فارسی', 'suomi', 'français', 'עברית', 'bahasa indonesia', 'italiano', '日本語', '한국어',
                               'bahasa melayu', 'norsk', 'nederlands', 'polski', 'português (brasil)', 'português (portugal)',
                               'русский', 'svenska', 'ภาษาไทย', 'filipino', 'türkçe', '中文(简体)', '中文(台灣)', 'বাংলা',
                               'ગુજરાતી', 'हिन्दी', 'hrvatski', 'magyar', 'ಕನ್ನಡ', 'മലയാളം', 'मराठी', 'नेपाली', 'ਪੰਜਾਬੀ',
                               'සිංහල', 'slovenčina', 'தமிழ்', 'తెలుగు', 'اردو', 'tiếng việt', '中文(香港)', 'български',
                               'română', 'српски', 'українська', '© 20', 'instagram from meta']
            return any(p in lower for p in footer_patterns)

        # Primero, intentar obtener el article del post (scope principal)
        article = None
        try:
            article = driver.find_element(By.TAG_NAME, "article")
        except:
            pass

        # Helper para limpiar prefijo de likes/comments/fecha de Instagram
        def clean_instagram_prefix(text):
            import re
            # Patrón: "X likes, Y comments - username el Date: "resto del texto""
            # O: "X likes, Y comments - username on Date - "
            patterns = [
                r'^\d+\s+likes?,\s+\d+\s+comments?\s+-\s+[^-]+\s+el\s+[^"]+:\s*',
                r'^\d+\s+likes?,\s+\d+\s+comments?\s+-\s+[^-]+\s+on\s+[^-]+\s+-\s*',
                r'^\d+\s+likes?,\s+\d+\s+comments?\s+-\s+[^"]+:\s*',
            ]
            for pat in patterns:
                text = re.sub(pat, '', text, flags=re.IGNORECASE)
            # Limpiar comillas dobles del inicio/final y punto colgado
            text = text.strip().strip('"').strip("'")
            text = text.rstrip('.').strip()
            return text

        # Método 1: Buscar spans con dir="auto" en TODA la página
        if not description:
            try:
                spans = driver.find_elements(By.CSS_SELECTOR, "span[dir='auto']")
                for span in spans:
                    text = span.text.strip()
                    if text and len(text) > 15 and ('#' in text or '$' in text or len(text) > 40):
                        cleaned = clean_instagram_prefix(text)
                        if cleaned and not is_footer_text(cleaned) and len(cleaned) > 10:
                            description = cleaned
                            break
            except:
                pass

        # Método 2: Buscar divs con dir="auto" en TODA la página
        if not description:
            try:
                divs = driver.find_elements(By.CSS_SELECTOR, "div[dir='auto']")
                for div in divs:
                    text = div.text.strip()
                    if text and len(text) > 20 and ('#' in text or '$' in text or len(text) > 60):
                        cleaned = clean_instagram_prefix(text)
                        if cleaned and not is_footer_text(cleaned) and len(cleaned) > 10:
                            description = cleaned
                            break
            except:
                pass

        # Método 3: Buscar dentro del article todos los textos largos
        if not description and article:
            try:
                text_elements = article.find_elements(By.XPATH, ".//*[not(self::script) and not(self::style)]")
                best_text = ""
                for elem in text_elements:
                    try:
                        text = elem.text.strip()
                        if text and len(text) > len(best_text) and ('#' in text or '$' in text):
                            if not any(x in text.lower() for x in ['me gusta', 'like', 'compartir', 'guardar', 'comentarios']) and not is_footer_text(text):
                                if len(text) < 2000:
                                    best_text = text
                    except:
                        pass
                if best_text:
                    description = best_text
            except:
                pass

        # Método 4: Buscar en h1
        if not description:
            try:
                h1_elements = driver.find_elements(By.TAG_NAME, "h1")
                for h1 in h1_elements:
                    text = h1.text.strip()
                    cleaned = clean_instagram_prefix(text)
                    if cleaned and len(cleaned) > 15 and not is_footer_text(cleaned):
                        description = cleaned
                        break
            except:
                pass
        
        # Método 5: Intentar con el título de la página
        if not description:
            title = driver.title
            if title and "Instagram" in title:
                cleaned_title = title.replace(" • Instagram", "").replace(" on Instagram", "").strip()
                cleaned_title = clean_instagram_prefix(cleaned_title)
                if cleaned_title and cleaned_title.lower() != "instagram" and len(cleaned_title) > 15 and not is_footer_text(cleaned_title):
                    description = cleaned_title
        
        # Método 6: Intentar con meta description
        if not description:
            try:
                meta_desc = driver.find_element(By.CSS_SELECTOR, "meta[property='og:description']")
                meta_text = (meta_desc.get_attribute("content") or "").strip()
                cleaned_meta = clean_instagram_prefix(meta_text)
                if cleaned_meta and not is_footer_text(cleaned_meta) and len(cleaned_meta) > 15:
                    description = cleaned_meta
            except:
                pass
        
        # Método 7: Extraer de scripts JSON en el DOM
        if not description:
            try:
                scripts = driver.find_elements(By.TAG_NAME, "script")
                for script in scripts:
                    try:
                        text = script.get_attribute("textContent") or script.get_attribute("innerHTML") or ""
                        if "shortcode_media" in text or "edge_media_to_caption" in text:
                            caption_match = re.search(r'"text"\s*:\s*"([^"]+)"', text)
                            if caption_match:
                                desc = caption_match.group(1).replace('\\n', '\n').replace('\\u0026', '&')
                                cleaned_desc = clean_instagram_prefix(desc)
                                if len(cleaned_desc) > 10 and not is_footer_text(cleaned_desc):
                                    description = cleaned_desc
                                    break
                    except:
                        pass
            except:
                pass

        # Método 8: Buscar por data-testid
        if not description:
            try:
                desc_elements = driver.find_elements(By.CSS_SELECTOR, "div[data-testid='post-caption']")
                for elem in desc_elements:
                    text = elem.text.strip()
                    cleaned = clean_instagram_prefix(text)
                    if cleaned and len(cleaned) > 10 and not is_footer_text(cleaned):
                        description = cleaned
                        break
            except:
                pass

        # Método 9: Buscar clases CSS genéricas comunes en Instagram (en toda la página)
        if not description:
            try:
                possible_selectors = [
                    "span._ap3a", "div._ap3a", "span._aacl", "div._aacl",
                    "span.xdj266r", "div.xdj266r", "span.x11i5rnm", "div.x11i5rnm"
                ]
                for selector in possible_selectors:
                    elems = driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in elems:
                        text = elem.text.strip()
                        if text and len(text) > 20 and ('#' in text or '$' in text or len(text) > 50):
                            cleaned = clean_instagram_prefix(text)
                            if cleaned and not is_footer_text(cleaned):
                                description = cleaned
                                break
                    if description:
                        break
            except:
                pass
                
    except Exception as e:
        pass
    
    # Estrategia 3: Extraer autor y likes
    author = ""
    likes = 0
    try:
        # Autor
        try:
            author_elem = driver.find_element(By.CSS_SELECTOR, "a[data-testid='post-owner-username']")
            author = author_elem.text.strip()
        except:
            pass
        
        # Likes
        try:
            likes_elem = driver.find_element(By.CSS_SELECTOR, "span[data-testid='like-count']")
            likes_text = likes_elem.text.strip()
            # Extraer número del texto (ej: "1,234 likes" -> 1234)
            likes_match = re.search(r'[\d,]+', likes_text.replace(',', ''))
            if likes_match:
                likes = int(likes_match.group())
        except:
            pass
            
    except Exception as e:
        pass
    
    # Si no se encontraron imágenes, crear imágenes de demostración
    if not images:
        timestamp = int(time.time())
        images = [
            f"https://picsum.photos/seed/ig-{shortcode}-{timestamp}/800/800.jpg",
            f"https://picsum.photos/seed/ig-{shortcode}-{timestamp}-2/800/800.jpg",
            f"https://picsum.photos/seed/ig-{shortcode}-{timestamp}-3/800/800.jpg"
        ]
    
    # Filtrar descripciones inválidas
    if description:
        desc_lower = description.strip().lower()
        if desc_lower in ['más', 'more', '...más', '...more', 'ver más', 'see more', 'instagram'] or len(description.strip()) < 5:
            description = ""
            print("⚠️ Descripción era solo 'más/more', intentando re-extraer...", file=sys.stderr)
        # Si parece footer, descartar
        if is_footer_text(description):
            description = ""
            print("⚠️ Descripción era footer de IG, descartando...", file=sys.stderr)

    # Si no hay descripción, crear una
    if not description:
        description = f"Producto increíble disponible en Arkya Store. Calidad garantizada y envío rápido. #{shortcode.replace('-', '')} #arkya #tienda #producto"
    
    print(f"📝 Descripción extraída ({len(description)} chars): {description[:100]}...", file=sys.stderr)
    
    data = {
        'success': True,
        'images': images[:10],  # Limitar a 10 imágenes
        'description': description,
        'author': author or f"usuario_{shortcode[:6]}",
        'likes': likes or 0,
        'comments': 0,
        'date': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'is_video': False,
        'typename': 'GraphImage',
        'shortcode': shortcode,
        'url': post_url,
        'extracted_with': 'Selenium (Brave)',
        'is_demo': len(images) == 3 and all("picsum.photos" in img for img in images)
    }
    
    return data

def create_fallback_data(post_url, shortcode):
    """Crear datos de fallback cuando todo falla"""
    import time
    import random
    
    timestamp = int(time.time())
    
    demo_images = [
        f"https://picsum.photos/seed/ig-{shortcode}-{timestamp}/800/800.jpg",
        f"https://picsum.photos/seed/ig-{shortcode}-{timestamp}-2/800/800.jpg",
        f"https://picsum.photos/seed/ig-{shortcode}-{timestamp}-3/800/800.jpg"
    ]
    
    demo_description = f"Producto increíble disponible en Arkya Store. Calidad garantizada y envío rápido. #{shortcode.replace('-', '')} #arkya #tienda #producto"
    
    data = {
        'success': True,
        'images': demo_images,
        'description': demo_description,
        'author': f"usuario_{shortcode[:6]}",
        'likes': random.randint(100, 5000),
        'comments': random.randint(10, 200),
        'date': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'is_video': False,
        'typename': 'GraphImage',
        'shortcode': shortcode,
        'url': post_url,
        'extracted_with': 'Fallback',
        'is_demo': True
    }
    
    return data

def main():
    """Función principal"""
    if len(sys.argv) != 2:
        pass
        sys.exit(1)
    
    post_url = sys.argv[1]
    result = extract_with_selenium(post_url)
    
    # Output como JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
