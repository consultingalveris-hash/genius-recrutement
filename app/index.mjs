// Genius Recrutement — version 1 (serveur)
// Comptes entreprise, tests de recrutement, invitations par e-mail, passage du test, résultats.
// Dépendances : Node 22 (node:sqlite intégré) + nodemailer.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import nodemailer from 'nodemailer';
import zlib from 'node:zlib';
import webpush from 'web-push';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PORT = +process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'var');
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const SUPERADMIN = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
const QDATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/questions.json'), 'utf8'));
const BANK = new Map(QDATA.bank.map(q => [q.id, q]));
const COMPS = QDATA.comps;
const FAMILIES = QDATA.families;
const famOk = f => FAMILIES.some(x => x.k === f);
const poolOf = (fam, c) => QDATA.bank.filter(q => !q.retired && q.c === c && (q.c === 'F' || q.c === 'L' ? q.fam === 'commun' : q.fam === fam));
// Niveau du poste : part des questions simples, moyennes et difficiles tirées.
const LEVELS = { debutant: { name: 'Débutant', mix: { Simple: .5, Moyenne: .35, Difficile: .15 } }, confirme: { name: 'Confirmé', mix: { Simple: .25, Moyenne: .45, Difficile: .3 } }, expert: { name: 'Expert', mix: { Simple: .1, Moyenne: .4, Difficile: .5 } } };
// Temps par question : les calculs ont au moins 60 secondes.
const qSecs = (t, id) => { const q = BANK.get(id); return q && q.c === 'L' ? Math.max(t.per_q, 60) : t.per_q; };
const DEFAULT_WEIGHTS = { M: 30, S: 35, F: 20, L: 15 };

fs.mkdirSync(path.join(DATA_DIR, 'backups'), { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'genius.db'));
db.exec(`
PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS companies(id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, pass TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS resets(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tests(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL, reply_email TEXT NOT NULL, per_q INTEGER NOT NULL, count INTEGER NOT NULL, weights TEXT NOT NULL,
  back INTEGER NOT NULL DEFAULT 1, deadline TEXT, created_at INTEGER NOT NULL, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS candidates(id INTEGER PRIMARY KEY, test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT NOT NULL, token TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'invite',
  invited_at INTEGER NOT NULL, started_at INTEGER, ended_at INTEGER, qorder TEXT, answers TEXT, exits INTEGER NOT NULL DEFAULT 0,
  timeout INTEGER NOT NULL DEFAULT 0, global INTEGER, scores TEXT, secs INTEGER, note TEXT);
CREATE TABLE IF NOT EXISTS outbox(id INTEGER PRIMARY KEY, company_id INTEGER, recipient TEXT NOT NULL, subject TEXT NOT NULL,
  body TEXT NOT NULL, status TEXT NOT NULL, error TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT NOT NULL);
`);
try { db.exec(`ALTER TABLE companies ADD COLUMN logo TEXT`); } catch {}
try { db.exec(`ALTER TABLE companies ADD COLUMN logo_v INTEGER`); } catch {}
for (const sql of [`ALTER TABLE tests ADD COLUMN level TEXT NOT NULL DEFAULT 'confirme'`, `ALTER TABLE tests ADD COLUMN family TEXT NOT NULL DEFAULT 'cc'`, `ALTER TABLE candidates ADD COLUMN perms TEXT`,
  `ALTER TABLE candidates ADD COLUMN qtime TEXT`, `ALTER TABLE candidates ADD COLUMN cur TEXT`, `ALTER TABLE candidates ADD COLUMN cur_since INTEGER`]) { try { db.exec(sql); } catch {} }
for (const sql of [`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'`, `ALTER TABLE companies ADD COLUMN status TEXT NOT NULL DEFAULT 'valide'`, `ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 1`]) { try { db.exec(sql); } catch {} }
db.exec(`CREATE TABLE IF NOT EXISTS team_invites(token TEXT PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT NOT NULL, by_user INTEGER, expires INTEGER NOT NULL)`);
db.exec(`CREATE TABLE IF NOT EXISTS verifs(token TEXT PRIMARY KEY, kind TEXT NOT NULL, ref_id INTEGER NOT NULL, expires INTEGER NOT NULL)`);
const q1 = (sql, ...a) => db.prepare(sql).get(...a);
const qa = (sql, ...a) => db.prepare(sql).all(...a);
const run = (sql, ...a) => db.prepare(sql).run(...a);
const now = () => Date.now();

/* ---------- outils ---------- */
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const rnd = (n = 24) => crypto.randomBytes(n).toString('base64url');
function hashPass(p) { const salt = crypto.randomBytes(16); const h = crypto.scryptSync(p, salt, 64); return salt.toString('hex') + ':' + h.toString('hex'); }
function checkPass(p, stored) {
  const [s, h] = String(stored).split(':'); if (!s || !h) return false;
  const c = crypto.scryptSync(p, Buffer.from(s, 'hex'), 64); return crypto.timingSafeEqual(c, Buffer.from(h, 'hex'));
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ''));
const clean = (s, max = 200) => String(s ?? '').trim().slice(0, max);

/* ---------- e-mails ---------- */
function mailSettings() { const r = q1(`SELECT v FROM settings WHERE k='mail'`); return r ? JSON.parse(r.v) : null; }
let transport = null, transportKey = '';
function getTransport() {
  const m = mailSettings(); if (!m || !m.host || !m.user || !m.pass || !m.from) return null;
  const key = JSON.stringify(m); if (key !== transportKey) {
    transport = nodemailer.createTransport({ host: m.host, port: +m.port || 587, secure: +m.port === 465, auth: { user: m.user, pass: m.pass } });
    transportKey = key;
  }
  return { t: transport, from: m.from };
}
const logoUrl = companyId => { const r = q1(`SELECT logo_v FROM companies WHERE id=? AND logo IS NOT NULL`, companyId); return r ? `${BASE_URL}/api/logo/${companyId}?v=${r.logo_v}` : null; };
function mailLayout(title, inner, companyId = null) {
  const lg = companyId ? logoUrl(companyId) : null;
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#F4F6F8;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #DDE2E8;border-radius:12px;padding:28px;color:#0F1B2D;font-size:15px;line-height:1.5">
${lg ? `<img src="${esc(lg)}" alt="" style="max-height:56px;max-width:220px;display:block;margin-bottom:18px">` : '<div style="font-weight:700;color:#0E7C86;margin-bottom:16px">Genius Recrutement</div>'}<h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>${inner}
<p style="color:#4A5565;font-size:12px;margin-top:28px">Message envoyé automatiquement par Genius Recrutement.</p></div></div>`;
}
const button = (url, label) => `<p style="margin:22px 0"><a href="${esc(url)}" style="background:#0E7C86;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block">${esc(label)}</a></p><p style="font-size:12px;color:#4A5565">Si le bouton ne marche pas, copiez ce lien : ${esc(url)}</p>`;
async function sendMail({ to, subject, html, companyId = null, replyTo, attachments }) {
  const tr = getTransport();
  const id = run(`INSERT INTO outbox(company_id,recipient,subject,body,status,created_at) VALUES(?,?,?,?,?,?)`,
    companyId, to, subject, html, tr ? 'en_cours' : 'non_envoye', now()).lastInsertRowid;
  if (!tr) return { sent: false, test: true };
  try {
    await tr.t.sendMail({ from: tr.from, to, subject, html, replyTo, attachments });
    run(`UPDATE outbox SET status='envoye' WHERE id=?`, id); return { sent: true };
  } catch (e) {
    run(`UPDATE outbox SET status='echec', error=? WHERE id=?`, String(e.message || e).slice(0, 500), id);
    return { sent: false, error: true };
  }
}

/* ---------- tests et scores ---------- */
function testRow(t) {
  return { level: t.level || 'confirme', minutes: Math.ceil(estimateSecs(t) / 60), id: t.id, family: t.family || 'cc', familyName: (FAMILIES.find(f => f.k === t.family) || FAMILIES[0]).name, title: t.title, replyEmail: t.reply_email, perQ: t.per_q, count: t.count, weights: JSON.parse(t.weights),
    back: !!t.back, deadline: t.deadline || '', createdAt: t.created_at, archived: !!t.archived };
}
function expired(t) { if (!t.deadline) return false; const e = new Date(t.deadline + 'T23:59:59'); return !isNaN(e) && now() > e.getTime(); }
function pickQuestions(t) {
  // Répartit le nombre de questions entre les compétences selon les poids, puis tire au hasard.
  const w = JSON.parse(t.weights), pools = {};
  for (const c of COMPS) pools[c.k] = poolOf(t.family || 'cc', c.k).sort(() => Math.random() - .5);
  const total = COMPS.reduce((s, c) => s + (+w[c.k] || 0), 0) || 1;
  const want = {}; let n = 0;
  for (const c of COMPS) { want[c.k] = Math.min(pools[c.k].length, Math.floor(t.count * (+w[c.k] || 0) / total)); n += want[c.k]; }
  let guard = 0;
  while (n < t.count && guard++ < 200) {
    const c = COMPS.filter(c => want[c.k] < pools[c.k].length && (+w[c.k] || 0) > 0)
      .sort((a, b) => (want[a.k] / (+w[a.k])) - (want[b.k] / (+w[b.k])))[0]
      || COMPS.find(c => want[c.k] < pools[c.k].length);
    if (!c) break; want[c.k]++; n++;
  }
  const mix = (LEVELS[t.level] || LEVELS.confirme).mix, ids = [];
  for (const c of COMPS) {
    const n = want[c.k]; if (!n) continue;
    const by = { Simple: [], Moyenne: [], Difficile: [] }; for (const q of pools[c.k]) (by[q.lvl] || by.Moyenne).push(q);
    const take = {}; let got = 0;
    for (const l of Object.keys(by)) { take[l] = Math.min(by[l].length, Math.round(n * mix[l])); got += take[l]; }
    // ajuste pour obtenir exactement n questions, en privilégiant le niveau le plus représenté dans le mélange
    const order = Object.keys(mix).sort((a, b) => mix[b] - mix[a]);
    while (got > n) { const l = [...order].reverse().find(l => take[l] > 0); take[l]--; got--; }
    while (got < n) { const l = order.find(l => take[l] < by[l].length); if (!l) break; take[l]++; got++; }
    for (const l of Object.keys(by)) ids.push(...by[l].slice(0, take[l]).map(q => q.id));
  }
  return shuffle(ids);
}
function score(t, order, answers) {
  const acc = {}, detail = []; let answered = 0;
  for (const id of order) {
    const q = BANK.get(id); if (!q) continue;
    const mx = Math.max(...q.o.map(o => o[1])), a = answers[id], pts = (a == null || !q.o[a]) ? 0 : q.o[a][1];
    if (a != null) answered++;
    acc[q.c] ??= [0, 0]; acc[q.c][0] += pts; acc[q.c][1] += mx;
    detail.push({ id, c: q.c, skill: q.skill, text: q.t, options: q.o.map(o => o[0]), good: q.o.findIndex(o => o[1] === mx), answer: a ?? null });
  }
  const comp = {}; for (const c of COMPS) comp[c.k] = acc[c.k] && acc[c.k][1] ? Math.round(100 * acc[c.k][0] / acc[c.k][1]) : null;
  const w = JSON.parse(t.weights); let ws = 0, sum = 0;
  for (const c of COMPS) { const v = comp[c.k], ww = +w[c.k] || 0; if (v != null) { ws += ww; sum += ww * v; } }
  return { comp, global: ws ? Math.round(sum / ws) : 0, detail, answered, total: order.length };
}
// Durée prévue avant tirage (selon les poids), puis durée exacte une fois les questions tirées.
function estimateSecs(t) {
  const w = JSON.parse(t.weights), tot = COMPS.reduce((s, c) => s + (+w[c.k] || 0), 0) || 1;
  const nL = Math.round(t.count * (+w.L || 0) / tot); return (t.count - nL) * t.per_q + nL * Math.max(t.per_q, 60);
}
const limitSecs = (t, c) => (c && c.qorder ? JSON.parse(c.qorder).reduce((s, id) => s + qSecs(t, id), 0) : estimateSecs(t)) + 15;
function finishCandidate(c, t, timeout) {
  const order = JSON.parse(c.qorder || '[]'), answers = JSON.parse(c.answers || '{}');
  const s = score(t, order, answers), end = now();
  const secs = Math.min(limitSecs(t, c), Math.round((end - c.started_at) / 1000));
  run(`UPDATE candidates SET status='termine', ended_at=?, timeout=?, global=?, scores=?, secs=? WHERE id=?`,
    end, timeout ? 1 : 0, s.global, JSON.stringify(s.comp), secs, c.id);
  const co = q1(`SELECT name FROM companies WHERE id=?`, t.company_id);
  sendMail({ to: t.reply_email, companyId: t.company_id, subject: `Test terminé : ${c.name} (${s.global} %)`,
    html: mailLayout(`${c.name} a terminé le test`, `<p>Poste : <b>${esc(t.title)}</b><br>Note globale : <b>${s.global} %</b><br>Réponses données : ${s.answered} sur ${s.total}${timeout ? '<br>Temps dépassé' : ''}${c.exits ? `<br>Sorties de la page pendant le test : ${c.exits}` : ''}</p>
${button(`${BASE_URL}/app#/tests/${t.id}`, 'Voir le classement')}<p style="font-size:13px;color:#4A5565">${esc(co?.name || '')}</p>`) });
}
function sweep() {
  for (const c of qa(`SELECT * FROM candidates WHERE status='en_cours'`)) {
    const t = q1(`SELECT * FROM tests WHERE id=?`, c.test_id);
    if (t && (now() - c.started_at) / 1000 > limitSecs(t, c)) finishCandidate(c, t, true);
  }
  run(`DELETE FROM sessions WHERE expires<?`, now()); run(`DELETE FROM resets WHERE expires<?`, now());
}
setInterval(sweep, 30_000);

// Effacement automatique (politique de confidentialité) : résultats 12 mois après la fin du test,
// invitations jamais utilisées 3 mois après l'envoi, historique des e-mails 3 mois.
const DAY = 864e5;
function purge() {
  const a = run(`DELETE FROM candidates WHERE status='termine' AND ended_at < ?`, now() - 365 * DAY).changes;
  const b = run(`DELETE FROM candidates WHERE status='invite' AND invited_at < ?`, now() - 90 * DAY).changes;
  const m = run(`DELETE FROM outbox WHERE created_at < ?`, now() - 90 * DAY).changes;
  if (a || b || m) console.log(`Effacement automatique : ${a} résultat(s), ${b} invitation(s), ${m} e-mail(s).`);
}
purge(); setInterval(purge, 6 * 3600_000);

// Sauvegarde quotidienne de la base (14 jours conservés).
function backup() {
  const day = new Date().toISOString().slice(0, 10), f = path.join(DATA_DIR, 'backups', `genius-${day}.db`);
  if (!fs.existsSync(f)) { try { db.exec(`VACUUM INTO '${f.replace(/'/g, "''")}'`); } catch (e) { console.error('sauvegarde', e.message); } }
  for (const x of fs.readdirSync(path.join(DATA_DIR, 'backups')).sort().slice(0, -14)) fs.rmSync(path.join(DATA_DIR, 'backups', x));
}
backup(); setInterval(backup, 3600_000);

