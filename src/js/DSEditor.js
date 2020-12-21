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

        this.shacl = new Shacl(this.ds);

        DSEditor.instanceCounter++;
    }

    render() {
        this.elem.innerHTML = this.createInput() + this.createPropertyLayout();
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

    createPropertyLayout() {
        const rowId = this.cssId + '-property-row';
        return '<div id="' + rowId + '" style="visibility: hidden;">' +
            '<div class="ds-editor-avail-props">' +
            '<h4>Available properties</h4>' +
            '</div>' +
            '<div class="ds-editor-sel-props">' +
            '<h4>Selected properties</h4>' +
            '</div>' +
            '</div>';
    }

    addEventListenerForSelectingClass() {
        const inputId = this.cssId + '-class-input';
        const input = document.getElementById(inputId);
        input.addEventListener('change', (event) => {
            const selectedClass = event.target.value;
            this.shacl.addRootClasses(selectedClass);

            const propRowId = this.cssId + '-property-row';
            const propRow = document.getElementById(propRowId);
            propRow.style.visibility = 'visible';
            // TODO: Adapter HTML
        }, true);
    }
}

module.exports = DSEditor;
