import SDOAdapter from 'schema-org-adapter';

import DSHandler from './DSHandler';
import Util from './Util';

class DSEditor {
    static instanceCounter = 0;

    static async build(elem) {
        const sdoAdapter = new SDOAdapter();
        const sdoURL = await sdoAdapter.constructSDOVocabularyURL('latest');
        await sdoAdapter.addVocabularies([sdoURL]);


        const dsHandler = await DSHandler.build(sdoAdapter);

        const cssId = 'ds-editor-' + (DSEditor.instanceCounter + 1);

        return new DSEditor(elem, sdoAdapter, cssId, dsHandler);
    }

    constructor(elem, sdoAdapter, cssId, dsHandler) {
        this.elem = elem;
        this.sdoAdapter = sdoAdapter;
        this.cssId = cssId;
        this.dsHandler = dsHandler;
        this.useSupersededTerms = false;  // Whether the DS uses vocabulary elements that are superseded

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
        const propertyIRI = event.currentTarget.dataset.property;

        const propRowId = this.cssId + '-property-row';
        const propRow = document.getElementById(propRowId);
        const selPropsTbody = propRow.getElementsByClassName('ds-editor-sel-props-table')[0].childNodes[0];
        const htmlNewRow = '' +
            '<tr data-property="' + propertyIRI + '">' +
            '<td>' + Util.prettyPrintIri(propertyIRI) + '</td>' +
            '</tr>';
        const newRow = Util.htmlToElement(htmlNewRow);
        selPropsTbody.append(newRow);
        event.currentTarget.remove();
        newRow.addEventListener('click', this.moveToAvailProperties.bind(this), true);

        // Update SHACL property
        const path = '$'; // TODO: Receive generically
        const depth = this.dsHandler.getDepth(path);
        this.dsHandler.addPropertyWithParams(path, propertyIRI, selPropsTbody.children.length);

        // Update SHACL property ranges (TODO: Move to ds handler)
        let targetClasses;
        let dsProperty;
        if (depth === 0) {
            const dsPartObj = this.dsHandler.resolvePath(this.dsHandler.ds["@graph"][0], path);
            if (dsPartObj["sh:property"]) {
                for (let i = 0; i < dsPartObj["sh:property"].length; i++) {
                    if (dsPartObj["sh:property"][i]["sh:path"] === propertyIRI) {
                        dsProperty = dsPartObj["sh:property"][i];
                        break;
                    }
                }
            }
            targetClasses = dsPartObj["sh:targetClass"];
        } else {
            const dsPartObj = this.dsHandler.classEditMemory[depth]["shacl"];
            if (dsPartObj["sh:node"] && dsPartObj["sh:node"]["sh:property"]) {
                for (let i = 0; i < dsPartObj["sh:node"]["sh:property"].length; i++) {
                    if (dsPartObj["sh:node"]["sh:property"][i]["sh:path"] === propertyIRI) {
                        dsProperty = dsPartObj["sh:node"]["sh:property"][i];
                        break;
                    }
                }
            }
            targetClasses = dsPartObj["sh:class"];
        }

        if (typeof(targetClasses) === "string") {
            targetClasses = [targetClasses];
        }

        let property = null;
        for (let targetClass of targetClasses) {
            let properties = this.getPropertiesOfClass(targetClass);
            for (let i = 0; i < properties.length; i++) {
                if (properties[i].getIRI(true).localeCompare(propertyIRI) === 0) {
                    property = properties[i];
                    break;
                }
            }
            if (property !== null) {
                break;
            }
        }
        // Append generated code for the ranges of the property
        let ranges = JSON.parse(JSON.stringify(property.getRanges(false, {"isSuperseded":
                this.getSupersededFilterOption()})));
        if (Array.isArray(ranges)) {
            ranges = this.ascOrderRanges(ranges);
        }

        for (const range of ranges) {
            if (Array.isArray(range) === false) {
                // Standard data types (literals) are checked by default -> should be added to shacl DS
                if (Util.checkIfValueTypeIsBasicDataType(Util.prettyPrintIri(range)) || ranges.length === 1) {
                    let rangeObject = this.dsHandler.createRangeObject(range);
                    this.dsHandler.addRange(path + '.' + propertyIRI, rangeObject);
                }
            }
        }
    }

    ascOrderRanges(ranges){
        let rangeArray=[];

        let checkType;
        for (let i = 0 ; i < ranges.length; i++) {
            checkType = ranges[i].split(":")[0];
            checkType == 'schema' ? rangeArray.push(ranges[i].split(":")[1]+":schema") : rangeArray.push(ranges[i]);
        }
        rangeArray.sort();
        for(let i=0;i<rangeArray.length;i++){
            checkType=rangeArray[i].split(":")[1];
            rangeArray[i]=checkType=='schema'?"schema:"+rangeArray[i].split(":")[0]:rangeArray[i];
        }

        return rangeArray;

        // Commented code for (sort without schema: and ttg:)

        //     Let rangeArray=[];
        //         Console.log(ranges);
        //     For(let i=0;i<ranges.length;i++){
        //         RangeArray.push(ranges[i].split(":")[1]+":"+ranges[i].split(":")[0]);
        //     }
        //     RangeArray.sort();
        //     For(let i=0;i<rangeArray.length;i++){
        //        RangeArray[i]=rangeArray[i].split(':')[1]+":"+rangeArray[i].split(':')[0];
        //     }
        //    Console.log(rangeArray);
        //     Return rangeArray;

    }

    getPropertiesOfClass(targetClass) {
        let propertiesList;
        try {
            propertiesList = this.sdoAdapter.getClass(targetClass).getProperties(true,
                {"isSuperseded": this.getSupersededFilterOption()});
        } catch (e) {
            console.log(e);
            propertiesList = [];
        }

        let result = [];
        for (let i = 0; i < propertiesList.length; i++) {
            result.push(this.sdoAdapter.getProperty(propertiesList[i]));
        }

        return result;
    }

    getSupersededFilterOption() {
        if (this.useSupersededTerms) {
            return null;
        } else {
            return false;
        }
    }

    moveToAvailProperties(event) {
        const usedRow = event.currentTarget;
        const propUsed = usedRow.dataset.property;
        const propUsedPretty = Util.prettyPrintIri(propUsed);
        const propRowId = this.cssId + '-property-row';
        const propRow = document.getElementById(propRowId);
        // Insert to avail properties at alphabetically correct position
        // 1) Find property with alphabetically bigger, then insert before
        // 2) If not found, just append to table
        const availPropsTbody = propRow.getElementsByClassName('ds-editor-avail-props-table')[0].childNodes[0];
        const trsAvail = availPropsTbody.childNodes;
        const htmlNewRow = '<tr data-property="' + propUsed + '"><td>' + propUsedPretty + '</td></tr>';
        const newRow = Util.htmlToElement(htmlNewRow);
        let inserted = false;
        for (const trAvail of trsAvail) {
            const propAvail = Util.prettyPrintIri(trAvail.dataset.property);
            if (propAvail.localeCompare(propUsedPretty) > 0) {
                availPropsTbody.insertBefore(newRow, trAvail);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            availPropsTbody.append(newRow);
        }
        usedRow.remove();

        newRow.addEventListener('click', this.moveToSelectedProperties.bind(this), true);
    }
}

module.exports = DSEditor;
