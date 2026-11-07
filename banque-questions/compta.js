// Comptabilité et finance (référentiel SYSCOHADA révisé, Sénégal)
const { make, S, M, D } = require('./lib');
const { out, Q, P } = make('compta');

/* ---------- Connaissances : Simple ---------- */
Q('CO-M01','M',S,'Plan comptable','Dans le SYSCOHADA, quelle classe regroupe les comptes de trésorerie (banque, caisse) ?',
 ['La classe 5','La classe 4','La classe 3','La classe 7']);
Q('CO-M02','M',S,'Comptes de tiers','Le compte 401 correspond aux :',
 ['Fournisseurs','Clients','Personnel','Organismes sociaux']);
Q('CO-M03','M',S,'Comptes de tiers','Le compte 411 correspond aux :',
 ['Clients','Fournisseurs','Banques','Associés']);
Q('CO-M04','M',S,'Partie double','Selon le principe de la partie double :',
 ['Chaque opération est débitée et créditée du même montant','Chaque facture est saisie deux fois par sécurité','Chaque opération est vérifiée par deux comptables','Les ventes vont au débit et les achats au crédit']);
Q('CO-M05','M',S,'TVA au Sénégal','Quel est le taux normal de TVA au Sénégal ?',
 ['18 %','20 %','16 %','10 %']);
Q('CO-M06','M',S,'Pièces justificatives','Pourquoi chaque écriture doit-elle s’appuyer sur une pièce justificative ?',
 ['Pour prouver l’opération en cas de contrôle','Pour que le logiciel valide l’écriture seul','Parce que le client doit en recevoir une copie','Pour pouvoir annuler l’écriture plus tard']);
Q('CO-M07','M',S,'Charges et produits','Dans quelle classe enregistre-t-on les achats de marchandises ?',
 ['La classe 6','La classe 7','La classe 3','La classe 2']);
Q('CO-M08','M',S,'Exercice comptable','Dans l’espace OHADA, l’exercice comptable correspond en principe :',
 ['À l’année civile, du 1er janvier au 31 décembre','À l’année scolaire, d’octobre à septembre','Aux douze mois suivant la création, sans exception','À une période choisie librement chaque année']);
Q('CO-M09','M',S,'Immobilisation','Lequel de ces achats est une immobilisation ?',
 ['Un véhicule de livraison utilisé plusieurs années','Un lot de marchandises destinées à la revente','Des fournitures de bureau pour le trimestre','Une année d’abonnement internet payée d’avance']);
Q('CO-M10','M',S,'Facture','Quelles mentions doivent figurer sur une facture ?',
 ['Numéro, date, parties, détail, HT, TVA et TTC','Numéro, date et signature du comptable','Nom du commercial, date et montant TTC','Détail, montant TTC et téléphone du client']);

/* ---------- Connaissances : Moyenne ---------- */
Q('CO-M11','M',M,'Rapprochement bancaire','À quoi sert le rapprochement bancaire ?',
 ['À expliquer les écarts entre le compte banque et le relevé','À faire corriger par la banque ses frais injustifiés','À vérifier que les clients ont payé dans les délais','À calculer les agios du découvert de la période']);
Q('CO-M12','M',M,'TVA à payer','Comment se calcule la TVA à payer sur une période ?',
 ['TVA collectée − TVA déductible','TVA déductible − TVA collectée','TVA collectée, sans déduction','18 % du bénéfice de la période']);
Q('CO-M13','M',M,'Amortissement','Que traduit l’amortissement d’une immobilisation ?',
 ['La perte de valeur du bien, étalée sur sa durée d’utilisation','Le remboursement de l’emprunt qui a financé le bien','Le coût d’entretien annuel nécessaire au bon état du bien','La valeur de revente estimée du bien en fin d’usage']);
Q('CO-M14','M',M,'Principe de prudence','Que prévoit le principe de prudence ?',
 ['Constater les pertes probables, pas les gains incertains','Constater les gains probables pour une image fidèle','Ne jamais constituer de provisions dans les comptes','Garder trois mois de charges en trésorerie']);
Q('CO-M15','M',M,'Indépendance des exercices','Une assurance annuelle payée le 1er octobre couvre jusqu’au 30 septembre suivant. Au 31 décembre, que fait-on ?',
 ['On constate une charge constatée d’avance pour 9 mois','On garde toute la charge sur l’exercice en cours','On reporte toute la charge sur l’exercice suivant','On partage la charge à parts égales sur deux exercices']);
