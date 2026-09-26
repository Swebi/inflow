import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { browser } from "wxt/browser";
import { CheckCircle2, LogOut, RefreshCw, Send, Unlink } from "lucide-react";
import Avatar from "boring-avatars";

import { useAuth } from "@/contexts/AuthContext";
import { TelegramLinkResponse } from "@/types/schema";
import { cn } from "@/lib/utils";
import { accentButton, outlineButton, quietDestructiveButton } from "@/lib/styles";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import gmailIcon from "@/assets/gmail.svg";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";
import telegramIcon from "@/assets/telegram.svg";

const API_BASE_URL = "http://localhost:8000/api";

const passwordInputClass = "text-[13px]";

/** Section eyebrow — one step up from the field labels beneath it so the
 *  header/content hierarchy reads even without a card wrapper. */
const sectionHeading =
  "font-mono text-[12px] font-semibold tracking-[-0.01em] text-slate-700";

/** Form-field label — a step quieter than `sectionHeading`. Overrides the
 *  size/weight/color from `type-meta` (utilities layer beats the component
 *  layer), keeping only its mono family + tracking. */
const fieldLabel = "text-[10.5px] font-normal text-slate-400";

/** "Connected" / "Not connected" for the Google + Telegram section cards. */
function ConnectionStatus({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] font-medium text-slate-700">
      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] font-medium text-slate-400">
      <span className="size-1.5 rounded-full bg-slate-300" aria-hidden />
      Not connected
    </span>
  );
}

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const {
    user,
    token,
    googleConnected,
    connectGoogle,
    disconnectGoogle,
    changePassword,
    logout,
  } = useAuth();

  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [telegramStatus, setTelegramStatus] = useState<TelegramLinkResponse | null>(null);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  const fetchTelegramStatus = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/telegram/link`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTelegramStatus(response.data.data);
    } catch (err) {
      setTelegramError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to load Telegram status"
          : "Failed to load Telegram status"
      );
    }
  }, [token]);

  useEffect(() => {
    if (open) fetchTelegramStatus();
  }, [open, fetchTelegramStatus]);

  const handleConnectTelegram = async () => {
    setTelegramBusy(true);
    setTelegramError(null);
    try {
      if (!telegramStatus) await fetchTelegramStatus();
      const deepLink = telegramStatus?.deepLink;
      if (!deepLink) {
        setTelegramError("Telegram isn't configured on the server yet.");
        return;
      }

      const tab = await browser.tabs.create({ url: deepLink });
      const handleTabRemoved = async (tabId: number) => {
        if (tabId === tab.id) {
          browser.tabs.onRemoved.removeListener(handleTabRemoved);
          await fetchTelegramStatus();
        }
      };
      browser.tabs.onRemoved.addListener(handleTabRemoved);
    } catch (err) {
      setTelegramError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setTelegramBusy(false);
    }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleReconnect = async () => {
    setGoogleBusy(true);
    setGoogleError(null);
    try {
      await connectGoogle();
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setGoogleBusy(true);
    setGoogleError(null);
    try {
      await disconnectGoogle();
    } catch (err) {
      setGoogleError(
        err instanceof Error ? err.message : "Failed to disconnect"
      );
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    setPasswordBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleLogout = () => {
    onOpenChange(false);
    logout();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b border-slate-200/70 px-gutter pb-3 pt-4">
          <DrawerTitle className="type-title text-[15px]">Settings</DrawerTitle>
          <DrawerDescription className="sr-only">
            Manage your account, connections, and password.
          </DrawerDescription>
        </DrawerHeader>

        <div className="divide-y divide-slate-200/70 overflow-y-auto px-gutter pb-6">
          {/* Account -------------------------------------------------------- */}
          <section className="space-y-2 py-4">
            <h3 className={sectionHeading}>Account</h3>
            <div className="flex items-center gap-3">
              <span className="shrink-0 rounded-full border-2 border-white shadow-md">
                <Avatar
                  name={user?.name || user?.email || "User"}
                  size={40}
                  variant="beam"
                />
              </span>
              <div className="min-w-0">
                {user?.name && (
                  <p className="type-item-title truncate">{user.name}</p>
                )}
                <p className="type-meta truncate">{user?.email}</p>
              </div>
            </div>
          </section>

          {/* Google connection ------------------------------------------------ */}
          <section className="space-y-2 py-4">
            <div className="flex items-center justify-between">
              <h3 className={sectionHeading}>Google connection</h3>
              <span className="flex items-center gap-1.5">
                <img
                  src={gmailIcon}
                  alt="Gmail"
                  title="Gmail"
                  className="size-4"
                />
                <img
                  src={calendarIcon}
                  alt="Google Calendar"
                  title="Google Calendar"
                  className="size-4"
                />
                <img
                  src={tasksIcon}
                  alt="Google Tasks"
                  title="Google Tasks"
                  className="size-4"
                />
              </span>
            </div>
            <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-card">
              <ConnectionStatus connected={googleConnected} />
              <div className="flex gap-2">
                {googleConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={googleBusy}
                    className={cn(outlineButton, "flex-1")}
                  >
                    <Unlink className="size-3.5" />
                    Disconnect
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReconnect}
                  disabled={googleBusy}
                  className={cn(outlineButton, "flex-1")}
                >
                  <RefreshCw className="size-3.5" />
                  {googleConnected ? "Reconnect" : "Connect"}
                </button>
              </div>
            </div>
            {googleError && (
              <p className="text-[12px] text-red-600">{googleError}</p>
            )}
          </section>

          {/* Telegram notifications ----------------------------------------- */}
          <section className="space-y-2 py-4">
            <div className="flex items-center justify-between">
              <h3 className={sectionHeading}>Telegram notifications</h3>
              <img
                src={telegramIcon}
                alt="Telegram"
                title="Telegram"
                className="size-4"
              />
            </div>
            <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-card">
              <ConnectionStatus connected={!!telegramStatus?.linked} />
              <p className="type-body text-[12px]">
                Get a message with Approve/Reject buttons the moment an action
                needs your review.
              </p>
              <button
                type="button"
                onClick={handleConnectTelegram}
                disabled={telegramBusy}
                className={cn(outlineButton, "w-full")}
              >
                <Send className="size-3.5" />
                {telegramStatus?.linked ? "Reconnect" : "Connect"}
              </button>
            </div>
            {telegramError && (
              <p className="text-[12px] text-red-600">{telegramError}</p>
            )}
          </section>

          {/* Change password --------------------------------------------------- */}
          <section className="space-y-2 py-4">
            <h3 className={sectionHeading}>Change password</h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-password" className={cn("type-meta", fieldLabel)}>
                  Current password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={passwordBusy}
                  className={passwordInputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className={cn("type-meta", fieldLabel)}>
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={passwordBusy}
                  className={passwordInputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className={cn("type-meta", fieldLabel)}>
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={passwordBusy}
                  className={passwordInputClass}
                />
              </div>

              {passwordError && (
                <p className="text-[12px] text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-[12px] text-green-600">
                  Password updated successfully.
                </p>
              )}

              <button
                type="submit"
                className={cn(accentButton, "w-full")}
                disabled={passwordBusy}
              >
                {passwordBusy ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>

          {/* Logout — quiet, final action -------------------------------------- */}
          <section className="py-4">
            <button
              type="button"
              onClick={handleLogout}
              className={quietDestructiveButton}
            >
              <LogOut className="size-3.5" />
              Log out
            </button>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
