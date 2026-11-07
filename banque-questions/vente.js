// Vente et commercial
const { make, S, M, D } = require('./lib');
const { out, Q, P } = make('vente');

/* ---------- Connaissances : Simple ---------- */
Q('VE-M01','M',S,'Prospect et client','Quelle est la différence entre un prospect et un client ?',
 ['Le prospect n’a encore rien acheté, le client si','Le prospect est une entreprise, le client un particulier','Le prospect a été appelé, le client a été rencontré','Le prospect achète peu, le client achète souvent']);
Q('VE-M02','M',S,'Découverte des besoins','À quoi sert la phase de découverte dans un entretien de vente ?',
 ['À comprendre la situation et les besoins avant de proposer','À présenter toute la gamme pour que le client choisisse','À vérifier le budget du client avant d’y consacrer du temps','À annoncer le prix tôt pour éviter les mauvaises surprises']);
Q('VE-M03','M',S,'Argumentaire','Un bon argument de vente relie :',
 ['Une caractéristique à un bénéfice concret pour ce client','Le prix du produit à celui des concurrents directs','La qualité du produit à la réputation de la marque','Les points forts du produit aux nouveautés de l’année']);
Q('VE-M04','M',S,'Fidélisation','Pourquoi fidéliser un client existant est-il souvent rentable ?',
 ['Le garder coûte souvent moins cher qu’en conquérir un autre','Un client fidèle accepte sans discuter les hausses de prix','La réglementation impose des remises aux clients fidèles','Un client fidèle n’a plus besoin d’être suivi ni relancé']);
Q('VE-M05','M',S,'Relance','Après l’envoi d’un devis, quelle est la bonne pratique ?',
 ['Convenir d’une date de relance et rappeler à cette date','Attendre que le client rappelle pour ne pas le brusquer','Relancer chaque jour jusqu’à obtenir une réponse ferme','Renvoyer le devis avec une remise dès le lendemain']);
Q('VE-M06','M',S,'Portefeuille clients','Qu’est-ce que le portefeuille clients d’un commercial ?',
 ['L’ensemble des clients dont il a la charge','La liste des prospects à appeler cette semaine','Le chiffre d’affaires qu’il réalise sur l’année','Le total des commissions qu’il a touchées']);
Q('VE-M07','M',S,'Prise de rendez-vous','Lors d’un appel de prise de rendez-vous, quel est l’objectif principal ?',
 ['Obtenir le rendez-vous, pas vendre au téléphone','Présenter toute l’offre pour convaincre dès l’appel','Connaître le prix que le prospect est prêt à payer','Obtenir son e-mail pour lui envoyer la brochure']);
Q('VE-M08','M',S,'Signal d’achat','Quel signal montre souvent qu’un client est prêt à acheter ?',
 ['Il pose des questions sur la livraison ou le paiement','Il compare longuement avec d’autres fournisseurs','Il demande une documentation à lire plus tard','Il dit qu’il doit d’abord en parler à son associé']);
Q('VE-M09','M',S,'Fiche client','Pourquoi tenir à jour la fiche de chaque client dans le logiciel (CRM) ?',
 ['Pour garder l’historique et partager l’information','Pour calculer automatiquement la commission','Pour pouvoir lui envoyer des offres chaque jour','Parce que le client peut la consulter à tout moment']);
Q('VE-M10','M',S,'Panier moyen','Que représente le panier moyen ?',
 ['Chiffre d’affaires ÷ nombre de ventes','Nombre moyen d’articles par client','Prix moyen des produits du catalogue','Marge moyenne réalisée par produit']);

/* ---------- Connaissances : Moyenne ---------- */
Q('VE-M11','M',M,'Méthode SONCAS','Dans la méthode SONCAS, que représente le « C » ?',
 ['Le confort','Le coût','La confiance','La concurrence']);
Q('VE-M12','M',M,'Questions de découverte','Quelle question aide le mieux à découvrir un besoin ?',
 ['« Qu’est-ce qui vous pose problème aujourd’hui ? »','« Quel est votre budget maximum pour ce projet ? »','« Notre nouvelle offre vous intéresserait-elle ? »','« Travaillez-vous déjà avec un de nos concurrents ? »']);
Q('VE-M13','M',M,'Objection prix','Face à « C’est trop cher », quelle première réaction est la plus efficace ?',
 ['Demander : trop cher par rapport à quoi ?','Proposer tout de suite une petite remise','Rappeler que les concurrents sont plus chers','Présenter le modèle le moins cher de la gamme']);
