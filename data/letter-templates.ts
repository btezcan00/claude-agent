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
    name: 'LBB notification letter',
    sections: [
      {
        id: 'header',
        type: 'header',
        content: 'LBB Notification Letter',
      },
      {
        id: 'basic_info',
        type: 'fields',
        title: 'Basic Information',
        fields: [
          { id: 'date', label: 'Date', type: 'date', required: true },
          { id: 'reference_number', label: 'Reference number', type: 'text', placeholder: 'Enter reference number' },
          { id: 'municipal_province', label: 'Municipal/province', type: 'text', placeholder: 'Enter municipal or province', required: true },
        ],
      },
      {
        id: 'recipient_info',
        type: 'fields',
        title: 'Recipient Information',
        fields: [
          { id: 'recipient_name', label: 'Name of recipient', type: 'text', placeholder: 'Enter recipient name', required: true },
          { id: 'recipient_address', label: 'Address', type: 'text', placeholder: 'Enter address' },
          { id: 'recipient_postal_code', label: 'Postal code and city', type: 'text', placeholder: 'Enter postal code and city' },
        ],
      },
      {
        id: 'subject',
        type: 'fields',
        title: 'Subject',
        fields: [
          { id: 'subject', label: 'Subject', type: 'text', placeholder: 'Enter subject', required: true },
        ],
      },
      {
        id: 'intro_paragraph',
        type: 'paragraph',
        content: 'Dear Sir/Madam,\n\nWe hereby inform you of the following:',
      },
      {
        id: 'notification_content',
        type: 'fields',
        title: 'Notification Details',
        fields: [
          { id: 'notification_text', label: 'Notification content', type: 'textarea', placeholder: 'Enter the notification details...', required: true },
        ],
      },
      {
        id: 'closing',
        type: 'fields',
        title: 'Closing',
        fields: [
          { id: 'sender_name', label: 'Sender name', type: 'text', placeholder: 'Enter sender name' },
          { id: 'sender_title', label: 'Sender title/function', type: 'text', placeholder: 'Enter title or function' },
        ],
      },
    ],
  },
  bibob_7c_request: {
    id: 'bibob_7c_request',
    name: 'Form for requesting information from an administrative body to the Tax Authorities pursuant to Article 7c of the Bibob Act',
    sections: [
      {
        id: 'header',
        type: 'header',
        content: 'Form for requesting information from an administrative body to the Tax Authorities pursuant to Article 7c of the Bibob Act',
      },
      {
        id: 'basic_info',
        type: 'fields',
        title: 'Basic Information',
        fields: [
          { id: 'date', label: 'Date', type: 'date', required: true },
          { id: 'municipal_province', label: 'Municipal/province', type: 'text', placeholder: 'Enter municipal or province', required: true },
          { id: 'applicant_name', label: 'Name of applicant', type: 'text', placeholder: 'Enter applicant name', required: true },
          { id: 'applicant_phone', label: 'Applicant telephone number', type: 'text', placeholder: 'Enter telephone number' },
          { id: 'recipient_email', label: "Recipient's email address", type: 'text', placeholder: 'Enter email address' },
        ],
      },
      {
        id: 'legal_provisions_intro',
        type: 'paragraph',
        content: 'I would like to receive information about the following legal provisions:',
      },
      {
        id: 'legal_provisions',
        type: 'checkboxGroup',
        title: 'Legal Provisions',
        fields: [
          {
            id: 'article_10x',
            label: 'Article 10x, third paragraph, AWR concerns the intentional or gross negligent commitment by taxpayers or withholding agents of inaccuracies or omissions in the tax return. Relevant taxation data and information of which they are or have become aware. Article 67cc',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            id: 'awr_incorrect',
            label: 'AWR concerns the intentional provision of incorrect or incomplete information to a Provisional assessment or revision. Article',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            id: 'general_tax_act',
            label: 'Article of the General Tax Act (AWR) concerns the intentional failure to file, incorrect filing, or incomplete filing of a tax return.',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            id: 'article_67e',
            label: 'Article 67e of the General Tax Act (AWR) concerns the situation regarding additional assessment tax, which is attributable to the intent or gross negligence of the taxpayer as a result of which the assessment has been set at too low an amount or otherwise too little tax has been levied.',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            id: 'article_67f',
            label: 'Article 67f AWR concerns the situation in which the taxpayer is guilty of intent or gross negligence in the event that tax that must be paid or remitted on a tax return is not paid or is paid partially, within the period specified in the tax law.',
            type: 'checkbox',
            defaultValue: false,
          },
        ],
      },
      {
        id: 'fine_info',
        type: 'paragraph',
        content: 'Please state the amount of the fine and the financial year for which the fine was imposed. And also indicate which fine it concerns:',
      },
      {
        id: 'fine_details',
        type: 'checkboxGroup',
        title: 'Fine Information',
        fields: [
          { id: 'irrevocable_fines', label: 'Irrevocable fines', type: 'checkbox', defaultValue: false },
          { id: 'fines_court_ruled', label: 'Fines for violations on which a court has ruled', type: 'checkbox', defaultValue: false },
          { id: 'fines_no_ruling', label: 'Fines for violations on which the court has not yet issued a ruling. In this last case, only state that such a fine exists of the fine. Do not provide any further substantive involved, including the amount.', type: 'checkbox', defaultValue: false },
        ],
      },
      {
        id: 'bibob_relation',
        type: 'paragraph',
        content: 'Het Bibob-onderzoek heeft relatie (check/fill in if applicable):',
      },
      {
        id: 'license_table',
        type: 'table',
        title: 'License Types',
        rows: [
          { id: 'alcohol_act', label: 'Alcohol Act' },
          { id: 'wabo_building', label: 'Wabo building permit' },
          { id: 'wabo_environmental', label: 'Wabo environmental permit' },
          { id: 'wabo_usage', label: 'Wabo usage permit' },
          { id: 'operating_establishment', label: 'Operating an establishment/publicity' },
          { id: 'sex_establishment', label: 'Sex establishment license' },
          { id: 'license_other', label: 'License Other' },
        ],
      },
      {
        id: 'additional_info',
        type: 'fields',
        title: 'Additional Information',
        fields: [
          { id: 'additional_remarks', label: 'Additional remarks', type: 'textarea', placeholder: 'Enter any additional remarks...' },
        ],
      },
    ],
  },
};

export function getLetterTemplate(templateId: string): LetterTemplate | undefined {
  return LETTER_TEMPLATE_CONTENT[templateId];
}
