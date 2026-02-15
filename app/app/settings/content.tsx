"use client";

import { useEffect, useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { usePlanGuard } from "@/hooks/use-plan-guard";
import { DashboardHeader, DashboardPageHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, Shield, User, Trash2, Mail, X, UserPlus, Settings } from "lucide-react";
import {
    updateOrganization,
    deleteOrganization,
    listMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    leaveOrganization,
    listInvitations,
    cancelInvitation,
} from "@/lib/actions/teams";
import { useSession } from "@/lib/auth-client";

type Member = {
    id: string;
    role: string;
    createdAt: Date;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
};

type Invitation = {
    id: string;
    email: string;
    role: string | null;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    inviter: {
        id: string;
        name: string | null;
        email: string;
    };
};

const roleIcons = {
    owner: Crown,
    admin: Shield,
    member: User,
};

const roleColors = {
    owner: "bg-yellow-100 text-yellow-800",
    admin: "bg-blue-100 text-blue-800",
    member: "bg-gray-100 text-gray-800",
};

function BillingTab({ isOwner }: { isOwner: boolean }) {
    const { activeOrganization } = useActiveOrganization();
    const planGuard = usePlanGuard();
    const { changePlan } = require("@/lib/actions/plans");
    const [isChanging, setIsChanging] = useState(false);

    if (!activeOrganization) return null;

    const handleUpgrade = async (newPlan: "pro" | "business") => {
        if (!isOwner) return;
        setIsChanging(true);
        const result = await changePlan({
            organizationId: activeOrganization.id,
            planId: newPlan,
        });
        if (result.success) {
            window.location.reload();
        }
        setIsChanging(false);
    };

    const currentPlan = planGuard.getPlanId();
    const upgradePlan = planGuard.getUpgradePlan();

    return (
        <TabsContent value="billing" className="space-y-4">
            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>
                                You are currently on the {planGuard.getPlanName()} plan
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-lg px-4 py-2">
                            {planGuard.getPlanName()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {planGuard.loading ? (
                        <p className="text-sm text-muted-foreground">Loading plan information...</p>
                    ) : (
                        <>
                            <div className="mb-4">
                                <p className="text-2xl font-bold">
                                    ${planGuard.getPrice()}
                                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                                </p>
                            </div>
                            {upgradePlan && isOwner && (
                                <Button
                                    onClick={() => handleUpgrade(upgradePlan.id as "pro" | "business")}
                                    disabled={isChanging}
                                >
                                    {isChanging ? "Upgrading..." : `Upgrade to ${upgradePlan.name}`}
                                </Button>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Usage & Limits */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage & Limits</CardTitle>
                    <CardDescription>Track your resource usage against plan limits</CardDescription>
                </CardHeader>
                <CardContent>
                    {planGuard.loading ? (
                        <p className="text-sm text-muted-foreground">Loading usage...</p>
                    ) : (
                        <div className="space-y-6">
                            {/* Links */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Links this month</span>
                                    <span className="text-sm text-muted-foreground">
                                        {planGuard.getUsage("links")} / {planGuard.isUnlimited("links") ? "∞" : planGuard.getLimit("links")}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{
                                            width: planGuard.isUnlimited("links")
                                                ? "0%"
                                                : `${Math.min(100, planGuard.getUsagePercentage("links"))}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Tags</span>
                                    <span className="text-sm text-muted-foreground">
                                        {planGuard.getUsage("tags")} / {planGuard.isUnlimited("tags") ? "∞" : planGuard.getLimit("tags")}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{
                                            width: planGuard.isUnlimited("tags")
                                                ? "0%"
                                                : `${Math.min(100, planGuard.getUsagePercentage("tags"))}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Domains */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Custom domains</span>
                                    <span className="text-sm text-muted-foreground">
                                        {planGuard.getUsage("domains")} / {planGuard.isUnlimited("domains") ? "∞" : planGuard.getLimit("domains")}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{
                                            width: planGuard.isUnlimited("domains")
                                                ? "0%"
                                                : `${Math.min(100, planGuard.getUsagePercentage("domains"))}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Members */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Team members</span>
                                    <span className="text-sm text-muted-foreground">
                                        {planGuard.getUsage("members")} / {planGuard.isUnlimited("members") ? "∞" : planGuard.getLimit("members")}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{
                                            width: planGuard.isUnlimited("members")
                                                ? "0%"
                                                : `${Math.min(100, planGuard.getUsagePercentage("members"))}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Clicks */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Clicks this month</span>
                                    <span className="text-sm text-muted-foreground">
                                        {planGuard.getUsage("clicksPerMonth").toLocaleString()} /{" "}
                                        {planGuard.isUnlimited("clicksPerMonth") ? "∞" : planGuard.getLimit("clicksPerMonth").toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{
                                            width: planGuard.isUnlimited("clicksPerMonth")
                                                ? "0%"
                                                : `${Math.min(100, planGuard.getUsagePercentage("clicksPerMonth"))}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View All Plans */}
            <Card>
                <CardHeader>
                    <CardTitle>Need more?</CardTitle>
                    <CardDescription>Explore all available plans</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" asChild>
                        <a href="/pricing" target="_blank" rel="noopener noreferrer">
                            View all plans
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
    );
}

export function SettingsPageContent() {
    const { activeOrganization } = useActiveOrganization();
    const { data: session } = useSession();
    const [orgName, setOrgName] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState("");
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Members state
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    // Invitations state
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loadingInvitations, setLoadingInvitations] = useState(true);

    // Invite dialog state
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState("");

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadMembers = async () => {
        if (!activeOrganization) return;
        setLoadingMembers(true);
        const result = await listMembers({ organizationId: activeOrganization.id });
        if (result.success) {
            setMembers(result.data);
        }
        setLoadingMembers(false);
    };

    const loadInvitations = async () => {
        if (!activeOrganization) return;
        setLoadingInvitations(true);
        const result = await listInvitations({ organizationId: activeOrganization.id });
        if (result.success) {
            setInvitations(result.data);
        }
        setLoadingInvitations(false);
    };

    useEffect(() => {
        if (activeOrganization) {
            setOrgName(activeOrganization.name);
            loadMembers();
            loadInvitations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeOrganization]);

    const handleUpdateOrg = async () => {
        if (!activeOrganization) return;
        setUpdateError("");
        setUpdateSuccess(false);
        setIsUpdating(true);

        const result = await updateOrganization({
            id: activeOrganization.id,
            name: orgName,
        });

        if (result.success) {
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } else {
            setUpdateError(result.error);
        }
        setIsUpdating(false);
    };

    const handleInviteMember = async () => {
        if (!activeOrganization) return;
        setInviteError("");
        setIsInviting(true);

        const result = await inviteMember({
            organizationId: activeOrganization.id,
            email: inviteEmail,
            role: inviteRole,
        });

        if (result.success) {
            setIsInviteDialogOpen(false);
            setInviteEmail("");
            setInviteRole("member");
            loadInvitations();
        } else {
            setInviteError(result.error);
        }
        setIsInviting(false);
    };

    const handleCancelInvitation = async (invitationId: string) => {
        const result = await cancelInvitation({ invitationId });
        if (result.success) {
            loadInvitations();
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        const result = await removeMember({ memberId });
        if (result.success) {
            loadMembers();
        }
    };

    const handleDeleteOrg = async () => {
        if (!activeOrganization) return;
        setIsDeleting(true);

        const result = await deleteOrganization({ id: activeOrganization.id });

        if (result.success) {
            window.location.href = "/app/links";
        }
        setIsDeleting(false);
    };

    if (!activeOrganization) {
        return (
            <>
                <DashboardHeader title="Settings" icon={Settings} />
                <div className="flex-1 overflow-auto p-8">
                    <p className="text-sm text-muted-foreground">No organization selected</p>
                </div>
            </>
        );
    }

    const isPersonalOrg = activeOrganization.slug.startsWith("personal-");
    const currentUserMember = members.find((m) => m.user.id === session?.user?.id);
    const isOwner = currentUserMember?.role === "owner";
    const isAdmin = currentUserMember?.role === "admin" || isOwner;

    return (
        <>
            <DashboardHeader title="Settings" icon={Settings} />

            <div className="flex-1 overflow-auto p-8">
                <DashboardPageHeader
                    title="Team Settings"
                    description={`Manage ${activeOrganization.name} settings and members`}
                />

                <Tabs defaultValue="general" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="invitations">Invitations</TabsTrigger>
                        {!isPersonalOrg && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Information</CardTitle>
                                <CardDescription>
                                    Update your team's basic information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="org-name">Team name</Label>
                                    <Input
                                        id="org-name"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        disabled={!isAdmin}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="org-slug">Slug</Label>
                                    <Input
                                        id="org-slug"
                                        value={activeOrganization.slug}
                                        disabled
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        The slug cannot be changed
                                    </p>
                                </div>
                                {updateError && (
                                    <p className="text-sm text-red-600">{updateError}</p>
                                )}
                                {updateSuccess && (
                                    <p className="text-sm text-green-600">Settings updated successfully!</p>
                                )}
                                {isAdmin && (
                                    <Button
                                        onClick={handleUpdateOrg}
                                        disabled={isUpdating || orgName === activeOrganization.name}
                                    >
                                        {isUpdating ? "Updating..." : "Save changes"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <BillingTab isOwner={isOwner} />

                    <TabsContent value="members" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Team Members</CardTitle>
                                        <CardDescription>
                                            Manage who has access to this team
                                        </CardDescription>
                                    </div>
                                    {isAdmin && (
                                        <Button onClick={() => setIsInviteDialogOpen(true)}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Invite member
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingMembers ? (
                                    <p className="text-sm text-muted-foreground">Loading members...</p>
                                ) : (
                                    <div className="space-y-4">
                                        {members.map((member) => {
                                            const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || User;
                                            const isCurrentUser = member.user.id === session?.user?.id;
                                            return (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center justify-between p-4 border rounded-lg"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {member.user.name || member.user.email}
                                                                {isCurrentUser && (
                                                                    <span className="ml-2 text-sm text-muted-foreground">(You)</span>
                                                                )}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {member.user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={roleColors[member.role as keyof typeof roleColors]}>
                                                            <RoleIcon className="mr-1 h-3 w-3" />
                                                            {member.role}
                                                        </Badge>
                                                        {isOwner && !isCurrentUser && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveMember(member.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invitations" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Invitations</CardTitle>
                                <CardDescription>
                                    Manage pending invitations to this team
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingInvitations ? (
                                    <p className="text-sm text-muted-foreground">Loading invitations...</p>
                                ) : invitations.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No pending invitations</p>
                                ) : (
                                    <div className="space-y-4">
                                        {invitations.map((invitation) => (
                                            <div
                                                key={invitation.id}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{invitation.email}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Invited by {invitation.inviter.name || invitation.inviter.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge>{invitation.role || "member"}</Badge>
                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleCancelInvitation(invitation.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {!isPersonalOrg && (
                        <TabsContent value="danger" className="space-y-4">
                            <Card className="border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                                    <CardDescription>
                                        Irreversible and destructive actions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                                        <div>
                                            <p className="font-medium">Delete this team</p>
                                            <p className="text-sm text-muted-foreground">
                                                Permanently delete this team and all its data
                                            </p>
                                        </div>
                                        {isOwner && (
                                            <Button
                                                variant="destructive"
                                                onClick={() => setIsDeleteDialogOpen(true)}
                                            >
                                                Delete team
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>

                {/* Invite Member Dialog */}
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite team member</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join this team
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="invite-email">Email address</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-role">Role</Label>
                                <Select value={inviteRole} onValueChange={(value: "member" | "admin") => setInviteRole(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {inviteError && (
                                <p className="text-sm text-red-600">{inviteError}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsInviteDialogOpen(false);
                                    setInviteEmail("");
                                    setInviteRole("member");
                                    setInviteError("");
                                }}
                                disabled={isInviting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleInviteMember}
                                disabled={!inviteEmail.trim() || isInviting}
                            >
                                {isInviting ? "Sending..." : "Send invitation"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Organization Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the team
                                &quot;{activeOrganization.name}&quot; and all its data including links, analytics, and settings.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteOrg}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? "Deleting..." : "Delete team"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}
