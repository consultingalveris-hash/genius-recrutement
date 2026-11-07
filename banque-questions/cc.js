// Centre d'appels et relation client
const { make, S, M, D } = require('./lib');
const { out, Q, P } = make('cc');

/* ---------- Connaissances métier : Simple ---------- */
Q('CC-M01','M',S,'Durée moyenne de traitement','Que comprend la durée moyenne de traitement (DMT) d’un appel ?',
 ['La conversation, les mises en attente et la saisie après l’appel','La conversation seule, du décroché jusqu’au raccrochage','L’attente avant décroché et la conversation avec le client','La conversation et le temps de pause entre deux appels']);
Q('CC-M02','M',S,'Résolution au premier contact','Que mesure le taux de résolution au premier contact ?',
 ['La part des demandes réglées sans que le client ait à recontacter','La part des appels décrochés avant la deuxième sonnerie','La part des clients satisfaits après leur tout premier appel','La part des appels traités sans transfert vers un superviseur']);
Q('CC-M03','M',S,'Taux de décroché','Le taux de décroché correspond à :',
 ['Appels pris en charge ÷ appels reçus','Appels pris en charge ÷ conseillers connectés','Appels abandonnés ÷ appels pris en charge','Appels reçus ÷ heures d’ouverture du service']);
Q('CC-M04','M',S,'Codification','À quoi sert d’abord la codification (qualification) de chaque appel ?',
 ['À analyser les motifs d’appel et suivre chaque dossier','À calculer la prime variable de chaque conseiller','À prouver au client que son appel a bien été traité','À remplacer la prise de notes dans la fiche client']);
Q('CC-M05','M',S,'Mise en attente','Quelle est la bonne pratique avant de mettre un client en attente ?',
 ['Demander son accord et lui dire combien de temps cela prendra','Le mettre en attente sans attendre, pour ne pas perdre de temps','Lui proposer de rappeler lui-même quand il sera disponible','Lui expliquer qu’une musique va suivre et qu’il doit patienter']);
Q('CC-M06','M',S,'Réception et émission','Quelle est la différence entre réception et émission d’appels ?',
 ['En réception le client appelle ; en émission, c’est le conseiller','En réception on fait du service ; en émission, uniquement de la vente','En réception les appels sont enregistrés ; en émission, jamais','En réception on traite les réclamations ; en émission, la technique']);
Q('CC-M07','M',S,'Questions ouvertes','Laquelle de ces questions est une question ouverte ?',
 ['« Comment utilisez-vous votre abonnement au quotidien ? »','« Êtes-vous satisfait de votre abonnement actuel ? »','« Votre abonnement est-il bien enregistré à votre nom ? »','« Souhaitez-vous conserver exactement la même formule ? »']);
Q('CC-M08','M',S,'Prise de congé','Comment conclure un appel de façon professionnelle ?',
 ['Récapituler, vérifier qu’il n’y a pas d’autre demande, remercier','Remercier le client et raccrocher dès que la demande est traitée','Proposer une nouvelle offre au client avant de raccrocher','Lui demander de noter l’appel, puis lui souhaiter une bonne journée']);
Q('CC-M09','M',S,'Satisfaction client','Que mesure l’indicateur CSAT, souvent demandé juste après un appel ?',
 ['La satisfaction du client sur l’échange qu’il vient d’avoir','La probabilité que le client recommande l’entreprise','La rapidité avec laquelle l’appel a été décroché','Le nombre de clients qui rappellent dans la semaine']);
Q('CC-M10','M',S,'Script d’appel','Quel est le bon usage d’un script d’appel ?',
 ['Une trame à suivre en gardant un ton naturel et adapté','Un texte à lire mot à mot pour ne rien oublier d’important','Un support réservé à la période de formation des nouveaux','Un guide à abandonner dès que le client pose une question']);

/* ---------- Connaissances métier : Moyenne ---------- */
Q('CC-M11','M',M,'Niveau de service','Un objectif de niveau de service « 80/20 » signifie :',
 ['80 % des appels décrochés en 20 secondes au plus','80 % des appels traités en moins de 20 minutes','80 % du temps en appel et 20 % en pauses ou formation','80 % de clients satisfaits sur un échantillon de 20 appels']);
