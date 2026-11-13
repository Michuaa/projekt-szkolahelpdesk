"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSavedAuth } from "@/lib/pocketbase";

export default function ProtectedPanel({ role, children }) {
    const router = useRouter();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        let isCurrent = true;
        const auth = getSavedAuth();

        if (!auth?.token || !auth?.user) {
            router.replace("/");
            return;
        }

        const isTechnician = auth.user.czyTechnik === true;
        const shouldBeTechnician = role === "tech";
        if (isTechnician !== shouldBeTechnician) {
            let destination = "/userpanel";
            if (isTechnician) destination = "/techpanel";
            router.replace(destination);
            return;
        }

        Promise.resolve().then(() => {
            if (isCurrent) setAllowed(true);
        });

        return () => {
            isCurrent = false;
        };
    }, [role, router]);

    if (!allowed) return null;
    return children;
}