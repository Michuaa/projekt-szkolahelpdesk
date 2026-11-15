"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UkladPanelu from "@/components/tech-layout";
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
    pobierzWszystkieRekordy,
    pobierzZapisaneUwierzytelnienie,
    pobierzKlientaPocketBase,
    wylogujUzytkownika,
    wykonajZapytaniePocketBase,
    ADRES_POCKETBASE,
} from "@/lib/pocketbase";
import {
    KATEGORIE_ZGLOSZEN,
    PRIORYTETY_ZGLOSZEN,
    NUMERY_SAL,
    ETYKIETY_STATUSOW,
} from "@/lib/issue-options";

const MAKSYMALNY_ROZMIAR_ZDJECIA = 5 * 1024 * 1024;

const stylKartyMotywu = {
    backgroundColor: "var(--surface)",
    borderColor: "var(--line)",
    color: "var(--text)",
};

const klasaWyboru =
    "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground";

function pobierzAdresZdjecia(zgloszenie, tokenPliku) {
    if (!zgloszenie.zdjecie || !ADRES_POCKETBASE || !tokenPliku) return null;

    return `${ADRES_POCKETBASE}/api/files/issues/${zgloszenie.id}/${encodeURIComponent(zgloszenie.zdjecie)}?token=${encodeURIComponent(tokenPliku)}`;
}

function zastosujZdarzenieZgloszenia(zgloszenia, zdarzenie) {
    if (zdarzenie.action === "delete") {
        return zgloszenia.filter(
            (zgloszenie) => zgloszenie.id !== zdarzenie.record.id
        );
    }

    const zaktualizowaneZgloszenie = przeksztalcZgloszenie(zdarzenie.record);
    const indeksIstniejacego = zgloszenia.findIndex(
        (zgloszenie) => zgloszenie.id === zaktualizowaneZgloszenie.id
    );
    if (indeksIstniejacego === -1) {
        return [zaktualizowaneZgloszenie, ...zgloszenia];
    }

    return zgloszenia.map((zgloszenie) =>
        zgloszenie.id === zaktualizowaneZgloszenie.id
            ? zaktualizowaneZgloszenie
            : zgloszenie
    );
}

function pobierzEtykieteStatusu(status) {
    if (ETYKIETY_STATUSOW[status]) return ETYKIETY_STATUSOW[status];
    return status;
}

function przeksztalcZgloszenie(rekord) {
    let status = "nowe";
    if (rekord.status) status = rekord.status;

    let komentarz = "";
    if (rekord.komentarz) komentarz = rekord.komentarz;

    return {
        id: rekord.id,
        tytul: rekord.tytul,
        opis: rekord.opis,
        sala: rekord.sala,
        kategoria: rekord.kategoria,
        priorytet: rekord.priorytet,
        status,
        komentarz,
        nazwaZdjecia: rekord.zdjecie,
    };
}

