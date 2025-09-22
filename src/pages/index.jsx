import Layout from "./Layout.jsx";

import ImageGenerator from "./ImageGenerator";
import AdminPage from "./admin";
import TestPage from "./test";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    ImageGenerator: ImageGenerator,
    
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
    
    // Admin and test pages should not use the Layout wrapper
    if (location.pathname === '/admin') {
        return <AdminPage />;
    }
    if (location.pathname === '/test') {
        return <TestPage />;
    }
    
    // Handle preset routes /p/preset-id
    if (location.pathname.startsWith('/p/')) {
        return <ImageGenerator />;
    }
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<ImageGenerator />} />
                
                
                <Route path="/ImageGenerator" element={<ImageGenerator />} />
                
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