Q('CO-M16','M',M,'États financiers','Que comprennent les états financiers annuels du système normal SYSCOHADA ?',
 ['Bilan, compte de résultat, flux de trésorerie, notes annexes','Bilan, grand livre, balance générale et journal général','Compte de résultat, budget annuel et rapport du gérant','Bilan, relevés bancaires et déclarations fiscales annuelles']);
Q('CO-M17','M',M,'Balance','À quoi sert la balance générale ?',
 ['À contrôler l’égalité débit-crédit et voir le solde des comptes','À lister toutes les factures clients restant à encaisser','À présenter le résultat de l’exercice aux associés réunis','À comparer les dépenses réelles au budget prévu pour l’année']);
Q('CO-M18','M',M,'Créances douteuses','Un client en difficulté ne paiera sans doute qu’une partie de sa dette. Que fait le comptable ?',
 ['Il la classe en douteuse et constate une dépréciation','Il retire immédiatement la créance du bilan','Il attend la liquidation du client pour agir','Il ajoute les intérêts de retard à la créance']);
Q('CO-M19','M',M,'Trésorerie et résultat','Pourquoi une entreprise bénéficiaire peut-elle manquer de trésorerie ?',
 ['Ses clients paient tard ou elle a beaucoup investi','Le bénéfice et la trésorerie sont toujours égaux','La TVA collectée est comptée dans le bénéfice','C’est impossible : un bénéfice est de la trésorerie']);
Q('CO-M20','M',M,'Balance âgée','Que montre une balance âgée des clients ?',
 ['Les créances classées par ancienneté de retard','Les clients classés par date de création','Le chiffre d’affaires cumulé de chaque client','Les clients sans commande depuis un an']);

/* ---------- Connaissances : Difficile ---------- */
Q('CO-M21','M',D,'Amortissement linéaire','Une machine de 6 000 000 FCFA achetée le 1er juillet est amortie sur 5 ans en linéaire. Dotation de la 1re année (clôture au 31 décembre) ?',
 ['600 000 FCFA','1 200 000 FCFA','1 000 000 FCFA','500 000 FCFA']);
Q('CO-M22','M',D,'Écriture de vente','Vente à crédit de 1 000 000 FCFA HT, TVA 18 %. Quelle écriture est correcte ?',
 ['D 411 : 1 180 000 / C 701 : 1 000 000 / C 443 : 180 000','D 701 : 1 000 000 / D 443 : 180 000 / C 411 : 1 180 000','D 411 : 1 000 000 / C 701 : 1 000 000','D 521 : 1 180 000 / C 701 : 1 180 000']);
Q('CO-M23','M',D,'Classe 8','Dans le SYSCOHADA, à quoi correspondent les comptes de la classe 8 ?',
 ['Aux charges et produits hors activités ordinaires','Aux engagements donnés et reçus hors bilan','À la comptabilité analytique de gestion','Aux comptes de stocks et d’en-cours']);
Q('CO-M24','M',D,'Fonds de roulement','Le fonds de roulement est positif lorsque :',
 ['Les ressources stables dépassent les emplois stables','Les dettes à court terme dépassent les créances','La trésorerie nette de l’entreprise est négative','Le résultat net de l’exercice est bénéficiaire']);
Q('CO-M25','M',D,'Besoin en fonds de roulement','Quel événement augmente le besoin en fonds de roulement ?',
 ['Un délai de paiement plus long accordé aux clients','Un délai de paiement plus long obtenu des fournisseurs','Une réduction du niveau des stocks','Une augmentation du capital social']);
Q('CO-M26','M',D,'Provision et dépréciation','Quelle est la différence entre une provision et une dépréciation ?',
 ['La provision couvre un risque futur ; la dépréciation, un actif','La provision vise les clients ; la dépréciation, les fournisseurs','La provision est fiscale ; la dépréciation est seulement comptable','Aucune : les deux termes désignent la même écriture']);
Q('CO-M27','M',D,'Variation de stock','Le stock final de marchandises est supérieur au stock initial. Effet sur le résultat ?',
 ['Il augmente','Il diminue','Aucun effet','Il baisse du stock final']);
Q('CO-M28','M',D,'Impôt sur les sociétés','Quel est le taux de droit commun de l’impôt sur les sociétés au Sénégal ?',
 ['30 %','25 %','35 %','18 %']);
