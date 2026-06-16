import os

def find_unwrapped_text(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    i = 0
    tag_stack = []
    in_tag = False
    in_curly = 0
    in_comment = False
    
    line_number = 1
    col_number = 1
    
    errors = []
    
    while i < len(code):
        char = code[i]
        
        if char == '\n':
            line_number += 1
            col_number = 1
        else:
            col_number += 1
            
        if in_curly > 0:
            if code[i:i+2] == '/*':
                in_comment = True
                i += 2
                continue
            elif in_comment and code[i:i+2] == '*/':
                in_comment = False
                i += 2
                continue
            
        if in_comment:
            i += 1
            continue
            
        if not in_tag and in_curly == 0:
            if code[i:i+2] == '</':
                in_tag = True
                j = i + 2
                while j < len(code) and code[j] != '>':
                    j += 1
                closing_tag_name = code[i+2:j].strip()
                if tag_stack and tag_stack[-1] == closing_tag_name:
                    tag_stack.pop()
                i = j + 1
                continue
            elif char == '<' and not (code[i+1].isalpha() or code[i+1] == '/'):
                pass
            elif char == '<':
                in_tag = True
                j = i + 1
                while j < len(code) and not (code[j].isspace() or code[j] in ['>', '/']):
                    j += 1
                opening_tag_name = code[i+1:j].strip()
                is_self_closing = False
                k = j
                while k < len(code) and code[k] != '>':
                    if code[k] == '/':
                        is_self_closing = True
                    k += 1
                
                if not is_self_closing and opening_tag_name:
                    tag_stack.append(opening_tag_name)
                
                i = k + 1
                in_tag = False
                continue
                
        if char == '{' and not in_tag:
            in_curly += 1
            i += 1
            continue
        elif char == '}' and not in_tag:
            in_curly = max(0, in_curly - 1)
            i += 1
            continue
            
        if not in_tag and in_curly == 0:
            if tag_stack:
                parent_tag = tag_stack[-1]
                if parent_tag not in ['Text', 'TextLink', 'TextInput', 'TextInputField', 'PasswordInput', 'TextLink', 'React.Fragment', 'Fragment']:
                    if not char.isspace() and char not in [';', ',', '{', '}']:
                        errors.append((line_number, col_number, parent_tag, char, code[max(0, i-20):min(len(code), i+20)]))
        
        i += 1

    return errors

if __name__ == "__main__":
    count = 0
    for root, dirs, files in os.walk("."):
        if any(d in root for d in ['node_modules', '.git', '.expo', '.gemini']):
            continue
        for file in files:
            if file.endswith('.js') and file not in ['search_text_bugs.py', 'find_unwrapped_text.py']:
                path = os.path.join(root, file)
                count += 1
                print(f"Scanning: {path}")
                try:
                    errs = find_unwrapped_text(path)
                    if errs:
                        print(f"  --> Found {len(errs)} text issues in {path}")
                        seen_lines = set()
                        for line, col, tag, char, context in errs:
                            if line not in seen_lines:
                                seen_lines.add(line)
                                context_escaped = context.replace('\n', '\\n')
                                print(f"    Line {line}: Found char '{char}' inside <{tag}>. Context: '...{context_escaped}...'")
                except Exception as e:
                    print(f"Error reading {path}: {e}")
    print(f"Total scanned: {count}")
