import Layout from "./Layout.jsx";

import Matrix from "./Matrix";

import Rules from "./Rules";

import Analytics from "./Analytics";

import DataCheck from "./DataCheck";

import Dashboard from "./Dashboard";

import FutureRules from "./FutureRules";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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