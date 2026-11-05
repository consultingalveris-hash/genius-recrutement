// Lecture des banques de questions (fichiers texte dans data/banks).
// Format d'une ligne : NIVEAU|compétence fine|question|+bonne réponse|~réponse partielle|mauvaise|…
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const COMPS = [
  { k: 'M', name: 'Connaissances métier', short: 'Métier', desc: 'Savoirs propres au poste : vocabulaire, procédures, indicateurs', ask: 'Demandez-lui d’expliquer une procédure ou un indicateur de son dernier poste, et ce qu’il faisait pour l’améliorer.' },
  { k: 'S', name: 'Mises en situation', short: 'Situations', desc: 'Réactions face à des cas concrets du poste et savoir-être', ask: 'Faites-lui raconter une situation difficile vécue au travail : ce qu’il a fait, et ce qu’il referait autrement.' },
  { k: 'F', name: 'Français écrit', short: 'Français', desc: 'Orthographe, grammaire, rédaction professionnelle', ask: 'Faites rédiger en cinq minutes un court courriel professionnel sur un cas réel du poste.' },
  { k: 'L', name: 'Logique et calcul', short: 'Logique', desc: 'Raisonnement, pourcentages, calculs du quotidien', ask: 'Proposez un petit calcul du quotidien du poste à voix haute et écoutez le raisonnement.' }
];
export const JOBS = [
  { k: 'centre-appels', name: 'Conseiller clientèle – centre d’appels', file: 'centre-appels.txt', code: 'ca' },
  { k: 'vente', name: 'Commercial / vente', file: 'vente.txt', code: 've' },
  { k: 'comptabilite', name: 'Comptabilité', file: 'comptabilite.txt', code: 'cp' },
  { k: 'rh', name: 'Ressources humaines', file: 'rh.txt', code: 'rh' },
  { k: 'administratif', name: 'Assistant(e) administratif(ve)', file: 'administratif.txt', code: 'ad' },
  { k: 'general', name: 'Tous métiers (tronc commun seulement)', file: null, code: 'ge' }
];
const LV = { S: 'Simple', M: 'Moyenne', D: 'Difficile' };

function shuffleSeeded(arr, seed) {
  // Ordre des réponses mélangé une fois pour toutes, de façon stable d'un démarrage à l'autre.
  const out = arr.slice(); let h = crypto.createHash('sha256').update(seed).digest();
  for (let i = out.length - 1; i > 0; i--) {
    if (i % 8 === 0) h = crypto.createHash('sha256').update(h).digest();
    const j = h[i % 32] % (i + 1); [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function parse(file, job, code) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/), out = []; let cat = null; const n = {};
  lines.forEach((raw, ln) => {
    const l = raw.trim(); if (!l || l.startsWith('#')) return;
    if (l.startsWith('@')) { cat = l[1]; return; }
    const p = l.split('|'); if (p.length < 6 || !cat || !LV[p[0]]) throw new Error(`${path.basename(file)} ligne ${ln + 1} : format invalide`);
    const opts = p.slice(3).map(o => o.startsWith('+') ? [o.slice(1).trim(), 2] : o.startsWith('~') ? [o.slice(1).trim(), 1] : [o.trim(), 0]);
    if (opts.filter(o => o[1] === 2).length !== 1) throw new Error(`${path.basename(file)} ligne ${ln + 1} : il faut exactement une bonne réponse`);
    n[cat] = (n[cat] || 0) + 1;
    const id = `${code}-${cat}${n[cat]}`;
    out.push({ id, c: cat, job, lvl: LV[p[0]], skill: p[1].trim(), t: p[2].trim(), o: shuffleSeeded(opts, id + p[2]) });
  });
  return out;
}
export function loadBank(dir) {
  const bank = parse(path.join(dir, 'commun.txt'), null, 'co');
  for (const j of JOBS) if (j.file) bank.push(...parse(path.join(dir, j.file), j.k, j.code));
  const ids = new Set(); for (const q of bank) { if (ids.has(q.id)) throw new Error('Identifiant en double : ' + q.id); ids.add(q.id); }
  return bank;
}
