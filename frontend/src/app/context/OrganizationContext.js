"use client";

import { createContext, useContext } from "react";

const OrganizationContext = createContext(null);

export function OrganizationProvider({
    activeOrganization,
    children,
}) {
    return (
        <OrganizationContext.Provider value={{ activeOrganization }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);

    if (!context) {
        throw new Error(
            "useOrganization must be used within OrganizationProvider"
        );
    }

    return context;
}