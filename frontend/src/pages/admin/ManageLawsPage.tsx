// src/pages/admin/ManageLawsPage.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AddLawModal from '../../components/AddLawModal';
import LawDetailModal from '../../components/LawDetailModal';

interface Law {
    _id: string;
    law_code: string;
    section_number: string;
    title: string;
    category: string;
    act_name: string;
    description: string;
    simplified_description: string;
    punishment?: string;
    keywords?: string[];
    examples?: string[];
}

const ManageLawsPage: React.FC = () => {
    const { token } = useAuth();

    const [laws, setLaws] = React.useState<Law[]>([]);
    const [categories, setCategories] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    const [search, setSearch] = React.useState<string>('');
    const [category, setCategory] = React.useState<string>('');
    const [isFiltering, setIsFiltering] = React.useState<boolean>(false);
    
    const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState<boolean>(false);
    const [selectedLaw, setSelectedLaw] = React.useState<Law | null>(null);
    
    const [currentPage, setCurrentPage] = React.useState<number>(1);
    const [totalLaws, setTotalLaws] = React.useState<number>(0);
    const lawsPerPage = 25;

    const fetchLaws = async (page: number = 1) => {
        // If no category is selected, don't fetch any laws; prompt user instead
        if (!category) {
            setLaws([]);
            setTotalLaws(0);
            setCurrentPage(1);
            return;
        }
        try {
            setIsFiltering(true);
            setError(null);
            const params = new URLSearchParams();
            if (search.trim()) params.append('search', search.trim());
            params.append('category', category);
            params.append('page', page.toString());
            params.append('limit', lawsPerPage.toString());
            const qs = params.toString();

            const res = await fetch(`/api/laws${qs ? `?${qs}` : ''}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || `Failed (${res.status})`);
            }
            const data = await res.json();
            setLaws(Array.isArray(data.laws) ? data.laws : Array.isArray(data) ? data : []);
            setTotalLaws(data.total || (Array.isArray(data) ? data.length : 0));
            setCurrentPage(page);
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch laws');
        } finally {
            setIsFiltering(false);
        }
    };

    // Initial load for categories only (do not load all laws by default)
    React.useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                // Fetch categories only on initial load
                const catsRes = await fetch('/api/laws/categories');
                if (!catsRes.ok) throw new Error(await catsRes.text());
                const catsJson = await catsRes.json();
                if (isMounted) {
                    setCategories(Array.isArray(catsJson) ? catsJson : []);
                    // Do not load laws until a category is selected
                    setLaws([]);
                    setTotalLaws(0);
                }
            } catch (e: any) {
                if (isMounted) setError(e?.message || 'Failed to load data');
            } finally {
                if (isMounted) setLoading(false);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [token]);

    const sectionDisplay = (law: Law) => {
        const parts = [law.law_code, law.section_number].filter(Boolean);
        return parts.join(' ');
    };

    const handleModalSuccess = async () => {
        // Refresh the laws list after successful creation
        await fetchLaws(currentPage);
    };

    const handleCardClick = (law: Law) => {
        setSelectedLaw(law);
        setIsDetailModalOpen(true);
    };

    // Auto-fetch when category/search change will be handled via useEffect below

    const handleNextPage = () => {
        const nextPage = currentPage + 1;
        fetchLaws(nextPage);
    };

    const handlePrevPage = () => {
        const prevPage = currentPage - 1;
        fetchLaws(prevPage);
    };

    const totalPages = Math.ceil(totalLaws / lawsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Auto-fetch when category or search changes (debounced) if a category is selected
    React.useEffect(() => {
        if (!category) return;
        const t = setTimeout(() => {
            // always reset to page 1 on filter changes
            setCurrentPage(1);
            fetchLaws(1);
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, search]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Manage Laws</h2>
            <div className="bg-white border rounded-lg p-4 space-y-4">
                {error && (
                    <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">{error}</div>
                )}

                <div className="space-y-3">
                    <div className="flex gap-3 items-center">
                        <input
                            className="flex-1 border rounded-md px-3 py-2"
                            placeholder="Search by Title, Section Number, or Keywords"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 whitespace-nowrap"
                        >
                            Add New Law
                        </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {categories.map((c) => {
                            const active = category === c;
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                        if (c !== category) {
                                            setCategory(c);
                                            setCurrentPage(1);
                                        }
                                    }}
                                    aria-pressed={active}
                                    className={[
                                        'whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors',
                                        active
                                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    ].join(' ')}
                                >
                                    {c}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end items-center">
                    <div className="text-sm text-gray-500">
                        {loading
                          ? 'Loading…'
                          : (!category
                              ? 'Select a category to view laws.'
                              : `${totalLaws} total law(s), showing ${laws.length} on page ${currentPage}`)}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {!category ? (
                        <div className="py-8 text-center text-gray-500">Select a category to view laws.</div>
                    ) : loading ? (
                        <div className="py-8 text-center text-gray-500">Loading...</div>
                    ) : laws.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">No laws found in this category.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {laws.map((law) => (
                                <div
                                    key={law._id}
                                    onClick={() => handleCardClick(law)}
                                    className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    <div className="mb-2">
                                        <span className="text-blue-600 font-semibold text-lg">
                                            {sectionDisplay(law)}
                                        </span>
                                    </div>
                                    <h3 className="text-gray-900 font-medium mb-2 line-clamp-2">
                                        {law.title}
                                    </h3>
                                    <div className="mt-3">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700">
                                            {law.category || '—'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && laws.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t">
                        <button
                            onClick={handlePrevPage}
                            disabled={!hasPrevPage || isFiltering}
                            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={!hasNextPage || isFiltering}
                            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <AddLawModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
                token={token}
                categories={categories}
            />

            <LawDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                law={selectedLaw}
                token={token}
                categories={categories}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default ManageLawsPage;


