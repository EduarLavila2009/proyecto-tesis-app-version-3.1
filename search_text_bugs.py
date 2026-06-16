import os
import re

layout_tags = [
    'View', 'ScrollView', 'SafeAreaView', 'TouchableOpacity', 'Pressable', 
    'PressableScale', 'Card', 'GlassmorphicCard', 'ScreenContainer', 'KeyboardAvoidingView',
    'Animated.View', 'LinearGradient', 'FlatList'
]

# We want to find layout tags that contain text nodes directly.
# Let's clean the JSX code of all JS expressions: `{ ... }`
# To do this safely with nesting, we can write a simple parser that removes braces and their contents.

def remove_braces_and_comments(text):
    # Remove JSX comments first
    text = re.sub(r'\{\/\*.*?\*\/\s*\}', '', text, flags=re.DOTALL)
    
    # Remove braces and everything inside them, handling nesting
    chars = []
    depth = 0
    i = 0
    while i < len(text):
        if text[i:i+2] == '{/*':
            # comment start
            j = text.find('*/}', i)
            if j != -1:
                i = j + 3
                continue
        if text[i] == '{':
            depth += 1
            i += 1
            continue
        elif text[i] == '}':
            depth = max(0, depth - 1)
            i += 1
            continue
        
        if depth == 0:
            chars.append(text[i])
        i += 1
    return "".join(chars)

def search_files(directory):
    # Regex to find: <TagName ...> [text] </TagName> or similar
    # We will search the cleaned text.
    # To find line numbers, we'll keep track of character offsets in the original text.
    for root, dirs, files in os.walk(directory):
        if any(d in root for d in ['node_modules', '.git', '.expo', '.gemini']):
            continue
        for file in files:
            if file.endswith('.js') and file != 'search_text_bugs.py':
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        original_content = f.read()
                    
                    # Let's find layouts
                    # We can use a simpler approach: check every JSX element match
                    # and check if it has children that are raw text.
                    # Let's find all tags: e.g. <View ...> or </View>
                    # A robust parser for text outside of <Text> tags:
                    # We only care about raw text inside <View ...> or other layout tags.
                    
                    cleaned_content = remove_braces_and_comments(original_content)
                    
                    # Now search for layout tags in the cleaned content
                    # We look for a layout opening tag, followed by some non-tag characters (which should not be whitespace only),
                    # followed by another opening or closing tag.
                    # If those non-tag characters contain letters/numbers, we found raw text!
                    # For example: <View> Hello <Text>
                    # Regex: <(View|ScrollView|SafeAreaView|TouchableOpacity|Pressable|PressableScale|Card|GlassmorphicCard|ScreenContainer|KeyboardAvoidingView|LinearGradient)(?:\s[^>]*)?>([^<]*?[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]+[^<]*)
                    
                    tag_pattern = re.compile(
                        r'<(' + '|'.join(layout_tags) + r')(?:\s[^>]*)?>([^<]*?[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]+[^<]*)',
                        re.MULTILINE
                    )
                    
                    for match in tag_pattern.finditer(cleaned_content):
                        tag = match.group(1)
                        text_found = match.group(2).strip()
                        # Verify it's not a self-closing tag or just spaces
                        if text_found:
                            # Let's locate this text in the original content to print the line number
                            # We search for the text snippet in the original content
                            snippet = text_found.split('\n')[0][:30].strip()
                            if snippet:
                                idx = original_content.find(snippet)
                                line_num = original_content[:idx].count('\n') + 1 if idx != -1 else 0
                                print(f"File: {path}:{line_num}")
                                print(f"  Tag: <{tag}> contains raw text: '{text_found}'")
                except Exception as e:
                    print(f"Error reading {path}: {e}")

if __name__ == "__main__":
    search_files(".")
