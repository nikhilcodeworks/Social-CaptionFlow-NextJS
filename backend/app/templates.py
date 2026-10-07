from pydantic import BaseModel
from typing import Any, Optional

class SubtitleStyle(BaseModel):
    name: str = "Default"
    fontName: str = "Arial"
    fontSize: int = 24
    primaryColor: str = "#FFFFFF"      # RGB Hex
    outlineColor: str = "#000000"      # RGB Hex
    outlineWidth: float = 0.0          # Default outline width 0.0
    shadowColor: str = "#000000"       # RGB Hex
    shadowWidth: float = 0.0
    bold: int = 1                      # 1 = True, 0 = False
    italic: int = 0                    # 1 = True, 0 = False
    alignment: Any = "lower_bottom"    # 9 options: upper_top, middle_top, lower_top, upper_middle, middle_middle, lower_middle, upper_bottom, middle_lower, lower_bottom
    styleType: str = "highlight"       # classic, highlight, karaoke, pop
    highlightColor: str = "#00FFFF"    # RGB Hex (used in highlight and karaoke)
    wordSpacing: Optional[float] = 0.0 # Extra spacing between words

def rgb_to_ass_color(hex_color: str, alpha: int = 0) -> str:
    """
    Converts standard hex RGB color (e.g. '#FFD400' or 'FFD400') 
    to ASS &HAABBGGRR& format (note: Blue and Red are swapped).
    """
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = "".join(c*2 for c in hex_color)
    if len(hex_color) != 6:
        hex_color = "FFFFFF"
        
    r = hex_color[0:2]
    g = hex_color[2:4]
    b = hex_color[4:6]
    
    # ASS format: &HAABBGGRR&
    a_hex = f"{alpha:02X}"
    return f"&H{a_hex}{b}{g}{r}&"

# Default template library definitions
TEMPLATES = {
    "classic": SubtitleStyle(
        name="Classic",
        fontName="Arial",
        fontSize=48,
        primaryColor="#FFFFFF",
        outlineColor="#000000",
        outlineWidth=0.0,
        shadowColor="#000000",
        shadowWidth=1.0,
        bold=1,
        alignment="lower_bottom",
        styleType="classic",
        wordSpacing=0.0
    ),
    "highlight": SubtitleStyle(
        name="Highlight",
        fontName="Arial",
        fontSize=56,
        primaryColor="#FFFFFF",
        outlineColor="#000000",
        outlineWidth=0.0,
        shadowColor="#000000",
        shadowWidth=0.0,
        bold=1,
        alignment="lower_bottom",
        styleType="highlight",
        highlightColor="#FFD400", # Yellow-gold highlight
        wordSpacing=0.0
    ),
    "karaoke": SubtitleStyle(
        name="Karaoke",
        fontName="Montserrat ExtraBold",
        fontSize=60,
        primaryColor="#FFFFFF",
        outlineColor="#000000",
        outlineWidth=0.0,
        shadowColor="#000000",
        shadowWidth=0.0,
        bold=1,
        alignment="lower_bottom",
        styleType="karaoke",
        highlightColor="#00FF00", # Neon green active word
        wordSpacing=0.0
    ),
    "pop": SubtitleStyle(
        name="Pop",
        fontName="Impact",
        fontSize=72,
        primaryColor="#FFFF00", # Yellow
        outlineColor="#000000",
        outlineWidth=0.0,
        shadowColor="#000000",
        shadowWidth=0.0,
        bold=1,
        alignment="upper_middle", # Above center
        styleType="pop",
        wordSpacing=0.0
    )
}
