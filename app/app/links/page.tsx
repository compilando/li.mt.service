import { DashboardHeader } from "@/components/dashboard/header";
import LinkCreate from "@/components/dashboard/link-create";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/user";
import { Plus } from "lucide-react";

export default async function Links() {
  const user = await getUser();
  return (
    <>
      <DashboardHeader title="Links">
        <LinkCreate>
          <Button>
            <Plus />
            New Link
          </Button>
        </LinkCreate>
      </DashboardHeader>
    </>
  );
}
