// Administratif et assistanat
const { make, S, M, D } = require('./lib');
const { out, Q, P } = make('admin');

/* ---------- Connaissances : Simple ---------- */
Q('AD-M01','M',S,'Courrier','Quelle formule convient pour terminer un courrier à un client que l’on ne connaît pas ?',
 ['« Veuillez agréer nos salutations distinguées. »','« Bien à vous, et à très bientôt. »','« Amicalement, toute l’équipe. »','« Dans l’attente, je vous embrasse. »']);
Q('AD-M02','M',S,'Compte rendu','Que doit contenir avant tout un compte rendu de réunion ?',
 ['Décisions, actions, responsables et échéances','La retranscription mot à mot des échanges','L’avis personnel de la personne qui rédige','La liste des absents et leurs motifs']);
Q('AD-M03','M',S,'Agenda','Deux rendez-vous importants du directeur se chevauchent. Que faites-vous d’abord ?',
 ['Je lui signale le conflit pour qu’il choisisse','J’annule le rendez-vous pris en dernier','Je garde les deux, l’un sera peut-être court','Je déplace les deux à une autre date']);
Q('AD-M04','M',S,'Classement','Quel est l’intérêt d’un plan de classement commun ?',
 ['Chacun retrouve un document, même en votre absence','Il réduit le nombre de documents à conserver','Il évite de devoir numériser les documents','Il protège seul les documents confidentiels']);
Q('AD-M05','M',S,'Accueil téléphonique','Comment décrocher le téléphone de façon professionnelle ?',
 ['Nom de l’entreprise, prénom, offre d’aide','« Allô, oui ? », puis laisser parler','Le numéro du poste, puis silence','« Qui est à l’appareil, s’il vous plaît ? »']);
Q('AD-M06','M',S,'Objet d’e-mail','Quel objet d’e-mail est le plus efficace ?',
 ['« Budget du 12 mars : à valider avant jeudi »','« Important : merci de lire rapidement »','« Suite à notre échange de la semaine »','« Documents pour la réunion de mardi »']);
Q('AD-M07','M',S,'Copie cachée','Quand utiliser la copie cachée (Cci) dans un e-mail ?',
 ['Pour écrire à beaucoup de gens sans montrer leurs adresses','Pour copier son responsable à l’insu de tous, en toute occasion','Pour que l’e-mail arrive plus vite chez les destinataires','Pour placer en copie les personnes les plus importantes']);
Q('AD-M08','M',S,'Fournitures','Que permet un suivi régulier du stock de fournitures ?',
 ['D’éviter ruptures et achats en urgence','De commander chaque mois la même quantité','De se passer des bons de commande','De travailler avec un seul fournisseur']);
Q('AD-M09','M',S,'Visiteur sans rendez-vous','Un visiteur sans rendez-vous demande à voir le directeur. Que faites-vous d’abord ?',
 ['Je lui demande son nom et l’objet de sa visite','Je le conduis directement au bureau du directeur','Je lui dis que le directeur ne reçoit jamais ainsi','Je lui demande de revenir avec un rendez-vous']);
Q('AD-M10','M',S,'Tableur','Quelle formule calcule la somme des cellules A1 à A10 ?',
 ['=SOMME(A1:A10)','=SOMME(A1;A10)','=TOTAL(A1-A10)','=A1+A10']);

/* ---------- Connaissances : Moyenne ---------- */
Q('AD-M11','M',M,'Ordre du jour','Pourquoi envoyer l’ordre du jour avant une réunion ?',
 ['Pour que chacun prépare les sujets','Pour que chacun décide s’il vient','Pour fixer l’ordre de prise de parole','Parce que c’est obligatoire pour toute réunion']);
Q('AD-M12','M',M,'Priorités','Selon la matrice d’Eisenhower, que faire d’une tâche importante mais pas urgente ?',
 ['La planifier','La faire tout de suite','La déléguer','L’abandonner']);
Q('AD-M13','M',M,'Archivage','Pourquoi certaines pièces comptables doivent-elles être gardées plusieurs années ?',
 ['La loi impose des durées, notamment pour les contrôles','Elles prennent de la valeur avec le temps','Elles servent de modèles pour les années suivantes','Elles ne peuvent pas être numérisées']);
Q('AD-M14','M',M,'Confidentialité','Vous trouvez sur l’imprimante commune un document confidentiel sur les salaires. Que faites-vous ?',
 ['Je le remets discrètement aux RH, sans le lire','Je le laisse : son auteur viendra le chercher','Je le lis pour savoir à qui le rapporter','Je le jette pour éviter qu’il ne circule']);
