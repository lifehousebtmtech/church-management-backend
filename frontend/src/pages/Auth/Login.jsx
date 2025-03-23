// frontend/src/pages/Auth/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
 const [credentials, setCredentials] = useState({ username: '', password: '' });
 const [error, setError] = useState('');
 const { login } = useAuth();

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    console.log('Submitting:', credentials);
    await login(credentials.username, credentials.password);
  } catch (error) {
    console.error('Login error:', error);
    setError(error.response?.data?.message || error.message || 'Login failed');
  }
};

 return (
   <div className="min-h-screen flex items-center justify-center bg-gray-50">
     <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
       <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">Sign in</h2>
       
       {error && (
         <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
           {error}
         </div>
       )}

       <form onSubmit={handleSubmit} className="space-y-6">
         <div>
           <label className="block text-sm font-medium text-gray-700">Username</label>
           <input
             type="text"
             required
             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
             value={credentials.username}
             onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
           />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Password</label>
           <input
             type="password"
             required
             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
             value={credentials.password}
             onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
           />
         </div>

         <button
           type="submit"
           className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
         >
           Sign in
         </button>
       </form>
     </div>
   </div>
 );
};

export default Login;