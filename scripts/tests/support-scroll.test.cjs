const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.resolve(__dirname, '../../src/features/support/supportScroll.ts'), 'utf8');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText, {exports: exportsObject});
const {captureSupportScroll, restoreSupportScroll} = exportsObject;

test('history preserves the visible message and partial scroll offset', () => {
  let messageTop = 75;
  const message = {dataset: {messageId: '51'}, getBoundingClientRect: () => ({top: messageTop, bottom: messageTop + 80})};
  const container = {
    scrollTop: 35, scrollHeight: 1000,
    getBoundingClientRect: () => ({top: 100}),
    querySelectorAll: () => [message], querySelector: () => message,
  };
  const snapshot = captureSupportScroll(container);
  messageTop += 630;
  container.scrollHeight += 630;
  restoreSupportScroll(container, snapshot);
  assert.equal(container.scrollTop, 665);
});

test('history falls back to height plus offset if the anchor was deleted', () => {
  const container = {scrollTop: 47, scrollHeight: 1000,
    getBoundingClientRect: () => ({top: 0}), querySelectorAll: () => [], querySelector: () => null};
  const snapshot = captureSupportScroll(container);
  container.scrollHeight = 1600;
  restoreSupportScroll(container, snapshot);
  assert.equal(container.scrollTop, 647);
});

test('native anchoring does not result in a second scroll adjustment', () => {
  const message = {dataset: {messageId: '51'}, getBoundingClientRect: () => ({top: 25, bottom: 100})};
  const container = {scrollTop: 20, scrollHeight: 1000,
    getBoundingClientRect: () => ({top: 0}), querySelectorAll: () => [message], querySelector: () => message};
  const snapshot = captureSupportScroll(container);
  container.scrollTop = 620;
  container.scrollHeight = 1600;
  restoreSupportScroll(container, snapshot);
  assert.equal(container.scrollTop, 620);
});
