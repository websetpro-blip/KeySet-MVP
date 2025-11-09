import sys
sys.path.insert(0, '..')

# Read original file
with open('../backend/db.py', 'r', encoding='utf-8') as f:
    content = f.read()

print('📖 Read backend/db.py:', len(content), 'bytes')

# Apply fixes - ORDER MATTERS!
original = content

# Fix 1: FrequencyResult.region (longer pattern first)
content = content.replace(
    'region = Column(Integer, default=225, index=True)',
    'region = Column(Integer, nullable=True, index=True)'
)

# Fix 2: Task.region
content = content.replace(
    'region = Column(Integer, default=225)',
    'region = Column(Integer, nullable=True)'
)

if content != original:
    print('✅ Changes applied')
    # Save
    with open('../backend/db.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('✅ SUCCESS! backend/db.py has been fixed!')
    print('⚠️  RESTART backend to apply changes')
else:
    print('ℹ️  No changes needed (already fixed)')