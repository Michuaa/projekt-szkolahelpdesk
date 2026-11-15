"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UkladPanelu from "@/components/tech-layout";
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
    pobierzWszystkieRekordy,
    pobierzZapisaneUwierzytelnienie,
    pobierzKlientaPocketBase,
    wylogujUzytkownika,
    wykonajZapytaniePocketBase,
    ADRES_POCKETBASE,
} from "@/lib/pocketbase";
import {
    PRIORYTETY_ZGLOSZEN,
    NUMERY_SAL,
    STATUSY_ZGLOSZEN,
} from "@/lib/issue-options";

const klasaFiltrow =
    "h-9 min-w-40 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground";
const klasaWyboruStatusu =
    "h-9 w-full min-w-36 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground";

function pobierzAdresZdjecia(zgloszenie, tokenPliku) {
    if (!zgloszenie.zdjecie || !ADRES_POCKETBASE || !tokenPliku) return null;

    return `${ADRES_POCKETBASE}/api/files/issues/${zgloszenie.id}/${encodeURIComponent(zgloszenie.zdjecie)}?token=${encodeURIComponent(tokenPliku)}`;
}

function zastosujZdarzenieZgloszenia(rekordy, zdarzenie) {
    if (zdarzenie.action === "delete") {
        return rekordy.filter(
            (zgloszenie) => zgloszenie.id !== zdarzenie.record.id
        );
    }

    const indeksIstniejacego = rekordy.findIndex(
        (zgloszenie) => zgloszenie.id === zdarzenie.record.id
    );
    if (indeksIstniejacego === -1) {
        return [zdarzenie.record, ...rekordy];
    }

    return rekordy.map((zgloszenie) =>
        zgloszenie.id === zdarzenie.record.id ? zdarzenie.record : zgloszenie
    );
}

function pobierzSzkicKomentarza(zgloszenie, szkiceKomentarzy) {
    const szkic = szkiceKomentarzy[zgloszenie.id];
    if (szkic !== undefined && szkic !== null) return szkic;
    if (zgloszenie.komentarz !== undefined && zgloszenie.komentarz !== null) {
        return zgloszenie.komentarz;
    }

    return "";
}

function pobierzStatusZgloszenia(zgloszenie) {
    if (!zgloszenie.status) return "nowe";
    return zgloszenie.status;
}

function pobierzKomentarzZgloszenia(zgloszenie) {
    if (!zgloszenie.komentarz) return "Brak komentarza";
    return zgloszenie.komentarz;
}

function pobierzEtykietePrzyciskuZapisu(idZgloszenia, zapisujaceSieId) {
    if (zapisujaceSieId === idZgloszenia) return "Zapisywanie...";
    return "Zapisz komentarz";
}

