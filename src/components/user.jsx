"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TechLayout from "@/components/tech-layout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    fetchAllRecords,
    getSavedAuth,
    logout,
    pocketBaseFetch,
    POCKETBASE_URL,
} from "@/lib/pocketbase";
import {
    ISSUE_CATEGORIES,
    ISSUE_PRIORITIES,
    ISSUE_ROOMS,
    ISSUE_STATUS_LABELS,
} from "@/lib/issue-options";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const themeCardStyle = {
    backgroundColor: "var(--surface)",
    borderColor: "var(--line)",
    color: "var(--text)",
};

const selectClassName =
    "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground";

function getTicketImageUrl(record) {
    if (!record.zdjecie) return null;

    return `${POCKETBASE_URL}/api/files/issues/${record.id}/${encodeURIComponent(record.zdjecie)}`;
}

function getTicketStatus(status) {
    if (ISSUE_STATUS_LABELS[status]) return ISSUE_STATUS_LABELS[status];
    return status;
}

function mapTicket(record) {
    let status = "nowe";
    if (record.status) status = record.status;

    let comment = "";
    if (record.komentarz) comment = record.komentarz;

    return {
        id: record.id,
        title: record.tytul,
        description: record.opis,
        room: record.sala,
        category: record.kategoria,
        priority: record.priorytet,
        status,
        comment,
        imageUrl: getTicketImageUrl(record),
    };
}

export default function User() {
    const router = useRouter();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const userId = getSavedAuth()?.user?.id;

        async function loadTickets() {
            try {
                if (!userId) {
                    throw new Error(
                        "Nie udało się odczytać zalogowanego użytkownika. Zaloguj się ponownie."
                    );
                }

                const records = await fetchAllRecords(
                    "issues",
                    `uzytkownik = "${userId}"`
                );
                setTickets(records.map(mapTicket));
            } catch (err) {
                let message = "Nie udało się pobrać zgłoszeń.";
                if (err.message) message = err.message;
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }

        loadTickets();
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
        const userId = getSavedAuth()?.user?.id;

        if (!userId) {
            setError(
                "Nie udało się odczytać zalogowanego użytkownika. Zaloguj się ponownie."
            );
            return;
        }

        if (image instanceof File && image.size > 0) {
            if (!image.type.startsWith("image/")) {
                setError("Do zgłoszenia można dołączyć tylko plik graficzny.");
                return;
            }
            if (image.size > MAX_IMAGE_SIZE) {
                setError("Zdjęcie nie może być większe niż 5 MB.");
                return;
            }
        }

        const data = new FormData();
        data.append("tytul", input.get("tytul"));
        data.append("opis", input.get("opis"));
        data.append("sala", input.get("sala"));
        data.append("kategoria", input.get("kategoria"));
        data.append("priorytet", input.get("priorytet"));
        data.append("status", "nowe");
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
            setIsFormOpen(false);
        } catch (err) {
            let message = "Nie udało się wysłać zgłoszenia.";
            if (err.message) message = err.message;
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    let formButtonLabel = "DODAJ ZGŁOSZENIE";
    if (isFormOpen) formButtonLabel = "ANULUJ";

    let submitButtonLabel = "Wyślij zgłoszenie";
    if (isSubmitting) submitButtonLabel = "Wysyłanie...";

    let ticketContent;
    if (isLoading) {
        ticketContent = (
            <p style={{ color: "var(--muted)" }}>Ładowanie zgłoszeń...</p>
        );
    } else if (tickets.length === 0 && !isFormOpen) {
        ticketContent = (
            <div className="tech-placeholder">
                <div>
                    <div className="tech-placeholder-icon" aria-hidden="true">
                        ✧
                    </div>
                    <h3>Brak zgłoszeń do wyświetlenia</h3>
                    <p>Lista zgłoszeń pojawi się w tym miejscu.</p>
                </div>
            </div>
        );
    } else {
        ticketContent = (
            <div className="grid gap-4">
                {tickets.map((ticket) => (
                    <Card key={ticket.id} style={themeCardStyle}>
                        <CardHeader>
                            <CardTitle>{ticket.title}</CardTitle>
                            <CardDescription style={{ color: "var(--muted)" }}>
                                Sala {ticket.room} · {ticket.category} · Priorytet: {ticket.priority}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            <p className="whitespace-pre-wrap">{ticket.description}</p>
                            <p className="text-sm font-medium">
                                Status: {getTicketStatus(ticket.status)}
                            </p>
                            {ticket.comment && (
                                <p className="text-sm">
                                    Komentarz technika: {ticket.comment}
                                </p>
                            )}
                            {ticket.imageUrl && (
                                <Image
                                    src={ticket.imageUrl}
                                    alt={`Zdjęcie do zgłoszenia: ${ticket.title}`}
                                    width={960}
                                    height={720}
                                    unoptimized
                                    className="mt-1 max-h-96 w-auto max-w-full rounded-lg border object-contain"
                                    style={{ borderColor: "var(--line)" }}
                                />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
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
                    {formButtonLabel}
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

                            <div className="grid gap-2">
                                <Label htmlFor="sala">Sala</Label>
                                <select
                                    id="sala"
                                    name="sala"
                                    className={selectClassName}
                                    defaultValue=""
                                    required
                                >
                                    <option value="" disabled>
                                        Wybierz salę
                                    </option>
                                    {ISSUE_ROOMS.map((room) => (
                                        <option key={room} value={room}>
                                            {room}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="kategoria">Kategoria</Label>
                                <select
                                    id="kategoria"
                                    name="kategoria"
                                    className={selectClassName}
                                    defaultValue=""
                                    required
                                >
                                    <option value="" disabled>
                                        Wybierz kategorię
                                    </option>
                                    {ISSUE_CATEGORIES.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="priorytet">Priorytet</Label>
                                <select
                                    id="priorytet"
                                    name="priorytet"
                                    className={selectClassName}
                                    defaultValue=""
                                    required
                                >
                                    <option value="" disabled>
                                        Wybierz priorytet
                                    </option>
                                    {ISSUE_PRIORITIES.map((priority) => (
                                        <option key={priority} value={priority}>
                                            {priority}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="zdjecie">
                                    Zdjęcie usterki (opcjonalnie, maks. 5 MB)
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
                                {submitButtonLabel}
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

            {ticketContent}
        </TechLayout>
    );
}
