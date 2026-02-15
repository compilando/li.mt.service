import { Metadata } from "next";
import { DomainsPageContent } from "./content";

export const metadata: Metadata = {
    title: "Domains - Limt",
    description: "Manage your custom domains",
};

export default function DomainsPage() {
    return <DomainsPageContent />;
}
