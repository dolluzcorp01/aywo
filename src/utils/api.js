let API_BASE = "";

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    API_BASE = "http://localhost:5000"; // Local backend
} else {
    API_BASE = "https://app.dforms.in"; // Production backend
}

console.log("Base API URL:", API_BASE);

export async function apiFetch(endpoint, options = {}) {
    return fetch(`${API_BASE}${endpoint}`, {
        credentials: "include",
        ...options,
    });
}
