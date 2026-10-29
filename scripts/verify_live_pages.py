import urllib.request
import re

urls = [
    'https://himnarioebp.com/hymn/1/',
    'https://himnarioebp.com/himno/1/',
    'https://himnarioebp.com/hymn/E1/',
    'https://himnarioebp.com/css/preview-page.css',
    'https://himnarioebp.com/.well-known/apple-app-site-association'
]

headers = {'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'}

for url in urls:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as res:
            content_type = res.headers.get('Content-Type', '')
            status = res.status
            data = res.read()
            print(f"[OK] {url} -> Status: {status}, Type: {content_type}, Size: {len(data)} bytes")
            if url.endswith('/1/'):
                html = data.decode('utf-8', errors='ignore')
                title = re.search(r'<title>(.*?)</title>', html)
                og_title = re.search(r'property="og:title"\s+content="([^"]+)"', html)
                og_img = re.search(r'property="og:image"\s+content="([^"]+)"', html)
                og_audio = re.search(r'property="og:audio"\s+content="([^"]+)"', html)
                apple = re.search(r'name="apple-itunes-app"\s+content="([^"]+)"', html)
                print(f"     Title: {title.group(1) if title else 'N/A'}")
                print(f"     og:title: {og_title.group(1) if og_title else 'N/A'}")
                print(f"     og:image: {og_img.group(1) if og_img else 'N/A'}")
                print(f"     og:audio: {og_audio.group(1) if og_audio else 'N/A'}")
                print(f"     apple-itunes-app: {apple.group(1) if apple else 'N/A'}")
    except Exception as e:
        print(f"[ERROR] {url} -> {e}")
