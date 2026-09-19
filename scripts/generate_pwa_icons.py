import os
from PIL import Image, ImageDraw, ImageFont

public_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "web", "public")
os.makedirs(public_dir, exist_ok=True)

# 1. Create SVG Favicon
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1628" />
      <stop offset="50%" stop-color="#0f223f" />
      <stop offset="100%" stop-color="#070e1a" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background with rounded squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-opacity="0.4" />

  <!-- Shield Shape -->
  <path d="M 256 70 L 400 130 C 400 280 256 385 256 385 C 256 385 112 280 112 130 Z" 
        fill="url(#shieldGrad)" stroke="url(#goldGrad)" stroke-width="12" stroke-linejoin="round" filter="url(#glow)"/>

  <!-- Inner Scale of Justice / Metrology Balance -->
  <!-- Central Beam -->
  <line x1="256" y1="125" x2="256" y2="295" stroke="#fbbf24" stroke-width="10" stroke-linecap="round"/>
  <!-- Cross Beam -->
  <line x1="170" y1="170" x2="342" y2="170" stroke="#fbbf24" stroke-width="10" stroke-linecap="round"/>
  <!-- Center Pivot -->
  <circle cx="256" cy="170" r="14" fill="#f59e0b" stroke="#ffffff" stroke-width="4"/>

  <!-- Left Pan -->
  <line x1="180" y1="175" x2="155" y2="225" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/>
  <line x1="180" y1="175" x2="205" y2="225" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/>
  <path d="M 140 225 Q 180 245 220 225 Z" fill="#f59e0b" opacity="0.9"/>

  <!-- Right Pan -->
  <line x1="332" y1="175" x2="307" y2="225" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/>
  <line x1="332" y1="175" x2="357" y2="225" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/>
  <path d="M 292 225 Q 332 245 372 225 Z" fill="#f59e0b" opacity="0.9"/>

  <!-- Base Plate -->
  <rect x="220" y="295" width="72" height="16" rx="8" fill="#fbbf24" />

  <!-- MetriCheck AI Badge in Hindi & Latin -->
  <rect x="156" y="320" width="200" height="42" rx="10" fill="#0f172a" stroke="#f59e0b" stroke-width="3"/>
  <text x="256" y="348" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">METRICHECK</text>

  <!-- Tricolor Accent Ribbon at bottom -->
  <rect x="136" y="440" width="240" height="7" rx="3" fill="#FF9933"/>
  <rect x="136" y="447" width="240" height="7" fill="#FFFFFF"/>
  <rect x="136" y="454" width="240" height="7" rx="3" fill="#138808"/>
  <circle cx="256" cy="450.5" r="4.5" fill="#000080" />