Q('CC-M12','M',M,'Net Promoter Score','Sur quelle question repose le NPS (Net Promoter Score) ?',
 ['« Recommanderiez-vous l’entreprise à un proche ? » (de 0 à 10)','« Êtes-vous satisfait de cet appel ? » (de 1 à 5)','« Votre problème a-t-il été résolu aujourd’hui ? » (oui ou non)','« Le conseiller a-t-il été aimable et clair ? » (de 1 à 10)']);
Q('CC-M13','M',M,'Promoteurs','Dans le calcul du NPS, qui sont les « promoteurs » ?',
 ['Les clients qui donnent 9 ou 10','Les clients qui donnent 7 ou plus','Les clients qui notent au-dessus de 5','Les clients qui ont parrainé quelqu’un']);
Q('CC-M14','M',M,'Taux d’occupation','Le taux d’occupation d’un conseiller mesure :',
 ['La part de son temps connecté passée à traiter des appels','La part de ses heures de travail passées connecté à l’outil','Le nombre d’appels qu’il traite en moyenne par heure','La part de ses pauses prises à l’heure prévue au planning']);
Q('CC-M15','M',M,'Adhérence au planning','L’adhérence au planning indique :',
 ['Si le conseiller fait l’activité prévue au moment prévu','Si le conseiller fait bien toutes les heures de son contrat','Si le conseiller est présent tous les jours prévus du mois','Si le planning couvre bien les pics d’appels de la journée']);
Q('CC-M16','M',M,'Traitement des objections','Pourquoi reformuler une objection avant d’y répondre ?',
 ['Pour vérifier qu’on l’a comprise et montrer qu’on écoute','Pour gagner du temps et chercher la réponse dans le script','Pour amener le client à reconnaître que l’objection est faible','Pour reprendre la main sur l’échange et passer à la vente']);
Q('CC-M17','M',M,'Escalade','Quand un appel doit-il être transmis au niveau supérieur ?',
 ['Quand la demande dépasse ce que le conseiller peut traiter','Dès que le client demande à parler à un responsable','Quand l’appel dépasse la durée moyenne de traitement','Dès que le client exprime un mécontentement fort']);
Q('CC-M18','M',M,'Grille d’écoute','À quoi sert une grille d’évaluation (grille d’écoute) ?',
 ['À noter les appels sur les mêmes critères et cibler la formation','À vérifier surtout que le conseiller a lu tout le script','À classer les conseillers pour attribuer les primes du mois','À mesurer automatiquement la durée et le ton des appels']);
Q('CC-M19','M',M,'Omnicanal','Qu’apporte une relation client « omnicanale » ?',
 ['Le client change de canal sans avoir à tout réexpliquer','Le client est contacté sur tous les canaux à la fois','Chaque canal a son équipe et son propre fichier client','Le client choisit un canal unique pour tout son contrat']);
Q('CC-M20','M',M,'Données personnelles','Un client demande quelles informations l’entreprise détient sur lui. Que prévoit la loi sénégalaise ?',
 ['Il a un droit d’accès et doit recevoir une réponse','L’entreprise peut refuser, ces données lui appartenant','Il doit passer par un avocat pour faire sa demande','Seule la CDP peut lui transmettre ces informations']);

/* ---------- Connaissances métier : Difficile ---------- */
Q('CC-M21','M',D,'Prévision des effectifs','Pour calculer les conseillers nécessaires sur une demi-heure, que faut-il au minimum ?',
 ['Volume d’appels prévu, DMT et objectif de niveau de service','Volume d’appels de la veille et conseillers présents ce jour-là','DMT et taux d’abandon constatés le mois précédent','Nombre de postes équipés et taux de décroché visé']);
Q('CC-M22','M',D,'Numéroteur prédictif','Quel est le principal risque d’un numéroteur prédictif trop agressif ?',
 ['Des clients qui décrochent sans qu’aucun conseiller soit libre','Des conseillers inoccupés pendant de longues minutes','Une baisse du nombre de numéros composés par heure','Une hausse de la durée moyenne de traitement des appels']);
