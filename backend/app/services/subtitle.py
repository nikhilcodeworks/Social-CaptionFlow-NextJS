import os
import logging
from typing import List, Dict, Any
from app.templates import SubtitleStyle, rgb_to_ass_color

logger = logging.getLogger(__name__)

def format_ass_time(seconds: float) -> str:
    """
    Converts seconds (float) to ASS time format: H:MM:SS.CS (CS = centiseconds).
    """
    if seconds < 0:
        seconds = 0.0
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centiseconds = int(round((seconds - int(seconds)) * 100))
    
    # Handle overflow from rounding centiseconds up to 100
    if centiseconds >= 100:
        secs += 1
        centiseconds = centiseconds - 100
        if secs >= 60:
            minutes += 1
            secs = secs - 60
            if minutes >= 60:
                hours += 1
                minutes = minutes - 60
                
    return f"{hours}:{minutes:02d}:{secs:02d}.{centiseconds:02d}"

def chunk_words(
    words: List[Dict[str, Any]], 
    max_words: int = 3, 
    max_chars: int = 22, 
    max_duration: float = 2.0, 
    pause_threshold: float = 0.4
) -> List[List[Dict[str, Any]]]:
    """
    Chunks a list of words into groups (subtitle lines) based on word count,
    character count, duration, and silence gaps.
    """
    if not words:
        return []
        
    chunks = []
    current_chunk = []
    
    for word_info in words:
        if not current_chunk:
            current_chunk.append(word_info)
            continue
            
        prev_word = current_chunk[-1]
        
        # Calculate tentative chunk parameters
        chunk_text = " ".join([w["word"] for w in current_chunk] + [word_info["word"]])
        chunk_duration = word_info["end"] - current_chunk[0]["start"]
        time_gap = word_info["start"] - prev_word["end"]
        
        # Rules for breaking the chunk:
        # 1. Total word count limit
        # 2. Total character count limit
        # 3. Significant pause between words (silence)
        # 4. Total duration of the subtitle display on screen
        if (len(current_chunk) >= max_words or 
            len(chunk_text) > max_chars or 
            time_gap > pause_threshold or 
            chunk_duration > max_duration):
            chunks.append(current_chunk)
            current_chunk = [word_info]
        else:
            current_chunk.append(word_info)
            
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks

def resolve_ass_positioning(alignment_val: Any) -> tuple[int, int]:
    """
    Maps 9 vertical positions to ASS (Alignment, MarginV) for standard 1080x1920 portrait canvas:
    Top Positions:
    1. Upper Top (Very Top) -> Alignment=8, MarginV=80
    2. Middle Top -> Alignment=8, MarginV=190
    3. Lower Top (Below Notch) -> Alignment=8, MarginV=300

    Middle Positions:
    1. Upper Middle (Above Center) -> Alignment=8, MarginV=720
    2. Middle Middle -> Alignment=5, MarginV=0
    3. Lower Middle (Below Center) -> Alignment=8, MarginV=1150

    Lower / Bottom Positions:
    1. Top Lower / Upper Bottom -> Alignment=2, MarginV=340
    2. Middle Lower -> Alignment=2, MarginV=215
    3. Lower Lower / Lower Bottom -> Alignment=2, MarginV=90
    """
    val = str(alignment_val).lower().strip()
    if val in ["upper_top", "8", "top_upper", "very_top"]:
        return (8, 80)
    elif val in ["middle_top", "82", "top_middle"]:
        return (8, 190)
    elif val in ["lower_top", "81", "below_notch", "7"]:
        return (8, 300)
    elif val in ["upper_middle", "51", "middle_upper", "above_center"]:
        return (8, 720)
    elif val in ["middle_middle", "5", "center", "middle"]:
        return (5, 0)
    elif val in ["lower_middle", "52", "below_center", "4"]:
        return (8, 1150)
    elif val in ["upper_bottom", "top_lower", "bottom_upper", "21", "1"]:
        return (2, 340)
    elif val in ["middle_lower", "middle_bottom", "22"]:
        return (2, 215)
    elif val in ["lower_bottom", "lower_lower", "bottom_lower", "2"]:
        return (2, 90)
    else:
        return (2, 90)

