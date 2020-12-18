import SDOAdapter from 'schema-org-adapter';

import Util from './Util';

class DSEditor {
    static instanceCounter = 0;

    constructor(elem) {
        this.elem = elem;
        this.sdoAdapter = new SDOAdapter();

        DSEditor.instanceCounter++;
        this.cssId = 'ds-editor-' + DSEditor.instanceCounter;
    }

    async render() {
        await this.initSDOAdapter();

        this.elem.innerHTML = this.createInput();
    }

    async initSDOAdapter() {
        const sdoURL = await this.sdoAdapter.constructSDOVocabularyURL('latest');
        await this.sdoAdapter.addVocabularies([sdoURL]);
    }

    createInput() {
        const listId = this.cssId + '-class-list';
        return '' +
            '<input spellcheck="false" list="' + listId + '">' +
            '<datalist id="' + listId + '">' +
            this.sdoAdapter.getListOfClasses().sort().map((sdoClass) => {
                return '<option>' + Util.prettyPrintIri(sdoClass) + '</option>';
            }).join('') +
            '</datalist>';
    }
}

module.exports = DSEditor;
