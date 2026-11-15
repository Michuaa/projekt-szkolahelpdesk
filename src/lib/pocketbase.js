import PocketBase from "pocketbase";

export const ADRES_POCKETBASE =
    process.env.NEXT_PUBLIC_POCKETBASE_URL?.replace(/\/+$/, "") || "";

const KLUCZ_UWIERZYTELNIENIA = "helpdesk-auth";
let klientPocketBase;

function pobierzSkonfigurowanyAdres() {
    if (!ADRES_POCKETBASE) {
        throw new Error(
            "Brak konfiguracji PocketBase. Ustaw NEXT_PUBLIC_POCKETBASE_URL."
        );
    }

    return ADRES_POCKETBASE;
}

export function pobierzKlientaPocketBase() {
    const adres = pobierzSkonfigurowanyAdres();
    if (!klientPocketBase) {
        klientPocketBase = new PocketBase(adres);
    }

    let daneUwierzytelnienia = null;
    try {
        daneUwierzytelnienia = JSON.parse(
            localStorage.getItem(KLUCZ_UWIERZYTELNIENIA) || "null"
        );
    } catch {
        daneUwierzytelnienia = null;
    }

    if (daneUwierzytelnienia?.token && daneUwierzytelnienia?.user) {
        if (klientPocketBase.authStore.token !== daneUwierzytelnienia.token) {
            klientPocketBase.authStore.save(
                daneUwierzytelnienia.token,
                daneUwierzytelnienia.user
            );
        }
    } else if (klientPocketBase.authStore.token) {
        klientPocketBase.authStore.clear();
    }

    return klientPocketBase;
}

export function pobierzZapisaneUwierzytelnienie() {
    try {
        return JSON.parse(
            localStorage.getItem(KLUCZ_UWIERZYTELNIENIA) || "null"
        );
    } catch {
        return null;
    }
}

function zapiszUwierzytelnienie(dane) {
    const uzytkownik = dane.record ?? dane.model;
    const uwierzytelnienie = { token: dane.token, user: uzytkownik };
    localStorage.setItem(
        KLUCZ_UWIERZYTELNIENIA,
        JSON.stringify(uwierzytelnienie)
    );
    if (klientPocketBase) {
        klientPocketBase.authStore.save(dane.token, uzytkownik);
    }
    return uwierzytelnienie;
}

async function odczytajOdpowiedz(odpowiedzHttp, komunikatZapasowy) {
    let daneOdpowiedzi;

    try {
        daneOdpowiedzi = await odpowiedzHttp.json();
    } catch {
        if (!odpowiedzHttp.ok) {
            throw new Error(
                `${komunikatZapasowy} (HTTP ${odpowiedzHttp.status}; PocketBase nie zwrócił poprawnej odpowiedzi JSON).`
            );
        }
        throw new Error("PocketBase zwrócił nieprawidłową odpowiedź.");
    }

    if (!odpowiedzHttp.ok) {
        const bledyPol = [];
        for (const [nazwaPola, szczegoly] of Object.entries(
            daneOdpowiedzi.data || {}
        )) {
            if (szczegoly?.message) {
                bledyPol.push(`${nazwaPola}: ${szczegoly.message}`);
            }
        }

        let komunikatBledu = bledyPol.join("; ");
        if (
            odpowiedzHttp.status === 400 &&
            daneOdpowiedzi.message === "Failed to authenticate."
        ) {
            komunikatBledu =
                "Nieprawidłowy e-mail lub hasło albo konto nie istnieje w kolekcji users. Sprawdź dane logowania i konto w PocketBase.";
        } else if (!komunikatBledu) {
            komunikatBledu = daneOdpowiedzi.message || komunikatZapasowy;
        }

        throw new Error(`${komunikatBledu} (HTTP ${odpowiedzHttp.status})`);
    }

    return daneOdpowiedzi;
}

export async function zalogujUzytkownika(adresEmail, haslo) {
    const adres = pobierzSkonfigurowanyAdres();
    let tozsamosc = "";
    if (typeof adresEmail === "string") {
        tozsamosc = adresEmail.trim();
    }

    const odpowiedzHttp = await fetch(
        `${adres}/api/collections/users/auth-with-password`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identity: tozsamosc, password: haslo }),
        }
    );

    const daneOdpowiedzi = await odczytajOdpowiedz(
        odpowiedzHttp,
        "Logowanie nie powiodło się."
    );
    return zapiszUwierzytelnienie(daneOdpowiedzi);
}

export async function zarejestrujUzytkownika({
    name: imie,
    email: adresEmail,
    password: haslo,
}) {
    const adres = pobierzSkonfigurowanyAdres();
    const odpowiedzHttp = await fetch(
        `${adres}/api/collections/users/records`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: imie,
                email: adresEmail,
                password: haslo,
                passwordConfirm: haslo,
                czyTechnik: false,
            }),
        }
    );

    await odczytajOdpowiedz(odpowiedzHttp, "Rejestracja nie powiodła się.");
    return zalogujUzytkownika(adresEmail, haslo);
}

export function wylogujUzytkownika() {
    localStorage.removeItem(KLUCZ_UWIERZYTELNIENIA);
    if (klientPocketBase) klientPocketBase.authStore.clear();
}

export async function wykonajZapytaniePocketBase(sciezka, opcje = {}) {
    const adres = pobierzSkonfigurowanyAdres();
    const uwierzytelnienie = pobierzZapisaneUwierzytelnienie();
    const naglowki = new Headers(opcje.headers || {});

    if (uwierzytelnienie?.token) {
        naglowki.set("Authorization", uwierzytelnienie.token);
    }

    const odpowiedzHttp = await fetch(`${adres}${sciezka}`, {
        ...opcje,
        headers: naglowki,
    });

    const daneOdpowiedzi = await odpowiedzHttp.json().catch(() => ({}));
    if (!odpowiedzHttp.ok) {
        throw new Error(daneOdpowiedzi.message || "Wystąpił błąd.");
    }

    return daneOdpowiedzi;
}

export async function pobierzWszystkieRekordy(kolekcja, filtr) {
    const rekordy = [];
    let numerStrony = 1;
    let liczbaStron = 1;

    do {
        const parametryZapytania = new URLSearchParams({
            page: String(numerStrony),
            perPage: "200",
            sort: "-created",
        });

        if (filtr) parametryZapytania.set("filter", filtr);

        const wynikZapytania = await wykonajZapytaniePocketBase(
            `/api/collections/${kolekcja}/records?${parametryZapytania.toString()}`
        );
        rekordy.push(...(wynikZapytania.items || []));
        liczbaStron = wynikZapytania.totalPages || 1;
        numerStrony += 1;
    } while (numerStrony <= liczbaStron);

    return rekordy;
}