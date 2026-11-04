# Genius Recrutement : version de test

Version d'essai en ligne sur https://recrutement.alveris-consulting.com, servie par Caddy (HTTPS automatique) sur le VPS LWS.

## Mise en ligne sur le VPS

```sh
git clone https://github.com/<compte>/genius-recrutement.git /opt/genius-recrutement
cd /opt/genius-recrutement
docker compose up -d
```

Mise à jour : `git pull && docker compose restart proxy`.

Prérequis : un enregistrement DNS de type A, `recrutement` vers l'adresse IP du VPS, et les ports 80 et 443 libres.

## Limite de cette version

Toutes les données restent dans le navigateur de chaque testeur ; aucun e-mail ne part. La version 1, avec comptes et base de données partagée, remplacera cette page.
