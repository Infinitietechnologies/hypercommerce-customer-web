import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import ts from "typescript";

const helper = ts.transpileModule(
  readFileSync(
    new URL("../src/helpers/landingDocument.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const originalTemplatePath = process.argv[2];
const page = `<!doctype html><title>Landing document regression tests</title><h1>Landing document regression tests</h1><ol id="results"></ol><div id="fixtures"></div>
<script type="module">
import {createLandingDocument} from '/renderer.js';
let failed=0;
function check(name, pass) {const li=document.createElement('li');li.textContent=(pass?'PASS ':'FAIL ')+name;document.querySelector('#results').append(li);if(!pass)failed++;}
const endScript = '<'+'/script>';
function script(code, attrs='') {return '<script '+attrs+'>'+code+endScript;}
function run(html,css='') {return new Promise((resolve,reject)=>{
 const frame=document.createElement('iframe');frame.title='Fixture';frame.style.cssText='width:375px;height:360px';
 frame.setAttribute('sandbox','allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation');
 const timeout=setTimeout(()=>reject(Error('Fixture timeout')),15000);
 const listener=event=>{if(event.source===frame.contentWindow&&event.data?.kind==='fixture'){clearTimeout(timeout);window.removeEventListener('message',listener);resolve({data:event.data,frame});}};
 window.addEventListener('message',listener);document.querySelector('#fixtures').append(frame);
 frame.srcdoc=createLandingDocument(html,css,location.origin+'/assets/',location.href);
});}
function reporter(code) {return script('window.addEventListener("load",()=>setTimeout(()=>{'+code+'},50));');}
try {
 const html='<!doctype html><html lang="ar" dir="rtl"><head>'+script('', 'src="dependency.js"')+script('window.order.push("inline");window.ready=0;document.addEventListener("DOMContentLoaded",()=>window.ready++);')+script('', 'defer src="deferred.js"')+script('', 'type="module" src="module.js"')+script('{"name":"inert"}', 'type="application/ld+json" id="json-data"')+'</head><body class="template"><h1>Template</h1><button id="button">Click</button><a href="#target">Anchor</a><div id="target">Target</div>'+script('window.order.push("body");document.body.classList.add("open");document.getElementById("button").onclick=()=>document.body.dataset.clicked="yes";')+reporter('document.getElementById("button").click();document.querySelector("a").click();let isolated=false;try{parent.document.body}catch(_){isolated=true}parent.postMessage({kind:"fixture",order:window.order,ready:window.ready,module:document.body.dataset.module,clicked:document.body.dataset.clicked,color:getComputedStyle(document.body).color,lang:document.documentElement.lang,dir:document.documentElement.dir,isolated,base:document.baseURI,json:document.getElementById("json-data")?.textContent},"*");')+'</body></html>';
 const source=html;
 const result=await run(source,':root{--ink:rgb(12,34,56)}body.template{color:var(--ink)}@media(max-width:400px){h1{font-size:22px}}@keyframes pulse{from{opacity:0}to{opacity:1}}');
 const d=result.data;
 check('external then inline then body then defer order',d.order.join(',')==='external,inline,body,defer');
 check('DOMContentLoaded exactly once',d.ready===1);
 check('module type and CORS preserved',d.module==='yes');
 check('click handler works',d.clicked==='yes');
 check('root and body CSS preserved',d.color==='rgb(12, 34, 56)');
 check('document language and direction retained',d.lang==='ar'&&d.dir==='rtl');
 check('template cannot access parent document',d.isolated);
 check('relative assets resolve to backend base',d.base.endsWith('/assets/'));
 check('JSON scripts remain inert data',d.json==='{"name":"inert"}');
 check('CSS stays isolated from parent',getComputedStyle(document.body).color!=='rgb(12, 34, 56)');
 result.frame.remove();
 const edge=await run(script('', 'src="repeat.js"')+script('', 'src="repeat.js"')+script('', 'src="missing.js"')+reporter('parent.postMessage({kind:"fixture",count:window.repeatCount},"*");'));
 check('repeated authored scripts retain native execution',edge.data.count===2);
 check('failed CDN does not hang following scripts',edge.data.kind==='fixture');edge.frame.remove();
 const blank=await run(reporter('parent.postMessage({kind:"fixture",body:!!document.body},"*");'));
 check('empty HTML accepts a complete document',blank.data.body);blank.frame.remove();
 const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.append(s)});
 const grapes=await import('https://unpkg.com/grapesjs@0.23.6/dist/grapes.mjs');window.grapesjs=grapes.default;await load('https://unpkg.com/grapesjs-preset-webpage@1.0.3');await load('https://unpkg.com/grapesjs-parser-postcss@1.0.3');await Promise.all([load('https://unpkg.com/grapesjs-tabs@1.0.6'),load('https://unpkg.com/grapesjs-component-countdown@1.0.2')]);
 const root=document.createElement('div');root.dataset.grapesjsEditor='';root.dataset.height='240px';root.innerHTML='<textarea hidden data-grapesjs-initial-html></textarea><textarea hidden data-grapesjs-initial-css></textarea><textarea hidden data-grapesjs-initial-project></textarea><div data-grapesjs-mount></div><input data-grapesjs-html><input data-grapesjs-css><input data-grapesjs-project>';
 const ready=new Promise(resolve=>root.addEventListener('grapesjs:ready',resolve,{once:true}));document.querySelector('#fixtures').append(root);await load('/editor.js');await ready;
 const editor=root.grapesjsEditor;const command=editor.Commands.get('gjs-open-import-webpage');const container=command.getContainer();
 command.getCodeViewer().setContent('<!doctype html><html lang="ar" dir="rtl"><head><meta name="fixture" content="kept"><style>:root{--paint:rgb(21,43,65);--edge:18px}.late-active{color:rgb(21,43,65);background:var(--paint);padding:0 var(--edge)}.open .late-active{background:rgb(10,20,30)}@keyframes pulse{from{opacity:0}to{opacity:1}}</style></head><body class="source"><button class="late-active">Late state</button>'+script('document.body.classList.add("open")')+'</body></html>');container.querySelector('button').click();
 editor.Components.addType('fixture-script',{model:{defaults:{tagName:'button',script:function(){this.dataset.initialized=String(Number(this.dataset.initialized||0)+1);}}}});editor.addComponents({type:'fixture-script',attributes:{id:'component-script'},content:'Component'});editor.addComponents(editor.Blocks.get('tabs').get('content'));editor.addComponents({type:'countdown',startfrom:'2000-01-01',endText:'Finished'});editor.trigger('update');
 const exported=root.querySelector('[data-grapesjs-html]').value;const css=root.querySelector('[data-grapesjs-css]').value;const parsed=new DOMParser().parseFromString(exported,'text/html');
 check('full document import retains html attributes',parsed.documentElement.lang==='ar'&&parsed.documentElement.dir==='rtl');
 check('full document import retains head',parsed.head.querySelector('meta[name=fixture]')?.content==='kept');
 check('body attributes survive import/export',parsed.body.classList.contains('source'));
 check('dynamic state selectors survive export',css.includes('.open .late-active'));
 check('CSS variable shorthand survives import/export',css.includes('background:var(--paint)')&&css.includes('padding:0 var(--edge)'));
 check('keyframes survive export',css.includes('@keyframes pulse'));
 check('component JS exported',exported.includes('initialized'));
 check('no forced Tailwind runtime',!exported.includes('@tailwindcss'));
 const output=await run(exported+reporter('var tabs=document.querySelectorAll("[role=tab]");tabs[1].click();parent.postMessage({kind:"fixture",tabSelected:tabs[1].ariaSelected,countdown:document.querySelector("[data-js=countdown-endtext]").textContent,initialized:document.getElementById("component-script").dataset.initialized,background:getComputedStyle(document.querySelector(".late-active")).backgroundColor},"*");'),css);
 check('real GrapesJS tabs switch active panel',output.data.tabSelected==='true');
 check('real GrapesJS countdown script executes',output.data.countdown==='Finished');
 check('component script executes once',output.data.initialized==='1');
 check('JS state design renders',output.data.background==='rgb(10, 20, 30)');
 editor.loadProjectData(editor.getProjectData());editor.trigger('update');
 check('JSON reload retains component JS',root.querySelector('[data-grapesjs-html]').value.includes('initialized'));
 check('JSON reload retains dynamic styles',root.querySelector('[data-grapesjs-css]').value.includes('.open .late-active'));
 let importErrors=0;root.addEventListener('grapesjs:error',()=>importErrors++);
 const setComponents=editor.setComponents;editor.setComponents=()=>{throw new Error('Fixture parser failure')};
 command.getCodeViewer().setContent('<div>Failed import</div>');container.querySelector('button').click();editor.setComponents=setComponents;editor.trigger('update');
 check('failed parser import reports error',importErrors===1);
 check('failed import restores previous project',root.querySelector('[data-grapesjs-html]').value.includes('component-script'));
 const originalResponse=await fetch('/source-template.html');
 if(originalResponse.ok){
   command.getCodeViewer().setContent(await originalResponse.text());container.querySelector('button').click();editor.trigger('update');
   const originalHtml=root.querySelector('[data-grapesjs-html]').value;const originalCss=root.querySelector('[data-grapesjs-css]').value;
   const restored=await run(originalHtml+reporter('document.getElementById("nextBtn").click();setTimeout(()=>parent.postMessage({kind:"fixture",slide:document.querySelector(".slide.active").dataset.slide,padding:getComputedStyle(document.querySelector(".topbar")).paddingLeft,background:getComputedStyle(document.querySelector(".btn.fill")).backgroundColor,slides:document.querySelectorAll(".slide").length},"*"),700);'),originalCss);
   check('original HYPRLUV template retains all nine slides',restored.data.slides===9);
   check('original HYPRLUV navigation renders slide two',restored.data.slide==='1');
   check('original HYPRLUV header padding preserved',parseFloat(restored.data.padding)>0);
   check('original HYPRLUV CTA background preserved',restored.data.background==='rgb(208, 245, 58)');
   restored.frame.title='Restored original template';restored.frame.style.cssText='display:block;width:100%;height:812px;border:0';
 }
 await new Promise(resolve=>setTimeout(resolve,30));editor.destroy();root.remove();output.frame.remove();
} catch(e) {check('harness completes: '+e.stack,false);}
const summary=document.createElement('h2');summary.id='summary';summary.textContent=failed?failed+' FAILED':'ALL TESTS PASSED';document.body.append(summary);
</script>`;
createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const path = new URL(req.url, "http://localhost").pathname;
  if (path === "/renderer.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(helper);
  } else if (path === "/editor.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(
      readFileSync(
        new URL(
          "../../hypercommerce-panel/public/assets/js/grapesjs-editor.js",
          import.meta.url,
        ),
      ),
    );
  } else if (path === "/assets/dependency.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end('window.order=["external"];');
  } else if (path === "/assets/deferred.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end('window.order.push("defer");');
  } else if (path === "/source-template.html") {
    if (originalTemplatePath) {
      res.setHeader("Content-Type", "text/html");
      res.end(readFileSync(originalTemplatePath));
    } else {
      res.writeHead(404);
      res.end();
    }
  } else if (path === "/assets/repeat.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end("window.repeatCount=(window.repeatCount||0)+1;");
  } else if (path === "/assets/missing.js") {
    res.writeHead(404);
    res.end("Not found");
  } else if (path === "/assets/module.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end('document.body.dataset.module="yes";export {};');
  } else if (path === "/") {
    res.setHeader("Content-Type", "text/html");
    res.end(page);
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(3015, "127.0.0.1", () =>
  console.log("Open http://127.0.0.1:3015 in Chrome"),
);
