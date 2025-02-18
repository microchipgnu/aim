import { marked } from 'marked';

// Configure marked options for secure and consistent rendering
marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // Enable GitHub Flavored Markdown
});

// Convert markdown content to HTML before final rendering
const renderMarkdown = (content: string): string => {
    try {
        // Use marked.parse() with {async: false} to ensure sync return
        return marked.parse(content, { async: false }) as string;
    } catch (error) {
        console.error('Error rendering markdown:', error);
        return content; // Fallback to raw content if markdown parsing fails
    }
};

// Sanitize HTML content to prevent XSS while allowing safe HTML tags
const sanitizeHtml = (html: string): string => {
    // Basic XSS prevention - encode special characters except allowed HTML tags
    return html.replace(/[&<>"']/g, (match) => {
        const entities: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return entities[match];
    });
};

export const getHtmlOutput = (title: string, content: string) => `
<html>
    <head>
        <title>${sanitizeHtml(title)}</title>
        <style>
            .omit {
                display: none;
            }

            h1 {
                font-size: 1.5rem;
                font-weight: 600;
                color: rgb(30, 41, 59);
                padding-top: 0.75rem;
                padding-bottom: 0.75rem;
                margin-top: 0.75rem;
                margin-bottom: 0.75rem;
                line-height: 1.75;
            }

            h2 {
                font-size: 1.25rem;
                font-weight: 600;
                color: rgb(30, 41, 59);
                padding-top: 0.5rem;
                padding-bottom: 0.5rem;
                margin-top: 1rem;
                margin-bottom: 0.5rem;
                line-height: 1.6;
            }

            h3, h4, h5, h6 {
                font-size: 1.1rem;
                font-weight: 600;
                color: rgb(30, 41, 59);
                padding-top: 0.5rem;
                padding-bottom: 0.25rem;
                margin-top: 0.75rem;
                margin-bottom: 0.5rem;
                line-height: 1.5;
            }

            p {
                display: block;
                padding: 0.5rem 0;
                margin: 0.5rem 0;
                color: #475569;
                line-height: 1.6;
                font-size: 1rem;
            }

            ul, ol {
                margin: 0.75rem 0;
                padding-left: 1.5rem;
                color: #475569;
            }

            li {
                margin: 0.25rem 0;
                line-height: 1.6;
            }

            a {
                color: #2563eb;
                text-decoration: none;
                transition: color 0.2s ease;
            }

            a:hover {
                color: #1d4ed8;
                text-decoration: underline;
            }

            code {
                font-family: ui-monospace, monospace;
                font-size: 0.9em;
                background-color: #f1f5f9;
                padding: 0.2em 0.4em;
                border-radius: 0.25rem;
            }

            pre {
                background-color: #f8fafc;
                padding: 1rem;
                border-radius: 0.5rem;
                overflow-x: auto;
                margin: 1rem 0;
                border: 1px solid #e2e8f0;
            }

            pre code {
                background-color: transparent;
                padding: 0;
                font-size: 0.9em;
                color: #334155;
            }

            blockquote {
                border-left: 4px solid #e2e8f0;
                margin: 1rem 0;
                padding: 0.5rem 0 0.5rem 1rem;
                color: #64748b;
                font-style: italic;
            }

            hr {
                border: 0;
                border-top: 1px solid #e2e8f0;
                margin: 2rem 0;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin: 1rem 0;
            }

            th, td {
                padding: 0.75rem;
                border: 1px solid #e2e8f0;
                text-align: left;
            }

            th {
                background-color: #f8fafc;
                font-weight: 600;
            }

            ai {
                display: inline-block;
                padding: 0.75rem 1rem;
                margin: 0.5rem 0.25rem;
                border: 1px solid #60a5fa;
                border-radius: 0.375rem;
                background-color: #f0f7ff;
                color: #2563eb;
                font-weight: 500;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                transition: all 0.2s ease;
            }

            ai:hover {
                background-color: #e0f2fe;
                border-color: #3b82f6;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            if {
                display: block;
                padding: 0.75rem;
                margin: 0.5rem 0;
                border: 2px solid #60a5fa;
                border-radius: 0.375rem;
                background-color: #eff6ff;
                position: relative;
            }

            else {
                display: block;
                padding: 0.75rem;
                margin: 0.5rem 0;
                border: 1px solid #60a5fa;
                border-radius: 0.375rem;
                background-color: #f0f7ff;
                color: #2563eb;
                font-weight: 500;
            }

            loop {
                display: block;
                padding: 1rem;
                margin: 1rem 0;
                border: 2px solid #e5e7eb;
                border-radius: 0.5rem;
                background-color: #f9fafb;
                position: relative;
            }

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 1.5rem;
                width: 1.5rem;
            }

            .loading div {
                animation: spin 1s linear infinite;
                height: 1rem;
                width: 1rem;
                border-radius: 9999px;
                border-bottom: 2px solid rgb(59 130 246);
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            .animate-fadeIn {
                animation: fadeIn 0.2s ease-in;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        </style>
    </head>
    <body>
        ${renderMarkdown(content)}
    </body>
</html>
`