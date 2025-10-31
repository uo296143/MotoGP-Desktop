# -*- coding: utf-8 -*-
"""
xml2altimetria.py — versión ajuste ticks X/Y
- X: sin 5 km si el circuito es menor; FIN exacto.
- Y: solo etiquetas en min y max (sin 275 ni intermedias).
"""

import sys
import xml.etree.ElementTree as ET
from pathlib import Path
import math

# ---------------- Svg ----------------
class Svg:
    def __init__(self):
        self.raiz = ET.Element('svg', xmlns="http://www.w3.org/2000/svg", version="2.0")

    def addRect(self, x, y, width, height, fill, strokeWidth, stroke):
        ET.SubElement(self.raiz, 'rect', x=x, y=y, width=width, height=height,
                      fill=fill, strokeWidth=strokeWidth, stroke=stroke)

    def addLine(self, x1, y1, x2, y2, stroke, strokeWidth):
        ET.SubElement(self.raiz, 'line', x1=x1, y1=y1, x2=x2, y2=y2,
                      stroke=stroke, strokeWidth=strokeWidth)

    def addPolyline(self, points, stroke, strokeWidth, fill):
        ET.SubElement(self.raiz, 'polyline', points=points,
                      stroke=stroke, strokeWidth=strokeWidth, fill=fill)

    def addText(self, texto, x, y, fontFamily, fontSize, style):
        ET.SubElement(self.raiz, 'text', x=x, y=y,
                      fontFamily=fontFamily, fontSize=fontSize, style=style).text = texto

    def escribir(self, path):
        arbol = ET.ElementTree(self.raiz)
        ET.indent(arbol)
        arbol.write(str(path), encoding='utf-8', xml_declaration=True)

# -------------- Utils ----------------
NS = {"u": "http://www.uniovi.es"}

def nice_step(span, target_ticks=5):
    if span <= 0: return 1
    raw = span / max(1, target_ticks)
    power = 10 ** int(math.floor(math.log10(raw)))
    for m in (1, 2, 5, 10):
        step = m * power
        if raw <= step:
            return step
    return power

def cumulative(vals):
    out = [0]
    for v in vals: out.append(out[-1] + v)
    return out

def ascent_descent(series):
    up = down = 0.0
    for a, b in zip(series, series[1:]):
        d = b - a
        if d > 0: up += d
        elif d < 0: down += -d
    return up, down

# -------------- Data -----------------
def extract_profile(xml_path: Path):
    root = ET.parse(xml_path).getroot()
    alt0_el = root.find(".//u:puntoOrigen/u:altitudMSNM", NS)
    alt0 = float(alt0_el.text) if alt0_el is not None and alt0_el.text else 0.0
    dists = [int(x.text) for x in root.findall(".//u:tramos/u:tramo/u:distancia", NS) if x.text]
    alts  = [float(x.text) for x in root.findall(".//u:tramos/u:tramo/u:puntoFinal/u:altitudMSNM", NS) if x.text]
    cum = cumulative(dists)
    series = [alt0] + alts
    n = min(len(cum), len(series))
    return cum[:n], series[:n]

