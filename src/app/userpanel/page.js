"use client";

import User from "@/components/user";
import ProtectedPanel from "@/components/protected-panel";

export default function UserPanelPage() {
    return (
        <ProtectedPanel role="user">
            <User />
        </ProtectedPanel>
    );
}