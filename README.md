# Genius Recrutement : version de test

Version d'essai en ligne sur https://recrutement.alveris-consulting.com, sur le VPS LWS qui héberge aussi le CRM.

## Mise en ligne sur le VPS

```sh
cd
git clone https://github.com/consultingalveris-hash/genius-recrutement
bash genius-recrutement/installer
```

Le script lance un petit conteneur qui sert la page, puis ajoute un bloc au Caddyfile du CRM (sauvegarde automatique, validation avant rechargement, retour arrière en cas d'erreur). Le CRM n'est pas redémarré.

Mise à jour de la page : `cd ~/genius-recrutement && git pull` (rien d'autre à faire).

## Limite de cette version

Toutes les données restent dans le navigateur de chaque testeur ; aucun e-mail ne part. La version 1, avec comptes et base de données partagée, remplacera cette page.
