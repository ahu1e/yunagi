"""Regenerate the extension's existing 夕 brand mark (development only: Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[1]
font_path = Path('C:/Windows/Fonts/msyh.ttc')
if not font_path.exists():
    raise SystemExit('Pass a CJK font by editing font_path; release PNGs are already included.')
size = 512
image = Image.new('RGBA', (size,size), (0,0,0,0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((8,8,504,504),radius=120,fill='#16191d',outline='#5d6268',width=4)
font = ImageFont.truetype(str(font_path),330)
draw.text((256,247),'夕',font=font,anchor='mm',fill='#f3eee3',stroke_width=0)
for px in (16,32,48,128):
    image.resize((px,px),Image.Resampling.LANCZOS).save(root/'assets'/f'icon-{px}.png')
