import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Users, FileText, Home as HomeIcon, UserCog, Calendar, LogOut, UsersIcon } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Logout from './pages/Auth/Logout';
import Home from './pages/Home';
import PersonViewEdit from './pages/People/id';
import HouseholdViewEdit from './pages/Households/id';
import PeopleIndex from './pages/People/index';
import HouseholdsIndex from './pages/Households/index';
import CreatePerson from './pages/People/create';
import CreateHousehold from './pages/Households/create';
import UsersIndex from './pages/Users';
import CreateUser from './pages/Users/create';
import EventsIndex from './pages/Events/index';
import CreateEvent from './pages/Events/create';
import EventCheckin from './pages/Events/checkin';
import MobileNav from './components/MobileNav';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import UserProfile from './components/UserProfile';
import EditEvent from './pages/Events/edit';
import EventDetails from './pages/Events/details';

// Group pages
import GroupsIndex from './pages/Groups/index';
import GroupDashboard from './pages/Groups/GroupDashboard';
import AdminGroupManagement from './pages/Groups/AdminGroupManagement';

const navigationItems = [
  { path: '/people', label: 'People', icon: Users, permission: 'manage_people' },
  { path: '/households', label: 'Households', icon: FileText, permission: 'manage_households' },
  { path: '/users', label: 'Users', icon: UserCog, permission: 'manage_users' },
  { path: '/events', label: 'Events', icon: Calendar, permission: 'view_events' },
  { path: '/groups', label: 'Groups', icon: UsersIcon, permission: 'view_groups' }
];

const Navigation = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user, checkPermission } = useAuth();

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden text-gray-500"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link to="/" className="flex items-center text-gray-900">
              <HomeIcon className="h-6 w-6" />
              <span className="ml-2 font-semibold">Church Manager</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigationItems.map((item) => {
              if (!item.permission || checkPermission(item.permission)) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="nav-link"
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </Link>
                );
              }
              return null;
            })}
          </div>

          {/* User Profile */}
          <div className="flex items-center">
            <UserProfile />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        navigationItems={navigationItems}
      />
    </header>
  );
};

const App = () => (
  <div className="min-h-screen bg-gray-50">
    <Navigation />
    <main className="pt-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/people" element={
            <ProtectedRoute requiredPermission="manage_people">
              <PeopleIndex />
            </ProtectedRoute>
          } />
          <Route path="/people/create" element={
            <ProtectedRoute requiredPermission="manage_people">
              <CreatePerson />
            </ProtectedRoute>
          } />
          <Route path="/people/:id" element={
            <ProtectedRoute requiredPermission="manage_people">
              <PersonViewEdit />
            </ProtectedRoute>
          } />

          <Route path="/households" element={
            <ProtectedRoute requiredPermission="manage_households">
              <HouseholdsIndex />
            </ProtectedRoute>
          } />
          <Route path="/households/create" element={
            <ProtectedRoute requiredPermission="manage_households">
              <CreateHousehold />
            </ProtectedRoute>
          } />
          <Route path="/households/:id" element={
            <ProtectedRoute requiredPermission="manage_households">
              <HouseholdViewEdit />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute requiredPermission="manage_users">
              <UsersIndex />
            </ProtectedRoute>
          } />
          <Route path="/users/create" element={
            <ProtectedRoute requiredPermission="manage_users">
              <CreateUser />
            </ProtectedRoute>
          } />

          <Route path="/events" element={
            <ProtectedRoute requiredPermission="view_events">
              <EventsIndex />
            </ProtectedRoute>
          } />
          <Route path="/events/create" element={
            <ProtectedRoute requiredPermission="manage_events">
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/events/:id/checkin" element={
            <ProtectedRoute requiredPermission="perform_check_in">
              <EventCheckin />
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={
           <ProtectedRoute requiredPermission="manage_events">
              <EditEvent />
           </ProtectedRoute>
          } />
          <Route path="/events/:id/details" element={
          <ProtectedRoute requiredPermission="view_events">
            <EventDetails />
          </ProtectedRoute>
          } />

          {/* Group Routes */}
          <Route path="/groups" element={
            <ProtectedRoute requiredPermission="view_groups">
              <GroupsIndex />
            </ProtectedRoute>
          } />
          <Route path="/groups/dashboard" element={
            <ProtectedRoute requiredPermission="view_groups">
              <GroupDashboard />
            </ProtectedRoute>
          } />
          <Route path="/groups/admin" element={
            <ProtectedRoute requiredPermission="manage_groups">
              <AdminGroupManagement />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </main>
  </div>
);

export default App;