Q('CC-M23','M',D,'Démarchage en France','Un centre de Dakar appelle des particuliers en France pour vendre. Que doit-il vérifier avant ?',
 ['Que les numéros ne sont pas inscrits sur Bloctel','Que les clients ont acheté chez le donneur d’ordre','Que les numéros appelés sont des lignes fixes','Que les clients ont plus de 25 ans révolus']);
Q('CC-M24','M',D,'Taux de transformation','En campagne de vente, comment calcule-t-on le taux de transformation ?',
 ['Ventes ÷ contacts argumentés','Ventes ÷ numéros composés','Contacts argumentés ÷ numéros composés','Ventes ÷ heures de production']);
Q('CC-M25','M',D,'Calibration','Qu’est-ce qu’une séance de calibration qualité ?',
 ['Noter ensemble les mêmes appels pour harmoniser les notes','Écouter les meilleurs appels pour en faire des modèles','Comparer les résultats de vente de chaque équipe','Mettre à jour le script à partir des réclamations']);
Q('CC-M26','M',D,'Lien entre indicateurs','La DMT d’une équipe baisse fortement, mais les appels reçus augmentent. Explication la plus probable ?',
 ['Les demandes sont moins bien résolues et les clients rappellent','Les clients sont plus satisfaits et appellent plus souvent','Les conseillers prennent plus de pauses entre les appels','Le niveau de service s’améliore et attire plus d’appels']);
Q('CC-M27','M',D,'Erlang C','À quoi sert la formule d’Erlang C dans un centre d’appels ?',
 ['À estimer les effectifs pour atteindre un niveau de service','À calculer la satisfaction moyenne à partir des enquêtes','À prévoir le volume d’appels à partir de l’historique','À répartir les appels entrants entre plusieurs sites']);
Q('CC-M28','M',D,'Effort client','Que mesure le Customer Effort Score (CES) ?',
 ['La facilité pour le client d’obtenir ce qu’il voulait','Le temps que passe le conseiller sur chaque dossier','Le nombre de contacts nécessaires pour conclure une vente','L’effort commercial fourni par l’équipe sur le mois']);
Q('CC-M29','M',D,'Taux d’abandon','Pourquoi exclut-on souvent du taux d’abandon les appels raccrochés en moins de 5 secondes ?',
 ['Ce sont surtout des erreurs de numéro, pas de l’attente','La réglementation interdit de les comptabiliser','Ils sont déjà comptés dans le taux de décroché','Ces clients sont toujours rappelés automatiquement']);
Q('CC-M30','M',D,'Enregistrement des appels','Que faut-il faire lorsque les appels sont enregistrés ?',
 ['Prévenir le client et limiter la durée de conservation','Obtenir l’accord écrit de chaque client avant l’appel','Rien : l’enregistrement est libre en centre d’appels','Prévenir seulement les clients qui le demandent']);

/* ---------- Mises en situation (2 = meilleure, 1 = acceptable, 0 = à éviter) ---------- */
P('CC-S01',S,'Client agacé','Un client appelle pour la troisième fois pour le même problème : « Vous ne servez à rien ! » Que faites-vous d’abord ?',
 [['Je le laisse parler, je reconnais sa gêne et je reprends son dossier',2],['Je m’excuse au nom de l’entreprise et je le passe à un superviseur',1],['Je lui demande de rester courtois pour que je puisse l’aider',0],['Je précise que je n’ai pas traité ses appels précédents',0]]);
P('CC-S02',S,'Réponse inconnue','Un client pose une question dont vous ignorez la réponse. Que faites-vous ?',
 [['Je lui dis que je vérifie, je cherche, puis je reviens vers lui',2],['Je lui propose de le rappeler dès que j’aurai la réponse',1],['Je donne la réponse la plus probable pour ne pas le faire attendre',0],['Je lui conseille de chercher la réponse sur notre site internet',0]]);
