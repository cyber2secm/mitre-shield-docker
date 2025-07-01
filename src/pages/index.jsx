import Layout from "./Layout.jsx";

import Matrix from "./Matrix";

import Rules from "./Rules";

import Analytics from "./Analytics";

import DataCheck from "./DataCheck";

import Dashboard from "./Dashboard";

import FutureRules from "./FutureRules";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';

const PAGES = {
    
    Matrix: Matrix,
    
    Rules: Rules,
    
    Analytics: Analytics,
    
    DataCheck: DataCheck,
    
    Dashboard: Dashboard,
    
    FutureRules: FutureRules,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const { isAuthenticated, loading } = useAuth();
    
    // Temporarily skip authentication for development
    // if (loading) {
    //     return (
    //         <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
    //             <div className="flex flex-col items-center gap-4">
    //                 <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    //                 <p className="text-slate-600 font-medium">Loading...</p>
    //             </div>
    //         </div>
    //     );
    // }
    
    // if (!isAuthenticated) {
    //     return <LoginForm />;
    // }
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Matrix />} />
                
                
                <Route path="/Matrix" element={<Matrix />} />
                
                <Route path="/Rules" element={<Rules />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/DataCheck" element={<DataCheck />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/FutureRules" element={<FutureRules />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}