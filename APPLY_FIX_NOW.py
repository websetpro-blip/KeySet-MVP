import json
import requests

# Configuration
DEV_TOKEN = '440fe2cbccc940ad840ce22e0d0b26af'
BASE_URL = 'https://conversion-america-performs-clearing.trycloudflare.com'

print("⏳ Reading backend/db.py...")

# Read current db.py
resp = requests.get(f"{BASE_URL}/dev/read_file?path=backend/db.py&token={DEV_TOKEN}")
data = resp.json()
original = data['content']

print(f"✅ Read {len(original)} bytes")

# Apply fixes (order matters!)
modified = original.replace(
    'region = Column(Integer, default=225, index=True)',
    'region = Column(Integer, nullable=True, index=True)'
)

modified = modified.replace(
    'region = Column(Integer, default=225)',
    'region = Column(Integer, nullable=True)'
)

if modified != original:
    print("✅ Changes detected, saving...")
    
    # Save using Dev API
    import urllib.parse
    encoded_content = urllib.parse.quote(modified)
    
    save_url = f"{BASE_URL}/dev/save_file_get?path=backend/db.py&content={encoded_content}&token={DEV_TOKEN}"
    save_resp = requests.get(save_url)
    
    print(f"✅ SUCCESS! Response: {save_resp.text}")
    print("⚠️  Please restart backend to apply changes")
else:
    print("⚠️  No changes needed (already fixed?)")