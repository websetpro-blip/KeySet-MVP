import json

# Read the original file
with open('backend/db.py', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original file size: {len(content)} bytes")

# Count occurrences
pattern1 = 'region = Column(Integer, default=225)'
pattern2 = 'region = Column(Integer, default=225, index=True)'

count1 = content.count(pattern1)
count2 = content.count(pattern2)

print(f"Found {count1} occurrences of: {pattern1}")
print(f"Found {count2} occurrences of: {pattern2}")

# Perform replacements
content = content.replace(pattern1, 'region = Column(Integer, nullable=True)')
content = content.replace(pattern2, 'region = Column(Integer, nullable=True, index=True)')

# Save the modified file
with open('backend/db.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ SUCCESS! Database schema fixed.")
print("⚠️  Please restart backend to apply changes.")