Q('AD-M15','M',M,'Déplacement à l’étranger','Pour organiser une mission à l’étranger, que vérifier en premier ?',
 ['Passeport, visa et formalités sanitaires','Prix et horaires des vols disponibles','Disponibilité et prix des hôtels','Montant des indemnités de mission']);
Q('AD-M16','M',M,'Bon de commande','Quel document engage l’entreprise auprès d’un fournisseur avant la livraison ?',
 ['Le bon de commande','Le bon de livraison','La facture','Le devis du fournisseur']);
Q('AD-M17','M',M,'Contrôle d’une facture','Avant de transmettre une facture fournisseur pour paiement, que vérifier ?',
 ['Qu’elle correspond à la commande et à la livraison','Qu’elle est arrivée par courrier recommandé','Qu’elle porte la signature du fournisseur','Qu’elle comporte le cachet du fournisseur']);
Q('AD-M18','M',M,'Tableur avancé','Quelle fonction retrouve le prix d’un article à partir de sa référence dans un tableau ?',
 ['RECHERCHEV','SOMME.SI','CONCATENER','NB.SI']);
Q('AD-M19','M',M,'Note de service','À quoi sert une note de service ?',
 ['À transmettre une consigne officielle au personnel','À répondre à la réclamation écrite d’un client','À demander un congé à son responsable direct','À inviter un partenaire extérieur à une réunion']);
Q('AD-M20','M',M,'Changement de RIB','Un fournisseur connu vous demande par e-mail de modifier ses coordonnées bancaires. Que faites-vous ?',
 ['Je le rappelle à son numéro habituel pour vérifier','Je modifie : l’e-mail vient bien de son adresse','Je réponds à l’e-mail pour demander confirmation','Je transmets l’e-mail à la comptabilité pour suite']);

/* ---------- Connaissances : Difficile ---------- */
Q('AD-M21','M',D,'Références absolues','Dans la formule =B2*$E$1, à quoi servent les symboles $ ?',
 ['À garder E1 fixe quand on recopie la formule','À afficher le résultat au format monétaire','À ignorer la cellule E1 lorsqu’elle est vide','À multiplier B2 par le total de la colonne E']);
Q('AD-M22','M',D,'Procès-verbal','Quelle différence entre un procès-verbal et un compte rendu ?',
 ['Le PV a une valeur officielle ; le compte rendu informe','Le PV est simplement plus court que le compte rendu','Le compte rendu est réservé aux assemblées générales','Aucune : ce sont deux noms pour le même document']);
Q('AD-M23','M',D,'Gestion des versions','Que désigne la « gestion des versions » d’un document partagé ?',
 ['Le suivi des modifications successives du document','La traduction du document en plusieurs langues','La conversion du document en plusieurs formats','L’envoi du document à plusieurs destinataires']);
Q('AD-M24','M',D,'Organisation d’un séminaire','Séminaire de 80 personnes dans deux mois : quelle étape vient en premier ?',
 ['Fixer objectif, budget et programme','Réserver le traiteur et la salle','Envoyer les invitations aux participants','Commander les supports imprimés']);
Q('AD-M25','M',D,'Mot de passe','Quel mot de passe est le plus sûr ?',
 ['Une longue phrase de passe, propre à ce compte','Le nom de l’entreprise suivi de l’année en cours','Un même mot de passe complexe pour tous les comptes','Une date de naissance suivie d’un symbole']);
Q('AD-M26','M',D,'Tableau de bord','Le directeur veut suivre chaque semaine les délais de réponse au courrier. Que proposez-vous ?',
 ['Un tableau : arrivée, réponse, délai, part dans les temps','Un rapport écrit détaillant chaque courrier reçu','Une réunion quotidienne de tout le service courrier','Un classement des courriers reçus par expéditeur']);
Q('AD-M27','M',D,'Achats','Pourquoi demander plusieurs devis avant un achat important ?',
 ['Pour comparer et justifier le choix du fournisseur','Parce que le premier devis est toujours trop cher','Pour faire baisser le prix du fournisseur habituel','Parce que la loi l’impose pour tout achat']);
Q('AD-M28','M',D,'Délégation de messagerie','Le directeur vous confie sa messagerie. Quelle règle fixer en priorité avec lui ?',
 ['Ce que vous traitez seule, transmettez ou signalez','L’heure à laquelle vous ouvrirez sa messagerie','Les dossiers et couleurs de classement à utiliser','Le nombre d’e-mails à traiter chaque jour']);
