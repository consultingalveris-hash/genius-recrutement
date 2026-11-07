// Construit la banque v2 : anciennes questions conservées mais retirées du tirage, nouvelles ajoutées. Contrôles qualité.
const fs = require('fs');
const old = require(process.argv[2]);
const add = ['cc','vente','compta','rh','admin','commun'].flatMap(f => require('./' + f + '.js'));
const OV = require('./overrides.js');
let nOv = 0; for (const q of add) { const o = OV[q.id.replace(/^V2-/, '')]; if (o && nOv++ % 4 === 3) continue; if (o) for (const [i, t] of Object.entries(o)) { if (!q.o[i]) { console.log('rang inconnu', q.id, i); continue; } q.o[i][0] = t; } }
const bank = old.bank.map(q => ({ ...q, retired: true })).concat(add);
const ids = new Set(); let err = 0; const warn = [];
for (const q of bank) {
  if (ids.has(q.id)) { console.log('doublon', q.id); err++; } ids.add(q.id);
  if (q.retired) continue;
  if (q.o.length !== 4) { console.log('options', q.id); err++; }
  if (new Set(q.o.map(o => o[0])).size !== 4) { console.log('options identiques', q.id); err++; }
  const mx = Math.max(...q.o.map(o => o[1])); if (q.o.filter(o => o[1] === mx).length !== 1) { console.log('plusieurs bonnes', q.id); err++; }
  if (!['Simple','Moyenne','Difficile'].includes(q.lvl)) { console.log('niveau', q.id); err++; }
  const good = q.o.find(o => o[1] === mx)[0].length, others = q.o.filter(o => o[1] !== mx).map(o => o[0].length);
  if (good > Math.max(...others) * 1.25 && good - Math.max(...others) > 12) warn.push(q.id + ' (' + good + ' vs ' + Math.max(...others) + ')');
}
const stat = {}; for (const q of add) { const mx = Math.max(...q.o.map(o => o[1])); const L = q.o.map(o => o[0].length); const g = L[q.o.findIndex(o => o[1] === mx)];
  const k = q.fam + '/' + q.c; stat[k] ??= [0, 0]; stat[k][1]++; if (g === Math.max(...L) && L.filter(x => x === g).length === 1) stat[k][0]++; }
console.log('part des questions où la bonne réponse est la plus longue :', Object.entries(stat).map(([k, v]) => k + ' ' + Math.round(100 * v[0] / v[1]) + ' %').join(' · '));
const counts = {}; for (const q of add) { const k = q.fam + '/' + q.c + '/' + q.lvl[0]; counts[k] = (counts[k] || 0) + 1; }
console.log(counts); console.log('nouvelles', add.length, 'erreurs', err);
console.log('bonne réponse nettement plus longue que les autres :', warn.length, '\n' + warn.join('\n'));
if (!err && process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ ...old, bank }));
