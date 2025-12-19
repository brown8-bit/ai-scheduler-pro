import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Schedulr AI</title>
        <meta name="description" content="Privacy Policy for Schedulr AI - Learn how we collect, use, and protect your data." />
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
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-10">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-8 text-muted-foreground leading-7">

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">1. Introduction</h2>
              <p>
                Schedulr AI ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                information when you use our AI-powered scheduling service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">2. Information We Collect</h2>
              <p className="mb-3">We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Account Information:</strong> Email address, password, and profile details when you create an account.</li>
                <li><strong className="text-foreground">Scheduling Data:</strong> Events, meetings, reminders, and other scheduling information you create through our service.</li>
                <li><strong className="text-foreground">Communication Data:</strong> Messages and interactions with our AI assistant to provide scheduling services.</li>
                <li><strong className="text-foreground">Payment Information:</strong> Billing details processed securely through Stripe. We do not store your full credit card information.</li>
                <li><strong className="text-foreground">Usage Data:</strong> Information about how you interact with our service, including features used and time spent.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">3. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our AI scheduling services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Train and improve our AI models to provide better scheduling assistance</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">4. AI and Data Processing</h2>
              <p>
                Our AI assistant processes your scheduling requests to provide personalized 
                recommendations and automate calendar management. Your conversations with the 
                AI may be used to improve our service, but we anonymize and aggregate this data 
                to protect your privacy. You can request deletion of your conversation history 
                at any time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">5. Information Sharing</h2>
              <p className="mb-3">We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Service Providers:</strong> With third-party vendors who perform services on our behalf (e.g., payment processing, hosting).</li>
                <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
                <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                <li><strong className="text-foreground">With Your Consent:</strong> When you explicitly authorize us to share information.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">6. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including 
                encryption in transit and at rest, secure authentication, and regular security 
                audits. However, no method of transmission over the Internet is 100% secure, 
                and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">7. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to maintain your session, remember your 
                preferences, and analyze how our service is used. You can control cookies through 
                your browser settings, but disabling them may affect functionality.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">8. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as 
                needed to provide you services. You may request deletion of your account and 
                associated data at any time by contacting us. Some information may be retained 
                as required by law or for legitimate business purposes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">9. Your Rights</h2>
              <p className="mb-3">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to or restrict certain processing activities</li>
                <li>Data portability (receive your data in a structured format)</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at the email below.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">10. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 13 years of age. We do not 
                knowingly collect personal information from children under 13. If we learn 
                we have collected such information, we will delete it promptly.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than 
                your own. We ensure appropriate safeguards are in place to protect your 
                information in accordance with this Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of 
                any material changes by posting the new policy on this page and updating the 
                "Last updated" date. Your continued use of the service after changes constitutes 
                acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2 text-foreground">13. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us at:
              </p>
              <div className="mt-3 p-4 bg-secondary rounded-lg">
                <p className="font-medium text-foreground">Schedulr AI</p>
                <p>Email: <span className="text-foreground">Support@schedulrai.com</span></p>
              </div>
            </div>

          </section>
        </div>
      </div>
    </>
  );
};

export default Privacy;
