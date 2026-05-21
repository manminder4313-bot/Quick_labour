import Client from './Client.js';
import Labour from './Labour.js';
import Admin from './Admin.js';

/**
 * Unified User Adapter
 * Intercepts Mongoose queries on the User model and dynamically forwards them
 * to the separate Client, Labour, or Admin collections in MongoDB Atlas.
 */
const User = {
  findOne: async (query) => {
    // Try searching Client first
    let result = await Client.findOne(query);
    if (result) return result;
    
    // Try searching Labour second
    result = await Labour.findOne(query);
    if (result) return result;
    
    // Finally search Admin
    return await Admin.findOne(query);
  },

  findById: async (id) => {
    let result = await Client.findById(id);
    if (result) return result;
    
    result = await Labour.findById(id);
    if (result) return result;
    
    return await Admin.findById(id);
  },

  create: async (data) => {
    if (data.role === 'client') {
      return await Client.create(data);
    } else if (data.role === 'worker') {
      return await Labour.create(data);
    } else if (data.role === 'admin') {
      return await Admin.create(data);
    }
    throw new Error(`Invalid user role for creation: ${data.role}`);
  },

  find: async (query) => {
    // If the query is explicitly searching for workers/labours
    if (query && (query.role === 'worker' || query.occupation)) {
      const cleanQuery = { ...query };
      delete cleanQuery.role; // Labour collection holds only workers
      return await Labour.find(cleanQuery);
    }
    
    // If the query is explicitly searching for clients
    if (query && query.role === 'client') {
      const cleanQuery = { ...query };
      delete cleanQuery.role;
      return await Client.find(cleanQuery);
    }

    // Default general lookup across both collections
    const clients = await Client.find(query);
    const workers = await Labour.find(query);
    return [...clients, ...workers];
  }
};

export default User;
export { Client, Labour, Admin };
