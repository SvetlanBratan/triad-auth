
import React from 'react';

interface FormattedTextRendererProps {
    text: string;
}

const FormattedTextRenderer: React.FC<FormattedTextRendererProps> = ({ text }) => {
    if (!text) {
        return <p className="whitespace-pre-wrap">{text}</p>;
    }
    // Regex to capture all supported formats
    const regex = /(\'''(.*?)'''|''(.*?)''|\*(.*?)\*|<s>(.*?)<\/s>|<u>(.*?)<\/u>|<br\s*\/?>)/g;

    const parts = text.split(regex);

    const rendered = parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith("'''") && part.endsWith("'''")) {
            return <strong key={index}>{part.slice(3, -3)}</strong>;
        }
        if (part.startsWith("''") && part.endsWith("''")) {
            return <em key={index}>{part.slice(2, -2)}</em>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={index}>{part.slice(1, -1)}</strong>;
        }
        if (part.startsWith('<s>') && part.endsWith('</s>')) {
            return <s key={index}>{part.slice(3, -4)}</s>;
        }
        if (part.startsWith('<u>') && part.endsWith('</u>')) {
            return <u key={index}>{part.slice(3, -4)}</u>;
        }
        if (part.match(/<br\s*\/?>/)) {
            return <br key={index} />;
        }

        // Handle text split by newlines for pre-wrap behavior
        const textParts = part.split(/(\n)/).map((textPart, textIndex) => {
            if (textPart === '\n') {
                return <br key={`${index}-br-${textIndex}`} />;
            }
            return textPart;
        });

        return <React.Fragment key={index}>{textParts}</React.Fragment>;
    });

    return <div className="whitespace-normal">{rendered}</div>;
};

export default FormattedTextRenderer;