Q('AD-M29','M',D,'Données personnelles','Un prestataire veut la liste des salariés avec leurs numéros personnels pour un événement. Que faites-vous ?',
 ['Je ne transmets que le nécessaire, avec accord','Je transmets : c’est pour un événement interne','Je transmets en lui demandant de tout détruire','Je refuse sans en parler à quiconque']);
Q('AD-M30','M',D,'Interruptions','Votre journée est sans cesse interrompue par des demandes. Quelle méthode est la plus efficace ?',
 ['Regrouper les tâches et bloquer des créneaux protégés','Répondre tout de suite à chaque demande reçue','Traiter les demandes dans leur ordre d’arrivée','Garder les dossiers de fond pour après les heures']);

/* ---------- Mises en situation ---------- */
P('AD-S01',S,'Appel pour le directeur','Un appelant insiste pour parler au directeur, qui est en réunion. Que faites-vous ?',
 [['Je note ses coordonnées et l’objet, et j’annonce un rappel',2],['Je lui propose de rappeler en fin de matinée',1],['J’interromps la réunion pour transmettre l’appel',0],['Je lui donne le numéro de portable du directeur',0]]);
P('AD-S02',S,'Erreur dans un courrier','Vous remarquez une erreur de date dans un courrier envoyé ce matin à un client. Que faites-vous ?',
 [['Je préviens mon responsable et j’envoie un rectificatif',2],['J’envoie directement un rectificatif au client',1],['Je ne dis rien : le client ne le remarquera pas',0],['J’attends que le client appelle pour corriger',0]]);
P('AD-S03',S,'Deux urgences','Deux responsables vous confient chacun un travail « urgent » pour la même heure. Que faites-vous ?',
 [['Je les informe tous deux et je fais fixer la priorité',2],['Je commence par celui du responsable le plus haut placé',1],['Je fais les deux à moitié pour ne fâcher personne',0],['Je fais celui qui me paraît le plus intéressant',0]]);
P('AD-S04',S,'Visiteur qui attend','Un visiteur attend depuis 20 minutes car son rendez-vous a du retard. Que faites-vous ?',
 [['Je l’informe du retard et je préviens la personne qu’il attend',2],['Je lui propose un café et de quoi lire',1],['Je ne dis rien : il sera bientôt reçu',0],['Je lui propose de revenir un autre jour',0]]);
P('AD-S05',S,'Contrat introuvable','Le directeur demande un contrat signé que vous ne retrouvez pas. Que faites-vous ?',
 [['Je le préviens et je cherche méthodiquement, copies comprises',2],['Je continue à chercher sans rien lui dire',1],['Je lui dis qu’il ne me l’a jamais remis',0],['J’imprime une version non signée en attendant',0]]);
P('AD-S06',S,'Imprimante en panne','L’imprimante tombe en panne la veille d’une réunion importante. Que faites-vous ?',
 [['J’appelle le technicien et je prévois une solution de secours',2],['J’appelle le technicien et j’attends son passage',1],['J’attends qu’elle redémarre d’elle-même',0],['Je préviens que la réunion se fera sans documents',0]]);
P('AD-S07',S,'Message non transmis','Un client rappelle, furieux : son message n’a jamais été transmis. Que faites-vous ?',
 [['Je m’excuse, je note avec soin et je m’assure de la transmission',2],['Je m’excuse et je lui donne la ligne directe de la personne',1],['Je lui précise que ce n’est pas moi qui avais pris le message',0],['Je lui explique que la personne était trop occupée',0]]);
P('AD-S08',M,'Agenda surchargé','Le directeur part en mission demain et son agenda déborde. Que faites-vous ?',
 [['Je lui propose quoi déplacer ou déléguer, puis je préviens',2],['Je déplace les rendez-vous qui me semblent secondaires',1],['Je ne fais rien : il gérera à son retour',0],['J’annule tous ses rendez-vous de la semaine',0]]);
P('AD-S09',M,'Appel d’un journaliste','Un journaliste appelle pour obtenir des informations sur un projet de l’entreprise. Que faites-vous ?',
 [['Je prends ses coordonnées et je transmets au chargé de communication',2],['Je lui réponds poliment que je ne peux rien dire',1],['Je lui donne les informations que je connais',0],['Je raccroche sans prendre ses coordonnées',0]]);
