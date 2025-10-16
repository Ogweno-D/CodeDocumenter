import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import "./index.css";

// --- Helper Components ---

// A simple loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
  </div>
);

// Icon for the copy button
const CopyIcon: React.FC<{ copied: boolean }> = ({ copied }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {copied ? (
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    ) : (
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    )}
    {copied ? (
      <polyline points="22 4 12 14.01 9 11.01" />
    ) : (
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    )}
  </svg>
);


// --- Main App Component ---
export default function App() {
  // --- State Management ---
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [documentedCode, setDocumentedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);


  // List of supported languages for the dropdown
  const supportedLanguages = [
    'javascript', 'python', 'typescript', 'java', 'csharp', 'go', 'ruby', 'php', 'rust'
  ];

  // --- Event Handlers ---

  /**
   * Handles the form submission to the backend API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter some code to document.');
      return;
    }

    // Reset state before the API call
    setIsLoading(true);
    setError('');
    setDocumentedCode('');
    setCopied(false);

    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong on the server.');
      }

      const data = await response.json();
      setDocumentedCode(data.documentedCode);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copies the documented code to the user's clipboard.
   */
  const handleCopy = () => {
    if (!documentedCode) return;
    navigator.clipboard.writeText(documentedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    });
  };

  // --- Render Logic ---
  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            AI Code Documenter
          </h1>
          <p className="text-gray-400">
            Paste your code snippet, choose the language, and let Gemini write the docs for you.
          </p>
        </header>

        {/* Form for code input */}
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-3">
              <label htmlFor="code-input" className="block text-sm font-medium text-gray-400 mb-2">Code Snippet</label>
              <textarea
                id="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`function greet(name) {\n  return \`Hello, \${name}!\`;\n}`}
                className="w-full h-48 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono text-sm"
                spellCheck="false"
              />
            </div>
            <div>
              <label htmlFor="language-select" className="block text-sm font-medium text-gray-400 mb-2">Language</label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang} value={lang} className="capitalize">{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
          >
            {isLoading ? 'Generating Docs...' : '✨ Generate Documentation'}
          </button>
        </form>

        {/* Output Section */}
        <div className="mt-8">
          {isLoading && <LoadingSpinner />}
          {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg border border-red-700">{error}</div>}
          {documentedCode && (
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 bg-gray-700/50">
                <h2 className="text-lg font-semibold">Generated Output</h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-gray-200 px-3 py-1.5 rounded-md transition-colors text-sm"
                >
                  <CopyIcon copied={copied} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <SyntaxHighlighter language={language} style={atomDark} customStyle={{ margin: 0, borderRadius: '0 0 0.75rem 0.75rem' }}>
                {documentedCode}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

