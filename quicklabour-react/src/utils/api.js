let apiEnvUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (apiEnvUrl && !apiEnvUrl.endsWith('/api')) {
  apiEnvUrl = apiEnvUrl.replace(/\/$/, '') + '/api';
}
const BASE_URL = apiEnvUrl;

// Helper to get headers
const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = sessionStorage.getItem('userToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper for fetch requests
const request = async (url, options = {}) => {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      ...getHeaders(options.isMultipart),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  get: async (url, options = {}) => {
    return request(url, { method: 'GET', ...options });
  },

  post: async (url, data, options = {}) => {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  },

  put: async (url, data, options = {}) => {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  },

  delete: async (url, options = {}) => {
    return request(url, { method: 'DELETE', ...options });
  },

  // Auth endpoints
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token and details in sessionStorage
    sessionStorage.setItem('userToken', data.token);
    sessionStorage.setItem('userId', data._id);
    sessionStorage.setItem('userName', data.fullName);
    sessionStorage.setItem('userEmail', data.email);
    sessionStorage.setItem('userPhone', data.phone);
    sessionStorage.setItem('userAddress', data.address);
    sessionStorage.setItem('userRole', data.role);
    sessionStorage.setItem('userAvatar', data.avatar);
    sessionStorage.setItem('userOnlineStatus', data.isOnline);
    if (data.role === 'worker') {
      sessionStorage.setItem('userOccupation', data.occupation);
    }
    
    return data;
  },

  register: async (userData) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token and details in sessionStorage
    sessionStorage.setItem('userToken', data.token);
    sessionStorage.setItem('userId', data._id);
    sessionStorage.setItem('userName', data.fullName);
    sessionStorage.setItem('userEmail', data.email);
    sessionStorage.setItem('userPhone', data.phone);
    sessionStorage.setItem('userAddress', data.address);
    sessionStorage.setItem('userRole', data.role);
    sessionStorage.setItem('userAvatar', data.avatar);
    sessionStorage.setItem('userOnlineStatus', data.isOnline);
    if (data.role === 'worker') {
      sessionStorage.setItem('userOccupation', data.occupation);
    }

    return data;
  },

  getProfile: async () => {
    return request('/auth/profile');
  },

  updateOnlineStatus: async (isOnline) => {
    const data = await request('/auth/status', {
      method: 'PUT',
      body: JSON.stringify({ isOnline }),
    });
    sessionStorage.setItem('userOnlineStatus', data.isOnline);
    return data;
  },

  getWorkers: async (occupation = '') => {
    return request(`/auth/workers?occupation=${occupation}`);
  },

  // Job endpoints
  createJob: async (jobData) => {
    return request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  getJobs: async () => {
    return request('/jobs');
  },

  hireWorker: async (jobId, workerId, rate) => {
    return request(`/jobs/${jobId}/hire`, {
      method: 'PUT',
      body: JSON.stringify({ workerId, rate }),
    });
  },

  declineBid: async (jobId, bidderId) => {
    return request(`/jobs/${jobId}/decline-bid`, {
      method: 'PUT',
      body: JSON.stringify({ bidderId }),
    });
  },

  updateJobStatus: async (jobId, status) => {
    return request(`/jobs/${jobId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Review endpoints
  getReviews: async () => {
    return request('/reviews');
  },

  submitReview: async (reviewData) => {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // Contact endpoints
  submitContact: async (contactData) => {
    return request('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },

  logout: () => {
    sessionStorage.clear();
  }
};
