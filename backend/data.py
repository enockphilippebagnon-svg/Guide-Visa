"""Static data: pays, devises, simulations, liens, forum categories."""

PAYS = [
    {"code": "BJ", "nom": "Bénin", "drapeau": "🇧🇯"},
    {"code": "BF", "nom": "Burkina Faso", "drapeau": "🇧🇫"},
    {"code": "CI", "nom": "Côte d'Ivoire", "drapeau": "🇨🇮"},
    {"code": "GW", "nom": "Guinée-Bissau", "drapeau": "🇬🇼"},
    {"code": "ML", "nom": "Mali", "drapeau": "🇲🇱"},
    {"code": "NE", "nom": "Niger", "drapeau": "🇳🇪"},
    {"code": "SN", "nom": "Sénégal", "drapeau": "🇸🇳"},
    {"code": "TG", "nom": "Togo", "drapeau": "🇹🇬"},
    {"code": "GN", "nom": "Guinée", "drapeau": "🇬🇳"},
    {"code": "GH", "nom": "Ghana", "drapeau": "🇬🇭"},
    {"code": "NG", "nom": "Nigeria", "drapeau": "🇳🇬"},
    {"code": "CV", "nom": "Cap-Vert", "drapeau": "🇨🇻"},
    {"code": "CM", "nom": "Cameroun", "drapeau": "🇨🇲"},
    {"code": "CF", "nom": "Centrafrique", "drapeau": "🇨🇫"},
    {"code": "CG", "nom": "Congo", "drapeau": "🇨🇬"},
    {"code": "CD", "nom": "RD Congo", "drapeau": "🇨🇩"},
    {"code": "GA", "nom": "Gabon", "drapeau": "🇬🇦"},
    {"code": "GQ", "nom": "Guinée équatoriale", "drapeau": "🇬🇶"},
    {"code": "TD", "nom": "Tchad", "drapeau": "🇹🇩"},
    {"code": "RW", "nom": "Rwanda", "drapeau": "🇷🇼"},
    {"code": "BI", "nom": "Burundi", "drapeau": "🇧🇮"},
    {"code": "MA", "nom": "Maroc", "drapeau": "🇲🇦"},
    {"code": "DZ", "nom": "Algérie", "drapeau": "🇩🇿"},
    {"code": "TN", "nom": "Tunisie", "drapeau": "🇹🇳"},
    {"code": "MR", "nom": "Mauritanie", "drapeau": "🇲🇷"},
    {"code": "KE", "nom": "Kenya", "drapeau": "🇰🇪"},
    {"code": "ET", "nom": "Éthiopie", "drapeau": "🇪🇹"},
    {"code": "TZ", "nom": "Tanzanie", "drapeau": "🇹🇿"},
    {"code": "UG", "nom": "Ouganda", "drapeau": "🇺🇬"},
    {"code": "MG", "nom": "Madagascar", "drapeau": "🇲🇬"},
    {"code": "ZA", "nom": "Afrique du Sud", "drapeau": "🇿🇦"},
    {"code": "AO", "nom": "Angola", "drapeau": "🇦🇴"},
    {"code": "FR", "nom": "France", "drapeau": "🇫🇷"},
    {"code": "BE", "nom": "Belgique", "drapeau": "🇧🇪"},
    {"code": "CH", "nom": "Suisse", "drapeau": "🇨🇭"},
    {"code": "GB", "nom": "Royaume-Uni", "drapeau": "🇬🇧"},
    {"code": "CA", "nom": "Canada", "drapeau": "🇨🇦"},
    {"code": "OTHER", "nom": "Autre", "drapeau": "🌍"},
]

PAYS_VERS_DEVISE = {
    "BJ": "XOF", "BF": "XOF", "CI": "XOF", "GW": "XOF",
    "ML": "XOF", "NE": "XOF", "SN": "XOF", "TG": "XOF",
    "CM": "XAF", "CF": "XAF", "CG": "XAF", "GA": "XAF", "GQ": "XAF", "TD": "XAF",
    "MA": "MAD", "DZ": "DZD", "TN": "TND",
    "GN": "GNF", "GH": "GHS", "NG": "NGN", "CV": "EUR",
    "CD": "USD", "RW": "USD", "BI": "USD",
    "KE": "KES", "ET": "USD", "TZ": "USD", "UG": "USD",
    "MG": "USD", "ZA": "ZAR", "AO": "USD",
    "FR": "EUR", "BE": "EUR", "CH": "CHF", "GB": "GBP", "CA": "CAD",
    "OTHER": "EUR",
}

