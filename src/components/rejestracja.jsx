"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UkladPanelu from "@/components/tech-layout";
import { zarejestrujUzytkownika } from "@/lib/pocketbase";

export default function Rejestracja() {
    const nawigator = useRouter();
    const [komunikatBledu, ustawKomunikatBledu] = useState("");
    const [czyTrwaRejestracja, ustawCzyTrwaRejestracja] = useState(false);

    async function obsluzWyslanieFormularza(zdarzenie) {
        zdarzenie.preventDefault();
        ustawKomunikatBledu("");

        const formularz = zdarzenie.currentTarget;
        const daneFormularza = new FormData(formularz);
        const haslo = daneFormularza.get("password");

        if (haslo !== daneFormularza.get("confirmPassword")) {
            ustawKomunikatBledu("Podane hasła nie są takie same.");
            return;
        }

        ustawCzyTrwaRejestracja(true);
        try {
            const uwierzytelnienie = await zarejestrujUzytkownika({
                name: daneFormularza.get("name"),
                email: daneFormularza.get("email"),
                password: haslo,
            });
            if (uwierzytelnienie.user.czyTechnik) {
                nawigator.push("/techpanel");
            } else {
                nawigator.push("/userpanel");
            }
        } catch (blad) {
            ustawKomunikatBledu(blad.message);
        } finally {
            ustawCzyTrwaRejestracja(false);
        }
    }

    return (
        <UkladPanelu
            podtytulMarki="Dostęp do systemu"
            nadtytul="Dołącz do nas"
            tytul="Utwórz konto"
            podtytul="Panel szkolnego helpdesku"
            tytulSekcji="Dane konta"
            metadaneSekcji="Nowy użytkownik"
        >
            <form className="tech-form" onSubmit={obsluzWyslanieFormularza}>
                <label className="tech-field">
                    <span className="tech-label">Imię i nazwisko</span>
                    <input
                        className="tech-input"
                        name="name"
                        autoComplete="name"
                        required
                    />
                </label>
                <label className="tech-field">
                    <span className="tech-label">E-mail</span>
                    <input
                        className="tech-input"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                    />
                </label>
                <label className="tech-field">
                    <span className="tech-label">Hasło</span>
                    <input
                        className="tech-input"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                    />
                </label>
                <label className="tech-field">
                    <span className="tech-label">Powtórz hasło</span>
                    <input
                        className="tech-input"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                    />
                </label>
                {komunikatBledu && (
                    <p role="alert" className="tech-form-note">
                        {komunikatBledu}
                    </p>
                )}
                <button
                    className="tech-static-button"
                    disabled={czyTrwaRejestracja}
                >
                    {czyTrwaRejestracja && "Tworzenie konta..."}
                    {!czyTrwaRejestracja && "Utwórz konto"}
                </button>
                <p className="tech-form-note">
                    Masz już konto?{" "}
                    <Link className="tech-link" href="/">
                        Zaloguj się
                    </Link>
                </p>
            </form>
        </UkladPanelu>
    );
}