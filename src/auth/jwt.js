export function getAuthHeader() {
    return { Authorization: `Bearer ${localStorage.getItem("token")}` };
};

export function getAuthToken() {
    return localStorage.getItem("token");
}

export function setAuthToken(token) {
    localStorage.setItem("token", token);
}

export function deleteAuthToken() {
    localStorage.removeItem("token");
}