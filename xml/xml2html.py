
# -*- coding: utf-8 -*-
"""
xml2html_inverso.py
Genera InfoCircuito.html EXACTAMENTE igual al proporcionado por el usuario
a partir de circuitoEsquema.xml (namespace de UniOvi).
Basado en la versión previa del autor.
"""

import re
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"u": "http://www.uniovi.es"}

class HtmlBuilder:
    def __init__(self):
        self._parts = []
    def add(self, line: str):
        self._parts.append(line)
    def render(self) -> str:
        return "\n".join(self._parts)

def _iso8601_to_mm_ss(texto):
    """
    Convierte una duración ISO-8601 tipo PT41M11.100S -> '41 min 11.100 s'
    Si no coincide, devuelve el texto original tal cual.
    """
    if not texto:
        return ""
    m = re.fullmatch(r"PT(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?", texto)
    if not m:
        return texto
    minutos = m.group(1) or "0"
    segundos = m.group(2) or "0"
    return f"{minutos} min {segundos} s"

def generar_html(xml_path, html_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    # --- Extracción de campos ---
    nombre = root.findtext(".//u:nombre", namespaces=NS) or ""
    longitud = root.findtext(".//u:longitud", namespaces=NS) or ""
    anchura = root.findtext(".//u:anchuraMedia", namespaces=NS) or ""
    fecha = root.findtext(".//u:fechaCarrera", namespaces=NS) or ""
    hora = root.findtext(".//u:horaInicio", namespaces=NS) or ""
    vueltas = root.findtext(".//u:vueltas", namespaces=NS) or ""
    localidad = root.findtext(".//u:localidad", namespaces=NS) or ""
    pais = root.findtext(".//u:pais", namespaces=NS) or ""
    patrocinador = root.findtext(".//u:patrocinador", namespaces=NS) or ""

    # Fotos: archivo y título
    fotos = []
    for foto in root.findall(".//u:galeriaFotos/u:foto", namespaces=NS):
        archivo = foto.attrib.get("archivo", "")
        titulo = foto.attrib.get("titulo", "Imagen")
        fotos.append((archivo, titulo))

    # Vídeos: solo tomamos el primero (como en el HTML final) y su título
    video_src = ""
    video_tipo = ""
    video_titulo = ""
    vids = root.findall(".//u:galeriaVideos/u:video", namespaces=NS)
    if vids:
        v = vids[0]
        video_src = v.attrib.get("archivo", "")
        # El HTML final usa type="video/mp4"
        video_tipo = "mp4"
        video_titulo = v.attrib.get("titulo", "Vídeo")

    # Vencedor + tiempo
    vencedor = root.findtext(".//u:vencedor/u:piloto", namespaces=NS) or ""
    tiempo_total_iso = root.findtext(".//u:vencedor/u:tiempoTotal", namespaces=NS) or ""
    tiempo_total = _iso8601_to_mm_ss(tiempo_total_iso)

    # Referencias
    refs = [r.text.strip() for r in root.findall(".//u:referencias/u:ref", namespaces=NS) if r.text and r.text.strip()]

    # --- Ensamblado EXACTO del HTML final proporcionado ---
    h = HtmlBuilder()
    h.add("<!DOCTYPE html>")
    h.add('<html lang="es">')
    h.add("  <head>")
    h.add('    <meta charset="UTF-8" />')
    h.add('    <meta name="author" content="Juan Fernández López" />')
    h.add('    <meta name="description" content="Información del circuito del mundial MotoGP" />')
    h.add('    <meta name="keywords" content="MotoGP, circuito, carreras, Argentina" />')
    h.add('    <meta name="viewport" content="width=device-width, initial-scale=1.0" />')
    h.add("    <title>MotoGP - Circuito</title>")
    h.add('    <link href="/multimedia/favicon.ico" rel="icon" />')
    h.add('    <link rel="stylesheet" type="text/css" href="css/estilo.css" />')
    h.add("  </head>")
    h.add("  <body>")
    h.add("    <main>")
    h.add("      <section>")
    h.add(f"        <h2>{nombre}</h2>")
    h.add(f"        <p>Ubicado en {localidad} ({pais}), este circuito cuenta con una longitud total de {longitud} metros y una anchura media de {anchura} metros. El patrocinador principal es {patrocinador}.</p>")
    h.add(f"        <p>La carrera del mundial MotoGP se disputará el día {fecha} a las {hora}, con un total de {vueltas} vueltas al trazado.</p>")

    # Galería de imágenes (mismo orden; mismas líneas y comillas)
    if fotos:
        h.add("        <h3>Galería de imágenes</h3>")
        for archivo, titulo in fotos:
            h.add("        <figure>")
            h.add(f'          <img src="{archivo}" alt="{titulo}" />')
            h.add(f"          <figcaption>{titulo}</figcaption>")
            h.add("        </figure>")

    # Vídeo (primero) y texto debajo
    if video_src:
        h.add("        <h3>Vídeos destacados</h3>")
        h.add('        <video controls preload="auto">')
        h.add(f'          <source src="{video_src}" type="video/{video_tipo}" />')
        h.add("          <p>Tu navegador no soporta el elemento video.</p>")
        h.add("        </video>")
        h.add(f"        <p>{video_titulo}</p>")

    # Último vencedor
    if vencedor and tiempo_total:
        h.add("        <h3>Último vencedor</h3>")
        h.add(f"        <p>El último ganador fue <strong>{vencedor}</strong> con un tiempo total de {tiempo_total}.</p>")

    # Referencias
    if refs:
        h.add("        <h3>Fuentes de información</h3>")
        h.add("        <ul>")
        for url in refs:
            h.add(f'          <li><a href="{url}" hreflang="es" rel="noopener noreferrer">{url}</a></li>')
        h.add("        </ul>")

    h.add("      </section>")
    h.add("    </main>")
    h.add("  </body>")
    h.add("</html>")

    Path(html_path).write_text(h.render(), encoding="utf-8")
    print(f"✅ Archivo HTML generado exactamente en {html_path}")

if __name__ == "__main__":
    xml = Path("circuitoEsquema.xml")
    html = Path("InfoCircuito.html")
    if not xml.exists():
        print("❌ No se encuentra circuitoEsquema.xml")
    else:
        generar_html(xml, html)
