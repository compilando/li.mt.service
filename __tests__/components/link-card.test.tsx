import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinkCard } from "@/components/dashboard/link-card";
import * as linksActions from "@/lib/actions/links";

// Mock the actions
vi.mock("@/lib/actions/links", () => ({
    deleteLink: vi.fn(),
    archiveLink: vi.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
    },
});

// Mock window.confirm
global.confirm = vi.fn();

const mockLink = {
    id: "link-1",
    shortCode: "abc123",
    url: "https://example.com",
    title: "Example Link",
    description: "A test link",
    archived: false,
    createdAt: new Date("2024-01-01"),
    tags: [
        {
            tag: {
                id: "tag-1",
                name: "Test Tag",
                color: "#ff0000",
            },
        },
    ],
    _count: { clicks: 42 },
    domain: { name: "example.com" },
    comments: null,
    password: null,
    expiresAt: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    iosTarget: null,
    androidTarget: null,
    organizationId: "org-1",
};

describe("LinkCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders link information correctly", () => {
        render(<LinkCard link={mockLink} />);

        expect(screen.getByText("Example Link")).toBeInTheDocument();
        expect(screen.getByText(/abc123/)).toBeInTheDocument();
        expect(screen.getByText("42")).toBeInTheDocument();
        expect(screen.getByText("Test Tag")).toBeInTheDocument();
    });

    it("calls onUpdate after successful delete", async () => {
        const onUpdate = vi.fn();
        const user = userEvent.setup();

        // Mock confirm to return true
        (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

        // Mock successful delete
        vi.mocked(linksActions.deleteLink).mockResolvedValue({
            success: true,
            data: undefined,
        });

        render(<LinkCard link={mockLink} onUpdate={onUpdate} />);

        // Open dropdown menu
        const moreButton = screen.getByRole("button", { name: "" });
        await user.click(moreButton);

        // Click delete
        const deleteButton = screen.getByText("Delete");
        await user.click(deleteButton);

        await waitFor(() => {
            expect(linksActions.deleteLink).toHaveBeenCalledWith("link-1");
            expect(onUpdate).toHaveBeenCalledTimes(1);
        });
    });

    it("does not call onUpdate if delete is cancelled", async () => {
        const onUpdate = vi.fn();
        const user = userEvent.setup();

        // Mock confirm to return false (user cancels)
        (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

        render(<LinkCard link={mockLink} onUpdate={onUpdate} />);

        // Open dropdown menu
        const moreButton = screen.getByRole("button", { name: "" });
        await user.click(moreButton);

        // Click delete
        const deleteButton = screen.getByText("Delete");
        await user.click(deleteButton);

        await waitFor(() => {
            expect(linksActions.deleteLink).not.toHaveBeenCalled();
            expect(onUpdate).not.toHaveBeenCalled();
        });
    });

    it("does not call onUpdate if delete fails", async () => {
        const onUpdate = vi.fn();
        const user = userEvent.setup();

        // Mock confirm to return true
        (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

        // Mock failed delete
        vi.mocked(linksActions.deleteLink).mockResolvedValue({
            success: false,
            error: "Failed to delete",
        });

        render(<LinkCard link={mockLink} onUpdate={onUpdate} />);

        // Open dropdown menu
        const moreButton = screen.getByRole("button", { name: "" });
        await user.click(moreButton);

        // Click delete
        const deleteButton = screen.getByText("Delete");
        await user.click(deleteButton);

        await waitFor(() => {
            expect(linksActions.deleteLink).toHaveBeenCalledWith("link-1");
            expect(onUpdate).not.toHaveBeenCalled();
        });
    });

    it("calls onUpdate after successful archive", async () => {
        const onUpdate = vi.fn();
        const user = userEvent.setup();

        // Mock successful archive
        vi.mocked(linksActions.archiveLink).mockResolvedValue({
            success: true,
            data: undefined,
        });

        render(<LinkCard link={mockLink} onUpdate={onUpdate} />);

        // Open dropdown menu
        const moreButton = screen.getByRole("button", { name: "" });
        await user.click(moreButton);

        // Click archive
        const archiveButton = screen.getByText("Archive");
        await user.click(archiveButton);

        await waitFor(() => {
            expect(linksActions.archiveLink).toHaveBeenCalledWith("link-1", true);
            expect(onUpdate).toHaveBeenCalledTimes(1);
        });
    });

    it("calls onUpdate after successful unarchive", async () => {
        const onUpdate = vi.fn();
        const user = userEvent.setup();

        // Mock successful unarchive
        vi.mocked(linksActions.archiveLink).mockResolvedValue({
            success: true,
            data: undefined,
        });

        const archivedLink = { ...mockLink, archived: true };
        render(<LinkCard link={archivedLink} onUpdate={onUpdate} />);

        // Open dropdown menu
        const moreButton = screen.getByRole("button", { name: "" });
        await user.click(moreButton);

        // Click unarchive
        const unarchiveButton = screen.getByText("Unarchive");
        await user.click(unarchiveButton);

        await waitFor(() => {
            expect(linksActions.archiveLink).toHaveBeenCalledWith("link-1", false);
            expect(onUpdate).toHaveBeenCalledTimes(1);
        });
    });

    it("does not call onUpdate if archive fails", async () => {
        const onUpdate = vi.fn();
        const user = userEvent.setup();

        // Mock failed archive
        vi.mocked(linksActions.archiveLink).mockResolvedValue({
            success: false,
            error: "Failed to archive",
        });

        render(<LinkCard link={mockLink} onUpdate={onUpdate} />);

        // Open dropdown menu
        const moreButton = screen.getByRole("button", { name: "" });
        await user.click(moreButton);

        // Click archive
        const archiveButton = screen.getByText("Archive");
        await user.click(archiveButton);

        await waitFor(() => {
            expect(linksActions.archiveLink).toHaveBeenCalledWith("link-1", true);
            expect(onUpdate).not.toHaveBeenCalled();
        });
    });

    it("works without onUpdate callback", async () => {
        const user = userEvent.setup();

        // Mock confirm to return true
        (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

        // Mock successful delete
        vi.mocked(linksActions.deleteLink).mockResolvedValue({
            success: true,
            data: undefined,
        });

        // Should not throw error even without onUpdate
        render(<LinkCard link={mockLink} />);

        const moreButton = screen.getByRole("button", { name: "" });
        await user.click(moreButton);

        const deleteButton = screen.getByText("Delete");
        await user.click(deleteButton);

        await waitFor(() => {
            expect(linksActions.deleteLink).toHaveBeenCalledWith("link-1");
        });
    });
});
