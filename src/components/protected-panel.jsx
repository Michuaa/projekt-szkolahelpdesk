"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSavedAuth } from "@/lib/pocketbase";

export default function ProtectedPanel({ role, children }) {
    const router = useRouter();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const auth = getSavedAuth();

        if (!auth?.token || !auth?.user) {
            router.replace("/");
            return;
        }

        const isTechnician = auth.user.czyTechnik === true;
        const hasCorrectRole =
            role === "tech" ? isTechnician : !isTechnician;

        if (!hasCorrectRole) {
            router.replace(isTechnician ? "/techpanel" : "/userpanel");
            return;
        }

        setAllowed(true);
    }, [role, router]);

    return allowed ? children : null;
}