// Copie hors du serveur : chaque semaine, la dernière sauvegarde part (compressée) dans la boîte du propriétaire.
async function offsiteBackup() {
  if (!SUPERADMIN || !getTransport()) return;
  const last = +(q1(`SELECT v FROM settings WHERE k='offsite'`)?.v || 0);
  if (now() - last < 7 * 864e5) return;
  const dir = path.join(DATA_DIR, 'backups'), f = fs.readdirSync(dir).sort().pop(); if (!f) return;
  const gz = zlib.gzipSync(fs.readFileSync(path.join(dir, f)));
  const r = await sendMail({ to: SUPERADMIN, subject: `Sauvegarde Genius Recrutement du ${f.slice(7, 17)}`, attachments: [{ filename: f + '.gz', content: gz }],
    html: mailLayout('Sauvegarde hebdomadaire', `<p>Vous trouverez en pièce jointe la copie de sauvegarde de Genius Recrutement (${Math.ceil(gz.length / 1024)} Ko).</p><p>Gardez ce message : en cas de panne du serveur, cette copie permet de tout restaurer. Elle contient les données des recruteurs et des candidats : ne la transférez à personne.</p>`) });
  if (r.sent) run(`INSERT INTO settings(k,v) VALUES('offsite',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v`, String(now()));
}
setTimeout(offsiteBackup, 60_000); setInterval(offsiteBackup, 6 * 3600_000);

/* ---------- HTTP ---------- */
const MIME = { '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
function send(res, code, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(code, { 'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}
const fail = (res, code, msg) => send(res, code, { error: msg });
function serveFile(res, file, extra = {}) {
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Page introuvable');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...extra }); res.end(buf);
  });
}
async function readJson(req, max = 200_000) {
  if (!/application\/json/.test(req.headers['content-type'] || '')) throw Object.assign(new Error('Format attendu : JSON'), { code: 415 });
  let size = 0; const chunks = [];
  for await (const ch of req) { size += ch.length; if (size > max) throw Object.assign(new Error('Requête trop grande'), { code: 413 }); chunks.push(ch); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw Object.assign(new Error('JSON invalide'), { code: 400 }); }
}
function cookies(req) { const o = {}; for (const p of (req.headers.cookie || '').split(';')) { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } return o; }
const secure = BASE_URL.startsWith('https');
function setSession(res, userId) {
  const tok = rnd(32); run(`INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)`, sha(tok), userId, now() + 30 * 864e5);
  res.setHeader('Set-Cookie', `gr_s=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${secure ? '; Secure' : ''}`);
}
function currentUser(req) {
  const tok = cookies(req).gr_s; if (!tok) return null;
  return q1(`SELECT u.id,u.name,u.email,u.company_id,u.verified,u.role,c.name AS company,c.status AS cstatus FROM sessions s JOIN users u ON u.id=s.user_id JOIN companies c ON c.id=u.company_id WHERE s.token=? AND s.expires>?`, sha(tok), now()) || null;
}
const attempts = new Map();
function tooMany(key) {
  const t = now(), a = (attempts.get(key) || []).filter(x => t - x < 15 * 60_000); a.push(t); attempts.set(key, a); return a.length > 10;
}
const isSuper = u => !!SUPERADMIN && u.email === SUPERADMIN;
const userOut = u => ({ name: u.name, email: u.email, company: u.company, logo: logoUrl(u.company_id), superadmin: isSuper(u), verified: !!u.verified, companyStatus: u.cstatus || 'valide', role: u.role || 'admin' });
// Peut envoyer des e-mails aux candidats et publier des offres visibles : adresse confirmée et entreprise validée.
const canReach = u => isSuper(u) || (!!u.verified && u.cstatus === 'valide');
const reachMsg = u => !u.verified ? 'Confirmez d’abord votre adresse e-mail (lien reçu à l’inscription) : les envois aux candidats seront alors possibles.'
  : u.cstatus === 'suspendue' ? 'Le compte de votre entreprise est suspendu. Contactez consultingalveris@gmail.com.'
  : 'Votre entreprise est en cours de vérification (sous 24 heures ouvrées). Les envois aux candidats seront possibles dès la validation.';
async function sendVerify(kind, id, email, name) {
  // Sans serveur d'envoi configuré, personne ne pourrait confirmer : on ne bloque alors pas le compte.
  if (!getTransport()) { run(kind === 'user' ? `UPDATE users SET verified=1 WHERE id=?` : `UPDATE cusers SET verified=1 WHERE id=?`, id); return { sent: false, test: true }; }
  const tok = rnd(32); run(`INSERT INTO verifs(token,kind,ref_id,expires) VALUES(?,?,?,?)`, sha(tok), kind, id, now() + 3 * 864e5);
  return sendMail({ to: email, subject: 'Confirmez votre adresse e-mail', html: mailLayout('Confirmez votre adresse e-mail',
    `<p>Bonjour ${esc(name)},</p><p>Cliquez sur le bouton pour confirmer que cette adresse est bien la vôtre. Ce lien est valable 3 jours.</p>${button(`${BASE_URL}/verifier/${tok}`, 'Confirmer mon adresse')}<p style="font-size:13px;color:#4A5565">Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.</p>`) });
}

function candidateOut(c) {
  return { id: c.id, name: c.name, email: c.email, status: c.status, invitedAt: c.invited_at, startedAt: c.started_at, endedAt: c.ended_at,
    global: c.global, scores: c.scores ? JSON.parse(c.scores) : null, secs: c.secs, exits: c.exits, timeout: !!c.timeout, note: c.note || '',
    link: `${BASE_URL}/t/${c.token}`, photo: c.cu_id ? `/api/candidates/${c.id}/photo` : null };
}
function invitationMail(t, c, companyName) {
  const mins = Math.ceil(estimateSecs(t) / 60);
  return mailLayout(`${companyName} vous invite à passer un test`, `<p>Bonjour ${esc(c.name)},</p>
<p>Dans le cadre de votre candidature au poste <b>${esc(t.title)}</b>, ${esc(companyName)} vous propose un test en ligne.</p>
<p>${t.count} questions, ${t.per_q} secondes par question (60 secondes pour les calculs), soit environ ${mins} minutes. Prévoyez un moment au calme : une fois commencé, le test se fait d'une traite.${t.deadline ? `<br>À passer avant le <b>${new Date(t.deadline + 'T12:00:00').toLocaleDateString('fr-FR')}</b>.` : ''}</p>
${button(`${BASE_URL}/t/${c.token}`, 'Commencer le test')}`, t.company_id);
}

const routes = [];
const on = (method, pattern, handler, opts = {}) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler, opts });

