// Ressources humaines (droit sénégalais : Code du travail, loi n° 97-17)
const { make, S, M, D } = require('./lib');
const { out, Q, P } = make('rh');

/* ---------- Connaissances : Simple ---------- */
Q('RH-M01','M',S,'Fiche de poste','À quoi sert une fiche de poste ?',
 ['À décrire missions, responsabilités et compétences attendues','À fixer le salaire et les primes de chaque titulaire','À suivre les absences et les retards de l’employé','À situer le poste dans l’organigramme de l’entreprise']);
Q('RH-M02','M',S,'Durée légale','Quelle est la durée légale du travail hebdomadaire hors secteur agricole au Sénégal ?',
 ['40 heures','35 heures','45 heures','48 heures']);
Q('RH-M03','M',S,'Congés payés','Combien de jours de congés payés acquiert-on par mois de service effectif selon le Code du travail sénégalais ?',
 ['2 jours ouvrables','2,5 jours ouvrables','1,5 jour ouvrable','1 jour ouvrable']);
Q('RH-M04','M',S,'Retraite','Quel organisme gère les retraites des salariés du secteur privé au Sénégal ?',
 ['L’IPRES','La CSS','L’IPM','L’ANPEJ']);
Q('RH-M05','M',S,'Bulletin de paie','Quand le bulletin de paie doit-il être remis au salarié ?',
 ['À chaque paiement du salaire','Une fois par an, en récapitulatif','Seulement s’il le demande','Seulement à son départ']);
Q('RH-M06','M',S,'Intégration','Quel est l’objectif principal d’un parcours d’intégration ?',
 ['Rendre la recrue autonome plus vite et éviter les départs précoces','Contrôler les compétences de la recrue avant la fin de l’essai','Faire signer le contrat et présenter le règlement intérieur','Présenter la recrue à toute l’entreprise lors d’un pot d’accueil']);
Q('RH-M07','M',S,'Entretien annuel','À quoi sert principalement l’entretien annuel d’évaluation ?',
 ['Faire le bilan, fixer des objectifs, voir les besoins de formation','Annoncer au salarié les augmentations déjà décidées','Revenir sur les erreurs de l’année pour les sanctionner','Vérifier que le salarié connaît bien sa fiche de poste']);
Q('RH-M08','M',S,'Sourcing','Que désigne le « sourcing » en recrutement ?',
 ['La recherche de candidats potentiels','La vérification des références','La rédaction de l’annonce d’emploi','La négociation du salaire d’embauche']);
Q('RH-M09','M',S,'Dossier du personnel','Quelle information ne doit pas figurer dans le dossier d’un salarié ?',
 ['Ses opinions politiques ou religieuses','Son contrat de travail et ses avenants','Ses bulletins de paie des dernières années','Ses demandes de congés validées']);
Q('RH-M10','M',S,'Absentéisme','Comment calcule-t-on le taux d’absentéisme ?',
 ['Heures d’absence ÷ heures théoriques de travail','Salariés absents ÷ salariés présents','Absences injustifiées ÷ absences justifiées','Jours d’absence ÷ 365 jours de l’année']);

/* ---------- Connaissances : Moyenne ---------- */
Q('RH-M11','M',M,'Protection sociale','Quel organisme verse les prestations familiales et gère les accidents du travail au Sénégal ?',
 ['La Caisse de sécurité sociale (CSS)','L’Institution de prévoyance retraite (IPRES)','L’Institution de prévoyance maladie (IPM)','L’Inspection régionale du travail']);
Q('RH-M12','M',M,'Entretien structuré','Qu’est-ce qu’un entretien de recrutement structuré ?',
 ['Les mêmes questions pour tous, notées sur une grille','Un entretien mené à plusieurs recruteurs à la fois','Un entretien qui suit le CV, de la formation au dernier poste','Un entretien d’une durée fixée à l’avance pour tous']);
Q('RH-M13','M',M,'Méthode STAR','Dans la méthode STAR, que signifie le « A » ?',
 ['L’action menée','L’analyse du contexte','L’attitude adoptée','L’avis du manager']);
Q('RH-M14','M',M,'Discrimination','Laquelle de ces questions est interdite en entretien ?',
 ['« Comptez-vous avoir des enfants prochainement ? »','« Pourquoi souhaitez-vous quitter votre poste ? »','« Quelles sont vos prétentions salariales ? »','« Êtes-vous disponible pour des déplacements ? »']);
