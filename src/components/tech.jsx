"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TechLayout from "@/components/tech-layout";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    logout,
    pocketBaseFetch,
    POCKETBASE_URL,
} from "@/lib/pocketbase";

export default function Tech() {
    const router = useRouter();
    const [tickets, setTickets] = useState([]);
    const [view, setView] = useState("active");
    const [expandedId, setExpandedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");

    const loadTickets = useCallback(async () => {
        try {
            setError("");
            const result = await pocketBaseFetch(
                "/api/collections/issues/records?sort=-created&perPage=200"
            );
            setTickets(result.items || []);
        } catch (err) {
            setError(err.message || "Nie udało się pobrać zgłoszeń.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    function handleLogout() {
        logout();
        router.replace("/");
    }

    async function updateTicket(ticket, changes) {
        setBusyId(ticket.id);
        setError("");

        try {
            const updated = await pocketBaseFetch(
                `/api/collections/issues/records/${ticket.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(changes),
                }
            );

            setTickets((current) =>
                current.map((item) =>
                    item.id === updated.id ? updated : item
                )
            );
        } catch (err) {
            setError(err.message || "Nie udało się zaktualizować zgłoszenia.");
        } finally {
            setBusyId("");
        }
    }

    const visibleTickets = tickets
        .filter((ticket) =>
            view === "closed"
                ? ticket.ukryte === true
                : ticket.ukryte !== true
        )
        .sort((a, b) => {
            const aUrgent = a.ukryte !== true && Boolean(a.czy_pilne);
            const bUrgent = b.ukryte !== true && Boolean(b.czy_pilne);

            if (view === "active" && aUrgent !== bUrgent) {
                return aUrgent ? -1 : 1;
            }

            return new Date(b.created) - new Date(a.created);
        });

    const tabStyle = (isActive) => ({
        backgroundColor: isActive ? "var(--text)" : "var(--surface)",
        borderColor: "var(--line)",
        color: isActive ? "var(--surface)" : "var(--text)",
    });

    return (
        <TechLayout
            brandSubtitle="Panel technika"
            title="Zgłoszenia"
            subtitle="Zarządzaj zgłoszeniami użytkowników"
            sectionTitle={
                view === "active"
                    ? "Zgłoszenia aktywne"
                    : "Zgłoszenia zamknięte"
            }
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        style={tabStyle(view === "active")}
                        onClick={() => {
                            setView("active");
                            setExpandedId(null);
                        }}
                    >
                        Zgłoszenia aktywne
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        style={tabStyle(view === "closed")}
                        onClick={() => {
                            setView("closed");
                            setExpandedId(null);
                        }}
                    >
                        Zgłoszenia zamknięte
                    </Button>
                </div>

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

            {error && (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {error}
                </p>
            )}

            {isLoading ? (
                <p style={{ color: "var(--muted)" }}>
                    Ładowanie zgłoszeń...
                </p>
            ) : visibleTickets.length === 0 ? (
                <div className="tech-placeholder">
                    <div>
                        <div
                            className="tech-placeholder-icon"
                            aria-hidden="true"
                        >
                            ✧
                        </div>
                        <h3>
                            {view === "active"
                                ? "Brak aktywnych zgłoszeń"
                                : "Brak zamkniętych zgłoszeń"}
                        </h3>
                        <p>Zgłoszenia pojawią się w tym miejscu.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-3">
                    {visibleTickets.map((ticket) => {
                        const closed = ticket.ukryte === true;
                        const urgent =
                            !closed && Boolean(ticket.czy_pilne);
                        const isExpanded = expandedId === ticket.id;
                        const imageUrl = ticket.zdjecie
                            ? `${POCKETBASE_URL}/api/files/issues/${ticket.id}/${encodeURIComponent(ticket.zdjecie)}`
                            : null;

                        return (
                            <section
                                key={ticket.id}
                                className="rounded-lg border p-4"
                                style={{
                                    backgroundColor: "var(--surface)",
                                    color: "var(--text)",
                                    borderColor: urgent
                                        ? "var(--destructive, #dc2626)"
                                        : "var(--line)",
                                    borderWidth: urgent ? 2 : 1,
                                    opacity: closed ? 0.8 : 1,
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        className="flex min-h-10 flex-1 flex-wrap items-center gap-2 text-left font-medium"
                                        aria-expanded={isExpanded}
                                        onClick={() =>
                                            setExpandedId(
                                                isExpanded ? null : ticket.id
                                            )
                                        }
                                    >
                                        <span>{ticket.tytul}</span>
                                        <span
                                            className="rounded-full px-2 py-0.5 text-xs"
                                            style={{
                                                backgroundColor: urgent
                                                    ? "var(--destructive, #dc2626)"
                                                    : "var(--line)",
                                                color: urgent
                                                    ? "#fff"
                                                    : "var(--text)",
                                            }}
                                        >
                                            {urgent ? "PILNE" : "Niepilne"}
                                        </span>
                                        {closed && (
                                            <span
                                                className="rounded-full px-2 py-0.5 text-xs"
                                                style={{
                                                    backgroundColor: "var(--line)",
                                                    color: "var(--text)",
                                                }}
                                            >
                                                Zamknięte
                                            </span>
                                        )}
                                    </button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-10 min-w-24 font-semibold"
                                                    style={{
                                                        backgroundColor:
                                                            "var(--surface)",
                                                        borderColor:
                                                            "var(--line)",
                                                        color: "var(--text)",
                                                    }}
                                                    disabled={
                                                        busyId === ticket.id
                                                    }
                                                >
                                                    {busyId === ticket.id
                                                        ? "Zapis..."
                                                        : "Opcje"}
                                                </Button>
                                            }
                                        />
                                        <DropdownMenuContent
                                            align="end"
                                            className="z-50"
                                            style={{
                                                backgroundColor:
                                                    "var(--surface)",
                                                borderColor: "var(--line)",
                                                color: "var(--text)",
                                            }}
                                        >
                                            {!closed && (
                                                <DropdownMenuItem
                                                    disabled={
                                                        busyId === ticket.id
                                                    }
                                                    onClick={() =>
                                                        updateTicket(ticket, {
                                                            czy_pilne: !urgent,
                                                        })
                                                    }
                                                >
                                                    Oznacz jako{" "}
                                                    {urgent
                                                        ? "niepilne"
                                                        : "pilne"}
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem
                                                disabled={
                                                    busyId === ticket.id
                                                }
                                                onClick={() =>
                                                    updateTicket(ticket, {
                                                        ukryte: !closed,
                                                        czy_pilne: false,
                                                    })
                                                }
                                            >
                                                {closed
                                                    ? "Przywróć do aktywnych"
                                                    : "Zamknij zgłoszenie"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 grid gap-3">
                                        <p className="whitespace-pre-wrap">
                                            {ticket.opis}
                                        </p>
                                        <p
                                            className="text-sm"
                                            style={{ color: "var(--muted)" }}
                                        >
                                            Priorytet:{" "}
                                            {urgent ? "Pilne" : "Niepilne"}
                                            {" · "}
                                            Status:{" "}
                                            {closed ? "Zamknięte" : "Aktywne"}
                                        </p>
                                       {imageUrl && (
    <img
        src={imageUrl}
        alt={`Zdjęcie do zgłoszenia: ${ticket.tytul}`}
        className="mt-2 max-h-96 w-auto max-w-full rounded-lg border object-contain"
        style={{ borderColor: "var(--line)" }}
    />
)}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
        </TechLayout>
    );
}