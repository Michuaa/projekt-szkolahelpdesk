"use client";

import PanelTechnika from "@/components/tech";
import ChronionyPanel from "@/components/protected-panel";

export default function StronaPaneluTechnika() {
    return (
        <ChronionyPanel rola="tech">
            <PanelTechnika />
        </ChronionyPanel>
    );
}