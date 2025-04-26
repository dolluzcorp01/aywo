const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";

console.log("Base API URL:", API_BASE); // ✅ This will help you debug if .env is being read
console.log(process.env.REACT_APP_API);

export async function apiFetch(endpoint, options = {}) {
    return fetch(`${API_BASE}${endpoint}`, {
        credentials: "include",
        ...options,
    });
}
