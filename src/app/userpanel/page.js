"use client";

import PanelUzytkownika from "@/components/user";
import ChronionyPanel from "@/components/protected-panel";

export default function StronaPaneluUzytkownika() {
    return (
        <ChronionyPanel rola="user">
            <PanelUzytkownika />
        </ChronionyPanel>
    );
}