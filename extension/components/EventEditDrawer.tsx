"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, Calendar, ListTodo, type LucideIcon } from "lucide-react";
import axios from "axios";

import {
  EventFormData,
  EventSource,
  ScannedEventResponse,
  DrawerScreen,
  EventEditDrawerProps,
} from "@/types/schema";
import { scannedToFormData, kindLabel, formatHumanDate } from "@/utils/event";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { DatePicker } from "./ui/date-picker";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
} from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

const API_BASE_URL = "http://localhost:8000/api";

const SOURCE_OPTIONS: { value: EventSource; label: string; icon: LucideIcon }[] = [
  { value: "google-calendar", label: "Calendar", icon: Calendar },
  { value: "google-tasks", label: "Tasks", icon: ListTodo },
];

const defaultFormData: EventFormData = {
  title: "",
  description: "",
  source: "google-calendar",
  dueDate: new Date(),
  dueTime: "",
  startDate: new Date(),
  startTime: "",
  endDate: new Date(),
  endTime: "",
};

export function EventEditDrawer({
  open,
  onOpenChange,
  initialEvents,
  onSave,
}: EventEditDrawerProps) {
  const { token } = useAuth();
  const [screen, setScreen] = useState<DrawerScreen>("picker");
  const [selectedEvent, setSelectedEvent] =
    useState<ScannedEventResponse | null>(null);
  const [form, setForm] = useState<EventFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasMultiple = (initialEvents?.length ?? 0) > 1;
  const cameFromPicker = hasMultiple && screen === "form";

  useEffect(() => {
    if (!open) {
      setScreen("picker");
      setSelectedEvent(null);
      setForm(defaultFormData);
      setSaveError(null);
      return;
    }
    if (!initialEvents || initialEvents.length === 0) return;

    if (initialEvents.length === 1) {
      setScreen("form");
      setSelectedEvent(initialEvents[0]);
      setForm(scannedToFormData(initialEvents[0]));
    } else {
      setScreen("picker");
      setSelectedEvent(null);
    }
  }, [open, initialEvents]);

  useEffect(() => {
    if (open && selectedEvent && screen === "form") {
      setForm(scannedToFormData(selectedEvent));
    }
  }, [open, selectedEvent, screen]);

  const handlePick = (event: ScannedEventResponse) => {
    setSelectedEvent(event);
    setScreen("form");
  };

  const handleBack = () => {
    setSaveError(null);
    if (cameFromPicker) {
      setScreen("picker");
      setSelectedEvent(null);
    } else {
      onOpenChange(false);
    }
  };

  const handlePickerClose = () => {
    onOpenChange(false);
  };

  const update = (patch: Partial<EventFormData>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.source != null && patch.source !== prev.source) {
        if (patch.source === "google-tasks") {
          next.dueDate = prev.startDate;
          next.dueTime = prev.startTime;
        } else {
          next.startDate = prev.dueDate;
          next.endDate = prev.dueDate;
          next.startTime = prev.dueTime;
          next.endTime = prev.dueTime;
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setSaveError(null);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (form.source === "google-calendar") {
        const dateStr = format(form.startDate, "yyyy-MM-dd");
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const hasTime = Boolean(form.startTime && form.endTime);
        await axios.post(
          `${API_BASE_URL}/calendar/events`,
          {
            summary: form.title.trim(),
            startTime: hasTime ? form.startTime : undefined,
            endTime: hasTime ? form.endTime : undefined,
            date: dateStr,
            description: form.description.trim() || undefined,
            timeZone,
          },
          { headers }
        );
      } else {
        const dueDateStr = format(form.dueDate, "yyyy-MM-dd");
        await axios.post(
          `${API_BASE_URL}/tasks/tasks`,
          {
            title: form.title.trim(),
            notes: form.description.trim() || undefined,
            dueDate: dueDateStr,
            dueTime: form.dueTime || undefined,
          },
          { headers }
        );
      }

      onSave();
      onOpenChange(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.message;
        setSaveError(
          msg === "Google account not connected"
            ? "Connect your Google account first (see banner above)."
            : msg || "Failed to save"
        );
      } else {
        setSaveError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        className={cn(
          "max-h-[92vh] data-[vaul-drawer-direction=bottom]:mt-8 data-[vaul-drawer-direction=bottom]:max-h-[92vh]",
          "flex flex-col bg-white border-slate-200"
        )}
      >
        <DrawerHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              aria-label={screen === "picker" ? "Close" : "Back"}
              onClick={screen === "picker" ? handlePickerClose : handleBack}
            >
              <ArrowLeft className="size-5" />
            </button>
            <DrawerTitle className="type-title text-[15px]">
              {screen === "picker"
                ? `We found ${initialEvents?.length ?? 0} actions`
                : "Add task"}
            </DrawerTitle>
          </div>
        </DrawerHeader>

        {screen === "picker" ? (
          <div className="flex-1 overflow-y-auto px-gutter py-4">
            <div className="space-y-3">
              {(initialEvents ?? []).map((ev, i) => (
                <button
                  key={i}
                  type="button"
                  className="surface-card flex w-full flex-col gap-1.5 p-4 text-left transition-shadow hover:shadow-md active:bg-slate-50"
                  onClick={() => handlePick(ev)}
                >
                  <p className="type-title line-clamp-2">{ev.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="type-meta">{formatHumanDate(ev.date)}</span>
                    {ev.kind && <Badge>{kindLabel(ev.kind)}</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-gutter py-4">
              <form
                id="event-edit-form"
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="title" className="type-meta">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder="Event title"
                    className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-accent focus-visible:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="type-meta">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Event description"
                    rows={2}
                    className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-accent focus-visible:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source" className="type-meta">
                    Source
                  </Label>
                  <Select
                    value={form.source}
                    onValueChange={(v) => update({ source: v as EventSource })}
                  >
                    <SelectTrigger
                      id="source"
                      className="w-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50 data-placeholder:text-slate-400 focus-visible:border-accent focus-visible:ring-accent/30"
                    >
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white">
                      {SOURCE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="focus:bg-slate-100 focus:text-slate-900"
                        >
                          <opt.icon className="size-4 shrink-0" aria-hidden />
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.source === "google-tasks" ? (
                  <div className="space-y-2">
                    <Label className="type-meta">Due date</Label>
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <DatePicker
                        value={form.dueDate}
                        onChange={(d) => d && update({ dueDate: d })}
                        placeholder="Date"
                        className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 data-[empty=true]:text-slate-400 focus-visible:border-accent focus-visible:ring-accent/30"
                        popoverClassName="border-slate-200 bg-white shadow-lg"
                      />
                      <Input
                        type="time"
                        value={form.dueTime}
                        onChange={(e) => update({ dueTime: e.target.value })}
                        className="border-slate-200 bg-white text-slate-900 focus-visible:border-accent focus-visible:ring-accent/30 min-w-[100px]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="type-meta">Start</Label>
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <DatePicker
                          value={form.startDate}
                          onChange={(d) => d && update({ startDate: d })}
                          placeholder="Date"
                          className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 data-[empty=true]:text-slate-400 focus-visible:border-accent focus-visible:ring-accent/30"
                          popoverClassName="border-slate-200 bg-white shadow-lg"
                        />
                        <Input
                          type="time"
                          value={form.startTime}
                          onChange={(e) =>
                            update({ startTime: e.target.value })
                          }
                          className="border-slate-200 bg-white text-slate-900 focus-visible:border-accent focus-visible:ring-accent/30 min-w-[100px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="type-meta">End</Label>
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <DatePicker
                          value={form.endDate}
                          onChange={(d) => d && update({ endDate: d })}
                          placeholder="Date"
                          className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 data-[empty=true]:text-slate-400 focus-visible:border-accent focus-visible:ring-accent/30"
                          popoverClassName="border-slate-200 bg-white shadow-lg"
                        />
                        <Input
                          type="time"
                          value={form.endTime}
                          onChange={(e) => update({ endTime: e.target.value })}
                          className="border-slate-200 bg-white text-slate-900 focus-visible:border-accent focus-visible:ring-accent/30 min-w-[100px]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {saveError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
                    {saveError}
                  </p>
                )}
              </form>
            </div>

            <DrawerFooter className="border-t border-slate-200 bg-white px-4 py-4">
              <Button
                type="submit"
                form="event-edit-form"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
                disabled={saving || !form.title.trim()}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
