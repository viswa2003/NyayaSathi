// src/pages/LawLibraryPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

interface Law {
    _id: string;
    category: string;
    act_name: string;
    law_code: string;
    section_number: string;
    title: string;
    description: string;
    simplified_description: string;
    punishment?: string;
    keywords: string[];
}

interface LawCardProps {
    law: Law;
    isLast: boolean;
}

const LawLibraryPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [laws, setLaws] = useState<Law[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const lawsPerPage = 25;
    const [totalLaws, setTotalLaws] = useState<number>(0);

    // Popular categories to show as chips
    const popularCategories = ['Criminal Law', 'Labour and Employment Law', 'Traffic', 'Consumer Protection & E-Commerce Law', 'Cybercrime'];

    // Fetch categories on mount and read URL category parameter
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/laws/categories');
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data: string[] = await response.json();
                setCategories(Array.isArray(data) ? data : []);
                
                // Check if category is passed via URL
                const categoryFromUrl = searchParams.get('category');
                if (categoryFromUrl && data.includes(categoryFromUrl)) {
                    setSelectedCategory(categoryFromUrl);
                }
            } catch (err: any) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, [searchParams]);

    // Fetch laws for selected category, page, and search
    const fetchLaws = async (page: number) => {
        // Allow search without category selection
        if (!selectedCategory && !searchQuery.trim()) {
            setLaws([]);
            setTotalLaws(0);
            setCurrentPage(1);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.append('category', selectedCategory);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());
            params.append('page', String(page));
            params.append('limit', String(lawsPerPage));
            const qs = params.toString();
            const response = await fetch(`/api/laws${qs ? `?${qs}` : ''}`);
            if (!response.ok) throw new Error(`Failed to fetch laws (${response.status})`);
            const data = await response.json();
            const list: Law[] = Array.isArray(data?.laws) ? data.laws : (Array.isArray(data) ? data : []);
            const total = typeof data?.total === 'number' ? data.total : (Array.isArray(data) ? data.length : 0);
            // Sort by law_code and section_number in ascending order
            list.sort((a, b) => {
                if (a.law_code !== b.law_code) return a.law_code.localeCompare(b.law_code);
                const getNumericPart = (section: string) => {
                    const match = section.match(/^(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                };
                const aNum = getNumericPart(a.section_number);
                const bNum = getNumericPart(b.section_number);
                if (aNum !== bNum) return aNum - bNum;
                return a.section_number.localeCompare(b.section_number, undefined, { numeric: true });
            });
            setLaws(list);
            setTotalLaws(total);
            setCurrentPage(page);
        } catch (err: any) {
            setError(err?.message || 'Failed to load laws');
            setLaws([]);
            setTotalLaws(0);
        } finally {
            setIsLoading(false);
        }
    };

    // When category or search changes, reset to page 1 and fetch
    useEffect(() => {
        if (!selectedCategory && !searchQuery.trim()) {
            setLaws([]);
            setTotalLaws(0);
            setCurrentPage(1);
            return;
        }
        const t = setTimeout(() => fetchLaws(1), 300); // debounce with search
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, searchQuery]);

    // Pagination handlers
    const totalPages = Math.max(1, Math.ceil(totalLaws / lawsPerPage));
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;
    const goPrev = () => hasPrev && fetchLaws(currentPage - 1);
    const goNext = () => hasNext && fetchLaws(currentPage + 1);

    // Card component: add bg, rounded, shadow; remove border separators
    const LawCard: React.FC<LawCardProps> = ({ law /*, isLast*/ }) => {
        return (
            <Link
                to={`/laws/${law._id}`}   // was "#"
                className="
                    block h-full p-3 bg-white rounded-md shadow-sm
                    hover:shadow-md hover:bg-gray-50 transition-shadow
                "
            >
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 mb-1">
                    {law.law_code} Section {law.section_number}: {law.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                    {law.category} - {law.act_name}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                    {law.simplified_description}
                </p>
                
                {/* Keywords Tags */}
                {law.keywords && law.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5"> {/* was gap-2 */}
                        {law.keywords.map((keyword, index) => (
                            <span
                                key={index}
                                className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                )}

                {law.punishment && (
                    <p className="text-xs text-gray-600 mt-2">
                        <strong>Punishment:</strong> {law.punishment}
                    </p>
                )}
            </Link>
        );
    };

    return (
        <div className="space-y-5 text-sm">  {/* was space-y-6; added text-sm to scale down */}
            <h1 className="text-2xl font-bold text-gray-800">Law Library</h1> {/* was text-3xl */}
            <p className="text-gray-600">Browse legal topics and understand your rights.</p>
            
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search legal topics across all laws..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>

            {/* Filter Section */}
            <div className="space-y-3">
                {/* Popular Categories - Filter Chips */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Popular Categories</label>
                    <div className="flex flex-wrap gap-1.5"> {/* was gap-2 */}
                        {popularCategories
                            .filter(cat => categories.includes(cat))
                            .map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-xs font-medium border
                                        ${selectedCategory === category
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }
                                        transition-colors
                                    `}
                                >
                                    {category}
                                </button>
                            ))}
                    </div>
                </div>

                {/* All Categories - Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Or select from all categories</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full md:w-56 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results Count / Prompt */}
            <div className="text-xs text-gray-600">
              {!selectedCategory && !searchQuery.trim()
                ? 'Select a category or search to view laws.'
                : isLoading
                  ? 'Loading…'
                  : `${totalLaws} total law(s), showing ${laws.length} on page ${currentPage}`}
            </div>

            {/* Loading/Error States */}
            {isLoading && <p className="text-center py-8">Loading...</p>}
            {error && <p className="text-red-600 text-center py-8">{error}</p>}
            
            {/* Law List */}
            {(selectedCategory || searchQuery.trim()) && !isLoading && !error && laws.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {laws.map((law, index) => (
                        <LawCard key={law._id} law={law} isLast={index === laws.length - 1} />
                    ))}
                </div>
            )}

            {/* Empty States */}
            {!isLoading && !error && !selectedCategory && !searchQuery.trim() && (
                <p className="text-gray-600 text-center py-8">Select a category or search to view laws.</p>
            )}
            {!isLoading && !error && (selectedCategory || searchQuery.trim()) && laws.length === 0 && (
                <p className="text-gray-600 text-center py-8">No laws found matching your criteria.</p>
            )}

            {/* Pagination Controls */}
            {(selectedCategory || searchQuery.trim()) && !isLoading && laws.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t">
                    <button
                        onClick={goPrev}
                        disabled={!hasPrev}
                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-gray-600">
                        Page {currentPage} of {Math.max(1, Math.ceil(totalLaws / lawsPerPage))}
                    </span>
                    <button
                        onClick={goNext}
                        disabled={!hasNext}
                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default LawLibraryPage;