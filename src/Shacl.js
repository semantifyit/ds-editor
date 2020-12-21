class Shacl {
    static getDSContext() {
        return {
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "sh": "http://www.w3.org/ns/shacl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "schema": "http://schema.org/",
            "ds": "http://vocab.sti2.at/ds/",
            "ds:usedVocabularies": {
                "@id": "ds:usedVocabularies",
                "@type": "@id"
            },
            "sh:targetClass": {
                "@id": "sh:targetClass",
                "@type": "@id"
            },
            "sh:property": {
                "@id": "sh:property"
            },
            "sh:path": {
                "@id": "sh:path",
                "@type": "@id"
            },
            "sh:datatype": {
                "@id": "sh:datatype",
                "@type": "@id"
            },
            "sh:node": {
                "@id": "sh:node"
            },
            "sh:class": {
                "@id": "sh:class",
                "@type": "@id"
            },
            "sh:or": {
                "@id": "sh:or",
                "@container": "@list"
            },
            "sh:in": {
                "@id": "sh:in",
                "@container": "@list"
            },
            "sh:languageIn": {
                "@id": "sh:languageIn",
                "@container": "@list"
            },
            "sh:equals": {
                "@id": "sh:equals",
                "@type": "@id"
            },
            "sh:disjoint": {
                "@id": "sh:disjoint",
                "@type": "@id"
            },
            "sh:lessThan": {
                "@id": "sh:lessThan",
                "@type": "@id"
            },
            "sh:lessThanOrEquals": {
                "@id": "sh:lessThanOrEquals",
                "@type": "@id"
            }
        };
    }
}

module.exports = Shacl;