Q('VE-M14','M',M,'Vente croisée','Que désigne la vente additionnelle (ou vente croisée) ?',
 ['Proposer un produit complémentaire à celui acheté','Proposer une version plus chère du même produit','Vendre le même produit à plusieurs clients ensemble','Proposer un produit d’une autre marque, moins cher']);
Q('VE-M15','M',M,'Montée en gamme','Que désigne la « montée en gamme » ?',
 ['Proposer une version supérieure du produit envisagé','Proposer un accessoire complémentaire au produit','Augmenter progressivement les prix de toute la gamme','Remplacer gratuitement un produit par son successeur']);
Q('VE-M16','M',M,'Marge et chiffre d’affaires','Quelle différence y a-t-il entre chiffre d’affaires et marge ?',
 ['La marge est ce qui reste après le coût d’achat','Le chiffre d’affaires inclut la TVA, la marge non','La marge est le chiffre d’affaires des nouveaux clients','Aucune : ce sont deux noms pour le même montant']);
Q('VE-M17','M',M,'Qualification','Pourquoi qualifier un fichier de prospects avant de le prospecter ?',
 ['Pour concentrer ses efforts sur les contacts à potentiel','Pour disposer du plus grand nombre de contacts possible','Pour obtenir l’accord de chaque prospect avant l’appel','Pour connaître le chiffre d’affaires exact de chacun']);
Q('VE-M18','M',M,'Objectif SMART','Lequel de ces objectifs est formulé de façon SMART ?',
 ['Signer 8 nouveaux clients à Thiès d’ici fin mars','Augmenter nettement nos ventes au cours de l’année','Devenir le commercial le plus performant de l’équipe','Appeler davantage de prospects chaque semaine']);
Q('VE-M19','M',M,'Négociation','En négociation, pourquoi ne jamais céder sans contrepartie ?',
 ['Pour que chaque concession garde sa valeur','Parce que la loi interdit les remises gratuites','Parce qu’un client qui obtient une remise part vite','Pour terminer toujours au prix du catalogue']);
Q('VE-M20','M',M,'Délai de paiement','Pourquoi un long délai de paiement accordé au client a-t-il un coût ?',
 ['L’entreprise doit financer sa trésorerie en attendant','La TVA doit alors être payée deux fois à l’État','Le client paie au final un prix moins élevé','La marge du produit diminue automatiquement']);

/* ---------- Connaissances : Difficile ---------- */
Q('VE-M21','M',D,'Tunnel de vente','Une équipe obtient beaucoup de rendez-vous mais signe peu. Où est probablement le problème ?',
 ['Dans la qualification des prospects ou les rendez-vous','Dans le nombre d’appels de prospection passés','Dans le prix catalogue, trop élevé pour le marché','Dans la politique de fidélisation des clients']);
Q('VE-M22','M',D,'Coefficient multiplicateur','Un produit acheté 10 000 FCFA est vendu 15 000 FCFA HT. Quel est le coefficient multiplicateur ?',
 ['1,5','0,5','50 %','33 %']);
Q('VE-M23','M',D,'Taux de marque','Le taux de marque se calcule en rapportant la marge :',
 ['Au prix de vente hors taxes','Au prix d’achat hors taxes','Au prix de vente TTC','Au chiffre d’affaires annuel']);
Q('VE-M24','M',D,'Vente complexe','Dans une vente à une grande entreprise, qui faut-il identifier en priorité ?',
 ['Tous ceux qui pèsent sur la décision d’achat','Le directeur général, car c’est lui qui signe','Le service achats, car c’est lui qui négocie','La personne la plus facile à joindre, pour avancer']);
Q('VE-M25','M',D,'Appel d’offres','Que vérifier en premier en recevant un dossier d’appel d’offres ?',
 ['L’éligibilité, les pièces exigées et la date limite','Le prix retenu lors du précédent marché similaire','Le nom de la personne qui analysera les offres','Le nombre de concurrents susceptibles de répondre']);
Q('VE-M26','M',D,'Valeur vie client','À quoi sert le calcul de la valeur vie client ?',
 ['À savoir combien investir pour gagner ou garder un client','À fixer la remise maximale accordée à chaque achat','À classer les clients selon leur ancienneté','À suivre la satisfaction d’un client au fil du temps']);
Q('VE-M27','M',D,'Cartographie des acteurs','Dans une vente complexe, pourquoi cartographier les acteurs ?',
 ['Pour savoir qui décide et quels freins lever','Pour estimer le prix maximal que le client paiera','Pour éviter de perdre du temps avec les utilisateurs','Pour connaître les fournisseurs actuels du client']);
