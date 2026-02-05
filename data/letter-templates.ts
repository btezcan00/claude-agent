export interface LetterTemplateField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'textarea' | 'checkbox' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean;
}

export interface LetterTemplateSection {
  id: string;
  title?: string;
  type: 'header' | 'paragraph' | 'fields' | 'checkboxGroup' | 'table';
  content?: string;
  fields?: LetterTemplateField[];
  rows?: { label: string; id: string }[];
}

export interface LetterTemplate {
  id: string;
  name: string;
  sections: LetterTemplateSection[];
}

export const LETTER_TEMPLATE_CONTENT: Record<string, LetterTemplate> = {
  lbb_notification: {
    id: 'lbb_notification',
    name: 'LBB notificatiebrief',
    sections: [
      {
        id: 'header',
        type: 'header',
        content: 'LBB Notificatiebrief',
      },
      {
        id: 'basic_info',
        type: 'fields',
        title: 'Basisgegevens',
        fields: [
          { id: 'date', label: 'Datum', type: 'date', required: true },
          { id: 'reference_number', label: 'Referentienummer', type: 'text', placeholder: 'Voer referentienummer in' },
          { id: 'municipal_province', label: 'Gemeente/provincie', type: 'text', placeholder: 'Voer gemeente of provincie in', required: true },
        ],
      },
      {
        id: 'recipient_info',
        type: 'fields',
        title: 'Gegevens ontvanger',
        fields: [
          { id: 'recipient_name', label: 'Naam ontvanger', type: 'text', placeholder: 'Voer naam ontvanger in', required: true },
          { id: 'recipient_address', label: 'Adres', type: 'text', placeholder: 'Voer adres in' },
          { id: 'recipient_postal_code', label: 'Postcode en plaats', type: 'text', placeholder: 'Voer postcode en plaats in' },
        ],
      },
      {
        id: 'subject',
        type: 'fields',
        title: 'Onderwerp',
        fields: [
          { id: 'subject', label: 'Onderwerp', type: 'text', placeholder: 'Voer onderwerp in', required: true },
        ],
      },
      {
        id: 'intro_paragraph',
        type: 'paragraph',
        content: 'Geachte heer/mevrouw,\n\nHierbij informeren wij u over het volgende:',
      },
      {
        id: 'notification_content',
        type: 'fields',
        title: 'Notificatiedetails',
        fields: [
          { id: 'notification_text', label: 'Inhoud notificatie', type: 'textarea', placeholder: 'Voer de notificatiedetails in...', required: true },
        ],
      },
      {
        id: 'closing',
        type: 'fields',
        title: 'Afsluiting',
        fields: [
          { id: 'sender_name', label: 'Naam afzender', type: 'text', placeholder: 'Voer naam afzender in' },
          { id: 'sender_title', label: 'Titel/functie afzender', type: 'text', placeholder: 'Voer titel of functie in' },
        ],
      },
    ],
  },
  bibob_7c_request: {
    id: 'bibob_7c_request',
    name: 'Formulier voor het opvragen van informatie door een bestuursorgaan bij de Belastingdienst op grond van artikel 7c van de Wet Bibob',
    sections: [
      {
        id: 'header',
        type: 'header',
        content: 'Formulier voor het opvragen van informatie door een bestuursorgaan bij de Belastingdienst op grond van artikel 7c van de Wet Bibob',
      },
      {
        id: 'basic_info',
        type: 'fields',
        title: 'Basisgegevens',
        fields: [
          { id: 'date', label: 'Datum', type: 'date', required: true },
          { id: 'municipal_province', label: 'Gemeente/provincie', type: 'text', placeholder: 'Voer gemeente of provincie in', required: true },
          { id: 'applicant_name', label: 'Naam aanvrager', type: 'text', placeholder: 'Voer naam aanvrager in', required: true },
          { id: 'applicant_phone', label: 'Telefoonnummer aanvrager', type: 'text', placeholder: 'Voer telefoonnummer in' },
          { id: 'recipient_email', label: 'E-mailadres ontvanger', type: 'text', placeholder: 'Voer e-mailadres in' },
        ],
      },
      {
        id: 'legal_provisions_intro',
        type: 'paragraph',
        content: 'Ik wil graag informatie ontvangen over de volgende wettelijke bepalingen:',
      },
      {
        id: 'legal_provisions',
        type: 'checkboxGroup',
        title: 'Wettelijke Bepalingen',
        fields: [
          {
            id: 'article_10x',
            label: 'Artikel 10x, derde lid, AWR betreft het opzettelijk of grof schuldig begaan door belastingplichtigen of inhoudingsplichtigen van onjuistheden of onvolledigheden in de aangifte. Relevante fiscale gegevens en informatie waarvan zij op de hoogte zijn of zijn geworden. Artikel 67cc',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            id: 'awr_incorrect',
            label: 'AWR betreft het opzettelijk verstrekken van onjuiste of onvolledige informatie aan een voorlopige aanslag of herziening. Artikel',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            id: 'general_tax_act',
            label: 'Artikel van de Algemene wet inzake rijksbelastingen (AWR) betreft het opzettelijk niet doen van aangifte, onjuist doen van aangifte of onvolledig doen van aangifte.',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            id: 'article_67e',
            label: 'Artikel 67e van de Algemene wet inzake rijksbelastingen (AWR) betreft de situatie met betrekking tot navorderingsaanslagen, die te wijten is aan opzet of grove schuld van de belastingplichtige waardoor de aanslag op een te laag bedrag is vastgesteld of anderszins te weinig belasting is geheven.',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            id: 'article_67f',
            label: 'Artikel 67f AWR betreft de situatie waarin de belastingplichtige schuldig is aan opzet of grove schuld in het geval dat belasting die op aangifte moet worden betaald of afgedragen niet of gedeeltelijk wordt betaald, binnen de in de belastingwet gestelde termijn.',
            type: 'checkbox',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'fine_info',
        type: 'paragraph',
        content: 'Vermeld het bedrag van de boete en het boekjaar waarvoor de boete is opgelegd. Geef ook aan welke boete het betreft:',
      },
      {
        id: 'fine_details',
        type: 'checkboxGroup',
        title: 'Boete-informatie',
        fields: [
          { id: 'irrevocable_fines', label: 'Onherroepelijke boetes', type: 'checkbox', defaultValue: false },
          { id: 'fines_court_ruled', label: 'Boetes voor overtredingen waarover een rechter heeft geoordeeld', type: 'checkbox', defaultValue: false },
          { id: 'fines_no_ruling', label: 'Boetes voor overtredingen waarover de rechter nog geen uitspraak heeft gedaan. In dit laatste geval alleen vermelden dat een dergelijke boete bestaat. Geen verdere inhoudelijke informatie verstrekken, inclusief het bedrag.', type: 'checkbox', defaultValue: false },
        ],
      },
      {
        id: 'bibob_relation',
        type: 'paragraph',
        content: 'Het Bibob-onderzoek heeft relatie met (aankruisen/invullen indien van toepassing):',
      },
      {
        id: 'license_table',
        type: 'table',
        title: 'Vergunningstypen',
        rows: [
          { id: 'alcohol_act', label: 'Alcoholwet' },
          { id: 'wabo_building', label: 'Wabo omgevingsvergunning bouwen' },
          { id: 'wabo_environmental', label: 'Wabo omgevingsvergunning milieu' },
          { id: 'wabo_usage', label: 'Wabo omgevingsvergunning gebruik' },
          { id: 'operating_establishment', label: 'Exploitatievergunning/openbare inrichting' },
          { id: 'sex_establishment', label: 'Vergunning seksinrichting' },
          { id: 'license_other', label: 'Overige vergunning' },
        ],
      },
      {
        id: 'additional_info',
        type: 'fields',
        title: 'Aanvullende Informatie',
        fields: [
          { id: 'additional_remarks', label: 'Aanvullende opmerkingen', type: 'textarea', placeholder: 'Voer eventuele aanvullende opmerkingen in...' },
        ],
      },
    ],
  },
};

export function getLetterTemplate(templateId: string): LetterTemplate | undefined {
  return LETTER_TEMPLATE_CONTENT[templateId];
}
