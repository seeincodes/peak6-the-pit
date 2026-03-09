import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProfileEditor from "./ProfileEditor";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    patch: vi.fn(),
    get: vi.fn(),
  },
}));

function renderProfileEditor(props: {
  displayName?: string;
  avatarId?: string;
  bio?: string;
  onClose?: () => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileEditor
        displayName={props.displayName ?? "Test User"}
        avatarId={props.avatarId ?? "default"}
        bio={props.bio ?? ""}
        onClose={props.onClose ?? vi.fn()}
      />
    </QueryClientProvider>
  );
}

describe("ProfileEditor", () => {
  beforeEach(() => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} } as any);
  });

  it("renders Edit Profile heading and form fields", () => {
    renderProfileEditor();

    expect(screen.getByText(/Edit Profile/)).toBeTruthy();
    expect(screen.getByText(/Avatar/)).toBeTruthy();
    expect(screen.getByText(/Display Name/)).toBeTruthy();
    expect(screen.getByText(/Bio/)).toBeTruthy();
  });

  it("prefills display name and bio", () => {
    const { container } = renderProfileEditor({ displayName: "Alice", bio: "Phase 2 TA" });

    const textboxes = within(container).getAllByRole("textbox");
    expect((textboxes[0] as HTMLInputElement).value).toBe("Alice");
    expect((textboxes[1] as HTMLTextAreaElement).value).toBe("Phase 2 TA");
  });

  it("calls PATCH /users/me on Save", async () => {
    const onClose = vi.fn();
    const { container } = renderProfileEditor({ displayName: "Bob", bio: "Intern", onClose });

    const saveBtn = within(container).getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    await vi.waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/users/me", {
        display_name: "Bob",
        avatar_id: "default",
        bio: "Intern",
      });
    });
  });

  it("calls onClose when Cancel clicked", () => {
    const onClose = vi.fn();
    const { container } = renderProfileEditor({ onClose });

    const cancelBtn = within(container).getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it("disables Save when display name is empty", () => {
    const { container } = renderProfileEditor({ displayName: "X" });

    const nameInput = within(container).getAllByRole("textbox")[0];
    fireEvent.change(nameInput, { target: { value: "   " } });

    const saveBtn = within(container).getByRole("button", { name: /Save/i });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows bio character count", () => {
    renderProfileEditor({ bio: "Hello" });

    expect(screen.getByText(/5\/200/)).toBeTruthy();
  });
});
