"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-base";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import {
  assignmentFileMetaSchema,
  assignmentIntakeErrorResponseSchema,
  assignmentIntakeRequestSchema,
  assignmentIntakeSuccessResponseSchema,
  QUESTION_TYPE_OPTIONS,
  questionTypeOptionSchema,
} from "@repo/shared/assignment";
import {
  CLASS_OPTIONS,
  SUBJECT_OPTIONS,
  getChapterSuggestions,
} from "@/constants/assignment-form.constants";
import { useToast } from "@/components/ToastProvider";
import { useAssignmentStore } from "@/store/assignment.store";
import { PageHeader } from "@/components/PageHeader";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  length: number;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

// Mobile Counter Component
function CounterControl({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-center text-sm font-medium text-primary">
        {label}
      </span>
      <div className="flex w-full items-center justify-between rounded-full bg-white px-2 py-2">
        <button
          type="button"
          onClick={onDecrement}
          className="flex h-6 w-6 items-center justify-center"
          aria-label={`Decrease ${label}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.33 8.67L2.67 8.67C2.3 8.67 2 8.37 2 8C2 7.63 2.3 7.33 2.67 7.33L13.33 7.33C13.7 7.33 14 7.63 14 8C14 8.37 13.7 8.67 13.33 8.67Z"
              fill="#5E5E5E"
            />
          </svg>
        </button>
        <span className="text-base font-medium text-primary">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          className="flex h-6 w-6 items-center justify-center"
          aria-label={`Increase ${label}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3.33V12.67M3.33 8H12.67"
              stroke="#5E5E5E"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Desktop Stepper Component
function Stepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="inline-flex w-25 h-10 items-center rounded-full bg-white px-2 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={onDecrement}
        className="h-7 w-7 rounded-full transition hover:bg-gray-100"
        aria-label="Decrease value"
      >
        -
      </button>
      <span className="w-7 text-center text-sm font-semibold text-gray-700">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="h-7 w-7 rounded-full transition hover:bg-gray-100"
        aria-label="Increase value"
      >
        +
      </button>
    </div>
  );
}

export function AssignmentDetailsForm() {
  const router = useRouter();
  const {
    rows,
    additionalInfo,
    subject,
    classLevel,
    chapterName,
    dueDate,
    selectedFile,
    isSubmitting,
    updateRow,
    removeRow,
    addQuestionType,
    setAdditionalInfo,
    setSubject,
    setClassLevel,
    setChapterName,
    setDueDate,
    setSelectedFile,
    setIsSubmitting,
  } = useAssignmentStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const classDropdownRef = useRef<HTMLDivElement | null>(null);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const additionalInfoRef = useRef(additionalInfo);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const realtimeStatus = useRealtimeStatus();
  const toast = useToast();

  const chapterSuggestions = useMemo(
    () => getChapterSuggestions(subject),
    [subject],
  );

  const totalQuestions = useMemo(
    () => rows.reduce((sum, row) => sum + row.questions, 0),
    [rows],
  );
  const totalMarks = useMemo(
    () => rows.reduce((sum, row) => sum + row.questions * row.marks, 0),
    [rows],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  useEffect(() => {
    additionalInfoRef.current = additionalInfo;
  }, [additionalInfo]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!classDropdownRef.current) {
        return;
      }

      if (!classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = () => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      toast.error("Voice input is not supported on this browser.");
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!speechRecognitionRef.current) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcriptParts: string[] = [];

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index]?.[0]?.transcript?.trim();

          if (transcript) {
            transcriptParts.push(transcript);
          }
        }

        if (transcriptParts.length === 0) {
          return;
        }

        const combinedTranscript = transcriptParts.join(" ");
        const existingText = additionalInfoRef.current.trim();
        const nextText = existingText
          ? `${existingText} ${combinedTranscript}`
          : combinedTranscript;

        setAdditionalInfo(nextText);
      };

      recognition.onerror = () => {
        toast.error("Could not capture voice input. Please try again.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }

    try {
      speechRecognitionRef.current.start();
      setIsListening(true);
      toast.info("Listening. Tap the mic again to stop.");
    } catch {
      setIsListening(false);
      toast.error("Could not start voice input.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!classLevel) {
      toast.error("Please select class.");
      return;
    }

    if (!subject.trim()) {
      toast.error("Subject is required.");
      return;
    }

    const fileMetaParsed = assignmentFileMetaSchema.safeParse(
      selectedFile
        ? {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
          }
        : null,
    );

    if (!fileMetaParsed.success) {
      toast.error(fileMetaParsed.error.issues[0]?.message || "Invalid file.");
      return;
    }

    const payloadCandidate = {
      dueDate,
      classLevel,
      subject,
      chapterName,
      additionalInfo,
      questionTypes: rows,
      totals: {
        totalQuestions,
        totalMarks,
      },
      file: fileMetaParsed.data,
    };

    const payloadParsed =
      assignmentIntakeRequestSchema.safeParse(payloadCandidate);

    if (!payloadParsed.success) {
      toast.error(
        payloadParsed.error.issues[0]?.message || "Invalid assignment details.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(getApiUrl("/assignments/intake"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadParsed.data),
      });

      if (!response.ok) {
        const rawErrorPayload = await response.json().catch(() => null);
        const errorPayload =
          assignmentIntakeErrorResponseSchema.safeParse(rawErrorPayload);

        toast.error(
          errorPayload.success
            ? errorPayload.data.error
            : "Endpoint reached, but backend logic is not implemented yet.",
        );
        return;
      }

      const rawSuccessPayload = await response.json().catch(() => null);
      const successPayload =
        assignmentIntakeSuccessResponseSchema.safeParse(rawSuccessPayload);

      if (!successPayload.success) {
        toast.error("Backend returned an unexpected response.");
        return;
      }

      toast.success("Assignment details submitted successfully.");
      router.push(`/assignments/${successPayload.data.assignmentId}`);
    } catch {
      toast.error("Could not reach backend endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <section className="flex min-h-screen flex-col">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"
            aria-hidden="true"
          />
          <p className="text-base font-bold text-primary">
            Preparing your assignment...
          </p>
          <p className="text-lg font-normal text-primary">
            I am using a LOCAL LLM model. So, this may take a while to process.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* MOBILE LAYOUT - Hidden on sm and above */}
      <section className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-44 md:hidden">
        {/* Step header */}
        <div className="mx-auto w-full rounded-xl">
          <PageHeader
            title="Create Assignment"
            subtitle="Set up a new assignment for your students."
            showRealtime
            realtimeStatus={realtimeStatus}
            showHeader
          />
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="h-[5px] flex-1 rounded-full bg-[#5E5E5E]" />
          <div className="h-[5px] flex-1 rounded-full bg-[#DADADA]" />
        </div>

        {/* Main card */}
        <div className="flex flex-col gap-6 rounded-[32px] bg-white/50 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
          {/* Card title */}
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-bold tracking-tight text-primary">
              Assignment Details
            </h2>
            <p className="text-sm text-secondary">
              Basic information about your assignment
            </p>
          </div>

          <form
            id="create-assignment-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            {/* File upload */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col items-center gap-4 rounded-[32px] border-[1.75px] border-dashed border-black/20 bg-[#F6F6F6] px-6 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M16 16L12 12M12 12L8 16M12 12V21M20.39 18.39C21.37 17.86 22.14 17.02 22.58 15.99C23.02 14.98 23.12 13.84 22.84 12.77C22.57 11.69 21.94 10.74 21.07 10.05C20.19 9.37 19.11 9 18 9H16.74C16.44 7.83 15.87 6.74 15.09 5.82C14.31 4.9 13.32 4.17 12.22 3.68C11.11 3.19 9.91 2.96 8.7 3.01C7.49 3.05 6.31 3.37 5.24 3.94C4.17 4.51 3.25 5.31 2.53 6.28C1.82 7.26 1.34 8.39 1.12 9.58C0.91 10.77 0.96 11.99 1.29 13.15C1.61 14.32 2.2 15.39 3 16.3"
                      stroke="#1E1E1E"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-medium text-primary">
                    Choose a file or drag &amp; drop it here
                  </p>
                  <p className="text-sm text-disabled">
                    JPEG, PNG, PDF, upto 10MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full bg-white px-6 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-gray-50"
                >
                  Browse Files
                </button>
                {selectedFile && (
                  <p className="text-xs text-muted">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <p className="text-center text-base font-medium text-primary/60">
                Upload images or PDF of your preferred document
              </p>
            </div>

            {/* Class */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-primary">Class</p>
              <div className="relative" ref={classDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsClassDropdownOpen((value) => !value)}
                  className="flex h-11 w-full items-center justify-between rounded-full border border-[#DADADA] bg-white px-4 text-base text-primary transition hover:border-gray-400"
                  aria-expanded={isClassDropdownOpen}
                  aria-label="Select class"
                >
                  <span>
                    {classLevel ? `Class ${classLevel}` : "Class"}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isClassDropdownOpen ? (
                  <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg no-scrollbar">
                    {CLASS_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setClassLevel(option);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-base font transition hover:bg-gray-100 text-muted ${
                          classLevel === option
                            ? "bg-gray-100 font-bold text-primary"
                            : "text-muted"
                        }`}
                      >
                        Class {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-primary">Subject</p>
              <div className="relative">
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                  list="subject-options"
                  required
                  className="hide-datalist-indicator h-11 w-full rounded-full border border-[#DADADA] bg-white px-4 pr-9 text-base font-medium text-primary placeholder:text-gray-400 focus:outline-none"
                />
                <datalist id="subject-options">
                  {SUBJECT_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Chapter */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="chapterName"
                className="text-sm font-bold text-primary"
              >
                Chapter
              </label>
              <div className="relative">
                <input
                  id="chapterName"
                  type="text"
                  value={chapterName}
                  onChange={(event) => setChapterName(event.target.value)}
                  placeholder="Chapter"
                  list="chapter-options"
                  required
                  className="hide-datalist-indicator h-11 w-full rounded-full border border-[#DADADA] bg-white px-4 pr-9 text-base font-medium text-primary placeholder:text-gray-400 focus:outline-none"
                />
                <datalist id="chapter-options">
                  {chapterSuggestions.map((chapter) => (
                    <option key={chapter} value={chapter} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-primary">
                Due Date
              </label>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker()}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-[#DADADA] bg-white transition-colors hover:bg-gray-50 active:bg-gray-100"
                  aria-label="date"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2 8C2 5.24 4.24 3 7 3H17C19.76 3 22 5.24 22 8V17C22 19.76 19.76 22 17 22H7C4.24 22 2 19.76 2 17V8ZM7 5C5.34 5 4 6.34 4 8V17C4 18.66 5.34 20 7 20H17C18.66 20 20 18.66 20 17V8C20 6.34 18.66 5 17 5H7Z"
                      fill="#2B2B2B"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8 2C8.55 2 9 2.45 9 3V6C9 6.55 8.55 7 8 7C7.45 7 7 6.55 7 6V3C7 2.45 7.45 2 8 2Z"
                      fill="#2B2B2B"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M16 2C16.55 2 17 2.45 17 3V6C17 6.55 16.55 7 16 7C15.45 7 15 6.55 15 6V3C15 2.45 15.45 2 16 2Z"
                      fill="#2B2B2B"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 9C12.55 9 13 9.45 13 10V12H15C15.55 12 16 12.45 16 13C16 13.55 15.55 14 15 14H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V14H9C8.45 14 8 13.55 8 13C8 12.45 8.45 12 9 12H11V10C11 9.45 11.45 9 12 9Z"
                      fill="#2B2B2B"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Question Type */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-primary">
                Question Type
              </h3>

              <div className="flex flex-col gap-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col gap-3 rounded-[32px] bg-white p-4"
                  >
                    {/* Type selector row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <select
                          value={row.type}
                          onChange={(event) => {
                            const parsedType =
                              questionTypeOptionSchema.safeParse(
                                event.target.value,
                              );

                            if (!parsedType.success) {
                              return;
                            }

                            updateRow(row.id, { type: parsedType.data });
                          }}
                          className="h-10 w-full appearance-none rounded-full border border-[#DADADA] bg-white px-4 pr-9 text-sm font-medium text-primary focus:outline-none"
                        >
                          {QUESTION_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M4 6L8 10L12 6"
                            stroke="#303030"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        aria-label="Remove question type"
                        className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-gray-100"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M12 4L4 12M4 4L12 12"
                            stroke="#303030"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Counter controls */}
                    <div className="flex items-start gap-3 rounded-[24px] bg-[#F0F0F0] p-3">
                      <CounterControl
                        label="No. of Questions"
                        value={row.questions}
                        onDecrement={() =>
                          updateRow(row.id, {
                            questions: Math.max(1, row.questions - 1),
                          })
                        }
                        onIncrement={() =>
                          updateRow(row.id, { questions: row.questions + 1 })
                        }
                      />
                      <CounterControl
                        label="Marks"
                        value={row.marks}
                        onDecrement={() =>
                          updateRow(row.id, {
                            marks: Math.max(1, row.marks - 1),
                          })
                        }
                        onIncrement={() =>
                          updateRow(row.id, { marks: row.marks + 1 })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Type button */}
              <button
                type="button"
                onClick={addQuestionType}
                className="flex items-center gap-2 self-start"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B2B2B]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2.5 10C2.5 9.54 2.87 9.17 3.33 9.17H16.67C17.13 9.17 17.5 9.54 17.5 10C17.5 10.46 17.13 10.83 16.67 10.83H3.33C2.87 10.83 2.5 10.46 2.5 10Z"
                      fill="white"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 2.5C10.46 2.5 10.83 2.87 10.83 3.33V16.67C10.83 17.13 10.46 17.5 10 17.5C9.54 17.5 9.17 17.13 9.17 16.67V3.33C9.17 2.87 9.54 2.5 10 2.5Z"
                      fill="white"
                    />
                  </svg>
                </span>
                <span className="text-sm font-bold text-primary">
                  Add Question Type
                </span>
              </button>

              {/* Totals */}
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-base font-medium text-primary">
                  Total Questions :{" "}
                  <span className="font-bold">{totalQuestions}</span>
                </p>
                <p className="text-base font-medium text-primary">
                  Total Marks : <span className="font-bold">{totalMarks}</span>
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="additionalInfo"
                className="text-sm font-bold text-primary"
              >
                Additional Information (For better output)
              </label>
              <div className="relative">
                <textarea
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={(event) =>
                    setAdditionalInfo(event.target.value)
                  }
                  rows={4}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  className="w-full rounded-2xl border-dashed-8 bg-white/25 p-4 pr-10 text-sm text-primary placeholder:text-[#30303099] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full transition ${
                    isListening ? "bg-primary/10" : "bg-transparent"
                  }`}
                  aria-label={
                    isListening
                      ? "Stop voice input for additional information"
                      : "Start voice input for additional information"
                  }
                >
                  <Image
                    src="/icons/Mic.svg"
                    alt=""
                    aria-hidden="true"
                    width={11}
                    height={14}
                  />
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-primary shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.92 3.58C9.25 3.9 9.25 4.43 8.92 4.76L4.51 9.17H17.5C17.96 9.17 18.33 9.54 18.33 10C18.33 10.46 17.96 10.83 17.5 10.83H4.51L8.92 15.24C9.25 15.57 9.25 16.1 8.92 16.42C8.6 16.75 8.07 16.75 7.74 16.42L1.91 10.59C1.59 10.26 1.59 9.74 1.91 9.41L7.74 3.58C8.07 3.25 8.6 3.25 8.92 3.58Z"
                fill="#303030"
              />
            </svg>
            Previous
          </button>
          <button
            form="create-assignment-form"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-full border border-white/50 bg-[#181818] px-6 py-3 text-sm font-medium text-white shadow-[0_16px_48px_rgba(0,0,0,0.12),0_32px_48px_rgba(0,0,0,0.20)] transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.08 3.58C11.4 3.25 11.93 3.25 12.26 3.58L18.09 9.41C18.41 9.74 18.41 10.26 18.09 10.59L12.26 16.42C11.93 16.75 11.4 16.75 11.08 16.42C10.75 16.1 10.75 15.57 11.08 15.24L15.49 10.83H2.5C2.04 10.83 1.67 10.46 1.67 10C1.67 9.54 2.04 9.17 2.5 9.17H15.49L11.08 4.76C10.75 4.43 10.75 3.9 11.08 3.58Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* DESKTOP LAYOUT - Hidden on smaller than sm */}
      <section className="hidden md:flex min-h-screen flex-col gap-3">

        <div className="flex flex-col gap-8 mx-auto w-full max-w-4xl flex-1">
          <div className="flex flex-col gap-8 rounded-2xl bg-white/50 shadow-[0px_36px_48px_rgba(0,0,0,0.1)] p-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-primary">
                Assignment Details
              </h2>
              <p className="text-xs text-disabled">
                Basic information about your assignment
              </p>
            </div>
            <form
              id="create-assignment-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="mx-auto w-full flex flex-col items-center gap-4 rounded-2xl border-dashed-8 bg-white p-6 text-center">
                  <Image
                    src="/icons/Upload.svg"
                    alt=""
                    aria-hidden="true"
                    width={40}
                    height={40}
                  />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-primary">
                      Choose a file or drag &amp; drop it here
                    </p>
                    <p className="text-xs text-disabled">
                      JPEG, PNG, PDF, upto 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-9 items-center rounded-full bg-off-white-primary px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Browse Files
                  </button>
                  {selectedFile ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: {selectedFile.name}
                    </p>
                  ) : null}
                </div>

                <p className="text-center text-xs text-gray-500">
                  Upload images or PDF of your preferred document
                </p>
              </div>

              <div className="">
                <div className="grid gap-2 sm:grid-cols-[0.8fr_1fr_1.4fr_auto]">
                  <p className="pl-1 text-[16px] font-bold text-primary">
                    Class
                  </p>
                  <p className="pl-1 text-[16px] font-bold text-primary">
                    Subject
                  </p>
                  <label
                    htmlFor="chapterName"
                    className="pl-1 text-[16px] font-bold text-primary"
                  >
                    Chapter
                  </label>
                  <p className="pl-1 text-[16px] font-bold text-primary">
                    Date
                  </p>

                  <div className="relative" ref={classDropdownRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setIsClassDropdownOpen((value) => !value)
                      }
                      className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-base text-primary"
                      aria-expanded={isClassDropdownOpen}
                      aria-label="Select class"
                    >
                      <span>
                        {classLevel ? `Class ${classLevel}` : "Class"}
                      </span>
                      <Image
                        src="/icons/Chevron.svg"
                        alt=""
                        aria-hidden="true"
                        width={10}
                        height={6}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                      />
                    </button>

                    {isClassDropdownOpen ? (
                      <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg no-scrollbar">
                        {CLASS_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setClassLevel(option);
                              setIsClassDropdownOpen(false);
                            }}
                            className={`block w-full px-4 py-2 text-left text-base font transition hover:bg-gray-100 text-muted ${
                              classLevel === option
                                ? "bg-gray-100 font-bold text-primary"
                                : "text-muted"
                            }`}
                          >
                            Class {option}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={subject}
                      onChange={(event) =>
                        setSubject(event.target.value)
                      }
                      placeholder="Subject"
                      list="subject-options"
                      required
                      className="hide-datalist-indicator h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-base font- placeholder:text-gray-400 focus:outline-none"
                    />
                    <datalist id="subject-options">
                      {SUBJECT_OPTIONS.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </div>

                  <div className="relative">
                    <input
                      id="chapterName"
                      type="text"
                      value={chapterName}
                      onChange={(event) =>
                        setChapterName(event.target.value)
                      }
                      placeholder="Chapter"
                      list="chapter-options"
                      required
                      className="hide-datalist-indicator h-11 w-full rounded-xl border border-gray-200 bg-white pl-4 pr-12 text-base text-primary placeholder:text-gray-400 focus:outline-none"
                    />
                    <datalist id="chapter-options">
                      {chapterSuggestions.map((chapter) => (
                        <option key={chapter} value={chapter} />
                      ))}
                    </datalist>
                  </div>

                  <div className="relative">
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={dueDate}
                      onChange={(event) =>
                        setDueDate(event.target.value)
                      }
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        dateInputRef.current?.showPicker()
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white transition-colors hover:bg-gray-50 active:bg-gray-100"
                      aria-label="date"
                    >
                      <Image
                        src="/icons/Calendar_plus.svg"
                        alt=""
                        aria-hidden="true"
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[16px] font-medium text-primary">
                <div className="mb-2 grid grid-cols-[minmax(0,1.8fr)_max-content_max-content] gap-x-6 px-1 text-[16px] font-bold text-primary">
                  <span>Question Type</span>
                  <span>No. of Questions</span>
                  <span>Marks</span>
                </div>

                <div className="space-y-3">
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[minmax(0,1.8fr)_max-content_max-content] items-center gap-x-6"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <select
                            value={row.type}
                            onChange={(event) => {
                              const parsedType =
                                questionTypeOptionSchema.safeParse(
                                  event.target.value,
                                );

                              if (!parsedType.success) {
                                return;
                              }

                              updateRow(row.id, {
                                type: parsedType.data,
                              });
                            }}
                            className="h-10 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-9 focus:outline-none"
                          >
                            {QUESTION_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <Image
                            src="/icons/Chevron.svg"
                            alt=""
                            aria-hidden="true"
                            width={10}
                            height={6}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full transition"
                          aria-label="Remove question type"
                        >
                          <Image
                            src="/icons/X.svg"
                            alt=""
                            aria-hidden="true"
                            width={8}
                            height={8}
                          />
                        </button>
                      </div>

                      <Stepper
                        value={row.questions}
                        onDecrement={() =>
                          updateRow(row.id, {
                            questions: Math.max(1, row.questions - 1),
                          })
                        }
                        onIncrement={() =>
                          updateRow(row.id, {
                            questions: row.questions + 1,
                          })
                        }
                      />

                      <Stepper
                        value={row.marks}
                        onDecrement={() =>
                          updateRow(row.id, {
                            marks: Math.max(1, row.marks - 1),
                          })
                        }
                        onIncrement={() =>
                          updateRow(row.id, {
                            marks: row.marks + 1,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addQuestionType}
                  className="mt-4 inline-flex items-center font-bold gap-2"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dark">
                    <Image
                      src="/icons/Plus.svg"
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                    />
                  </span>
                  Add Question Type
                </button>

                <div className="mt-3 text-right">
                  <p>Total Questions : {totalQuestions}</p>
                  <p>Total Marks : {totalMarks}</p>
                </div>
              </div>

              <div className="">
                <label
                  htmlFor="additionalInfo"
                  className="mb-2 block text-base font-bold text-primary"
                >
                  Additional Information (For better output)
                </label>
                <div className="relative">
                  <textarea
                    id="additionalInfo"
                    value={additionalInfo}
                    onChange={(event) =>
                      setAdditionalInfo(event.target.value)
                    }
                    rows={4}
                    placeholder="e.g Generate a question paper for 3 hour exam duration..."
                    className="w-full rounded-2xl border-dashed-8 bg-white/25 p-4 pr-10 text-sm text-primary placeholder:text-[#30303099] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full transition ${
                      isListening ? "bg-primary/10" : "bg-transparent"
                    }`}
                    aria-label={
                      isListening
                        ? "Stop voice input for additional information"
                        : "Start voice input for additional information"
                    }
                  >
                    <Image
                      src="/icons/Mic.svg"
                      alt=""
                      aria-hidden="true"
                      width={11}
                      height={14}
                    />
                  </button>
                </div>
              </div>

            </form>
          </div>
          <div className="flex items-center justify-between gap-3">
            {/* Navigate back */}
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="group inline-flex gap-1 h-10 items-center rounded-full bg-white px-6 text-base font-medium text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative h-4 w-4">
                <Image
                  src="/icons/Arrow_Left.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="h-4 w-4 group-hover:hidden"
                />
                <Image
                  src="/icons/Arrow_Left_White.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="hidden h-4 w-4 group-hover:block"
                />
              </span>
              <span>{isSubmitting ? "Please wait..." : "Previous"}</span>
            </button>
            {/* Submit */}
            <button
              form="create-assignment-form"
              type="submit"
              disabled={isSubmitting}
              className="group inline-flex gap-1 h-10 items-center rounded-full bg-primary px-6 text-base font-medium text-white transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{isSubmitting ? "Please wait..." : "Next"}</span>
              <span className="relative h-4 w-4">
                <Image
                  src="/icons/Arrow_Right.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="h-4 w-4 group-hover:hidden"
                />
                <Image
                  src="/icons/Arrow_Right_Primary.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="hidden h-4 w-4 group-hover:block"
                />
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default function CreateAssignment() {
  return <AssignmentDetailsForm />;
}
