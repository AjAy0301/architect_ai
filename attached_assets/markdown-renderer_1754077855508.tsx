import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    // First, handle tables properly
    let processedText = text;
    
    // Find and process markdown tables
    const tableRegex = /(\|.*\|[\r\n]+)+/g;
    processedText = processedText.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) return match; // Need at least header and separator
      
      let tableHTML = '<table class="border-collapse border border-gray-600 w-full mb-4 text-sm">';
      
      lines.forEach((line, index) => {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        
        if (index === 0) {
          // Header row
          const headerCells = cells.map(cell => 
            `<th class="border border-gray-600 px-3 py-2 text-gray-300 text-sm font-semibold bg-gray-800">${cell}</th>`
          ).join('');
          tableHTML += `<thead><tr>${headerCells}</tr></thead>`;
        } else if (index === 1 && line.match(/^[\s\-:|]+$/)) {
          // Separator line - skip it
          return;
        } else {
          // Data row
          const dataCells = cells.map(cell => 
            `<td class="border border-gray-600 px-3 py-2 text-gray-300 text-sm">${cell}</td>`
          ).join('');
          if (index === 1) tableHTML += '<tbody>';
          tableHTML += `<tr>${dataCells}</tr>`;
        }
      });
      
      tableHTML += '</tbody></table>';
      return tableHTML;
    });
    
    // Now process the rest of the markdown
    return processedText
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
      
      // Lists
      .replace(/^- (.*$)/gim, '<li class="text-gray-300 ml-4 mb-1">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="text-gray-300 ml-4 mb-1">$&</li>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="text-gray-300 mb-3">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph tags (but not for tables, headers, or lists)
      .replace(/^(?!<[h|p|li|table])(.*)/gim, '<p class="text-gray-300 mb-3">$1</p>')
      
      // Clean up empty paragraphs
      .replace(/<p class="text-gray-300 mb-3"><\/p>/g, '')
      .replace(/<p class="text-gray-300 mb-3"><br><\/p>/g, '');
  };

  return (
    <div 
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
} 