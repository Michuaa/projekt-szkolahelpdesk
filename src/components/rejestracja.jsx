"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TechLayout from "@/components/tech-layout";
import { register } from "@/lib/pocketbase";

export default function Rejestracja() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const form = event.currentTarget;
        const formData = new FormData(form);
        const password = formData.get("password");

        if (password !== formData.get("confirmPassword")) {
            setError("Podane hasła nie są takie same.");
            return;
        }

        setBusy(true);
        try {
            const auth = await register({
                name: formData.get("name"),
                email: formData.get("email"),
                password,
            });
            if (auth.user.czyTechnik) {
                router.push("/techpanel");
            } else {
                router.push("/userpanel");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <TechLayout
            brandSubtitle="Dostęp do systemu"
            eyebrow="Dołącz do nas"
            title="Utwórz konto"
            subtitle="Panel szkolnego helpdesku"
            sectionTitle="Dane konta"
            sectionMeta="Nowy użytkownik"
        >
            <form className="tech-form" onSubmit={handleSubmit}>
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
                {error && (
                    <p role="alert" className="tech-form-note">
                        {error}
                    </p>
                )}
                <button className="tech-static-button" disabled={busy}>
                    {busy && "Tworzenie konta..."}
                    {!busy && "Utwórz konto"}
                </button>
                <p className="tech-form-note">
                    Masz już konto?{" "}
                    <Link className="tech-link" href="/">
                        Zaloguj się
                    </Link>
                </p>
            </form>
        </TechLayout>
    );
}