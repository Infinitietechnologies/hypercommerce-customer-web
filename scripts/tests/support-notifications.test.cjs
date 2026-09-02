const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const read = file => fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8');
const compile = file => ts.transpileModule(read(file), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
}).outputText;
const helper = {};
vm.runInNewContext(compile('src/helpers/notificationUrl.ts'), {exports: helper});

const worker = () => {
    const handlers = {};
    const opened = [];
    const clients = {matchAll: async () => [], openWindow: async url => opened.push(url)};
    const context = {
        importScripts: () => {}, URL, console, clients,
        self: {clients, location: {origin: 'https://shop.example'}, addEventListener: (type, handler) => { handlers[type] = handler; }},
    };
    vm.runInNewContext(read('public/firebase-messaging-sw.js'), context);
    return {...context, handlers, opened};
};

test('notification center and Firebase support payloads open the permanent chat', () => {
    for (const data of [{type: 'support_message', thread_uuid: 'thread-1', ticket_slug: 'ticket-1'}, '{"type":"support_message"}']) {
        assert.equal(helper.getNotificationRedirectUrl(data), '/my-account/support/');
    }
    assert.equal(helper.getNotificationRedirectUrl(null, 'support_message'), '/my-account/support/');
    assert.equal(helper.getNotificationRedirectUrl({order_id: 12}, 'support_message'), '/my-account/support/');
    assert.equal(helper.getNotificationRedirectUrl({url: '/my-account/orders/12'}, 'support_message'), '/my-account/support/');
});

test('unrelated notification destinations keep their existing behavior', () => {
    const background = worker();
    for (const [data, expected] of [
        [{type: 'order_update', order_slug: 'order-12'}, '/my-account/orders/order-12'],
        [{type: 'wallet_transaction'}, '/my-account/wallet'],
        [{type: 'product', product_slug: 'tea'}, '/products/tea'],
        [{url: 'https://example.com/promotion'}, 'https://example.com/promotion'],
        [{type: 'unknown'}, null],
    ]) {
        assert.equal(helper.getNotificationRedirectUrl(data), expected);
        assert.equal(background.getNotificationUrl(data), expected);
    }
});

test('background support notification click opens chat even without an existing tab', async () => {
    const background = worker();
    let closed = false;
    let pending;
    background.handlers.notificationclick({
        notification: {data: {type: 'support_message'}, close: () => {closed = true;}},
        waitUntil: promise => {pending = promise;},
    });
    await pending;
    assert.equal(closed, true);
    assert.deepEqual(background.opened, ['https://shop.example/my-account/support/']);
});

test('background support notification focuses an existing chat tab', async () => {
    const background = worker();
    let focused = false;
    background.clients.matchAll = async () => [{url: 'https://shop.example/my-account/support/', focus: async () => {focused = true;}}];
    let pending;
    background.handlers.notificationclick({
        notification: {data: {type: 'support_message'}, close: () => {}},
        waitUntil: promise => {pending = promise;},
    });
    await pending;
    assert.equal(focused, true);
    assert.deepEqual(background.opened, []);
});

test('live support toast has an accessible chat link and dismisses on navigation', async () => {
    const toasts = [];
    const dismissed = [];
    let onActivity;
    const ui = {Link: 'a', toast: options => {toasts.push(options); return 'toast-1';}, closeToast: key => dismissed.push(key)};
    const modules = {
        react: {useEffect: effect => effect()},
        'react/jsx-runtime': require('react/jsx-runtime'),
        'next/router': {useRouter: () => ({pathname: '/my-account', push: () => {}})},
        'react-i18next': {useTranslation: () => ({t: key => key})},
        '@/components/ui': ui,
        '@heroui/react': {addToast: ui.toast},
        '@/lib/cookies': {getCookie: () => 'test-token'},
        '@/services/support': {supportService: {getRealtime: async () => ({configured: true, user_id: 1, realtime: {key: 'public-key'}})}},
        'laravel-echo': {default: class {private() {return {listen: (_name, callback) => {onActivity = callback;}};}}},
        'pusher-js': {default: class {}},
    };
    const exportsObject = {};
    vm.runInNewContext(compile('src/features/support/components/SupportNotificationListener.tsx'), {
        exports: exportsObject, document: {hidden: false}, require: name => {
            assert.ok(name in modules, `Unexpected import: ${name}`);
            return modules[name];
        },
    });
    exportsObject.default();
    await new Promise(resolve => setImmediate(resolve));
    onActivity({activity: 'message.created', thread_uuid: 'thread-1', message: {sender_role: 'admin', preview: 'Hello'}});
    assert.equal(toasts.length, 1);
    const link = toasts[0].title;
    assert.equal(link.type, 'a');
    assert.equal(link.props.href, '/my-account/support/');
    link.props.onClick();
    assert.deepEqual(dismissed, ['toast-1']);
    onActivity({activity: 'message.created', message: {sender_role: 'user'}});
    assert.equal(toasts.length, 1);
});