/* comptes */
on('POST', '/api/signup', async (req, res, { body }) => {
  const company = clean(body.company, 120), name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase(), pass = String(body.password || '');
  if (!company || !name) return fail(res, 400, 'Indiquez le nom de l’entreprise et votre nom.');
  if (!isEmail(email)) return fail(res, 400, 'Adresse e-mail invalide.');
  if (pass.length < 8) return fail(res, 400, 'Le mot de passe doit faire au moins 8 caractères.');
  if (q1(`SELECT id FROM users WHERE email=?`, email)) return fail(res, 409, 'Un compte existe déjà avec cette adresse. Utilisez « Mot de passe oublié » si besoin.');
  const boss = !!SUPERADMIN && email === SUPERADMIN;
  const cid = run(`INSERT INTO companies(name,created_at,status) VALUES(?,?,?)`, company, now(), boss ? 'valide' : 'en_attente').lastInsertRowid;
  const uid = run(`INSERT INTO users(company_id,name,email,pass,created_at,verified) VALUES(?,?,?,?,?,?)`, cid, name, email, hashPass(pass), now(), boss ? 1 : 0).lastInsertRowid;
  setSession(res, uid);
  if (!boss) {
    sendVerify('user', uid, email, name);
    if (SUPERADMIN) sendMail({ to: SUPERADMIN, subject: `Nouvelle entreprise à valider : ${company}`, html: mailLayout('Nouvelle entreprise inscrite',
      `<p><b>${esc(company)}</b> vient de créer un compte (${esc(name)}, ${esc(email)}).</p><p>Vérifiez qu’il s’agit d’une vraie entreprise avant de valider : ses offres ne seront visibles qu’après votre accord.</p>${button(`${BASE_URL}/app#/admin`, 'Ouvrir l’administration')}`) });
  }
  send(res, 200, { user: userOut(currentUserById(uid)) });
});
const currentUserById = id => q1(`SELECT u.id,u.name,u.email,u.company_id,u.verified,u.role,c.name AS company,c.status AS cstatus FROM users u JOIN companies c ON c.id=u.company_id WHERE u.id=?`, id);
on('POST', '/api/login', async (req, res, { body, ip }) => {
  const email = clean(body.email, 200).toLowerCase();
  if (tooMany('l:' + ip + email)) return fail(res, 429, 'Trop de tentatives. Réessayez dans 15 minutes.');
  const u = q1(`SELECT * FROM users WHERE email=?`, email);
  if (!u || !checkPass(String(body.password || ''), u.pass)) return fail(res, 401, 'Adresse e-mail ou mot de passe incorrect.');
  setSession(res, u.id); send(res, 200, { user: userOut(currentUserById(u.id)) });
});
on('POST', '/api/logout', async (req, res) => {
  const tok = cookies(req).gr_s; if (tok) run(`DELETE FROM sessions WHERE token=?`, sha(tok));
  res.setHeader('Set-Cookie', 'gr_s=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'); send(res, 200, { ok: true });
});
on('GET', '/api/me', async (req, res, { user }) => send(res, 200, { user: user ? userOut(user) : null }));
on('POST', '/api/forgot', async (req, res, { body, ip }) => {
  const email = clean(body.email, 200).toLowerCase();
  if (tooMany('f:' + ip)) return fail(res, 429, 'Trop de demandes. Réessayez plus tard.');
  const u = q1(`SELECT * FROM users WHERE email=?`, email);
  if (u) {
    const tok = rnd(32); run(`INSERT INTO resets(token,user_id,expires) VALUES(?,?,?)`, sha(tok), u.id, now() + 3600_000);
    await sendMail({ to: email, companyId: u.company_id, subject: 'Choisir un nouveau mot de passe',
      html: mailLayout('Nouveau mot de passe', `<p>Bonjour ${esc(u.name)},</p><p>Vous avez demandé à changer votre mot de passe. Ce lien est valable une heure.</p>${button(`${BASE_URL}/app#/reset/${tok}`, 'Choisir un nouveau mot de passe')}<p style="font-size:13px;color:#4A5565">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`) });
  }
  send(res, 200, { ok: true });
});
on('POST', '/api/reset', async (req, res, { body }) => {
  const r = q1(`SELECT * FROM resets WHERE token=? AND expires>?`, sha(String(body.token || '')), now());
  if (!r) return fail(res, 400, 'Ce lien n’est plus valable. Refaites une demande.');
  if (String(body.password || '').length < 8) return fail(res, 400, 'Le mot de passe doit faire au moins 8 caractères.');
  run(`UPDATE users SET pass=? WHERE id=?`, hashPass(String(body.password)), r.user_id);
  run(`DELETE FROM resets WHERE user_id=?`, r.user_id); run(`DELETE FROM sessions WHERE user_id=?`, r.user_id);
  setSession(res, r.user_id); send(res, 200, { user: userOut(currentUserById(r.user_id)) });
});
on('POST', '/api/password', async (req, res, { user, body }) => {
  const u = q1(`SELECT * FROM users WHERE id=?`, user.id);
  if (!checkPass(String(body.current || ''), u.pass)) return fail(res, 400, 'Mot de passe actuel incorrect.');
  if (String(body.password || '').length < 8) return fail(res, 400, 'Le nouveau mot de passe doit faire au moins 8 caractères.');
  run(`UPDATE users SET pass=? WHERE id=?`, hashPass(String(body.password)), user.id); send(res, 200, { ok: true });
}, { auth: true });

/* logo de l'entreprise */
on('PUT', '/api/company/logo', async (req, res, { user, body }) => {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl || ''));
  if (!m) return fail(res, 400, 'Format accepté : PNG, JPEG ou WebP.');
  if (m[2].length > 400_000) return fail(res, 413, 'Image trop lourde (300 Ko au plus).');
  run(`UPDATE companies SET logo=?, logo_v=? WHERE id=?`, body.dataUrl, now(), user.company_id);
  send(res, 200, { logo: logoUrl(user.company_id) });
}, { auth: true, maxBody: 600_000 });
on('DELETE', '/api/company/logo', async (req, res, { user }) => {
  run(`UPDATE companies SET logo=NULL, logo_v=NULL WHERE id=?`, user.company_id); send(res, 200, { ok: true });
}, { auth: true });
on('GET', '/api/logo/:id', async (req, res, { params }) => {
  const r = q1(`SELECT logo FROM companies WHERE id=?`, +params.id);
  const m = r && r.logo && /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(r.logo);
  if (!m) return send(res, 404, 'Pas de logo');
  res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=31536000, immutable' }); res.end(Buffer.from(m[2], 'base64'));
});

/* tests */
function readTestBody(body, user) {
  const title = clean(body.title, 160), reply = clean(body.replyEmail || user.email, 200).toLowerCase();
  const family = famOk(body.family) ? body.family : 'cc';
  const perQ = Math.min(120, Math.max(10, Math.round(+body.perQ || 20))), count = Math.min(40, Math.max(5, Math.round(+body.count || 30)));
  const weights = {}; for (const c of COMPS) weights[c.k] = Math.min(100, Math.max(0, Math.round(+(body.weights?.[c.k] ?? DEFAULT_WEIGHTS[c.k]))));
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(body.deadline || '') ? body.deadline : null;
  if (!title) throw Object.assign(new Error('Indiquez l’intitulé du poste.'), { code: 400 });
  if (!isEmail(reply)) throw Object.assign(new Error('Adresse de réception des résultats invalide.'), { code: 400 });
  if (!Object.values(weights).some(v => v > 0)) throw Object.assign(new Error('Au moins une compétence doit compter.'), { code: 400 });
  const level = LEVELS[body.level] ? body.level : 'confirme';
  return { family, title, reply, perQ, count, weights: JSON.stringify(weights), back: body.back === false ? 0 : 1, deadline, level };
}
const ownTest = (user, id) => q1(`SELECT * FROM tests WHERE id=? AND company_id=?`, +id, user.company_id);
on('GET', '/api/meta', async (req, res) => send(res, 200, { comps: COMPS.map(c => ({ k: c.k, name: c.name, short: c.short, desc: c.desc, ask: c.ask })), bankSize: QDATA.bank.length,
  families: FAMILIES.map(f => ({ ...f, counts: Object.fromEntries(COMPS.map(c => [c.k, poolOf(f.k, c.k).length])) })), defaults: { perQ: 20, count: 30, weights: DEFAULT_WEIGHTS, level: 'confirme' }, levels: Object.entries(LEVELS).map(([k, v]) => ({ k, name: v.name })) }));
on('GET', '/api/tests', async (req, res, { user }) => {
  const rows = qa(`SELECT t.*, (SELECT COUNT(*) FROM candidates c WHERE c.test_id=t.id) AS n,
    (SELECT COUNT(*) FROM candidates c WHERE c.test_id=t.id AND c.status='termine') AS done FROM tests t WHERE company_id=? ORDER BY archived, created_at DESC`, user.company_id);
  send(res, 200, { tests: rows.map(t => ({ ...testRow(t), candidates: t.n, done: t.done, expired: expired(t) })) });
}, { auth: true });
on('POST', '/api/tests', async (req, res, { user, body }) => {
  const b = readTestBody(body, user);
  const id = run(`INSERT INTO tests(company_id,family,title,reply_email,per_q,count,weights,back,deadline,created_at,level) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    user.company_id, b.family, b.title, b.reply, b.perQ, b.count, b.weights, b.back, b.deadline, now(), b.level).lastInsertRowid;
  send(res, 200, { id });
}, { auth: true });
on('GET', '/api/tests/:id', async (req, res, { user, params }) => {
  const t = ownTest(user, params.id); if (!t) return fail(res, 404, 'Test introuvable.');
  const cands = qa(`SELECT * FROM candidates WHERE test_id=? ORDER BY CASE status WHEN 'termine' THEN 0 WHEN 'en_cours' THEN 1 ELSE 2 END, global DESC, secs ASC, invited_at DESC`, t.id);
  send(res, 200, { test: { ...testRow(t), expired: expired(t) }, candidates: cands.map(candidateOut) });
}, { auth: true });
on('PUT', '/api/tests/:id', async (req, res, { user, params, body }) => {
  const t = ownTest(user, params.id); if (!t) return fail(res, 404, 'Test introuvable.');
  if (body.archived != null && Object.keys(body).length === 1) { run(`UPDATE tests SET archived=? WHERE id=?`, body.archived ? 1 : 0, t.id); return send(res, 200, { ok: true }); }
  const started = q1(`SELECT COUNT(*) AS n FROM candidates WHERE test_id=? AND status!='invite'`, t.id).n;
  const b = readTestBody(body, user);
  if (started && (b.count !== t.count || b.perQ !== t.per_q || b.weights !== t.weights || b.family !== (t.family || 'cc') || b.level !== (t.level || 'confirme')))
    return fail(res, 409, 'Des candidats ont déjà commencé ce test : le métier, le nombre de questions, le temps et les poids ne peuvent plus changer. Créez un nouveau test si besoin.');
  run(`UPDATE tests SET family=?,title=?,reply_email=?,per_q=?,count=?,weights=?,back=?,deadline=?,level=? WHERE id=?`, b.family, b.title, b.reply, b.perQ, b.count, b.weights, b.back, b.deadline, b.level, t.id);
  send(res, 200, { ok: true });
}, { auth: true });
on('DELETE', '/api/tests/:id', async (req, res, { user, params }) => {
  const t = ownTest(user, params.id); if (!t) return fail(res, 404, 'Test introuvable.');
  run(`DELETE FROM tests WHERE id=?`, t.id); send(res, 200, { ok: true });
}, { auth: true });

/* candidats */
on('POST', '/api/tests/:id/invite', async (req, res, { user, params, body }) => {
  const t = ownTest(user, params.id); if (!t) return fail(res, 404, 'Test introuvable.');
  const list = Array.isArray(body.candidates) ? body.candidates.slice(0, 300) : [];
  const out = { added: 0, sent: 0, test: 0, failed: 0, skipped: [] };
  if (body.send !== false && !canReach(user)) { body.send = false; out.blocked = reachMsg(user); }
  for (const x of list) {
    const name = clean(x.name, 120), email = clean(x.email, 200).toLowerCase();
    if (!name || !isEmail(email)) { out.skipped.push(`${name || '?'} <${email || '?'}> : nom ou e-mail invalide`); continue; }
    if (q1(`SELECT id FROM candidates WHERE test_id=? AND email=?`, t.id, email)) { out.skipped.push(`${email} : déjà invité à ce test`); continue; }
    const c = { name, email, token: rnd(18) };
    c.id = run(`INSERT INTO candidates(test_id,name,email,token,invited_at) VALUES(?,?,?,?,?)`, t.id, name, email, c.token, now()).lastInsertRowid;
    out.added++;
    if (body.send !== false) {
      const r = await sendMail({ to: email, companyId: t.company_id, replyTo: t.reply_email, subject: `${user.company} : votre test pour le poste ${t.title}`, html: invitationMail(t, c, user.company) });
      r.sent ? out.sent++ : r.test ? out.test++ : out.failed++;
    }
  }
  send(res, 200, out);
}, { auth: true });
const ownCand = (user, id) => q1(`SELECT c.*, t.company_id FROM candidates c JOIN tests t ON t.id=c.test_id WHERE c.id=? AND t.company_id=?`, +id, user.company_id);
on('POST', '/api/candidates/:id/resend', async (req, res, { user, params }) => {
  const c = ownCand(user, params.id); if (!c) return fail(res, 404, 'Candidat introuvable.');
  if (!canReach(user)) return fail(res, 403, reachMsg(user));
  const t = q1(`SELECT * FROM tests WHERE id=?`, c.test_id);
  const r = await sendMail({ to: c.email, companyId: t.company_id, replyTo: t.reply_email, subject: `Rappel — ${user.company} : votre test pour le poste ${t.title}`, html: invitationMail(t, c, user.company) });
  send(res, 200, r);
}, { auth: true });
on('PUT', '/api/candidates/:id', async (req, res, { user, params, body }) => {
  const c = ownCand(user, params.id); if (!c) return fail(res, 404, 'Candidat introuvable.');
  run(`UPDATE candidates SET note=? WHERE id=?`, clean(body.note, 2000), c.id); send(res, 200, { ok: true });
}, { auth: true });
on('DELETE', '/api/candidates/:id', async (req, res, { user, params }) => {
  const c = ownCand(user, params.id); if (!c) return fail(res, 404, 'Candidat introuvable.');
  run(`DELETE FROM candidates WHERE id=?`, c.id); send(res, 200, { ok: true });
}, { auth: true });
on('GET', '/api/candidates/:id', async (req, res, { user, params }) => {
  const c = ownCand(user, params.id); if (!c) return fail(res, 404, 'Candidat introuvable.');
  const t = q1(`SELECT * FROM tests WHERE id=?`, c.test_id);
  const detail = c.qorder ? score(t, JSON.parse(c.qorder), JSON.parse(c.answers || '{}')) : null;
  send(res, 200, { candidate: candidateOut(c), detail });
}, { auth: true });
on('GET', '/api/candidates/:id/photo', async (req, res, { user, params }) => {
  const c = ownCand(user, params.id); const r = c && c.cu_id && q1(`SELECT photo FROM cusers WHERE id=?`, c.cu_id);
  const m = r && r.photo && /^data:(image\/[a-z]+);base64,(.+)$/.exec(r.photo);
  if (!m) return send(res, 404, 'Pas de photo'); res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'private, max-age=3600' }); res.end(Buffer.from(m[2], 'base64'));
}, { auth: true });
on('GET', '/api/tests/:id/export.csv', async (req, res, { user, params }) => {
  const t = ownTest(user, params.id); if (!t) return fail(res, 404, 'Test introuvable.');
  const cands = qa(`SELECT * FROM candidates WHERE test_id=? ORDER BY status='termine' DESC, global DESC, secs ASC`, t.id);
  const st = { invite: 'Invité', en_cours: 'En cours', termine: 'Terminé' };
  const cell = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = ['Rang', 'Candidat', 'E-mail', 'Statut', 'Note globale (%)', ...COMPS.map(c => c.short + ' (%)'), 'Durée (s)', 'Sorties de page', 'Temps dépassé', 'Invité le', 'Terminé le', 'Note du recruteur'];
  let rank = 0; const fmt = ms => ms ? new Date(ms).toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' }) : '';
  const lines = cands.map(c => { const sc = c.scores ? JSON.parse(c.scores) : {}; return [c.status === 'termine' ? ++rank : '', c.name, c.email, st[c.status], c.global ?? '', ...COMPS.map(k => sc[k.k] ?? ''), c.secs ?? '', c.exits, c.timeout ? 'oui' : '', fmt(c.invited_at), fmt(c.ended_at), c.note || ''].map(cell).join(';'); });
  const csv = '﻿' + [head.map(cell).join(';'), ...lines].join('\r\n');
  const fname = `resultats-${t.title.normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50) || 'test'}.csv`;
  send(res, 200, csv, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fname}"` });
}, { auth: true });
on('GET', '/api/outbox', async (req, res, { user }) => {
  send(res, 200, { mailConfigured: !!getTransport(), mails: qa(`SELECT id,recipient,subject,status,error,created_at FROM outbox WHERE company_id=? ORDER BY id DESC LIMIT 100`, user.company_id) });
}, { auth: true });
on('GET', '/api/outbox/:id', async (req, res, { user, params }) => {
  const m = q1(`SELECT * FROM outbox WHERE id=? AND company_id=?`, +params.id, user.company_id); if (!m) return fail(res, 404, 'Message introuvable.');
  send(res, 200, { mail: m });
}, { auth: true });

/* réglages e-mail (propriétaire de la plateforme) */
on('GET', '/api/admin/mail', async (req, res, { user }) => {
  if (!userOut(user).superadmin) return fail(res, 403, 'Réservé au propriétaire de la plateforme.');
  const m = mailSettings() || {}; send(res, 200, { host: m.host || '', port: m.port || 587, user: m.user || '', from: m.from || '', hasPass: !!m.pass,
    stats: qa(`SELECT status, COUNT(*) AS n FROM outbox GROUP BY status`) });
}, { auth: true });
on('PUT', '/api/admin/mail', async (req, res, { user, body }) => {
  if (!userOut(user).superadmin) return fail(res, 403, 'Réservé au propriétaire de la plateforme.');
  const old = mailSettings() || {};
  const m = { host: clean(body.host, 200), port: Math.round(+body.port || 587), user: clean(body.user, 200), from: clean(body.from, 200), pass: body.pass ? String(body.pass).slice(0, 500) : old.pass };
  run(`INSERT INTO settings(k,v) VALUES('mail',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v`, JSON.stringify(m));
  const tr = getTransport(); if (!tr) return send(res, 200, { ok: true, verified: false, message: 'Réglages enregistrés, mais incomplets : les e-mails ne partent pas encore.' });
  try { await tr.t.verify(); } catch (e) { return send(res, 200, { ok: true, verified: false, message: 'Réglages enregistrés, mais le service d’envoi refuse la connexion : ' + String(e.message).slice(0, 200) }); }
  const r = await sendMail({ to: user.email, subject: 'Test d’envoi Genius Recrutement', html: mailLayout('Les e-mails fonctionnent', '<p>Ce message confirme que Genius Recrutement peut envoyer des e-mails.</p>') });
  if (r.sent) setTimeout(offsiteBackup, 5000);
  send(res, 200, { ok: true, verified: r.sent, message: r.sent ? `Connexion réussie. Un e-mail d’essai vient de partir vers ${user.email}.` : 'Connexion réussie, mais l’e-mail d’essai a échoué.' });
}, { auth: true });

/* passage du test (candidat, sans compte) */
const candByToken = tok => q1(`SELECT * FROM candidates WHERE token=?`, String(tok));
function permsOf(c) { return c.perms ? JSON.parse(c.perms) : {}; }
function spentOf(c) {
  const q = c.qtime ? JSON.parse(c.qtime) : {};
  if (c.cur && c.cur_since) q[c.cur] = (q[c.cur] || 0) + (now() - c.cur_since) / 1000;
  return q;
}
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function publicState(c, t) {
  const co = q1(`SELECT name FROM companies WHERE id=?`, t.company_id);
  const base = { company: co?.name || '', logo: logoUrl(t.company_id), title: t.title, name: c.name, count: t.count, perQ: t.per_q, minutes: Math.ceil(estimateSecs(t) / 60), back: !!t.back, status: c.status,
    expired: c.status === 'invite' && expired(t), deadline: t.deadline || '' };
  if (c.status !== 'en_cours') return base;
  const order = JSON.parse(c.qorder), answers = JSON.parse(c.answers || '{}'), perms = permsOf(c), spent = spentOf(c);
  const shown = {}; for (const [id, a] of Object.entries(answers)) shown[id] = perms[id] ? perms[id].indexOf(a) : a;
  return { ...base, elapsed: Math.round((now() - c.started_at) / 1000), limit: limitSecs(t, c), answers: shown, spent, current: c.cur || null,
    questions: order.map(id => { const q = BANK.get(id), p = perms[id] || q.o.map((_, i) => i); return { id, skill: q.skill, text: q.t, time: qSecs(t, id), options: p.map(i => q.o[i][0]) }; }) };
}
function candContext(params) {
  const c = candByToken(params.token); if (!c) return null;
  const t = q1(`SELECT * FROM tests WHERE id=?`, c.test_id);
  if (c.status === 'en_cours' && (now() - c.started_at) / 1000 > limitSecs(t, c)) { finishCandidate(c, t, true); return candContext(params); }
  return { c, t };
}
on('GET', '/api/c/:token', async (req, res, { params }) => {
  const x = candContext(params); if (!x) return fail(res, 404, 'Ce lien de test n’existe pas.'); send(res, 200, publicState(x.c, x.t));
});
on('POST', '/api/c/:token/start', async (req, res, { params, body }) => {
  const x = candContext(params); if (!x) return fail(res, 404, 'Ce lien de test n’existe pas.');
  const { c, t } = x;
  if (c.status === 'invite') {
    if (expired(t)) return fail(res, 410, 'La date limite de ce test est passée.');
    if (!body.consent) return fail(res, 400, 'Merci d’accepter les conditions avant de commencer.');
    const order = pickQuestions(t), perms = {};
    for (const id of order) perms[id] = shuffle(BANK.get(id).o.map((_, i) => i));
    run(`UPDATE candidates SET status='en_cours', started_at=?, qorder=?, answers='{}', perms=?, qtime='{}', cur=?, cur_since=? WHERE id=? AND status='invite'`,
      now(), JSON.stringify(order), JSON.stringify(perms), order[0], now(), c.id);
  }
  const y = candContext(params); send(res, 200, publicState(y.c, y.t));
});
on('POST', '/api/c/:token/answer', async (req, res, { params, body }) => {
  const x = candContext(params); if (!x) return fail(res, 404, 'Ce lien de test n’existe pas.');
  const { c, t } = x; if (c.status !== 'en_cours') return fail(res, 409, 'Le test est terminé.');
  const order = JSON.parse(c.qorder), answers = JSON.parse(c.answers || '{}');
  if (!order.includes(body.id)) return fail(res, 400, 'Question inconnue.');
  const q = BANK.get(body.id), k = body.answer == null ? null : Math.round(+body.answer);
  if (k != null && !(k >= 0 && k < q.o.length)) return fail(res, 400, 'Réponse invalide.');
  const perm = permsOf(c)[body.id], a = k == null ? null : (perm ? perm[k] : k);
  if ((spentOf(c)[body.id] || 0) > qSecs(t, body.id) + 3) return fail(res, 409, 'Le temps de cette question est écoulé.');
  if (a == null) delete answers[body.id]; else answers[body.id] = a;
  run(`UPDATE candidates SET answers=? WHERE id=?`, JSON.stringify(answers), c.id); send(res, 200, { ok: true });
});
on('POST', '/api/c/:token/view', async (req, res, { params, body }) => {
  // Le candidat affiche une question : on clôt le chronomètre de la précédente et on lance celui-ci (contrôle côté serveur).
  const x = candContext(params); if (!x) return fail(res, 404, 'Ce lien de test n’existe pas.');
  const { c } = x; if (c.status !== 'en_cours') return fail(res, 409, 'Le test est terminé.');
  if (!JSON.parse(c.qorder).includes(body.id)) return fail(res, 400, 'Question inconnue.');
  const q = c.qtime ? JSON.parse(c.qtime) : {};
  if (c.cur && c.cur_since) q[c.cur] = (q[c.cur] || 0) + (now() - c.cur_since) / 1000;
  run(`UPDATE candidates SET qtime=?, cur=?, cur_since=? WHERE id=?`, JSON.stringify(q), body.id, now(), c.id);
  send(res, 200, { spent: q[body.id] || 0 });
});
on('POST', '/api/c/:token/exit', async (req, res, { params }) => {
  const x = candContext(params); if (x && x.c.status === 'en_cours') run(`UPDATE candidates SET exits=exits+1 WHERE id=?`, x.c.id); send(res, 200, { ok: true });
});
on('POST', '/api/c/:token/finish', async (req, res, { params }) => {
  const x = candContext(params); if (!x) return fail(res, 404, 'Ce lien de test n’existe pas.');
  if (x.c.status === 'en_cours') finishCandidate(x.c, x.t, (now() - x.c.started_at) / 1000 >= limitSecs(x.t, x.c) - 15);
  send(res, 200, { ok: true });
});


/* =====================================================================
   ESPACE CANDIDAT : comptes candidats, CV, offres, candidatures, alertes
   ===================================================================== */
db.exec(`
CREATE TABLE IF NOT EXISTS cusers(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, pass TEXT NOT NULL,
  phone TEXT, city TEXT, family TEXT, headline TEXT, photo TEXT, cv_name TEXT, cv_at INTEGER, alerts INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS csessions(token TEXT PRIMARY KEY, cu_id INTEGER NOT NULL REFERENCES cusers(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS cresets(token TEXT PRIMARY KEY, cu_id INTEGER NOT NULL REFERENCES cusers(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS offers(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  test_id INTEGER REFERENCES tests(id) ON DELETE SET NULL, auto_test INTEGER NOT NULL DEFAULT 1, title TEXT NOT NULL, family TEXT NOT NULL,
  city TEXT, contract TEXT, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ouverte', created_at INTEGER NOT NULL, closes_at TEXT);
CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY, offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  cu_id INTEGER NOT NULL REFERENCES cusers(id) ON DELETE CASCADE, candidate_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL,
  message TEXT, status TEXT NOT NULL DEFAULT 'recue', created_at INTEGER NOT NULL, UNIQUE(offer_id, cu_id));
CREATE TABLE IF NOT EXISTS push_subs(endpoint TEXT PRIMARY KEY, cu_id INTEGER NOT NULL REFERENCES cusers(id) ON DELETE CASCADE, data TEXT NOT NULL, created_at INTEGER NOT NULL);
`);
try { db.exec(`ALTER TABLE candidates ADD COLUMN cu_id INTEGER`); } catch {}
try { db.exec(`ALTER TABLE cusers ADD COLUMN verified INTEGER NOT NULL DEFAULT 1`); } catch {}
try { db.exec(`ALTER TABLE applications ADD COLUMN stage TEXT NOT NULL DEFAULT 'nouvelle'`); db.exec(`UPDATE applications SET stage='preselection' WHERE status='retenue'`); db.exec(`UPDATE applications SET stage='refusee' WHERE status='refusee'`); } catch {}
try { db.exec(`ALTER TABLE offers ADD COLUMN announced INTEGER NOT NULL DEFAULT 1`); } catch {}
try { db.exec(`ALTER TABLE offers ADD COLUMN views INTEGER NOT NULL DEFAULT 0`); } catch {}
// Une vue comptée par visiteur et par offre toutes les 12 heures (empreinte anonyme, jamais stockée en clair).
const seenViews = new Map();
function countView(req, offerId) {
  const ua = String(req.headers['user-agent'] || '');
  if (/bot|crawl|spider|facebookexternalhit|whatsapp|linkedinbot|slurp|preview/i.test(ua)) return;
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const k = sha(ip + '|' + ua + '|' + offerId), t = seenViews.get(k);
  if (t && now() - t < 12 * 3600_000) return;
  seenViews.set(k, now()); if (seenViews.size > 50000) seenViews.clear();
  run(`UPDATE offers SET views=views+1 WHERE id=?`, offerId);
}
const CV_DIR = path.join(DATA_DIR, 'cv'); fs.mkdirSync(CV_DIR, { recursive: true });
const CONTRACTS = ['CDI', 'CDD', 'Stage', 'Alternance', 'Consultance', 'Intérim', 'Freelance', 'Temps partiel'];
const famName = k => (FAMILIES.find(f => f.k === k) || {}).name || '';

// Notifications sur téléphone (Web Push) : clés générées une fois et gardées dans la base.
let vapid = q1(`SELECT v FROM settings WHERE k='vapid'`);
vapid = vapid ? JSON.parse(vapid.v) : (() => { const k = webpush.generateVAPIDKeys(); run(`INSERT INTO settings(k,v) VALUES('vapid',?)`, JSON.stringify(k)); return k; })();
webpush.setVapidDetails('mailto:' + (SUPERADMIN || 'consultingalveris@gmail.com'), vapid.publicKey, vapid.privateKey);
async function pushTo(cuId, payload) {
  for (const s of qa(`SELECT * FROM push_subs WHERE cu_id=?`, cuId)) {
    try { await webpush.sendNotification(JSON.parse(s.data), JSON.stringify(payload), { TTL: 86400 }); }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) run(`DELETE FROM push_subs WHERE endpoint=?`, s.endpoint); }
  }
}

