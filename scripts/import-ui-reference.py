"""Extract six known product mockups from the user-supplied Virtual Ink HTML.

Usage: python scripts/import-ui-reference.py (requires Pillow).
Never executes JavaScript or changes the supplied reference. WebP delivery copies
preserve dimensions and composition; the approved platform logo stays in asssets/.
"""
from pathlib import Path
from html.parser import HTMLParser
from io import BytesIO
import base64
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
NAMES = {
    'Cotton T-Shirt': 'cotton-t-shirt', 'Polo Shirt': 'polo-shirt',
    'Hoodie': 'hoodie', 'Business Cards': 'business-cards',
    'Flyers A5': 'flyers-a5', 'Roll Up Banner': 'roll-up-banner',
}


class ProductImages(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'img' and attrs.get('alt') in NAMES:
            alt = attrs['alt']
            if alt in self.images:
                raise ValueError('Duplicate product image in supplied reference')
            source = attrs.get('src', '')
            if not source.startswith('data:image/png;base64,'):
                raise ValueError('Expected embedded PNG product mockup')
            self.images[alt] = source.split(',', 1)[1]


def main():
    source = ROOT / 'virtual ink html.html'
    raw = source.read_bytes()
    if len(raw) > 60 * 1024 * 1024:
        raise ValueError('Reference exceeds import bound')
    parser = ProductImages()
    parser.feed(raw.decode('utf-8'))
    if set(parser.images) != set(NAMES):
        raise ValueError('Six named product mockups are required')
    # Validate the complete input before writing delivery copies.
    images = []
    for alt, name in NAMES.items():
        data = base64.b64decode(parser.images[alt], validate=True)
        if len(data) > 10 * 1024 * 1024:
            raise ValueError('Embedded image exceeds import bound')
        image = Image.open(BytesIO(data))
        image.verify()
        image = Image.open(BytesIO(data))
        if image.format != 'PNG' or max(image.size) > 4096:
            raise ValueError('Unexpected product image format or dimensions')
        images.append((alt, name, data, image))
    dest = ROOT / 'apps/web/public/images/products'
    dest.mkdir(parents=True, exist_ok=True)
    manifest = []
    for alt, name, data, image in images:
        target = dest / (name + '.webp')
        image.save(target, format='WEBP', quality=90, method=4)
        manifest.append({'name': name, 'alt': alt, 'dimensions': list(image.size),
                         'sourceSha256': hashlib.sha256(data).hexdigest(),
                         'webBytes': target.stat().st_size})
    record = {'source': source.name, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
              'encoding': 'WebP quality 90, same dimensions, no visual edits', 'images': manifest}
    (dest / 'provenance.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    print('Imported six supplied product mockups; source preserved.')


if __name__ == '__main__':
    main()
