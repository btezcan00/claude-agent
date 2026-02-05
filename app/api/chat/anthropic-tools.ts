import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic tool definitions for the Atlas AI chat assistant.
 * All tool names are in Dutch to match the Dutch-language interface.
 */
export const tools: Anthropic.Tool[] = [
  {
    name: 'vraag_verduidelijking',
    description: 'Vraag de gebruiker om ontbrekende vereiste informatie voordat een plan wordt gemaakt. Gebruik dit VOOR plan_proposal wanneer vereiste velden niet kunnen worden bepaald uit het gebruikersbericht. Alleen gebruiken voor SCHRIJF-operaties wanneer vereiste velden ontbreken.',
    input_schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Korte uitleg welke informatie nodig is en waarom',
        },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unieke identificatie voor deze vraag' },
              question: { type: 'string', description: 'De vraag aan de gebruiker' },
              type: { type: 'string', enum: ['text', 'choice', 'multi-select'], description: 'Type verwachte invoer' },
              options: { type: 'array', items: { type: 'string' }, description: 'Opties voor keuze- of meerkeuze-vragen' },
              required: { type: 'boolean', description: 'Of dit veld verplicht is' },
              fieldName: { type: 'string', description: 'De veldnaam waar deze vraag bij hoort (bijv. "types", "placeOfObservation")' },
              toolName: { type: 'string', description: 'De tool waar dit veld bij hoort (bijv. "create_signal")' },
            },
            required: ['id', 'question', 'type', 'required', 'fieldName'],
          },
          description: 'Lijst van vragen aan de gebruiker',
        },
      },
      required: ['summary', 'questions'],
    },
  },
  {
    name: 'plan_voorstel',
    description: 'Presenteer een gestructureerd uitvoeringsplan aan de gebruiker ter goedkeuring voordat schrijfoperaties worden uitgevoerd. Gebruik deze tool VOOR elke aanmaak-, bewerk-, verwijder- of andere schrijfoperatie. Als vereiste velden ontbreken, gebruik eerst ask_clarification.',
    input_schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Korte samenvatting van wat er gedaan wordt (1-2 zinnen)',
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number', description: 'Stapnummer (beginnend bij 1)' },
              action: { type: 'string', description: 'Leesbare beschrijving van de actie' },
              tool: { type: 'string', description: 'Naam van de te gebruiken tool' },
              details: {
                type: 'object',
                description: 'Belangrijke parameters voor deze actie. Voor parameters die afhankelijk zijn van uitvoer van vorige stappen, gebruik referentiesyntax: "$stepN.fieldName" (bijv. "$step1.caseId" om te verwijzen naar de dossier-ID gemaakt in stap 1). Beschikbare uitvoervelden: stap met create_signal geeft signalId, signalNumber; stap met create_case geeft caseId, caseName.',
              },
            },
            required: ['step', 'action', 'tool'],
          },
          description: 'Lijst van geplande acties in uitvoeringsvolgorde',
        },
      },
      required: ['summary', 'actions'],
    },
  },
  {
    name: 'vat_meldingen_samen',
    description: 'Vat alle meldingen samen of een specifieke melding op ID. Gebruik dit wanneer de gebruiker een overzicht van meldingen wil.',
    input_schema: {
      type: 'object',
      properties: {
        melding_id: {
          type: 'string',
          description: 'Optionele specifieke melding-ID of meldingsnummer om samen te vatten. Indien niet opgegeven, worden alle meldingen samengevat.',
        },
      },
      required: [],
    },
  },
  {
    name: 'vat_dossier_samen',
    description: 'Vat een specifiek dossier of alle dossiers samen. Geeft belangrijke informatie terug inclusief status, locatie, meldingen en teamleden.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'Optionele dossier-ID of naam om samen te vatten. Indien niet opgegeven, worden alle dossiers samengevat.',
        },
      },
      required: [],
    },
  },
  {
    name: 'toon_meldingen',
    description: 'Toon alle meldingen in het systeem. Gebruik dit wanneer de gebruiker alle meldingen wil zien of vraagt naar meldingen.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'maak_melding',
    description: 'Maak een nieuwe melding aan met de opgegeven details. Geeft de meldinggegevens terug die moeten worden aangemaakt.',
    input_schema: {
      type: 'object',
      properties: {
        beschrijving: {
          type: 'string',
          description: 'Gedetailleerde beschrijving van de melding/waarneming',
        },
        soorten: {
          type: 'array',
          items: { type: 'string' },
          description: 'De types van de melding (bijv. mensenhandel, drugshandel, malafide-constructie, bibob-onderzoek, witwassen)',
        },
        plaatsVanWaarneming: {
          type: 'string',
          description: 'Locatie/adres waar de waarneming is gedaan',
        },
        tijdVanWaarneming: {
          type: 'string',
          description: 'ISO datetime string voor wanneer de waarneming is gedaan (bijv. 2024-01-15T14:30:00Z). Indien niet opgegeven door gebruiker, gebruik huidige tijd.',
        },
        ontvangenDoor: {
          type: 'string',
          enum: ['politie', 'anonieme-melding', 'gemeentelijke-afdeling', 'bibob-aanvraag', 'overig'],
          description: 'Bron die de melding heeft ontvangen',
        },
      },
      required: ['beschrijving', 'soorten', 'plaatsVanWaarneming', 'ontvangenDoor'],
    },
  },
  {
    name: 'bewerk_melding',
    description: 'Bewerk een bestaande melding. Geeft de updates terug die moeten worden toegepast.',
    input_schema: {
      type: 'object',
      properties: {
        melding_id: {
          type: 'string',
          description: 'De ID of meldingsnummer van de te bewerken melding',
        },
        beschrijving: {
          type: 'string',
          description: 'Nieuwe beschrijving voor de melding',
        },
        soorten: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nieuwe types voor de melding',
        },
        plaatsVanWaarneming: {
          type: 'string',
          description: 'Nieuwe locatie voor de melding',
        },
      },
      required: ['melding_id'],
    },
  },
  {
    name: 'voeg_notitie_toe',
    description: 'Voeg een notitie toe aan een bestaande melding. Gebruik dit wanneer de gebruiker opmerkingen, waarnemingen of updates aan een melding wil toevoegen.',
    input_schema: {
      type: 'object',
      properties: {
        melding_id: {
          type: 'string',
          description: 'De ID of meldingsnummer van de melding om een notitie aan toe te voegen',
        },
        inhoud: {
          type: 'string',
          description: 'De inhoud van de toe te voegen notitie',
        },
        is_prive: {
          type: 'boolean',
          description: 'Of de notitie privé moet zijn (standaard: false)',
        },
      },
      required: ['melding_id', 'inhoud'],
    },
  },
  {
    name: 'verwijder_melding',
    description: 'Verwijder een melding uit het systeem. Gebruik dit wanneer de gebruiker expliciet een melding wil verwijderen. Bevestig altijd voordat je verwijdert.',
    input_schema: {
      type: 'object',
      properties: {
        melding_id: {
          type: 'string',
          description: 'De ID of meldingsnummer van de te verwijderen melding',
        },
      },
      required: ['melding_id'],
    },
  },
  {
    name: 'voeg_melding_toe_aan_dossier',
    description: 'Voeg een bestaande melding toe aan een bestaand dossier. Gebruik dit wanneer de gebruiker een melding wil verplaatsen of koppelen aan een bestaand dossier.',
    input_schema: {
      type: 'object',
      properties: {
        melding_id: {
          type: 'string',
          description: 'De ID of meldingsnummer van de toe te voegen melding',
        },
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het bestaande dossier',
        },
      },
      required: ['melding_id', 'dossier_id'],
    },
  },
  {
    name: 'toon_teamleden',
    description: 'Toon alle beschikbare teamleden en hun dossiereigenaarschap. Gebruik dit wanneer de gebruiker vraagt naar teamleden of dossiertoewijzingen.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'haal_melding_statistieken_op',
    description: 'Haal dashboard statistieken op over alle meldingen. Geeft totaal aantal terug.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'zoek_meldingen',
    description: 'Zoek en filter meldingen op verschillende criteria. Gebruik dit wanneer de gebruiker specifieke meldingen wil vinden.',
    input_schema: {
      type: 'object',
      properties: {
        zoekterm: {
          type: 'string',
          description: 'Zoekterm om te matchen met meldingsbeschrijving, locatie of meldingsnummer',
        },
        type: {
          type: 'string',
          description: 'Filter op meldingstype (bijv. mensenhandel, drugshandel, malafide-constructie, bibob-onderzoek, witwassen)',
        },
        ontvangenDoor: {
          type: 'string',
          enum: ['politie', 'anonieme-melding', 'gemeentelijke-afdeling', 'bibob-aanvraag', 'overig'],
          description: 'Filter op bron die de melding heeft ontvangen',
        },
      },
      required: [],
    },
  },
  {
    name: 'haal_melding_activiteit_op',
    description: 'Haal de activiteitengeschiedenis/tijdlijn op voor een specifieke melding. Toont alle acties die op de melding zijn uitgevoerd.',
    input_schema: {
      type: 'object',
      properties: {
        melding_id: {
          type: 'string',
          description: 'De ID of meldingsnummer van de melding',
        },
      },
      required: ['melding_id'],
    },
  },
  {
    name: 'haal_melding_notities_op',
    description: 'Haal alle notities op voor een specifieke melding.',
    input_schema: {
      type: 'object',
      properties: {
        melding_id: {
          type: 'string',
          description: 'De ID of meldingsnummer van de melding',
        },
      },
      required: ['melding_id'],
    },
  },
  {
    name: 'vat_bijlagen_samen',
    description: 'Vat alle bijlagen (afbeeldingen, documenten, bestanden) samen en analyseer deze voor een specifieke melding. Gebruikt AI-visie om afbeeldingen te analyseren en tekst uit documenten te extraheren. Gebruik dit wanneer de gebruiker vraagt om bijlagen te beschrijven, samen te vatten of te analyseren.',
    input_schema: {
      type: 'object',
      properties: {
        melding_id: {
          type: 'string',
          description: 'De ID of meldingsnummer van de melding waarvan de bijlagen moeten worden samengevat',
        },
      },
      required: ['melding_id'],
    },
  },
  {
    name: 'toon_dossiers',
    description: 'Toon alle dossiers in het systeem. Gebruik dit wanneer de gebruiker beschikbare dossiers wil zien of vraagt naar dossiers.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'haal_dossier_statistieken_op',
    description: 'Haal statistieken op over dossiers. Geeft totaal aantal en aantal per status terug.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'voltooi_bibob_aanvraag',
    description: 'Voltooi de Bibob-aanvraag voor een dossier. BELANGRIJK: Gebruik dit alleen wanneer ALLE 4 criteria zijn voldaan. Als een criterium niet is voldaan, gebruik save_bibob_application_draft en informeer de gebruiker welke criteria ontbreken.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier waarvoor de aanvraag moet worden voltooid',
        },
        toelichting: {
          type: 'string',
          description: 'Algemene toelichting voor de voltooiing van de Bibob-aanvraag',
        },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                enum: ['necessary_info', 'annual_accounts', 'budgets', 'loan_agreement'],
                description: 'Criterium ID. Labels: necessary_info = "Alle benodigde informatie verstrekt?", annual_accounts = "Jaarrekeningen", budgets = "Begrotingen", loan_agreement = "Leningsovereenkomst"',
              },
              isMet: { type: 'boolean' },
              toelichting: { type: 'string' },
            },
            required: ['id', 'isMet', 'toelichting'],
          },
          description: 'Array van criteria met voltooiingsstatus en toelichtingen. Gebruik Nederlandse labels bij weergave: necessary_info = "Alle benodigde informatie verstrekt?", annual_accounts = "Jaarrekeningen", budgets = "Begrotingen", loan_agreement = "Leningsovereenkomst"',
        },
      },
      required: ['dossier_id', 'toelichting', 'criteria'],
    },
  },
  {
    name: 'sla_bibob_aanvraag_concept_op',
    description: 'Sla voortgang op van een Bibob-aanvraag zonder deze te voltooien. Gebruik dit wanneer criteria niet zijn voldaan. VOORDAT je deze tool gebruikt, MOET je de gebruiker eerst vertellen welke specifieke criteria niet zijn voldaan en uitleggen dat alle 4 criteria moeten zijn voldaan om de aanvraag te voltooien.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'ID of naam van het dossier',
        },
        toelichting: {
          type: 'string',
          description: 'Algemene toelichting voor de aanvraag (optioneel)',
        },
        criteria: {
          type: 'array',
          description: 'Status van aanvraagcriteria (optioneel). Gebruik Nederlandse labels bij weergave: necessary_info = "Alle benodigde informatie verstrekt?", annual_accounts = "Jaarrekeningen", budgets = "Begrotingen", loan_agreement = "Leningsovereenkomst"',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                enum: ['necessary_info', 'annual_accounts', 'budgets', 'loan_agreement'],
                description: 'Criterium ID. Labels: necessary_info = "Alle benodigde informatie verstrekt?", annual_accounts = "Jaarrekeningen", budgets = "Begrotingen", loan_agreement = "Leningsovereenkomst"',
              },
              isMet: { type: 'boolean' },
              toelichting: { type: 'string' },
            },
            required: ['id', 'isMet', 'toelichting'],
          },
        },
      },
      required: ['dossier_id'],
    },
  },
  {
    name: 'wijs_dossier_eigenaar_toe',
    description: 'Wijs een teamlid aan als eigenaar van een dossier. Gebruik dit wanneer de gebruiker iemand aan een dossier wil toewijzen.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier om een eigenaar aan toe te wijzen',
        },
        gebruiker_id: {
          type: 'string',
          description: 'De ID van het teamlid om als eigenaar toe te wijzen',
        },
        gebruiker_naam: {
          type: 'string',
          description: 'De volledige naam van het teamlid om als eigenaar toe te wijzen',
        },
      },
      required: ['dossier_id', 'gebruiker_id', 'gebruiker_naam'],
    },
  },
  {
    name: 'bewerk_dossier',
    description: 'Bewerk dossiereigenschappen zoals naam, beschrijving, status, locatie, kleur of tags. Gebruik dit wanneer de gebruiker dossierinformatie wil bijwerken.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het te bewerken dossier',
        },
        naam: {
          type: 'string',
          description: 'Nieuwe dossiernaam',
        },
        beschrijving: {
          type: 'string',
          description: 'Nieuwe dossierbeschrijving',
        },
        status: {
          type: 'string',
          enum: ['application', 'research', 'national_office', 'decision', 'archive'],
          description: 'Nieuwe dossierstatus in de workflow',
        },
        locatie: {
          type: 'string',
          description: 'Geografische of organisatorische locatie',
        },
        kleur: {
          type: 'string',
          description: 'Dossierkleur (bijv. #ef4444 voor rood, #3b82f6 voor blauw)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags voor het dossier (vervangt bestaande tags)',
        },
      },
      required: ['dossier_id'],
    },
  },
  {
    name: 'maak_dossier',
    description: 'Maak een nieuw dossier aan. BELANGRIJK: Als de gebruiker een melding noemt of een dossier maakt van een melding, MOET je die melding-ID opnemen in meldingIds. Vraag na aanmaak of de gebruiker het Bibob-aanvraagformulier wil invullen. Standaardnaam is "Nieuw Dossier".',
    input_schema: {
      type: 'object',
      properties: {
        naam: {
          type: 'string',
          description: 'Naam van het dossier (standaard: "Nieuw dossier")',
        },
        beschrijving: {
          type: 'string',
          description: 'Beschrijving van het doel van het dossier',
        },
        kleur: {
          type: 'string',
          description: 'Optionele hex-kleur voor het dossier',
        },
        meldingIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Melding-ID\'s om toe te voegen aan het dossier. MOET worden opgenomen bij het aanmaken van een dossier van/voor een melding.',
        },
      },
      required: [],
    },
  },
  {
    name: 'verwijder_dossier',
    description: 'Verwijder een dossier uit het systeem. Gebruik dit wanneer de gebruiker expliciet een dossier wil verwijderen. Bevestig altijd voordat je verwijdert.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het te verwijderen dossier',
        },
      },
      required: ['dossier_id'],
    },
  },
  {
    name: 'voeg_dossier_behandelaar_toe',
    description: 'Voeg een teamlid toe als behandelaar aan een dossier. Behandelaars kunnen werken aan het dossier maar hebben beperkte rechten vergeleken met de eigenaar.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        gebruiker_id: {
          type: 'string',
          description: 'De ID van het teamlid om als behandelaar toe te voegen',
        },
        gebruiker_naam: {
          type: 'string',
          description: 'De volledige naam van het teamlid om als behandelaar toe te voegen',
        },
      },
      required: ['dossier_id', 'gebruiker_id', 'gebruiker_naam'],
    },
  },
  {
    name: 'deel_dossier',
    description: 'Deel een dossier met een teamlid. Delen geeft hen toegang om het dossier te bekijken of te bewerken op basis van het opgegeven toegangsniveau.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het te delen dossier',
        },
        gebruiker_id: {
          type: 'string',
          description: 'De ID van het teamlid om mee te delen',
        },
        gebruiker_naam: {
          type: 'string',
          description: 'De volledige naam van het teamlid om mee te delen',
        },
        toegangsniveau: {
          type: 'string',
          enum: ['view', 'edit', 'admin'],
          description: 'Het toegangsniveau: view (alleen-lezen), edit (kan wijzigen), admin (volledige toegang)',
        },
      },
      required: ['dossier_id', 'gebruiker_id', 'gebruiker_naam', 'toegangsniveau'],
    },
  },
  {
    name: 'voeg_dossier_organisatie_toe',
    description: 'Voeg een organisatie toe aan een dossier. Gebruik dit wanneer de gebruiker een bedrijf, onderneming of organisatie aan het dossier wil koppelen.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        naam: {
          type: 'string',
          description: 'Naam van de organisatie',
        },
        kvk_nummer: {
          type: 'string',
          description: 'KVK-nummer (Kamer van Koophandel) indien bekend',
        },
        adres: {
          type: 'string',
          description: 'Adres van de organisatie',
        },
        type: {
          type: 'string',
          description: 'Type organisatie (bijv. "bedrijf", "stichting", "vereniging")',
        },
      },
      required: ['dossier_id', 'naam'],
    },
  },
  {
    name: 'voeg_dossier_adres_toe',
    description: 'Voeg een adres/locatie toe aan een dossier. Gebruik dit wanneer de gebruiker een specifiek adres of locatie aan het dossier wil koppelen.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        straat: {
          type: 'string',
          description: 'Straatnaam en huisnummer',
        },
        plaats: {
          type: 'string',
          description: 'Plaatsnaam',
        },
        postcode: {
          type: 'string',
          description: 'Postcode',
        },
        land: {
          type: 'string',
          description: 'Land (standaard: Nederland)',
        },
        beschrijving: {
          type: 'string',
          description: 'Beschrijving of notities over dit adres',
        },
      },
      required: ['dossier_id', 'straat', 'plaats'],
    },
  },
  {
    name: 'voeg_dossier_persoon_toe',
    description: 'Voeg een betrokken persoon toe aan een dossier. Gebruik dit wanneer de gebruiker een persoon aan het dossieronderzoek wil koppelen.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        voornaam: {
          type: 'string',
          description: 'Voornaam van de persoon',
        },
        achternaam: {
          type: 'string',
          description: 'Achternaam van de persoon',
        },
        geboortedatum: {
          type: 'string',
          description: 'Geboortedatum (JJJJ-MM-DD formaat)',
        },
        rol: {
          type: 'string',
          description: 'Rol of relatie tot het dossier (bijv. "verdachte", "getuige", "eigenaar", "werknemer")',
        },
        notities: {
          type: 'string',
          description: 'Aanvullende notities over deze persoon',
        },
      },
      required: ['dossier_id', 'voornaam', 'achternaam'],
    },
  },
  {
    name: 'voeg_dossier_bevinding_toe',
    description: 'Voeg een bevinding toe aan een dossier. Gebruik een van de 6 voorgedefinieerde bevindingstypen: 1) LBB - geen ernstige mate van gevaar (none), 2) LBB - mindere mate van gevaar (low), 3) LBB - ernstige mate van gevaar (serious), 4) Ernstig gevaar - investeren crimineel vermogen (A) (critical), 5) Ernstig gevaar - plegen strafbare feiten (B) (critical), 6) geen ernstige mate van gevaar (none).',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        label: {
          type: 'string',
          description: 'Het bevindingstype label (gebruik exact label van voorgedefinieerde types)',
        },
        ernst: {
          type: 'string',
          enum: ['none', 'low', 'serious', 'critical'],
          description: 'Ernst niveau overeenkomend met het bevindingstype',
        },
        toegewezen_aan: {
          type: 'string',
          description: 'Naam van het teamlid aan wie deze bevinding is toegewezen',
        },
      },
      required: ['dossier_id', 'label', 'ernst'],
    },
  },
  {
    name: 'voeg_dossier_brief_toe',
    description: 'Voeg een brief/document toe aan een dossier. Twee sjablonen beschikbaar: lbb_notification (LBB-kennisgevingsbrief) en bibob_7c_request (Artikel 7c Wet Bibob-verzoek). Elk heeft specifieke vereiste velden. BELANGRIJK: Vraag altijd eerst om de brief_naam, verzamel dan alle sjabloon-specifieke velden voordat je deze tool aanroept.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        brief_naam: {
          type: 'string',
          description: 'Aangepaste naam/titel voor de brief (bijv. "Bibob Verzoek - ABC Bedrijf")',
        },
        sjabloon: {
          type: 'string',
          enum: ['lbb_notification', 'bibob_7c_request'],
          description: 'Sjabloontype',
        },
        // Common fields
        datum: {
          type: 'string',
          description: 'Datum van de brief (JJJJ-MM-DD formaat)',
        },
        gemeente_provincie: {
          type: 'string',
          description: 'Gemeente- of provincienaam',
        },
        // LBB Notification specific fields
        referentienummer: {
          type: 'string',
          description: 'Referentienummer (LBB-kennisgeving)',
        },
        ontvanger_naam: {
          type: 'string',
          description: 'Naam van ontvanger (LBB-kennisgeving)',
        },
        ontvanger_adres: {
          type: 'string',
          description: 'Adres van ontvanger (LBB-kennisgeving)',
        },
        ontvanger_postcode: {
          type: 'string',
          description: 'Postcode en plaats van ontvanger (LBB-kennisgeving)',
        },
        onderwerp: {
          type: 'string',
          description: 'Onderwerp van de brief (LBB-kennisgeving)',
        },
        kennisgeving_inhoud: {
          type: 'string',
          description: 'Kennisgevingsinhoud/brieftekst (LBB-kennisgeving)',
        },
        afzender_naam: {
          type: 'string',
          description: 'Naam van afzender (LBB-kennisgeving)',
        },
        afzender_titel: {
          type: 'string',
          description: 'Titel/functie van afzender (LBB-kennisgeving)',
        },
        // Bibob 7c Request specific fields
        aanvrager_naam: {
          type: 'string',
          description: 'Naam van aanvrager (Bibob 7c)',
        },
        aanvrager_telefoon: {
          type: 'string',
          description: 'Telefoonnummer van aanvrager (Bibob 7c)',
        },
        ontvanger_email: {
          type: 'string',
          description: 'E-mailadres van ontvanger (Bibob 7c)',
        },
        wettelijke_bepalingen: {
          type: 'array',
          items: { type: 'string' },
          description: 'Geselecteerde wettelijke bepalingen (Bibob 7c): article_10x, awr_incorrect, general_tax_act, article_67e, article_67f',
        },
        boete_informatie: {
          type: 'array',
          items: { type: 'string' },
          description: 'Geselecteerde boete-informatie (Bibob 7c): irrevocable_fines, fines_court_ruled, fines_no_ruling',
        },
        vergunning_soorten: {
          type: 'array',
          items: { type: 'string' },
          description: 'Geselecteerde vergunningstypen (Bibob 7c): alcohol_act, wabo_building, wabo_environmental, wabo_usage, operating_establishment, sex_establishment, license_other',
        },
        aanvullende_opmerkingen: {
          type: 'string',
          description: 'Aanvullende opmerkingen (Bibob 7c)',
        },
      },
      required: ['dossier_id', 'sjabloon', 'datum', 'gemeente_provincie'],
    },
  },
  {
    name: 'voeg_dossier_communicatie_toe',
    description: 'Voeg een communicatierecord toe aan een dossier. Communicatie houdt correspondentie, telefoongesprekken, vergaderingen of andere interacties gerelateerd aan het dossier bij.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        label: {
          type: 'string',
          description: 'Korte titel/label voor de communicatie (bijv. "Telefoongesprek met getuige", "E-mail van belastingdienst")',
        },
        beschrijving: {
          type: 'string',
          description: 'Gedetailleerde beschrijving van de communicatie',
        },
        datum: {
          type: 'string',
          description: 'Datum van de communicatie (JJJJ-MM-DD formaat). Standaard vandaag indien niet opgegeven.',
        },
      },
      required: ['dossier_id', 'label'],
    },
  },
  {
    name: 'haal_dossier_berichten_op',
    description: 'Haal de chatberichten op voor een specifiek contact in een dossier. Geeft de laatste berichten in het gesprek terug.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        contact_id: {
          type: 'string',
          description: 'De ID van het contact (gebruikers-ID voor behandelaars/gedeelde gebruikers, organisatie-ID voor organisaties, persoon-ID voor betrokkenen)',
        },
        contact_naam: {
          type: 'string',
          description: 'De naam van het contact (voor weergavedoeleinden)',
        },
        contact_type: {
          type: 'string',
          enum: ['practitioner', 'shared', 'organization', 'person'],
          description: 'Het type contact: practitioner (behandelaar), shared (gedeelde gebruiker), organization (organisatie), of person (betrokken persoon)',
        },
        limiet: {
          type: 'number',
          description: 'Maximum aantal berichten om terug te geven (standaard: 5)',
        },
      },
      required: ['dossier_id', 'contact_id', 'contact_naam', 'contact_type'],
    },
  },
  {
    name: 'verstuur_dossier_bericht',
    description: 'Stuur een chatbericht naar een contact in een dossier.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        contact_id: {
          type: 'string',
          description: 'De ID van het contact (gebruikers-ID voor behandelaars/gedeelde gebruikers, organisatie-ID voor organisaties, persoon-ID voor betrokkenen)',
        },
        contact_naam: {
          type: 'string',
          description: 'De naam van het contact',
        },
        contact_type: {
          type: 'string',
          enum: ['practitioner', 'shared', 'organization', 'person'],
          description: 'Het type contact: practitioner (behandelaar), shared (gedeelde gebruiker), organization (organisatie), of person (betrokken persoon)',
        },
        bericht: {
          type: 'string',
          description: 'De berichtinhoud om te verzenden',
        },
      },
      required: ['dossier_id', 'contact_id', 'contact_naam', 'contact_type', 'bericht'],
    },
  },
  {
    name: 'voeg_dossier_visualisatie_toe',
    description: 'Voeg een visualisatie toe aan een dossier. Visualisaties zijn diagrammen, grafieken, relatieschema\'s of andere visuele weergaven van dossiergegevens.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        label: {
          type: 'string',
          description: 'Korte titel/label voor de visualisatie (bijv. "Organisatiestructuur", "Tijdlijn van gebeurtenissen")',
        },
        beschrijving: {
          type: 'string',
          description: 'Beschrijving van wat de visualisatie toont',
        },
      },
      required: ['dossier_id', 'label'],
    },
  },
  {
    name: 'voeg_dossier_activiteit_toe',
    description: 'Voeg een activiteit toe aan een dossier. Activiteiten houden taken, acties of werkitems bij die moeten worden gedaan of zijn voltooid voor het dossier.',
    input_schema: {
      type: 'object',
      properties: {
        dossier_id: {
          type: 'string',
          description: 'De ID of naam van het dossier',
        },
        label: {
          type: 'string',
          description: 'Korte titel/label voor de activiteit (bijv. "Documenten beoordelen", "Getuige interviewen")',
        },
        beschrijving: {
          type: 'string',
          description: 'Gedetailleerde beschrijving van de activiteit',
        },
        toegewezen_aan: {
          type: 'string',
          description: 'Naam van de persoon aan wie deze activiteit is toegewezen',
        },
        datum: {
          type: 'string',
          description: 'Deadline of datum van de activiteit (JJJJ-MM-DD formaat). Standaard vandaag indien niet opgegeven.',
        },
      },
      required: ['dossier_id', 'label'],
    },
  },
];

