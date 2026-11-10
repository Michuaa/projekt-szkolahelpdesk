export const POCKETBASE_URL =
    "https://pocketbase.admin.mp.zs1mm.edu.pl";

const AUTH_KEY = "helpdesk-auth";

export function getSavedAuth() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch {
        return null;
    }
}

function saveAuth(data) {
    const user = data.record ?? data.model;
    const auth = { token: data.token, user };
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    return auth;
}

export async function login(email, password) {
    const response = await fetch(
        `${POCKETBASE_URL}/api/collections/users/auth-with-password`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identity: email, password }),
        }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Logowanie nie powiodło się.");

    return saveAuth(data);
}

export async function register({ name, email, password }) {
    const response = await fetch(
        `${POCKETBASE_URL}/api/collections/users/records`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                email,
                password,
                passwordConfirm: password,
                czyTechnik: false,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        const fieldErrors = Object.entries(data.data || {})
            .map(([field, details]) => `${field}: ${details.message}`)
            .join("; ");

        throw new Error(fieldErrors || data.message || "Rejestracja nie powiodła się.");
    }

    return login(email, password);
}

export function logout() {
    localStorage.removeItem(AUTH_KEY);
}

export async function pocketBaseFetch(path, options = {}) {
    const auth = getSavedAuth();
    const headers = new Headers(options.headers || {});

    if (auth?.token) headers.set("Authorization", auth.token);

    const response = await fetch(`${POCKETBASE_URL}${path}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Wystąpił błąd.");

    return data;
}