Q('RH-M15','M',M,'Délégués du personnel','À partir de quel effectif les délégués du personnel sont-ils obligatoires au Sénégal ?',
 ['Plus de 10 salariés','Plus de 50 salariés','Dès le premier salarié','Plus de 100 salariés']);
Q('RH-M16','M',M,'Turnover','Que mesure le taux de rotation (turnover) du personnel ?',
 ['Le rythme de renouvellement des effectifs','Les changements de poste en interne','La part des salariés en contrat court','Le nombre de promotions dans l’année']);
Q('RH-M17','M',M,'Plan de formation','Sur quoi doit d’abord s’appuyer un plan de formation ?',
 ['Sur les compétences nécessaires aux objectifs de l’entreprise','Sur les demandes de formation exprimées par les salariés','Sur le catalogue des organismes de formation de la place','Sur le budget de formation restant en fin d’année']);
Q('RH-M18','M',M,'Marque employeur','Que désigne la « marque employeur » ?',
 ['L’image de l’entreprise en tant qu’employeur','Le logo imprimé sur les contrats de travail','Le nom commercial déposé de l’entreprise','La politique de rémunération de l’entreprise']);
Q('RH-M19','M',M,'Règlement intérieur','Que peut contenir le règlement intérieur ?',
 ['Règles d’hygiène, de sécurité, de discipline et sanctions','Salaire de chaque catégorie de personnel','Des règles moins favorables que le Code, si acceptées','Les objectifs commerciaux de l’année en cours']);
Q('RH-M20','M',M,'Inspection du travail','Quel est le rôle de l’inspection du travail ?',
 ['Contrôler le droit du travail, conseiller et concilier','Recruter du personnel pour le compte des entreprises','Verser aux salariés les indemnités de licenciement','Fixer le salaire minimum propre à chaque entreprise']);

/* ---------- Connaissances : Difficile ---------- */
Q('RH-M21','M',D,'GPEC','Quel est le but de la GPEC (gestion prévisionnelle des emplois et des compétences) ?',
 ['Anticiper les écarts de compétences et agir pour les réduire','Calculer à l’avance la masse salariale de l’année suivante','Prévoir le calendrier des congés de l’ensemble du personnel','Planifier les départs à la retraite pour réduire l’effectif']);
Q('RH-M22','M',D,'Licenciement économique','Avant un licenciement pour motif économique au Sénégal, l’employeur doit notamment :',
 ['Consulter les délégués et informer l’inspection du travail','Obtenir l’accord écrit de chaque salarié concerné','Obtenir l’autorisation préalable du tribunal du travail','Verser à chacun une indemnité d’un an de salaire']);
Q('RH-M23','M',D,'Masse salariale','Une hausse de la masse salariale peut venir de l’« effet report ». De quoi s’agit-il ?',
 ['De l’effet en année pleine des hausses de l’an passé','Du report de congés non pris d’une année sur l’autre','Du décalage du paiement des primes au mois suivant','Des heures supplémentaires converties en repos']);
Q('RH-M24','M',D,'Biais de recrutement','Qu’est-ce que l’« effet de halo » en entretien ?',
 ['Une qualité frappante qui colore tout le jugement','La préférence pour les candidats qui nous ressemblent','Le poids excessif de la toute première impression','La comparaison au candidat précédent plutôt qu’au poste']);
Q('RH-M25','M',D,'Coût d’un recrutement','Que comprend le coût d’un recrutement ?',
 ['Coûts externes, temps interne passé et intégration','La facture du cabinet de recrutement uniquement','Le salaire du premier mois de la recrue uniquement','Le prix des annonces publiées uniquement']);
Q('RH-M26','M',D,'Contrat à durée déterminée','Peut-on recourir au CDD pour pourvoir durablement un emploi permanent de l’entreprise ?',
 ['Non : il risque d’être requalifié en CDI','Oui, sans limite de durée ni de renouvellement','Oui, à condition de le renouveler chaque année','Oui, si le salarié donne son accord par écrit']);
Q('RH-M27','M',D,'Procédure disciplinaire','Avant de sanctionner un salarié pour une faute, quelle étape est essentielle ?',
 ['Lui permettre de s’expliquer sur les faits','Obtenir l’accord des délégués du personnel','Informer ses collègues de la sanction prévue','Lui retirer immédiatement ses accès']);
Q('RH-M28','M',D,'Efficacité d’une formation','Pour évaluer l’efficacité réelle d’une formation, le plus pertinent est de mesurer :',
 ['Le changement de pratiques au poste et ses effets','La satisfaction des participants en fin de session','Le nombre total d’heures de formation suivies','Le coût de la formation par participant formé']);
