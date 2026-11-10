"use client";

import Tech from "@/components/tech";
import ProtectedPanel from "@/components/protected-panel";

export default function TechPanelPage() {
    return (
        <ProtectedPanel role="tech">
            <Tech />
        </ProtectedPanel>
    );
}