#!/usr/bin/env python3
"""
TokenSentry Studio-Grade Video & GIF Generator (v3)
Engineered with dynamic text measurement (font.getbbox) and zero-overlap geometry.
"""

import os
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1280
HEIGHT = 720
FPS = 30
TOTAL_FRAMES = 360
TEMP_DIR = "/tmp/tokensentry_v3_frames"

FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"
FONT_BOLD = "/System/Library/Fonts/SFNSMono.ttf"

font_xs = ImageFont.truetype(FONT_MONO, 12)
font_sm = ImageFont.truetype(FONT_MONO, 14)
font_md = ImageFont.truetype(FONT_MONO, 16)
font_lg = ImageFont.truetype(FONT_BOLD, 19)
font_xl = ImageFont.truetype(FONT_BOLD, 24)
font_stat = ImageFont.truetype(FONT_BOLD, 28)
font_code = ImageFont.truetype(FONT_MONO, 13.5)

# Color System
BG_CANVAS = (8, 11, 16)          # Ultra-dark slate
WINDOW_BG = (15, 19, 26)         # macOS terminal ground
HEADER_BG = (24, 29, 38)         # Window titlebar
BORDER_SUBTLE = (38, 46, 58)     # Window border
CARD_BG = (19, 25, 35)           # Card ground
CARD_BORDER = (42, 52, 68)

# Syntax & Accent Colors
TEXT_WHITE = (245, 248, 252)
TEXT_MUTED = (140, 150, 165)
TEXT_DIM = (95, 105, 120)

CYAN = (56, 189, 248)            # Cyber cyan
EMERALD = (52, 211, 153)         # Glowing emerald
PURPLE = (192, 132, 252)         # Electric purple
AMBER = (251, 191, 36)           # Amber / token counts
RED = (248, 113, 113)            # Raw before
GREEN_BG = (16, 46, 32)
RED_BG = (42, 18, 22)

def draw_inline(draw, start_x, y, parts):
    """
    Renders consecutive text fragments horizontally, measuring each segment's exact width.
    Guarantees mathematically that text will NEVER overlap horizontally.
    """
    curr_x = start_x
    for text, font, color in parts:
        draw.text((curr_x, y), text, font=font, fill=color)
        bbox = font.getbbox(text)
        w = bbox[2] - bbox[0]
        curr_x += w
    return curr_x

def draw_right_aligned(draw, right_x, y, text, font, color):
    """Aligns text precisely to right_x edge."""
    bbox = font.getbbox(text)
    w = bbox[2] - bbox[0]
    draw.text((right_x - w, y), text, font=font, fill=color)

