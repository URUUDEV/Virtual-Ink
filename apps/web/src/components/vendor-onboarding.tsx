'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { emptyVendorApplication, handoffChoices, maxVendorProfileBytes, parseVendorProfile, prepareVendorDraft, prepareVendorPacket, vendorDraftKey, vendorErrors, vendorServices, type VendorApplication, type VendorErrors } from '@/lib/vendor-application';
import { downloadLocal } from '@/lib/local-download';

const steps = ['Business details', 'Services and operations', 'Review profile'];
export function VendorOnboarding() {
  const [profile, setProfile] = useState<VendorApplication>({ ...emptyVendorApplication, services: [] });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<VendorErrors>({});
  const [message, setMessage] = useState('');
  const [hasSaved, setHasSaved] = useState(false), [opening, setOpening] = useState(false);
  const [previousProfile, setPreviousProfile] = useState<VendorApplication | null>(null);
  const revision = useRef(0), active = useRef(false), restoreRequest = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    active.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Read browser-only storage after hydration, preserving identical server/client initial output.
    try { setHasSaved(localStorage.getItem(vendorDraftKey) !== null); } catch { /* Explicit device saving remains optional. */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- This is a request-generation counter, not a DOM ref; invalidate the current generation on unmount.
    return () => { active.current = false; restoreRequest.current++; };
  }, []);
  function update<K extends keyof VendorApplication>(key: K, value: VendorApplication[K]) {
    revision.current++; setPreviousProfile(null);
    setProfile(previous => ({ ...previous, [key]: value, ...(key !== 'confirmed' ? { confirmed: false } : {}) }));
    setErrors(previous => ({ ...previous, [key]: undefined })); setMessage('');
  }
  function move(next: 1 | 2 | 3) { setStep(next); setErrors({}); setMessage(''); requestAnimationFrame(() => heading.current?.focus()); }
  function submit(event: FormEvent) {
    event.preventDefault(); const found = vendorErrors(profile, step); setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.getElementById(`vendor-${Object.keys(found)[0]}`)?.focus()); return;
    }
    if (step < 3) { move((step + 1) as 2 | 3); return; }
    try {
      downloadLocal(new Blob([prepareVendorPacket(profile)], { type: 'application/json' }), 'virtual-ink-vendor-profile.json');
      setMessage('Download requested. Your profile has not been submitted and no vendor account has been created.');
    } catch { setMessage('The profile could not be downloaded. Please review your details and try again.'); }
  }
  function restore(restored: VendorApplication) {
    revision.current++; setPreviousProfile(profile); setProfile(restored);
    const next = Object.keys(vendorErrors(restored, 1)).length ? 1 : Object.keys(vendorErrors(restored, 2)).length ? 2 : 3;
    move(next); setMessage('Profile restored locally. Review confirmation must be checked again. Undo restore returns to your previous details.');
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
  function field(key: 'businessName' | 'contactName' | 'email' | 'city' | 'turnaround' | 'notes', label: string, max: number, hint?: string) {
    return <div className="vendor-field"><label htmlFor={`vendor-${key}`}>{label}</label>
      <input id={`vendor-${key}`} value={profile[key]} onChange={event => update(key, event.target.value)} maxLength={max}
        type={key === 'email' ? 'email' : 'text'} inputMode={key === 'turnaround' ? 'numeric' : undefined} autoComplete="off"
        required={key !== 'notes'} aria-invalid={!!errors[key]} aria-describedby={`vendor-${key}-help`} />
      <p id={`vendor-${key}-help`} className={errors[key] ? 'vendor-error' : 'vendor-hint'}>{errors[key] || hint || `Up to ${max} characters.`}</p></div>;
  }
  return <div className="vendor-layout"><div className="vendor-form-card">
    <ol className="vendor-steps" aria-label="Profile preparation steps">{steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <form onSubmit={submit} noValidate><h2 ref={heading} tabIndex={-1}> {steps[step - 1]}</h2>
      <p className="vendor-hint">Step {step} of 3 · Details stay in this tab until you choose to save or download. Resume using a device draft or a profile file.</p>
      {Object.values(errors).some(Boolean) && <p role="alert" className="vendor-error">Please correct the highlighted fields before continuing.</p>}
      {step === 1 && <div className="vendor-fields">{field('businessName', 'Business name', 100)}{field('contactName', 'Contact name', 80)}
        {field('email', 'Contact email', 254, 'Use an email you are authorised to share for business contact.')}{field('city', 'City or service area', 80, 'Use a general area; leave out street and home addresses.')}</div>}
      {step === 2 && <><fieldset className="vendor-options" id="vendor-services" tabIndex={-1} aria-describedby="vendor-services-help"><legend>Services offered</legend>
        {vendorServices.map(service => <label key={service}><input type="checkbox" checked={profile.services.includes(service)} onChange={event => update('services', event.target.checked ? [...profile.services, service] : profile.services.filter(item => item !== service))} />{service}</label>)}
        <p id="vendor-services-help" className={errors.services ? 'vendor-error' : 'vendor-hint'}>{errors.services || 'Choose every service you want to discuss. Capabilities still need verification.'}</p></fieldset>
        <div className="vendor-fields"><div className="vendor-field"><label htmlFor="vendor-handoff">Collection or delivery</label>
          <select id="vendor-handoff" value={profile.handoff} onChange={event => update('handoff', event.target.value)} required aria-invalid={!!errors.handoff} aria-describedby="vendor-handoff-help"><option value="">Choose an option</option>{handoffChoices.map(choice => <option key={choice}>{choice}</option>)}</select>
          <p id="vendor-handoff-help" className={errors.handoff ? 'vendor-error' : 'vendor-hint'}>{errors.handoff || 'Declared availability; coverage and arrangements need review.'}</p></div>
          {field('turnaround', 'Typical turnaround (working days)', 2, '1–90 days. A discussion estimate, not a customer promise.')}</div>
        {field('notes', 'Equipment or service notes (optional)', 500, 'One line. Leave out passwords, IDs, bank details and private evidence.')}</>}
      {step === 3 && <><dl className="vendor-review">{[['Business', profile.businessName], ['Contact', profile.contactName], ['Email', profile.email], ['Area', profile.city], ['Services', profile.services.join(', ')], ['Handoff', profile.handoff], ['Typical turnaround', `${profile.turnaround} working days`], ['Notes', profile.notes || 'None provided']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <label className="vendor-confirm"><input id="vendor-confirmed" type="checkbox" checked={profile.confirmed} onChange={event => update('confirmed', event.target.checked)} aria-invalid={!!errors.confirmed} aria-describedby="vendor-confirmed-help" />I confirm these details are self-declared and have not been verified by Virtual Ink.</label>
        <p id="vendor-confirmed-help" className={errors.confirmed ? 'vendor-error' : 'vendor-hint'}>{errors.confirmed || 'Downloading prepares a profile. It does not submit an application or approve a vendor account.'}</p></>}
      <div className="vendor-actions">{step > 1 && <button className="button button-secondary" type="button" onClick={() => move((step - 1) as 1 | 2)}>Back</button>}
        <button className="button button-primary" type="submit">{step === 3 ? 'Download profile' : 'Continue'}</button></div>
      <p role="status" className="vendor-status">{message}</p>
    </form><section className="vendor-draft-tools" aria-label="Vendor draft controls"><h3>Keep your progress</h3>
      <p className="vendor-hint">Drafts include contact details. Save only on a private device, or download a file to store privately. Nothing is saved automatically or sent to a server.</p>
      <div className="vendor-actions"><button type="button" className="button button-secondary" disabled={opening} onClick={saveDraft}>Save vendor draft on this device</button><button type="button" className="button button-secondary" disabled={opening} onClick={downloadDraft}>Download vendor draft</button></div>
      {hasSaved && <div className="vendor-actions"><button type="button" className="button button-secondary" disabled={opening} onClick={loadDraft}>Load saved vendor draft</button><button type="button" className="button button-secondary" disabled={opening} onClick={forgetDraft}>Remove saved vendor draft</button></div>}
      <div className="vendor-field"><label htmlFor="vendor-profile-file">Open a vendor profile or draft file</label><input id="vendor-profile-file" type="file" accept="application/json,.json" disabled={opening} aria-describedby="vendor-profile-file-help" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void openProfile(file); }} /><p id="vendor-profile-file-help" className="vendor-hint">Exported JSON · Up to 8 KB. Imports locally; verification and approval are never imported.</p></div>
      {previousProfile && <button type="button" className="button button-secondary vendor-undo-restore" onClick={() => { revision.current++; setProfile(previousProfile); setPreviousProfile(null); move(1); setMessage('Your previous profile details are restored.'); }}>Undo profile restore</button>}
      {opening && <p role="status" className="vendor-hint">Opening your profile…</p>}
    </section></div><aside className="vendor-next"><p className="eyebrow">WHAT HAPPENS NEXT</p><h2>A profile starts the conversation.</h2>
      <ol><li>Prepare your business details and declared services. Save a draft to continue later.</li><li>Review and download your profile. Keep it private.</li><li>Operations reviews capabilities and agreements through an approved private channel.</li><li>An approved, verified identity can then receive vendor access.</li></ol>
      <p>This preview prepares a profile locally. Online submission, verification and account activation are awaiting setup and approval.</p>
      <p>Share only business contact information you are authorised to use. Downloads contain your contact details; store and share them carefully.</p>
    </aside></div>;
}
