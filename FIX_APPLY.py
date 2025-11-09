import urllib.request
import urllib.parse
import json

API_BASE = 'https://conversion-america-performs-clearing.trycloudflare.com'
TOKEN = '440fe2cbccc940ad840ce22e0d0b26af'

# Step 1: Read current file
print('Reading backend/db.py...')
url = f'{API_BASE}/dev/read_file?path=backend/db.py&token={TOKEN}'
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read())
content = data['content']
print(f'Read {len(content)} bytes')

# Step 2: Apply fixes
modified = content.replace(
    'region = Column(Integer, default=225, index=True)',
    'region = Column(Integer, nullable=True, index=True)'
)
modified = modified.replace(
    'region = Column(Integer, default=225)',
    'region = Column(Integer, nullable=True)'
)

if modified != content:
    print('Changes detected. Saving...')
    encoded = urllib.parse.quote(modified)
    save_url = f'{API_BASE}/dev/save_file_get?path=backend/db.py&content={encoded}&token={TOKEN}'
    with urllib.request.urlopen(save_url) as response:
        result = json.loads(response.read())
        if result.get('status') == 'saved':
            print('\n=== SUCCESS! ===')
            print('Database schema fixed!')
            print('Region columns are now nullable.')
            print('\nIMPORTANT: Restart backend to apply changes:')
            print('  .\\scripts\\start_comet_bridge.ps1')
        else:
            print(f'ERROR: {result}')
else:
    print('No changes needed (already fixed)')