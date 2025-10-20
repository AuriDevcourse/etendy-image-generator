import Layout from "./Layout.jsx";

import LandingPage from "./LandingPage";
import ImageGenerator from "./ImageGenerator";
import AdminPage from "./admin";
import TestPage from "./test";
import PresetsDashboard from "./PresetsDashboard";
import UserManagementPage from "./UserManagementPage";
import AdminDashboard from "../components/AdminDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

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
    
    // Landing page should not use the Layout wrapper
    if (location.pathname === '/') {
        return <LandingPage />;
    }
    
    // Admin page removed - admins now use the unified /presets/:userId page
    // Test pages should not use the Layout wrapper
    if (location.pathname === '/test') {
        return <TestPage />;
    }
    
    // Handle presets dashboard routes /presets/:userId
    if (location.pathname.startsWith('/presets/')) {
        return <PresetsDashboard />;
    }
    
    // Handle preset routes /p/preset-id
    if (location.pathname.startsWith('/p/')) {
        return <ImageGenerator />;
    }
    
    // Handle user management route /admin/users
    if (location.pathname === '/admin/users') {
        return <UserManagementPage />;
    }
    
    // Handle admin dashboard route /admin/presets
    if (location.pathname === '/admin/presets') {
        return <AdminDashboard />;
    }
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/generator" element={
                    <ProtectedRoute>
                        <ImageGenerator />
                    </ProtectedRoute>
                } />
                <Route path="/ImageGenerator" element={
                    <ProtectedRoute>
                        <ImageGenerator />
                    </ProtectedRoute>
                } />
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