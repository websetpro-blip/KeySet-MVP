#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Fix db.py to remove hardcoded region=225 and replace with nullable=True
"""

import os

# Path to db.py
db_path = r"C:\AI\yandex\KeySet-MVP\backend\db.py"

print(f"Reading {db_path}...")
with open(db_path, "r", encoding="utf-8") as f:
    content = f.read()

print("Original file size:", len(content), "bytes")

# Count occurrences
count1 = content.count('region = Column(Integer, default=225)')
count2 = content.count('region = Column(Integer, default=225, index=True)')
print(f"Found {count1} occurrences of 'region = Column(Integer, default=225)'")
print(f"Found {count2} occurrences of 'region = Column(Integer, default=225, index=True)'")

# Perform replacements
new_content = content.replace(
    'region = Column(Integer, default=225)',
    'region = Column(Integer, nullable=True)'
)
new_content = new_content.replace(
    'region = Column(Integer, default=225, index=True)',
    'region = Column(Integer, nullable=True, index=True)'
)

# Count replacements
replaced1 = new_content.count('region = Column(Integer, nullable=True)')
replaced2 = new_content.count('region = Column(Integer, nullable=True, index=True)')
print(f"\nReplaced {replaced1} with 'region = Column(Integer, nullable=True)'")
print(f"Replaced {replaced2} with 'region = Column(Integer, nullable=True, index=True)'")

if replaced1 + replaced2 > 0:
    print(f"\nWriting changes to {db_path}...")
    with open(db_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("✓ Successfully fixed db.py! Region is now nullable.")
else:
    print("⚠ No changes were made.")