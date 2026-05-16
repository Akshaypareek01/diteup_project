import { ContactMailForm } from "@/components/contact/ContactMailForm";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[680px] px-5 py-12">
      <h1 className="font-display text-display-lg font-semibold text-forest">Contact</h1>
      <p className="mt-2 text-body text-ink-soft">FSSAI / support — same details as the site footer.</p>
      <ContactMailForm />
    </div>
  );
}
