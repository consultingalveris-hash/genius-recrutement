// Genius Recrutement — version 1 (serveur)
// Comptes entreprise, tests de recrutement, invitations par e-mail, passage du test, résultats.
// Dépendances : Node 22 (node:sqlite intégré) + nodemailer.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import nodemailer from 'nodemailer';

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
const poolOf = (fam, c) => QDATA.bank.filter(q => q.c === c && (q.c === 'F' || q.c === 'L' ? q.fam === 'commun' : q.fam === fam));
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
for (const sql of [`ALTER TABLE tests ADD COLUMN family TEXT NOT NULL DEFAULT 'cc'`, `ALTER TABLE candidates ADD COLUMN perms TEXT`,
  `ALTER TABLE candidates ADD COLUMN qtime TEXT`, `ALTER TABLE candidates ADD COLUMN cur TEXT`, `ALTER TABLE candidates ADD COLUMN cur_since INTEGER`]) { try { db.exec(sql); } catch {} }
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
${lg ? `<img src="${esc(lg)}" alt="" style="max-height:56px;max-width:220px;display:block;margin-bottom:18px">` : '<div style="font-weight:700;color:#0B6E66;margin-bottom:16px">Genius Recrutement</div>'}<h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>${inner}
<p style="color:#4A5565;font-size:12px;margin-top:28px">Message envoyé automatiquement par Genius Recrutement.</p></div></div>`;
}
const button = (url, label) => `<p style="margin:22px 0"><a href="${esc(url)}" style="background:#0B6E66;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block">${esc(label)}</a></p><p style="font-size:12px;color:#4A5565">Si le bouton ne marche pas, copiez ce lien : ${esc(url)}</p>`;
async function sendMail({ to, subject, html, companyId = null, replyTo }) {
  const tr = getTransport();
  const id = run(`INSERT INTO outbox(company_id,recipient,subject,body,status,created_at) VALUES(?,?,?,?,?,?)`,
    companyId, to, subject, html, tr ? 'en_cours' : 'non_envoye', now()).lastInsertRowid;
  if (!tr) return { sent: false, test: true };
  try {
    await tr.t.sendMail({ from: tr.from, to, subject, html, replyTo });
    run(`UPDATE outbox SET status='envoye' WHERE id=?`, id); return { sent: true };
  } catch (e) {
    run(`UPDATE outbox SET status='echec', error=? WHERE id=?`, String(e.message || e).slice(0, 500), id);
    return { sent: false, error: true };
  }
}

/* ---------- tests et scores ---------- */
function testRow(t) {
  return { id: t.id, family: t.family || 'cc', familyName: (FAMILIES.find(f => f.k === t.family) || FAMILIES[0]).name, title: t.title, replyEmail: t.reply_email, perQ: t.per_q, count: t.count, weights: JSON.parse(t.weights),
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
  const ids = []; for (const c of COMPS) ids.push(...pools[c.k].slice(0, want[c.k]).map(q => q.id));
  return ids.sort(() => Math.random() - .5);
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
const limitSecs = t => t.count * t.per_q + 15;
function finishCandidate(c, t, timeout) {
  const order = JSON.parse(c.qorder || '[]'), answers = JSON.parse(c.answers || '{}');
  const s = score(t, order, answers), end = now();
  const secs = Math.min(limitSecs(t), Math.round((end - c.started_at) / 1000));
  run(`UPDATE candidates SET status='termine', ended_at=?, timeout=?, global=?, scores=?, secs=? WHERE id=?`,
    end, timeout ? 1 : 0, s.global, JSON.stringify(s.comp), secs, c.id);
  const co = q1(`SELECT name FROM companies WHERE id=?`, t.company_id);
  sendMail({ to: t.reply_email, companyId: t.company_id, subject: `Test terminé : ${c.name} (${s.global} %)`,
    html: mailLayout(`${c.name} a terminé le test`, `<p>Poste : <b>${esc(t.title)}</b><br>Note globale : <b>${s.global} %</b><br>Réponses données : ${s.answered} sur ${s.total}${timeout ? '<br>Temps dépassé' : ''}${c.exits ? `<br>Sorties de la page pendant le test : ${c.exits}` : ''}</p>
