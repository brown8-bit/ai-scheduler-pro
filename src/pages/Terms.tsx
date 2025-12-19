import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Schedulr AI</title>
        <meta name="description" content="Terms of Service for Schedulr AI." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Back Link */}
        <div className="p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-3xl mx-auto py-12 px-6 pb-20">
          <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-10">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-8 text-muted-foreground leading-7">

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">1. Agreement to Terms</h2>
              <p>
                By accessing or using Schedulr AI ("the Service"), you agree
                to be bound by these Terms of Service. If you do not agree, you must
                not use the Service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">2. Description of Service</h2>
              <p>
                Schedulr AI provides an AI-powered scheduling assistant that
                helps users plan events, meetings, tasks, and reminders using AI
                chat-based interactions. The Service may evolve over time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">3. Accounts & Security</h2>
              <p>
                You must create an account to use the Service. You are responsible
                for maintaining the confidentiality of your account credentials and
                for all activity that occurs under your account.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">4. Subscription & Billing</h2>
              <p>
                The Service operates on a subscription basis billed monthly at
                <strong className="text-foreground"> $29 per month</strong>. Payments are processed securely via
                Stripe. You authorize us to automatically charge your payment method
                until you cancel your subscription.
              </p>
              <p className="mt-2">
                You may cancel at any time. No refunds will be issued for partial
                billing periods.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">5. Acceptable Use</h2>
              <p>
                You agree not to misuse the Service, including attempting to extract,
                replicate, or circumvent any AI functionality, or using the Service
                for unlawful or harmful purposes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">6. Intellectual Property</h2>
              <p>
                All content, features, branding, and functionality of the Service are
                owned by Schedulr AI. You may not copy, modify, reverse
                engineer, or redistribute any part of the Service without permission.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">7. AI-Generated Content</h2>
              <p>
                The Service uses AI to generate suggestions and scheduling content.
                You acknowledge that AI-generated output may contain errors and you
                agree to verify time-sensitive or important information independently.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">8. Termination</h2>
              <p>
                We may suspend or terminate accounts that violate these Terms or
                misuse the Service. You may terminate your subscription at any time
                through your dashboard.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">9. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Schedulr AI is not
                liable for any damages arising from use of the Service, including
                scheduling errors, missed events, data loss, or service interruption.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">10. Changes to Terms</h2>
              <p>
                We may update these Terms occasionally. Continued use of the Service
                means you accept the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">11. Contact</h2>
              <p>
                For questions regarding these Terms, please contact:
                <br />
                <span className="font-medium text-foreground">Support@schedulr.com</span>
              </p>
            </div>

          </section>
        </div>
      </div>
    </>
  );
};

export default Terms;