Q('CO-M29','M',D,'Charges à payer','La facture d’électricité de décembre arrive en janvier. Que fait-on au 31 décembre ?',
 ['On enregistre une charge à payer estimée','On attend la facture pour l’enregistrer','On l’enregistre en charge constatée d’avance','On l’enregistre en dette fournisseur de janvier']);
Q('CO-M30','M',D,'Contrôle interne','Pourquoi sépare-t-on paiement et enregistrement comptable ?',
 ['Pour limiter les risques d’erreur et de fraude','Pour accélérer le traitement des factures','Parce que la loi interdit au comptable de payer','Pour que chaque service tienne ses comptes']);

/* ---------- Mises en situation ---------- */
P('CO-S01',S,'Dépense sans facture','Un collègue vous demande d’enregistrer une dépense sans facture, « on l’aura plus tard ». Que faites-vous ?',
 [['Je mets l’opération en attente jusqu’à réception de la pièce',2],['Je l’enregistre en notant qu’il manque la facture',1],['Je l’enregistre : c’est un collègue de confiance',0],['Je refuse sans lui donner d’explication',0]]);
P('CO-S02',S,'Écart de caisse','En fin de journée, la caisse présente un manque de 15 000 FCFA. Que faites-vous ?',
 [['Je recompte, je revois les opérations, puis je signale',2],['Je signale l’écart à mon responsable sans chercher',1],['Je complète avec mon argent pour équilibrer la caisse',0],['Je modifie une opération pour faire disparaître l’écart',0]]);
P('CO-S03',S,'Erreur de saisie','Vous découvrez une erreur dans une écriture saisie la semaine dernière. Que faites-vous ?',
 [['Je la corrige par une écriture qui garde la trace',2],['Je préviens mon responsable avant de corriger',1],['Je supprime l’écriture fausse et je la ressaisis',0],['Je la laisse telle quelle, l’écart est faible',0]]);
P('CO-S04',S,'Fournisseur pressant','Un fournisseur veut être payé tout de suite, mais sa facture n’est pas encore validée. Que faites-vous ?',
 [['J’explique le circuit et je relance le service valideur',2],['Je lui donne une date approximative de paiement',1],['Je le paie tout de suite pour éviter les tensions',0],['Je lui demande de rappeler la semaine prochaine',0]]);
P('CO-S05',S,'Pièces en retard','Les pièces à classer s’accumulent sur votre bureau. Que faites-vous ?',
 [['Je bloque un moment chaque jour pour classer au fil de l’eau',2],['Je les range dans un carton et je classe en fin de mois',1],['Je jette les doublons sans vérifier leur contenu',0],['J’attends l’inventaire de fin d’année pour tout classer',0]]);
P('CO-S06',S,'Facture contestée','Un client conteste une facture par téléphone. Que faites-vous ?',
 [['Je note, je vérifie facture et bon de livraison, je rappelle',2],['Je lui demande d’envoyer sa contestation par écrit',1],['Je lui établis un avoir tout de suite pour le satisfaire',0],['Je lui réponds que la facture est forcément exacte',0]]);
P('CO-S07',S,'Nouveau logiciel','On vous demande d’utiliser un logiciel comptable que vous ne connaissez pas. Que faites-vous ?',
 [['Je demande une prise en main et je m’entraîne sur des cas simples',2],['Je me débrouille en testant les menus un par un',1],['Je continue sur Excel, que je maîtrise mieux',0],['J’attends une formation officielle avant de l’utiliser',0]]);
P('CO-S08',M,'Relevé manquant','La clôture mensuelle est demain et il manque les relevés d’une banque. Que faites-vous ?',
 [['Je les obtiens auprès de la banque et je préviens du risque',2],['Je clôture sans cette banque et je régulariserai',1],['J’estime les mouvements de la banque à vue d’œil',0],['Je repousse la clôture sans en avertir personne',0]]);
P('CO-S09',M,'Note de frais douteuse','Un responsable vous transmet en note de frais un repas de famille. Que faites-vous ?',
 [['Je ne la passe pas en charge et j’en parle avec lui',2],['Je lui demande de confirmer par écrit son caractère professionnel',1],['Je l’enregistre : c’est un responsable',0],['Je l’enregistre dans un autre compte, plus discret',0]]);
P('CO-S10',M,'Client en retard','Un client important a 90 jours de retard. Le commercial vous demande de ne pas le relancer. Que faites-vous ?',
 [['J’en parle avec le commercial et le financier pour une relance adaptée',2],['Je respecte sa demande et je surveille le dossier de près',1],['Je relance fermement le client sans prévenir le commercial',0],['Je bloque ses commandes sans en parler à personne',0]]);