# -------------- SVG ------------------
def make_svg(cum_dist, alts_series, svg_out: Path):
    svg = Svg()

    # Lienzo
    W, H = 1100, 480
    ml, mr, mt, mb = 90, 40, 60, 90
    plot_w = W - ml - mr
    plot_h = H - mt - mb

    x_min, x_max = min(cum_dist), max(cum_dist)
    y_min_d, y_max_d = min(alts_series), max(alts_series)

    # padding vertical solo para el dibujo (no para las etiquetas)
    pad = max(2, 0.05 * (y_max_d - y_min_d))
    y_min, y_max = y_min_d - pad, y_max_d + pad

    def sx(x): return ml + (x - x_min) * plot_w / (x_max - x_min or 1)
    def sy(y): return mt + plot_h - (y - y_min) * plot_h / (y_max - y_min or 1)

    # Fondo y área
    svg.addRect('0', '0', str(W), str(H), '#f9fafc', '0', 'none')
    svg.addRect(str(ml), str(mt), str(plot_w), str(plot_h), '#ffffff', '1', '#ccd3db')

    # ----- Eje X (sin 5 km si no toca) -----
    step_x = 500
    total = int(x_max)
    up_to = (total // step_x) * step_x  # último múltiplo <= total
    x_ticks = list(range(step_x, up_to + 1, step_x))  # excluye 0
    # grid + etiquetas intermedias
    for xv in x_ticks:
        X = sx(xv)
        svg.addLine(str(X), str(mt), str(X), str(mt + plot_h), '#e8edf3', '1')
        lbl = f"{xv//1000} km" if xv % 1000 == 0 else f"{xv} m"
        svg.addText(lbl, str(X - 18), str(H - mb + 30), 'Verdana', '12', "fill:#444;")
    # FIN exacto
    Xf = sx(total)
    svg.addLine(str(Xf), str(mt), str(Xf), str(mt + plot_h), '#e8edf3', '1')  # línea fin

    # ----- Eje Y (solo min y max) -----
    step_y = nice_step(y_max_d - y_min_d, target_ticks=6)
    # líneas de rejilla 'bonitas' sin etiquetas
    y0 = math.floor(y_min_d / step_y) * step_y
    yv = y0
    while yv <= y_max_d:
        Y = sy(yv)
        svg.addLine(str(ml), str(Y), str(ml + plot_w), str(Y), '#edf1f5', '1')
        yv += step_y
    # etiquetas SOLO en min y max reales
    svg.addText(f"{int(round(y_min_d))} m", str(ml - 55), str(sy(y_min_d) + 4), 'Verdana', '12', "fill:#444;")
    svg.addText(f"{int(round(y_max_d))} m", str(ml - 55), str(sy(y_max_d) + 4), 'Verdana', '12', "fill:#444;")

    # Ejes
    svg.addLine(str(ml), str(mt + plot_h), str(ml + plot_w), str(mt + plot_h), '#222', '2')
    svg.addLine(str(ml), str(mt), str(ml), str(mt + plot_h), '#222', '2')

    # Perfil
    points = " ".join(f"{sx(x):.2f},{sy(y):.2f}" for x, y in zip(cum_dist, alts_series))
    svg.addPolyline(points, '#0066ff', '2', 'none')
    ground = points + f" {sx(x_max):.2f},{sy(y_min):.2f} {sx(x_min):.2f},{sy(y_min):.2f}"
    svg.addPolyline(ground, '#cce0ff', '1', '#e6f0ff')

    # Títulos
    up, down = ascent_descent(alts_series)
    svg.addText("Altimetría del circuito", str(W/2 - 160), str(28),
                'Verdana', '22', "font-weight:bold; fill:#111;")
    svg.addText(f"Distancia: {total} m  |  Altitud: {int(y_min_d)}–{int(y_max_d)} m  |  +{int(round(up))} m / -{int(round(down))} m",
                str(W/2 - 260), str(52), 'Verdana', '13', "fill:#555;")

    # Etiquetas ejes
    svg.addText("Distancia acumulada (m)", str(ml + plot_w/2 - 80), str(H - 25), 'Verdana', '14', "fill:#333;")
    svg.addText("Altitud (m)", str(25), str(mt + plot_h/2), 'Verdana', '14',
                "writing-mode:tb; glyph-orientation-vertical:0; fill:#333;")

    # ORIGEN y FIN (sin solapes)
    svg.addText("ORIGEN", str(sx(x_min) - 30), str(H - mb + 48), 'Verdana', '12', "fill:#111;")
    svg.addLine(str(sx(x_min)), str(mt + plot_h), str(sx(x_min)), str(mt + plot_h + 10), '#222', '2')
    svg.addText("FIN", str(Xf - 10), str(H - mb + 48), 'Verdana', '12', "fill:#111;")
    svg.addLine(str(Xf), str(mt + plot_h), str(Xf), str(mt + plot_h + 10), '#222', '2')

    svg.escribir(svg_out)
    print(f"✅ SVG generado: {svg_out}")

# -------------- Main -----------------
def main():
    xml_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("circuitoEsquema.xml")
    svg_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("altimetria.svg")
    if not xml_path.exists():
        print("❌ No se encuentra el XML:", xml_path); sys.exit(1)
    cum, alts = extract_profile(xml_path)
    if not cum or not alts:
        print("⚠️ No se han podido extraer datos de distancia/altitud."); sys.exit(2)
    make_svg(cum, alts, str(svg_path))

if __name__ == "__main__":
    main()