${button(`${BASE_URL}/app#/tests/${t.id}`, 'Voir le classement')}<p style="font-size:13px;color:#4A5565">${esc(co?.name || '')}</p>`) });
}
function sweep() {
  for (const c of qa(`SELECT c.*, t.per_q, t.count FROM candidates c JOIN tests t ON t.id=c.test_id WHERE c.status='en_cours'`)) {
    if ((now() - c.started_at) / 1000 > c.count * c.per_q + 15) {
      const t = q1(`SELECT * FROM tests WHERE id=?`, c.test_id); finishCandidate(c, t, true);
    }
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

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
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
async function readJson(req) {
  if (!/application\/json/.test(req.headers['content-type'] || '')) throw Object.assign(new Error('Format attendu : JSON'), { code: 415 });
  let size = 0; const chunks = [];
  for await (const ch of req) { size += ch.length; if (size > 200_000) throw Object.assign(new Error('Requête trop grande'), { code: 413 }); chunks.push(ch); }
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
  return q1(`SELECT u.id,u.name,u.email,u.company_id,c.name AS company FROM sessions s JOIN users u ON u.id=s.user_id JOIN companies c ON c.id=u.company_id WHERE s.token=? AND s.expires>?`, sha(tok), now()) || null;
}
const attempts = new Map();
function tooMany(key) {
  const t = now(), a = (attempts.get(key) || []).filter(x => t - x < 15 * 60_000); a.push(t); attempts.set(key, a); return a.length > 10;
}
const userOut = u => ({ name: u.name, email: u.email, company: u.company, logo: logoUrl(u.company_id), superadmin: !!SUPERADMIN && u.email === SUPERADMIN });

function candidateOut(c) {
  return { id: c.id, name: c.name, email: c.email, status: c.status, invitedAt: c.invited_at, startedAt: c.started_at, endedAt: c.ended_at,
    global: c.global, scores: c.scores ? JSON.parse(c.scores) : null, secs: c.secs, exits: c.exits, timeout: !!c.timeout, note: c.note || '',
    link: `${BASE_URL}/t/${c.token}` };
}
function invitationMail(t, c, companyName) {
  const mins = Math.ceil(t.count * t.per_q / 60);
  return mailLayout(`${companyName} vous invite à passer un test`, `<p>Bonjour ${esc(c.name)},</p>
<p>Dans le cadre de votre candidature au poste <b>${esc(t.title)}</b>, ${esc(companyName)} vous propose un test en ligne.</p>
<p>${t.count} questions, ${t.per_q} secondes par question, soit environ ${mins} minutes. Prévoyez un moment au calme : une fois commencé, le test se fait d'une traite.${t.deadline ? `<br>À passer avant le <b>${new Date(t.deadline + 'T12:00:00').toLocaleDateString('fr-FR')}</b>.` : ''}</p>
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
  const cid = run(`INSERT INTO companies(name,created_at) VALUES(?,?)`, company, now()).lastInsertRowid;
  const uid = run(`INSERT INTO users(company_id,name,email,pass,created_at) VALUES(?,?,?,?,?)`, cid, name, email, hashPass(pass), now()).lastInsertRowid;
  setSession(res, uid);
  sendMail({ to: email, companyId: cid, subject: 'Bienvenue sur Genius Recrutement',
    html: mailLayout('Votre compte est prêt', `<p>Bonjour ${esc(name)},</p><p>Le compte de <b>${esc(company)}</b> est créé. Vous pouvez préparer votre premier test et y inviter vos candidats.</p>${button(`${BASE_URL}/app`, 'Ouvrir Genius Recrutement')}`) });
  send(res, 200, { user: userOut(currentUserById(uid)) });
});
const currentUserById = id => q1(`SELECT u.id,u.name,u.email,u.company_id,c.name AS company FROM users u JOIN companies c ON c.id=u.company_id WHERE u.id=?`, id);
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
}, { auth: true });
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
  return { family, title, reply, perQ, count, weights: JSON.stringify(weights), back: body.back === false ? 0 : 1, deadline };
}
const ownTest = (user, id) => q1(`SELECT * FROM tests WHERE id=? AND company_id=?`, +id, user.company_id);
on('GET', '/api/meta', async (req, res) => send(res, 200, { comps: COMPS.map(c => ({ k: c.k, name: c.name, short: c.short, desc: c.desc, ask: c.ask })), bankSize: QDATA.bank.length,
  families: FAMILIES.map(f => ({ ...f, counts: Object.fromEntries(COMPS.map(c => [c.k, poolOf(f.k, c.k).length])) })), defaults: { perQ: 20, count: 30, weights: DEFAULT_WEIGHTS } }));
