# -*- coding: utf-8 -*-
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
import math

# ---------------- Svg ----------------
class Svg:
    def __init__(self):
        # Corregido: namespace y dimensiones base
        self.raiz = ET.Element('svg', xmlns="http://www.w3.org/2000/svg", version="1.1")

    def addRect(self, x, y, width, height, fill, strokeWidth, stroke):
        ET.SubElement(self.raiz, 'rect', x=str(x), y=str(y), width=str(width), height=str(height),
                      fill=fill, attrib={"stroke-width": str(strokeWidth), "stroke": stroke})

    def addLine(self, x1, y1, x2, y2, stroke, strokeWidth):
        ET.SubElement(self.raiz, 'line', x1=str(x1), y1=str(y1), x2=str(x2), y2=str(y2),
                      stroke=stroke, attrib={"stroke-width": str(strokeWidth)})

    def addPolyline(self, points, stroke, strokeWidth, fill):
        ET.SubElement(self.raiz, 'polyline', points=points,
                      stroke=stroke, fill=fill, attrib={"stroke-width": str(strokeWidth)})

    def addText(self, texto, x, y, fontFamily, fontSize, style):
        el = ET.SubElement(self.raiz, 'text', x=str(x), y=str(y), style=style)
        el.attrib["font-family"] = fontFamily
        el.attrib["font-size"] = str(fontSize)
        el.text = texto

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
    try:
        root = ET.parse(xml_path).getroot()
        alt0_el = root.find(".//u:puntoOrigen/u:altitudMSNM", NS)
        alt0 = float(alt0_el.text) if alt0_el is not None and alt0_el.text else 0.0
        
        dists = [int(x.text) for x in root.findall(".//u:tramos/u:tramo/u:distancia", NS) if x.text]
        alts  = [float(x.text) for x in root.findall(".//u:tramos/u:tramo/u:puntoFinal/u:altitudMSNM", NS) if x.text]
        
        cum = cumulative(dists)
        series = [alt0] + alts
        n = min(len(cum), len(series))
        return cum[:n], series[:n]
    except Exception as e:
        print(f"Error procesando XML: {e}")
        return [], []

# -------------- SVG Logic ------------------
def make_svg(cum_dist, alts_series, svg_out: Path):
    svg = Svg()
    W, H = 1100, 480
    ml, mr, mt, mb = 90, 40, 60, 90
    plot_w = W - ml - mr
    plot_h = H - mt - mb

    x_min, x_max = min(cum_dist), max(cum_dist)
    y_min_d, y_max_d = min(alts_series), max(alts_series)

    pad = max(2, 0.05 * (y_max_d - y_min_d))
    y_min, y_max = y_min_d - pad, y_max_d + pad

    def sx(x): return ml + (x - x_min) * plot_w / (x_max - x_min or 1)
    def sy(y): return mt + plot_h - (y - y_min) * plot_h / (y_max - y_min or 1)

    svg.addRect(0, 0, W, H, '#f9fafc', 0, 'none')
    svg.addRect(ml, mt, plot_w, plot_h, '#ffffff', 1, '#ccd3db')

    # Eje X
    step_x = 500
    total = int(x_max)
    x_ticks = list(range(step_x, total, step_x))
    for xv in x_ticks:
        X = sx(xv)
        svg.addLine(X, mt, X, mt + plot_h, '#e8edf3', 1)
        lbl = f"{xv//1000} km" if xv % 1000 == 0 else f"{xv} m"
        svg.addText(lbl, X - 18, H - mb + 30, 'Verdana', 12, "fill:#444;")

    Xf = sx(total)
    svg.addLine(Xf, mt, Xf, mt + plot_h, '#e8edf3', 1)

    # Eje Y
    svg.addText(f"{int(round(y_min_d))} m", ml - 55, sy(y_min_d) + 4, 'Verdana', 12, "fill:#444;")
    svg.addText(f"{int(round(y_max_d))} m", ml - 55, sy(y_max_d) + 4, 'Verdana', 12, "fill:#444;")

    # Perfil
    points = " ".join(f"{sx(x):.2f},{sy(y):.2f}" for x, y in zip(cum_dist, alts_series))
    svg.addPolyline(points, '#0066ff', 2, 'none')
    
    ground = points + f" {sx(x_max):.2f},{sy(y_min):.2f} {sx(x_min):.2f},{sy(y_min):.2f}"
    svg.addPolyline(ground, 'none', 0, '#e6f0ff')

    # Títulos e información
    up, down = ascent_descent(alts_series)
    svg.addText("Altimetría del circuito", W/2 - 160, 28, 'Verdana', 22, "font-weight:bold; fill:#111;")
    info = f"Distancia: {total} m | Altitud: {int(y_min_d)}–{int(y_max_d)} m | +{int(round(up))} m / -{int(round(down))} m"
    svg.addText(info, W/2 - 260, 52, 'Verdana', 13, "fill:#555;")

    svg.escribir(svg_out)
    print(f"✅ SVG generado: {svg_out}")

def main():
    xml_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("circuitoEsquema.xml")
    svg_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("altimetria.svg")
    
    if not xml_path.exists():
        print(f"❌ Error: El archivo {xml_path} no existe.")
        return

    cum, alts = extract_profile(xml_path)
    if cum:
        make_svg(cum, alts, svg_path)

if __name__ == "__main__":
    main()