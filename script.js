// Helper function to parse data URLs
function parseDataUrl(url) {
  const match = url.match(/^data:(?<mime>[^;]+)(?:;(base64))?,(?<payload>.*)$/);
  if (!match) throw new Error('Invalid data URL');
  
  const { mime, payload } = match.groups;
  const isBase64 = Boolean(match.groups.base64);
  
  let text = '';
  if (isBase64) {
    try {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      text = new TextDecoder().decode(bytes);
    } catch (e) {
      throw new Error('Failed to decode base64 payload');
    }
  } else {
    try {
      text = decodeURIComponent(payload);
    } catch (e) {
      throw new Error('Failed to decode URL-encoded payload');
    }
  }
  
  return { mime, isBase64, text };
}

// Get the markdown attachment URL from the script's dataset or default
const attachments = [
  {
    name: "input.md",
    url: "data:text/markdown;base64,aGVsbG8KIyBUaXRsZQ=="
  }
];

// Find the input.md attachment
const markdownAttachment = attachments.find(att => att.name === 'input.md');
if (!markdownAttachment) {
  console.error('No input.md attachment found');
  document.getElementById('markdown-output').textContent = 'Error: Markdown file not found.';
  throw new Error('Missing input.md attachment');
}

// Function to load and process the markdown
async function loadAndRenderMarkdown() {
  const outputElement = document.getElementById('markdown-output');
  if (!outputElement) {
    console.error('Output element #markdown-output not found');
    return;
  }

  try {
    let markdownText = '';
    
    // Handle data URLs
    if (markdownAttachment.url.startsWith('data:')) {
      const parsed = parseDataUrl(markdownAttachment.url);
      if (!parsed.mime.startsWith('text/') && !parsed.mime.includes('markdown')) {
        throw new Error(`Invalid MIME type: ${parsed.mime}`);
      }
      markdownText = parsed.text;
    } 
    // Handle HTTP(S) URLs
    else if (markdownAttachment.url.startsWith('http')) {
      const response = await fetch(markdownAttachment.url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      markdownText = await response.text();
    } 
    // Unsupported URL scheme
    else {
      throw new Error('Unsupported URL scheme');
    }

    // Convert markdown to HTML using Marked
    if (typeof marked === 'undefined') {
      throw new Error('Marked library not loaded');
    }
    
    const htmlContent = marked.parse(markdownText);
    outputElement.innerHTML = htmlContent;
  } catch (error) {
    console.error('Error processing Markdown:', error);
    outputElement.textContent = `Error: ${error.message}`;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndRenderMarkdown);
} else {
  loadAndRenderMarkdown();
}