P('CC-S03',S,'Client pressé','Un client n’a que deux minutes. Sa demande impose une vérification d’identité. Que faites-vous ?',
 [['J’explique que c’est indispensable et rapide, et je la fais',2],['Je lui propose un rappel à un moment plus pratique pour lui',1],['Je saute la vérification pour qu’il gagne du temps cette fois',0],['Je lui demande de rappeler quand il sera plus disponible',0]]);
P('CC-S04',S,'Bruit de fond','Le client appelle d’un lieu très bruyant et vous l’entendez mal. Que faites-vous ?',
 [['Je le lui dis poliment et lui propose de s’isoler ou d’être rappelé',2],['Je parle plus fort et je lui demande de répéter chaque phrase',1],['Je complète ce que je n’entends pas pour avancer plus vite',0],['Je mets fin à l’appel en raison de la mauvaise qualité de ligne',0]]);
P('CC-S05',S,'Erreur de facturation','Le client a été facturé deux fois par erreur. Que faites-vous ?',
 [['Je reconnais l’erreur, je lance le remboursement et j’annonce le délai',2],['Je reconnais l’erreur et je lui demande d’écrire au service réclamation',1],['Je lui explique que ce type d’erreur se corrige seul le mois suivant',0],['Je lui conseille d’attendre la prochaine facture pour vérifier',0]]);
P('CC-S06',S,'Client bavard','Un client sympathique vous parle longuement de sa vie privée. La file d’attente est chargée. Que faites-vous ?',
 [['Je l’écoute un instant, puis je reviens poliment à sa demande',2],['Je lui dis gentiment que d’autres clients attendent leur tour',1],['Je le laisse parler : sa satisfaction passe avant la file',0],['Je traite vite sa demande en l’interrompant à chaque phrase',0]]);
P('CC-S07',S,'Nom mal compris','Vous n’êtes pas sûr d’avoir bien noté le nom du client. Que faites-vous ?',
 [['Je lui demande de l’épeler, puis je le relis pour confirmer',2],['Je lui demande de le répéter un peu plus lentement',1],['Je le note comme je l’ai compris, je corrigerai plus tard',0],['Je laisse la case vide pour ne pas le gêner davantage',0]]);
P('CC-S08',M,'Geste commercial','Un client mécontent exige un geste que vous n’êtes pas autorisé à accorder. Que faites-vous ?',
 [['Je propose ce qui est dans mes limites et je transmets sa demande',2],['Je lui explique que je n’ai pas le droit et qu’il peut écrire',1],['J’accorde le geste : perdre ce client coûterait plus cher',0],['Je lui promets le geste en comptant sur l’accord du responsable',0]]);
P('CC-S09',M,'Menace de résiliation','Un client veut résilier car un concurrent est moins cher. Que faites-vous ?',
 [['Je l’interroge sur ses besoins et l’offre reçue, puis je propose',2],['Je lui rappelle tous les avantages de nos services actuels',1],['Je lance la résiliation, puisque c’est sa décision',0],['Je lui explique que ce concurrent a beaucoup de réclamations',0]]);
P('CC-S10',M,'Outil en panne','Votre logiciel se bloque au milieu d’un appel. Que faites-vous ?',
 [['Je préviens le client, je note à la main et je propose de le rappeler',2],['Je mets le client en attente le temps de redémarrer le poste',1],['Je raccroche et j’attends qu’il rappelle une fois l’outil relancé',0],['Je poursuis l’appel normalement et je saisirai tout de mémoire',0]]);
P('CC-S11',M,'Collègue en difficulté','Un nouveau collègue est en difficulté avec un client et ne sait plus quoi répondre. Que faites-vous ?',
 [['Je lui écris discrètement la réponse ou je préviens le superviseur',2],['Je l’aide dès que mon propre appel sera terminé',1],['Je prends son casque pour répondre au client à sa place',0],['Je le laisse gérer : c’est ainsi qu’il apprendra le métier',0]]);
P('CC-S12',M,'Compte d’un proche','Un client demande des informations sur le compte de son épouse. Que faites-vous ?',
 [['Je refuse poliment et j’explique comment elle peut nous joindre',2],['Je lui demande d’abord le numéro client de son épouse',1],['Je réponds : un époux est un proche, cela ne pose pas de souci',0],['Je lui donne seulement le montant de la dernière facture',0]]);
