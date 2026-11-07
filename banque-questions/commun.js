// Français écrit et logique (communs à tous les métiers)
const { make, S, M, D } = require('./lib');
const { out, Q } = make('commun');
const F = (id, lvl, skill, t, o) => Q(id, 'F', lvl, skill, t, o);
const L = (id, lvl, skill, t, o) => Q(id, 'L', lvl, skill, t, o);

/* ===================== FRANÇAIS ===================== */
/* Simple */
F('FR-01',S,'Homophones','Choisissez la phrase correcte.',['Ils ont envoyé leur dossier hier.','Ils on envoyé leur dossier hier.','Ils ont envoyer leur dossier hier.','Ils ont envoyés leur dossier hier.']);
F('FR-02',S,'Homophones','Complétez : « Le client ___ rappelé ce matin. »',['a','à','as','ah']);
F('FR-03',S,'Accord du verbe','Choisissez la phrase correcte.',['Les factures du mois dernier sont arrivées.','Les factures du mois dernier est arrivée.','Les factures du mois dernier sont arrivés.','Les factures du mois dernier sont arrivé.']);
F('FR-04',S,'Infinitif ou participe','Complétez : « Merci de nous ___ le formulaire signé. »',['renvoyer','renvoyé','renvoyez','renvoyés']);
F('FR-05',S,'Homophones','Complétez : « Je ne sais pas ___ il viendra à la réunion. »',['s’il','si il','cil','s’ils']);
F('FR-06',S,'Pluriel','Choisissez l’orthographe correcte.',['des rendez-vous','des rendez-vouss','des rendezvous','des rendez-vou']);
F('FR-07',S,'Homophones','Complétez : « ___ dossiers sont prêts, vous pouvez les récupérer. »',['Ces','Ses','C’est','S’est']);
F('FR-08',S,'Conjugaison','Complétez : « Demain, nous ___ le contrat. »',['signerons','signerez','signeront','signerions']);
F('FR-09',S,'Vocabulaire','Quel mot est le synonyme le plus proche de « effectuer » ?',['réaliser','proposer','vérifier','annuler']);
F('FR-10',S,'Accord de l’adjectif','Choisissez la phrase correcte.',['Les réunions sont terminées.','Les réunions sont terminés.','Les réunions sont terminée.','Les réunions sont terminer.']);
F('FR-11',S,'Majuscules','Quelle phrase est correctement écrite ?',['Nous nous rendrons à Dakar le lundi 3 mars.','Nous nous rendrons à dakar le Lundi 3 Mars.','Nous nous rendrons à Dakar le Lundi 3 mars.','nous nous rendrons à Dakar le lundi 3 Mars.']);
F('FR-12',S,'Homophones','Complétez : « Il faut ___ dossier avant vendredi. »',['finir ce','finir se','fini ce','finit ce']);
/* Moyenne */
F('FR-13',M,'Participe passé avec avoir','Choisissez la phrase correcte.',['Les documents que vous m’avez envoyés sont complets.','Les documents que vous m’avez envoyé sont complets.','Les documents que vous m’avez envoyer sont complets.','Les documents que vous m’avez envoyée sont complets.']);
F('FR-14',M,'Homophones','Complétez : « Veuillez trouver ___ le devis demandé. »',['ci-joint','ci-jointe','si-joint','ci-joints']);
F('FR-15',M,'Accord','Complétez : « ___ que soient vos disponibilités, nous nous adapterons. »',['Quelles','Quelle','Quels','Quel']);
F('FR-16',M,'Leur ou leurs','Complétez : « Nous ___ avons transmis ___ contrats. »',['leur … leurs','leurs … leurs','leur … leur','leurs … leur']);
F('FR-17',M,'Conjugaison','Complétez : « Il faut que vous ___ ce document avant midi. »',['envoyiez','envoyez','envoyer','envoyerez']);
F('FR-18',M,'Formulation professionnelle','Quelle formulation est la plus appropriée dans un e-mail à un client ?',['« Nous revenons vers vous dès réception des pièces manquantes. »','« On vous recontacte quand on a les papiers. »','« Dès que vous nous aurez envoyer les pièces, on reviendra vers vous. »','« Nous vous recontacterons quand les papiers seront là, pas avant. »']);
F('FR-19',M,'Vocabulaire','Que signifie « une démarche fastidieuse » ?',['Une démarche longue et ennuyeuse','Une démarche rapide et simple','Une démarche coûteuse','Une démarche risquée']);
F('FR-20',M,'Homophones','Complétez : « Les résultats ont été ___ satisfaisants que prévu. »',['plus','plutôt','plut','plus tôt']);
F('FR-21',M,'Accord du participe','Choisissez la phrase correcte.',['Elle s’est aperçue de son erreur.','Elle s’est aperçu de son erreur.','Elle s’est aperçus de son erreur.','Elle c’est aperçue de son erreur.']);
F('FR-22',M,'Ponctuation','Quelle phrase est correctement ponctuée ?',['Merci de nous indiquer vos disponibilités : lundi, mardi ou jeudi.','Merci de nous indiquer vos disponibilités, lundi : mardi ou jeudi.','Merci, de nous indiquer vos disponibilités lundi mardi, ou jeudi.','Merci de nous indiquer, vos disponibilités : lundi mardi, ou jeudi.']);
F('FR-23',M,'Vocabulaire','Quel mot complète correctement : « Cette solution permettra de ___ le manque de personnel. » ?',['pallier','palier','pallier à','palier à']);
F('FR-24',M,'Conjugaison','Complétez : « Si le client avait payé, nous ___ la commande. »',['aurions livré','aurons livré','avions livré','livrerions eu']);
/* Difficile */
F('FR-25',D,'Participe passé','Choisissez la phrase correcte.',['Les trois années qui se sont succédé ont été difficiles.','Les trois années qui se sont succédées ont été difficiles.','Les trois années qui se sont succédés ont été difficiles.','Les trois années qui ce sont succédé ont été difficiles.']);
F('FR-26',D,'Quoique ou quoi que','Complétez : « ___ vous décidiez, prévenez l’équipe. »',['Quoi que','Quoique','Quoi qu’','Quelque']);
F('FR-27',D,'Après que','Choisissez la phrase correcte.',['Après que le contrat a été signé, la livraison a commencé.','Après que le contrat ait été signé, la livraison a commencé.','Après que le contrat soit signé, la livraison a commencé.','Après que le contrat fut été signé, la livraison a commencé.']);
F('FR-28',D,'Participe passé suivi d’un infinitif','Choisissez la phrase correcte.',['Les candidats que j’ai vus passer le test étaient sereins.','Les candidats que j’ai vu passer le test étaient sereins.','Les candidats que j’ai vus passé le test étaient sereins.','Les candidats que j’ai vu passés le test étaient sereins.']);
F('FR-29',D,'Paronymes','Complétez : « Tu es ___ connaître le règlement. »',['censé','sensé','sensée','censer']);
F('FR-30',D,'Accord de « tout »','Complétez : « Elles étaient ___ surprises par la nouvelle. »',['toutes','tout','tous','toute']);
F('FR-31',D,'Accord des couleurs','Choisissez la phrase correcte.',['Elle portait des chemises orange et des vestes bleu foncé.','Elle portait des chemises oranges et des vestes bleues foncées.','Elle portait des chemises oranges et des vestes bleu foncé.','Elle portait des chemises orange et des vestes bleues foncé.']);
F('FR-32',D,'Davantage','Complétez : « Nous souhaiterions ___ d’informations sur votre offre. »',['davantage','d’avantage','d’avantages','davantages']);
F('FR-33',D,'Pléonasme','Quelle phrase ne contient pas de pléonasme ?',['Nous avons reporté la réunion à mardi.','Nous avons reporté la réunion à plus tard, à mardi.','Il faut prévoir à l’avance le budget.','Nous allons collaborer ensemble sur ce dossier.']);
F('FR-34',D,'Participe passé de « coûter »','Choisissez la phrase correcte.',['Les 500 000 FCFA que ce projet a coûté ont été vite rentabilisés.','Les 500 000 FCFA que ce projet a coûtés ont été vite rentabilisés.','Les 500 000 FCFA que ce projet a coûtées ont été vite rentabilisés.','Les 500 000 FCFA que ce projet à coûté ont été vite rentabilisés.']);
F('FR-35',D,'Subjonctif','Complétez : « Bien qu’il ___ en retard, la réunion a commencé à l’heure. »',['soit','est','était','sera']);
F('FR-36',D,'Accord du verbe','Choisissez la phrase correcte.',['La plupart des salariés ont accepté la proposition.','La plupart des salariés a accepté la proposition.','La plupart des salariés ont acceptés la proposition.','La plupart des salariés a acceptée la proposition.']);

