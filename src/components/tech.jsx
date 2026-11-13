"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TechLayout from "@/components/tech-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    fetchAllRecords,
    logout,
    pocketBaseFetch,
    POCKETBASE_URL,
} from "@/lib/pocketbase";
import {
    ISSUE_PRIORITIES,
    ISSUE_ROOMS,
    ISSUE_STATUSES,
} from "@/lib/issue-options";

const filterClassName =
    "h-9 min-w-40 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground";
const statusClassName =
    "h-9 w-full min-w-36 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground";

function getTicketImageUrl(ticket) {
    if (!ticket.zdjecie) return null;

    return `${POCKETBASE_URL}/api/files/issues/${ticket.id}/${encodeURIComponent(ticket.zdjecie)}`;
}

function getCommentDraft(ticket, commentDrafts) {
    const draft = commentDrafts[ticket.id];
    if (draft !== undefined && draft !== null) return draft;
    if (ticket.komentarz !== undefined && ticket.komentarz !== null) {
        return ticket.komentarz;
    }

    return "";
}

function getTicketStatus(ticket) {
    if (!ticket.status) return "nowe";
    return ticket.status;
}

function getTicketComment(ticket) {
    if (!ticket.komentarz) return "Brak komentarza";
    return ticket.komentarz;
}

function getSaveButtonLabel(ticketId, busyId) {
    if (busyId === ticketId) return "Zapisywanie...";
    return "Zapisz komentarz";
}

export default function Tech() {
    const router = useRouter();
    const [tickets, setTickets] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [roomFilter, setRoomFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [commentDrafts, setCommentDrafts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");

    const loadTickets = useCallback(async () => {
        try {
            const records = await fetchAllRecords("issues");
            setTickets(records);
        } catch (err) {
            setError(err.message || "Nie udało się pobrać zgłoszeń.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        Promise.resolve().then(loadTickets);
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
                current.map((item) => {
                    if (item.id === updated.id) return updated;
                    return item;
                })
            );

            if (Object.prototype.hasOwnProperty.call(changes, "komentarz")) {
                setCommentDrafts((current) => ({
                    ...current,
                    [updated.id]: updated.komentarz || "",
                }));
            }
        } catch (err) {
            setError(err.message || "Nie udało się zaktualizować zgłoszenia.");
        } finally {
            setBusyId("");
        }
    }

    const visibleTickets = tickets.filter((ticket) => {
        const status = getTicketStatus(ticket);
        if (statusFilter && status !== statusFilter) return false;
        if (roomFilter && String(ticket.sala) !== roomFilter) return false;
        if (priorityFilter && ticket.priorytet !== priorityFilter) return false;
        return true;
    });

    let ticketContent;
    if (isLoading) {
        ticketContent = (
            <p style={{ color: "var(--muted)" }}>Ładowanie zgłoszeń...</p>
        );
    } else if (visibleTickets.length === 0) {
        let emptyMessage = "Brak zgłoszeń spełniających filtry";
        if (tickets.length === 0) emptyMessage = "Brak zgłoszeń";

        ticketContent = (
            <div className="tech-placeholder">
                <div>
                    <div className="tech-placeholder-icon" aria-hidden="true">
                        ✧
                    </div>
                    <h3>{emptyMessage}</h3>
                    <p>Zgłoszenia pojawią się w tym miejscu.</p>
                </div>
            </div>
        );
    } else {
        ticketContent = (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Zgłoszenie</TableHead>
                        <TableHead>Sala</TableHead>
                        <TableHead>Kategoria</TableHead>
                        <TableHead>Priorytet</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Komentarz technika</TableHead>
                        <TableHead>Akcja</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visibleTickets.map((ticket) => {
                        const imageUrl = getTicketImageUrl(ticket);
                        const commentDraft = getCommentDraft(ticket, commentDrafts);
                        const comment = getTicketComment(ticket);
                        const status = getTicketStatus(ticket);
                        const saveLabel = getSaveButtonLabel(ticket.id, busyId);

                        return (
                            <TableRow key={ticket.id}>
                                <TableCell className="min-w-64 whitespace-normal">
                                    <p className="font-semibold">{ticket.tytul}</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                        {ticket.opis}
                                    </p>
                                    {imageUrl && (
                                        <a
                                            href={imageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 inline-block text-sm underline"
                                        >
                                            Zobacz zdjęcie
                                        </a>
                                    )}
                                </TableCell>
                                <TableCell>{ticket.sala}</TableCell>
                                <TableCell className="whitespace-normal">{ticket.kategoria}</TableCell>
                                <TableCell>{ticket.priorytet}</TableCell>
                                <TableCell className="min-w-40">
                                    <select
                                        aria-label={`Status zgłoszenia: ${ticket.tytul}`}
                                        className={statusClassName}
                                        value={status}
                                        disabled={busyId === ticket.id}
                                        onChange={(event) =>
                                            updateTicket(ticket, {
                                                status: event.target.value,
                                            })
                                        }
                                    >
                                        {ISSUE_STATUSES.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </TableCell>
                                <TableCell className="min-w-64 whitespace-normal">
                                    <p className="mb-2 text-sm text-muted-foreground">{comment}</p>
                                    <Textarea
                                        aria-label={`Komentarz do zgłoszenia: ${ticket.tytul}`}
                                        placeholder="Dodaj komentarz..."
                                        value={commentDraft}
                                        onChange={(event) =>
                                            setCommentDrafts((current) => ({
                                                ...current,
                                                [ticket.id]: event.target.value,
                                            }))
                                        }
                                        disabled={busyId === ticket.id}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={busyId === ticket.id}
                                        onClick={() =>
                                            updateTicket(ticket, {
                                                komentarz: commentDraft,
                                            })
                                        }
                                    >
                                        {saveLabel}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    }

    return (
        <TechLayout
            brandSubtitle="Panel technika"
            title="Zgłoszenia"
            subtitle="Zarządzaj zgłoszeniami użytkowników"
            sectionTitle="Wszystkie zgłoszenia"
            sectionMeta={`${visibleTickets.length} z ${tickets.length}`}
        >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="filter-status">Status</Label>
                        <select
                            id="filter-status"
                            className={filterClassName}
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="">Wszystkie</option>
                            {ISSUE_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="filter-room">Sala</Label>
                        <select
                            id="filter-room"
                            className={filterClassName}
                            value={roomFilter}
                            onChange={(event) => setRoomFilter(event.target.value)}
                        >
                            <option value="">Wszystkie</option>
                            {ISSUE_ROOMS.map((room) => (
                                <option key={room} value={room}>
                                    {room}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="filter-priority">Priorytet</Label>
                        <select
                            id="filter-priority"
                            className={filterClassName}
                            value={priorityFilter}
                            onChange={(event) =>
                                setPriorityFilter(event.target.value)
                            }
                        >
                            <option value="">Wszystkie</option>
                            {ISSUE_PRIORITIES.map((priority) => (
                                <option key={priority} value={priority}>
                                    {priority}
                                </option>
                            ))}
                        </select>
                    </div>
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
            {ticketContent}
        </TechLayout>
    );
}
