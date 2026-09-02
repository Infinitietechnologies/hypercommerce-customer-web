const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

function load(file, imports = {}) {
    const source = fs.readFileSync(path.resolve(__dirname, '../../src/features/support', file), 'utf8');
    const exports = {};
    const output = ts.transpileModule(source, {compilerOptions: {
        module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    }}).outputText;
    vm.runInNewContext(output, {exports, require: name => imports[name] || require(name)});
    return exports;
}

test('callback rate limits show Retry-After instead of a generic error', () => {
    const {supportErrorMessage} = load('supportError.ts');
    const describe = seconds => `Retry in ${seconds}s`;
    assert.equal(supportErrorMessage({response: {status: 429, headers: {'retry-after': '17'}}}, 'Failed', describe), 'Retry in 17s');
    assert.equal(supportErrorMessage({response: {status: 429}}, 'Failed', describe), 'Retry in 60s');
    assert.equal(supportErrorMessage({response: {status: 422, data: {message: 'Session is closed'}}}, 'Failed'), 'Session is closed');
    assert.equal(supportErrorMessage(new Error('Network'), 'Failed'), 'Failed');
});

test('drop zones accept files for review only when enabled and ignore text drags', () => {
    const DropZone = load('components/SupportDropZone.tsx', {
        react: {...React, useEffect: () => {}, useRef: () => ({current: 0}), useState: () => [false, () => {}]},
        'react-i18next': {useTranslation: () => ({t: key => key})},
        '@iconify/react': {Icon: () => null},
    }).default;
    const selected = [];
    const file = {name: 'proof.png', type: 'image/png', size: 42};
    let prevented = 0;
    const event = {dataTransfer: {types: ['Files'], files: [file]}, preventDefault: () => prevented++};
    const enabled = DropZone({enabled: true, onFiles: files => selected.push(...files), children: null});
    enabled.props.onDragOver(event);
    assert.equal(event.dataTransfer.dropEffect, 'copy');
    enabled.props.onDrop(event);
    assert.equal(selected.length, 1);
    assert.equal(selected[0], file);
    const disabled = DropZone({enabled: false, onFiles: () => assert.fail('Disabled drop accepted'), children: null});
    disabled.props.onDragOver(event);
    assert.equal(event.dataTransfer.dropEffect, 'none');
    disabled.props.onDrop(event);
    assert.equal(prevented, 4);
    enabled.props.onDrop({dataTransfer: {types: ['text/plain']}, preventDefault: () => assert.fail('Text drag intercepted')});
});