Q('RH-M29','M',D,'CV non retenus','Combien de temps conserver les CV des candidats non retenus ?',
 ['Une durée limitée, annoncée aux candidats','Sans limite, pour constituer un vivier','Jusqu’à ce que le candidat soit embauché ailleurs','Une semaine, puis destruction obligatoire']);
Q('RH-M30','M',D,'Climat social','Quel indicateur alerte le plus tôt sur une dégradation du climat dans une équipe ?',
 ['La hausse des absences courtes et répétées','La baisse des candidatures spontanées','La hausse de la masse salariale','La hausse des heures de formation']);

/* ---------- Mises en situation ---------- */
P('RH-S01',S,'Candidat en retard','Un candidat arrive 20 minutes en retard, sans prévenir. Que faites-vous ?',
 [['Je le reçois si possible et je lui demande ce qui s’est passé',2],['Je lui propose un autre rendez-vous dans la semaine',1],['Je refuse de le recevoir : la ponctualité est éliminatoire',0],['Je le reçois sans aborder le sujet du retard',0]]);
P('RH-S02',S,'Candidats non retenus','Vous avez reçu 200 candidatures. Que faites-vous pour les candidats non retenus ?',
 [['Je leur envoie à tous une réponse courtoise, même brève',2],['Je réponds seulement à ceux vus en entretien',1],['Je ne réponds pas : sans nouvelles, ils comprendront',0],['Je leur promets de garder leur profil, sans le faire',0]]);
P('RH-S03',S,'Congé en période chargée','Un salarié demande une semaine de congé pendant la période la plus chargée. Que faites-vous ?',
 [['Je cherche avec son responsable une date qui convienne à tous',2],['Je refuse en lui expliquant la raison',1],['J’accepte sans consulter son responsable',0],['Je laisse sa demande sans réponse',0]]);
P('RH-S04',S,'Retenue incomprise','Un salarié ne comprend pas une retenue sur son bulletin de paie. Que faites-vous ?',
 [['Je vérifie le calcul et je lui explique la retenue',2],['Je l’oriente vers le cabinet qui établit la paie',1],['Je lui assure que le bulletin est forcément juste',0],['Je lui promets le remboursement de la retenue',0]]);
P('RH-S05',S,'Arrivée mal préparée','Un nouveau salarié arrive lundi et rien n’est prêt (poste, accès). Que faites-vous ?',
 [['Je relance les services aujourd’hui et je prépare ses premiers jours',2],['Je l’accueille et je règle les problèmes au fur et à mesure',1],['Je lui demande de décaler son arrivée d’une semaine',0],['Je laisse son responsable gérer seul son arrivée',0]]);
P('RH-S06',S,'Rumeur','Une rumeur de licenciements circule dans l’entreprise. Que faites-vous ?',
 [['J’alerte la direction et je propose une communication claire',2],['Je rassure les salariés qui viennent me questionner',1],['Je confirme la rumeur, par souci de transparence',0],['Je laisse faire : la rumeur finira par s’éteindre',0]]);
P('RH-S07',S,'Demande de références','Une entreprise vous appelle pour des références sur un ancien salarié. Que faites-vous ?',
 [['Je m’en tiens aux faits vérifiables : poste et dates',2],['Je propose de rappeler après avoir revu son dossier',1],['Je raconte tout ce que je sais de son parcours ici',0],['Je donne mon avis personnel sur sa personnalité',0]]);
P('RH-S08',M,'Conflit d’équipe','Deux membres d’une équipe ne se parlent plus et l’ambiance se dégrade. Que faites-vous ?',
 [['Je vois chacun séparément, puis j’organise un échange avec leur responsable',2],['Je demande à leur responsable de régler lui-même le problème',1],['Je change l’un des deux de service sans autre discussion',0],['J’attends que la situation s’apaise d’elle-même',0]]);
P('RH-S09',M,'Harcèlement signalé','Une salariée vous confie qu’un collègue lui fait des remarques déplacées répétées. Que faites-vous ?',
 [['Je l’écoute, je note et je lance vite une enquête impartiale',2],['J’en parle au responsable du collègue mis en cause',1],['Je lui conseille d’éviter ce collègue en attendant',0],['Je relativise : il s’agit sans doute d’humour',0]]);
P('RH-S10',M,'Candidat recommandé','Le directeur recommande fortement un proche pour un poste. Son profil est moyen. Que faites-vous ?',
 [['Je l’évalue comme les autres et je rends un avis objectif',2],['Je le reçois en entretien en priorité',1],['Je l’embauche : c’est le choix du directeur',0],['J’écarte sa candidature sans l’évaluer',0]]);
