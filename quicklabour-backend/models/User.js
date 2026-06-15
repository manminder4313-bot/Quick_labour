import Client from './Client.js';
import Labour from './Labour.js';
import Admin from './Admin.js';

/**
 * Helper to create a thenable query object that supports .select() and .limit() chaining.
 */
const createThenableQuery = (executor) => {
  let selectFields = '';
  let limitCount = 0;
  
  const queryObj = {
    select: (fields) => {
      selectFields = fields;
      return queryObj;
    },
    limit: (count) => {
      limitCount = count;
      return queryObj;
    },
    then: (onFulfilled, onRejected) => {
      return executor(selectFields, limitCount).then(onFulfilled, onRejected);
    }
  };
  return queryObj;
};

/**
 * Unified User Adapter
 * Intercepts Mongoose queries on the User model and dynamically forwards them
 * to the separate Client, Labour, or Admin collections in MongoDB Atlas.
 */
const User = {
  findOne: (query) => {
    return createThenableQuery(async (selectFields) => {
      if (query && query.role === 'client') {
        const cleanQuery = { ...query };
        delete cleanQuery.role;
        let qClient = Client.findOne(cleanQuery);
        if (selectFields) qClient = qClient.select(selectFields);
        return await qClient;
      }
      
      if (query && query.role === 'worker') {
        const cleanQuery = { ...query };
        delete cleanQuery.role;
        let qLabour = Labour.findOne(cleanQuery);
        if (selectFields) qLabour = qLabour.select(selectFields);
        return await qLabour;
      }
      
      if (query && query.role === 'admin') {
        const cleanQuery = { ...query };
        delete cleanQuery.role;
        let qAdmin = Admin.findOne(cleanQuery);
        if (selectFields) qAdmin = qAdmin.select(selectFields);
        return await qAdmin;
      }

      let qClient = Client.findOne(query);
      if (selectFields) qClient = qClient.select(selectFields);
      let result = await qClient;
      if (result) return result;
      
      let qLabour = Labour.findOne(query);
      if (selectFields) qLabour = qLabour.select(selectFields);
      result = await qLabour;
      if (result) return result;
      
      let qAdmin = Admin.findOne(query);
      if (selectFields) qAdmin = qAdmin.select(selectFields);
      return await qAdmin;
    });
  },

  findById: (id) => {
    return createThenableQuery(async (selectFields) => {
      let qClient = Client.findById(id);
      if (selectFields) qClient = qClient.select(selectFields);
      let result = await qClient;
      if (result) return result;
      
      let qLabour = Labour.findById(id);
      if (selectFields) qLabour = qLabour.select(selectFields);
      result = await qLabour;
      if (result) return result;
      
      let qAdmin = Admin.findById(id);
      if (selectFields) qAdmin = qAdmin.select(selectFields);
      return await qAdmin;
    });
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

  find: (query) => {
    return createThenableQuery(async (selectFields, limitCount) => {
      // If the query is explicitly searching for workers/labours
      if (query && (query.role === 'worker' || query.occupation)) {
        const cleanQuery = { ...query };
        delete cleanQuery.role; // Labour collection holds only workers
        let q = Labour.find(cleanQuery);
        if (selectFields) q = q.select(selectFields);
        if (limitCount) q = q.limit(limitCount);
        return await q;
      }
      
      // If the query is explicitly searching for clients
      if (query && query.role === 'client') {
        const cleanQuery = { ...query };
        delete cleanQuery.role;
        let q = Client.find(cleanQuery);
        if (selectFields) q = q.select(selectFields);
        if (limitCount) q = q.limit(limitCount);
        return await q;
      }

      // Default general lookup across both collections
      let qClient = Client.find(query);
      let qLabour = Labour.find(query);
      if (selectFields) {
        qClient = qClient.select(selectFields);
        qLabour = qLabour.select(selectFields);
      }
      if (limitCount) {
        qClient = qClient.limit(limitCount);
        qLabour = qLabour.limit(limitCount);
      }
      const clients = await qClient;
      const workers = await qLabour;
      
      const results = [...clients, ...workers];
      return limitCount ? results.slice(0, limitCount) : results;
    });
  }
};

export default User;
export { Client, Labour, Admin };
