import Dashboard from "@/components/dashboard";
import { getUser } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function App() {
  const user = await getUser();

  if (!user) {
    redirect("/signin");
  }

  return <Dashboard user={user} />;
}
