// src/pages/admin/AdminDashboard.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AddLawModal from '../../components/AddLawModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard: React.FC<{label:string,value:string,accent:string}> = ({label,value,accent}) => (
    <div className="bg-white border rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-2">{label}</div>
        <div className="text-3xl font-bold text-gray-800 flex items-end gap-2">
            {value}
            <span className={`inline-flex items-center justify-center w-8 h-8 text-white rounded ${accent}`}></span>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = React.useState<{ totalLaws: number; totalUsers: number } | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [categories, setCategories] = React.useState<string[]>([]);
    const [apiUsageData, setApiUsageData] = React.useState<Array<{ date: string; calls: number }>>([]);

    React.useEffect(() => {
        let isMounted = true;
        const run = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const [statsRes, catsRes, apiUsageRes] = await Promise.all([
                    fetch('/api/admin/stats', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch('/api/laws/categories'),
                    fetch('/api/admin/api-usage', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                
                if (!statsRes.ok) {
                    const t = await statsRes.text();
                    throw new Error(t || `Failed (${statsRes.status})`);
                }
                
                const [statsData, catsData, apiUsageDataRes] = await Promise.all([
                    statsRes.json(),
                    catsRes.ok ? catsRes.json() : [],
                    apiUsageRes.ok ? apiUsageRes.json() : []
                ]);
                
                if (isMounted) {
                    setStats({ totalLaws: statsData.totalLaws ?? 0, totalUsers: statsData.totalUsers ?? 0 });
                    setCategories(Array.isArray(catsData) ? catsData : []);
                    setApiUsageData(Array.isArray(apiUsageDataRes) ? apiUsageDataRes : []);
                }
            } catch (e: any) {
                if (isMounted) setError(e?.message || 'Failed to load stats');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        run();
        return () => { isMounted = false; };
    }, [token]);

    const format = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '—');

    const handleModalSuccess = () => {
        // Refresh stats after adding a new law
        setStats(prev => prev ? { ...prev, totalLaws: prev.totalLaws + 1 } : null);
        // Navigate to manage laws page to see the new law
        navigate('/admin/manage-laws');
    };

    // Progress helpers (static goals for now)
    const totalLaws = stats?.totalLaws ?? 0;
    const totalUsers = stats?.totalUsers ?? 0;
    const lawsGoal = 500;
    const usersGoal = 10;
    const lawsPct = Math.min(100, Math.round((totalLaws / lawsGoal) * 100));
    const usersPct = Math.min(100, Math.round((totalUsers / usersGoal) * 100));

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-gray-700">Dashboard Overview</h2>

            {error && (
                <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">{error}</div>
            )}

            {/* Top stats row */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 w-full">
                {/* Total Laws */}
                <Link 
                    to="/admin/manage-laws"
                    className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center hover:shadow-xl hover:border-gray-300 transition-all duration-200 cursor-pointer min-h-[140px]"
                >
                    <div className="p-2 rounded-full mb-3" style={{ backgroundColor: 'rgba(30,101,154,0.1)', color: '#1E659A' }}>
                        {/* book icon */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.8 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.8 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.2 18 16.5 18s-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <h2 className="text-3xl font-extrabold mb-2" style={{ color: '#1E659A' }}>
                        {loading ? '…' : format(totalLaws)}
                    </h2>
                    <p className="text-xs font-medium text-gray-500 text-center">Total Laws</p>
                </Link>

                {/* Total Users */}
                <Link 
                    to="/admin/users"
                    className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center hover:shadow-xl hover:border-gray-300 transition-all duration-200 cursor-pointer min-h-[140px]"
                >
                    <div className="p-2 rounded-full bg-green-500/10 text-green-600 mb-3">
                        {/* user avatar icon */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-green-600 mb-2">{loading ? '…' : format(totalUsers)}</h2>
                    <p className="text-xs font-medium text-gray-500 text-center">Total Users</p>
                </Link>
            </div>

            {/* API Usage Graph */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Weekly API Usage</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={apiUsageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="date" 
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}
                        />
                        <Legend 
                            wrapperStyle={{ fontSize: '14px' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="calls" 
                            stroke="#1E659A" 
                            strokeWidth={3}
                            dot={{ fill: '#1E659A', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="API Calls"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <AddLawModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
                token={token}
                categories={categories}
            />
        </div>
    );
};

export default AdminDashboard;


