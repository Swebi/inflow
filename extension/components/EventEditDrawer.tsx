"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";

import {
  EventFormData,
  EventResponse,
  EventSource,
  ScannedEventResponse,
  DrawerScreen,
  EventEditDrawerProps,
} from "@/types/schema";
import { scannedToFormData, formDataToEvent } from "@/utils/event";
import calendarIcon from "@/assets/calendar.svg";
import tasksIcon from "@/assets/tasks.svg";
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

const KIND_LABELS: Record<NonNullable<ScannedEventResponse["kind"]>, string> = {
  registration_deadline: "Registration deadline",
  event: "Event",
  deadline: "Deadline",
  other: "Other",
};

const SOURCE_OPTIONS: { value: EventSource; label: string; icon: string }[] = [
  { value: "google-calendar", label: "Calendar", icon: calendarIcon },
  { value: "google-tasks", label: "Tasks", icon: tasksIcon },
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
  const [screen, setScreen] = useState<DrawerScreen>("picker");
  const [selectedEvent, setSelectedEvent] =
    useState<ScannedEventResponse | null>(null);
  const [form, setForm] = useState<EventFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const hasMultiple = (initialEvents?.length ?? 0) > 1;
  const cameFromPicker = hasMultiple && screen === "form";

  useEffect(() => {
    if (!open) {
      setScreen("picker");
      setSelectedEvent(null);
      setForm(defaultFormData);
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

  const handleSave = () => {
    setSaving(true);
    const event = formDataToEvent(form);
    onSave(event);
    setSaving(false);
    onOpenChange(false);
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
            {screen === "picker" ? (
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-blue-50 hover:text-slate-900"
                aria-label="Close"
                onClick={handlePickerClose}
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-blue-50 hover:text-slate-900"
                aria-label="Back"
                onClick={handleBack}
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <DrawerTitle className="text-lg font-semibold text-slate-900">
              {screen === "picker"
                ? `We found ${initialEvents?.length ?? 0} actions`
                : "Add task"}
            </DrawerTitle>
          </div>
          {/* <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-blue-50 hover:text-slate-900"
            aria-label="More options"
          >
            <MoreHorizontal className="size-5" />
          </button> */}
        </DrawerHeader>

        {screen === "picker" ? (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {(initialEvents ?? []).map((ev, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex w-full flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50 active:bg-blue-100/50"
                  onClick={() => handlePick(ev)}
                >
                  <p className="font-medium text-slate-900">{ev.title}</p>
                  <p className="text-sm text-slate-600">
                    {ev.date}
                    {ev.kind && (
                      <span className="ml-1.5 text-slate-500">
                        · {KIND_LABELS[ev.kind]}
                      </span>
                    )}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <form
                id="event-edit-form"
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-700">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder="Event title"
                    className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Event description"
                    rows={2}
                    className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source" className="text-slate-700">
                    Source
                  </Label>
                  <Select
                    value={form.source}
                    onValueChange={(v) => update({ source: v as EventSource })}
                  >
                    <SelectTrigger
                      id="source"
                      className="w-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50 data-placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-200"
                    >
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white">
                      {SOURCE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="focus:bg-blue-50 focus:text-slate-900"
                        >
                          <img
                            src={opt.icon}
                            alt=""
                            className="size-4 shrink-0"
                            aria-hidden
                          />
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.source === "google-tasks" ? (
                  <div className="space-y-2">
                    <Label className="text-slate-700">Due date</Label>
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <DatePicker
                        value={form.dueDate}
                        onChange={(d) => d && update({ dueDate: d })}
                        placeholder="Date"
                        className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 data-[empty=true]:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-200"
                        popoverClassName="border-slate-200 bg-white shadow-lg"
                      />
                      <Input
                        type="time"
                        value={form.dueTime}
                        onChange={(e) => update({ dueTime: e.target.value })}
                        className="border-slate-200 bg-white text-slate-900 focus-visible:border-blue-500 focus-visible:ring-blue-200 min-w-[100px]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Start</Label>
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <DatePicker
                          value={form.startDate}
                          onChange={(d) => d && update({ startDate: d })}
                          placeholder="Date"
                          className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 data-[empty=true]:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-200"
                          popoverClassName="border-slate-200 bg-white shadow-lg"
                        />
                        <Input
                          type="time"
                          value={form.startTime}
                          onChange={(e) =>
                            update({ startTime: e.target.value })
                          }
                          className="border-slate-200 bg-white text-slate-900 focus-visible:border-blue-500 focus-visible:ring-blue-200 min-w-[100px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">End</Label>
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <DatePicker
                          value={form.endDate}
                          onChange={(d) => d && update({ endDate: d })}
                          placeholder="Date"
                          className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 data-[empty=true]:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-200"
                          popoverClassName="border-slate-200 bg-white shadow-lg"
                        />
                        <Input
                          type="time"
                          value={form.endTime}
                          onChange={(e) => update({ endTime: e.target.value })}
                          className="border-slate-200 bg-white text-slate-900 focus-visible:border-blue-500 focus-visible:ring-blue-200 min-w-[100px]"
                        />
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>

            <DrawerFooter className="border-t border-slate-200 bg-white px-4 py-4">
              <Button
                type="submit"
                form="event-edit-form"
                className="w-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500"
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
