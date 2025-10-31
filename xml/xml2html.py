# -*- coding: utf-8 -*-
"""
xml2html.py
Genera InfoCircuito.html a partir de circuitoEsquema.xml
Cumple los estándares HTML5 y enlaza a css/estilo.css
"""

import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"u": "http://www.uniovi.es"}

class Html:
    """Clase auxiliar para construir el HTML"""
    def __init__(self):
        self.partes = []

    def add(self, linea):
        self.partes.append(linea)

    def render(self):
        return "\n".join(self.partes)

def generar_html(xml_path, html_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    # --- Extracción con XPath ---
    nombre = root.findtext(".//u:nombre", namespaces=NS)
    longitud = root.findtext(".//u:longitud", namespaces=NS)
    anchura = root.findtext(".//u:anchuraMedia", namespaces=NS)
    fecha = root.findtext(".//u:fechaCarrera", namespaces=NS)
    hora = root.findtext(".//u:horaInicio", namespaces=NS)
    vueltas = root.findtext(".//u:vueltas", namespaces=NS)
    localidad = root.findtext(".//u:localidad", namespaces=NS)
    pais = root.findtext(".//u:pais", namespaces=NS)
    patrocinador = root.findtext(".//u:patrocinador", namespaces=NS)

    refs = [r.text.strip() for r in root.findall(".//u:referencias/u:ref", namespaces=NS) if r.text]
    fotos = root.findall(".//u:galeriaFotos/u:foto", namespaces=NS)
    videos = root.findall(".//u:galeriaVideos/u:video", namespaces=NS)
    vencedor = root.findtext(".//u:vencedor/u:piloto", namespaces=NS)
    tiempoTotal = root.findtext(".//u:vencedor/u:tiempoTotal", namespaces=NS)

    # --- Comienza HTML ---
    h = Html()
    h.add("<!DOCTYPE html>")
    h.add('<html lang="es">')
    h.add("  <head>")
    h.add('    <meta charset="UTF-8">')
    h.add('    <meta name="author" content="Juan Fernández López">')
    h.add('    <meta name="description" content="Información del circuito del mundial MotoGP">')
    h.add('    <meta name="keywords" content="MotoGP, circuito, carreras, Argentina">')
    h.add('    <meta name="viewport" content="width=device-width, initial-scale=1.0">')
    h.add("    <title>MotoGP - Circuito</title>")
    h.add('    <link href="/multimedia/favicon.ico" rel="icon">')
    h.add('    <link rel="stylesheet" type="text/css" href="css/estilo.css">')
    h.add("  </head>")
    h.add("  <body>")

    # Contenido principal
    h.add("    <main>")
    h.add("      <section>")
    h.add(f"        <h2>{nombre}</h2>")
    h.add(f"        <p>Ubicado en {localidad} ({pais}), este circuito cuenta con una longitud total de {longitud} metros y una anchura media de {anchura} metros. "
          f"El patrocinador principal es {patrocinador}.</p>")
    h.add(f"        <p>La carrera del mundial MotoGP se disputará el día {fecha} a las {hora}, con un total de {vueltas} vueltas al trazado.</p>")

    # Galería de imágenes
    if fotos:
        h.add("        <h3>Galería de imágenes</h3>")
        for foto in fotos:
            archivo = foto.attrib.get("archivo", "")
            titulo = foto.attrib.get("titulo", "Imagen del circuito")
            tipo = foto.attrib.get("tipo", "")
            h.add("        <figure>")
            h.add(f'          <img src="{archivo}" alt="{titulo}" loading="lazy">')
            h.add(f'          <figcaption>{titulo} ({tipo})</figcaption>')
            h.add("        </figure>")

    # Galería de videos
    if videos:
        h.add("        <h3>Vídeos destacados</h3>")
        for v in videos:
            archivo = v.attrib.get("archivo", "")
            titulo = v.attrib.get("titulo", "Vídeo del circuito")
            tipo = v.attrib.get("tipo", "")
            h.add("        <video controls preload='auto'>")
            h.add(f'          <source src="{archivo}" type="video/{tipo}">')
            h.add("          <p>Tu navegador no soporta el elemento video.</p>")
            h.add("        </video>")
            h.add(f"        <p>{titulo}</p>")

    # Vencedor y clasificación
    if vencedor and tiempoTotal:
        h.add("        <h3>Último vencedor</h3>")
        h.add(f"        <p>El último ganador fue <strong>{vencedor}</strong> con un tiempo total de {tiempoTotal.replace('PT','').replace('M',' min ').replace('S',' s')}.</p>")

    # Referencias
    if refs:
        h.add("        <h3>Fuentes de información</h3>")
        h.add("        <ul>")
        for r in refs:
            h.add(f'          <li><a href="{r}" hreflang="es" rel="noopener noreferrer">{r}</a></li>')
        h.add("        </ul>")

    h.add("      </section>")
    h.add("    </main>")
    h.add("  </body>")
    h.add("</html>")

    # Guardar HTML
    Path(html_path).write_text(h.render(), encoding="utf-8")
    print(f"✅ Archivo HTML generado correctamente en {html_path}")

# ----------------------------
if __name__ == "__main__":
    xml = Path("circuitoEsquema.xml")
    html = Path("../InfoCircuito.html")
    if not xml.exists():
        print("❌ No se encuentra circuitoEsquema.xml")
    else:
        generar_html(xml, html)
