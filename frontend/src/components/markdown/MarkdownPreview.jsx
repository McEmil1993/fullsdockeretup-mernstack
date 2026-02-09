import { useEffect, useRef } from 'react'
import { marked } from 'marked'

const MarkdownPreview = ({ content, className = '' }) => {
  const iframeRef = useRef(null)
  
  useEffect(() => {
    if (!iframeRef.current) return
    
    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    
    // Convert markdown to HTML
    const contentHTML = marked(content || '*Preview will appear here...*', {
      gfm: true,
      breaks: true,
      headerIds: true,
      mangle: false
    })
    
    // Build full HTML page with StackEdit CSS
    const html = `<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <link rel="stylesheet" href="https://stackedit.io/style.css" />
</head>

<body class="stackedit">
  <div class="stackedit__html">${contentHTML}</div>
</body>

<style>
/* Manual Syntax Highlighting - Darker Colors */
.language-bash .token.function { color: #2196F3; font-weight: 600; }
.language-bash .token.keyword { color: #9C27B0; font-weight: 600; }
.language-bash .token.string { color: #FF5722; font-weight: 500; }
.language-bash .token.comment { color: #4CAF50; font-style: italic; }
.language-bash .token.operator { color: #607D8B; }
.language-bash .token.variable { color: #00BCD4; font-weight: 500; }
.language-bash .token.punctuation { color: #607D8B; }
.language-bash .token.number { color: #8BC34A; font-weight: 500; }

.language-javascript .token.keyword { color: #2196F3; font-weight: 600; }
.language-javascript .token.function { color: #FF9800; font-weight: 600; }
.language-javascript .token.string { color: #FF5722; font-weight: 500; }
.language-javascript .token.number { color: #8BC34A; font-weight: 500; }
.language-javascript .token.comment { color: #4CAF50; font-style: italic; }
.language-javascript .token.operator { color: #607D8B; }
.language-javascript .token.punctuation { color: #607D8B; }

.language-python .token.keyword { color: #2196F3; font-weight: 600; }
.language-python .token.function { color: #FF9800; font-weight: 600; }
.language-python .token.string { color: #FF5722; font-weight: 500; }
.language-python .token.number { color: #8BC34A; font-weight: 500; }
.language-python .token.comment { color: #4CAF50; font-style: italic; }
.language-python .token.builtin { color: #00BCD4; font-weight: 500; }

.language-php .token.keyword { color: #2196F3; font-weight: 600; }
.language-php .token.function { color: #FF9800; font-weight: 600; }
.language-php .token.string { color: #FF5722; font-weight: 500; }
.language-php .token.variable { color: #00BCD4; font-weight: 500; }
.language-php .token.comment { color: #4CAF50; font-style: italic; }

.language-java .token.keyword { color: #2196F3; font-weight: 600; }
.language-java .token.class-name { color: #00BCD4; font-weight: 600; }
.language-java .token.function { color: #FF9800; font-weight: 600; }
.language-java .token.string { color: #FF5722; font-weight: 500; }
.language-java .token.annotation { color: #9C27B0; font-weight: 500; }

.language-html .token.tag { color: #2196F3; font-weight: 600; }
.language-html .token.attr-name { color: #00BCD4; font-weight: 500; }
.language-html .token.attr-value { color: #FF5722; font-weight: 500; }
.language-html .token.punctuation { color: #607D8B; }

.language-css .token.selector { color: #FF9800; font-weight: 600; }
.language-css .token.property { color: #00BCD4; font-weight: 500; }
.language-css .token.string { color: #FF5722; font-weight: 500; }
.language-css .token.function { color: #9C27B0; font-weight: 600; }

.language-json .token.property { color: #00BCD4; font-weight: 500; }
.language-json .token.string { color: #FF5722; font-weight: 500; }
.language-json .token.number { color: #8BC34A; font-weight: 500; }
.language-json .token.boolean { color: #2196F3; font-weight: 600; }

.language-sql .token.keyword { color: #2196F3; font-weight: 600; }
.language-sql .token.function { color: #FF9800; font-weight: 600; }
.language-sql .token.string { color: #FF5722; font-weight: 500; }
.language-sql .token.number { color: #8BC34A; font-weight: 500; }

.language-nginx .token.keyword { color: #2196F3; font-weight: 600; }
.language-nginx .token.function { color: #FF9800; font-weight: 600; }
.language-nginx .token.string { color: #FF5722; font-weight: 500; }
.language-nginx .token.number { color: #8BC34A; font-weight: 500; }
.language-nginx .token.variable { color: #00BCD4; font-weight: 500; }

.language-yaml .token.keyword { color: #2196F3; font-weight: 600; }
.language-yaml .token.property { color: #00BCD4; font-weight: 500; }
.language-yaml .token.string { color: #FF5722; font-weight: 500; }
.language-yaml .token.number { color: #8BC34A; font-weight: 500; }
.language-yaml .token.boolean { color: #9C27B0; font-weight: 600; }

.language-docker .token.keyword { color: #2196F3; font-weight: 600; }
.language-docker .token.function { color: #FF9800; font-weight: 600; }
.language-docker .token.string { color: #FF5722; font-weight: 500; }
.language-docker .token.number { color: #8BC34A; font-weight: 500; }

.language-dockerfile .token.keyword { color: #2196F3; font-weight: 600; }
.language-dockerfile .token.function { color: #FF9800; font-weight: 600; }
.language-dockerfile .token.string { color: #FF5722; font-weight: 500; }
.language-dockerfile .token.number { color: #8BC34A; font-weight: 500; }

.language-markdown .token.keyword { color: #2196F3; font-weight: 600; }
.language-markdown .token.string { color: #FF5722; font-weight: 500; }

/* Copy button styling */
.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #2b2b2b;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.8em;
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.1s;
}

.copy-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

.copy-btn:active {
  transform: scale(0.95);
}

/* Ensure pre blocks are positioned relative */
pre {
  position: relative;
}
</style>

<script>
// Simple syntax highlighter
function highlightCode(code, language) {
  if (!language) return code;
  
  let highlighted = code;
  
  // Common keywords for different languages
  const keywords = {
    bash: ['sudo', 'apt', 'apt-get', 'yum', 'dnf', 'pacman', 'install', 'remove', 'update', 'upgrade', 'if', 'then', 'else', 'elif', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'echo', 'printf', 'cd', 'ls', 'pwd', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'touch', 'cat', 'grep', 'sed', 'awk', 'find', 'chmod', 'chown', 'curl', 'wget', 'tar', 'zip', 'unzip', 'export', 'source', 'systemctl', 'service', 'nginx', 'apache2', 'mysql', 'docker', 'git'],
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super', 'static', 'get', 'set', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false'],
    python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'pass', 'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'global', 'nonlocal', 'assert', 'raise', 'del', 'async', 'await', 'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'],
    php: ['echo', 'print', 'if', 'else', 'elseif', 'for', 'foreach', 'while', 'do', 'function', 'return', 'class', 'public', 'private', 'protected', 'static', 'new', 'try', 'catch', 'throw', 'namespace', 'use', 'require', 'include', 'require_once', 'include_once', 'extends', 'implements', 'interface', 'abstract', 'final', 'const', 'var', 'global', 'true', 'false', 'null'],
    java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'throws', 'static', 'final', 'void', 'int', 'String', 'boolean', 'double', 'float', 'long', 'char', 'byte', 'short', 'abstract', 'synchronized', 'volatile', 'transient', 'native', 'strictfp', 'import', 'package', 'true', 'false', 'null'],
    nginx: ['server', 'location', 'listen', 'server_name', 'root', 'index', 'proxy_pass', 'proxy_set_header', 'fastcgi_pass', 'fastcgi_param', 'include', 'if', 'return', 'rewrite', 'try_files', 'error_page', 'access_log', 'error_log', 'ssl_certificate', 'ssl_certificate_key', 'upstream', 'http', 'events', 'worker_processes', 'worker_connections'],
    yaml: ['true', 'false', 'null', 'yes', 'no', 'on', 'off'],
    json: ['true', 'false', 'null'],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DATABASE', 'DROP', 'ALTER', 'ADD', 'COLUMN', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'DEFAULT', 'AUTO_INCREMENT', 'VARCHAR', 'INT', 'TEXT', 'DATETIME', 'TIMESTAMP'],
    docker: ['FROM', 'RUN', 'CMD', 'COPY', 'ADD', 'WORKDIR', 'EXPOSE', 'ENV', 'ARG', 'ENTRYPOINT', 'VOLUME', 'USER', 'LABEL', 'HEALTHCHECK', 'SHELL'],
    markdown: [],
    html: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'script', 'style', 'meta', 'link', 'title'],
    css: ['color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'font', 'text', 'flex', 'grid'],
  };
  
  const langKeywords = keywords[language] || [];
  
  // Escape HTML
  highlighted = highlighted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Highlight strings (single and double quotes)
  highlighted = highlighted.replace(/(["'])(?:(?=(\\\\?))\\2.)*?\\1/g, '<span class="token string">$&</span>');
  
  // Highlight comments
  highlighted = highlighted.replace(/#.*/g, '<span class="token comment">$&</span>');
  highlighted = highlighted.replace(/\\/\\/.*/g, '<span class="token comment">$&</span>');
  
  // Highlight keywords
  langKeywords.forEach(keyword => {
    const regex = new RegExp('\\\\b(' + keyword + ')\\\\b', 'g');
    highlighted = highlighted.replace(regex, '<span class="token keyword">$1</span>');
  });
  
  // Highlight functions (word followed by parenthesis)
  highlighted = highlighted.replace(/\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*(?=\\()/g, '<span class="token function">$1</span>');
  
  // Highlight variables ($ prefix for bash/php)
  highlighted = highlighted.replace(/\\$[a-zA-Z_][a-zA-Z0-9_]*/g, '<span class="token variable">$&</span>');
  
  // Highlight numbers
  highlighted = highlighted.replace(/\\b\\d+\\b/g, '<span class="token number">$&</span>');
  
  return highlighted;
}

// Apply syntax highlighting to all code blocks
document.querySelectorAll('pre > code').forEach((codeBlock) => {
  let language = codeBlock.className.replace('language-', '');
  const code = codeBlock.textContent;
  
  // Handle aliases
  if (language === 'dockerfile') language = 'docker';
  if (language === 'yml') language = 'yaml';
  if (language === 'sh') language = 'bash';
  
  if (language && language !== 'code') {
    codeBlock.innerHTML = highlightCode(code, language);
  }
  
  // Add copy button
  const button = document.createElement('button');
  button.innerText = 'Copy';
  button.className = 'copy-btn';
  
  codeBlock.parentNode.style.position = 'relative';
  codeBlock.parentNode.appendChild(button);

  button.addEventListener('click', () => {
    navigator.clipboard.writeText(code.trim());
    button.innerText = 'Copied!';
    setTimeout(() => button.innerText = 'Copy', 1000);
  });
});
</script>

</html>`
    
    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()
  }, [content])
  
  return (
    <iframe
      ref={iframeRef}
      className={`w-full h-full border-0 ${className}`}
      title="Markdown Preview"
    />
  )
}

export default MarkdownPreview
