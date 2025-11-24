import React, { useState } from 'react';
import { Shield, FileText, Mail, ExternalLink } from 'lucide-react';
import { LegalDocumentModal } from './LegalDocumentModal';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../data/legalDocuments';

export const Footer: React.FC = () => {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <LegalDocumentModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        document={PRIVACY_POLICY}
      />

      <LegalDocumentModal
        isOpen={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
        document={TERMS_OF_SERVICE}
      />

      <footer className="bg-gray-900 border-t border-gray-800 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Company Info */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                RocketHub
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                AI-powered intelligence platform for entrepreneurs
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4" />
                <a
                  href="mailto:support@rockethub.ai"
                  className="hover:text-blue-400 transition-colors"
                >
                  support@rockethub.ai
                </a>
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <Shield className="w-4 h-4 group-hover:text-blue-400" />
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowTermsOfService(true)}
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <FileText className="w-4 h-4 group-hover:text-blue-400" />
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-3">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://rockethub.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    Website
                    <ExternalLink className="w-3 h-3 group-hover:text-blue-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://rockethub.ai/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    About Us
                    <ExternalLink className="w-3 h-3 group-hover:text-blue-400" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © {currentYear} RocketHub. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">
                  Built with AI for Entrepreneurs
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
