import React from 'react';

interface FormattedTextRendererProps {
    text: string;
}

const FormattedTextRenderer: React.FC<FormattedTextRendererProps> = ({ text }) => {
    if (!text) {
        return <p className="whitespace-pre-wrap">{text}</p>;
    }

    const processLine = (line: string): React.ReactNode[] => {
        // A simple state machine parser would be more robust, but for these simple replacements, regex is fine.
        // We do this in stages to avoid complex regex interactions.
        let processedLine = line
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
            .replace(/''(.*?)''/g, '<em>$1</em>');
            // s and u are already valid HTML tags, so they will be handled by dangerouslySetInnerHTML

        const parts: (string | React.ReactElement)[] = [];
        const splitRegex = /(<strong>.*?<\/strong>|<em>.*?<\/em>|<s>.*?<\/s>|<u>.*?<\/u>)/g;
        let lastIndex = 0;
        let match;

        while ((match = splitRegex.exec(processedLine)) !== null) {
            // Push the text before the match
            if (match.index > lastIndex) {
                parts.push(processedLine.substring(lastIndex, match.index));
            }
            // Push the matched HTML element
            parts.push(<span dangerouslySetInnerHTML={{ __html: match[0] }} />);
            lastIndex = match.index + match[0].length;
        }

        // Push any remaining text
        if (lastIndex < processedLine.length) {
            parts.push(processedLine.substring(lastIndex));
        }
        
        return parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>);
    };
    
    // Split by newlines and <br> tags
    const lines = text.split(/<br\s*\/?>|\n/);

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