/* sessions candidat (cookie séparé de celui des recruteurs) */
function setCSession(res, cuId) {
  const tok = rnd(32); run(`INSERT INTO csessions(token,cu_id,expires) VALUES(?,?,?)`, sha(tok), cuId, now() + 60 * 864e5);
  res.setHeader('Set-Cookie', `gr_c=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 86400}${secure ? '; Secure' : ''}`);
}
function currentCand(req) {
  const tok = cookies(req).gr_c; if (!tok) return null;
  return q1(`SELECT u.* FROM csessions s JOIN cusers u ON u.id=s.cu_id WHERE s.token=? AND s.expires>?`, sha(tok), now()) || null;
}
const candOut = u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', city: u.city || '', family: u.family || '', headline: u.headline || '',
  photo: u.photo ? `/api/cphoto/${u.id}?v=${u.cv_at || 0}${u.photo.length % 997}` : null, cv: u.cv_name || null, alerts: !!u.alerts, verified: !!u.verified });
const withCand = h => async (req, res, ctx) => { const cu = currentCand(req); if (!cu) return fail(res, 401, 'Connectez-vous à votre espace candidat.'); return h(req, res, { ...ctx, cu }); };

on('POST', '/api/cand/signup', async (req, res, { body }) => {
  const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase(), pass = String(body.password || '');
  if (!name) return fail(res, 400, 'Indiquez votre nom.');
  if (!isEmail(email)) return fail(res, 400, 'Adresse e-mail invalide.');
  if (pass.length < 8) return fail(res, 400, 'Le mot de passe doit faire au moins 8 caractères.');
  if (!body.consent) return fail(res, 400, 'Merci d’accepter la politique de confidentialité.');
  if (q1(`SELECT id FROM cusers WHERE email=?`, email)) return fail(res, 409, 'Un compte candidat existe déjà avec cette adresse. Utilisez « Mot de passe oublié » si besoin.');
  const id = run(`INSERT INTO cusers(name,email,pass,phone,city,family,created_at,verified) VALUES(?,?,?,?,?,?,?,0)`, name, email, hashPass(pass),
    clean(body.phone, 40), clean(body.city, 80), famOk(body.family) ? body.family : null, now()).lastInsertRowid;
  setCSession(res, id);
  sendVerify('cand', id, email, name);
  send(res, 200, { me: candOut(q1(`SELECT * FROM cusers WHERE id=?`, id)) });
});
on('POST', '/api/cand/login', async (req, res, { body, ip }) => {
  const email = clean(body.email, 200).toLowerCase();
  if (tooMany('cl:' + ip + email)) return fail(res, 429, 'Trop de tentatives. Réessayez dans 15 minutes.');
  const u = q1(`SELECT * FROM cusers WHERE email=?`, email);
  if (!u || !checkPass(String(body.password || ''), u.pass)) return fail(res, 401, 'Adresse e-mail ou mot de passe incorrect.');
  setCSession(res, u.id); send(res, 200, { me: candOut(u) });
});
on('POST', '/api/cand/logout', async (req, res) => {
  const tok = cookies(req).gr_c; if (tok) run(`DELETE FROM csessions WHERE token=?`, sha(tok));
  res.setHeader('Set-Cookie', 'gr_c=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'); send(res, 200, { ok: true });
});
on('GET', '/api/cand/me', async (req, res) => { const cu = currentCand(req); send(res, 200, { me: cu ? candOut(cu) : null, families: FAMILIES, contracts: CONTRACTS, vapid: vapid.publicKey }); });
on('POST', '/api/cand/forgot', async (req, res, { body, ip }) => {
  if (tooMany('cf:' + ip)) return fail(res, 429, 'Trop de demandes. Réessayez plus tard.');
  const u = q1(`SELECT * FROM cusers WHERE email=?`, clean(body.email, 200).toLowerCase());
  if (u) {
    const tok = rnd(32); run(`INSERT INTO cresets(token,cu_id,expires) VALUES(?,?,?)`, sha(tok), u.id, now() + 3600_000);
    await sendMail({ to: u.email, subject: 'Choisir un nouveau mot de passe', html: mailLayout('Nouveau mot de passe',
      `<p>Bonjour ${esc(u.name)},</p><p>Ce lien est valable une heure.</p>${button(`${BASE_URL}/espace#/reset/${tok}`, 'Choisir un nouveau mot de passe')}`) });
  }
  send(res, 200, { ok: true });
});
on('POST', '/api/cand/reset', async (req, res, { body }) => {
  const r = q1(`SELECT * FROM cresets WHERE token=? AND expires>?`, sha(String(body.token || '')), now());
  if (!r) return fail(res, 400, 'Ce lien n’est plus valable. Refaites une demande.');
  if (String(body.password || '').length < 8) return fail(res, 400, 'Le mot de passe doit faire au moins 8 caractères.');
  run(`UPDATE cusers SET pass=? WHERE id=?`, hashPass(String(body.password)), r.cu_id);
  run(`DELETE FROM cresets WHERE cu_id=?`, r.cu_id); run(`DELETE FROM csessions WHERE cu_id=?`, r.cu_id);
  setCSession(res, r.cu_id); send(res, 200, { me: candOut(q1(`SELECT * FROM cusers WHERE id=?`, r.cu_id)) });
});
on('PUT', '/api/cand/profile', withCand(async (req, res, { cu, body }) => {
  const name = clean(body.name, 120); if (!name) return fail(res, 400, 'Indiquez votre nom.');
  run(`UPDATE cusers SET name=?, phone=?, city=?, family=?, headline=?, alerts=? WHERE id=?`, name, clean(body.phone, 40), clean(body.city, 80),
    famOk(body.family) ? body.family : null, clean(body.headline, 160), body.alerts === false ? 0 : 1, cu.id);
  send(res, 200, { me: candOut(q1(`SELECT * FROM cusers WHERE id=?`, cu.id)) });
}));
on('PUT', '/api/cand/photo', withCand(async (req, res, { cu, body }) => {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl || ''));
  if (!m) return fail(res, 400, 'Format accepté : PNG, JPEG ou WebP.');
  if (m[2].length > 400_000) return fail(res, 413, 'Photo trop lourde.');
  run(`UPDATE cusers SET photo=? WHERE id=?`, body.dataUrl, cu.id); send(res, 200, { me: candOut(q1(`SELECT * FROM cusers WHERE id=?`, cu.id)) });
}), { maxBody: 600_000 });
on('DELETE', '/api/cand/photo', withCand(async (req, res, { cu }) => { run(`UPDATE cusers SET photo=NULL WHERE id=?`, cu.id); send(res, 200, { me: candOut(q1(`SELECT * FROM cusers WHERE id=?`, cu.id)) }); }));
on('GET', '/api/cphoto/:id', async (req, res, { params }) => {
  const r = q1(`SELECT photo FROM cusers WHERE id=?`, +params.id), m = r && r.photo && /^data:(image\/[a-z]+);base64,(.+)$/.exec(r.photo);
  if (!m) return send(res, 404, 'Pas de photo');
  res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'private, max-age=86400' }); res.end(Buffer.from(m[2], 'base64'));
});
on('PUT', '/api/cand/cv', withCand(async (req, res, { cu, body }) => {
  const buf = Buffer.from(String(body.data || ''), 'base64');
  if (buf.length < 100 || buf.subarray(0, 5).toString() !== '%PDF-') return fail(res, 400, 'Le CV doit être un fichier PDF.');
  if (buf.length > 3 * 1024 * 1024) return fail(res, 413, 'Le CV ne doit pas dépasser 3 Mo.');
  fs.writeFileSync(path.join(CV_DIR, `${cu.id}.pdf`), buf);
  run(`UPDATE cusers SET cv_name=?, cv_at=? WHERE id=?`, clean(body.name, 120) || 'CV.pdf', now(), cu.id);
  send(res, 200, { me: candOut(q1(`SELECT * FROM cusers WHERE id=?`, cu.id)) });
}), { maxBody: 4_600_000 });
function sendCv(res, cuId, name) {
  const f = path.join(CV_DIR, `${cuId}.pdf`); if (!fs.existsSync(f)) return fail(res, 404, 'Pas de CV.');
  res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${String(name || 'CV.pdf').replace(/[^\w.\- ]/g, '_')}"`, 'Cache-Control': 'private, no-store' });
  fs.createReadStream(f).pipe(res);
}
on('GET', '/api/cand/cv', withCand(async (req, res, { cu }) => sendCv(res, cu.id, cu.cv_name)));
on('DELETE', '/api/cand/account', withCand(async (req, res, { cu }) => {
  try { fs.rmSync(path.join(CV_DIR, `${cu.id}.pdf`)); } catch {}
  run(`UPDATE candidates SET cu_id=NULL WHERE cu_id=?`, cu.id); run(`DELETE FROM cusers WHERE id=?`, cu.id);
  res.setHeader('Set-Cookie', 'gr_c=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'); send(res, 200, { ok: true });
}));
on('POST', '/api/cand/push', withCand(async (req, res, { cu, body }) => {
  const s = body.subscription; if (!s || !/^https:\/\//.test(s.endpoint || '')) return fail(res, 400, 'Abonnement invalide.');
  run(`INSERT INTO push_subs(endpoint,cu_id,data,created_at) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET cu_id=excluded.cu_id, data=excluded.data`, s.endpoint, cu.id, JSON.stringify(s), now());
  pushTo(cu.id, { title: 'Alertes activées', body: 'Vous serez prévenu dès qu’une offre de votre domaine est publiée.', url: '/espace#/offres' });
  send(res, 200, { ok: true });
}));

/* offres : lecture publique */
const offerStatus = o => o.status !== 'ouverte' ? 'fermee' : (o.closes_at && now() > new Date(o.closes_at + 'T23:59:59').getTime() ? 'fermee' : 'ouverte');
const offerOut = (o, extra = {}) => ({ url: `${BASE_URL}/offre/${o.id}-${String(o.title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}`, id: o.id, title: o.title, family: o.family, familyName: famName(o.family), city: o.city || '', contract: o.contract || '',
  description: o.description, createdAt: o.created_at, closesAt: o.closes_at || '', status: offerStatus(o), company: o.company, companyLogo: o.logo_v ? `/api/logo/${o.company_id}?v=${o.logo_v}` : null,
  hasTest: !!o.test_id, ...extra });

/* page publique d'une offre, partageable (WhatsApp, LinkedIn, Facebook) avec aperçu */
const slug = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const offerUrl = o => `${BASE_URL}/offre/${o.id}-${slug(o.title)}`;
function offerPage(o) {
  const st = offerStatus(o), where = [o.company, o.city, o.contract].filter(Boolean).join(' · ');
  const img = o.logo_v ? `${BASE_URL}/api/logo/${o.company_id}?v=${o.logo_v}` : `${BASE_URL}/img/icone-512.png`;
  const desc = o.description.replace(/\s+/g, ' ').slice(0, 190) + (o.description.length > 190 ? '…' : '');
  const title = `${o.title} — ${o.company}${o.city ? ', ' + o.city : ''}`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Genius Recrutement</title><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Genius Recrutement"><meta property="og:url" content="${esc(offerUrl(o))}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc((o.contract ? o.contract + ' · ' : '') + desc)}"><meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary"><link rel="canonical" href="${esc(offerUrl(o))}"><link rel="icon" href="/img/icone-192.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"><link rel="stylesheet" href="/style.css">
<style>.pg{max-width:780px;margin:auto;padding:28px 16px 64px}.hd{display:flex;gap:16px;align-items:center}.lg{width:72px;height:72px;border:1px solid var(--line);border-radius:12px;background:#fff;display:grid;place-items:center;overflow:hidden;flex:none}.lg img{max-width:64px;max-height:64px}.desc{white-space:pre-wrap;color:var(--fg-2);line-height:1.6}</style></head>
<body><header class="top"><div class="top-in"><a class="brand" href="/espace"><span class="logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/></svg></span>Genius Recrutement</a></div></header>
<main class="pg"><div class="card col"><div class="hd"><div class="lg">${o.logo_v ? `<img src="/api/logo/${o.company_id}?v=${o.logo_v}" alt="Logo ${esc(o.company)}">` : `<b>${esc(o.company.slice(0, 2).toUpperCase())}</b>`}</div>
<div><h1 style="font-size:26px">${esc(o.title)}</h1><p class="muted">${esc(where)}</p></div></div>
<p class="small muted">${esc(famName(o.family))} · publiée le ${new Date(o.created_at).toLocaleDateString('fr-FR')}${o.closes_at ? ` · candidatures jusqu’au ${new Date(o.closes_at + 'T12:00').toLocaleDateString('fr-FR')}` : ''}</p>
<div class="desc">${esc(o.description)}</div>
${o.test_id ? '<p class="note info">Cette entreprise utilise un test en ligne : vous le recevrez dès votre candidature, à passer sur téléphone ou ordinateur.</p>' : ''}
${st === 'ouverte' ? `<div class="row"><a class="btn primary" href="/espace#/offre/${o.id}">Postuler</a><a class="btn" href="/espace#/offres">Voir les autres offres</a></div>` : '<p class="note warn">Cette offre est fermée.</p><div><a class="btn" href="/espace#/offres">Voir les offres ouvertes</a></div>'}
</div><p class="small muted" style="margin-top:16px;text-align:center">Offre publiée sur Genius Recrutement · <a href="/confidentialite.html">Confidentialité</a></p></main></body></html>`;
}
on('GET', '/api/offers', async (req, res, { query }) => {
  const fam = query.get('family'), q = (query.get('q') || '').toLowerCase().trim();
  let rows = qa(`SELECT o.*, c.name AS company, c.logo_v FROM offers o JOIN companies c ON c.id=o.company_id WHERE o.status='ouverte' AND c.status='valide' ORDER BY o.created_at DESC LIMIT 300`)
    .filter(o => offerStatus(o) === 'ouverte');
  if (famOk(fam)) rows = rows.filter(o => o.family === fam);
  if (q) rows = rows.filter(o => (o.title + ' ' + o.company + ' ' + (o.city || '') + ' ' + o.description).toLowerCase().includes(q));
  const cu = currentCand(req), mine = cu ? new Set(qa(`SELECT offer_id FROM applications WHERE cu_id=?`, cu.id).map(r => r.offer_id)) : new Set();
  send(res, 200, { offers: rows.map(o => offerOut(o, { applied: mine.has(o.id), description: o.description.slice(0, 220) })) });
});
on('GET', '/api/offers/:id', async (req, res, { params }) => {
  const o = q1(`SELECT o.*, c.name AS company, c.logo_v FROM offers o JOIN companies c ON c.id=o.company_id WHERE o.id=? AND c.status='valide'`, +params.id);
  if (!o) return fail(res, 404, 'Offre introuvable.');
  countView(req, o.id);
  const cu = currentCand(req);
  send(res, 200, { offer: offerOut(o, { applied: !!(cu && q1(`SELECT id FROM applications WHERE offer_id=? AND cu_id=?`, o.id, cu.id)) }) });
});

/* candidature en un clic */
async function inviteFromApplication(app, o, cu) {
  const t = q1(`SELECT * FROM tests WHERE id=?`, o.test_id); if (!t) return null;
  let c = q1(`SELECT * FROM candidates WHERE test_id=? AND email=?`, t.id, cu.email);
  if (!c) {
    const token = rnd(18);
    const id = run(`INSERT INTO candidates(test_id,name,email,token,invited_at,cu_id) VALUES(?,?,?,?,?,?)`, t.id, cu.name, cu.email, token, now(), cu.id).lastInsertRowid;
    c = q1(`SELECT * FROM candidates WHERE id=?`, id);
  }
  run(`UPDATE applications SET candidate_id=?, status='test_envoye' WHERE id=?`, c.id, app.id);
  const co = q1(`SELECT name FROM companies WHERE id=?`, t.company_id);
  await sendMail({ to: cu.email, companyId: t.company_id, replyTo: t.reply_email, subject: `${co.name} : votre test pour le poste ${o.title}`, html: invitationMail(t, c, co.name) });
  pushTo(cu.id, { title: `Test à passer : ${o.title}`, body: `${co.name} vous invite à passer un test.`, url: `/t/${c.token}` });
  return c;
}
on('POST', '/api/offers/:id/apply', withCand(async (req, res, { cu, params, body }) => {
  const o = q1(`SELECT o.*, c.name AS company, c.status AS cstatus FROM offers o JOIN companies c ON c.id=o.company_id WHERE o.id=?`, +params.id);
  if (!o || offerStatus(o) !== 'ouverte' || o.cstatus !== 'valide') return fail(res, 404, 'Cette offre n’est plus ouverte.');
  if (q1(`SELECT id FROM applications WHERE offer_id=? AND cu_id=?`, o.id, cu.id)) return fail(res, 409, 'Vous avez déjà postulé à cette offre.');
  const id = run(`INSERT INTO applications(offer_id,cu_id,message,created_at) VALUES(?,?,?,?)`, o.id, cu.id, clean(body.message, 1500), now()).lastInsertRowid;
  if (!cu.verified) { run(`UPDATE applications SET status='attente' WHERE id=?`, id); return send(res, 200, { ok: true, pending: true }); }
  const tested = await releaseApp(q1(`SELECT * FROM applications WHERE id=?`, id), o, cu);
  send(res, 200, { ok: true, testSent: !!tested, link: tested ? `/t/${tested.token}` : null });
}));
// Transmet une candidature à l'entreprise : test envoyé si l'offre en a un, puis avis au recruteur.
async function releaseApp(app, o, cu) {
  let tested = null;
  if (o.test_id && o.auto_test) tested = await inviteFromApplication(app, o, cu);
  const t = o.test_id ? q1(`SELECT reply_email FROM tests WHERE id=?`, o.test_id) : null;
  const to = t?.reply_email || q1(`SELECT email FROM users WHERE company_id=? ORDER BY id LIMIT 1`, o.company_id)?.email;
  if (to) sendMail({ to, companyId: o.company_id, subject: `Nouvelle candidature : ${cu.name} — ${o.title}`, html: mailLayout('Nouvelle candidature',
    `<p><b>${esc(cu.name)}</b> a postulé à l’offre <b>${esc(o.title)}</b>.${tested ? '<br>Le test lui a été envoyé automatiquement.' : ''}</p>${button(`${BASE_URL}/app#/offres/${o.id}`, 'Voir la candidature')}`, o.company_id) });
  return tested;
}
// Candidatures en attente de confirmation de l'adresse : transmises au clic sur le lien.
async function releasePending(cuId) {
  const cu = q1(`SELECT * FROM cusers WHERE id=?`, cuId); if (!cu) return;
  for (const a of qa(`SELECT * FROM applications WHERE cu_id=? AND status='attente'`, cuId)) {
    const o = q1(`SELECT o.*, c.name AS company, c.status AS cstatus FROM offers o JOIN companies c ON c.id=o.company_id WHERE o.id=?`, a.offer_id);
    run(`UPDATE applications SET status='recue', created_at=? WHERE id=?`, now(), a.id);
    if (o) await releaseApp(q1(`SELECT * FROM applications WHERE id=?`, a.id), o, cu);
  }
}
// Rappel unique, environ un jour après, aux candidats qui n'ont pas confirmé leur adresse.
try { db.exec(`ALTER TABLE cusers ADD COLUMN reminded INTEGER NOT NULL DEFAULT 0`); } catch {}
async function remindUnverified() {
  if (!getTransport()) return;
  for (const cu of qa(`SELECT * FROM cusers WHERE verified=0 AND reminded=0 AND created_at < ?`, now() - 20 * 3600_000)) {
    run(`UPDATE cusers SET reminded=1 WHERE id=?`, cu.id);
    const n = q1(`SELECT COUNT(*) n FROM applications WHERE cu_id=? AND status='attente'`, cu.id).n;
    const tok = rnd(32); run(`INSERT INTO verifs(token,kind,ref_id,expires) VALUES(?,?,?,?)`, sha(tok), 'cand', cu.id, now() + 3 * 864e5);
    await sendMail({ to: cu.email, subject: n ? 'Votre candidature attend votre confirmation' : 'Confirmez votre adresse e-mail', html: mailLayout(n ? 'Votre candidature n’est pas encore transmise' : 'Confirmez votre adresse e-mail',
      `<p>Bonjour ${esc(cu.name)},</p><p>${n ? `Vous avez postulé à ${n > 1 ? n + ' offres' : 'une offre'}, mais votre adresse e-mail n’est pas encore confirmée : l’entreprise n’a donc rien reçu.` : 'Votre adresse e-mail n’est pas encore confirmée.'} Cliquez sur le bouton pour la confirmer${n ? ' : votre candidature partira aussitôt' : ''}.</p>${button(`${BASE_URL}/verifier/${tok}`, 'Confirmer mon adresse')}`) });
  }
}
setTimeout(remindUnverified, 120_000); setInterval(remindUnverified, 3600_000);
on('GET', '/api/cand/applications', withCand(async (req, res, { cu }) => {
  const rows = qa(`SELECT a.*, o.title, o.city, o.contract, o.family, o.status AS ostatus, o.closes_at, c.name AS company, c.logo_v, o.company_id,
    k.status AS tstatus, k.token FROM applications a JOIN offers o ON o.id=a.offer_id JOIN companies c ON c.id=o.company_id
    LEFT JOIN candidates k ON k.id=a.candidate_id WHERE a.cu_id=? ORDER BY a.created_at DESC`, cu.id);
  send(res, 200, { applications: rows.map(r => ({ id: r.id, offerId: r.offer_id, title: r.title, company: r.company, city: r.city || '', contract: r.contract || '',
    companyLogo: r.logo_v ? `/api/logo/${r.company_id}?v=${r.logo_v}` : null, status: r.status, stage: r.stage || 'nouvelle', createdAt: r.created_at, interview: (iv => iv && iv.at > now() - 3600_000 ? { at: iv.at, label: fmtDakar(iv.at), place: iv.place || '', note: iv.note || '' } : null)(q1(`SELECT * FROM interviews WHERE app_id=? ORDER BY id DESC LIMIT 1`, r.id)),
    test: r.token ? { status: r.tstatus, link: `/t/${r.token}` } : null })) });
}));

/* côté recruteur : offres et candidatures */
const ownOffer = (user, id) => q1(`SELECT * FROM offers WHERE id=? AND company_id=?`, +id, user.company_id);
function readOffer(body, user) {
  const title = clean(body.title, 160), family = famOk(body.family) ? body.family : null, description = clean(body.description, 6000);
  if (!title) throw Object.assign(new Error('Indiquez l’intitulé du poste.'), { code: 400 });
  if (!family) throw Object.assign(new Error('Choisissez le métier.'), { code: 400 });
  if (description.length < 30) throw Object.assign(new Error('Décrivez le poste en quelques lignes (30 caractères au moins).'), { code: 400 });
  const testId = body.testId ? +body.testId : null;
  if (testId && !q1(`SELECT id FROM tests WHERE id=? AND company_id=?`, testId, user.company_id)) throw Object.assign(new Error('Test introuvable.'), { code: 400 });
  return { title, family, description, testId, auto: body.autoTest === false ? 0 : 1, city: clean(body.city, 80), contract: CONTRACTS.includes(body.contract) ? body.contract : '',
    closes: /^\d{4}-\d{2}-\d{2}$/.test(body.closesAt || '') ? body.closesAt : null };
}
async function announce(o, companyName) {
  // Alerte aux candidats du même métier qui l'ont demandée : e-mail + notification sur le téléphone.
  run(`UPDATE offers SET announced=1 WHERE id=?`, o.id);
  const list = qa(`SELECT * FROM cusers WHERE alerts=1 AND verified=1 AND family=?`, o.family);
  for (const cu of list) {
    pushTo(cu.id, { title: `Nouvelle offre : ${o.title}`, body: `${companyName}${o.city ? ' — ' + o.city : ''}${o.contract ? ' · ' + o.contract : ''}`, url: `/espace#/offre/${o.id}` });
    await sendMail({ to: cu.email, subject: `Nouvelle offre : ${o.title} (${companyName})`, html: mailLayout('Une offre correspond à votre profil',
      `<p>Bonjour ${esc(cu.name)},</p><p><b>${esc(companyName)}</b> recrute : <b>${esc(o.title)}</b>${o.city ? ' à ' + esc(o.city) : ''}${o.contract ? ' (' + esc(o.contract) + ')' : ''}.</p>${button(`${BASE_URL}/espace#/offre/${o.id}`, 'Voir l’offre et postuler')}<p style="font-size:12px;color:#4A5565">Vous recevez ce message car vous avez activé les alertes dans votre espace candidat.</p>`, o.company_id) });
  }
  return list.length;
}
// Alertes différées : offres publiées avant la validation de l'entreprise ou la confirmation de l'adresse.
async function announcePending(companyId) {
  const co = q1(`SELECT name,status FROM companies WHERE id=?`, companyId); if (!co || co.status !== 'valide') return 0;
  if (!q1(`SELECT id FROM users WHERE company_id=? AND verified=1`, companyId)) return 0;
  let n = 0; for (const o of qa(`SELECT * FROM offers WHERE company_id=? AND status='ouverte' AND announced=0`, companyId)) if (offerStatus(o) === 'ouverte') n += await announce(o, co.name);
  return n;
}
on('GET', '/api/rh/offers', async (req, res, { user }) => {
  const rows = qa(`SELECT o.*, (SELECT COUNT(*) FROM applications a WHERE a.offer_id=o.id AND a.status!='attente') AS n FROM offers o WHERE o.company_id=? ORDER BY o.created_at DESC`, user.company_id);
  send(res, 200, { offers: rows.map(o => ({ ...offerOut(o), testId: o.test_id, autoTest: !!o.auto_test, applications: o.n, views: o.views || 0 })), contracts: CONTRACTS });
}, { auth: true });
on('POST', '/api/rh/offers', async (req, res, { user, body }) => {
  const b = readOffer(body, user);
  const id = run(`INSERT INTO offers(company_id,test_id,auto_test,title,family,city,contract,description,created_at,closes_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    user.company_id, b.testId, b.auto, b.title, b.family, b.city, b.contract, b.description, now(), b.closes).lastInsertRowid;
  run(`UPDATE offers SET announced=0 WHERE id=?`, id);
  if (!canReach(user)) return send(res, 200, { id, alerted: 0, pending: reachMsg(user) });
  const n = await announce(q1(`SELECT * FROM offers WHERE id=?`, id), user.company);
  send(res, 200, { id, alerted: n });
}, { auth: true });
on('PUT', '/api/rh/offers/:id', async (req, res, { user, params, body }) => {
  const o = ownOffer(user, params.id); if (!o) return fail(res, 404, 'Offre introuvable.');
  if (body.status && Object.keys(body).length === 1) { run(`UPDATE offers SET status=? WHERE id=?`, body.status === 'ouverte' ? 'ouverte' : 'fermee', o.id); return send(res, 200, { ok: true }); }
  const b = readOffer(body, user);
  run(`UPDATE offers SET test_id=?,auto_test=?,title=?,family=?,city=?,contract=?,description=?,closes_at=? WHERE id=?`, b.testId, b.auto, b.title, b.family, b.city, b.contract, b.description, b.closes, o.id);
  send(res, 200, { ok: true });
}, { auth: true });
on('DELETE', '/api/rh/offers/:id', async (req, res, { user, params }) => {
  const o = ownOffer(user, params.id); if (!o) return fail(res, 404, 'Offre introuvable.'); run(`DELETE FROM offers WHERE id=?`, o.id); send(res, 200, { ok: true });
}, { auth: true });
on('GET', '/api/rh/offers/:id', async (req, res, { user, params }) => {
  const o = ownOffer(user, params.id); if (!o) return fail(res, 404, 'Offre introuvable.');
  const apps = qa(`SELECT a.*, u.name, u.email, u.phone, u.city, u.family, u.headline, u.cv_name, u.photo IS NOT NULL AS hasphoto, u.cv_at,
    k.status AS tstatus, k.global, k.scores, k.secs, k.token FROM applications a JOIN cusers u ON u.id=a.cu_id LEFT JOIN candidates k ON k.id=a.candidate_id
    WHERE a.offer_id=? AND a.status!='attente' ORDER BY (k.global IS NULL), k.global DESC, a.created_at DESC`, o.id);
  const st = { views: o.views || 0, applications: apps.length, tests: apps.filter(a => a.tstatus === 'termine').length,
    avg: (() => { const d = apps.filter(a => a.tstatus === 'termine' && a.global != null); return d.length ? Math.round(d.reduce((x, a) => x + a.global, 0) / d.length) : null; })(),
    entretien: apps.filter(a => ['entretien', 'embauche'].includes(a.stage)).length, embauche: apps.filter(a => a.stage === 'embauche').length,
    pending: q1(`SELECT COUNT(*) n FROM applications WHERE offer_id=? AND status='attente'`, o.id).n };
  const ivs = qa(`SELECT * FROM interviews WHERE app_id IN (SELECT id FROM applications WHERE offer_id=?) ORDER BY at`, o.id);
  send(res, 200, { stats: st, offer: { ...offerOut(o), testId: o.test_id, autoTest: !!o.auto_test }, applications: apps.map(a => ({ interview: (iv => iv ? { id: iv.id, at: iv.at, place: iv.place, note: iv.note } : null)(ivs.filter(i => i.app_id === a.id).pop()), id: a.id, name: a.name, email: a.email, phone: a.phone || '',
    city: a.city || '', familyName: famName(a.family), headline: a.headline || '', message: a.message || '', status: a.status, stage: a.stage || 'nouvelle', createdAt: a.created_at,
    photo: a.hasphoto ? `/api/rh/applications/${a.id}/photo` : null, cv: a.cv_name ? `/api/rh/applications/${a.id}/cv` : null,
    test: a.token ? { status: a.tstatus, global: a.global, scores: a.scores ? JSON.parse(a.scores) : null, secs: a.secs } : null })) });
}, { auth: true });
const ownApp = (user, id) => q1(`SELECT a.*, o.company_id, o.test_id, o.title, o.family FROM applications a JOIN offers o ON o.id=a.offer_id WHERE a.id=? AND o.company_id=?`, +id, user.company_id);
on('GET', '/api/rh/applications/:id/cv', async (req, res, { user, params }) => {
  const a = ownApp(user, params.id); if (!a) return fail(res, 404, 'Candidature introuvable.');
  const u = q1(`SELECT cv_name FROM cusers WHERE id=?`, a.cu_id); sendCv(res, a.cu_id, u?.cv_name);
}, { auth: true });
on('GET', '/api/rh/applications/:id/photo', async (req, res, { user, params }) => {
  const a = ownApp(user, params.id); if (!a) return fail(res, 404, 'Candidature introuvable.');
  const r = q1(`SELECT photo FROM cusers WHERE id=?`, a.cu_id), m = r && r.photo && /^data:(image\/[a-z]+);base64,(.+)$/.exec(r.photo);
  if (!m) return send(res, 404, 'Pas de photo'); res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'private, max-age=3600' }); res.end(Buffer.from(m[2], 'base64'));
}, { auth: true });
on('POST', '/api/rh/applications/:id/invite', async (req, res, { user, params, body }) => {
  const a = ownApp(user, params.id); if (!a) return fail(res, 404, 'Candidature introuvable.');
  if (!canReach(user)) return fail(res, 403, reachMsg(user));
  const o = q1(`SELECT * FROM offers WHERE id=?`, a.offer_id);
  if (body.testId) { if (!q1(`SELECT id FROM tests WHERE id=? AND company_id=?`, +body.testId, user.company_id)) return fail(res, 400, 'Test introuvable.'); o.test_id = +body.testId; }
  if (!o.test_id) return fail(res, 400, 'Associez d’abord un test à cette offre.');
  const cu = q1(`SELECT * FROM cusers WHERE id=?`, a.cu_id);
  const c = await inviteFromApplication(a, o, cu); send(res, 200, { ok: !!c });
}, { auth: true });
on('PUT', '/api/rh/applications/:id', async (req, res, { user, params, body }) => {
  const a = ownApp(user, params.id); if (!a) return fail(res, 404, 'Candidature introuvable.');
  // Étapes du recrutement. Ancien vocabulaire accepté : retenue = présélection.
  const st = { nouvelle: 'nouvelle', recue: 'nouvelle', preselection: 'preselection', retenue: 'preselection', entretien: 'entretien', embauche: 'embauche', refusee: 'refusee' }[body.stage || body.status];
  if (!st) return fail(res, 400, 'Étape inconnue.');
  run(`UPDATE applications SET stage=? WHERE id=?`, st, a.id);
  if (body.status === 'retenue' || body.status === 'refusee') run(`UPDATE applications SET status=? WHERE id=?`, body.status, a.id);
  const cu = q1(`SELECT * FROM cusers WHERE id=?`, a.cu_id), co = q1(`SELECT name FROM companies WHERE id=?`, a.company_id);
  const MSG = {
    entretien: ['Invitation à un entretien', `Bonne nouvelle : ${esc(co.name)} souhaite vous rencontrer en entretien pour le poste <b>${esc(a.title)}</b>. L’entreprise va vous contacter pour fixer la date.`, 'Vous êtes invité à un entretien.'],
    embauche: ['Votre candidature est retenue', `Félicitations : ${esc(co.name)} a retenu votre candidature au poste <b>${esc(a.title)}</b>. L’entreprise va vous contacter pour la suite.`, 'Votre candidature est retenue.'],
    refusee: ['Réponse à votre candidature', `Merci pour l’intérêt porté au poste <b>${esc(a.title)}</b>. ${esc(co.name)} a choisi de ne pas donner suite à votre candidature. Nous vous souhaitons pleine réussite dans vos recherches.`, 'Votre candidature n’a pas été retenue.'] };
  if (MSG[st] && body.notify !== false && cu) {
    sendMail({ to: cu.email, companyId: a.company_id, subject: `${co.name} : ${MSG[st][0].toLowerCase()} (${a.title})`, html: mailLayout(MSG[st][0], `<p>Bonjour ${esc(cu.name)},</p><p>${MSG[st][1]}</p>`, a.company_id) });
    pushTo(cu.id, { title: `${a.title}`, body: MSG[st][2], url: '/espace#/candidatures' });
  }
  send(res, 200, { ok: true });
}, { auth: true });

// Conservation : candidatures effacées 12 mois après leur dépôt.
setInterval(() => run(`DELETE FROM applications WHERE created_at < ?`, now() - 365 * 864e5), 6 * 3600_000);

/* tableau de bord RH */
on('GET', '/api/rh/dashboard', async (req, res, { user }) => {
  const cid = user.company_id, week = now() - 7 * 864e5;
  const k = {
    offers: q1(`SELECT COUNT(*) n FROM offers WHERE company_id=? AND status='ouverte'`, cid).n,
    apps: q1(`SELECT COUNT(*) n FROM applications a JOIN offers o ON o.id=a.offer_id WHERE o.company_id=? AND a.status!='attente'`, cid).n,
    appsWeek: q1(`SELECT COUNT(*) n FROM applications a JOIN offers o ON o.id=a.offer_id WHERE o.company_id=? AND a.status!='attente' AND a.created_at>?`, cid, week).n,
    tests: q1(`SELECT COUNT(*) n FROM tests WHERE company_id=? AND archived=0`, cid).n,
    done: q1(`SELECT COUNT(*) n FROM candidates c JOIN tests t ON t.id=c.test_id WHERE t.company_id=? AND c.status='termine'`, cid).n,
    avg: q1(`SELECT ROUND(AVG(c.global)) a FROM candidates c JOIN tests t ON t.id=c.test_id WHERE t.company_id=? AND c.status='termine'`, cid).a
  };
  const latest = qa(`SELECT a.id, a.status, a.stage, a.created_at, a.offer_id, o.title, u.name, u.photo IS NOT NULL AS hasphoto, k.global, k.status AS tstatus
    FROM applications a JOIN offers o ON o.id=a.offer_id JOIN cusers u ON u.id=a.cu_id LEFT JOIN candidates k ON k.id=a.candidate_id
    WHERE o.company_id=? AND a.status!='attente' ORDER BY a.created_at DESC LIMIT 6`, cid).map(a => ({ id: a.id, offerId: a.offer_id, title: a.title, name: a.name, status: a.status, stage: a.stage || 'nouvelle', createdAt: a.created_at,
      photo: a.hasphoto ? `/api/rh/applications/${a.id}/photo` : null, score: a.tstatus === 'termine' ? a.global : null }));
  const results = qa(`SELECT c.id, c.name, c.global, c.ended_at, c.test_id, t.title FROM candidates c JOIN tests t ON t.id=c.test_id WHERE t.company_id=? AND c.status='termine' ORDER BY c.ended_at DESC LIMIT 5`, cid);
  const interviews = qa(`SELECT i.id, i.at, i.place, u.name, o.title, o.id AS offer_id FROM interviews i JOIN applications a ON a.id=i.app_id JOIN cusers u ON u.id=a.cu_id JOIN offers o ON o.id=a.offer_id
    WHERE i.company_id=? AND i.at > ? ORDER BY i.at LIMIT 5`, cid, now() - 3600_000).map(r => ({ id: r.id, at: r.at, place: r.place, name: r.name, title: r.title, offerId: r.offer_id }));
  const today = new Date().toISOString().slice(0, 10), soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const staff = { active: q1(`SELECT COUNT(*) n FROM employees WHERE company_id=? AND active=1`, cid).n,
    ending: qa(`SELECT id,name,end_date FROM employees WHERE company_id=? AND active=1 AND end_date BETWEEN ? AND ? ORDER BY end_date`, cid, today, soon).map(e => ({ id: e.id, name: e.name, end: e.end_date })),
    pendingLeaves: q1(`SELECT COUNT(*) n FROM leaves l JOIN employees e ON e.id=l.employee_id WHERE e.company_id=? AND l.status='demandee'`, cid).n };
  send(res, 200, { k, latest, results, interviews, staff });
}, { auth: true });

/* =====================================================================
   ENTRETIENS PLANIFIÉS
   ===================================================================== */
db.exec(`CREATE TABLE IF NOT EXISTS interviews(id INTEGER PRIMARY KEY, app_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL, at INTEGER NOT NULL, place TEXT, note TEXT, by_user INTEGER, reminded INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`);
const fmtDakar = ms => new Date(ms).toLocaleString('fr-FR', { timeZone: 'Africa/Dakar', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
function interviewMail(kind, cu, co, title, iv) {
  const head = { new: 'Invitation à un entretien', moved: 'Votre entretien a changé', reminder: 'Rappel : votre entretien demain', cancel: 'Entretien annulé' }[kind];
  const body = kind === 'cancel' ? `<p>Bonjour ${esc(cu.name)},</p><p>L’entretien prévu le <b>${esc(fmtDakar(iv.at))}</b> pour le poste <b>${esc(title)}</b> chez ${esc(co.name)} est annulé. L’entreprise reviendra vers vous si besoin.</p>`
    : `<p>Bonjour ${esc(cu.name)},</p><p>${kind === 'reminder' ? 'Nous vous rappelons votre' : `${esc(co.name)} vous ${kind === 'moved' ? 'propose une nouvelle date pour votre' : 'invite à un'}`} entretien pour le poste <b>${esc(title)}</b>.</p>
<p style="background:#E2EFF0;border-radius:8px;padding:14px 16px"><b>${esc(fmtDakar(iv.at))}</b>${iv.place ? `<br>${esc(iv.place)}` : ''}</p>${iv.note ? `<p>${esc(iv.note)}</p>` : ''}<p style="font-size:13px;color:#4A5565">Un empêchement ? Répondez directement à cet e-mail pour prévenir l’entreprise.</p>`;
  return { subject: `${co.name} : ${head.toLowerCase()} (${title})`, html: mailLayout(head, body, co.id) };
}
function ivContext(user, appId) {
  const a = ownApp(user, appId); if (!a) return null;
  const cu = q1(`SELECT * FROM cusers WHERE id=?`, a.cu_id), co = q1(`SELECT id,name FROM companies WHERE id=?`, a.company_id);
  const t = a.test_id ? q1(`SELECT reply_email FROM tests WHERE id=?`, a.test_id) : null;
  return { a, cu, co, replyTo: t?.reply_email || user.email };
}
on('POST', '/api/rh/applications/:id/interview', async (req, res, { user, params, body }) => {
  const x = ivContext(user, params.id); if (!x) return fail(res, 404, 'Candidature introuvable.');
  const at = Date.parse(body.at); if (!at || at < now() - 3600_000) return fail(res, 400, 'Choisissez une date et une heure à venir.');
  const place = clean(body.place, 300), note = clean(body.note, 1000);
  const prev = q1(`SELECT * FROM interviews WHERE app_id=? ORDER BY id DESC LIMIT 1`, x.a.id);
  let iv;
  if (prev && prev.at > now() - 86400_000) { run(`UPDATE interviews SET at=?, place=?, note=?, reminded=0 WHERE id=?`, at, place, note, prev.id); iv = q1(`SELECT * FROM interviews WHERE id=?`, prev.id); }
  else iv = q1(`SELECT * FROM interviews WHERE id=?`, run(`INSERT INTO interviews(app_id,company_id,at,place,note,by_user,created_at) VALUES(?,?,?,?,?,?,?)`, x.a.id, x.a.company_id, at, place, note, user.id, now()).lastInsertRowid);
  run(`UPDATE applications SET stage='entretien' WHERE id=? AND stage IN ('nouvelle','preselection')`, x.a.id);
  let sent = false;
  if (body.notify !== false && x.cu) {
    const m = interviewMail(prev && prev.at > now() - 86400_000 ? 'moved' : 'new', x.cu, x.co, x.a.title, iv);
    sent = !!(await sendMail({ to: x.cu.email, companyId: x.a.company_id, replyTo: x.replyTo, ...m })).sent;
    pushTo(x.cu.id, { title: `Entretien : ${x.a.title}`, body: fmtDakar(iv.at), url: '/espace#/candidatures' });
  }
  send(res, 200, { ok: true, sent });
}, { auth: true });
on('DELETE', '/api/rh/interviews/:id', async (req, res, { user, params, query }) => {
  const iv = q1(`SELECT * FROM interviews WHERE id=? AND company_id=?`, +params.id, user.company_id); if (!iv) return fail(res, 404, 'Entretien introuvable.');
  const x = ivContext(user, iv.app_id);
  run(`DELETE FROM interviews WHERE id=?`, iv.id);
  if (x && x.cu && query.get('notify') !== '0' && iv.at > now()) { const m = interviewMail('cancel', x.cu, x.co, x.a.title, iv); sendMail({ to: x.cu.email, companyId: x.a.company_id, replyTo: x.replyTo, ...m }); }
  send(res, 200, { ok: true });
}, { auth: true });
on('GET', '/api/rh/interviews', async (req, res, { user }) => {
  const rows = qa(`SELECT i.*, u.name, u.phone, o.title, o.id AS offer_id FROM interviews i JOIN applications a ON a.id=i.app_id JOIN cusers u ON u.id=a.cu_id JOIN offers o ON o.id=a.offer_id
    WHERE i.company_id=? AND i.at > ? ORDER BY i.at LIMIT 50`, user.company_id, now() - 3 * 3600_000);
  send(res, 200, { interviews: rows.map(r => ({ id: r.id, at: r.at, place: r.place, name: r.name, phone: r.phone || '', title: r.title, offerId: r.offer_id })) });
}, { auth: true });
// Rappel au candidat la veille (entre 20 et 30 heures avant).
async function interviewReminders() {
  if (!getTransport()) return;
  for (const iv of qa(`SELECT * FROM interviews WHERE reminded=0 AND at BETWEEN ? AND ?`, now() + 2 * 3600_000, now() + 30 * 3600_000)) {
    run(`UPDATE interviews SET reminded=1 WHERE id=?`, iv.id);
    const a = q1(`SELECT a.*, o.title, o.company_id, o.test_id FROM applications a JOIN offers o ON o.id=a.offer_id WHERE a.id=?`, iv.app_id); if (!a) continue;
    const cu = q1(`SELECT * FROM cusers WHERE id=?`, a.cu_id), co = q1(`SELECT id,name FROM companies WHERE id=?`, a.company_id); if (!cu) continue;
    const t = a.test_id ? q1(`SELECT reply_email FROM tests WHERE id=?`, a.test_id) : null;
    await sendMail({ to: cu.email, companyId: co.id, replyTo: t?.reply_email, ...interviewMail('reminder', cu, co, a.title, iv) });
  }
}
setInterval(interviewReminders, 30 * 60_000); setTimeout(interviewReminders, 90_000);

/* =====================================================================
   PERSONNEL (dossiers, congés, documents) — sans paie
   ===================================================================== */
db.exec(`
CREATE TABLE IF NOT EXISTS employees(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE, name TEXT NOT NULL,
  email TEXT, phone TEXT, job TEXT, service TEXT, contract TEXT, start_date TEXT, end_date TEXT, active INTEGER NOT NULL DEFAULT 1, notes TEXT,
  leave_init REAL NOT NULL DEFAULT 0, app_id INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS leaves(id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, kind TEXT NOT NULL,
  start_date TEXT NOT NULL, end_date TEXT NOT NULL, days REAL NOT NULL, status TEXT NOT NULL DEFAULT 'validee', comment TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS emp_docs(id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, name TEXT NOT NULL,
  mime TEXT NOT NULL, size INTEGER NOT NULL, created_at INTEGER NOT NULL);
`);
const DOC_DIR = path.join(DATA_DIR, 'docs'); fs.mkdirSync(DOC_DIR, { recursive: true });
const LEAVE_KINDS = ['Congé payé', 'Maladie', 'Permission exceptionnelle', 'Sans solde', 'Maternité', 'Autre'];
const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
// Jours ouvrables (lundi à samedi) entre deux dates incluses, comme pour le décompte des congés au Sénégal.
function workDays(a, b) { let n = 0; for (let d = new Date(a + 'T12:00:00Z'); d <= new Date(b + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) if (d.getUTCDay() !== 0) n++; return n; }
// Acquis indicatif : 2 jours ouvrables par mois de service (Code du travail), plus le solde de départ saisi.
function leaveBalance(e) {
  if (!isDate(e.start_date)) return null;
  const s = new Date(e.start_date + 'T12:00:00Z'), end = e.end_date && isDate(e.end_date) && new Date(e.end_date) < new Date() ? new Date(e.end_date + 'T12:00:00Z') : new Date();
  const months = Math.max(0, (end.getUTCFullYear() - s.getUTCFullYear()) * 12 + end.getUTCMonth() - s.getUTCMonth() - (end.getUTCDate() < s.getUTCDate() ? 1 : 0));
  const taken = q1(`SELECT COALESCE(SUM(days),0) n FROM leaves WHERE employee_id=? AND kind='Congé payé' AND status='validee'`, e.id).n;
  return { acquired: months * 2 + (e.leave_init || 0), taken, left: months * 2 + (e.leave_init || 0) - taken, months };
}
const empOut = e => ({ id: e.id, name: e.name, email: e.email || '', phone: e.phone || '', job: e.job || '', service: e.service || '', contract: e.contract || '',
  startDate: e.start_date || '', endDate: e.end_date || '', active: !!e.active, notes: e.notes || '', leaveInit: e.leave_init || 0, balance: leaveBalance(e) });
const ownEmp = (user, id) => q1(`SELECT * FROM employees WHERE id=? AND company_id=?`, +id, user.company_id);
function readEmp(body) {
  const name = clean(body.name, 120); if (!name) throw Object.assign(new Error('Indiquez le nom du salarié.'), { code: 400 });
  const email = clean(body.email, 200).toLowerCase(); if (email && !isEmail(email)) throw Object.assign(new Error('Adresse e-mail invalide.'), { code: 400 });
  return { name, email, phone: clean(body.phone, 40), job: clean(body.job, 120), service: clean(body.service, 120), contract: CONTRACTS.includes(body.contract) ? body.contract : '',
    start: isDate(body.startDate) ? body.startDate : null, end: isDate(body.endDate) ? body.endDate : null, notes: clean(body.notes, 3000),
    init: Math.max(-60, Math.min(120, +body.leaveInit || 0)), active: body.active === false ? 0 : 1 };
}
on('GET', '/api/rh/employees', async (req, res, { user }) => {
  const rows = qa(`SELECT * FROM employees WHERE company_id=? ORDER BY active DESC, name`, user.company_id);
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), today = new Date().toISOString().slice(0, 10);
  const away = new Set(qa(`SELECT l.employee_id FROM leaves l JOIN employees e ON e.id=l.employee_id WHERE e.company_id=? AND l.status='validee' AND l.start_date<=? AND l.end_date>=?`, user.company_id, today, today).map(r => r.employee_id));
  const pending = q1(`SELECT COUNT(*) n FROM leaves l JOIN employees e ON e.id=l.employee_id WHERE e.company_id=? AND l.status='demandee'`, user.company_id).n;
  send(res, 200, { employees: rows.map(e => ({ ...empOut(e), away: away.has(e.id), endingSoon: e.active && e.end_date && e.end_date >= today && e.end_date <= soon })), contracts: CONTRACTS, kinds: LEAVE_KINDS, pending });
}, { auth: true });
on('POST', '/api/rh/employees', async (req, res, { user, body }) => {
  let b; try { b = readEmp(body); } catch (e) { return fail(res, e.code || 400, e.message); }
  const appId = body.appId ? (ownApp(user, body.appId) ? +body.appId : null) : null;
  const id = run(`INSERT INTO employees(company_id,name,email,phone,job,service,contract,start_date,end_date,notes,leave_init,active,app_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    user.company_id, b.name, b.email, b.phone, b.job, b.service, b.contract, b.start, b.end, b.notes, b.init, b.active, appId, now()).lastInsertRowid;
  if (appId) run(`UPDATE applications SET stage='embauche' WHERE id=?`, appId);
  send(res, 200, { id });
}, { auth: true });
on('GET', '/api/rh/employees/:id', async (req, res, { user, params }) => {
  const e = ownEmp(user, params.id); if (!e) return fail(res, 404, 'Salarié introuvable.');
  send(res, 200, { employee: empOut(e), contracts: CONTRACTS, kinds: LEAVE_KINDS,
    leaves: qa(`SELECT * FROM leaves WHERE employee_id=? ORDER BY start_date DESC`, e.id).map(l => ({ id: l.id, kind: l.kind, start: l.start_date, end: l.end_date, days: l.days, status: l.status, comment: l.comment || '' })),
    docs: qa(`SELECT id,name,mime,size,created_at FROM emp_docs WHERE employee_id=? ORDER BY created_at DESC`, e.id).map(d => ({ id: d.id, name: d.name, size: d.size, createdAt: d.created_at })) });
}, { auth: true });
on('PUT', '/api/rh/employees/:id', async (req, res, { user, params, body }) => {
  const e = ownEmp(user, params.id); if (!e) return fail(res, 404, 'Salarié introuvable.');
  let b; try { b = readEmp(body); } catch (x) { return fail(res, x.code || 400, x.message); }
  run(`UPDATE employees SET name=?,email=?,phone=?,job=?,service=?,contract=?,start_date=?,end_date=?,notes=?,leave_init=?,active=? WHERE id=?`, b.name, b.email, b.phone, b.job, b.service, b.contract, b.start, b.end, b.notes, b.init, b.active, e.id);
  send(res, 200, { ok: true });
}, { auth: true });
on('DELETE', '/api/rh/employees/:id', async (req, res, { user, params }) => {
  const e = ownEmp(user, params.id); if (!e) return fail(res, 404, 'Salarié introuvable.');
  for (const d of qa(`SELECT id FROM emp_docs WHERE employee_id=?`, e.id)) { try { fs.rmSync(path.join(DOC_DIR, `${d.id}.bin`)); } catch {} }
  run(`DELETE FROM employees WHERE id=?`, e.id); send(res, 200, { ok: true });
}, { auth: true });
on('POST', '/api/rh/employees/:id/leaves', async (req, res, { user, params, body }) => {
  const e = ownEmp(user, params.id); if (!e) return fail(res, 404, 'Salarié introuvable.');
  if (!isDate(body.start) || !isDate(body.end) || body.end < body.start) return fail(res, 400, 'Indiquez des dates de début et de fin valides.');
  const kind = LEAVE_KINDS.includes(body.kind) ? body.kind : 'Congé payé', days = body.days != null && body.days !== '' ? Math.max(0.5, Math.min(365, +body.days)) : workDays(body.start, body.end);
  const status = { demandee: 'demandee', validee: 'validee', refusee: 'refusee' }[body.status] || 'validee';
  run(`INSERT INTO leaves(employee_id,kind,start_date,end_date,days,status,comment,created_at) VALUES(?,?,?,?,?,?,?,?)`, e.id, kind, body.start, body.end, days, status, clean(body.comment, 500), now());
  send(res, 200, { ok: true });
}, { auth: true });
on('PUT', '/api/rh/leaves/:id', async (req, res, { user, params, body }) => {
  const l = q1(`SELECT l.* FROM leaves l JOIN employees e ON e.id=l.employee_id WHERE l.id=? AND e.company_id=?`, +params.id, user.company_id); if (!l) return fail(res, 404, 'Absence introuvable.');
  const status = { demandee: 'demandee', validee: 'validee', refusee: 'refusee' }[body.status]; if (!status) return fail(res, 400, 'Statut inconnu.');
  run(`UPDATE leaves SET status=? WHERE id=?`, status, l.id); send(res, 200, { ok: true });
}, { auth: true });
on('DELETE', '/api/rh/leaves/:id', async (req, res, { user, params }) => {
  const l = q1(`SELECT l.* FROM leaves l JOIN employees e ON e.id=l.employee_id WHERE l.id=? AND e.company_id=?`, +params.id, user.company_id); if (!l) return fail(res, 404, 'Absence introuvable.');
  run(`DELETE FROM leaves WHERE id=?`, l.id); send(res, 200, { ok: true });
}, { auth: true });
const DOC_TYPES = { '%PDF-': 'application/pdf', '\x89PNG': 'image/png', '\xff\xd8\xff': 'image/jpeg' };
on('POST', '/api/rh/employees/:id/docs', async (req, res, { user, params, body }) => {
  const e = ownEmp(user, params.id); if (!e) return fail(res, 404, 'Salarié introuvable.');
  const buf = Buffer.from(String(body.data || ''), 'base64'); if (buf.length < 50) return fail(res, 400, 'Fichier vide.');
  if (buf.length > 5 * 1024 * 1024) return fail(res, 413, 'Le fichier ne doit pas dépasser 5 Mo.');
  const head = buf.subarray(0, 5).toString('latin1'), mime = Object.entries(DOC_TYPES).find(([k]) => head.startsWith(k))?.[1];
  if (!mime) return fail(res, 400, 'Formats acceptés : PDF, JPEG ou PNG.');
  const id = run(`INSERT INTO emp_docs(employee_id,name,mime,size,created_at) VALUES(?,?,?,?,?)`, e.id, clean(body.name, 160) || 'document', mime, buf.length, now()).lastInsertRowid;
  fs.writeFileSync(path.join(DOC_DIR, `${id}.bin`), buf); send(res, 200, { id });
}, { auth: true, maxBody: 7_200_000 });
on('GET', '/api/rh/docs/:id', async (req, res, { user, params }) => {
  const d = q1(`SELECT d.* FROM emp_docs d JOIN employees e ON e.id=d.employee_id WHERE d.id=? AND e.company_id=?`, +params.id, user.company_id); if (!d) return fail(res, 404, 'Document introuvable.');
  const f = path.join(DOC_DIR, `${d.id}.bin`); if (!fs.existsSync(f)) return fail(res, 404, 'Fichier manquant.');
  res.writeHead(200, { 'Content-Type': d.mime, 'Content-Disposition': `inline; filename="${String(d.name).replace(/[^\w.\- ]/g, '_')}"`, 'Cache-Control': 'private, no-store' }); res.end(fs.readFileSync(f));
}, { auth: true });
on('DELETE', '/api/rh/docs/:id', async (req, res, { user, params }) => {
  const d = q1(`SELECT d.* FROM emp_docs d JOIN employees e ON e.id=d.employee_id WHERE d.id=? AND e.company_id=?`, +params.id, user.company_id); if (!d) return fail(res, 404, 'Document introuvable.');
  try { fs.rmSync(path.join(DOC_DIR, `${d.id}.bin`)); } catch {} run(`DELETE FROM emp_docs WHERE id=?`, d.id); send(res, 200, { ok: true });
}, { auth: true });

/* équipe : plusieurs recruteurs par entreprise */
on('GET', '/api/team', async (req, res, { user }) => {
  const members = qa(`SELECT id,name,email,role,created_at FROM users WHERE company_id=? ORDER BY id`, user.company_id).map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role, createdAt: m.created_at, me: m.id === user.id }));
  const pending = qa(`SELECT name,email,expires FROM team_invites WHERE company_id=? AND expires>? ORDER BY expires DESC`, user.company_id, now());
  send(res, 200, { members, pending, canManage: user.role !== 'recruteur' });
}, { auth: true });
on('POST', '/api/team/invite', async (req, res, { user, body }) => {
  if (user.role === 'recruteur') return fail(res, 403, 'Seul l’administrateur du compte peut inviter des collègues.');
  if (!canReach(user)) return fail(res, 403, reachMsg(user));
  const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase();
  if (!name) return fail(res, 400, 'Indiquez le nom de votre collègue.');
  if (!isEmail(email)) return fail(res, 400, 'Adresse e-mail invalide.');
  if (q1(`SELECT id FROM users WHERE email=?`, email)) return fail(res, 409, 'Cette adresse a déjà un compte recruteur sur Genius Recrutement.');
  if (q1(`SELECT COUNT(*) n FROM users WHERE company_id=?`, user.company_id).n >= 10) return fail(res, 400, 'Votre compte compte déjà 10 recruteurs.');
  run(`DELETE FROM team_invites WHERE company_id=? AND email=?`, user.company_id, email);
  const tok = rnd(32); run(`INSERT INTO team_invites(token,company_id,name,email,by_user,expires) VALUES(?,?,?,?,?,?)`, sha(tok), user.company_id, name, email, user.id, now() + 7 * 864e5);
  const r = await sendMail({ to: email, companyId: user.company_id, replyTo: user.email, subject: `${user.name} vous invite à rejoindre ${user.company} sur Genius Recrutement`, html: mailLayout('Rejoignez l’équipe de recrutement',
    `<p>Bonjour ${esc(name)},</p><p>${esc(user.name)} vous invite à rejoindre l’espace de recrutement de <b>${esc(user.company)}</b> : offres, candidatures et résultats des tests, partagés avec toute l’équipe.</p>${button(`${BASE_URL}/app#/rejoindre/${tok}`, 'Créer mon accès')}<p style="font-size:13px;color:#4A5565">Ce lien est valable 7 jours.</p>`, user.company_id) });
  send(res, 200, { ok: true, sent: !!r.sent, link: r.sent ? null : `${BASE_URL}/app#/rejoindre/${tok}` });
}, { auth: true });
on('DELETE', '/api/team/:id', async (req, res, { user, params }) => {
  if (user.role === 'recruteur') return fail(res, 403, 'Seul l’administrateur du compte peut retirer un collègue.');
  const m = q1(`SELECT * FROM users WHERE id=? AND company_id=?`, +params.id, user.company_id); if (!m) return fail(res, 404, 'Collègue introuvable.');
  if (m.id === user.id) return fail(res, 400, 'Vous ne pouvez pas retirer votre propre accès.');
  run(`DELETE FROM users WHERE id=?`, m.id); send(res, 200, { ok: true });
}, { auth: true });
on('GET', '/api/team/join/:token', async (req, res, { params }) => {
  const i = q1(`SELECT i.*, c.name AS company FROM team_invites i JOIN companies c ON c.id=i.company_id WHERE i.token=? AND i.expires>?`, sha(params.token), now());
  if (!i) return fail(res, 404, 'Ce lien d’invitation n’est plus valable. Demandez à votre collègue de vous inviter à nouveau.');
  send(res, 200, { name: i.name, email: i.email, company: i.company });
});
on('POST', '/api/team/join', async (req, res, { body }) => {
  const i = q1(`SELECT * FROM team_invites WHERE token=? AND expires>?`, sha(String(body.token || '')), now());
  if (!i) return fail(res, 404, 'Ce lien d’invitation n’est plus valable.');
  const pass = String(body.password || ''); if (pass.length < 8) return fail(res, 400, 'Le mot de passe doit faire au moins 8 caractères.');
  if (q1(`SELECT id FROM users WHERE email=?`, i.email)) return fail(res, 409, 'Un compte existe déjà avec cette adresse. Connectez-vous.');
  const uid = run(`INSERT INTO users(company_id,name,email,pass,created_at,verified,role) VALUES(?,?,?,?,?,1,'recruteur')`, i.company_id, clean(body.name, 120) || i.name, i.email, hashPass(pass), now()).lastInsertRowid;
  run(`DELETE FROM team_invites WHERE token=?`, i.token);
  setSession(res, uid); send(res, 200, { user: userOut(currentUserById(uid)) });
});

/* vérification des adresses e-mail */
function consumeVerify(tok) {
  const v = q1(`SELECT * FROM verifs WHERE token=? AND expires>?`, sha(String(tok)), now()); if (!v) return null;
  run(`DELETE FROM verifs WHERE token=?`, v.token);
  if (v.kind === 'user') { run(`UPDATE users SET verified=1 WHERE id=?`, v.ref_id); const u = q1(`SELECT company_id FROM users WHERE id=?`, v.ref_id); if (u) announcePending(u.company_id); }
  else { run(`UPDATE cusers SET verified=1 WHERE id=?`, v.ref_id); releasePending(v.ref_id); }
  return v.kind;
}
on('POST', '/api/verify/resend', async (req, res, { user }) => {
  if (user.verified) return send(res, 200, { ok: true, already: true });
  const r = await sendVerify('user', user.id, user.email, user.name); send(res, 200, { ok: true, sent: !!r.sent });
}, { auth: true });

on('POST', '/api/cand/verify/resend', withCand(async (req, res, { cu }) => {
  if (cu.verified) return send(res, 200, { ok: true, already: true });
  const r = await sendVerify('cand', cu.id, cu.email, cu.name); send(res, 200, { ok: true, sent: !!r.sent });
}));

/* administration de la plateforme (propriétaire) */
const superOnly = h => async (req, res, ctx) => isSuper(ctx.user) ? h(req, res, ctx) : fail(res, 403, 'Réservé au propriétaire de la plateforme.');
on('GET', '/api/admin/companies', superOnly(async (req, res) => {
  const rows = qa(`SELECT c.id, c.name, c.status, c.created_at, (SELECT name FROM users WHERE company_id=c.id ORDER BY id LIMIT 1) AS uname,
    (SELECT email FROM users WHERE company_id=c.id ORDER BY id LIMIT 1) AS uemail, (SELECT verified FROM users WHERE company_id=c.id ORDER BY id LIMIT 1) AS uverified,
    (SELECT COUNT(*) FROM offers WHERE company_id=c.id) AS offers, (SELECT COUNT(*) FROM tests WHERE company_id=c.id) AS tests
    FROM companies c ORDER BY CASE c.status WHEN 'en_attente' THEN 0 WHEN 'suspendue' THEN 1 ELSE 2 END, c.created_at DESC`);
  const stats = { companies: rows.length, pending: rows.filter(r => r.status === 'en_attente').length,
    candidates: q1(`SELECT COUNT(*) n FROM cusers`).n, offers: q1(`SELECT COUNT(*) n FROM offers WHERE status='ouverte'`).n, applications: q1(`SELECT COUNT(*) n FROM applications`).n };
  stats.unverified = q1(`SELECT COUNT(*) n FROM cusers WHERE verified=0`).n;
  const cands = qa(`SELECT u.id,u.name,u.email,u.family,u.verified,u.created_at,u.cv_name,(SELECT COUNT(*) FROM applications a WHERE a.cu_id=u.id) AS apps FROM cusers u ORDER BY u.created_at DESC LIMIT 100`)
    .map(u => ({ name: u.name, email: u.email, family: (FAMILIES.find(f => f.k === u.family) || {}).name || '', verified: !!u.verified, createdAt: u.created_at, cv: !!u.cv_name, apps: u.apps }));
  const mails = qa(`SELECT recipient,subject,status,error,created_at FROM outbox WHERE company_id IS NULL ORDER BY id DESC LIMIT 30`);
  send(res, 200, { companies: rows.map(r => ({ id: r.id, name: r.name, status: r.status, createdAt: r.created_at, user: r.uname, email: r.uemail, verified: !!r.uverified, offers: r.offers, tests: r.tests })), stats, candidates: cands, mails });
}), { auth: true });
on('POST', '/api/admin/cand-verify', superOnly(async (req, res, { body }) => {
  const cu = q1(`SELECT * FROM cusers WHERE email=?`, clean(body.email, 200).toLowerCase()); if (!cu) return fail(res, 404, 'Candidat introuvable.');
  if (body.confirm) { run(`UPDATE cusers SET verified=1 WHERE id=?`, cu.id); await releasePending(cu.id); return send(res, 200, { ok: true }); }
  const r = await sendVerify('cand', cu.id, cu.email, cu.name); send(res, 200, { ok: true, sent: !!r.sent });
}), { auth: true });
on('PUT', '/api/admin/companies/:id', superOnly(async (req, res, { params, body }) => {
  const c = q1(`SELECT * FROM companies WHERE id=?`, +params.id); if (!c) return fail(res, 404, 'Entreprise introuvable.');
  const st = { valide: 'valide', suspendue: 'suspendue', en_attente: 'en_attente' }[body.status]; if (!st) return fail(res, 400, 'Statut inconnu.');
  run(`UPDATE companies SET status=? WHERE id=?`, st, c.id);
  const u = q1(`SELECT * FROM users WHERE company_id=? ORDER BY id LIMIT 1`, c.id);
  let alerted = 0;
  if (st === 'valide' && c.status !== 'valide') {
    if (u) sendMail({ to: u.email, companyId: c.id, subject: 'Votre entreprise est validée sur Genius Recrutement', html: mailLayout('Votre compte est validé',
      `<p>Bonjour ${esc(u.name)},</p><p>Le compte de <b>${esc(c.name)}</b> est validé. Vos offres sont maintenant visibles par les candidats, et vous pouvez envoyer vos tests par e-mail.</p>${button(`${BASE_URL}/app`, 'Ouvrir Genius Recrutement')}`, c.id) });
    alerted = await announcePending(c.id);
  }
  send(res, 200, { ok: true, alerted });
}), { auth: true });

const PUB = path.join(ROOT, 'public');
const SEC_HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' };
const server = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(SEC_HEADERS)) res.setHeader(k, v);
  const url = new URL(req.url, 'http://x'), p = decodeURIComponent(url.pathname);
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  try {
    if (p.startsWith('/api/')) {
      for (const r of routes) {
        if (r.method !== req.method) continue; const m = p.match(r.re); if (!m) continue;
        const user = currentUser(req);
        if (r.opts.auth && !user) return fail(res, 401, 'Connectez-vous pour continuer.');
        const body = ['POST', 'PUT'].includes(req.method) ? await readJson(req, r.opts.maxBody) : {};
        return await r.handler(req, res, { user, body, params: m.groups || {}, ip, query: url.searchParams });
      }
      return fail(res, 404, 'Adresse inconnue.');
    }
    if (p === '/' || p === '/index.html') return serveFile(res, path.join(PUB, 'index.html'));
    if (p === '/app' || p === '/app/') return serveFile(res, path.join(PUB, 'app.html'));
    if (/^\/t\/[\w-]+$/.test(p)) return serveFile(res, path.join(PUB, 'test.html'), { 'X-Robots-Tag': 'noindex' });
    if (/^\/offre\/\d+(-[a-z0-9-]*)?$/.test(p)) {
      const o = q1(`SELECT o.*, c.name AS company, c.logo_v FROM offers o JOIN companies c ON c.id=o.company_id WHERE o.id=? AND c.status='valide'`, +p.split('/')[2].split('-')[0]);
      if (!o) { res.writeHead(302, { Location: '/espace#/offres' }); return res.end(); }
      countView(req, o.id);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); return res.end(offerPage(o));
    }
    if (/^\/verifier\/[\w-]+$/.test(p)) {
      const kind = consumeVerify(p.split('/').pop());
      res.writeHead(302, { Location: kind === 'user' ? '/app#/accueil/verifie' : kind === 'cand' ? '/espace#/offres/verifie' : '/?lien=expire' }); return res.end();
    }
    if (p === '/espace' || p === '/espace/' || p === '/offres') return serveFile(res, path.join(PUB, 'candidat.html'));
    if (p === '/confidentialite') return serveFile(res, path.join(PUB, 'confidentialite.html'));
    if (p === '/mentions-legales') return serveFile(res, path.join(PUB, 'mentions-legales.html'));
    if (p === '/essai') { res.writeHead(301, { Location: '/essai/' }); return res.end(); }
    const f = path.normalize(path.join(PUB, p.endsWith('/') ? p + 'index.html' : p));
    if (!f.startsWith(PUB + path.sep)) return send(res, 404, 'Page introuvable');
    return serveFile(res, f);
  } catch (e) {
    if (e.code && e.code >= 400 && e.code < 500) return fail(res, e.code, e.message);
    console.error(e); return fail(res, 500, 'Erreur du serveur. Réessayez dans un instant.');
  }
});
server.listen(PORT, () => console.log(`Genius Recrutement v1 sur le port ${PORT} — ${BASE_URL}`));
