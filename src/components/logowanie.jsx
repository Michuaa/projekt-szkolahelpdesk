"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TechLayout from "@/components/tech-layout";
import { login } from "@/lib/pocketbase";

export default function Logowanie() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setBusy(true);
        setError("");

        const formData = new FormData(event.currentTarget);

        try {
            const auth = await login(
                formData.get("email"),
                formData.get("password")
            );
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
            eyebrow="Witaj ponownie"
            title="Zaloguj się"
            subtitle="Panel szkolnego helpdesku"
            sectionTitle="Dane logowania"
            sectionMeta="Konto użytkownika"
        >
            <form className="tech-form" onSubmit={handleSubmit}>
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
                {error && (
                    <p role="alert" className="tech-form-note">
                        {error}
                    </p>
                )}
                <button className="tech-static-button" disabled={busy}>
                    {busy && "Logowanie..."}
                    {!busy && "Zaloguj się"}
                </button>
                <p className="tech-form-note">
                    Nie masz konta?{" "}
                    <Link className="tech-link" href="/rejestracja">
                        Zarejestruj się
                    </Link>
                </p>
            </form>
        </TechLayout>
    );
}