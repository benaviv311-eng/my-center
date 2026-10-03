from pathlib import Path
import re

p=Path('nutrition-builder.html')
s=p.read_text(encoding='utf-8')

# Remove the retired macro-only optimizer and its helper path. The professional
# planner is the sole menu-generation engine after migration.
pattern=r'\nfunction defaultsForMissing\(list\)\{.*?\nfunction currentNutritionProfile\(\)\{'
m=re.search(pattern,s,re.S)
if m:
    s=s[:m.start()]+'\nfunction currentNutritionProfile(){'+s[m.end():]

# Remove the obsolete focused-fix helper that depended on the retired issue list.
s=re.sub(r'\nfunction showFocusedFix\(suggestions\)\{.*?\n\}\n\n</script>', '\n\n</script>', s, flags=re.S)

p.write_text(s,encoding='utf-8')
print('removed legacy nutrition optimizer')
