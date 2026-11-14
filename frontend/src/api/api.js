export const api_url =
    import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v1/';

// The backend uses DRF BasicAuthentication, so every request carries
// "Authorization: Basic <base64 username:password>". We keep that header in
// sessionStorage so it is gone when the tab closes. If the backend moves to
// token auth, only useLogin and this file need to change.
const AUTH_KEY = 'auth_header';

export function getAuthHeader() {
    try {
        return sessionStorage.getItem(AUTH_KEY);
    } catch {
        return null;
    }
}

export function setAuthHeader(value) {
    try {
        sessionStorage.setItem(AUTH_KEY, value);
    } catch {
        // Storage blocked (private mode etc.): the user stays logged in
        // until reload only.
    }
}

export function clearAuthHeader() {
    try {
        sessionStorage.removeItem(AUTH_KEY);
    } catch {
        // Nothing to clear.
    }
}

export function basicAuthHeader(username, password) {
    // btoa only accepts Latin-1, so encode as UTF-8 bytes first.
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    return `Basic ${btoa(String.fromCharCode(...bytes))}`;
}

export class ApiError extends Error {
    constructor(status, data) {
        super(errorMessage(status, data));
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

function errorMessage(status, data) {
    if (data && typeof data.detail === 'string') return data.detail;
    if (status === 401 || status === 403) return 'Invalid username or password.';
    return `Request failed (${status}).`;
}

// fetch wrapper: prefixes api_url, sends JSON, adds the stored auth header
// (unless the caller passes its own Authorization), and throws ApiError on
// non-2xx responses.
export async function apiFetch(path, { headers = {}, body, ...options } = {}) {
    const auth = getAuthHeader();
    const response = await fetch(`${api_url}${path}`, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...(body !== undefined && { 'Content-Type': 'application/json' }),
            ...(auth && { Authorization: auth }),
            ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data =
        response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
        // Stored credentials no longer work: drop them so the app logs out.
        if (response.status === 401 && auth && !headers.Authorization) {
            clearAuthHeader();
        }
        throw new ApiError(response.status, data);
    }
    return data;
}
