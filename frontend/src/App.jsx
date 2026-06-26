import { useState } from 'react';

function App() {
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyzePR = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/analyze-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: prUrl })
      });

      if (!response.ok) {
        let detail = 'Failed to analyze PR';
        try {
          const errBody = await response.json();
          detail = errBody.detail || detail;
        } catch {
          // response wasn't JSON
        }
        throw new Error(detail);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Cannot connect to backend. Make sure the API server is running on port 8000.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format feature keys: "lines_added" → "Lines Added"
  const formatKey = (key) =>
    key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Compute max SHAP magnitude for relative bar scaling
  const maxShap = result
    ? Math.max(...result.shap_values.map((f) => Math.abs(f.impact)), 0.001)
    : 1;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-4 pt-8">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            AI Code Reviewer
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Predict the bug-risk of any public GitHub Pull Request using an XGBoost model with SHAP explainability.
          </p>
        </header>

        {/* Input Section */}
        <section id="pr-input" className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={analyzePR} className="flex gap-4">
            <input
              id="pr-url-input"
              type="url"
              placeholder="https://github.com/owner/repo/pull/123"
              required
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            />
            <button
              id="analyze-btn"
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-purple-500/20 whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : 'Analyze PR'}
            </button>
          </form>
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}
        </section>

        {/* Results Section */}
        {result && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Risk Score Card */}
            <div id="risk-score-card" className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 shadow-xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${
                result.risk_level === 'High' ? 'bg-red-500' : 
                result.risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <h2 className="text-gray-400 font-medium tracking-wide uppercase text-sm">Predicted Bug Risk</h2>
              <div className="text-6xl font-black tabular-nums">
                {(result.bug_probability * 100).toFixed(1)}<span className="text-3xl text-gray-500">%</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${
                result.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                result.risk_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>
                {result.risk_level.toUpperCase()} RISK
              </span>
            </div>

            {/* Metrics Card */}
            <div id="metrics-card" className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-gray-200">PR Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(result.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-800/50 p-4 rounded-xl border border-gray-800/50">
                    <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      {formatKey(key)}
                    </div>
                    <div className="text-2xl font-bold text-gray-100">{value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SHAP Values Explainer */}
            <div id="shap-card" className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-200">AI Reasoning (SHAP Explainer)</h3>
                <p className="text-gray-400 text-sm">How each feature contributed to the final risk score.</p>
              </div>
              
              <div className="space-y-4">
                {result.shap_values.map((feat, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-gray-300 font-mono">{formatKey(feat.feature)}</span>
                      <span className={feat.impact > 0 ? 'text-red-400' : 'text-green-400'}>
                        {feat.impact > 0 ? '+' : ''}{feat.impact.toFixed(4)}
                      </span>
                    </div>
                    {/* Progress bar background */}
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
                      {/* Bar filler — width is proportional to max SHAP value */}
                      <div 
                        className={`h-full ${feat.impact > 0 ? 'bg-red-500' : 'bg-green-500'} rounded-full transition-all duration-500`}
                        style={{ 
                          width: `${(Math.abs(feat.impact) / maxShap) * 100}%`,
                          marginLeft: feat.impact < 0 ? 'auto' : '0'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>
        )}
      </div>
    </div>
  );
}

export default App;
