import Util from './Util';

class DSHandler {
    static async build(sdoAdapter) {
        const latestSDOVersion = await sdoAdapter.getLatestSDOVersion();
        const ds = DSHandler.getDSScaffold(latestSDOVersion);

        /*
        ClassEditMemory is supposed to hold the settings defined by the user thought the UI
        the idea is that settings are only "saved" to the actual ds object when the user clicks the
        "save changes" button of the actual modal
        Modals can be created to a certain depth (10?) and their information is saved in this classEditMemory
        the content is supposed to look like this:

        classEditMemory = {
            "1": {
                "shacl": {...the shacl representation for this...},
                "path": "$.schema:address/schema:PostalAddress"
            },
            "2": {
                "shacl": {...the shacl representation for this...},
                "path": "$.schema:address/schema:PostalAddress.schema:addressCountry/schema:Country"
            }
        }
        */

        return new DSHandler(ds, sdoAdapter);
    }

    static getDSScaffold(latestSDOVersion) {
        return {
            "@context": DSHandler.getDSContext(),
            "@graph": [
                {
                    "@id": "_:RootNode",
                    "@type": ["sh:NodeShape", "schema:CreativeWork"],
                    "schema:author": {
                        "@type": "schema:Person",
                        "schema:name": ""
                    },
                    "schema:name": "",
                    "schema:description": "",
                    "schema:schemaVersion": "https://schema.org/version/" + latestSDOVersion + "/",
                    "ds:usedVocabularies": [],
                    "schema:version": 0,
                    "sh:targetClass": "",
                    "sh:property": []
                }
            ]
        };
    }

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

