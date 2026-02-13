import Dashboard from "@/components/dashboard";
import { getUser } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function App() {
  redirect("/app/links");
  return null;
}
