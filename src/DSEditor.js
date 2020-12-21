import SDOAdapter from 'schema-org-adapter';

import Shacl from './Shacl';
import Util from './Util';

class DSEditor {
    static instanceCounter = 0;

    static async build(elem) {
        const sdoAdapter = new SDOAdapter();
        const sdoURL = await sdoAdapter.constructSDOVocabularyURL('latest');
        await sdoAdapter.addVocabularies([sdoURL]);
        const latestSDOVersion = await sdoAdapter.getLatestSDOVersion();

        const ds = {
            "@context": Shacl.getDSContext(),
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

        const cssId = 'ds-editor-' + (DSEditor.instanceCounter + 1);
        return new DSEditor(elem, sdoAdapter, ds, cssId);
    }

    constructor(elem, sdoAdapter, ds, cssId) {
        this.elem = elem;
        this.sdoAdapter = sdoAdapter;
        this.ds = ds;
        this.cssId = cssId;

        DSEditor.instanceCounter++;
    }

    render() {
        this.elem.innerHTML = this.createInput();
        this.addEventListenerForSelectingClass();
    }

    createInput() {
        const inputId = this.cssId + '-class-input';
        const listId = this.cssId + '-class-list';
        return '' +
            'Start Class: ' +
            '<input id="' + inputId + '" spellcheck="false" list="' + listId + '">' +
            '<datalist id="' + listId + '">' +
            this.sdoAdapter.getListOfClasses().sort().map((sdoClass) => {
                return '<option>' + Util.prettyPrintIri(sdoClass) + '</option>';
            }).join('') +
            '</datalist>';
    }

    addEventListenerForSelectingClass() {
        const inputId = this.cssId + '-class-input';
        const input = document.getElementById(inputId);
        input.addEventListener('change', (event) => {
            // TODO
        }, true);
    }
}

module.exports = DSEditor;
