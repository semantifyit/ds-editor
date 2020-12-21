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
}

module.exports = Util;
