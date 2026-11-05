# Genius Recrutement — version 1

En ligne sur https://recrutement.alveris-consulting.com, sur le VPS LWS qui héberge aussi le CRM.

- `/` : page d'accueil ; `/app` : espace recruteur (comptes entreprise) ; `/t/<lien>` : test du candidat ; `/essai/` : ancienne version d'essai complète (données dans le navigateur).
- Application Node 22 (`app/`), base SQLite dans le volume Docker `genius-recrutement-data` : sauvegarde quotidienne dans `/data/backups` (14 jours), et copie hebdomadaire envoyée par e-mail au propriétaire (hors serveur).
- E-mails : à régler par le propriétaire dans « Mon compte » (service SMTP, par exemple Brevo). Tant que ce n'est pas fait, les messages sont préparés mais ne partent pas, et les recruteurs copient les liens eux-mêmes.

## Installer ou mettre à jour sur le VPS

```sh
cd ~/genius-recrutement && git pull && bash installer
```

Le script construit l'application, la lance à côté du CRM et ajoute (ou met à jour) le bloc du sous-domaine dans le Caddyfile du CRM, avec sauvegarde, validation et retour arrière automatique. Le CRM n'est pas redémarré.

## Sécurisation du serveur (une seule fois)

```sh
cd ~/genius-recrutement && bash securiser
```

Pare-feu (entrées : 22, 80, 443 et réseau Docker), LLMNR coupé, et mise à jour automatique : toutes les 5 minutes, le serveur installe la dernière version publiée sur GitHub (branche `main`). Journal : `journalctl -u genius-mise-a-jour`.
