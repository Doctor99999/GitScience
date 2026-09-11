import urllib.request
url = 'https://europepmc.org/backend/ptpmcrender.fcgi?accid=PMC10014299&blobtype=pdf'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=12.0) as resp:
        print(f'Status: {resp.status}')
        c = resp.read(10)
        print(f'Content start: {c}')
except Exception as e:
    print(f'Error: {e}')
