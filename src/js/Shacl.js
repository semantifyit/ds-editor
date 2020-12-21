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

    constructor(ds) {
        this.ds = ds;
    }

    addRootClasses(targetClasses) {
        // TargetClass is either a string or an array of strings
        // The specified class(es) must use the vocab indicator, e.g. "schema:bakery" or "sti:schiHuette"
        if (typeof (targetClasses) === 'string') {
            targetClasses = [targetClasses];
        }

        for (const targetClass of targetClasses) {
            let previousValue = this.ds['@graph'][0]['sh:targetClass'];
            if (previousValue === '') {
                this.ds['@graph'][0]['sh:targetClass'] = targetClass;
            } else if (typeof (previousValue) === 'string') { // 1 element previously
                if (previousValue !== targetClass) {
                    this.ds['@graph'][0]['sh:targetClass'] = [previousValue, targetClass];
                }
            } else {
                if (!(targetClass in this.ds['@graph'][0]['sh:targetClass'])) {
                    this.ds['@graph'][0]['sh:targetClass'].push(targetClass);
                }
            }
        }
    }
}

module.exports = Shacl;
