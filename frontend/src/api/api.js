export const api_url =
    import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v1/';

// The backend uses DRF TokenAuthentication: POST auth/login/ checks the
// password once and returns a token, and every later request carries
// "Authorization: Token <token>". This is much cheaper for the server than
// Basic auth, which re-hashes the password on every request. We keep the
// header in sessionStorage so it is gone when the tab closes.
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
    if (data && Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
        return String(data.non_field_errors[0]);
    }
    if (status === 401 || status === 403) return 'Invalid username or password.';
    return `Request failed (${status}).`;
}

// fetch wrapper: prefixes api_url, sends JSON, adds the stored auth header
// (unless the caller passes its own Authorization, or auth: false), and
// throws ApiError on non-2xx responses.
export async function apiFetch(
    path,
    { headers = {}, body, auth: withAuth = true, ...options } = {},
) {
    const auth = withAuth ? getAuthHeader() : null;
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

// Logs in with POST auth/login/ and stores the token header. Returns the
// account. Used by useLogin and useRegister.
export async function signInWithPassword(username, password) {
    const { token, user } = await apiFetch('auth/login/', {
        method: 'POST',
        body: { username, password },
        auth: false,
    });
    setAuthHeader(`Token ${token}`);
    return user;
}

// Revokes the token on the server (best effort) and forgets it locally.
export function signOut() {
    if (getAuthHeader()) {
        apiFetch('auth/logout/', { method: 'POST' }).catch(() => {
            // Offline or already expired: the local logout still happens.
        });
    }
    clearAuthHeader();
}
