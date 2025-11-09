import json
import urllib.request

API_BASE = 'https://conversion-america-performs-clearing.trycloudflare.com'
TOKEN = '440fe2cbccc940ad840ce22e0d0b26af'

print('Step 1: Reading backend/db.py...')
url = f'{API_BASE}/dev/read_file?path=backend/db.py&token={TOKEN}'
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read())

content = data['content']
print(f'Read {len(content)} bytes')

# Apply replacements
modified = content.replace(
    'region = Column(Integer, default=225, index=True)',
    'region = Column(Integer, nullable=True, index=True)'
)
modified = modified.replace(
    'region = Column(Integer, default=225)',
    'region = Column(Integer, nullable=True)'
)

if modified != content:
    print('Changes detected, saving...')
    # Save using Dev API
    import urllib.parse
    encoded = urllib.parse.quote(modified)
    save_url = f'{API_BASE}/dev/save_file_get?path=backend/db.py&content={encoded}&token={TOKEN}'
    with urllib.request.urlopen(save_url) as response:
        result = json.loads(response.read())
        if result.get('status') == 'saved':
            print('SUCCESS! Database schema fixed!')
            print('IMPORTANT: Restart backend to apply changes')
        else:
            print(f'Error: {result}')
else:
    print('No changes needed (already fixed)')