'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { emptyVendorApplication, firstVendorStep, handoffChoices, maxVendorProfileBytes, parseVendorProfile, prepareVendorDraft, prepareVendorPacket, vendorAvailability, vendorContexts, vendorDraftKey, vendorErrors, vendorKinds, vendorServices, type VendorApplication, type VendorErrors, type VendorStep } from '@/lib/vendor-application';
import { downloadLocal } from '@/lib/local-download';

const steps = ['Your business', 'Your services', 'How you work', 'Review and next steps'];
export function VendorOnboarding() {
  const [profile, setProfile] = useState<VendorApplication>({ ...emptyVendorApplication, services: [] });
  const [step, setStep] = useState<VendorStep>(1);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<VendorErrors>({});
  const [message, setMessage] = useState('');
  const [hasSaved, setHasSaved] = useState(false), [opening, setOpening] = useState(false);
  const [previousProfile, setPreviousProfile] = useState<VendorApplication | null>(null);
  const revision = useRef(0), active = useRef(false), restoreRequest = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    active.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Enable local-only submission after hydration; native POST must never receive this private draft.
    setReady(true);
    try { setHasSaved(localStorage.getItem(vendorDraftKey) !== null); } catch { /* Explicit device saving remains optional. */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- This is a request-generation counter, not a DOM ref; invalidate the current generation on unmount.
    return () => { active.current = false; restoreRequest.current++; };
  }, []);
  function update<K extends keyof VendorApplication>(key: K, value: VendorApplication[K]) {
    revision.current++; setPreviousProfile(null);
    setProfile(previous => ({ ...previous, [key]: value, ...(key !== 'confirmed' ? { confirmed: false } : {}) }));
    setErrors(previous => ({ ...previous, [key]: undefined })); setMessage('');
  }
  function move(next: VendorStep) { setStep(next); setErrors({}); setMessage(''); requestAnimationFrame(() => heading.current?.focus()); }
  function submit(event: FormEvent) {
    event.preventDefault(); const found = vendorErrors(profile, step); setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => errorSummary.current?.focus()); return;
    }
    if (step < 4) { move((step + 1) as VendorStep); return; }
    try {
      downloadLocal(new Blob([prepareVendorPacket(profile)], { type: 'application/json' }), 'virtual-ink-vendor-profile.json');
      setMessage('Download requested. Your profile has not been submitted and no vendor account has been created.');
    } catch { setMessage('The profile could not be downloaded. Please review your details and try again.'); }
  }
  function restore(restored: VendorApplication) {
    revision.current++; setPreviousProfile(profile); setProfile(restored);
    move(firstVendorStep(restored)); setMessage('Profile restored locally. Review confirmation must be checked again. Older profiles may need the new setup details. Undo restore returns to your previous details.');
  }
  function saveDraft() {
    try { localStorage.setItem(vendorDraftKey, prepareVendorDraft(profile)); setHasSaved(true); setMessage('Vendor draft saved in this browser. Save again after changes. It contains contact details; remove it when finished.'); }
    catch { setMessage('The draft could not be saved. Remove markup from your entries, or download a draft if device storage is unavailable.'); }
  }
  function loadDraft() {
    try {
      const saved = localStorage.getItem(vendorDraftKey);
      if (!saved) { setHasSaved(false); setMessage('There is no saved vendor draft on this device.'); return; }
      restore(parseVendorProfile(saved));
    } catch { setMessage('The saved vendor draft could not be restored. Your current details are unchanged.'); }
  }
  function forgetDraft() {
    try { localStorage.removeItem(vendorDraftKey); setHasSaved(false); setMessage('Saved vendor draft removed. Your current details remain in this tab.'); }
    catch { setMessage('The saved draft could not be removed in this browser.'); }
  }
  function downloadDraft() {
    try { downloadLocal(new Blob([prepareVendorDraft(profile)], { type: 'application/json' }), 'virtual-ink-vendor-draft.json'); setMessage('Draft download requested. Open this file here to resume, including incomplete details. Keep it private.'); }
    catch { setMessage('The draft could not be downloaded. Use the supported fields without markup or control characters.'); }
  }
  async function openProfile(file: File | undefined) {
    if (!file) return;
    const request = ++restoreRequest.current, before = revision.current;
    setOpening(true);
    try {
      if (!file.size || file.size > maxVendorProfileBytes) throw new Error();
      const restored = parseVendorProfile(await file.text());
      if (!active.current || request !== restoreRequest.current) return;
      if (before !== revision.current) { setMessage('Details changed while the file was opening. Open it again to restore.'); return; }
      restore(restored);
    } catch { if (active.current && request === restoreRequest.current) setMessage('This file could not be opened. Choose an exported vendor draft or profile JSON file up to 8 KB. Your current details are unchanged.'); }
    finally { if (active.current && request === restoreRequest.current) setOpening(false); }
  }
  function field(key: 'businessName' | 'contactName' | 'email' | 'city' | 'turnaround' | 'workingHours' | 'notes', label: string, max: number, hint?: string) {
    const autocomplete = { businessName: 'organization', contactName: 'name', email: 'email', city: 'address-level2', turnaround: 'off', workingHours: 'off', notes: 'off' };
    return <div className="vendor-field"><label htmlFor={`vendor-${key}`}>{label}</label>
      <input id={`vendor-${key}`} name={key} value={profile[key]} onChange={event => update(key, event.target.value)} maxLength={max}
        type={key === 'email' ? 'email' : 'text'} inputMode={key === 'turnaround' ? 'numeric' : undefined} autoComplete={autocomplete[key]}
        autoCapitalize={key === 'email' ? 'none' : undefined} autoCorrect={key === 'email' ? 'off' : undefined} spellCheck={key === 'email' ? false : undefined} enterKeyHint={step === 4 ? 'done' : 'next'}
        required={key !== 'notes'} aria-invalid={!!errors[key]} aria-describedby={`vendor-${key}-help`} />
      <p id={`vendor-${key}-help`} className={errors[key] ? 'vendor-error' : 'vendor-hint'}>{errors[key] || hint || `Up to ${max} characters.`}</p></div>;
  }
  function choices(key: 'vendorKind' | 'context' | 'availability' | 'handoff', legend: string, options: readonly { id: string; label: string; hint?: string }[], hint: string) {
    return <fieldset className="vendor-options vendor-choice-cards" id={`vendor-${key}`} tabIndex={-1} aria-describedby={`vendor-${key}-help`} aria-invalid={!!errors[key]}><legend>{legend} (required)</legend>
      {options.map(option => <label key={option.id}><input name={key} type="radio" value={option.id} checked={profile[key] === option.id} onChange={() => update(key, option.id)} required/><span>{option.label}{option.hint && <small>{option.hint}</small>}</span></label>)}
      <p id={`vendor-${key}-help`} className={errors[key] ? 'vendor-error' : 'vendor-hint'}>{errors[key] || hint}</p></fieldset>;
  }
  const choiceLabel = (value: string, options: readonly { id: string; label: string }[]) => options.find(option => option.id === value)?.label ?? value;
  return <div className="vendor-layout"><div className="vendor-form-card">
    <ol className="vendor-steps" aria-label="Vendor setup steps">{steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <form method="post" action="/vendors/join" onSubmit={submit} noValidate><h2 ref={heading} tabIndex={-1}>{steps[step - 1]}</h2>
      <p className="vendor-hint">Step {step} of 4 · Required fields are labelled. Details stay in this tab until you choose to save or download.</p>
      {Object.values(errors).some(Boolean) && <div ref={errorSummary} tabIndex={-1} role="alert" className="vendor-error-summary"><p>Please correct the following before continuing.</p><ul>{Object.entries(errors).filter(([, value]) => value).map(([key, value]) => <li key={key}><a href={`#vendor-${key}`}>{value}</a></li>)}</ul></div>}
      {step === 1 && <>
        {choices('vendorKind', 'How do you operate?', vendorKinds, 'Individuals and established businesses can prepare a profile. This choice does not grant vendor access.')}
        {choices('context', 'Who do you serve?', vendorContexts, 'School-serving status is self-declared and does not imply school endorsement.')}
        <div className="vendor-fields">{field('businessName', 'Business or trading name (required)', 100, 'Use the name customers would recognise. Individuals can use a trading name.')}{field('contactName', 'Contact name (required)', 80)}
        {field('email', 'Contact email (required)', 254, 'Use an email you are authorised to share for business contact.')}{field('city', 'City or service area (required)', 80, 'Use a general area; leave out street and home addresses.')}</div></>}
      {step === 2 && <><p>Choose the work you can offer. Hotprints starts with document printing and design; choose the services that apply to your own business.</p><fieldset className="vendor-options vendor-choice-cards" id="vendor-services" tabIndex={-1} aria-describedby="vendor-services-help" aria-invalid={!!errors.services}><legend>Services offered (required)</legend>
        {vendorServices.map(service => <label key={service}><input name="services" value={service} type="checkbox" checked={profile.services.includes(service)} onChange={event => update('services', event.target.checked ? [...profile.services, service] : profile.services.filter(item => item !== service))} /><span>{service}</span></label>)}
        <p id="vendor-services-help" className={errors.services ? 'vendor-error' : 'vendor-hint'}>{errors.services || 'Choose at least one service. Equipment and capabilities still need review.'}</p></fieldset>
        <div className="vendor-setup-note"><h3>Your prices come next</h3><p>After vendor access is approved, set your printing and design prices in your workspace. Customers pay you directly. Review the actual commission agreement before accepting it; no agreement is accepted here.</p></div></>}
      {step === 3 && <>
        {choices('availability', 'Your availability', vendorAvailability, 'A planning preference. This does not publish a listing or enable orders.')}
        {field('workingHours', 'Working hours (required)', 120, 'For example: Monday–Friday, 08:00–17:00. Include your time zone if needed.')}
        {choices('handoff', 'Collection or delivery', handoffChoices.map(label => ({ id: label, label })), 'Declare only what you can arrange. Coverage and handoff details need review.')}
        {field('turnaround', 'Typical turnaround in working days (required)', 2, '1–90 days. A discussion estimate, not a customer promise.')}
        {field('notes', 'Equipment or service notes (optional)', 500, 'One line. Leave out passwords, IDs, bank details and private evidence.')}</>}
      {step === 4 && <><dl className="vendor-review">{[['Business', profile.businessName], ['Vendor type', choiceLabel(profile.vendorKind, vendorKinds)], ['Service setting', choiceLabel(profile.context, vendorContexts)], ['Contact', profile.contactName], ['Email', profile.email], ['Area', profile.city], ['Services', profile.services.join(', ')], ['Availability', choiceLabel(profile.availability, vendorAvailability)], ['Working hours', profile.workingHours], ['Handoff', profile.handoff], ['Typical turnaround', `${profile.turnaround} working days`], ['Notes', profile.notes || 'None provided']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <label className="vendor-confirm"><input id="vendor-confirmed" name="confirmed" type="checkbox" checked={profile.confirmed} onChange={event => update('confirmed', event.target.checked)} aria-invalid={!!errors.confirmed} aria-describedby="vendor-confirmed-help" />I confirm these details are self-declared and have not been verified by Virtual Ink.</label>
        <p id="vendor-confirmed-help" className={errors.confirmed ? 'vendor-error' : 'vendor-hint'}>{errors.confirmed || 'Downloading prepares a profile. It does not submit an application or approve a vendor account.'}</p>
        <div className="vendor-setup-note"><h3>After your profile review</h3><p>Operations must verify your identity and capabilities before granting vendor access. Approved owners can then complete account security, review their agreement and add service prices.</p><Link className="text-link" href="/vendor/setup">Open the vendor setup checklist</Link></div></>}
      <div className="vendor-actions">{step > 1 && <button className="button button-secondary" type="button" onClick={() => move((step - 1) as VendorStep)}>Back</button>}
        <button className="button button-primary" type="submit" disabled={!ready}>{step === 4 ? 'Download profile' : 'Continue'}</button></div>
      <noscript><p>This local setup needs JavaScript to keep your details in this tab. Enable JavaScript to prepare a profile; no form is submitted here.</p></noscript>
      <p role="status" className="vendor-status">{message}</p>
    </form><section className="vendor-draft-tools" aria-label="Vendor draft controls"><h3>Keep your progress</h3>
      <p className="vendor-hint">Drafts include contact details. Save only on a private device, or download a file to store privately. Nothing is saved automatically or sent to a server.</p>
      <div className="vendor-actions"><button type="button" className="button button-secondary" disabled={opening} onClick={saveDraft}>Save vendor draft on this device</button><button type="button" className="button button-secondary" disabled={opening} onClick={downloadDraft}>Download vendor draft</button></div>
      {hasSaved && <div className="vendor-actions"><button type="button" className="button button-secondary" disabled={opening} onClick={loadDraft}>Load saved vendor draft</button><button type="button" className="button button-secondary" disabled={opening} onClick={forgetDraft}>Remove saved vendor draft</button></div>}
      <div className="vendor-field"><label htmlFor="vendor-profile-file">Open a vendor profile or draft file</label><input id="vendor-profile-file" type="file" accept="application/json,.json" disabled={opening} aria-describedby="vendor-profile-file-help" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void openProfile(file); }} /><p id="vendor-profile-file-help" className="vendor-hint">Exported JSON · Up to 8 KB. Imports locally; verification and approval are never imported.</p></div>
      {previousProfile && <button type="button" className="button button-secondary vendor-undo-restore" onClick={() => { revision.current++; setProfile(previousProfile); setPreviousProfile(null); move(1); setMessage('Your previous profile details are restored.'); }}>Undo profile restore</button>}
      {opening && <p role="status" className="vendor-hint">Opening your profile…</p>}
    </section></div><aside className="vendor-next"><p className="eyebrow">YOUR SETUP JOURNEY</p><h2>Get your business ready.</h2>
      <ol><li>Prepare your business, services and working arrangements. Save a draft to continue later.</li><li>Review and download your profile. Keep it private.</li><li>Operations verifies identity and capabilities through an approved private channel.</li><li>With approved owner access, secure your account, review your agreement and add prices.</li></ol>
      <Link className="text-link" href="/vendor/setup">Already approved? Continue vendor setup</Link>
      <p>This preview prepares a profile locally. Online submission, verification and account activation are awaiting setup and approval.</p>
      <p>Share only business contact information you are authorised to use. Downloads contain your contact details; store and share them carefully.</p>
    </aside></div>;
}
