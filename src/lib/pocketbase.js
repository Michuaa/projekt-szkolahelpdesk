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

async function readResponse(response, fallbackMessage) {
    let data;

    try {
        data = await response.json();
    } catch {
        if (!response.ok) {
            throw new Error(
                `${fallbackMessage} (HTTP ${response.status}; PocketBase nie zwrócił poprawnej odpowiedzi JSON).`
            );
        }
        throw new Error("PocketBase zwrócił nieprawidłową odpowiedź.");
    }

    if (!response.ok) {
        const fieldErrors = [];
        for (const [field, details] of Object.entries(data.data || {})) {
            if (details?.message) {
                fieldErrors.push(`${field}: ${details.message}`);
            }
        }

        let message = fieldErrors.join("; ");
        if (
            response.status === 400 &&
            data.message === "Failed to authenticate."
        ) {
            message =
                "Nieprawidłowy e-mail lub hasło albo konto nie istnieje w kolekcji users. Sprawdź dane logowania i konto w PocketBase.";
        } else if (!message) {
            message = data.message || fallbackMessage;
        }

        throw new Error(`${message} (HTTP ${response.status})`);
    }

    return data;
}

export async function login(email, password) {
    let identity = "";
    if (typeof email === "string") {
        identity = email.trim();
    }

    const response = await fetch(
        `${POCKETBASE_URL}/api/collections/users/auth-with-password`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identity, password }),
        }
    );

    const data = await readResponse(response, "Logowanie nie powiodło się.");
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

    await readResponse(response, "Rejestracja nie powiodła się.");
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

export async function fetchAllRecords(collection, filter) {
    const records = [];
    let page = 1;
    let totalPages = 1;

    do {
        const query = new URLSearchParams({
            page: String(page),
            perPage: "200",
            sort: "-created",
        });

        if (filter) query.set("filter", filter);

        const result = await pocketBaseFetch(
            `/api/collections/${collection}/records?${query.toString()}`
        );
        records.push(...(result.items || []));
        totalPages = result.totalPages || 1;
        page += 1;
    } while (page <= totalPages);

    return records;
}