export default function PanelUzytkownika() {
    const nawigator = useRouter();
    const [czyFormularzOtwarty, ustawCzyFormularzOtwarty] = useState(false);
    const [zgloszenia, ustawZgloszenia] = useState([]);
    const [czyWysylanie, ustawCzyWysylanie] = useState(false);
    const [czyLaduje, ustawCzyLaduje] = useState(true);
    const [komunikatBledu, ustawKomunikatBledu] = useState("");
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
        const idUzytkownika = pobierzZapisaneUwierzytelnienie()?.user?.id;

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
                if (!idUzytkownika) {
                    throw new Error(
                        "Nie udało się odczytać zalogowanego użytkownika. Zaloguj się ponownie."
                    );
                }

                const rekordy = await Promise.all([
                    pobierzWszystkieRekordy(
                        "issues",
                        `uzytkownik = "${idUzytkownika}"`
                    ),
                    subskrypcja,
                ]).then(([elementy]) => elementy);
                if (!czyAktualny) return;

                let aktualneZgloszenia = rekordy.map(przeksztalcZgloszenie);
                for (const zdarzenie of zdarzeniaPodczasLadowania.values()) {
                    aktualneZgloszenia = zastosujZdarzenieZgloszenia(
                        aktualneZgloszenia,
                        zdarzenie
                    );
                }

                czyWstepneDaneGotowe = true;
                ustawZgloszenia(aktualneZgloszenia);
            } catch (blad) {
                let komunikat = "Nie udało się pobrać zgłoszeń.";
                if (blad.message) komunikat = blad.message;
                if (czyAktualny) ustawKomunikatBledu(komunikat);
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

    async function obsluzWyslanieFormularza(zdarzenie) {
        zdarzenie.preventDefault();

        const formularz = zdarzenie.currentTarget;
        const daneFormularza = new FormData(formularz);
        const zdjecie = daneFormularza.get("zdjecie");
        const idUzytkownika = pobierzZapisaneUwierzytelnienie()?.user?.id;

        if (!idUzytkownika) {
            ustawKomunikatBledu(
                "Nie udało się odczytać zalogowanego użytkownika. Zaloguj się ponownie."
            );
            return;
        }

        if (zdjecie instanceof File && zdjecie.size > 0) {
            if (!zdjecie.type.startsWith("image/")) {
                ustawKomunikatBledu(
                    "Do zgłoszenia można dołączyć tylko plik graficzny."
                );
                return;
            }
            if (zdjecie.size > MAKSYMALNY_ROZMIAR_ZDJECIA) {
                ustawKomunikatBledu("Zdjęcie nie może być większe niż 5 MB.");
                return;
            }
        }

        const daneZgloszenia = new FormData();
        daneZgloszenia.append("tytul", daneFormularza.get("tytul"));
        daneZgloszenia.append("opis", daneFormularza.get("opis"));
        daneZgloszenia.append("sala", daneFormularza.get("sala"));
        daneZgloszenia.append("kategoria", daneFormularza.get("kategoria"));
        daneZgloszenia.append("priorytet", daneFormularza.get("priorytet"));
        daneZgloszenia.append("status", "nowe");
        daneZgloszenia.append("uzytkownik", idUzytkownika);

        if (zdjecie instanceof File && zdjecie.size > 0) {
            daneZgloszenia.append("zdjecie", zdjecie);
        }

        ustawCzyWysylanie(true);
        ustawKomunikatBledu("");

        try {
            const rekord = await wykonajZapytaniePocketBase(
                "/api/collections/issues/records",
                {
                    method: "POST",
                    body: daneZgloszenia,
                }
            );

            ustawZgloszenia((aktualneZgloszenia) => {
                const noweZgloszenie = przeksztalcZgloszenie(rekord);
                if (
                    aktualneZgloszenia.some(
                        (zgloszenie) => zgloszenie.id === noweZgloszenie.id
                    )
                ) {
                    return aktualneZgloszenia.map((zgloszenie) =>
                        zgloszenie.id === noweZgloszenie.id
                            ? noweZgloszenie
                            : zgloszenie
                    );
                }
                return [noweZgloszenie, ...aktualneZgloszenia];
            });
            formularz.reset();
            ustawCzyFormularzOtwarty(false);
        } catch (blad) {
            let komunikat = "Nie udało się wysłać zgłoszenia.";
            if (blad.message) komunikat = blad.message;
            ustawKomunikatBledu(komunikat);
        } finally {
            ustawCzyWysylanie(false);
        }
    }

    let etykietaPrzyciskuFormularza = "DODAJ ZGŁOSZENIE";
    if (czyFormularzOtwarty) etykietaPrzyciskuFormularza = "ANULUJ";

    let etykietaPrzyciskuWysylania = "Wyślij zgłoszenie";
    if (czyWysylanie) etykietaPrzyciskuWysylania = "Wysyłanie...";

    let zawartoscZgloszen;
    if (czyLaduje) {
        zawartoscZgloszen = (
            <p style={{ color: "var(--muted)" }}>Ładowanie zgłoszeń...</p>
        );
    } else if (zgloszenia.length === 0 && !czyFormularzOtwarty) {
        zawartoscZgloszen = (
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
        zawartoscZgloszen = (
            <div className="grid gap-4">
                {zgloszenia.map((zgloszenie) => (
                    <Card key={zgloszenie.id} style={stylKartyMotywu}>
                        <CardHeader>
                            <CardTitle>{zgloszenie.tytul}</CardTitle>
                            <CardDescription style={{ color: "var(--muted)" }}>
                                Sala {zgloszenie.sala} · {zgloszenie.kategoria} · Priorytet: {zgloszenie.priorytet}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            <p className="whitespace-pre-wrap">{zgloszenie.opis}</p>
                            <p className="text-sm font-medium">
                                Status: {pobierzEtykieteStatusu(zgloszenie.status)}
                            </p>
                            {zgloszenie.komentarz && (
                                <p className="text-sm">
                                    Komentarz technika: {zgloszenie.komentarz}
                                </p>
                            )}
                            {pobierzAdresZdjecia(
                                {
                                    id: zgloszenie.id,
                                    zdjecie: zgloszenie.nazwaZdjecia,
                                },
                                tokenPliku
                            ) && (
                                <Image
                                    src={pobierzAdresZdjecia(
                                        {
                                            id: zgloszenie.id,
                                            zdjecie: zgloszenie.nazwaZdjecia,
                                        },
                                        tokenPliku
                                    )}
                                    alt={`Zdjęcie do zgłoszenia: ${zgloszenie.tytul}`}
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
        <UkladPanelu
            podtytulMarki="Panel użytkownika"
            tytul="Zgłoszenia"
            podtytul="Przestrzeń użytkownika"
            tytulSekcji="Moje zgłoszenia"
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <Button
                    type="button"
                    onClick={() => {
                        ustawCzyFormularzOtwarty((czyOtwarty) => !czyOtwarty);
                        ustawKomunikatBledu("");
                    }}
                >
                    {etykietaPrzyciskuFormularza}
                </Button>

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

            {czyFormularzOtwarty && (
                <Card className="mb-6" style={stylKartyMotywu}>
                    <CardHeader>
                        <CardTitle>Nowe zgłoszenie</CardTitle>
                        <CardDescription style={{ color: "var(--muted)" }}>
                            Opisz problem. Zdjęcie jest opcjonalne.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-5" onSubmit={obsluzWyslanieFormularza}>
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
                                    className={klasaWyboru}
                                    defaultValue=""
                                    required
                                >
                                    <option value="" disabled>
                                        Wybierz salę
                                    </option>
                                    {NUMERY_SAL.map((sala) => (
                                        <option key={sala} value={sala}>
                                            {sala}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="kategoria">Kategoria</Label>
                                <select
                                    id="kategoria"
                                    name="kategoria"
                                    className={klasaWyboru}
                                    defaultValue=""
                                    required
                                >
                                    <option value="" disabled>
                                        Wybierz kategorię
                                    </option>
                                    {KATEGORIE_ZGLOSZEN.map((kategoria) => (
                                        <option key={kategoria} value={kategoria}>
                                            {kategoria}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="priorytet">Priorytet</Label>
                                <select
                                    id="priorytet"
                                    name="priorytet"
                                    className={klasaWyboru}
                                    defaultValue=""
                                    required
                                >
                                    <option value="" disabled>
                                        Wybierz priorytet
                                    </option>
                                    {PRIORYTETY_ZGLOSZEN.map((priorytet) => (
                                        <option key={priorytet} value={priorytet}>
                                            {priorytet}
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

                            {komunikatBledu && (
                                <p role="alert" className="text-sm text-red-600">
                                    {komunikatBledu}
                                </p>
                            )}

                            <Button type="submit" disabled={czyWysylanie}>
                                {etykietaPrzyciskuWysylania}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!czyFormularzOtwarty && komunikatBledu && (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {komunikatBledu}
                </p>
            )}

            {zawartoscZgloszen}
        </UkladPanelu>
    );
}
