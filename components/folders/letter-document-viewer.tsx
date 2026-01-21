'use client';

import { useState, useCallback } from 'react';
import { LetterItem } from '@/types/folder';
import { getLetterTemplate, LetterTemplateField, LetterTemplateSection } from '@/data/letter-templates';
import { X, Save, Download, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface LetterDocumentViewerProps {
  letter: LetterItem;
  open: boolean;
  onClose: () => void;
  onSave: (fieldData: Record<string, string | boolean>) => void;
}

type DisplayMode = 'example' | 'editor';

export function LetterDocumentViewer({
  letter,
  open,
  onClose,
  onSave,
}: LetterDocumentViewerProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('example');
  const [zoom, setZoom] = useState(72);
  const [fieldData, setFieldData] = useState<Record<string, string | boolean>>(
    letter.fieldData || {}
  );

  const template = getLetterTemplate(letter.template);

  const handleFieldChange = useCallback((fieldId: string, value: string | boolean) => {
    setFieldData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSave = () => {
    onSave(fieldData);
    onClose();
  };

  const handleDownload = () => {
    // Create a simple text representation of the document
    const content = generateDocumentText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letter.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDocumentText = (): string => {
    if (!template) return '';

    let text = '';
    for (const section of template.sections) {
      if (section.type === 'header') {
        text += `${section.content}\n${'='.repeat(50)}\n\n`;
      } else if (section.type === 'paragraph') {
        text += `${section.content}\n\n`;
      } else if (section.type === 'fields' && section.fields) {
        if (section.title) text += `${section.title}\n${'-'.repeat(30)}\n`;
        for (const field of section.fields) {
          const value = fieldData[field.id] || '';
          text += `${field.label}: ${value}\n`;
        }
        text += '\n';
      } else if (section.type === 'checkboxGroup' && section.fields) {
        if (section.title) text += `${section.title}\n${'-'.repeat(30)}\n`;
        for (const field of section.fields) {
          const checked = fieldData[field.id] === true ? '[X]' : '[ ]';
          text += `${checked} ${field.label}\n`;
        }
        text += '\n';
      } else if (section.type === 'table' && section.rows) {
        if (section.title) text += `${section.title}\n${'-'.repeat(30)}\n`;
        for (const row of section.rows) {
          const value = fieldData[row.id] || '';
          text += `${row.label}: ${value}\n`;
        }
        text += '\n';
      }
    }
    return text;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-semibold">{letter.name}</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Sidebar */}
        <div className="w-72 border-r p-4 overflow-y-auto">
          {/* Display Mode Toggle */}
          <div className="mb-6">
            <Label className="text-sm text-muted-foreground mb-2 block">Display</Label>
            <div className="flex rounded-lg border p-1">
              <button
                className={cn(
                  'flex-1 px-4 py-2 text-sm rounded-md transition-colors',
                  displayMode === 'example'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => setDisplayMode('example')}
              >
                Example
              </button>
              <button
                className={cn(
                  'flex-1 px-4 py-2 text-sm rounded-md transition-colors',
                  displayMode === 'editor'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => setDisplayMode('editor')}
              >
                Editor
              </button>
            </div>
          </div>

          {/* Input Fields */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">Input fields</Label>
            <div className="space-y-4">
              {template?.sections.map((section) => (
                <SidebarSection
                  key={section.id}
                  section={section}
                  fieldData={fieldData}
                  onFieldChange={handleFieldChange}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Document Area */}
        <div className="flex-1 flex flex-col bg-muted/30">
          {/* Toolbar */}
          <div className="flex items-center gap-2 border-b bg-background px-4 py-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Save className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 border-l pl-2">
              <span className="text-sm min-w-[40px]">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.max(25, z - 10))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Document Preview */}
          <div className="flex-1 overflow-auto p-8 flex justify-center">
            <div
              className="bg-white shadow-lg border"
              style={{
                width: `${(210 * zoom) / 100}mm`,
                minHeight: `${(297 * zoom) / 100}mm`,
                padding: `${(20 * zoom) / 100}mm`,
                fontSize: `${(12 * zoom) / 100}pt`,
              }}
            >
              <DocumentPreview
                template={template}
                fieldData={fieldData}
                displayMode={displayMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-3 border-t bg-background px-6 py-4">
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

interface SidebarSectionProps {
  section: LetterTemplateSection;
  fieldData: Record<string, string | boolean>;
  onFieldChange: (fieldId: string, value: string | boolean) => void;
}

function SidebarSection({ section, fieldData, onFieldChange }: SidebarSectionProps) {
  if (section.type === 'header' || section.type === 'paragraph') {
    return null;
  }

  if ((section.type === 'fields' || section.type === 'checkboxGroup') && section.fields) {
    return (
      <div className="space-y-3">
        {section.title && (
          <h4 className="text-sm font-medium">{section.title}</h4>
        )}
        {section.fields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={fieldData[field.id]}
            onChange={(value) => onFieldChange(field.id, value)}
          />
        ))}
      </div>
    );
  }

  if (section.type === 'table' && section.rows) {
    return (
      <div className="space-y-3">
        {section.title && (
          <h4 className="text-sm font-medium">{section.title}</h4>
        )}
        {section.rows.map((row) => (
          <div key={row.id} className="space-y-1">
            <Label className="text-xs">{row.label}</Label>
            <Input
              value={(fieldData[row.id] as string) || ''}
              onChange={(e) => onFieldChange(row.id, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

interface FieldInputProps {
  field: LetterTemplateField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  if (field.type === 'checkbox') {
    return (
      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked === true)}
          className="mt-0.5"
        />
        <span className="text-xs leading-tight">{field.label}</span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <Label className="text-xs">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="text-sm"
        />
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <div className="space-y-1">
        <Label className="text-xs">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select value={(value as string) || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        type={field.type === 'date' ? 'date' : 'text'}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}

interface DocumentPreviewProps {
  template: ReturnType<typeof getLetterTemplate>;
  fieldData: Record<string, string | boolean>;
  displayMode: DisplayMode;
}

function DocumentPreview({ template, fieldData, displayMode }: DocumentPreviewProps) {
  if (!template) {
    return <div className="text-muted-foreground">Template not found</div>;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '{{date}}';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getValue = (fieldId: string, placeholder: string = '') => {
    const value = fieldData[fieldId];
    if (displayMode === 'example') {
      return value || placeholder || `{{${fieldId}}}`;
    }
    return value || '';
  };

  return (
    <div className="space-y-4 text-[0.9em] leading-relaxed text-gray-800">
      {template.sections.map((section) => {
        if (section.type === 'header') {
          return (
            <div key={section.id} className="text-primary font-medium text-sm mb-4">
              {section.content}
            </div>
          );
        }

        if (section.type === 'paragraph') {
          return (
            <p key={section.id} className="whitespace-pre-line text-sm">
              {section.content}
            </p>
          );
        }

        if (section.type === 'fields' && section.fields) {
          return (
            <div key={section.id} className="space-y-1">
              {section.fields.map((field) => (
                <div key={field.id} className="text-sm">
                  <span className="text-muted-foreground">{field.label}: </span>
                  <span className={cn(
                    !fieldData[field.id] && displayMode === 'example' && 'text-primary underline'
                  )}>
                    {field.type === 'date'
                      ? formatDate(fieldData[field.id] as string)
                      : getValue(field.id, field.placeholder)}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        if (section.type === 'checkboxGroup' && section.fields) {
          return (
            <div key={section.id} className="space-y-2">
              <ul className="list-disc list-inside space-y-2 text-sm">
                {section.fields.map((field) => (
                  <li key={field.id} className="leading-tight">
                    <span className={cn(
                      'inline',
                      fieldData[field.id] === true && 'font-medium'
                    )}>
                      {fieldData[field.id] === true && (
                        <span className="text-primary font-bold mr-1">met</span>
                      )}
                      {fieldData[field.id] === false && (
                        <span className="text-muted-foreground mr-1">niet met</span>
                      )}
                      {field.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (section.type === 'table' && section.rows) {
          return (
            <div key={section.id} className="mt-4">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.id} className="border">
                      <td className="border px-2 py-1 bg-muted/50 w-1/2">{row.label}</td>
                      <td className="border px-2 py-1">
                        {getValue(row.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
