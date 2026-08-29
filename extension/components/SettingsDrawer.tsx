import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { browser } from "wxt/browser";
import { CheckCircle2, RefreshCw, Send, Unlink } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { TelegramLinkResponse } from "@/types/schema";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const API_BASE_URL = "http://localhost:8000/api";

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const { user, token, googleConnected, connectGoogle, disconnectGoogle, changePassword } =
    useAuth();

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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>{user?.email}</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-8">
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-900">
              Google Account
            </h3>
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-sm">
                {googleConnected ? (
                  <>
                    <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                    <span className="text-slate-700">Connected</span>
                  </>
                ) : (
                  <span className="text-slate-500">Not connected</span>
                )}
              </div>
              <div className="flex gap-2">
                {googleConnected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={googleBusy}
                    className="flex-1"
                  >
                    <Unlink className="size-3.5" />
                    Disconnect
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleReconnect}
                  disabled={googleBusy}
                  className="flex-1"
                >
                  <RefreshCw className="size-3.5" />
                  {googleConnected ? "Reconnect" : "Connect"}
                </Button>
              </div>
            </div>
            {googleError && (
              <p className="text-xs text-red-600">{googleError}</p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-slate-900">
              Telegram Notifications
            </h3>
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-sm">
                {telegramStatus?.linked ? (
                  <>
                    <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                    <span className="text-slate-700">Connected</span>
                  </>
                ) : (
                  <span className="text-slate-500">Not connected</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Get a message with Approve/Reject buttons the moment an
                action needs your review.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleConnectTelegram}
                disabled={telegramBusy}
                className="w-full"
              >
                <Send className="size-3.5" />
                {telegramStatus?.linked ? "Reconnect" : "Connect"}
              </Button>
            </div>
            {telegramError && (
              <p className="text-xs text-red-600">{telegramError}</p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900">
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={passwordBusy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={passwordBusy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">
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
                />
              </div>

              {passwordError && (
                <p className="text-xs text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-xs text-green-600">
                  Password updated successfully.
                </p>
              )}

              <Button type="submit" className="w-full" disabled={passwordBusy}>
                {passwordBusy ? "Updating…" : "Update password"}
              </Button>
            </form>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
