"use client";

import { useSyncExternalStore } from "react";
import { Organization } from "@/generated/prisma/client";

// Module-level reactive state
let _activeOrg: Organization | null = null;
const _listeners: Set<() => void> = new Set();

function notify() {
    _listeners.forEach((l) => l());
}

export function setActiveOrganizationGlobal(org: Organization | null) {
    _activeOrg = org;
    notify();
}

export function getActiveOrganizationGlobal() {
    return _activeOrg;
}

export function useActiveOrganization() {
    const activeOrganization = useSyncExternalStore(
        (callback) => {
            _listeners.add(callback);
            return () => _listeners.delete(callback);
        },
        () => _activeOrg,
        () => null,
    );

    return {
        activeOrganization,
        setActiveOrganization: setActiveOrganizationGlobal,
    };
}
