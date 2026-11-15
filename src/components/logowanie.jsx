"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UkladPanelu from "@/components/tech-layout";
import { zalogujUzytkownika } from "@/lib/pocketbase";

export default function Logowanie() {
    const nawigator = useRouter();
    const [komunikatBledu, ustawKomunikatBledu] = useState("");
    const [czyTrwaLogowanie, ustawCzyTrwaLogowanie] = useState(false);

    async function obsluzWyslanieFormularza(zdarzenie) {
        zdarzenie.preventDefault();
        ustawCzyTrwaLogowanie(true);
        ustawKomunikatBledu("");

        const daneFormularza = new FormData(zdarzenie.currentTarget);

        try {
            const uwierzytelnienie = await zalogujUzytkownika(
                daneFormularza.get("email"),
                daneFormularza.get("password")
            );
            if (uwierzytelnienie.user.czyTechnik) {
                nawigator.push("/techpanel");
            } else {
                nawigator.push("/userpanel");
            }
        } catch (blad) {
            ustawKomunikatBledu(blad.message);
        } finally {
            ustawCzyTrwaLogowanie(false);
        }
    }

    return (
        <UkladPanelu
            podtytulMarki="Dostęp do systemu"
            nadtytul="Witaj ponownie"
            tytul="Zaloguj się"
            podtytul="Panel szkolnego helpdesku"
            tytulSekcji="Dane logowania"
            metadaneSekcji="Konto użytkownika"
        >
            <form className="tech-form" onSubmit={obsluzWyslanieFormularza}>
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
                        autoComplete="current-password"
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
                    disabled={czyTrwaLogowanie}
                >
                    {czyTrwaLogowanie && "Logowanie..."}
                    {!czyTrwaLogowanie && "Zaloguj się"}
                </button>
                <p className="tech-form-note">
                    Nie masz konta?{" "}
                    <Link className="tech-link" href="/rejestracja">
                        Zarejestruj się
                    </Link>
                </p>
            </form>
        </UkladPanelu>
    );
}