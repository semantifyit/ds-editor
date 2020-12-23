import SDOAdapter from 'schema-org-adapter';

import DSHandler from './DSHandler';
import Util from './Util';

class DSEditor {
    static instanceCounter = 0;

    static async build(elem) {
        const sdoAdapter = new SDOAdapter();
        const sdoURL = await sdoAdapter.constructSDOVocabularyURL('latest');
        await sdoAdapter.addVocabularies([sdoURL]);
        const latestSDOVersion = await sdoAdapter.getLatestSDOVersion();

        const dsHandler = new DSHandler(latestSDOVersion);

        const cssId = 'ds-editor-' + (DSEditor.instanceCounter + 1);
        return new DSEditor(elem, sdoAdapter, cssId, dsHandler);
    }

    constructor(elem, sdoAdapter, cssId, dsHandler) {
        this.elem = elem;
        this.sdoAdapter = sdoAdapter;
        this.cssId = cssId;
        this.dsHandler = dsHandler;

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
            '<table class="ds-editor-avail-props-table ds-editor-table-striped"><tbody></tbody></table>' +
            '</div>' +
            '<div class="ds-editor-sel-props">' +
            '<h4>Selected properties</h4>' +
            '<table class="ds-editor-sel-props-table ds-editor-table-striped"><tbody></tbody></table>' +
            '</div>' +
            '</div>';
    }

    addEventListenerForSelectingClass() {
        const inputId = this.cssId + '-class-input';
        const input = document.getElementById(inputId);
        input.addEventListener('change', (event) => {
            const selectedClass = event.target.value;
            this.dsHandler.addRootClasses(selectedClass);

            const propRowId = this.cssId + '-property-row';
            const propRow = document.getElementById(propRowId);
            propRow.style.visibility = 'visible';

            const availPropsTbody = propRow.getElementsByClassName('ds-editor-avail-props-table')[0].childNodes[0];
            const sdoClass = this.sdoAdapter.getClass(selectedClass);
            availPropsTbody.innerHTML = sdoClass.getProperties().sort().map((p) => {
                return '<tr data-property="' + p + '"><td>' + Util.prettyPrintIri(p) + '</td></tr>';
            }).join('');

            const rows = availPropsTbody.childNodes; // tbody --> tr
            debugger;
            rows.forEach((row) => {
                row.addEventListener('click', (event) => {
                    const p = row.dataset.property;
                    const selPropsTbody = propRow.getElementsByClassName('ds-editor-sel-props-table')[0].childNodes[0];
                    selPropsTbody.innerHTML += '<tr data-property="' + p + '"><td>' + Util.prettyPrintIri(p) + '</td></tr>';
                    row.remove();
                }, true)
            });
        }, true);
    }
}

module.exports = DSEditor;
