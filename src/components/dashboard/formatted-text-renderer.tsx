import React from 'react';

interface FormattedTextRendererProps {
    text: string;
}

const FormattedTextRenderer: React.FC<FormattedTextRendererProps> = ({ text }) => {
    if (!text) {
        return <p className="whitespace-pre-wrap">{text}</p>;
    }
    
    // Split by newlines and <br> tags to process each line
    const lines = text.split(/<br\s*\/?>|\n/);

    const processLine = (line: string): React.ReactNode => {
        // Simple, sequential replacements are safer than complex regex.
        // 1. Escape HTML to prevent injection, except for our allowed tags.
        let processedLine = line
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 2. Apply our custom formatting rules.
        processedLine = processedLine
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>')    // *bold*
            .replace(/''(.*?)''/g, '<em>$1</em>');          // ''italic''

        // 3. Re-enable our allowed HTML tags.
        processedLine = processedLine
            .replace(/&lt;s&gt;(.*?)&lt;\/s&gt;/g, '<s>$1</s>')     // <s>strikethrough</s>
            .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u>$1</u>');     // <u>underline</u>

        return <span dangerouslySetInnerHTML={{ __html: processedLine }} />;
    };

    return (
        <div className="whitespace-pre-wrap">
            {lines.map((line, index) => (
                <React.Fragment key={index}>
                    {processLine(line)}
                    {index < lines.length - 1 && <br />}
                </React.Fragment>
            ))}
        </div>
    );
};

export default FormattedTextRenderer;