    constructor(ds, sdoAdapter) {
        this.ds = ds;
        this.sdoAdapter = sdoAdapter;

        this.classEditMemory = {};
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

    addPropertyWithParams(path, propertyIRI, order) {
        let propertyObj = {
            '@type': 'sh:PropertyShape',
            'sh:minCount': 1,
            'sh:order': order,
            'sh:path': propertyIRI,
            'sh:or': []
        };
        this.addProperty(path, propertyObj);
    }

    // The path should point to the class holding the property, e.g. "$" for root class, or "$.schema:address/schema:PostalAddress" to add a property to the PostalAddress
    // The propertyObj should be the SHACL definition of the new property
    addProperty(path, propertyObj) {
        // Only properties added to the root are immediately saved to the virtual DS
        // Changes to inner nodes are applied to the classEditMemory
        let depth = this.getDepth(path);
        let classObj;
        if (depth === 0) {
            classObj = this.resolvePath(this.ds["@graph"][0], path);
            classObj["sh:property"].push(propertyObj);
        } else {
            if (!this.classEditMemory[depth]["shacl"]["sh:node"] || !this.classEditMemory[depth]["shacl"]["sh:node"]["sh:property"]) { // Fix for migrated DS
                this.classEditMemory[depth]["shacl"]["sh:node"] = {
                    "@type": "sh:NodeShape",
                    "sh:property": []
                };
            }
            classObj = this.classEditMemory[depth]["shacl"];
            classObj["sh:node"]["sh:property"].push(propertyObj);
        }
    }

    // Returns the depth inside a DS based on the path given
    getDepth(path) {
        // The amount of / inside the path (used for the range of a property) tells how deep the depth is
        return path.split("/").length - 1;
    }


    // Returns the part of a ds object depending on the given path
    resolvePath(obj, path) {
        // Path has following format:
        // $ stands for the root
        // Schema:Bakery stands for a class from the standard SDO vocab
        // Schema:address stands for a property from the standard SDO vocab
        // _ is a delimiter between classes in a MTE class, e.g. "schema:Hotel_schema:Product"
        // . is a delimiter between a class and its property, e.g.  "schema:Hotel.schema:address"
        // / is a delimiter between a property and its range, e.g.  "schema:Hotel.schema:address/schema:PostalAddress"
        // $.schema:address/schema:PostalAddress.schema:addressRegion
        let foundDelimiter = true;
        do {
            // Check property delimiter
            const bigTokens = path.split("/");
            const smallTokens = bigTokens[0].split(".");
            if (path.startsWith("$")) { // Start with root
                path = path.substring(1);
            } else if (path.startsWith("/")) { // Start with range
                obj = this.getJSONRef_Range(obj, bigTokens[1].split(".")[0]);
                path = path.substring(bigTokens[1].split(".")[0].length + 1);
            } else if (path.startsWith(".")) { // Start with property
                obj = this.getJSONRef_Property(obj, smallTokens[1]);
                path = path.substring(smallTokens[1].length + 1);
            } else {
                foundDelimiter = false;
            }
        } while (foundDelimiter);
        return obj;
    }

    // Returns the part of a given object that corresponds to the range definition given
    // = looks for a given range inside the defined ranges of a given property object
    getJSONRef_Range(obj, range) {
        if (range.split("_").length > 1) {
            range = range.split("_");
        }
        let rangeArray = obj["sh:or"];
        for (const rangeElem of rangeArray) {
            if (rangeElem["sh:datatype"] === range) {
                return rangeElem;
            }
            if (this.checkIfTypesMatch(rangeElem["sh:class"], range)) {
                return rangeElem;
            }
        }
        return undefined; // If no match was found
    }

    getJSONRef_Property(obj, property) {
        let propArray;
        if (obj["sh:targetClass"] !== undefined) { // Is root class
            propArray = obj["sh:property"];
        } else {   // Is not root class
            if (!obj["sh:node"] || !obj["sh:node"]["sh:property"]) { // Fix for migrated DS
                obj["sh:node"] = {
                    "@type": "sh:NodeShape",
                    "sh:property": []
                };
            }
            propArray = obj["sh:node"]["sh:property"];
        }
        for (const propElem of propArray) {
            if (propElem["sh:path"] === property) {
                return propElem;
            }
        }
        return undefined; // If no match was found
    }

    checkIfTypesMatch(types1, types2) {
        if (Array.isArray(types1)) {
            if (Array.isArray(types2)) {
                for (let i = 0; i < types1.length; i++) {
                    if (types2.indexOf(types1[i]) === -1) {
                        return false;
                    }
                }
                for (let i = 0; i < types2.length; i++) {
                    if (types1.indexOf(types2[i]) === -1) {
                        return false;
                    }
                }
                return true;
            } else {
                return (types1.length === 1 && types1[0] === types2);
            }
        } else {
            if (Array.isArray(types2)) {
                return (types2.length === 1 && types2[0] === types1);
            } else {
                return (types1 === types2);
            }
        }
    }

    // Constructor for a ds range object
    createRangeObject(range) {
        if (Util.isString(range)) {
            try {
                this.sdoAdapter.getDataType(range); // Checks whether range is data type of schema.org
                return {"sh:datatype": this.dataTypeMapperToSHACL(range)};
            } catch (e) {
                try {
                    this.sdoAdapter.getEnumeration(range); // Checks whether range is enumeration of schema.org
                    // By default the enumerationValues are not restricted, so "sh:in" is not set
                    return {
                        "sh:class": range
                    };
                } catch (e) {
                    try {
                        this.sdoAdapter.getClass(range, {"termType": "Class"}); // Checks whether range is class of schema.org
                        return {
                            "sh:class": range,
                            "sh:node": {
                                "@type": "sh:NodeShape",
                                "sh:property": []
                            }
                        };
                    } catch (e) {
                        console.log('sh_createRangeObject() -> Unknown range');
                        return null;
                    }
                }
            }
        } else {
            // MTE Array
            return {
                "sh:class": range,
                "sh:node": {
                    "@type": "sh:NodeShape",
                    "sh:property": []
                }
            };
        }
    }

    dataTypeMapperToSHACL(dataType) {
        switch (dataType) {
            case "schema:Text":
                return "xsd:string";
            case "schema:Boolean":
                return "xsd:boolean";
            case "schema:Date":
                return "xsd:date";
            case "schema:DateTime":
                return "xsd:dateTime";
            case "schema:Time":
                return "xsd:time";
            case "schema:Number":
                return "xsd:double";
            case "schema:Float":
                return "xsd:float";
            case "schema:Integer":
                return "xsd:integer";
            case "schema:URL":
                return "xsd:anyURI";
        }
    }

    // The path should point to the property holding the range, e.g. "$.schema:address" to add a range to the address property
    // The rangeObject should be the SHACL definition of the new range
    addRange(path, rangeObject) {
        let propertyObj = this.getObj(path);
        propertyObj["sh:or"].push(rangeObject);
    }

    getObj(path) {
        let depth = this.getDepth(path);
        if (depth === 0) {
            return this.resolvePath(this.ds["@graph"][0], path);
        } else {
            return this.resolvePath(this.classEditMemory[depth]["shacl"],
                path.substring(this.classEditMemory[depth]["path"].length));
        }
    }
}

module.exports = DSHandler;