Q('VE-M28','M',D,'Prévisions','Pourquoi pondérer chaque affaire en cours par une probabilité de signature ?',
 ['Pour obtenir une prévision de ventes plus réaliste','Pour fixer à l’avance la commission de chacun','Pour classer les clients par ordre d’importance','Pour savoir quelles affaires cesser de suivre']);
Q('VE-M29','M',D,'Remise et marge','Un produit est vendu 100 000 FCFA avec 20 000 FCFA de marge. Vous accordez 10 % de remise. Que devient la marge ?',
 ['10 000 FCFA','18 000 FCFA','20 000 FCFA','15 000 FCFA']);
Q('VE-M30','M',D,'Conditions générales de vente','À quoi servent les conditions générales de vente ?',
 ['À fixer prix, paiement, livraison et garanties','À présenter les nouveaux produits aux clients','À détailler la rémunération des commerciaux','À garantir au client le meilleur prix du marché']);

/* ---------- Mises en situation ---------- */
P('VE-S01',S,'Prospect pressé','Vous appelez un prospect qui répond : « Je n’ai pas le temps. » Que faites-vous ?',
 [['Je lui propose de le rappeler à un moment précis',2],['Je lui résume mon offre en trente secondes',1],['J’insiste : cela ne prendra que cinq minutes',0],['Je raccroche et je le retire du fichier',0]]);
P('VE-S02',S,'Rupture de stock','Un client veut commander un produit en rupture. Que faites-vous ?',
 [['J’annonce le délai et je propose un équivalent disponible',2],['Je propose de le prévenir dès le retour du produit',1],['Je prends la commande sans parler du délai',0],['Je lui conseille de revenir dans quelques semaines',0]]);
P('VE-S03',S,'Question technique','En rendez-vous, un client pose une question technique pointue dont vous n’êtes pas sûr. Que faites-vous ?',
 [['Je vérifie auprès du technicien et je fixe quand je réponds',2],['Je donne une réponse générale en restant prudent',1],['Je réponds avec assurance pour garder sa confiance',0],['Je passe rapidement à un autre point de l’offre',0]]);
P('VE-S04',S,'Avis sur un concurrent','Un client vous demande ce que vous pensez d’un concurrent. Que répondez-vous ?',
 [['Je reste correct et je souligne ce qui nous distingue',2],['Je réponds que je connais mal ce concurrent',1],['Je détaille ses points faibles pour le décourager',0],['Je rapporte ce que d’autres clients m’en ont dit',0]]);
P('VE-S05',S,'Livraison en retard','Un client appelle : sa commande a deux jours de retard. Que faites-vous ?',
 [['Je vérifie le suivi, je donne une date fiable, je m’excuse',2],['Je m’excuse et je transmets au service logistique',1],['Je lui explique que la logistique n’est pas mon service',0],['Je lui promets une livraison aujourd’hui sans vérifier',0]]);
P('VE-S06',S,'Prix demandé d’emblée','Dès le début, le client demande : « Combien ça coûte ? » Que faites-vous ?',
 [['Je donne une fourchette et je pose quelques questions',2],['Je donne le prix le plus bas de la gamme',1],['Je refuse de parler prix avant la fin de ma présentation',0],['J’annonce un prix élevé pour garder de la marge',0]]);
P('VE-S07',S,'Client indécis','Un client hésite entre deux formules et vous demande votre avis. Que faites-vous ?',
 [['Je recommande celle qui répond à ses besoins et je dis pourquoi',2],['Je lui présente à nouveau les deux formules en détail',1],['Je lui conseille la plus chère, qui est la plus complète',0],['Je lui propose de réfléchir et de me rappeler',0]]);
P('VE-S08',M,'Remise exigée','Un bon client exige 15 % de remise. Votre limite est de 5 %. Que faites-vous ?',
 [['Je propose une contrepartie : volume, durée ou service',2],['J’accorde 5 % en précisant que c’est mon maximum',1],['J’accorde les 15 % pour ne pas perdre ce client',0],['Je refuse toute remise pour tenir les prix',0]]);
P('VE-S09',M,'Objectif en retard','À une semaine de la fin du mois, vous êtes à 60 % de l’objectif. Que faites-vous ?',
 [['Je relance d’abord les affaires avancées et j’en parle au responsable',2],['J’augmente fortement mon nombre d’appels de prospection',1],['J’accorde de grosses remises pour signer avant la fin du mois',0],['Je décale mes signatures sur le mois suivant',0]]);
P('VE-S10',M,'Client mécontent en boutique','Un client se plaint bruyamment dans votre point de vente. Que faites-vous ?',
 [['Je l’accueille calmement et je l’écoute à l’écart',2],['Je l’écoute sur place en gardant mon calme',1],['Je lui demande de baisser le ton ou de sortir',0],['J’appelle la sécurité pour le raccompagner',0]]);
