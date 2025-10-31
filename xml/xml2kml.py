# xml2kml.py
# -*- coding: utf-8 -*-
"""
Genera un archivo KML (circuito.kml) a partir del archivo circuitoEsquema.xml

Requisitos del enunciado:
- Usar Python
- Usar xml.etree.ElementTree
- Usar XPath para obtener elementos y atributos
- El KML debe mostrar la planimetría del circuito sobre una imagen (esto se comprueba luego en Google Earth)

Autor: (tú)
Basado en los ejemplos: 02010-XPath.py, 02000-XML.py, Nikon-NMEA-KML.py, 02020-KML.py
"""

import xml.etree.ElementTree as ET
import sys

# espacio de nombres del XML de circuito
NS = {'c': 'http://www.uniovi.es'}   # prefijo 'c' para usar en los XPath

def leer_circuito_xml(ruta_xml):
    """
    Lee el XML de circuito y devuelve la raíz
    """
    try:
        arbol = ET.parse(ruta_xml)
    except IOError:
        print("No se encuentra el archivo:", ruta_xml)
        sys.exit(1)
    except ET.ParseError as e:
        print("Error procesando el XML:", e)
        sys.exit(1)
    return arbol.getroot()

def obtener_punto_origen(raiz):
    """
    Devuelve (lon, lat, alt) del puntoOrigen
    XPath obligatorio
    """
    # /circuito/puntoOrigen
    pto = raiz.find('c:puntoOrigen', NS)
    if pto is None:
        raise ValueError("No se encuentra <puntoOrigen> en el XML")

    lon = pto.find('c:longitudGeo', NS)
    lat = pto.find('c:latitudGeo', NS)
    alt = pto.find('c:altitudMSNM', NS)

    if lon is None or lat is None:
        raise ValueError("Faltan coordenadas en <puntoOrigen>")

    # altitud opcional
    alt_val = alt.text.strip() if alt is not None and alt.text is not None else "0"

    return (lon.text.strip(), lat.text.strip(), alt_val)

def obtener_tramos(raiz):
    """
    Devuelve una lista de puntos finales de los tramos en forma [(lon,lat,alt), ...]
    usando XPath obligatorio.
    Orden: el que aparece en el XML.
    """
    puntos = []
    # /circuito/tramos/tramo
    for tramo in raiz.findall('c:tramos/c:tramo', NS):
        pf = tramo.find('c:puntoFinal', NS)
        if pf is None:
            continue
        lon = pf.find('c:longitudGeo', NS)
        lat = pf.find('c:latitudGeo', NS)
        alt = pf.find('c:altitudMSNM', NS)
        if lon is None or lat is None:
            continue
        alt_val = alt.text.strip() if (alt is not None and alt.text is not None) else "0"
        puntos.append((lon.text.strip(), lat.text.strip(), alt_val))
    return puntos

def escribir_prologo_kml(f, nombre_doc="Circuito generado"):
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<kml xmlns="http://www.opengis.net/kml/2.2">\n')
    f.write('  <Document>\n')
    f.write(f'    <name>{nombre_doc}</name>\n')

def escribir_placemark_origen(f, nombre, lon, lat, alt):
    """
    Crea un placemark en el punto de salida/meta
    """
    f.write('    <Placemark>\n')
    f.write(f'      <name>{nombre}</name>\n')
    f.write('      <Point>\n')
    f.write(f'        <coordinates>{lon},{lat},{alt}</coordinates>\n')
    f.write('      </Point>\n')
    f.write('    </Placemark>\n')

def escribir_linea_circuito(f, lista_coord, nombre="Circuito Termas de Río Hondo"):
    """
    lista_coord: lista de strings "lon,lat,alt\n"
    """
    f.write('    <Placemark>\n')
    f.write(f'      <name>{nombre}</name>\n')
    f.write('      <Style>\n')
    f.write('        <LineStyle>\n')
    # rojo semitransparente ancho 4
    f.write('          <color>ff0000ff</color>\n')
    f.write('          <width>4</width>\n')
    f.write('        </LineStyle>\n')
    f.write('      </Style>\n')
    f.write('      <LineString>\n')
    f.write('        <extrude>1</extrude>\n')
    f.write('        <tessellate>1</tessellate>\n')
    f.write('        <altitudeMode>relativeToGround</altitudeMode>\n')
    f.write('        <coordinates>\n')
    for c in lista_coord:
        f.write(f'          {c}\n')
    f.write('        </coordinates>\n')
    f.write('      </LineString>\n')
    f.write('    </Placemark>\n')

def escribir_epilogo_kml(f):
    f.write('  </Document>\n')
    f.write('</kml>\n')

def main():
    # 1) nombre del XML de entrada
    if len(sys.argv) >= 2:
        xml_entrada = sys.argv[1]
    else:
        # por defecto, el que pone el enunciado
        xml_entrada = "circuitoEsquema.xml"

    # 2) nombre del KML de salida
    if len(sys.argv) >= 3:
        kml_salida = sys.argv[2]
    else:
        kml_salida = "circuito.kml"

    # leer xml
    raiz = leer_circuito_xml(xml_entrada)

    # obtener nombre del circuito (opcional)
    nombre_circuito_el = raiz.find('c:nombre', NS)
    nombre_circuito = nombre_circuito_el.text.strip() if nombre_circuito_el is not None else "Circuito"

    # punto de origen
    lon0, lat0, alt0 = obtener_punto_origen(raiz)

    # tramos
    puntos_tramos = obtener_tramos(raiz)

    # construir la lista de coordenadas en orden KML
    # KML: "lon,lat,alt"
    coords = []
    # 1. origen
    coords.append(f"{lon0},{lat0},{alt0}")

    # 2. cada puntoFinal de cada tramo
    for (lon, lat, alt) in puntos_tramos:
        coords.append(f"{lon},{lat},{alt}")

    # 3. opcional: cerrar el circuito volviendo al origen
    # descomenta si quieres que se cierre
    coords.append(f"{lon0},{lat0},{alt0}")

    try:
        with open(kml_salida, 'w', encoding='utf-8') as f:
            escribir_prologo_kml(f, nombre_circuito)
            escribir_placemark_origen(f, "Salida / Meta", lon0, lat0, alt0)
            escribir_linea_circuito(f, coords, nombre=nombre_circuito)
            escribir_epilogo_kml(f)
        print(f"✅ Archivo KML generado correctamente: {kml_salida}")
    except IOError:
        print("❌ No se pudo escribir el archivo KML:", kml_salida)
        sys.exit(1)

    # Nota del enunciado:
    # Para generar planimetria.pdf:
    # 1. Abrir circuito.kml en Google Earth (Archivo -> Abrir)
    # 2. Comprobar que se ve sobre la foto del circuito
    # 3. Imprimir / Guardar como PDF -> planimetria.pdf
    print("ℹ️ Abre el KML en Google Earth y guarda la vista como planimetria.pdf")

if __name__ == "__main__":
    main()
