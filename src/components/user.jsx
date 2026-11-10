"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TechLayout from "@/components/tech-layout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    getSavedAuth,
    logout,
    pocketBaseFetch,
    POCKETBASE_URL,
} from "@/lib/pocketbase";

const themeCardStyle = {
    backgroundColor: "var(--surface)",
    borderColor: "var(--line)",
    color: "var(--text)",
};

function mapTicket(record) {
    return {
        id: record.id,
        title: record.tytul,
        description: record.opis,
        isUrgent: record.czy_pilne,
        imageName: record.zdjecie || null,
        imageUrl: record.zdjecie
            ? `${POCKETBASE_URL}/api/files/issues/${record.id}/${encodeURIComponent(record.zdjecie)}`
            : null,
    };
}

export default function User() {
    const router = useRouter();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        pocketBaseFetch(
            "/api/collections/issues/records?sort=-created&perPage=100"
        )
            .then((data) => setTickets((data.items || []).map(mapTicket)))
            .catch((err) => setError(err.message))
            .finally(() => setIsLoading(false));
    }, []);

    function handleLogout() {
        logout();
        router.replace("/");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const input = new FormData(form);
        const image = input.get("zdjecie");
        const auth = getSavedAuth();
        const userId = auth?.user?.id;

        if (!userId) {
            setError(
                "Nie udało się odczytać zalogowanego użytkownika. Zaloguj się ponownie."
            );
            return;
        }

        const data = new FormData();
        data.append("tytul", input.get("tytul"));
        data.append("opis", input.get("opis"));
        data.append("czy_pilne", String(isUrgent));
        data.append("uzytkownik", userId);

        if (image instanceof File && image.size > 0) {
            data.append("zdjecie", image);
        }

        setIsSubmitting(true);
        setError("");

        try {
            const record = await pocketBaseFetch(
                "/api/collections/issues/records",
                {
                    method: "POST",
                    body: data,
                }
            );

            setTickets((current) => [mapTicket(record), ...current]);
            form.reset();
            setIsUrgent(false);
            setIsFormOpen(false);
        } catch (err) {
            setError(err.message || "Nie udało się wysłać zgłoszenia.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <TechLayout
            brandSubtitle="Panel użytkownika"
            title="Zgłoszenia"
            subtitle="Przestrzeń użytkownika"
            sectionTitle="Moje zgłoszenia"
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <Button
                    type="button"
                    onClick={() => {
                        setIsFormOpen((open) => !open);
                        setError("");
                    }}
                >
                    {isFormOpen ? "ANULUJ" : "DODAJ ZGŁOSZENIE"}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--line)",
                        color: "var(--text)",
                    }}
                    onClick={handleLogout}
                >
                    Wyloguj się
                </Button>
            </div>

            {isFormOpen && (
                <Card className="mb-6" style={themeCardStyle}>
                    <CardHeader>
                        <CardTitle>Nowe zgłoszenie</CardTitle>
                        <CardDescription style={{ color: "var(--muted)" }}>
                            Opisz problem. Zdjęcie jest opcjonalne.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-5" onSubmit={handleSubmit}>
                            <div className="grid gap-2">
                                <Label htmlFor="tytul">Tytuł</Label>
                                <Input
                                    id="tytul"
                                    name="tytul"
                                    placeholder="Np. Problem z drukarką"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="opis">Opis</Label>
                                <Textarea
                                    id="opis"
                                    name="opis"
                                    placeholder="Opisz, na czym polega problem..."
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="czy_pilne"
                                    checked={isUrgent}
                                    onCheckedChange={(checked) =>
                                        setIsUrgent(checked === true)
                                    }
                                />
                                <Label htmlFor="czy_pilne">
                                    Zgłoszenie pilne
                                </Label>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="zdjecie">
                                    Zdjęcie (opcjonalnie)
                                </Label>
                                <Input
                                    id="zdjecie"
                                    name="zdjecie"
                                    type="file"
                                    accept="image/*"
                                />
                            </div>

                            {error && (
                                <p role="alert" className="text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? "Wysyłanie..."
                                    : "Wyślij zgłoszenie"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!isFormOpen && error && (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {error}
                </p>
            )}

            {isLoading ? (
                <p style={{ color: "var(--muted)" }}>
                    Ładowanie zgłoszeń...
                </p>
            ) : tickets.length === 0 && !isFormOpen ? (
                <div className="tech-placeholder">
                    <div>
                        <div
                            className="tech-placeholder-icon"
                            aria-hidden="true"
                        >
                            ✧
                        </div>
                        <h3>Brak zgłoszeń do wyświetlenia</h3>
                        <p>Lista zgłoszeń pojawi się w tym miejscu.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tickets.map((ticket) => (
                        <Card key={ticket.id} style={themeCardStyle}>
                            <CardHeader>
                                <CardTitle>{ticket.title}</CardTitle>
                                <CardDescription
                                    style={{ color: "var(--muted)" }}
                                >
                                    {ticket.isUrgent ? "Pilne" : "Standardowe"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">
                                    {ticket.description}
                                </p>
                              {ticket.imageUrl && (
    <img
        src={ticket.imageUrl}
        alt={`Zdjęcie do zgłoszenia: ${ticket.title}`}
        className="mt-3 max-h-96 w-auto max-w-full rounded-lg border object-contain"
        style={{ borderColor: "var(--line)" }}
    />
)}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TechLayout>
    );
}