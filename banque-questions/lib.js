// Aide à l'écriture de la banque v2.
// Q : une seule bonne réponse, écrite en premier (l'ordre est mélangé pour chaque candidat).
// P : mise en situation à points : [texte, points] — 2 = meilleure réponse, 1 = acceptable, 0 = à éviter.
const S = 'Simple', M = 'Moyenne', D = 'Difficile';
function make(fam) {
  const out = [];
  const Q = (id, c, lvl, skill, t, opts) => out.push({ id: 'V2-' + id, c, fam, lvl, skill, t, o: opts.map((x, i) => [x, i === 0 ? 1 : 0]) });
  const P = (id, lvl, skill, t, opts) => out.push({ id: 'V2-' + id, c: 'S', fam, lvl, skill, t, o: opts.map(([x, p]) => [x, p === 2 ? 3 : p]) });
  return { out, Q, P };
}
module.exports = { make, S, M, D };
