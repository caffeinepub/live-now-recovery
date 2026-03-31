import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type FormState = {
  name: string;
  organization: string;
  message: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const { actor } = useActor();
  const [form, setForm] = useState<FormState>({
    name: "",
    organization: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) {
      setErrorMsg("Not connected to backend. Please try again.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      await (actor as any).submitContactMessage(
        form.name.trim(),
        form.organization.trim(),
        form.message.trim(),
      );
      setStatus("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
      setStatus("error");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-teal-light text-sm font-bold tracking-widest uppercase mb-4">
              Contact
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
              Partner with{" "}
              <span className="text-teal-light">Live Now Recovery</span>.
            </h1>
            <p className="text-on-dark text-lg leading-relaxed">
              For vetted partner organizations — Ohio recovery networks, clinic
              operators, and MHAR affiliates — ready to expand access to
              real-time MAT availability.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
                data-ocid="contact.success_state"
              >
                <div className="bg-teal/10 rounded-full p-5 w-fit mx-auto mb-6">
                  <CheckCircle2
                    className="h-12 w-12 text-teal"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="text-2xl font-extrabold mb-3">
                  Message Received
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Thank you for reaching out. We review all partner inquiries
                  and will be in touch through official channels.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  data-ocid="contact.modal"
                >
                  <div className="space-y-2">
                    <Label htmlFor="contact-name" className="font-semibold">
                      Name
                    </Label>
                    <Input
                      id="contact-name"
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                      minLength={2}
                      className="min-h-[44px]"
                      data-ocid="contact.input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-org" className="font-semibold">
                      Organization
                    </Label>
                    <Input
                      id="contact-org"
                      type="text"
                      placeholder="Clinic, network, or agency name"
                      value={form.organization}
                      onChange={(e) =>
                        handleChange("organization", e.target.value)
                      }
                      required
                      minLength={2}
                      className="min-h-[44px]"
                      data-ocid="contact.input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message" className="font-semibold">
                      Message
                    </Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Describe your organization and how you'd like to partner..."
                      value={form.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      required
                      minLength={20}
                      rows={6}
                      className="resize-none"
                      data-ocid="contact.textarea"
                    />
                  </div>

                  {status === "error" && (
                    <p
                      className="text-destructive text-sm font-medium"
                      data-ocid="contact.error_state"
                    >
                      {errorMsg}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] bg-teal hover:bg-teal-button text-white border-0 font-bold text-base"
                    data-ocid="contact.submit_button"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          className="mr-2 h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>

                {/* Disclaimer */}
                <div className="mt-8 border border-border rounded-xl p-5 bg-muted/30">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This form is for vetted partner organizations (Ohio recovery
                    networks, clinic operators, MHAR affiliates). This is{" "}
                    <strong className="text-foreground">
                      not a crisis line
                    </strong>{" "}
                    — if you need help now, call{" "}
                    <a
                      href="tel:8332346343"
                      className="text-emergency font-bold hover:underline"
                    >
                      <Phone
                        className="inline h-3.5 w-3.5 mr-0.5"
                        aria-hidden="true"
                      />
                      833-234-6343
                    </a>
                    .
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