/**
 * Tool name constants for use in tool handling logic.
 * Using constants prevents typos and enables IDE autocompletion.
 */
export const TOOL_NAMES = {
  // Core workflow tools
  VRAAG_VERDUIDELIJKING: 'vraag_verduidelijking',
  PLAN_VOORSTEL: 'plan_voorstel',

  // Signal (Melding) tools
  VAT_MELDINGEN_SAMEN: 'vat_meldingen_samen',
  TOON_MELDINGEN: 'toon_meldingen',
  MAAK_MELDING: 'maak_melding',
  BEWERK_MELDING: 'bewerk_melding',
  VOEG_NOTITIE_TOE: 'voeg_notitie_toe',
  VERWIJDER_MELDING: 'verwijder_melding',
  VOEG_MELDING_TOE_AAN_DOSSIER: 'voeg_melding_toe_aan_dossier',
  HAAL_MELDING_STATISTIEKEN_OP: 'haal_melding_statistieken_op',
  ZOEK_MELDINGEN: 'zoek_meldingen',
  HAAL_MELDING_ACTIVITEIT_OP: 'haal_melding_activiteit_op',
  HAAL_MELDING_NOTITIES_OP: 'haal_melding_notities_op',
  VAT_BIJLAGEN_SAMEN: 'vat_bijlagen_samen',

  // Case (Dossier) tools
  VAT_DOSSIER_SAMEN: 'vat_dossier_samen',
  TOON_DOSSIERS: 'toon_dossiers',
  HAAL_DOSSIER_STATISTIEKEN_OP: 'haal_dossier_statistieken_op',
  MAAK_DOSSIER: 'maak_dossier',
  BEWERK_DOSSIER: 'bewerk_dossier',
  VERWIJDER_DOSSIER: 'verwijder_dossier',
  WIJS_DOSSIER_EIGENAAR_TOE: 'wijs_dossier_eigenaar_toe',
  VOEG_DOSSIER_BEHANDELAAR_TOE: 'voeg_dossier_behandelaar_toe',
  DEEL_DOSSIER: 'deel_dossier',
  VOEG_DOSSIER_ORGANISATIE_TOE: 'voeg_dossier_organisatie_toe',
  VOEG_DOSSIER_ADRES_TOE: 'voeg_dossier_adres_toe',
  VOEG_DOSSIER_PERSOON_TOE: 'voeg_dossier_persoon_toe',
  VOEG_DOSSIER_BEVINDING_TOE: 'voeg_dossier_bevinding_toe',
  VOEG_DOSSIER_BRIEF_TOE: 'voeg_dossier_brief_toe',
  VOEG_DOSSIER_COMMUNICATIE_TOE: 'voeg_dossier_communicatie_toe',
  HAAL_DOSSIER_BERICHTEN_OP: 'haal_dossier_berichten_op',
  VERSTUUR_DOSSIER_BERICHT: 'verstuur_dossier_bericht',
  VOEG_DOSSIER_VISUALISATIE_TOE: 'voeg_dossier_visualisatie_toe',
  VOEG_DOSSIER_ACTIVITEIT_TOE: 'voeg_dossier_activiteit_toe',

  // Bibob tools
  VOLTOOI_BIBOB_AANVRAAG: 'voltooi_bibob_aanvraag',
  SLA_BIBOB_AANVRAAG_CONCEPT_OP: 'sla_bibob_aanvraag_concept_op',

  // Team tools
  TOON_TEAMLEDEN: 'toon_teamleden',
} as const;

export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES];
