"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pobierzZapisaneUwierzytelnienie } from "@/lib/pocketbase";

export default function ChronionyPanel({ rola, children }) {
    const nawigator = useRouter();
    const [czyDozwolono, ustawCzyDozwolono] = useState(false);

    useEffect(() => {
        let czyAktualny = true;
        const uwierzytelnienie = pobierzZapisaneUwierzytelnienie();

        if (!uwierzytelnienie?.token || !uwierzytelnienie?.user) {
            nawigator.replace("/");
            return;
        }

        const czyTechnik = uwierzytelnienie.user.czyTechnik === true;
        const czyWymaganyTechnik = rola === "tech";
        if (czyTechnik !== czyWymaganyTechnik) {
            let sciezkaDocelowa = "/userpanel";
            if (czyTechnik) sciezkaDocelowa = "/techpanel";
            nawigator.replace(sciezkaDocelowa);
            return;
        }

        Promise.resolve().then(() => {
            if (czyAktualny) ustawCzyDozwolono(true);
        });

        return () => {
            czyAktualny = false;
        };
    }, [rola, nawigator]);

    if (!czyDozwolono) return null;
    return children;
}