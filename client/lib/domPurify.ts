import DOMPurify from 'dompurify';

interface DomPurifyConfig {
    ADD_TAGS?: string[];
    ADD_ATTR?: string[];
    FORBID_TAGS?: string[];
    FORBID_ATTR?: string[];
}



export function sanitizeHtml(
    html: string,
    customConfig?: DomPurifyConfig
): string {
    // Merge the customConfig with the default config or use the default if no customConfig is provided
    const mergedConfig: DomPurifyConfig = {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "class"],
        FORBID_TAGS: ["script", "style", "template"],
        FORBID_ATTR: ["onerror", "onload", "style"],
        ...customConfig,
    };

    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if ('target' in node) {
            node.setAttribute('target', '_blank');
        }
    });

    const purify = DOMPurify.sanitize(html, mergedConfig);
    return purify;
}