P('CC-S13',M,'Objectif de vente','Il vous manque une vente pour l’objectif du jour. Le client ne semble pas avoir besoin du produit. Que faites-vous ?',
 [['Je ne force pas la vente et je traite bien sa demande',2],['Je lui présente brièvement le produit, sans insister',1],['J’insiste un peu : beaucoup de clients finissent par accepter',0],['Je lui dis que l’offre s’arrête ce soir pour le décider',0]]);
P('CC-S14',M,'Réclamation écrite','Un client réclame par e-mail en termes très durs. Que faites-vous ?',
 [['Je réponds sur un ton courtois et factuel, point par point',2],['Je réponds brièvement en lui proposant de l’appeler',1],['Je transfère le message au service juridique pour avis',0],['J’attends qu’il reformule poliment avant de répondre',0]]);
P('CC-S15',D,'Client en détresse','En recouvrement, le client fond en larmes : il vient de perdre son emploi. Que faites-vous ?',
 [['Je fais preuve d’empathie et je présente les solutions prévues',2],['Je lui propose de le rappeler dans quelques jours, au calme',1],['Je lui rappelle avec tact que la dette reste à payer',0],['J’annule sa dette pour l’aider dans ce moment difficile',0]]);
P('CC-S16',D,'Indicateurs contradictoires','On vous demande de réduire votre durée d’appel, mais vos clients rappellent quand vous allez trop vite. Que faites-vous ?',
 [['J’en parle à mon superviseur, exemples à l’appui, pour trouver où gagner',2],['Je raccourcis les appels simples et je garde mon rythme ailleurs',1],['Je raccourcis tous mes appels, comme cela m’a été demandé',0],['Je garde mon rythme habituel sans en parler à personne',0]]);
P('CC-S17',D,'Fraude possible','Un appelant connaît toutes les informations d’un client, mais il vous paraît suspect. Il veut changer l’e-mail du compte. Que faites-vous ?',
 [['J’applique la procédure de sécurité renforcée et je signale le cas',2],['Je fais la modification, puis je préviens le service fraude',1],['Je fais la modification : il a répondu juste à toutes les questions',0],['Je lui demande de rappeler un autre jour, sans rien signaler',0]]);
P('CC-S18',D,'Promesse d’un collègue','Un collègue a promis au client un remboursement auquel il n’a pas droit. Que faites-vous ?',
 [['J’explique honnêtement la situation, je propose le possible et je remonte',2],['Je préviens mon superviseur et je laisse le dossier en attente',1],['J’accorde le remboursement pour respecter la parole donnée',0],['Je dis au client qu’il a dû mal comprendre mon collègue',0]]);
P('CC-S19',D,'Pic d’appels','La file explose après une panne générale et votre superviseur est absent. Que faites-vous ?',
 [['Je préviens le responsable présent et je propose un message d’information',2],['J’accélère mes appels et j’informe chaque client de la panne',1],['Je prends ma pause à l’heure : le planning doit être respecté',0],['Je laisse les clients en attente jusqu’à la fin de la panne',0]]);
P('CC-S20',D,'Client insultant','Malgré vos efforts, un client devient insultant et menaçant. Que faites-vous ?',
 [['Je l’avertis calmement, j’applique la procédure prévue et je signale',2],['Je transfère l’appel à mon superviseur sans rien ajouter',1],['Je hausse le ton à mon tour pour qu’il comprenne la limite',0],['Je raccroche aussitôt, sans avertissement ni signalement',0]]);
P('CC-S21',D,'Délai impossible','Un client exige une intervention le jour même. Le premier créneau est dans trois jours. Que faites-vous ?',
 [['J’annonce le vrai délai et je l’inscris aussi sur la liste d’annulations',2],['Je lui propose simplement le créneau disponible dans trois jours',1],['Je lui promets une intervention aujourd’hui pour l’apaiser',0],['Je lui réponds qu’il n’y a aucune disponibilité ce mois-ci',0]]);

module.exports = out;
