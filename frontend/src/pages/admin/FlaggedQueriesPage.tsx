// src/pages/admin/FlaggedQueriesPage.tsx
import React from 'react';

const rows = [
    {u:'rajesh_kumar', q:'How can I get away with tax evasion withou...', r:'Request for illegal advice', d:'Feb 15, 2024', s:'Pending'},
    {u:'priya_sharma', q:'What are the best ways to hide assets durin...', r:'Potential fraud advice', d:'Feb 14, 2024', s:'Pending'},
    {u:'amit_patel', q:'How to forge documents to get a loan appr...', r:'Document forgery inquiry', d:'Feb 13, 2024', s:'Reviewed'},
    {u:'sneha_gupta', q:'Can I lie in court testimony to protect my fri...', r:'Perjury advice request', d:'Feb 12, 2024', s:'Resolved'},
];

const FlaggedQueriesPage: React.FC = () => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Flagged Queries</h2>
            <div className="bg-white border rounded-lg p-4">
                <p className="text-gray-600 mb-4">Review and manage flagged user queries</p>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="text-sm text-gray-500">
                                <th className="py-2">User</th>
                                <th className="py-2">Query Text</th>
                                <th className="py-2">Reason</th>
                                <th className="py-2">Date Flagged</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((r)=> (
                                <tr key={r.u} className="text-gray-700">
                                    <td className="py-3 flex items-center gap-2"><span className="inline-flex w-6 h-6 rounded-full bg-gray-100"/> {r.u}<div className="text-xs text-blue-600 ml-2">View Details</div></td>
                                    <td className="py-3">{r.q}</td>
                                    <td className="py-3"><span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">{r.r}</span></td>
                                    <td className="py-3">{r.d}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${r.s==='Resolved'?'bg-emerald-50 text-emerald-700': r.s==='Reviewed'?'bg-sky-50 text-sky-700':'bg-yellow-50 text-yellow-700'}`}>{r.s}</span>
                                    </td>
                                    <td className="py-3 space-x-2">
                                        <button className="px-3 py-1.5 text-sm bg-sky-50 text-sky-700 rounded">Review</button>
                                        <button className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded">Resolve</button>
                                        <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded">Completed</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FlaggedQueriesPage;