P('VE-S11',M,'Erreur sur un devis','Après signature, vous découvrez une erreur de prix en votre défaveur. Que faites-vous ?',
 [['J’en parle à mon responsable et nous décidons quoi dire',2],['J’appelle le client pour lui expliquer l’erreur',1],['Je facture le bon prix sans prévenir le client',0],['Je ne dis rien : le devis a été signé ainsi',0]]);
P('VE-S12',M,'Prospect déjà équipé','Un prospect est satisfait de son fournisseur actuel. Que faites-vous ?',
 [['Je lui demande ce qu’il apprécie et ce qu’il améliorerait',2],['Je lui laisse ma carte pour le jour où il voudra changer',1],['Je lui explique que son fournisseur est plus cher que nous',0],['Je raccroche : il n’y a rien à tirer de ce contact',0]]);
P('VE-S13',M,'Commande urgente','Un client veut être livré sous 24 heures. Le délai habituel est de trois jours. Que faites-vous ?',
 [['Je vérifie avec la logistique avant de lui répondre',2],['Je lui annonce le délai habituel de trois jours',1],['J’accepte pour ne pas perdre la commande',0],['Je refuse immédiatement sa demande',0]]);
P('VE-S14',M,'Client en retard de paiement','Un client régulier a deux factures impayées et passe une nouvelle commande. Que faites-vous ?',
 [['J’en parle avec lui et la comptabilité avant de valider',2],['Je valide et je lui rappelle les deux factures',1],['Je valide la commande sans rien lui dire',0],['Je refuse la commande sans lui expliquer pourquoi',0]]);
P('VE-S15',D,'Offre d’un concurrent','Un client propose de vous montrer l’offre écrite d’un concurrent pour que vous fassiez mieux. Que faites-vous ?',
 [['Je décline et je lui demande plutôt ses attentes',2],['Je lui demande seulement le prix proposé',1],['J’accepte de voir le document et je l’étudie',0],['J’accepte et je le transmets à mon responsable',0]]);
P('VE-S16',D,'Promesse d’un collègue','Vous reprenez un portefeuille. Un client affirme qu’on lui avait promis un tarif spécial, sans écrit. Que faites-vous ?',
 [['Je vérifie l’historique, j’en parle au responsable, puis je réponds',2],['J’applique le tarif pour préserver la relation',1],['Je lui réponds que sans écrit la promesse n’existe pas',0],['Je lui accorde un tarif encore plus bas pour le garder',0]]);
P('VE-S17',D,'Cadeau d’un client','Un client important vous offre un cadeau de valeur après une grosse commande. Que faites-vous ?',
 [['J’applique la règle interne et, en cas de doute, j’en parle',2],['Je le refuse poliment en le remerciant',1],['Je l’accepte : c’est une simple marque de remerciement',0],['Je l’accepte et je n’en parle à personne',0]]);
P('VE-S18',D,'Besoin mal exprimé','Un client veut le produit le plus cher, mais une formule moins chère répond mieux à son besoin. Que faites-vous ?',
 [['Je lui explique pourquoi l’autre lui conviendrait mieux',2],['Je lui vends son choix en lui signalant l’autre formule',1],['Je lui vends le plus cher sans rien dire',0],['Je refuse de lui vendre le produit le plus cher',0]]);
P('VE-S19',D,'Conflit de territoire','Un prospect de votre zone a été signé par un collègue d’une autre zone. Que faites-vous ?',
 [['J’en parle d’abord avec lui, puis avec le responsable si besoin',2],['Je laisse faire pour éviter un conflit dans l’équipe',1],['Je rappelle le client pour reprendre le dossier',0],['Je soulève le problème en réunion devant toute l’équipe',0]]);
P('VE-S20',D,'Gros client perdu','Votre plus gros client annonce qu’il passe chez un concurrent. Que faites-vous ?',
 [['Je demande un rendez-vous pour comprendre ses raisons',2],['Je lui envoie vite une offre avec une forte remise',1],['J’accepte sa décision sans chercher à comprendre',0],['Je lui rappelle les pénalités prévues au contrat',0]]);
P('VE-S21',D,'Vente fictive','Votre responsable vous demande d’enregistrer une vente non signée pour tenir l’objectif du mois. Que faites-vous ?',
 [['Je refuse poliment et je propose de cibler les affaires proches',2],['Je l’enregistre en précisant qu’elle n’est pas signée',1],['Je l’enregistre, c’est une demande du responsable',0],['Je l’enregistre et je l’annulerai le mois prochain',0]]);

module.exports = out;
