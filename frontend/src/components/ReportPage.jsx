import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, ShieldAlert, Cpu, GitPullRequest, GitMerge, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const SKELETON_GLOW = {
  hidden: { opacity: 0.3 },
  visible: { 
    opacity: [0.3, 0.7, 0.3], 
    transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } 
  }
};

export default function ReportPage() {
  const { owner, repoName } = useParams();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const reportRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Repo_Analysis_${owner}_${repoName}`,
  });

  useEffect(() => {
    async function fetchReportData() {
      // 1. Fetch fast stats
      setLoadingStats(true);
      try {
        const statsRes = await fetch(`http://localhost:8000/api/report/stats?owner=${owner}&repo=${repoName}`);
        
        if (!statsRes.ok) {
           throw new Error(`Failed to fetch stats: ${statsRes.status}`);
        }
        
        const statsData = await statsRes.json();
        setStats(statsData.data);
        setLoadingStats(false);
        
        // 2. Pass fast stats to AI for insights
        const insightsRes = await fetch(`http://localhost:8000/api/report/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(statsData.data)
        });
        
        if (insightsRes.ok) {
           const insightsData = await insightsRes.json();
           setInsights(insightsData.data);
        } else {
           console.error("AI Insights fetch failed.");
        }
      } catch (err) {
        console.error("Failed to load report", err);
        setLoadingStats(false);
      }
    }
    fetchReportData();
  }, [owner, repoName]);

  const TableHeader = ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
      {children}
    </th>
  );

  const TableCell = ({ children, bold = false }) => (
    <td className={`px-4 py-3 text-sm border-b border-gray-700/20 ${bold ? 'text-white font-medium' : 'text-gray-300'}`}>
      {children}
    </td>
  );

  const InsightBlock = ({ sectionKey, fallback }) => (
    <div className="mt-4 p-4 rounded-xl bg-[#1A1F2B] border border-gray-700/30 text-sm text-gray-300 italic">
      {insights ? (
        <span>"{insights.interpretations?.[sectionKey]}"</span>
      ) : (
        <motion.div variants={SKELETON_GLOW} initial="hidden" animate="visible" className="h-6 bg-slate-700/40 rounded w-3/4" />
      )}
    </div>
  );

  if (loadingStats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neu-bg text-gray-400">
        <motion.div variants={SKELETON_GLOW} initial="hidden" animate="visible" className="h-12 w-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin mb-4" />
        <p>Tallying GitHub Metrics for {owner}/{repoName}...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Error loading repository stats. Please verify the URL.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neu-bg text-gray-200 overflow-y-auto">
      <style>{`
        @media print {
          body, .bg-neu-bg { background: white !important; color: black !important; }
          .print-avoid-break { page-break-inside: avoid; }
          .print-hidden { display: none !important; }
          * { text-shadow: none !important; box-shadow: none !important; border-color: #e5e7eb !important; }
          h1, h2, h3, th { color: #111827 !important; }
          td, p, span, li { color: #374151 !important; }
          .neo-panel { background: white !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>
      
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-neu-bg/80 backdrop-blur-md border-b border-gray-800/50 print-hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-800 transition text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">{stats.overview.name}</h1>
            <p className="text-xs text-gray-500">Repository Audit</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-400 transition font-medium text-sm"
        >
          <Download size={16} /> Export as PDF
        </button>
      </div>

      {/* Printable Report Container */}
      <div ref={reportRef} className="max-w-4xl mx-auto py-12 px-8 sm:px-12 pb-24">
        
        {/* Cover Header */}
        <div className="text-center mb-16 pb-12 border-b border-gray-700/50">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">Repository Analysis Report</h1>
          <p className="text-xl text-gray-400 mb-6 font-mono text-cyan-400">{stats.overview.name}</p>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">{stats.overview.description}</p>
        </div>

        {/* Executive Summary */}
        <div className="mb-16 neo-panel p-8 rounded-2xl bg-slate-800/20 border border-cyan-500/20 relative overflow-hidden print-avoid-break">
          <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert className="text-cyan-400" /> Executive Summary</h2>
          {insights ? (
            <p className="text-gray-300 leading-relaxed text-md">{insights.executive_summary}</p>
          ) : (
            <div className="space-y-3">
              <motion.div variants={SKELETON_GLOW} initial="hidden" animate="visible" className="h-4 bg-slate-700/40 rounded w-full" />
              <motion.div variants={SKELETON_GLOW} initial="hidden" animate="visible" className="h-4 bg-slate-700/40 rounded w-[90%]" />
              <motion.div variants={SKELETON_GLOW} initial="hidden" animate="visible" className="h-4 bg-slate-700/40 rounded w-[95%]" />
              <motion.div variants={SKELETON_GLOW} initial="hidden" animate="visible" className="h-4 bg-slate-700/40 rounded w-2/3" />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
             <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-green-400 mb-3 flex items-center gap-2">
                   <CheckCircle2 size={16} /> Key Strengths
                </h3>
                <ul className="space-y-2">
                  {insights ? insights.key_strengths.map((str, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-500">•</span> {str}
                    </li>
                  )) : (
                    <motion.div variants={SKELETON_GLOW} initial="hidden" animate="visible" className="h-10 bg-slate-700/40 rounded w-full" />
                  )}
                </ul>
             </div>
             <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                   <AlertCircle size={16} /> Key Risks
                </h3>
                <ul className="space-y-2">
                  {insights ? insights.key_risks.map((rsk, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-red-500">•</span> {rsk}
                    </li>
                  )) : (
                    <motion.div variants={SKELETON_GLOW} initial="hidden" animate="visible" className="h-10 bg-slate-700/40 rounded w-full" />
                  )}
                </ul>
             </div>
          </div>
        </div>

        {/* 1. Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 print-avoid-break">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b border-gray-700/50 pb-2">Repository Overview</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-400">Website</dt><dd className="text-white text-right break-all">{stats.overview.website}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Primary Language</dt><dd className="text-white">{stats.overview.primary_language}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">License</dt><dd className="text-white">{stats.overview.license}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Report Date</dt><dd className="text-white">{stats.overview.report_date}</dd></div>
            </dl>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b border-gray-700/50 pb-2">Timestamps & Health</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-400">Created</dt><dd className="text-white">{stats.health.created_at}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Last Pushed</dt><dd className="text-white">{stats.health.pushed_at} ({stats.health.days_since_push} days ago)</dd></div>
            </dl>
            <div className="mt-4 p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
               <div className="flex items-center justify-between mb-1">
                 <span className="text-gray-400 text-xs uppercase">Status</span>
                 <span className={`text-xs font-bold px-2 py-0.5 rounded ${stats.health.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>{stats.health.status}</span>
               </div>
               <p className="text-xs text-gray-300">{stats.health.status_explanation}</p>
            </div>
          </div>
        </div>

        {/* 2. Basic Statistics */}
        <div className="mb-12 print-avoid-break">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Cpu size={18} className="text-gray-400"/> Community Adoption</h2>
          <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-[#141822]">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/40">
                  <TableHeader>Stars</TableHeader>
                  <TableHeader>Forks</TableHeader>
                  <TableHeader>Watchers</TableHeader>
                  <TableHeader>Open Issues</TableHeader>
                  <TableHeader>Open PRs</TableHeader>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <TableCell bold>{stats.stats.stars.toLocaleString()}</TableCell>
                  <TableCell bold>{stats.stats.forks.toLocaleString()}</TableCell>
                  <TableCell bold>{stats.stats.watchers.toLocaleString()}</TableCell>
                  <TableCell>{stats.stats.open_issues.toLocaleString()}</TableCell>
                  <TableCell>{stats.stats.open_prs.toLocaleString()}</TableCell>
                </tr>
              </tbody>
            </table>
          </div>
          <InsightBlock sectionKey="stats" />
        </div>

        {/* 3. Language Breakdown */}
        <div className="mb-12 print-avoid-break">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-gray-400"/> Technical Stack</h2>
          <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-[#141822]">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/40">
                  <TableHeader>Language</TableHeader>
                  <TableHeader>Bytes</TableHeader>
                  <TableHeader>% Share</TableHeader>
                </tr>
              </thead>
              <tbody>
                {stats.languages.map((l, i) => (
                  <tr key={l.name}>
                    <TableCell bold>{l.name}</TableCell>
                    <TableCell>{l.bytes.toLocaleString()} B</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden print-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${l.share}%` }} />
                        </div>
                        {l.share}%
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InsightBlock sectionKey="languages" />
        </div>

        {/* 4. Development Velocity */}
        <div className="mb-12 print-avoid-break">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><GitMerge size={18} className="text-gray-400"/> Development Velocity (Last 90 Days)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-5 rounded-xl border border-gray-700/50 bg-[#141822]">
                 <span className="text-sm text-gray-400 uppercase tracking-wide">Total Commits</span>
                 <p className="text-3xl font-bold text-white mt-2">{stats.history.commits_last_90d}</p>
                 <p className="text-xs text-gray-500 mt-1">{stats.history.period}</p>
             </div>
             <div className="p-5 rounded-xl border border-gray-700/50 bg-[#141822]">
                 <span className="text-sm text-gray-400 uppercase tracking-wide">Contributor Risk Profile</span>
                 <p className="text-xl font-bold text-white mt-2">{stats.bus_factor}</p>
                 <p className="text-xs text-gray-500 mt-1">Based on Top 5 contributor concentration</p>
             </div>
          </div>
          <InsightBlock sectionKey="history" />
        </div>

        {/* 5. Contributors and Community */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 print-avoid-break">
          <div>
            <h2 className="text-lg font-bold mb-4">Top Contributors</h2>
            <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-[#141822]">
              <table className="w-full">
                <thead><tr className="bg-slate-800/40"><TableHeader>User</TableHeader><TableHeader>Commits</TableHeader><TableHeader>Share</TableHeader></tr></thead>
                <tbody>
                  {stats.top_contributors.map(c => (
                    <tr key={c.username}>
                      <TableCell bold>{c.username}</TableCell>
                      <TableCell>{c.commits}</TableCell>
                      <TableCell>{c.share}%</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4">Community Standards</h2>
            <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-[#141822]">
              <table className="w-full">
                <thead><tr className="bg-slate-800/40"><TableHeader>Standard</TableHeader><TableHeader>Present</TableHeader></tr></thead>
                <tbody>
                  {Object.entries(stats.community_health).filter(([k]) => k !== 'Score').map(([k, v]) => (
                    <tr key={k}>
                      <TableCell>{k}</TableCell>
                      <TableCell bold>
                         {v ? <span className="text-green-400">Yes</span> : <span className="text-gray-500">No</span>}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 6. Traffic */}
        <div className="mb-12 print-avoid-break">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><GitPullRequest size={18} className="text-gray-400"/> Repository Traffic (14 Days)</h2>
          <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-[#141822]">
            <table className="w-full">
              <thead><tr className="bg-slate-800/40"><TableHeader>Metric</TableHeader><TableHeader>Total</TableHeader><TableHeader>Unique Views</TableHeader></tr></thead>
              <tbody>
                <tr>
                   <TableCell bold>Page Views</TableCell>
                   <TableCell>{stats.traffic.error || stats.traffic.page_views_total}</TableCell>
                   <TableCell>{stats.traffic.error || stats.traffic.page_views_unique}</TableCell>
                </tr>
                <tr>
                   <TableCell bold>Git Clones</TableCell>
                   <TableCell>{stats.traffic.error || stats.traffic.clones_total}</TableCell>
                   <TableCell>{stats.traffic.error || stats.traffic.clones_unique}</TableCell>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