on('GET', '/api/tests', async (req, res, { user }) => {
  const rows = qa(`SELECT t.*, (SELECT COUNT(*) FROM candidates c WHERE c.test_id=t.id) AS n,
    (SELECT COUNT(*) FROM candidates c WHERE c.test_id=t.id AND c.status='termine') AS done FROM tests t WHERE company_id=? ORDER BY archived, created_at DESC`, user.company_id);
  send(res, 200, { tests: rows.map(t => ({ ...testRow(t), candidates: t.n, done: t.done, expired: expired(t) })) });
}, { auth: true });
on('POST', '/api/tests', async (req, res, { user, body }) => {
  const b = readTestBody(body, user);
  const id = run(`INSERT INTO tests(company_id,family,title,reply_email,per_q,count,weights,back,deadline,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    user.company_id, b.family, b.title, b.reply, b.perQ, b.count, b.weights, b.back, b.deadline, now()).lastInsertRowid;
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
  if (started && (b.count !== t.count || b.perQ !== t.per_q || b.weights !== t.weights || b.family !== (t.family || 'cc')))
    return fail(res, 409, 'Des candidats ont déjà commencé ce test : le métier, le nombre de questions, le temps et les poids ne peuvent plus changer. Créez un nouveau test si besoin.');
  run(`UPDATE tests SET family=?,title=?,reply_email=?,per_q=?,count=?,weights=?,back=?,deadline=? WHERE id=?`, b.family, b.title, b.reply, b.perQ, b.count, b.weights, b.back, b.deadline, t.id);
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
  const base = { company: co?.name || '', logo: logoUrl(t.company_id), title: t.title, name: c.name, count: t.count, perQ: t.per_q, back: !!t.back, status: c.status,
    expired: c.status === 'invite' && expired(t), deadline: t.deadline || '' };
  if (c.status !== 'en_cours') return base;
  const order = JSON.parse(c.qorder), answers = JSON.parse(c.answers || '{}'), perms = permsOf(c), spent = spentOf(c);
  const shown = {}; for (const [id, a] of Object.entries(answers)) shown[id] = perms[id] ? perms[id].indexOf(a) : a;
  return { ...base, elapsed: Math.round((now() - c.started_at) / 1000), limit: limitSecs(t), answers: shown, spent, current: c.cur || null,
    questions: order.map(id => { const q = BANK.get(id), p = perms[id] || q.o.map((_, i) => i); return { id, skill: q.skill, text: q.t, options: p.map(i => q.o[i][0]) }; }) };
}
function candContext(params) {
  const c = candByToken(params.token); if (!c) return null;
  const t = q1(`SELECT * FROM tests WHERE id=?`, c.test_id);
  if (c.status === 'en_cours' && (now() - c.started_at) / 1000 > limitSecs(t)) { finishCandidate(c, t, true); return candContext(params); }
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
  if ((spentOf(c)[body.id] || 0) > t.per_q + 3) return fail(res, 409, 'Le temps de cette question est écoulé.');
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
  if (x.c.status === 'en_cours') finishCandidate(x.c, x.t, (now() - x.c.started_at) / 1000 >= x.t.count * x.t.per_q);
  send(res, 200, { ok: true });
});

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
        const body = ['POST', 'PUT'].includes(req.method) ? await readJson(req) : {};
        return await r.handler(req, res, { user, body, params: m.groups || {}, ip, query: url.searchParams });
      }
      return fail(res, 404, 'Adresse inconnue.');
    }
    if (p === '/' || p === '/index.html') return serveFile(res, path.join(PUB, 'index.html'));
    if (p === '/app' || p === '/app/') return serveFile(res, path.join(PUB, 'app.html'));
    if (/^\/t\/[\w-]+$/.test(p)) return serveFile(res, path.join(PUB, 'test.html'), { 'X-Robots-Tag': 'noindex' });
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
