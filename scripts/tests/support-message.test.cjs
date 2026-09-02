const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const clsx = require('clsx');

const source = fs.readFileSync(path.resolve(__dirname, '../../src/features/support/components/SupportChat.tsx'), 'utf8');
const component = source.slice(source.indexOf('const MessageBubble ='), source.indexOf('const SessionTimeline ='));
const compiled = ts.transpileModule(`${component}\nmodule.exports = MessageBubble;`, {
    compilerOptions: {jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2017},
}).outputText;
const context = {
    module: {exports: {}}, React, clsx,
    useTranslation: () => ({t: key => key}),
    formatTime: () => '9:30 PM',
    Icon: () => React.createElement('svg'),
    PrivateAttachment: () => null,
};
vm.runInNewContext(compiled, context);
const render = (type, senderRole = 'system', text = 'Our support team will reply when available.') => renderToStaticMarkup(
    React.createElement(context.module.exports, {message: {
        id: 1, type, sender_role: senderRole, sender_name: 'Customer Support',
        text, attachments: [], created_at: '2026-09-02T16:00:00Z',
    }}),
);

test('outside-hours auto replies render as incoming chat bubbles with sender and time', () => {
    const html = render('auto_reply');
    assert.match(html, /justify-start/);
    assert.match(html, /rounded-bl-sm/);
    assert.match(html, /Customer Support/);
    assert.match(html, /9:30 PM/);
    assert.doesNotMatch(html, /role="status"/);
});

test('closure and callback events remain slim system logs', () => {
    for (const type of ['closure', 'callback_requested', 'assignment']) {
        assert.match(render(type), /role="status"/);
        assert.doesNotMatch(render(type), /rounded-bl-sm/);
    }
});

test('automated reply text stays escaped and customer messages stay on the right', () => {
    const html = render('auto_reply', 'system', '<img src=x onerror=alert(1)>');
    assert.match(html, /&lt;img/);
    assert.doesNotMatch(html, /<img/);
    assert.match(render('text', 'user'), /justify-end/);
});
