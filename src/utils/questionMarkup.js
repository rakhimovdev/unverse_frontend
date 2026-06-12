import React from "react";

const MARKER_REGEX = /\[\[([^\]]+)\]\]/g;

const parseInlineStyle = (styleText) => {
    if (!styleText) return undefined;

    const style = {};
    styleText.split(";").forEach((chunk) => {
        const [rawKey, rawValue] = chunk.split(":");
        if (!rawKey || !rawValue) return;

        const key = rawKey
            .trim()
            .toLowerCase()
            .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
        const value = rawValue.trim();

        if (key) {
            style[key] = value;
        }
    });

    return style;
};

const mapAttributesToProps = (attributes) => {
    const props = {};

    Array.from(attributes || []).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name === "class") {
            props.className = value;
            return;
        }

        if (name === "for") {
            props.htmlFor = value;
            return;
        }

        if (name === "style") {
            const style = parseInlineStyle(value);
            if (style && Object.keys(style).length) {
                props.style = style;
            }
            return;
        }

        if (name === "colspan") {
            props.colSpan = Number(value) || value;
            return;
        }

        if (name === "rowspan") {
            props.rowSpan = Number(value) || value;
            return;
        }

        props[name] = value;
    });

    return props;
};

const VOID_TAGS = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);

export const normalizeInlineTokens = (html) => {
    if (!html || typeof window === "undefined" || !window.DOMParser) {
        return html || "";
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
        const wrapper = doc.body.firstChild;

        if (!wrapper) return html;

        const tokenOnlyRegex = /^\s*(\[\[[^\]]+\]\]\s*)+$/;
        const isEmptyText = (node) =>
            node && node.nodeType === 3 && !node.textContent.trim();

        let node = wrapper.firstChild;

        while (node) {
            const nextNode = node.nextSibling;
            let text = "";

            if (node.nodeType === 3 || node.nodeType === 1) {
                text = node.textContent || "";
            }

            const cleaned = text.replace(/\u00a0/g, " ").trim();

            if (cleaned && tokenOnlyRegex.test(cleaned)) {
                let prev = node.previousSibling;

                while (
                    prev &&
                    (isEmptyText(prev) ||
                        (prev.nodeType === 1 && !prev.textContent.trim()))
                ) {
                    prev = prev.previousSibling;
                }

                if (prev && prev.nodeType === 1) {
                    prev.append(doc.createTextNode(` ${cleaned}`));
                    wrapper.removeChild(node);
                }
            }

            node = nextNode;
        }

        return wrapper.innerHTML;
    } catch (err) {
        return html;
    }
};

export const renderHtmlWithQuestionTokens = ({
    html,
    parseToken,
    renderToken,
    rootKey = "root",
}) => {
    const normalizedHtml = normalizeInlineTokens(html || "");

    if (!normalizedHtml) return null;

    if (typeof window === "undefined" || !window.DOMParser) {
        return <span dangerouslySetInnerHTML={{ __html: normalizedHtml }} />;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(
            `<div>${normalizedHtml}</div>`,
            "text/html"
        );
        const root = doc.body.firstChild;

        if (!root) return null;

        let questionIndex = 0;

        const renderNode = (node, key) => {
            if (node.nodeType === 3) {
                const text = node.textContent || "";
                if (!text) return null;

                const regex = new RegExp(MARKER_REGEX);
                const parts = [];
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(text))) {
                    if (match.index > lastIndex) {
                        parts.push(text.slice(lastIndex, match.index));
                    }

                    const parsed = parseToken(match[1]);

                    if (!parsed) {
                        parts.push(match[0]);
                    } else {
                        const currentIndex = questionIndex;
                        parts.push(
                            renderToken({
                                parsed,
                                currentIndex,
                                key: `${key}-t-${currentIndex}`,
                                rawToken: match[1],
                            })
                        );
                        questionIndex++;
                    }

                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < text.length) {
                    parts.push(text.slice(lastIndex));
                }

                return parts.filter((part) => part != null);
            }

            if (node.nodeType === 1) {
                const tag = node.tagName.toLowerCase();
                const props = mapAttributesToProps(node.attributes);

                if (VOID_TAGS.has(tag)) {
                    return React.createElement(tag, { ...props, key });
                }

                const children = [];

                node.childNodes.forEach((child, idx) => {
                    const rendered = renderNode(child, `${key}-${idx}`);

                    if (Array.isArray(rendered)) {
                        children.push(...rendered);
                    } else if (rendered != null) {
                        children.push(rendered);
                    }
                });

                return React.createElement(tag, { ...props, key }, children);
            }

            return null;
        };

        return Array.from(root.childNodes)
            .flatMap((child, idx) => {
                const rendered = renderNode(child, `${rootKey}-${idx}`);
                if (Array.isArray(rendered)) return rendered;
                return rendered != null ? [rendered] : [];
            })
            .filter(Boolean);
    } catch (err) {
        return <span dangerouslySetInnerHTML={{ __html: normalizedHtml }} />;
    }
};
