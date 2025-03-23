import React from 'react';
import { Users, Home as HomeIcon, UserCog, Calendar, UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FeatureCard = ({ icon: Icon, title, description, link, color }) => (
  <Link to={link} className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <Icon className={`h-8 w-8 ${color}`} />
      <div>
        <h2 className="text-xl font-medium text-gray-900">{title}</h2>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  </Link>
);

const Home = () => {
  const { user, checkPermission } = useAuth();
  
  const features = [
    {
      icon: Users,
      title: 'People',
      description: 'Manage church members',
      link: '/people',
      color: 'text-blue-600',
      permission: 'manage_people'
    },
    {
      icon: HomeIcon,
      title: 'Households',
      description: 'Manage family units',
      link: '/households',
      color: 'text-green-600',
      permission: 'manage_households'
    },
    {
      icon: UserCog,
      title: 'Users',
      description: 'Manage system users',
      link: '/users',
      color: 'text-purple-600',
      permission: 'manage_users'
    },
    {
      icon: Calendar,
      title: 'Events',
      description: 'Manage church events',
      link: '/events',
      color: 'text-orange-600',
      permission: 'view_events'
    },
    {
      icon: UsersIcon,
      title: 'Groups',
      description: 'Manage church groups and ministries',
      link: '/groups',
      color: 'text-indigo-600',
      permission: 'view_groups'
    }
  ];

  // Add group admin management card for admin users
  if (user?.role === 'admin' || checkPermission('manage_groups')) {
    features.push({
      icon: UserCog,
      title: 'Group Administration',
      description: 'Advanced group management and configuration',
      link: '/groups/admin',
      color: 'text-red-600',
      permission: 'manage_groups'
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening in your church</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          (!feature.permission || checkPermission(feature.permission)) && (
            <FeatureCard
              key={feature.link}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              link={feature.link}
              color={feature.color}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default Home;