P('AD-S10',M,'Collègue absente','Votre collègue est absente et ses dossiers urgents s’accumulent. Que faites-vous ?',
 [['Je vois avec notre responsable quels dossiers traiter d’abord',2],['Je traite ceux que je connais déjà',1],['Je les laisse en attente jusqu’à son retour',0],['Je traite tout sans prévenir personne',0]]);
P('AD-S11',M,'Livraison en retard','Une commande indispensable à un séminaire n’est pas livrée, à deux jours de l’événement. Que faites-vous ?',
 [['J’exige une date ferme et je prépare une solution de rechange',2],['Je relance le fournisseur par e-mail et par téléphone',1],['J’attends : la livraison devrait arriver à temps',0],['Je propose d’annuler le séminaire par précaution',0]]);
P('AD-S12',M,'Courses personnelles','Le directeur vous demande souvent de faire ses courses personnelles pendant vos heures de travail. Que faites-vous ?',
 [['J’en parle calmement avec lui pour clarifier mon rôle',2],['Je les fais, mais en dehors de mes heures',1],['Je les fais sans rien dire',0],['J’en parle à mes collègues',0]]);
P('AD-S13',M,'Faux virement','Vous recevez du « directeur », depuis une adresse inhabituelle, un e-mail urgent demandant un virement. Que faites-vous ?',
 [['Je vérifie auprès de lui par un autre moyen et je signale',2],['Je réponds à l’e-mail pour demander une confirmation',1],['J’effectue le virement puisque c’est urgent',0],['Je transfère l’e-mail à la comptabilité pour exécution',0]]);
P('AD-S14',M,'Réunion qui déborde','Une réunion dépasse l’horaire et la salle est réservée ensuite. Que faites-vous ?',
 [['Je préviens discrètement l’animateur et je cherche une autre salle',2],['J’informe le groupe suivant du retard',1],['J’interromps la réunion devant tout le monde',0],['Je ne dis rien et je laisse faire',0]]);
P('AD-S15',D,'Information sensible','Vous apprenez par hasard qu’un collègue va être licencié. Il vous demande si vous savez quelque chose. Que faites-vous ?',
 [['Je reste discret et l’invite à voir son responsable',2],['Je lui dis que je ne peux pas en parler',1],['Je lui dis tout : il a le droit de savoir',0],['Je lui assure que tout va bien pour lui',0]]);
P('AD-S16',D,'Erreur du directeur','Le directeur vous dicte un courrier qui contient une erreur de chiffre importante. Que faites-vous ?',
 [['Je lui signale l’erreur avant l’envoi',2],['Je corrige moi-même sans le lui dire',1],['J’envoie le courrier tel qu’il est dicté',0],['J’attends que le destinataire s’en aperçoive',0]]);
P('AD-S17',D,'Dossier bloqué','Les commerciaux et la comptabilité se renvoient un dossier client bloqué. Que faites-vous ?',
 [['Je rassemble les faits et je réunis brièvement les deux responsables',2],['Je signale le blocage à la direction',1],['Je donne raison au service que je connais le mieux',0],['Je laisse le dossier en attente',0]]);
P('AD-S18',D,'Budget dépassé','Le séminaire que vous organisez va dépasser son budget de 15 %. Que faites-vous ?',
 [['Je préviens tôt mon responsable, avec des pistes d’économies',2],['Je réduis discrètement certains postes de dépense',1],['J’attends la facture finale pour en parler',0],['Je supprime une partie du programme sans prévenir',0]]);
P('AD-S19',D,'Procédure refusée','Plusieurs collègues refusent d’appliquer votre nouvelle procédure de classement. Que faites-vous ?',
 [['J’écoute leurs objections, j’ajuste et j’explique les bénéfices',2],['Je demande à mon responsable d’imposer la procédure',1],['Je les laisse continuer comme avant',0],['Je classe moi-même leurs documents',0]]);
P('AD-S20',D,'Mot de passe demandé','Un collègue vous demande votre mot de passe pour accéder à un dossier. Que faites-vous ?',
 [['Je refuse et je l’oriente vers la demande d’accès',2],['Je lui envoie moi-même le document demandé',1],['Je lui communique mon mot de passe',0],['Je lui prête ma session ouverte',0]]);
P('AD-S21',D,'Surcharge durable','Depuis des semaines, votre charge vous oblige à rester tard chaque soir. Que faites-vous ?',
 [['Je fais le point et je revois les priorités avec mon responsable',2],['J’accélère mon rythme pour tout boucler à temps',1],['Je continue ainsi sans rien dire à personne',0],['Je laisse certaines tâches de côté sans prévenir',0]]);

module.exports = out;