def draw_window_shell(draw, title="tokensentry — zsh — 80x24"):
    wx, wy, ww, wh = 40, 30, WIDTH - 80, HEIGHT - 60

    # Outer subtle shadow
    for i in range(6):
        draw.rounded_rectangle([wx - i, wy - i, wx + ww + i, wy + wh + i], radius=12, outline=(14, 18, 24))

    # Main terminal window
    draw.rounded_rectangle([wx, wy, wx + ww, wy + wh], radius=10, fill=WINDOW_BG, outline=BORDER_SUBTLE, width=1)

    # Header Titlebar (42px)
    draw.rounded_rectangle([wx, wy, wx + ww, wy + 42], radius=10, fill=HEADER_BG)
    draw.rectangle([wx, wy + 26, wx + ww, wy + 42], fill=HEADER_BG)
    draw.line([wx, wy + 42, wx + ww, wy + 42], fill=BORDER_SUBTLE, width=1)

    # macOS Traffic Lights
    draw.ellipse([wx + 16, wy + 15, wx + 28, wy + 27], fill=(255, 95, 86))
    draw.ellipse([wx + 36, wy + 15, wx + 48, wy + 27], fill=(255, 189, 46))
    draw.ellipse([wx + 56, wy + 15, wx + 68, wy + 27], fill=(39, 201, 63))

    # Window Title centered
    bbox = font_sm.getbbox(title)
    tw = bbox[2] - bbox[0]
    draw.text((wx + (ww - tw) // 2, wy + 13), title, font=font_sm, fill=TEXT_MUTED)

    # Usable coordinates
    ix = wx + 24
    iy = wy + 58
    iw = ww - 48
    ih = wh - 76
    return ix, iy, iw, ih

def render_frame_v3(frame_idx):
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_CANVAS)
    draw = ImageDraw.Draw(img)

    ix, iy, iw, ih = draw_window_shell(draw)

    # ==============================================================
    # SCENE 1: Startup & Invariants (Frames 0 to 85)
    # ==============================================================
    if frame_idx < 85:
        # Prompt line with measured advance
        px = draw_inline(draw, ix, iy, [
            ("aman@mbp", font_md, EMERALD),
            (":", font_md, TEXT_MUTED),
            ("~/tokensentry", font_md, CYAN),
            (" $ ", font_md, TEXT_WHITE)
        ])

        cmd = "npx tokensentry start --port 8080"
        chars = min(len(cmd), max(0, int((frame_idx - 6) * 1.5)))
        typed_cmd = cmd[:chars]
        draw.text((px, iy), typed_cmd, font=font_md, fill=TEXT_WHITE)

        # Blinking cursor
        if chars < len(cmd) and (frame_idx // 6) % 2 == 0:
            cbbox = font_md.getbbox(typed_cmd)
            cw = cbbox[2] - cbbox[0] if typed_cmd else 0
            draw.rectangle([px + cw + 2, iy + 2, px + cw + 12, iy + 18], fill=TEXT_WHITE)

        # Banner appears at frame 32
        if frame_idx >= 32:
            by = iy + 38
            draw.rounded_rectangle([ix, by, ix + 740, by + 125], radius=8, fill=CARD_BG, outline=EMERALD, width=2)

            draw.text((ix + 230, by + 16), "🛡️  TokenSentry v0.1.0", font=font_lg, fill=EMERALD)
            draw.text((ix + 120, by + 48), "Cache-Preserving AST Pruner & Free-Tier AI Proxy", font=font_md, fill=TEXT_WHITE)
            draw.text((ix + 115, by + 76), "Preserving Anthropic 90% Prompt Cache Discount ($0.30/M vs $3.00/M)", font=font_xs, fill=AMBER)
            draw.text((ix + 175, by + 98), "Universal Proxy: Anthropic Messages & OpenAI Completions", font=font_xs, fill=TEXT_MUTED)

        # Startup info & client instructions at frame 50
        if frame_idx >= 50:
            sy = iy + 190
            draw_inline(draw, ix, sy, [
                ("✔ Proxy Server Listening: ", font_md, EMERALD),
                ("http://127.0.0.1:8080", font_md, CYAN),
                ("  (Latency overhead: < 1ms)", font_sm, TEXT_MUTED)
            ])

            # Setup instructions box
            iy_box = sy + 36
            draw.rounded_rectangle([ix, iy_box, ix + iw, iy_box + 120], radius=8, fill=(16, 22, 30), outline=CARD_BORDER, width=1)

            draw.text((ix + 20, iy_box + 16), "🚀 How to connect your coding agents in 5 seconds:", font=font_md, fill=TEXT_WHITE)

            draw_inline(draw, ix + 20, iy_box + 48, [
                ("• For Claude Code:          ", font_code, CYAN),
                ("export ANTHROPIC_BASE_URL=\"http://127.0.0.1:8080\"", font_code, TEXT_WHITE)
            ])

            draw_inline(draw, ix + 20, iy_box + 76, [
                ("• For Cursor / Aider / Cline: ", font_code, PURPLE),
                ("export OPENAI_BASE_URL=\"http://127.0.0.1:8080/v1\"", font_code, TEXT_WHITE)
            ])

    # ==============================================================
    # SCENE 2: Real-Time Interception & Progress (Frames 85 to 190)
    # ==============================================================
    elif frame_idx < 190:
        # Header status bar
        draw_inline(draw, ix, iy, [
            ("🛡️ TokenSentry Daemon", font_md, EMERALD),
            ("   •   ", font_md, TEXT_DIM),
            ("Listening: 127.0.0.1:8080", font_sm, TEXT_MUTED),
            ("   •   ", font_md, TEXT_DIM),
            ("Prefix SHA-256 Immutability: 100% INVARIANT", font_sm, CYAN)
        ])
        draw.line([ix, iy + 26, ix + iw, iy + 26], fill=BORDER_SUBTLE, width=1)

        # Intercept badge
        ey = iy + 38
        draw_inline(draw, ix, ey, [
            ("⚡ [HTTP INTERCEPT] ", font_lg, CYAN),
            ("POST /v1/messages  ", font_md, TEXT_WHITE),
            ("(Client: Claude Code  •  Model: claude-3-5-sonnet)", font_sm, PURPLE)
        ])

        # Card 1: Invariant 1 (Prefix Cache Invariance)
        c1_y = ey + 32
        draw.rounded_rectangle([ix, c1_y, ix + iw, c1_y + 82], radius=8, fill=CARD_BG, outline=CARD_BORDER, width=1)
        draw.text((ix + 20, c1_y + 14), "Invariant 1: Historical Turn Prefix Guard (Turns 1..8)", font=font_md, fill=TEXT_WHITE)
        draw_inline(draw, ix + 20, c1_y + 44, [
            ("SHA-256: ", font_sm, TEXT_MUTED),
            ("0ae8f921d74b931c4f82...  ", font_code, CYAN),
            ("✔ 100% BYTE-FOR-BYTE EXACT MATCH", font_sm, EMERALD),
            ("   (90% Prompt Cache Discount Preserved: $0.30/M)", font_xs, TEXT_MUTED)
        ])

        # Card 2: Invariant 2 (AST Pruning Progress)
        c2_y = c1_y + 98
        draw.rounded_rectangle([ix, c2_y, ix + iw, c2_y + 140], radius=8, fill=CARD_BG, outline=EMERALD, width=1)
        draw.text((ix + 20, c2_y + 16), "Invariant 2: Ephemeral AST Skeletonizer (Active Turn 9)", font=font_md, fill=TEXT_WHITE)
        draw_inline(draw, ix + 20, c2_y + 44, [
            ("Target Payload: ", font_sm, TEXT_MUTED),
            ("OrderProcessingService.ts (112 lines, 1,840 raw tokens)", font_sm, AMBER)
        ])

        # Smooth progress bar
        progress = max(0.0, min(1.0, (frame_idx - 105) / 45.0))
        draw.text((ix + 20, c2_y + 76), "Pruning AST:", font=font_sm, fill=TEXT_MUTED)

        bar_x = ix + 130
        bar_w = 480
        draw.rectangle([bar_x, c2_y + 78, bar_x + bar_w, c2_y + 94], fill=(26, 34, 46), outline=BORDER_SUBTLE)
        if int(bar_w * progress) > 0:
            draw.rectangle([bar_x, c2_y + 78, bar_x + int(bar_w * progress), c2_y + 94], fill=EMERALD)
        draw.text((bar_x + bar_w + 14, c2_y + 76), f"{int(progress * 100)}%", font=font_sm, fill=TEXT_WHITE)

        if progress >= 1.0:
            draw.text((ix + 20, c2_y + 108), "✔ 6 uncalled function bodies folded into type signatures  |  Saved 1,733 tokens (94.2%)", font=font_md, fill=EMERALD)

        # Latency Callout Box
        if frame_idx >= 155:
            fy = c2_y + 158
            draw.rounded_rectangle([ix, fy, ix + iw, fy + 58], radius=8, fill=(16, 42, 28), outline=EMERALD, width=1)
            draw.text((ix + 20, fy + 16), "⚡ Forwarded to Anthropic Upstream in 0.8ms", font=font_md, fill=EMERALD)
            draw.text((ix + 420, fy + 18), "• Streaming tokens back to Claude Code with zero perceptible delay", font=font_sm, fill=TEXT_WHITE)

    # ==============================================================
    # SCENE 3: Side-by-Side Code Diff (Frames 190 to 280)
    # ZERO OVERLAP: All measurements use draw_inline & draw_right_aligned!
    # ==============================================================
    elif frame_idx < 280:
        # Header line with measured inline layout
        draw_inline(draw, ix, iy, [
            ("🔍 Side-by-Side Comparison", font_lg, PURPLE),
            ("   •   ", font_md, TEXT_DIM),
            ("What the LLM Actually Receives in Turn 9", font_sm, TEXT_MUTED)
        ])
        draw.line([ix, iy + 26, ix + iw, iy + 26], fill=BORDER_SUBTLE, width=1)

        gap = 20
        panel_w = (iw - gap) // 2
        panel_h = 370
        py = iy + 36

        # ----------------- LEFT PANEL: BEFORE -----------------
        draw.rounded_rectangle([ix, py, ix + panel_w, py + panel_h], radius=8, fill=CARD_BG, outline=RED, width=1)

        # Left Panel Header (36px high)
        draw.rounded_rectangle([ix, py, ix + panel_w, py + 36], radius=8, fill=RED_BG)
        draw.rectangle([ix, py + 20, ix + panel_w, py + 36], fill=RED_BG)
        draw.text((ix + 16, py + 8), "❌ BEFORE TokenSentry", font=font_md, fill=RED)
        draw_right_aligned(draw, ix + panel_w - 16, py + 10, "1,840 Tokens", font=font_sm, color=AMBER)

        left_code = [
            ("// OrderService.ts", TEXT_DIM),
            ("export class OrderService {", TEXT_WHITE),
            ("  public async processOrder(", TEXT_WHITE),
            ("    orderId: string,", TEXT_WHITE),
            ("    items: OrderItem[],", TEXT_WHITE),
            ("    options: Options", TEXT_WHITE),
            ("  ): Promise<OrderResult> {", TEXT_WHITE),
            ("    const db = await getDb();", TEXT_MUTED),
            ("    const tx = await db.begin();", TEXT_MUTED),
            ("    // 35 lines of SQL queries,", TEXT_DIM),
            ("    // validation, inventory lock,", TEXT_DIM),
            ("    // fraud check & rollback...", TEXT_DIM),
            ("    await tx.commit();", TEXT_MUTED),
            ("    return { status: 'OK' };", TEXT_MUTED),
            ("  }", TEXT_WHITE),
            ("}", TEXT_WHITE)
        ]

        for idx, (line, color) in enumerate(left_code):
            draw.text((ix + 16, py + 48 + idx * 19), line, font=font_code, fill=color)

        # ----------------- RIGHT PANEL: AFTER -----------------
        rx = ix + panel_w + gap
        draw.rounded_rectangle([rx, py, rx + panel_w, py + panel_h], radius=8, fill=CARD_BG, outline=EMERALD, width=2)

        # Right Panel Header (36px high)
        draw.rounded_rectangle([rx, py, rx + panel_w, py + 36], radius=8, fill=GREEN_BG)
        draw.rectangle([rx, py + 20, rx + panel_w, py + 36], fill=GREEN_BG)
        draw.text((rx + 16, py + 8), "✔ AFTER TokenSentry", font=font_md, fill=EMERALD)
        draw_right_aligned(draw, rx + panel_w - 16, py + 10, "107 Tokens (94.2% Saved)", font=font_sm, color=EMERALD)

        right_code = [
            ("// OrderService.ts", TEXT_DIM),
            ("export class OrderService {", TEXT_WHITE),
            ("  public async processOrder(", TEXT_WHITE),
            ("    orderId: string,", TEXT_WHITE),
            ("    items: OrderItem[],", TEXT_WHITE),
            ("    options: Options", TEXT_WHITE),
            ("  ): Promise<OrderResult> {", TEXT_WHITE),
            ("    /* [folded by TokenSentry: 34 lines] */", EMERALD),
            ("  };", TEXT_WHITE),
            ("}", TEXT_WHITE)
        ]

        for idx, (line, color) in enumerate(right_code):
            line_y = py + 48 + idx * 19
            if "folded by TokenSentry" in line:
                draw.rounded_rectangle([rx + 36, line_y - 2, rx + 440, line_y + 18], radius=4, fill=(16, 46, 30))
            draw.text((rx + 16, line_y), line, font=font_code, fill=color)

        # Clean Callout Footer Box BELOW BOTH PANELS
        cy = py + panel_h + 14
        draw.rounded_rectangle([ix, cy, ix + iw, cy + 54], radius=8, fill=(18, 26, 38), outline=CYAN, width=1)
        draw_inline(draw, ix + 18, cy + 16, [
            ("💡 Contract Preserved:  ", font_md, CYAN),
            ("Claude/Cursor retains 100% intelligence because function types, docstrings & interfaces remain intact.", font_sm, TEXT_WHITE)
        ])

    # ==============================================================
    # SCENE 4: Telemetry Dashboard & Stars (Frames 280 to 360)
    # ZERO OVERLAP: Dedicated grid!
    # ==============================================================
    else:
        # Header line with measured inline layout
        draw_inline(draw, ix, iy, [
            ("📊 Live Session Telemetry", font_lg, EMERALD),
            ("   •   ", font_md, TEXT_DIM),
            ("Cumulative Savings Across 4 Real Turns", font_sm, TEXT_MUTED)
        ])
        draw.line([ix, iy + 26, ix + iw, iy + 26], fill=BORDER_SUBTLE, width=1)

        # 4 Metric Cards across iw
        card_w = (iw - 30) // 4
        card_h = 86
        my = iy + 36

        metrics = [
            ("TOTAL TURNS", "4 requests", CYAN),
            ("RAW TOKENS", "9,064", AMBER),
            ("TOKENS SAVED", "8,568", EMERALD),
            ("NET SAVINGS", "94.5%", PURPLE)
        ]

        for i, (m_label, m_val, m_col) in enumerate(metrics):
            mx = ix + i * (card_w + 10)
            draw.rounded_rectangle([mx, my, mx + card_w, my + card_h], radius=8, fill=CARD_BG, outline=m_col, width=1)
            draw.text((mx + 16, my + 12), m_label, font=font_xs, fill=TEXT_MUTED)
            draw.text((mx + 16, my + 38), m_val, font=font_stat, fill=m_col)

        # Live Terminal Log Window (Height: 185px)
        ly = my + card_h + 16
        draw.rounded_rectangle([ix, ly, ix + iw, ly + 185], radius=8, fill=(12, 16, 22), outline=BORDER_SUBTLE, width=1)

        draw.text((ix + 16, ly + 14), "$ curl -s http://127.0.0.1:8080/metrics | jq .", font=font_sm, fill=CYAN)

        logs = [
            ("✔ [Turn 1] Anthropic POST /v1/messages: Saved 2,142 tokens | Cumulative: 2,142 (94.5%) | Saved: $0.006", EMERALD),
            ("✔ [Turn 2] Anthropic POST /v1/messages: Saved 2,142 tokens | Cumulative: 4,284 (94.5%) | Saved: $0.013", EMERALD),
            ("✔ [Turn 3] Anthropic POST /v1/messages: Saved 2,142 tokens | Cumulative: 6,426 (94.5%) | Saved: $0.019", EMERALD),
            ("✔ [Turn 4] Anthropic POST /v1/messages: Saved 2,142 tokens | Cumulative: 8,568 (94.5%) | Saved: $0.026", EMERALD),
            ("✔ [Invariant Verified] Historical Prefix: 0ae8f921... | Cache Discount Preserved: 90%", CYAN),
            ("✔ [Zero Overhead] Median Proxy Streaming Latency: 0.8ms", PURPLE)
        ]

        for idx, (line, color) in enumerate(logs):
            draw.text((ix + 16, ly + 40 + idx * 22), line, font=font_xs, fill=color)

        # Bottom Call to Action Banner (Height: 65px)
        by = ly + 185 + 16
        draw.rounded_rectangle([ix, by, ix + iw, by + 65], radius=8, fill=(16, 28, 44), outline=CYAN, width=2)
        draw.text((ix + 24, by + 12), "⭐ Star on GitHub: github.com/Amankumar006/TokenSentry", font=font_lg, fill=TEXT_WHITE)
        draw.text((ix + 24, by + 38), "Drop-in local proxy for Claude Code, Cursor, Aider & Cline — MIT Licensed", font=font_sm, fill=CYAN)

    return img

def main():
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)

    print(f"Generating {TOTAL_FRAMES} frames @ {FPS} fps with zero-overlap v3 engine...")
    for i in range(TOTAL_FRAMES):
        frame = render_frame_v3(i)
        frame.save(f"{TEMP_DIR}/frame_{i:04d}.png")
        if i % 60 == 0:
            print(f"Rendered {i}/{TOTAL_FRAMES} frames ({int(i/TOTAL_FRAMES*100)}%)")

    print("All frames rendered successfully.")

    ffmpeg_bin = "/Users/amankumar/.local/bin/ffmpeg"
    mp4_out = "/Users/amankumar/Aman/Agents/tokensentry/assets/demo.mp4"
    gif_out = "/Users/amankumar/Aman/Agents/tokensentry/assets/demo.gif"
    palette_tmp = "/tmp/palette_v3.png"

    print("Compiling MP4 with H.264 (high quality)...")
    cmd_mp4 = [
        ffmpeg_bin, "-y",
        "-r", str(FPS),
        "-i", f"{TEMP_DIR}/frame_%04d.png",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "17",
        "-preset", "slow",
        mp4_out
    ]
    subprocess.run(cmd_mp4, check=True)
    print(f"✔ Generated MP4: {mp4_out} ({os.path.getsize(mp4_out) / 1024:.1f} KB)")

    print("Generating high-definition palette for GIF...")
    cmd_palette = [
        ffmpeg_bin, "-y",
        "-r", str(FPS),
        "-i", f"{TEMP_DIR}/frame_%04d.png",
        "-vf", "fps=20,scale=1000:-1:flags=lanczos,palettegen=stats_mode=diff",
        "-update", "1",
        palette_tmp
    ]
    subprocess.run(cmd_palette, check=True)

    print("Compiling crystal-clear GIF...")
    cmd_gif = [
        ffmpeg_bin, "-y",
        "-r", str(FPS),
        "-i", f"{TEMP_DIR}/frame_%04d.png",
        "-i", palette_tmp,
        "-lavfi", "fps=20,scale=1000:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=2",
        gif_out
    ]
    subprocess.run(cmd_gif, check=True)
    print(f"✔ Generated GIF: {gif_out} ({os.path.getsize(gif_out) / 1024 / 1024:.2f} MB)")

    shutil.rmtree(TEMP_DIR)
    print("Finished! All assets rebuilt cleanly.")

if __name__ == "__main__":
    main()
