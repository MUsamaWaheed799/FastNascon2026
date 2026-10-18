'use client';

import React, { useState, useEffect } from 'react';
import { CustomFieldDefinition, Opportunity, OpportunityStage } from '@/types';
import { api, formatApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { 
  X, 
  Sparkles, 
  DollarSign, 
  Building2, 
  User, 
  Calendar, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpportunityCreated?: (opp: Opportunity) => void;
}

export function OpportunityModal({
  isOpen,
  onClose,
  onOpportunityCreated,
}: OpportunityModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);

  // Standard Form Fields
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [stage, setStage] = useState<OpportunityStage>('lead');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');

  // Dynamic custom_data state keyed by CustomField.key
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch active custom fields for 'opportunity' from backend
  useEffect(() => {
    if (!isOpen) return;

    const fetchFields = async () => {
      try {
        const res = await api.get('/custom-fields/?entity_type=opportunity');
        const data = res.data?.results || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setCustomFields(data);
        } else {
          // Fallback fields
          setCustomFields([
            {
              id: 'cf-tier',
              name: 'Customer Tier',
              key: 'tier',
              entity_type: 'opportunity',
              data_type: 'dropdown',
              options: ['Starter', 'Growth', 'Enterprise'],
              is_required: true,
              position: 1,
            },
            {
              id: 'cf-source',
              name: 'Lead Source',
              key: 'lead_source',
              entity_type: 'opportunity',
              data_type: 'dropdown',
              options: ['Twilio WhatsApp Inbound', 'Stripe Checkout', 'Outbound Sales'],
              is_required: false,
              position: 2,
            },
          ]);
        }
      } catch {
        // Fallback default definitions
        setCustomFields([
          {
            id: 'cf-tier',
            name: 'Customer Tier',
            key: 'tier',
            entity_type: 'opportunity',
            data_type: 'dropdown',
            options: ['Starter', 'Growth', 'Enterprise'],
            is_required: true,
            position: 1,
          },
        ]);
      }
    };

    fetchFields();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCustomFieldChange = (key: string, val: any) => {
    setCustomData((prev) => ({ ...prev, [key]: val }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Deal title is required.';
    if (!contactName.trim()) errors.contactName = 'Contact name is required.';
    if (!value || isNaN(Number(value))) errors.value = 'Valid value is required.';

    // Validate dynamic custom fields
    for (const def of customFields) {
      if (def.is_required) {
        const val = customData[def.key];
        if (val === undefined || val === null || val === '') {
          errors[def.key] = `${def.name} is required by workspace rules.`;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Validation Error', 'Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();

    const newOpportunity: Opportunity = {
      id: `opp-${Date.now()}`,
      name: name.trim(),
      contact: `cont-${Date.now()}`,
      contact_name: contactName.trim(),
      company: `comp-${Date.now()}`,
      company_name: companyName.trim() || 'Direct Client',
      stage,
      value: value.trim(),
      currency,
      expected_close_date: expectedCloseDate || null,
      custom_data: customData,
      created_at: nowIso,
      updated_at: nowIso,
      assigned_at: nowIso, // Timer starts now for new leads!
      acknowledged_at: stage !== 'lead' ? nowIso : null,
      owner: user?.id || 1,
      owner_name: user?.username || 'Owner',
      in_recovery_queue: false,
      escalation_count: 0,
      payment_status: 'unpaid',
    };

    try {
      // POST to backend if available
      await api.post('/opportunities/', newOpportunity);
      toast.success('Opportunity Created', `"${name}" added to pipeline with live countdown.`);
    } catch {
      toast.info('Opportunity Created (Local)', `"${name}" added to pipeline with live countdown.`);
    } finally {
      setIsSubmitting(false);
      if (onOpportunityCreated) {
        onOpportunityCreated(newOpportunity);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Create Opportunity</h3>
              <p className="text-[11px] text-slate-500">
                Dynamically populated with active workspace custom fields
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Core Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deal Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 50-Seat Enterprise WhatsApp Suite"
              className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-hidden focus:ring-2 ${
                formErrors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
            {formErrors.name && (
              <span className="text-[10px] text-rose-500 mt-0.5 block">{formErrors.name}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className={`w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-hidden focus:ring-2 ${
                    formErrors.contactName ? 'border-rose-400' : 'border-slate-200 focus:border-brand-500'
                  }`}
                />
              </div>
              {formErrors.contactName && (
                <span className="text-[10px] text-rose-500 mt-0.5 block">{formErrors.contactName}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deal Value *
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="25000"
                  className={`w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-hidden focus:ring-2 ${
                    formErrors.value ? 'border-rose-400' : 'border-slate-200 focus:border-brand-500'
                  }`}
                />
              </div>
              {formErrors.value && (
                <span className="text-[10px] text-rose-500 mt-0.5 block">{formErrors.value}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-500"
              >
                <option value="USD">USD ($)</option>
                <option value="PKR">PKR (Rs)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as OpportunityStage)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-500 font-medium"
              >
                <option value="lead">New / Inbound Lead (15m Timer)</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Closed Won</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-500"
              />
            </div>
          </div>

          {/* DYNAMIC WORKSPACE CUSTOM FIELDS SECTION */}
          {customFields.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Workspace Custom Fields
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Dynamic Schema</span>
              </div>

              <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
                {customFields.map((field) => {
                  const hasError = !!formErrors[field.key];

                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {field.name} {field.is_required && <span className="text-rose-500">*</span>}
                      </label>

                      {/* Dropdown Type */}
                      {field.data_type === 'dropdown' && (
                        <select
                          value={customData[field.key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-hidden ${
                            hasError ? 'border-rose-400' : 'border-slate-200 focus:border-brand-500'
                          }`}
                        >
                          <option value="">-- Select {field.name} --</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Text Type */}
                      {field.data_type === 'text' && (
                        <input
                          type="text"
                          value={customData[field.key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.name}`}
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-hidden ${
                            hasError ? 'border-rose-400' : 'border-slate-200 focus:border-brand-500'
                          }`}
                        />
                      )}

                      {/* Number Type */}
                      {field.data_type === 'number' && (
                        <input
                          type="number"
                          value={customData[field.key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.key, Number(e.target.value))}
                          placeholder={`Enter ${field.name}`}
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-hidden ${
                            hasError ? 'border-rose-400' : 'border-slate-200 focus:border-brand-500'
                          }`}
                        />
                      )}

                      {/* Date Type */}
                      {field.data_type === 'date' && (
                        <input
                          type="date"
                          value={customData[field.key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-hidden ${
                            hasError ? 'border-rose-400' : 'border-slate-200 focus:border-brand-500'
                          }`}
                        />
                      )}

                      {/* Checkbox Type */}
                      {field.data_type === 'checkbox' && (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            id={`cb-${field.key}`}
                            checked={!!customData[field.key]}
                            onChange={(e) => handleCustomFieldChange(field.key, e.target.checked)}
                            className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                          />
                          <label htmlFor={`cb-${field.key}`} className="text-xs text-slate-600">
                            Enable / Confirm {field.name}
                          </label>
                        </div>
                      )}

                      {hasError && (
                        <span className="text-[10px] text-rose-500 mt-0.5 block">
                          {formErrors[field.key]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white text-xs font-bold shadow-md hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Create Opportunity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