P('CO-S11',M,'Vérification fiscale','L’entreprise reçoit un avis de vérification fiscale. Que faites-vous ?',
 [['Je préviens la direction et je rassemble pièces et déclarations',2],['Je prépare les documents de la dernière année seulement',1],['Je retire du classement les pièces qui pourraient gêner',0],['J’attends l’arrivée du vérificateur pour savoir quoi fournir',0]]);
P('CO-S12',M,'Paiement non identifié','Un client a payé un montant qui ne correspond à aucune facture. Que faites-vous ?',
 [['Je cherche les factures visées et, au besoin, je l’interroge',2],['Je l’impute sur la facture la plus ancienne du client',1],['Je l’enregistre en produit divers pour solder',0],['Je laisse le paiement non lettré dans le compte',0]]);
P('CO-S13',M,'Paiement en espèces','Un client veut régler une grosse facture en espèces. Que faites-vous ?',
 [['J’applique la procédure et les plafonds légaux, avec reçu',2],['J’accepte et je dépose les fonds en banque le jour même',1],['J’accepte sans reçu pour aller plus vite',0],['Je refuse tout paiement en espèces, quel qu’il soit',0]]);
P('CO-S14',M,'Budget dépassé','Le service marketing a dépassé son budget de 20 %. Que faites-vous ?',
 [['J’analyse l’écart et je le présente avec ses explications',2],['J’informe le responsable financier du dépassement',1],['Je bloque tous les paiements du service sans prévenir',0],['Je ne dis rien : ce n’est pas mon rôle',0]]);
P('CO-S15',D,'Décaler des ventes','Le directeur vous demande de rattacher des ventes de janvier à l’année précédente pour améliorer le résultat. Que faites-vous ?',
 [['Je refuse et je lui explique les risques',2],['Je lui demande une instruction écrite',1],['Je le fais : c’est sa responsabilité',0],['Je le fais pour une partie seulement',0]]);
P('CO-S16',D,'Fraude suspectée','Vous remarquez des paiements réguliers à un fournisseur inconnu, toujours validés par la même personne. Que faites-vous ?',
 [['Je rassemble les éléments et je les signale à la direction',2],['J’interroge directement la personne qui valide',1],['J’en parle à mes collègues pour avoir leur avis',0],['Je ne fais rien tant que je n’ai pas de preuve',0]]);
P('CO-S17',D,'Erreur de TVA','Vous découvrez une erreur en défaveur de l’État dans une déclaration de TVA déposée. Que faites-vous ?',
 [['J’informe mon responsable et nous régularisons',2],['Je corrige discrètement dans la déclaration suivante',1],['Je ne dis rien : l’écart passera inaperçu',0],['J’attends un éventuel contrôle pour en parler',0]]);
P('CO-S18',D,'Trésorerie tendue','La trésorerie ne permet pas de payer toutes les échéances de la semaine. Que faites-vous ?',
 [['Je propose des priorités et des solutions : relances, reports négociés',2],['Je paie les factures dans leur ordre d’arrivée',1],['Je paie d’abord les fournisseurs qui relancent le plus',0],['Je décale les salaires de quelques jours',0]]);
P('CO-S19',D,'Désaccord avec l’auditeur','Le commissaire aux comptes conteste un traitement que vous pensez correct. Que faites-vous ?',
 [['J’argumente avec les textes et j’accepte s’il a raison',2],['Je me range à son avis pour éviter le conflit',1],['Je maintiens ma position sans entrer dans le détail',0],['Je ne lui transmets plus les pièces de ce dossier',0]]);
P('CO-S20',D,'Échéances simultanées','Paie, TVA et reporting sont attendus le même jour. Que faites-vous ?',
 [['Je priorise selon les échéances légales et je préviens du reste',2],['Je commence par la tâche la plus rapide à boucler',1],['J’avance les trois en parallèle, un peu chacune',0],['Je reporte la TVA, l’administration attendra',0]]);
P('CO-S21',D,'Salaire d’un collègue','Un collègue vous demande le salaire d’un autre employé. Que faites-vous ?',
 [['Je refuse poliment : c’est confidentiel',2],['Je lui dis de s’adresser aux RH',1],['Je lui donne seulement une fourchette',0],['Je lui donne le montant exact',0]]);

module.exports = out;
