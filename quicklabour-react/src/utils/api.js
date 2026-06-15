let apiEnvUrl = import.meta.env.VITE_API_URL;
if (!apiEnvUrl) {
  apiEnvUrl = '/api';
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    if (window.location.port !== '5000') {
      apiEnvUrl = 'http://localhost:5000/api';
    }
  }
}
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
  login: async (email, password, role) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
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
    sessionStorage.setItem('userPermissions', JSON.stringify(data.permissions || []));
    sessionStorage.setItem('userWalletBalance', data.walletBalance !== undefined ? data.walletBalance : 0);
    if (data.createdAt) {
      sessionStorage.setItem('userCreatedAt', data.createdAt);
    }
    if (data.role === 'worker') {
      sessionStorage.setItem('userOccupation', data.occupation);
      sessionStorage.setItem('userPoints', data.points !== undefined ? data.points : 0);
      sessionStorage.setItem('userAcceptedJobs', data.acceptedJobsCount !== undefined ? data.acceptedJobsCount : 0);
      sessionStorage.setItem('userJobsCompleted', data.jobsCompleted !== undefined ? data.jobsCompleted : 0);
      sessionStorage.setItem('userRating', data.rating !== undefined ? data.rating : 0);
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
    sessionStorage.setItem('userPermissions', JSON.stringify(data.permissions || []));
    sessionStorage.setItem('userWalletBalance', data.walletBalance !== undefined ? data.walletBalance : 0);
    if (data.createdAt) {
      sessionStorage.setItem('userCreatedAt', data.createdAt);
    }
    if (data.role === 'worker') {
      sessionStorage.setItem('userOccupation', data.occupation);
      sessionStorage.setItem('userPoints', data.points !== undefined ? data.points : 0);
      sessionStorage.setItem('userAcceptedJobs', data.acceptedJobsCount !== undefined ? data.acceptedJobsCount : 0);
      sessionStorage.setItem('userJobsCompleted', data.jobsCompleted !== undefined ? data.jobsCompleted : 0);
      sessionStorage.setItem('userRating', data.rating !== undefined ? data.rating : 0);
    }

    return data;
  },

  getProfile: async () => {
    const data = await request('/auth/profile');
    sessionStorage.setItem('userWalletBalance', data.walletBalance !== undefined ? data.walletBalance : 0);
    if (data.createdAt) {
      sessionStorage.setItem('userCreatedAt', data.createdAt);
    }
    if (data.role === 'worker') {
      sessionStorage.setItem('userPoints', data.points !== undefined ? data.points : 0);
      sessionStorage.setItem('userAcceptedJobs', data.acceptedJobsCount !== undefined ? data.acceptedJobsCount : 0);
      sessionStorage.setItem('userJobsCompleted', data.jobsCompleted !== undefined ? data.jobsCompleted : 0);
      sessionStorage.setItem('userRating', data.rating !== undefined ? data.rating : 0);
    }
    return data;
  },

  updateProfile: async (profileData) => {
    const data = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    if (data.fullName) sessionStorage.setItem('userName', data.fullName);
    if (data.phone) sessionStorage.setItem('userPhone', data.phone);
    if (data.address) sessionStorage.setItem('userAddress', data.address);
    if (data.avatar) sessionStorage.setItem('userAvatar', data.avatar);
    if (data.occupation !== undefined) sessionStorage.setItem('userOccupation', data.occupation);
    if (data.latitude !== undefined) sessionStorage.setItem('userLatitude', data.latitude);
    if (data.longitude !== undefined) sessionStorage.setItem('userLongitude', data.longitude);
    sessionStorage.setItem('userWalletBalance', data.walletBalance !== undefined ? data.walletBalance : 0);
    if (data.createdAt) {
      sessionStorage.setItem('userCreatedAt', data.createdAt);
    }
    if (data.role === 'worker') {
      sessionStorage.setItem('userPoints', data.points !== undefined ? data.points : 0);
      sessionStorage.setItem('userAcceptedJobs', data.acceptedJobsCount !== undefined ? data.acceptedJobsCount : 0);
      sessionStorage.setItem('userJobsCompleted', data.jobsCompleted !== undefined ? data.jobsCompleted : 0);
      sessionStorage.setItem('userRating', data.rating !== undefined ? data.rating : 0);
    }
    return data;
  },

  subscribe: async (planType) => {
    const data = await request('/auth/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planType }),
    });
    if (data.user) {
      sessionStorage.setItem('userPoints', data.user.points !== undefined ? data.user.points : 0);
      sessionStorage.setItem('userAcceptedJobs', data.user.acceptedJobsCount !== undefined ? data.user.acceptedJobsCount : 0);
    }
    return data;
  },

  updateOnlineStatus: async (isOnline) => {
    const data = await request('/auth/status', {
      method: 'PUT',
      body: JSON.stringify({ isOnline }),
    });
    sessionStorage.setItem('userOnlineStatus', data.isOnline);
    return data;
  },

  addWalletMoney: async (amount, method) => {
    const data = await request('/auth/wallet/add', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
    sessionStorage.setItem('userWalletBalance', data.walletBalance !== undefined ? data.walletBalance : 0);
    return data;
  },

  transferWalletMoney: async (workerId, amount) => {
    const data = await request('/auth/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify({ workerId, amount }),
    });
    sessionStorage.setItem('userWalletBalance', data.walletBalance !== undefined ? data.walletBalance : 0);
    return data;
  },

  rechargePointsWallet: async (planType) => {
    const data = await request('/auth/recharge-points-wallet', {
      method: 'POST',
      body: JSON.stringify({ planType }),
    });
    sessionStorage.setItem('userWalletBalance', data.walletBalance !== undefined ? data.walletBalance : 0);
    sessionStorage.setItem('userPoints', data.updatedPoints !== undefined ? data.updatedPoints : 0);
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

  completeJob: async (jobId, rating, reviewText, paymentMode, onlineMethod) => {
    return request(`/jobs/${jobId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ rating, reviewText, paymentMode, onlineMethod }),
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
  },

  createPaymentIntent: async (planType) => {
    return request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ planType }),
    });
  },

  verifyPaymentAndCredit: async (intentId, planType, isSimulated) => {
    return request('/payments/verify-and-credit', {
      method: 'POST',
      body: JSON.stringify({ intentId, planType, isSimulated }),
    });
  }
};

export const LABOUR_INDUSTRIES = {
  "Construction Labour": {
    icon: "🏗️",
    specialties: [
      { name: "Construction Labour", visitCharge: 80, baseRate: 600, desc: "Manual sites help, material loading" },
      { name: "Mason", visitCharge: 80, baseRate: 850, desc: "Brick laying, plastering, flooring" },
      { name: "Carpenter", visitCharge: 80, baseRate: 750, desc: "Furniture, doors, wood fittings" },
      { name: "Electrician", visitCharge: 80, baseRate: 800, desc: "Wiring, switches, appliance repairs" },
      { name: "Plumber", visitCharge: 80, baseRate: 700, desc: "Leakages, pipes, taps & faucets" },
      { name: "Welder", visitCharge: 80, baseRate: 900, desc: "Metal work, grills, fabrication" },
      { name: "Painter", visitCharge: 80, baseRate: 650, desc: "Wall painting, textures, polishing" },
      { name: "Tile worker", visitCharge: 80, baseRate: 850, desc: "Marble, granite, tiles installation" },
      { name: "Steel fixer", visitCharge: 80, baseRate: 800, desc: "Steel rebars, concrete foundations structural support" },
      { name: "Concrete worker", visitCharge: 80, baseRate: 800, desc: "Mixing, pouring, cement smoothing" },
      { name: "Scaffolder", visitCharge: 80, baseRate: 850, desc: "Temporary structure framework mounting" }
    ]
  },
  "Factory / Industrial Labour": {
    icon: "🏭",
    specialties: [
      { name: "Machine operator", visitCharge: 80, baseRate: 750, desc: "Machine operations, settings, tools" },
      { name: "Assembly line worker", visitCharge: 60, baseRate: 600, desc: "Fittings, components assembly" },
      { name: "Packaging worker", visitCharge: 50, baseRate: 500, desc: "Goods boxing, packaging, labelling" },
      { name: "Warehouse loader", visitCharge: 60, baseRate: 600, desc: "Cargo loading, unloading, stacking" },
      { name: "Forklift operator", visitCharge: 80, baseRate: 850, desc: "Licensed forklift vehicle controls" },
      { name: "Quality checker", visitCharge: 80, baseRate: 750, desc: "Manufacturing inspections, defect analysis" }
    ]
  },
  "Agricultural Labour": {
    icon: "🌾",
    specialties: [
      { name: "Farmer helper", visitCharge: 50, baseRate: 500, desc: "Ploughing, field work, sowing seeds" },
      { name: "Harvester", visitCharge: 60, baseRate: 550, desc: "Crops harvesting, cutting, packing" },
      { name: "Dairy worker", visitCharge: 50, baseRate: 500, desc: "Cattle feeding, milking, farm support" },
      { name: "Irrigation worker", visitCharge: 60, baseRate: 550, desc: "Water pipelines, fields watering" },
      { name: "Tractor operator", visitCharge: 80, baseRate: 750, desc: "Tractor driving, field harvesting" }
    ]
  },
  "Transport & Delivery": {
    icon: "🚚",
    specialties: [
      { name: "Truck helper", visitCharge: 50, baseRate: 500, desc: "Truck co-driver, loading support" },
      { name: "Delivery worker", visitCharge: 50, baseRate: 450, desc: "E-commerce/food express deliveries" },
      { name: "Driver", visitCharge: 80, baseRate: 600, desc: "Personal/commercial driving service" },
      { name: "Loader/unloader", visitCharge: 50, baseRate: 550, desc: "Goods loading & shipping transport" }
    ]
  },
  "Cleaning & Maintenance": {
    icon: "🧹",
    specialties: [
      { name: "Sweeper", visitCharge: 50, baseRate: 400, desc: "Floor sweeping, street cleanliness" },
      { name: "Housekeeping staff", visitCharge: 50, baseRate: 450, desc: "Offices, hotels, homes clean up" },
      { name: "Garbage collector", visitCharge: 50, baseRate: 450, desc: "Waste collection, bin disposals" },
      { name: "Maintenance worker", visitCharge: 60, baseRate: 650, desc: "General building fixtures repair" }
    ]
  },
  "Domestic Labour": {
    icon: "🏠",
    specialties: [
      { name: "Cook", visitCharge: 60, baseRate: 600, desc: "Daily home meals preparation" },
      { name: "Maid", visitCharge: 50, baseRate: 450, desc: "Cleaning, washing, dishes, household" },
      { name: "Caretaker", visitCharge: 80, baseRate: 700, desc: "Elderly care, patient care, security" },
      { name: "Babysitter", visitCharge: 70, baseRate: 600, desc: "Child care, play hours supervisions" }
    ]
  },
  "Skilled Technical Labour": {
    icon: "⚙️",
    specialties: [
      { name: "HVAC technician", visitCharge: 100, baseRate: 900, desc: "Heating, cooling, ventilation work" },
      { name: "Mechanic", visitCharge: 80, baseRate: 850, desc: "Cars, bikes, vehicles mechanical repairs" },
      { name: "Mobile repair technician", visitCharge: 80, baseRate: 750, desc: "Smartphones, electronics, screens replacement" },
      { name: "AC repair worker", visitCharge: 100, baseRate: 850, desc: "AC gas filling, filter cleaning, servicing" }
    ]
  },
  "Daily Wage / General Labour": {
    icon: "👷",
    specialties: [
      { name: "Helper", visitCharge: 50, baseRate: 450, desc: "Assistant helper, daily household support" },
      { name: "Road worker", visitCharge: 50, baseRate: 500, desc: "Roadway construction, repairs crew" },
      { name: "Excavation worker", visitCharge: 60, baseRate: 600, desc: "Soil digging, trenching support" },
      { name: "Security guard", visitCharge: 80, baseRate: 600, desc: "Gated society, building watchman" }
    ]
  },
  "Mining & Heavy Work": {
    icon: "⛏️",
    specialties: [
      { name: "Miner", visitCharge: 100, baseRate: 1000, desc: "Underground minerals mining drills" },
      { name: "Drilling worker", visitCharge: 100, baseRate: 950, desc: "Borewells, concrete drilling ops" },
      { name: "Crane operator", visitCharge: 120, baseRate: 1100, desc: "Licensed heavy crane controls support" }
    ]
  }
};
