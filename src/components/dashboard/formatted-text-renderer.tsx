import React from 'react';

interface FormattedTextRendererProps {
    text: string;
}

const FormattedTextRenderer: React.FC<FormattedTextRendererProps> = ({ text }) => {
    if (!text) {
        return <p className="whitespace-pre-wrap">{text}</p>;
    }

    const processLine = (line: string) => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        // Simplified regex to capture content within delimiters
        const regex = /(\'''(.*?)'''|''(.*?)''|\*(.*?)\*|<s>(.*?)<\/s>|<u>(.*?)<\/u>)/g;
        let match;

        while ((match = regex.exec(line)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(line.substring(lastIndex, match.index));
            }

            const [fullMatch, , boldContent1, italicContent, boldContent2, strikeContent, underlineContent] = match;
            
            if (boldContent1 !== undefined) {
                parts.push(<strong key={match.index}>{boldContent1}</strong>);
            } else if (italicContent !== undefined) {
                parts.push(<em key={match.index}>{italicContent}</em>);
            } else if (boldContent2 !== undefined) {
                parts.push(<strong key={match.index}>{boldContent2}</strong>);
            } else if (strikeContent !== undefined) {
                parts.push(<s key={match.index}>{strikeContent}</s>);
            } else if (underlineContent !== undefined) {
                parts.push(<u key={match.index}>{underlineContent}</u>);
            }
            
            lastIndex = match.index + fullMatch.length;
        }

        // Add any remaining text after the last match
        if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
        }

        return parts;
    };
    
    const lines = text.split(/<br\s*\/?>|\n/);

    return (
        <div className="whitespace-normal">
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
