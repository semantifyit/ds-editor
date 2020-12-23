class Util {
    /**
     * Removes 'schema:', 'http://schema.org/' & 'https://schema.org/'.
     *
     * @param {string} iri - The IRI that should pretty-printed.
     * @returns {string} The pretty-printed IRI.
     */
    static prettyPrintIri(iri) {
        return iri.replace(/^(schema:|https?:\/\/schema.org\/)(.+)/, '$2');
    }

    /**
     * @param {string} html representing a single element
     * @return {Element}
     */
    static htmlToElement(html) {
        const template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

}

module.exports = Util;
