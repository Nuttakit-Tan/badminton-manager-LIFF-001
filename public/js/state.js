// Global state ทั้งหมด
let currentPage = 1;
const perPage = 10;

let editingUserId = null;

let currentLots = [];
let currentProductId = null;
let currentProducts = [];

let requestLock = false;

let currentSessionId = null;
let participantUsers = [];
let participantPage = 1;
const participantPerPage = 10;

let currentMaxPlayer = null;
let currentCount = 0;

let cachedUsers = null;
let allUsers = [];
let cachedParticipants = null;
