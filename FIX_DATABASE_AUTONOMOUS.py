import sys
sys.path.insert(0, '.')

print('=== AUTONOMOUS DATABASE FIX ===')

# Read backend/db.py
with open('backend/db.py', 'r', encoding='utf-8') as f:
    original = f.read()

print(f'Read {len(original)} bytes from backend/db.py')

# Apply replacements
modified = original.replace(
    'region = Column(Integer, default=225, index=True)',
    'region = Column(Integer, nullable=True, index=True)'
)

modified = modified.replace(
    'region = Column(Integer, default=225)',
    'region = Column(Integer, nullable=True)'
)

# Verify and save
if modified != original:
    print('✅ Changes detected')
    with open('backend/db.py', 'w', encoding='utf-8') as f:
        f.write(modified)
    print('✅ SUCCESS! backend/db.py has been fixed!')
    print('⚠️  RESTART backend to apply changes')
else:
    print('⚠️  No changes needed (already fixed)')