def generate_ass_file(
    words: List[Dict[str, Any]], 
    style: SubtitleStyle, 
    output_ass_path: str,
    max_words: int = 3
) -> bool:
    """
    Generates an ASS subtitle file from timestamped words based on the style configurations.
    """
    try:
        # Convert RGB hex colors to ASS hex colors
        prim_color = rgb_to_ass_color(style.primaryColor)
        out_color = rgb_to_ass_color(style.outlineColor)
        shd_color = rgb_to_ass_color(style.shadowColor, alpha=128)  # semi-transparent shadow
        hl_color = rgb_to_ass_color(style.highlightColor)
        
        # Resolve 6 alignment positions
        ass_align, ass_margin_v = resolve_ass_positioning(style.alignment)
        
        # Build ASS file header
        header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{style.fontName},{style.fontSize},{prim_color},&H00000000,{out_color},{shd_color},{style.bold},{style.italic},0,0,100,100,0,0,1,{style.outlineWidth},{style.shadowWidth},{ass_align},50,50,{ass_margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        
        events = []
        
        # Apply chunking
        chunks = chunk_words(words, max_words=max_words)
        
        # Determine word separator using non-breaking spaces (\h) for ASS subtitle word spacing
        raw_word_spacing = float(getattr(style, "wordSpacing", 0) or 0)
        extra_h_spaces = int(round(raw_word_spacing / 3))
        word_sep = " " + ("\\h" * extra_h_spaces) if extra_h_spaces > 0 else " "

        for chunk in chunks:
            chunk_start = chunk[0]["start"]
            chunk_end = chunk[-1]["end"]
            
            if style.styleType == "classic":
                # Single event for the entire chunk, all text is primary color
                text = word_sep.join([w["word"] for w in chunk])
                start_t = format_ass_time(chunk_start)
                end_t = format_ass_time(chunk_end)
                events.append(f"Dialogue: 0,{start_t},{end_t},Default,,0,0,0,,{text}")
                
            elif style.styleType == "highlight":
                # Create separate sub-events for each word's active timing within the chunk
                for i, active_word in enumerate(chunk):
                    # Segment active duration
                    # We display the whole chunk but highlight the specific word active at this time slice
                    start_t = format_ass_time(active_word["start"])
                    # If this is the last word, end at chunk_end, otherwise end at start of next word
                    end_t = format_ass_time(chunk[i+1]["start"] if i < len(chunk) - 1 else chunk_end)
                    
                    text_parts = []
                    for j, w in enumerate(chunk):
                        if j == i:
                            # Highlighted word with tag
                            text_parts.append(f"{{\\c{hl_color}}}{w['word']}{{\\c{prim_color}}}")
                        else:
                            text_parts.append(w["word"])
                            
                    text = word_sep.join(text_parts)
                    events.append(f"Dialogue: 0,{start_t},{end_t},Default,,0,0,0,,{text}")
                    
            elif style.styleType == "karaoke":
                # Scale up the active word and highlight it
                for i, active_word in enumerate(chunk):
                    start_t = format_ass_time(active_word["start"])
                    end_t = format_ass_time(chunk[i+1]["start"] if i < len(chunk) - 1 else chunk_end)
                    
                    text_parts = []
                    for j, w in enumerate(chunk):
                        if j == i:
                            # Karaoke: Active word is scaled up (fscx115, fscy115) and colored
                            text_parts.append(f"{{\\fscx115\\fscy115\\c{hl_color}}}{w['word']}{{\\fscx100\\fscy100\\c{prim_color}}}")
                        else:
                            text_parts.append(w["word"])
                            
                    text = word_sep.join(text_parts)
                    events.append(f"Dialogue: 0,{start_t},{end_t},Default,,0,0,0,,{text}")
                    
            elif style.styleType == "pop":
                # Display ONLY one word at a time, each word gets its own event and scales up
                for active_word in chunk:
                    start_t = format_ass_time(active_word["start"])
                    end_t = format_ass_time(active_word["end"])
                    text = f"{{\\fscx120\\fscy120}}{active_word['word']}"
                    events.append(f"Dialogue: 0,{start_t},{end_t},Default,,0,0,0,,{text}")
                    
        # Write to file
        with open(output_ass_path, "w", encoding="utf-8") as f:
            f.write(header)
            f.write("\n".join(events))
            
        logger.info(f"ASS subtitle file generated successfully: {output_ass_path}")
        return True
    except Exception as e:
        logger.error(f"Error generating ASS subtitle file: {str(e)}")
        return False
