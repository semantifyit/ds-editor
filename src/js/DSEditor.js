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
        const self = this;
        input.addEventListener('change', (event) => {
            const selectedClass = event.currentTarget.value;
            this.dsHandler.addRootClasses(selectedClass);

            const propRowId = this.cssId + '-property-row';
            const propRow = document.getElementById(propRowId);
            propRow.style.visibility = 'visible';

            const availPropsTbody = propRow.getElementsByClassName('ds-editor-avail-props-table')[0].childNodes[0];
            const sdoClass = this.sdoAdapter.getClass(selectedClass);
            availPropsTbody.innerHTML = sdoClass.getProperties().sort((a, b) => {
                return a.localeCompare(b);
            }).map((p) => {
                return '<tr data-property="' + p + '"><td>' + Util.prettyPrintIri(p) + '</td></tr>';
            }).join('');

            const rows = availPropsTbody.childNodes; // tbody --> tr
            rows.forEach((row) => {
                row.addEventListener('click', self.moveToSelectedProperties.bind(self), true)
            });
        }, true);
    }

    moveToSelectedProperties(event) {
        const p = event.currentTarget.dataset.property;

        const propRowId = this.cssId + '-property-row';
        const propRow = document.getElementById(propRowId);
        const selPropsTbody = propRow.getElementsByClassName('ds-editor-sel-props-table')[0].childNodes[0];
        const htmlNewRow = '<tr data-property="' + p + '"><td>' + Util.prettyPrintIri(p) + '</td></tr>';
        const newRow = Util.htmlToElement(htmlNewRow);
        selPropsTbody.append(newRow);
        event.currentTarget.remove();
        newRow.addEventListener('click', (event) => {
            const usedRow = event.currentTarget;
            const propUsed = Util.prettyPrintIri(usedRow.dataset.property);
            // Insert to avail properties at alphabetically correct position
            // 1) Find property with alphabetically bigger, then insert before
            // 2) If not found, just append to table
            const availPropsTbody = propRow.getElementsByClassName('ds-editor-avail-props-table')[0].childNodes[0];
            const trsAvail = availPropsTbody.childNodes;
            const htmlNewRow = '<tr data-property="' + p + '"><td>' + Util.prettyPrintIri(p) + '</td></tr>';
            const newRow = Util.htmlToElement(htmlNewRow);
            let inserted = false;
            for (const trAvail of trsAvail) {
                const propAvail = Util.prettyPrintIri(trAvail.dataset.property);
                if (propAvail.localeCompare(propUsed) > 0) {
                    availPropsTbody.insertBefore(newRow, trAvail);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                availPropsTbody.append(newRow);
            }
            usedRow.remove();

            // TODO: Add Event Listener
        });
    }
}

module.exports = DSEditor;
