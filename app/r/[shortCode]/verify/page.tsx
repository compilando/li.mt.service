import { Metadata } from "next";
import PasswordVerifyForm from "./form";

export const metadata: Metadata = {
    title: "Password Protected Link | Limt",
    description: "This link is password protected",
};

export default async function PasswordVerifyPage({
    params,
}: {
    params: Promise<{ shortCode: string }>;
}) {
    const { shortCode } = await params;

    return <PasswordVerifyForm shortCode={shortCode} />;
}
