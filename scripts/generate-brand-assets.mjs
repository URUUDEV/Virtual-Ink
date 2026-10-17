/** Generate static brand artifacts from the reviewed, ported SVG component. No archive scripts run. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url)),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),ts=require('typescript');
const path=new URL('../apps/web/src/components/brand/VILogoSVG.tsx',import.meta.url),source=await readFile(path,'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}),module={exports:{}};
vm.runInThisContext(`(function(require,module,exports){${compiled.outputText}\n})`,{filename:'reviewed-brand-svg'})(require,module,module.exports);
await mkdir(new URL('../apps/web/public/brand/',import.meta.url),{recursive:true});
for(const [name,props]of [['vi-icon.svg',{size:480,showWordmark:false}],['vi-logo.svg',{size:480}],['vi-logo-dark.svg',{size:480,tone:'dark'}]]){
  const html=renderToStaticMarkup(React.createElement(module.exports.default,props));
  await writeFile(new URL(`../apps/web/public/brand/${name}`,import.meta.url),html.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '));
}
console.log('Generated three static SVG assets from the supplied monogram paths.');