P('RH-S11',M,'Salarié démotivé','Un bon salarié semble démotivé depuis quelques semaines. Que faites-vous ?',
 [['Je propose à son responsable un entretien pour comprendre',2],['Je lui écris pour lui demander si tout va bien',1],['Je lui rappelle ses objectifs et ses résultats',0],['J’attends l’entretien annuel pour en parler',0]]);
P('RH-S12',M,'Demande d’augmentation','Un salarié demande une augmentation en menaçant de rejoindre un concurrent. Que faites-vous ?',
 [['J’examine sa demande selon ses résultats et la grille, puis je réponds',2],['Je lui demande d’attendre la campagne annuelle d’augmentations',1],['Je l’augmente tout de suite pour éviter qu’il parte',0],['Je lui dis de partir s’il pense être mieux ailleurs',0]]);
P('RH-S13',M,'Fin de période d’essai','L’essai d’un salarié se termine dans trois jours et son responsable hésite. Que faites-vous ?',
 [['J’aide le responsable à décider sur des faits, avant l’échéance',2],['Je propose de renouveler l’essai si les textes le permettent',1],['Je laisse l’essai se terminer sans décision formelle',0],['Je mets fin à l’essai par simple précaution',0]]);
P('RH-S14',M,'Accident du travail','Un salarié se blesse dans l’atelier. Que faites-vous ?',
 [['Je veille aux soins, je déclare l’accident à temps, j’analyse les causes',2],['Je veille à ce qu’il soit soigné et je préviens la direction',1],['Je lui propose de poser des congés pour éviter une déclaration',0],['Je ne fais rien de particulier si la blessure semble légère',0]]);
P('RH-S15',D,'Annonce d’un licenciement','Vous devez annoncer un licenciement à un salarié apprécié de tous. Que faites-vous ?',
 [['Je prépare l’entretien et j’annonce clairement, avec respect',2],['Je l’annonce par écrit pour éviter un moment pénible',1],['Je laisse son responsable l’annoncer sans préparation',0],['Je l’annonce en réunion pour que tous soient informés',0]]);
P('RH-S16',D,'Recrutement précipité','Un responsable veut embaucher un candidat dès demain, sans vérifier ses références. Que faites-vous ?',
 [['Je vérifie les références en priorité dans la journée',2],['J’accepte en lui rappelant le risque qu’il prend',1],['J’accepte sans rien dire, c’est son équipe',0],['Je bloque le recrutement pendant deux semaines',0]]);
P('RH-S17',D,'Dossier médical','Un manager demande à consulter le dossier médical d’un collaborateur. Que faites-vous ?',
 [['Je refuse et je lui dis ce qu’il peut savoir : aptitude, restrictions',2],['Je lui résume oralement les éléments importants',1],['Je lui transmets le dossier pour qu’il s’organise',0],['Je lui conseille de poser la question au salarié',0]]);
P('RH-S18',D,'Écart de salaire','Une femme est moins payée que ses collègues hommes, à poste et expérience égaux. Que faites-vous ?',
 [['J’analyse l’écart et je propose une correction à la direction',2],['Je signale la situation à son responsable direct',1],['J’attends qu’elle soulève elle-même le problème',0],['Je lui conseille de demander une augmentation',0]]);
P('RH-S19',D,'Préavis de grève','Les délégués du personnel déposent un préavis de grève. Que faites-vous ?',
 [['J’informe la direction et j’organise vite une rencontre pour négocier',2],['J’informe la direction et j’attends ses consignes',1],['J’annonce des sanctions contre les futurs grévistes',0],['J’ignore le préavis tant que la grève n’a pas commencé',0]]);
P('RH-S20',D,'Réduction des coûts','La direction veut réduire la masse salariale de 10 %. Que proposez-vous d’abord ?',
 [['Étudier tous les leviers avant d’envisager des départs',2],['Geler toutes les augmentations de l’année',1],['Licencier 10 % du personnel au plus vite',0],['Baisser tous les salaires de 10 %',0]]);
P('RH-S21',D,'Candidat surqualifié','Un candidat très qualifié postule à un poste bien en dessous de son niveau. Que faites-vous ?',
 [['Je le reçois pour comprendre sa motivation et le risque de départ',2],['Je le reçois, mais je lui annonce d’emblée un salaire bas',1],['Je l’écarte d’office : il partira à la première occasion',0],['Je le recrute aussitôt : c’est une chance pour l’équipe',0]]);

module.exports = out;
