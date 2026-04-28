from PIL import Image
from collections import Counter

img = Image.open('kamilart_logo1.png')
w, h = img.size
print('size', w, h)
coords = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1), (w//2, h//2)]
for x, y in coords:
    print(x, y, img.getpixel((x, y)))

colors = []
for x in range(0, 10):
    for y in range(0, 10):
        colors.append(img.getpixel((x, y)))
for x in range(w-10, w):
    for y in range(h-10, h):
        colors.append(img.getpixel((x, y)))
print('most common', Counter(colors).most_common(10))
