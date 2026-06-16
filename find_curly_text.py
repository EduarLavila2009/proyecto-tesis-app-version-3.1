import os
import re

# We want to find files containing curly braces with strings like {" "} or {' '} 
# that are children of non-Text tags (like View, ScrollView, etc.)
# Let's search for:
# <NonTextTag ...>
#    ...
#    {" "} or {' '} or similar string literals
# </NonTextTag>

# A layout tag list
layout_tags = [
    'View', 'ScrollView', 'SafeAreaView', 'TouchableOpacity', 'Pressable', 
    'PressableScale', 'Card', 'GlassmorphicCard', 'ScreenContainer', 'KeyboardAvoidingView',
    'Animated.View', 'LinearGradient', 'FlatList'
]

def search_files(directory):
    for root, dirs, files in os.walk(directory):
        if any(d in root for d in ['node_modules', '.git', '.expo', '.gemini']):
            continue
        for file in files:
            if file.endswith('.js') and file not in ['search_text_bugs.py', 'find_unwrapped_text.py', 'find_curly_text.py']:
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        code = f.read()
                    
                    # We can use a regex to look for {" "} or {' '} in the code,
                    # and print its context so we can verify if it's inside a layout tag.
                    # Commonly, they are formatted like {" "} or {' '}
                    matches = re.finditer(r'\{\s*(["\']\s*["\']|["\']\s+["\'])\s*\}', code)
                    for m in matches:
                        idx = m.start()
                        line_num = code[:idx].count('\n') + 1
                        snippet = code[max(0, idx-40):min(len(code), idx+40)].replace('\n', '\\n')
                        print(f"File: {path}:{line_num}")
                        print(f"  Snippet: ...{snippet}...")
                except Exception as e:
                    print(f"Error reading {path}: {e}")

if __name__ == "__main__":
    search_files(".")