</svg>"""

with open(os.path.join(public_dir, "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)

print("Created favicon.svg successfully.")

# Function to draw high quality PIL PNG
def generate_icon(size, is_maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale factor
    s = size / 512.0
    
    # Margin for maskable (safe zone is inner 80% circle)
    margin = int(size * 0.1) if is_maskable else 0
    bg_box = [margin, margin, size - margin, size - margin]
    corner_radius = int(110 * s) if not is_maskable else int(40 * s)

    # Dark Navy Background
    if is_maskable:
        # Full fill for maskable so no transparent edges get cut
        draw.rectangle([0, 0, size, size], fill=(10, 22, 40, 255))
    else:
        draw.rounded_rectangle(bg_box, radius=corner_radius, fill=(10, 22, 40, 255), outline=(245, 158, 11, 100), width=max(2, int(4 * s)))

    # Scale coordinates
    def c(x, y):
        # map 512 space into target space
        if is_maskable:
            inner_s = s * 0.76
            offset = size * 0.12
            return (int(x * inner_s + offset), int(y * inner_s + offset))
        return (int(x * s), int(y * s))

    # Shield points
    p1 = c(256, 70)
    p2 = c(400, 130)
    p3 = c(390, 250)
    p4 = c(256, 385)
    p5 = c(122, 250)
    p6 = c(112, 130)
    shield_pts = [p1, p2, p3, p4, p5, p6]
    draw.polygon(shield_pts, fill=(15, 34, 63, 255), outline=(245, 158, 11, 255))
    
    # Line width
    lw = max(3, int(8 * (s if not is_maskable else s * 0.76)))
    pan_lw = max(2, int(4 * (s if not is_maskable else s * 0.76)))

    # Central Beam
    b_top = c(256, 125)
    b_bot = c(256, 290)
    draw.line([b_top, b_bot], fill=(251, 191, 36, 255), width=lw)

    # Cross Beam
    cb_left = c(170, 170)
    cb_right = c(342, 170)
    draw.line([cb_left, cb_right], fill=(251, 191, 36, 255), width=lw)

    # Pivot
    p_center = c(256, 170)
    pr = int(12 * (s if not is_maskable else s * 0.76))
    draw.ellipse([p_center[0] - pr, p_center[1] - pr, p_center[0] + pr, p_center[1] + pr], fill=(245, 158, 11, 255), outline=(255, 255, 255, 255), width=max(1, int(2*s)))

    # Left Pan
    lp_top = c(180, 175)
    lp_l = c(155, 225)
    lp_r = c(205, 225)
    draw.line([lp_top, lp_l], fill=(251, 191, 36, 255), width=pan_lw)
    draw.line([lp_top, lp_r], fill=(251, 191, 36, 255), width=pan_lw)
    draw.chord([c(140, 215)[0], c(140, 215)[1], c(220, 235)[0], c(220, 235)[1]], start=0, end=180, fill=(245, 158, 11, 255))

    # Right Pan
    rp_top = c(332, 175)
    rp_l = c(307, 225)
    rp_r = c(357, 225)
    draw.line([rp_top, rp_l], fill=(251, 191, 36, 255), width=pan_lw)
    draw.line([rp_top, rp_r], fill=(251, 191, 36, 255), width=pan_lw)
    draw.chord([c(292, 215)[0], c(292, 215)[1], c(372, 235)[0], c(372, 235)[1]], start=0, end=180, fill=(245, 158, 11, 255))

    # Base
    base_l = c(220, 290)
    base_r = c(292, 304)
    draw.rounded_rectangle([base_l[0], base_l[1], base_r[0], base_r[1]], radius=int(6*s), fill=(251, 191, 36, 255))

    # Banner Box
    bb_tl = c(165, 320)
    bb_br = c(347, 355)
    draw.rounded_rectangle([bb_tl[0], bb_tl[1], bb_br[0], bb_br[1]], radius=int(8*s), fill=(15, 23, 42, 255), outline=(245, 158, 11, 255), width=max(1, int(2*s)))

    # Tricolor Ribbon
    t_saffron_tl = c(150, 436)
    t_saffron_br = c(362, 443)
    draw.rectangle([t_saffron_tl[0], t_saffron_tl[1], t_saffron_br[0], t_saffron_br[1]], fill=(255, 153, 51, 255))
    
    t_white_tl = c(150, 443)
    t_white_br = c(362, 450)
    draw.rectangle([t_white_tl[0], t_white_tl[1], t_white_br[0], t_white_br[1]], fill=(255, 255, 255, 255))

    t_green_tl = c(150, 450)
    t_green_br = c(362, 457)
    draw.rectangle([t_green_tl[0], t_green_tl[1], t_green_br[0], t_green_br[1]], fill=(19, 136, 8, 255))

    return img

# Generate all icon sizes
sizes = [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("icon-maskable-512.png", 512, True),
    ("apple-touch-icon.png", 180, False)
]

for filename, size, maskable in sizes:
    icon = generate_icon(size, maskable)
    out_path = os.path.join(public_dir, filename)
    icon.save(out_path, format="PNG")
    print(f"Generated {filename} ({size}x{size})")

print("All icons generated successfully.")