/* ===================== LOGIQUE ET CALCUL ===================== */
/* Simple */
L('LO-01',S,'Pourcentage','Un article coûte 20 000 FCFA. Il est soldé à −25 %. Quel est son nouveau prix ?',['15 000 FCFA','16 000 FCFA','17 500 FCFA','12 500 FCFA']);
L('LO-02',S,'Règle de trois','3 conseillers traitent 90 appels en une heure. Au même rythme, combien d’appels traitent 5 conseillers en une heure ?',['150','120','180','135']);
L('LO-03',S,'Moyenne','Un commercial réalise 4, 6, 8 et 6 ventes sur quatre semaines. Quelle est sa moyenne hebdomadaire ?',['6','5','7','24']);
L('LO-04',S,'Suite logique','Complétez la suite : 3 – 6 – 12 – 24 – ?',['48','36','30','42']);
L('LO-05',S,'Durée','Une réunion commence à 9 h 45 et dure 1 h 50. À quelle heure se termine-t-elle ?',['11 h 35','11 h 15','11 h 45','10 h 35']);
L('LO-06',S,'Pourcentage','Sur 200 candidats, 30 sont retenus. Quel pourcentage cela représente-t-il ?',['15 %','30 %','20 %','6,7 %']);
L('LO-07',S,'Monnaie','Un client paie 7 500 FCFA avec un billet de 10 000 FCFA. Combien lui rendre ?',['2 500 FCFA','3 500 FCFA','2 000 FCFA','1 500 FCFA']);
L('LO-08',S,'Suite logique','Complétez la suite : 2 – 5 – 8 – 11 – ?',['14','13','15','16']);
L('LO-09',S,'Calcul simple','Une boîte contient 12 ramettes de papier. Combien de boîtes faut-il pour 100 ramettes au minimum ?',['9','8','10','12']);
L('LO-10',S,'TVA','Un produit coûte 10 000 FCFA hors taxes. Avec une TVA de 18 %, quel est son prix toutes taxes comprises ?',['11 800 FCFA','10 180 FCFA','11 000 FCFA','12 800 FCFA']);
L('LO-11',S,'Logique','Tous les conseillers de l’équipe A parlent wolof. Awa est dans l’équipe A. Que peut-on conclure ?',['Awa parle wolof','Awa ne parle que wolof','Tous ceux qui parlent wolof sont dans l’équipe A','On ne peut rien conclure']);
L('LO-12',S,'Proportion','Un objectif mensuel est de 120 ventes. À mi-mois, 54 ventes sont faites. Combien en manque-t-il ?',['66','56','76','64']);
/* Moyenne */
L('LO-13',M,'Pourcentages successifs','Un prix augmente de 10 %, puis baisse de 10 %. Par rapport au prix de départ, le prix final est :',['Plus bas de 1 %','Identique','Plus bas de 10 %','Plus haut de 1 %']);
L('LO-14',M,'Hors taxes','Un produit coûte 23 600 FCFA TTC avec une TVA de 18 %. Quel est son prix hors taxes ?',['20 000 FCFA','19 352 FCFA','18 000 FCFA','21 600 FCFA']);
L('LO-15',M,'Taux de variation','Le chiffre d’affaires passe de 8 millions à 10 millions de FCFA. Quelle est la hausse en pourcentage ?',['25 %','20 %','2 %','80 %']);
L('LO-16',M,'Suite logique','Complétez la suite : 1 – 4 – 9 – 16 – 25 – ?',['36','30','35','49']);
L('LO-17',M,'Moyenne pondérée','Un candidat obtient 12/20 à un test de coefficient 2 et 18/20 à un test de coefficient 1. Quelle est sa moyenne ?',['14/20','15/20','13/20','16/20']);
L('LO-18',M,'Vitesse','Un livreur parcourt 45 km en 45 minutes. Quelle est sa vitesse moyenne ?',['60 km/h','45 km/h','75 km/h','50 km/h']);
L('LO-19',M,'Logique','Si aucun stagiaire n’a accès au coffre et que Moussa a accès au coffre, alors :',['Moussa n’est pas stagiaire','Moussa est stagiaire','Moussa est le responsable du coffre','On ne peut rien conclure']);
L('LO-20',M,'Répartition','Une prime de 900 000 FCFA est partagée entre trois personnes, proportionnellement à 2, 3 et 4. Combien reçoit la troisième ?',['400 000 FCFA','300 000 FCFA','450 000 FCFA','360 000 FCFA']);
L('LO-21',M,'Taux','Un centre reçoit 1 200 appels et en décroche 1 020. Quel est le taux de décroché ?',['85 %','80 %','88 %','15 %']);
L('LO-22',M,'Suite de lettres','Complétez la suite : A – C – F – J – ?',['O','N','M','P']);
L('LO-23',M,'Durées','Un conseiller traite un appel en 4 min 30 s en moyenne. Combien d’appels traite-t-il en 3 heures, sans pause ?',['40','36','45','42']);
L('LO-24',M,'Calcul de marge','Un article acheté 8 000 FCFA est revendu 10 000 FCFA. Quel est le taux de marge sur le prix d’achat ?',['25 %','20 %','2 %','80 %']);
/* Difficile */
L('LO-25',D,'Pourcentage inversé','Après une remise de 20 %, un produit coûte 48 000 FCFA. Quel était son prix initial ?',['60 000 FCFA','57 600 FCFA','58 000 FCFA','68 000 FCFA']);
L('LO-26',D,'Logique','Dans une équipe, chaque conseiller parle au moins une langue parmi le wolof et l’anglais. 12 parlent wolof, 7 parlent anglais, 4 parlent les deux. Combien y a-t-il de conseillers ?',['15','19','23','11']);
L('LO-27',D,'Suite logique','Complétez la suite : 2 – 3 – 5 – 9 – 17 – ?',['33','25','31','34']);
L('LO-28',D,'Travail en commun','Awa saisit un lot de fiches en 6 heures, Fatou en 3 heures. Ensemble, combien de temps leur faut-il ?',['2 heures','4 heures 30','3 heures','1 heure 30']);
L('LO-29',D,'Intérêts','Un placement de 1 000 000 FCFA rapporte 5 % par an, intérêts réinvestis. Quelle est sa valeur au bout de 2 ans ?',['1 102 500 FCFA','1 100 000 FCFA','1 105 000 FCFA','1 050 000 FCFA']);
L('LO-30',D,'Logique','Trois collègues, Ali, Binta et Cheikh, occupent les postes de comptable, commercial et assistant. Ali n’est pas comptable. Binta n’est ni comptable ni commerciale. Quel est le poste d’Ali ?',['Commercial','Comptable','Assistant','On ne peut pas savoir']);
L('LO-31',D,'Proportion','Il faut 8 jours à 6 personnes pour terminer un inventaire. Combien de jours faut-il à 4 personnes, au même rythme ?',['12','10','6','16']);
L('LO-32',D,'Pourcentage','Le taux d’abandon passe de 12 % à 9 %. De combien de points a-t-il baissé, et de quel pourcentage ?',['3 points, soit 25 %','3 %, soit 3 points','25 points, soit 3 %','3 points, soit 33 %']);
L('LO-33',D,'Moyenne','La moyenne de 4 ventes est de 50 000 FCFA. Une cinquième vente porte la moyenne à 56 000 FCFA. Quel est le montant de la cinquième vente ?',['80 000 FCFA','62 000 FCFA','56 000 FCFA','74 000 FCFA']);
L('LO-34',D,'Suite logique','Complétez la suite : 1 – 1 – 2 – 3 – 5 – 8 – ?',['13','11','12','16']);
L('LO-35',D,'Calendrier','Si le 1er mars est un lundi, quel jour de la semaine tombe le 1er avril de la même année ?',['Jeudi','Mercredi','Vendredi','Lundi']);
L('LO-36',D,'Logique','Une affirmation dit : « Tous les dossiers urgents sont traités le jour même. » Quel cas prouverait qu’elle est fausse ?',['Un dossier urgent traité le lendemain','Un dossier non urgent traité le jour même','Un dossier non urgent traité le lendemain','Un dossier urgent traité le jour même']);

module.exports = out;