# Fallback rates (base = 1 EUR). Used when Frankfurter API unavailable.
TAUX_FALLBACK = {
    "EUR": 1.0, "USD": 1.08, "CAD": 1.47, "GBP": 0.85, "CHF": 0.96,
    "XOF": 655.957, "XAF": 655.957, "MAD": 10.7, "DZD": 145.0,
    "TND": 3.35, "GHS": 15.5, "NGN": 1650.0, "KES": 140.0, "ZAR": 20.0, "GNF": 9250.0,
}

# Simulation data — Canada, France, Allemagne
SIMULATIONS = {
    "CA": {
        "pays": "Canada",
        "drapeau": "🇨🇦",
        "devise_officielle": "CAD",
        "hero_image": "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1200",
        "motifs": {
            "etudes": {
                "titre": "Permis d'études au Canada",
                "delai": "8 à 16 semaines",
                "cout_total": 709,
                "etapes": [
                    {"num": 1, "titre": "Obtenir une lettre d'admission (DLI)", "cout": 0, "delai": "1 à 3 mois", "description": "Une lettre officielle qu'une école canadienne t'envoie pour confirmer que tu es accepté.", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/liste-etablissements-designes.html", "explication": "Choisis ton école sur la liste officielle des DLI, postule en ligne, paye les frais de candidature et reçois ta lettre."},
                    {"num": 2, "titre": "Prouver les fonds", "cout": 0, "delai": "Immédiat", "description": "Preuve que tu as assez d'argent pour vivre et étudier. Frais scolarité + 20 635 CAD/an (hors Québec).", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/prouver-fonds.html", "explication": "Relevés bancaires 4 mois, lettre de prise en charge ou attestation de bourse."},
                    {"num": 3, "titre": "Test de langue (IELTS/TEF)", "cout": 250, "delai": "2 à 4 semaines", "description": "Examen qui prouve ton niveau en anglais (IELTS) ou français (TEF).", "lien": "https://www.ielts.org/", "explication": "IELTS score min 6.0 en anglais ou TEF Canada B2 en français."},
                    {"num": 4, "titre": "Certificat médical", "cout": 100, "delai": "1 à 2 semaines", "description": "Examen médical réalisé par un médecin agréé par le Canada.", "lien": "https://secure.cic.gc.ca/pp-md/pp-list.aspx", "explication": "Chez un médecin désigné par IRCC. Validité 12 mois."},
                    {"num": 5, "titre": "CAQ (si Québec)", "cout": 124, "delai": "4 à 8 semaines", "description": "Certificat d'Acceptation du Québec — obligatoire pour étudier au Québec.", "lien": "https://www.quebec.ca/education/etudier-quebec/", "explication": "À demander avant le permis d'études si ton école est au Québec."},
                    {"num": 6, "titre": "Demande de permis d'études", "cout": 150, "delai": "8 à 16 semaines", "description": "La demande officielle à IRCC pour obtenir ton permis d'études.", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes.html", "explication": "En ligne sur le site d'IRCC avec tous tes documents scannés."},
                    {"num": 7, "titre": "Biométrie", "cout": 85, "delai": "2 semaines", "description": "Prise de tes empreintes digitales et photo — obligatoire.", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie.html", "explication": "Dans un centre VFS Global ou TLScontact. Validité 10 ans."},
                ],
            },
            "travail": {"titre": "Permis de travail au Canada", "delai": "10 à 20 semaines", "cout_total": 490, "etapes": [
                {"num": 1, "titre": "Obtenir une offre d'emploi", "cout": 0, "delai": "Variable", "description": "Un employeur canadien doit t'offrir un poste.", "lien": "https://www.jobbank.gc.ca/", "explication": "Utilise Job Bank ou LinkedIn pour trouver un emploi."},
                {"num": 2, "titre": "EIMT (si nécessaire)", "cout": 0, "delai": "8 semaines", "description": "L'employeur obtient une Étude d'impact sur le marché du travail.", "lien": "https://www.canada.ca/fr/emploi-developpement-social/services/travailleurs-etrangers.html", "explication": "Payée par l'employeur, pas par toi."},
                {"num": 3, "titre": "Demande de permis de travail", "cout": 155, "delai": "10 à 20 semaines", "description": "Demande officielle à IRCC.", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis.html", "explication": "En ligne avec tous les documents."},
                {"num": 4, "titre": "Certificat médical", "cout": 100, "delai": "2 semaines", "description": "Chez un médecin agréé.", "lien": "https://secure.cic.gc.ca/pp-md/pp-list.aspx", "explication": "Obligatoire pour certains emplois."},
                {"num": 5, "titre": "Biométrie", "cout": 85, "delai": "2 semaines", "description": "Empreintes et photo.", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie.html", "explication": "Centre VFS Global."},
            ]},
            "famille": {"titre": "Regroupement familial Canada", "delai": "12 mois", "cout_total": 1050, "etapes": [
                {"num": 1, "titre": "Parrainage", "cout": 75, "delai": "1 semaine", "description": "Un résident permanent ou citoyen canadien te parraine.", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/parrainer-membre-famille.html", "explication": "Ton parrain remplit un formulaire."},
                {"num": 2, "titre": "Demande de RP", "cout": 490, "delai": "12 mois", "description": "Demande de résidence permanente.", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete.html", "explication": "Dossier complet à IRCC."},
                {"num": 3, "titre": "Biométrie", "cout": 85, "delai": "2 semaines", "description": "Empreintes et photo.", "lien": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie.html", "explication": "VFS Global."},
            ]},
        },
    },
    "FR": {
        "pays": "France",
        "drapeau": "🇫🇷",
        "devise_officielle": "EUR",
        "hero_image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200",
        "motifs": {
            "etudes": {"titre": "Visa étudiant France", "delai": "3 semaines à 2 mois", "cout_total": 149, "etapes": [
                {"num": 1, "titre": "Inscription Études en France", "cout": 0, "delai": "Novembre-Mars", "description": "Plateforme obligatoire pour candidater aux universités françaises.", "lien": "https://pastel.diplomatie.gouv.fr/etudesenfrance/", "explication": "Créer un compte, remplir le dossier, payer les frais Campus France."},
                {"num": 2, "titre": "Frais Campus France", "cout": 50, "delai": "Immédiat", "description": "Frais obligatoires pour la procédure Études en France.", "lien": "https://www.campusfrance.org/", "explication": "Variable selon le pays d'origine (50-500 EUR)."},
                {"num": 3, "titre": "Test de langue française", "cout": 100, "delai": "1 mois", "description": "TCF, DELF ou DALF selon ton niveau requis.", "lien": "https://www.france-education-international.fr/", "explication": "Niveau B2 minimum pour la Licence, C1 pour le Master."},
                {"num": 4, "titre": "Justificatifs financiers", "cout": 0, "delai": "1 mois", "description": "Preuve de 615 EUR/mois pour vivre en France.", "lien": "https://france-visas.gouv.fr/", "explication": "Attestation bancaire ou de prise en charge."},
                {"num": 5, "titre": "Rendez-vous visa (VFS/TLS)", "cout": 30, "delai": "1 à 3 semaines", "description": "Prise de rendez-vous au centre TLScontact.", "lien": "https://www.tlscontact.com/", "explication": "Frais de service TLS en plus du visa."},
                {"num": 6, "titre": "Frais de visa long séjour", "cout": 99, "delai": "3 semaines", "description": "Visa VLS-TS étudiant.", "lien": "https://france-visas.gouv.fr/", "explication": "Payé au centre de dépôt."},
            ]},
            "travail": {"titre": "Visa travail France", "delai": "2 à 3 mois", "cout_total": 269, "etapes": [
                {"num": 1, "titre": "Offre d'emploi", "cout": 0, "delai": "Variable", "description": "Un employeur français doit t'embaucher.", "lien": "https://www.pole-emploi.fr/", "explication": "L'offre doit être validée par la DIRECCTE."},
                {"num": 2, "titre": "Autorisation de travail", "cout": 0, "delai": "2 mois", "description": "L'employeur demande l'autorisation.", "lien": "https://administration-etrangers-en-france.interieur.gouv.fr/", "explication": "Procédure côté employeur."},
                {"num": 3, "titre": "Frais de visa", "cout": 99, "delai": "3 semaines", "description": "VLS-TS salarié.", "lien": "https://france-visas.gouv.fr/", "explication": "À payer au centre TLS."},
                {"num": 4, "titre": "TLS service", "cout": 30, "delai": "1 semaine", "description": "Frais TLScontact.", "lien": "https://www.tlscontact.com/", "explication": "Obligatoire."},
                {"num": 5, "titre": "Taxe OFII", "cout": 200, "delai": "À l'arrivée", "description": "Taxe payée après arrivée en France.", "lien": "https://www.ofii.fr/", "explication": "Pour valider ton titre de séjour."},
            ]},
            "famille": {"titre": "Regroupement familial France", "delai": "6 à 12 mois", "cout_total": 439, "etapes": [
                {"num": 1, "titre": "Demande OFII", "cout": 200, "delai": "6 mois", "description": "Le conjoint résidant en France dépose la demande.", "lien": "https://www.ofii.fr/", "explication": "Formulaire à l'OFII."},
                {"num": 2, "titre": "Frais visa long séjour", "cout": 99, "delai": "3 semaines", "description": "VLS-TS conjoint.", "lien": "https://france-visas.gouv.fr/", "explication": "TLScontact."},
                {"num": 3, "titre": "TLS", "cout": 40, "delai": "1 semaine", "description": "Frais de service.", "lien": "https://www.tlscontact.com/", "explication": "Obligatoire."},
                {"num": 4, "titre": "Test de français", "cout": 100, "delai": "1 mois", "description": "Niveau A1 exigé.", "lien": "https://www.france-education-international.fr/", "explication": "DELF A1 minimum."},
            ]},
        },
    },
    "DE": {
        "pays": "Allemagne",
        "drapeau": "🇩🇪",
        "devise_officielle": "EUR",
        "hero_image": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200",
        "motifs": {
            "etudes": {"titre": "Visa étudiant Allemagne", "delai": "6 à 12 semaines", "cout_total": 325, "etapes": [
                {"num": 1, "titre": "Admission Uni-Assist", "cout": 75, "delai": "4 à 8 semaines", "description": "Plateforme d'inscription aux universités allemandes.", "lien": "https://www.uni-assist.de/", "explication": "75 EUR pour la 1ère candidature, 30 EUR par suivante."},
                {"num": 2, "titre": "Compte bloqué", "cout": 0, "delai": "2 semaines", "description": "Blocage de 11 904 EUR pour l'année (992 EUR/mois).", "lien": "https://www.expatrio.com/", "explication": "Via Expatrio, Deutsche Bank, Coracle. Preuve financière obligatoire."},
                {"num": 3, "titre": "Test de langue (TestDaF/Goethe)", "cout": 200, "delai": "1 mois", "description": "TestDaF ou Goethe-Zertifikat.", "lien": "https://www.testdaf.de/", "explication": "Niveau B2/C1 selon le programme."},
                {"num": 4, "titre": "Assurance santé", "cout": 0, "delai": "Immédiat", "description": "Obligatoire pour le visa.", "lien": "https://www.aok.de/", "explication": "TK, AOK ou assurance privée."},
                {"num": 5, "titre": "Demande de visa", "cout": 75, "delai": "6 à 12 semaines", "description": "À l'ambassade allemande.", "lien": "https://www.auswaertiges-amt.de/fr", "explication": "Prise de rendez-vous obligatoire."},
                {"num": 6, "titre": "Traduction assermentée", "cout": 100, "delai": "1 semaine", "description": "Documents traduits en allemand.", "lien": "https://www.auswaertiges-amt.de/fr", "explication": "Diplômes et actes de naissance."},
            ]},
            "travail": {"titre": "Carte bleue européenne (Allemagne)", "delai": "2 à 3 mois", "cout_total": 175, "etapes": [
                {"num": 1, "titre": "Offre d'emploi qualifié", "cout": 0, "delai": "Variable", "description": "Salaire min 45 300 EUR/an (2024).", "lien": "https://www.make-it-in-germany.com/fr/", "explication": "Emploi correspondant à ton diplôme."},
                {"num": 2, "titre": "Reconnaissance du diplôme", "cout": 100, "delai": "3 mois", "description": "Via ANABIN ou ZAB.", "lien": "https://www.anabin.kmk.org/", "explication": "Obligatoire pour prouver ton diplôme."},
                {"num": 3, "titre": "Visa carte bleue", "cout": 75, "delai": "2 mois", "description": "À l'ambassade allemande.", "lien": "https://www.auswaertiges-amt.de/fr", "explication": "Rendez-vous puis dépôt."},
            ]},
            "famille": {"titre": "Regroupement familial Allemagne", "delai": "3 à 6 mois", "cout_total": 275, "etapes": [
                {"num": 1, "titre": "Test A1 allemand", "cout": 100, "delai": "1 mois", "description": "Goethe A1 obligatoire pour conjoint.", "lien": "https://www.goethe.de/fr", "explication": "Sauf exceptions."},
                {"num": 2, "titre": "Traduction assermentée", "cout": 100, "delai": "1 semaine", "description": "Acte de mariage traduit.", "lien": "https://www.auswaertiges-amt.de/fr", "explication": "Par un traducteur agréé."},
                {"num": 3, "titre": "Demande de visa", "cout": 75, "delai": "3 mois", "description": "Ambassade allemande.", "lien": "https://www.auswaertiges-amt.de/fr", "explication": "Rendez-vous préalable."},
            ]},
        },
    },
}

FORUM_CATEGORIES = [
    {"slug": "canada-etudes", "nom": "🇨🇦 Canada — Études", "description": "Permis d'études, DLI, CAQ...", "ordre": 1},
    {"slug": "canada-travail", "nom": "🇨🇦 Canada — Travail", "description": "Entrée Express, permis de travail", "ordre": 2},
    {"slug": "france-etudes", "nom": "🇫🇷 France — Études", "description": "Campus France, VLS-TS", "ordre": 3},
    {"slug": "france-travail", "nom": "🇫🇷 France — Travail", "description": "Autorisation de travail, OFII", "ordre": 4},
    {"slug": "allemagne", "nom": "🇩🇪 Allemagne", "description": "Uni-Assist, compte bloqué, Carte bleue", "ordre": 5},
    {"slug": "tests-langue", "nom": "📝 Tests de langue", "description": "IELTS, TEF, TestDaF, Goethe", "ordre": 6},
    {"slug": "bourses", "nom": "💰 Bourses & financements", "description": "Erasmus+, AUF, DAAD", "ordre": 7},
    {"slug": "documents", "nom": "📁 Documents & démarches", "description": "Traduction, apostille", "ordre": 8},
    {"slug": "arnaques", "nom": "⚠️ Alertes arnaques", "description": "Signaler et prévenir", "ordre": 9},
    {"slug": "general", "nom": "💬 Discussions générales", "description": "Tout autre sujet", "ordre": 10},
]

LIENS_INITIAUX = [
    {"categorie": "Sites officiels", "titre": "IRCC — Immigration Canada", "url": "https://www.canada.ca/fr/immigration-refugies-citoyennete.html", "description": "Site officiel du gouvernement canadien pour toutes les demandes d'immigration.", "pays": "CA", "cout": "Gratuit"},
    {"categorie": "Sites officiels", "titre": "France-Visas", "url": "https://france-visas.gouv.fr/", "description": "Portail officiel des visas français.", "pays": "FR", "cout": "Gratuit"},
    {"categorie": "Sites officiels", "titre": "Make it in Germany", "url": "https://www.make-it-in-germany.com/fr/", "description": "Portail officiel du gouvernement allemand.", "pays": "DE", "cout": "Gratuit"},
    {"categorie": "Tests de langue", "titre": "IELTS", "url": "https://www.ielts.org/", "description": "Test d'anglais international requis pour le Canada.", "pays": "INT", "cout": "~250 CAD"},
    {"categorie": "Tests de langue", "titre": "TEF Canada", "url": "https://www.lefrancaisdesaffaires.fr/tests-diplomes/test-evaluation-francais-tef/", "description": "Test de français pour immigration au Canada.", "pays": "CA", "cout": "~250 CAD"},
    {"categorie": "Tests de langue", "titre": "TestDaF", "url": "https://www.testdaf.de/", "description": "Test d'allemand pour universités allemandes.", "pays": "DE", "cout": "~200 EUR"},
    {"categorie": "Bourses", "titre": "Campus France — Bourses", "url": "https://www.campusfrance.org/fr/bourses", "description": "Bourses pour étudier en France.", "pays": "FR", "cout": "Gratuit"},
    {"categorie": "Bourses", "titre": "DAAD", "url": "https://www.daad.de/fr/", "description": "Bourses allemandes pour étudiants internationaux.", "pays": "DE", "cout": "Gratuit"},
    {"categorie": "Modèles CV", "titre": "Europass", "url": "https://europa.eu/europass/fr", "description": "Modèle officiel de CV européen.", "pays": "INT", "cout": "Gratuit"},
    {"categorie": "Transfert d'argent", "titre": "Wise", "url": "https://wise.com/", "description": "Transferts internationaux à faibles frais.", "pays": "INT", "cout": "Frais réduits"},
    {"categorie": "Anti-arnaque", "titre": "Signaler une fraude (Canada)", "url": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigration-arnaque.html", "description": "Ressource officielle pour signaler les fraudes.", "pays": "CA", "cout": "Gratuit"},
    {"categorie": "Logement", "titre": "CROUS — Logement étudiant France", "url": "https://www.crous.fr/", "description": "Logement étudiant en France.", "pays": "FR", "cout": "Faible"},
]
