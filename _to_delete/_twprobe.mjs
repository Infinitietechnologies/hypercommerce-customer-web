import postcss from 'postcss';
import tw from '@tailwindcss/postcss';
const css = '@import "tailwindcss" source(none);\n@source "/sessions/rcw-01yaq96lzmd2omwgeis2z3cp/tmp/tmp.Y9TxAzsfRd/probe.html";';
const r = await postcss([tw()]).process(css, { from: process.cwd()+'/in.css' });
const out = r.css;
const gi = out.indexOf('.grow-0'); const fi = out.indexOf('.flex-auto');
console.log('grow-0 idx:', gi, 'flex-auto idx:', fi, '=> grow-0 AFTER flex-auto:', gi>fi && gi>-1 && fi>-1);
