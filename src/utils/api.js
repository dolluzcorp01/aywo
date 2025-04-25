const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";

export async function apiFetch(endpoint, options = {}) {
    return fetch(`${API_BASE}${endpoint}`, {
        credentials: "include",
        ...options,
    });
}