export default function PanelTechnika() {
    const nawigator = useRouter();
    const [zgloszenia, ustawZgloszenia] = useState([]);
    const [filtrStatusu, ustawFiltrStatusu] = useState("");
    const [filtrSali, ustawFiltrSali] = useState("");
    const [filtrPriorytetu, ustawFiltrPriorytetu] = useState("");
    const [szkiceKomentarzy, ustawSzkiceKomentarzy] = useState({});
    const [czyLaduje, ustawCzyLaduje] = useState(true);
    const [komunikatBledu, ustawKomunikatBledu] = useState("");
    const [zapisujaceSieId, ustawZapisujaceSieId] = useState("");
    const [tokenPliku, ustawTokenPliku] = useState("");

    useEffect(() => {
        let czyAktualny = true;

        pobierzKlientaPocketBase()
            .files.getToken()
            .then((tokenPlikuOdpowiedzi) => {
                if (czyAktualny) ustawTokenPliku(tokenPlikuOdpowiedzi);
            })
            .catch((blad) => {
                if (czyAktualny) {
                    ustawKomunikatBledu(
                        blad.message || "Nie udało się uzyskać dostępu do zdjęć."
                    );
                }
            });

        return () => {
            czyAktualny = false;
        };
    }, []);

    useEffect(() => {
        let czyAktualny = true;
        let czyWstepneDaneGotowe = false;
        let anulujSubskrypcje;
        const zdarzeniaPodczasLadowania = new Map();

        const subskrypcja = pobierzKlientaPocketBase()
            .collection("issues")
            .subscribe("*", (zdarzenie) => {
                if (!czyAktualny) return;
                if (!czyWstepneDaneGotowe) {
                    zdarzeniaPodczasLadowania.set(
                        zdarzenie.record.id,
                        zdarzenie
                    );
                    return;
                }
                ustawZgloszenia((aktualneZgloszenia) =>
                    zastosujZdarzenieZgloszenia(
                        aktualneZgloszenia,
                        zdarzenie
                    )
                );
            })
            .then((zatrzymajSubskrypcje) => {
                if (!czyAktualny) {
                    zatrzymajSubskrypcje();
                    return;
                }
                anulujSubskrypcje = zatrzymajSubskrypcje;
            })
            .catch((blad) => {
                if (czyAktualny) {
                    ustawKomunikatBledu(
                        blad.message ||
                            "Nie udało się uruchomić aktualizacji realtime."
                    );
                }
            });

        async function zaladujZgloszenia() {
            try {
                const rekordy = await Promise.all([
                    pobierzWszystkieRekordy("issues"),
                    subskrypcja,
                ]).then(([elementy]) => elementy);

                if (!czyAktualny) return;

                let aktualneZgloszenia = rekordy;
                for (const zdarzenie of zdarzeniaPodczasLadowania.values()) {
                    aktualneZgloszenia = zastosujZdarzenieZgloszenia(
                        aktualneZgloszenia,
                        zdarzenie
                    );
                }

                czyWstepneDaneGotowe = true;
                ustawZgloszenia(aktualneZgloszenia);
            } catch (blad) {
                if (czyAktualny) {
                    ustawKomunikatBledu(
                        blad.message || "Nie udało się pobrać zgłoszeń."
                    );
                }
            } finally {
                if (czyAktualny) ustawCzyLaduje(false);
            }
        }

        zaladujZgloszenia();

        return () => {
            czyAktualny = false;
            if (anulujSubskrypcje) anulujSubskrypcje();
        };
    }, []);

    function obsluzWylogowanie() {
        wylogujUzytkownika();
        nawigator.replace("/");
    }

    async function aktualizujZgloszenie(zgloszenie, zmiany) {
        ustawZapisujaceSieId(zgloszenie.id);
        ustawKomunikatBledu("");

        const czyZmienionoStatus =
            Object.prototype.hasOwnProperty.call(zmiany, "status") &&
            pobierzStatusZgloszenia(zgloszenie) !== zmiany.status;
        const idTechnika = czyZmienionoStatus
            ? pobierzZapisaneUwierzytelnienie()?.user?.id
            : null;

        if (czyZmienionoStatus && !idTechnika) {
            ustawKomunikatBledu(
                "Nie udało się odczytać technika. Zaloguj się ponownie przed zmianą statusu."
            );
            ustawZapisujaceSieId("");
            return;
        }

        try {
            const zaktualizowaneZgloszenie =
                await wykonajZapytaniePocketBase(
                `/api/collections/issues/records/${zgloszenie.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(zmiany),
                }
            );

            ustawZgloszenia((aktualneZgloszenia) =>
                aktualneZgloszenia.map((zgloszenieNaLiscie) => {
                    if (zgloszenieNaLiscie.id === zaktualizowaneZgloszenie.id) {
                        return zaktualizowaneZgloszenie;
                    }
                    return zgloszenieNaLiscie;
                })
            );

            if (Object.prototype.hasOwnProperty.call(zmiany, "komentarz")) {
                ustawSzkiceKomentarzy((aktualneSzkice) => ({
                    ...aktualneSzkice,
                    [zaktualizowaneZgloszenie.id]:
                        zaktualizowaneZgloszenie.komentarz || "",
                }));
            }

            if (czyZmienionoStatus) {
                try {
                    await wykonajZapytaniePocketBase(
                        "/api/collections/ticket_events/records",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                issue: zgloszenie.id,
                                actor: idTechnika,
                                from_status: pobierzStatusZgloszenia(zgloszenie),
                                to_status: zmiany.status,
                            }),
                        }
                    );
                } catch (blad) {
                    throw new Error(
                        `Status został zmieniony, ale nie udało się zapisać historii: ${blad.message || "błąd PocketBase"}`
                    );
                }
            }
        } catch (blad) {
            ustawKomunikatBledu(
                blad.message || "Nie udało się zaktualizować zgłoszenia."
            );
        } finally {
            ustawZapisujaceSieId("");
        }
    }

    const widoczneZgloszenia = zgloszenia.filter((zgloszenie) => {
        const statusZgloszenia = pobierzStatusZgloszenia(zgloszenie);
        if (filtrStatusu && statusZgloszenia !== filtrStatusu) return false;
        if (filtrSali && String(zgloszenie.sala) !== filtrSali) return false;
        if (
            filtrPriorytetu &&
            zgloszenie.priorytet !== filtrPriorytetu
        ) {
            return false;
        }
        return true;
    });

    let zawartoscZgloszen;
    if (czyLaduje) {
        zawartoscZgloszen = (
            <p style={{ color: "var(--muted)" }}>Ładowanie zgłoszeń...</p>
        );
    } else if (widoczneZgloszenia.length === 0) {
        let komunikatPustejListy = "Brak zgłoszeń spełniających filtry";
        if (zgloszenia.length === 0) komunikatPustejListy = "Brak zgłoszeń";

        zawartoscZgloszen = (
            <div className="tech-placeholder">
                <div>
                    <div className="tech-placeholder-icon" aria-hidden="true">
                        ✧
                    </div>
                    <h3>{komunikatPustejListy}</h3>
                    <p>Zgłoszenia pojawią się w tym miejscu.</p>
                </div>
            </div>
        );
    } else {
        zawartoscZgloszen = (
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
                    {widoczneZgloszenia.map((zgloszenie) => {
                        const adresZdjecia = pobierzAdresZdjecia(
                            zgloszenie,
                            tokenPliku
                        );
                        const szkicKomentarza = pobierzSzkicKomentarza(
                            zgloszenie,
                            szkiceKomentarzy
                        );
                        const komentarz = pobierzKomentarzZgloszenia(zgloszenie);
                        const statusZgloszenia =
                            pobierzStatusZgloszenia(zgloszenie);
                        const etykietaZapisu = pobierzEtykietePrzyciskuZapisu(
                            zgloszenie.id,
                            zapisujaceSieId
                        );

                        return (
                            <TableRow key={zgloszenie.id}>
                                <TableCell className="min-w-64 whitespace-normal">
                                    <p className="font-semibold">{zgloszenie.tytul}</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                        {zgloszenie.opis}
                                    </p>
                                    {adresZdjecia && (
                                        <a
                                            href={adresZdjecia}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 inline-block text-sm underline"
                                        >
                                            Zobacz zdjęcie
                                        </a>
                                    )}
                                </TableCell>
                                <TableCell>{zgloszenie.sala}</TableCell>
                                <TableCell className="whitespace-normal">{zgloszenie.kategoria}</TableCell>
                                <TableCell>{zgloszenie.priorytet}</TableCell>
                                <TableCell className="min-w-40">
                                    <select
                                        aria-label={`Status zgłoszenia: ${zgloszenie.tytul}`}
                                        className={klasaWyboruStatusu}
                                        value={statusZgloszenia}
                                        disabled={zapisujaceSieId === zgloszenie.id}
                                        onChange={(zdarzenie) =>
                                            aktualizujZgloszenie(zgloszenie, {
                                                status: zdarzenie.target.value,
                                            })
                                        }
                                    >
                                        {STATUSY_ZGLOSZEN.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </TableCell>
                                <TableCell className="min-w-64 whitespace-normal">
                                    <p className="mb-2 text-sm text-muted-foreground">{komentarz}</p>
                                    <Textarea
                                        aria-label={`Komentarz do zgłoszenia: ${zgloszenie.tytul}`}
                                        placeholder="Dodaj komentarz..."
                                        value={szkicKomentarza}
                                        onChange={(zdarzenie) =>
                                            ustawSzkiceKomentarzy((aktualneSzkice) => ({
                                                ...aktualneSzkice,
                                                [zgloszenie.id]: zdarzenie.target.value,
                                            }))
                                        }
                                        disabled={zapisujaceSieId === zgloszenie.id}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={zapisujaceSieId === zgloszenie.id}
                                        onClick={() =>
                                            aktualizujZgloszenie(zgloszenie, {
                                                komentarz: szkicKomentarza,
                                            })
                                        }
                                    >
                                        {etykietaZapisu}
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
        <UkladPanelu
            podtytulMarki="Panel technika"
            tytul="Zgłoszenia"
            podtytul="Zarządzaj zgłoszeniami użytkowników"
            tytulSekcji="Wszystkie zgłoszenia"
            metadaneSekcji={`${widoczneZgloszenia.length} z ${zgloszenia.length}`}
        >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="filter-status">Status</Label>
                        <select
                            id="filtr-statusu"
                            className={klasaFiltrow}
                            value={filtrStatusu}
                            onChange={(zdarzenie) => ustawFiltrStatusu(zdarzenie.target.value)}
                        >
                            <option value="">Wszystkie</option>
                            {STATUSY_ZGLOSZEN.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="filter-room">Sala</Label>
                        <select
                            id="filtr-sali"
                            className={klasaFiltrow}
                            value={filtrSali}
                            onChange={(zdarzenie) => ustawFiltrSali(zdarzenie.target.value)}
                        >
                            <option value="">Wszystkie</option>
                            {NUMERY_SAL.map((sala) => (
                                <option key={sala} value={sala}>
                                    {sala}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="filter-priority">Priorytet</Label>
                        <select
                            id="filtr-priorytetu"
                            className={klasaFiltrow}
                            value={filtrPriorytetu}
                            onChange={(zdarzenie) =>
                                ustawFiltrPriorytetu(zdarzenie.target.value)
                            }
                        >
                            <option value="">Wszystkie</option>
                            {PRIORYTETY_ZGLOSZEN.map((priorytet) => (
                                <option key={priorytet} value={priorytet}>
                                    {priorytet}
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
                    onClick={obsluzWylogowanie}
                >
                    Wyloguj się
                </Button>
            </div>

            {komunikatBledu && (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {komunikatBledu}
                </p>
            )}
            {zawartoscZgloszen}
        </UkladPanelu>
    );
}
