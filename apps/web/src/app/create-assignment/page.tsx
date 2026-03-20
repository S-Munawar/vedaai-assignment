"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-base";
import {
  assignmentFileMetaSchema,
  assignmentIntakeErrorResponseSchema,
  assignmentIntakeRequestSchema,
  assignmentIntakeSuccessResponseSchema,
  QUESTION_TYPE_OPTIONS,
  questionTypeOptionSchema,
} from "@repo/shared/assignment";
import {
  CloudUploadIcon,
  CalendarIcon,
  MicIcon,
  PlusIcon,
  ChevronDownIcon,
} from "@/components/SVGIcons";
import {
  CLASS_OPTIONS,
  SUBJECT_OPTIONS,
  getChapterSuggestions,
} from "@/constants/assignment-form.constants";
import { useAssignmentStore, type QuestionRow } from "@/store/assignment.store";

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
    <div className="inline-flex h-10 items-center rounded-full border border-gray-200 bg-white px-1 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={onDecrement}
        className="h-7 w-7 rounded-full text-gray-600 transition hover:bg-gray-100"
        aria-label="Decrease value"
      >
        -
      </button>
      <span className="w-7 text-center text-sm font-semibold text-gray-700">{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        className="h-7 w-7 rounded-full text-gray-600 transition hover:bg-gray-100"
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
    submitMessage,
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
    setSubmitMessage,
  } = useAssignmentStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const classDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const chapterSuggestions = useMemo(() => getChapterSuggestions(subject), [subject]);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage("");

    if (!classLevel) {
      setSubmitMessage("❌ Please select class");
      return;
    }

    if (!subject.trim()) {
      setSubmitMessage("❌ Subject is required");
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
      setSubmitMessage(`❌ ${fileMetaParsed.error.issues[0]?.message || "Invalid file"}`);
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

    const payloadParsed = assignmentIntakeRequestSchema.safeParse(payloadCandidate);

    if (!payloadParsed.success) {
      setSubmitMessage(`❌ ${payloadParsed.error.issues[0]?.message || "Invalid assignment details"}`);
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
        const errorPayload = assignmentIntakeErrorResponseSchema.safeParse(rawErrorPayload);

        setSubmitMessage(
          errorPayload.success
            ? `❌ ${errorPayload.data.error}`
            : "❌ Endpoint reached. Backend logic is not implemented yet.",
        );
        return;
      }

      const rawSuccessPayload = await response.json().catch(() => null);
      const successPayload = assignmentIntakeSuccessResponseSchema.safeParse(rawSuccessPayload);

      if (!successPayload.success) {
        setSubmitMessage("❌ Backend returned an unexpected response.");
        return;
      }

      setSubmitMessage("✅ Form inputs sent to backend intake endpoint.");
      router.push(`/assignments/${successPayload.data.assignmentId}`);
    } catch {
      setSubmitMessage("❌ Could not reach backend endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-20 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:px-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" aria-hidden="true" />
          <p className="mt-5 text-base font-semibold text-gray-900">Preparing your assignment...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a few seconds.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8"
      >
        <header className="mb-6">
          <h1 className="text-[18px] font-bold leading-6 text-gray-900">Assignment Details</h1>
          <p className="mt-1 text-xs text-gray-500">Basic information about your assignment</p>
        </header>

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <CloudUploadIcon />
          <p className="mt-3 text-sm font-medium text-gray-700">Choose a file or drag &amp; drop it here</p>
          <p className="mt-1 text-xs text-gray-400">JPEG, PNG, PDF, upto 10MB</p>
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
            className="mt-4 inline-flex h-9 items-center rounded-full border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Browse Files
          </button>
          {selectedFile ? (
            <p className="mt-2 text-xs text-gray-500">Selected: {selectedFile.name}</p>
          ) : null}
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">Upload images or PDF of your preferred document</p>

        <div className="mt-6">
          <div className="grid gap-2 sm:grid-cols-[0.8fr_1fr_1.4fr_auto]">
            <p className="pl-1 text-sm font-semibold text-gray-700">Class</p>
            <p className="pl-1 text-sm font-semibold text-gray-700">Subject</p>
            <label htmlFor="chapterName" className="pl-1 text-sm font-semibold text-gray-700">
              Chapter
            </label>
            <p className="pl-1 text-sm font-semibold text-gray-700">Date</p>

            <div className="relative" ref={classDropdownRef}>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen((value) => !value)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700"
                aria-expanded={isClassDropdownOpen}
                aria-label="Select class"
              >
                <span>{classLevel ? `Class ${classLevel}` : "Class"}</span>
                <ChevronDownIcon />
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
                      className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-gray-100 ${
                        classLevel === option ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-700"
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
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject"
                list="subject-options"
                required
                className="hide-datalist-indicator h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
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
                onChange={(event) => setChapterName(event.target.value)}
                placeholder="Chapter"
                list="chapter-options"
                required
                className="hide-datalist-indicator h-11 w-full rounded-xl border border-gray-200 bg-white pl-4 pr-12 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
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
                onChange={(event) => setDueDate(event.target.value)}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker()}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white transition-colors hover:bg-gray-50 active:bg-gray-100"
                aria-label="date"
              >
                <CalendarIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 grid grid-cols-[1.8fr_0.9fr_0.8fr] gap-3 px-1 text-sm font-semibold text-gray-700">
            <span>Question Type</span>
            <span>No. of Questions</span>
            <span>Marks</span>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1.8fr_0.9fr_0.8fr] items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={row.type}
                      onChange={(event) => {
                        const parsedType = questionTypeOptionSchema.safeParse(event.target.value);

                        if (!parsedType.success) {
                          return;
                        }

                        updateRow(row.id, { type: parsedType.data });
                      }}
                      className="h-10 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-9 text-sm text-gray-700 focus:outline-none"
                    >
                      {QUESTION_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="h-7 w-7 rounded-full text-gray-500 transition hover:bg-gray-100"
                    aria-label="Remove question type"
                  >
                    x
                  </button>
                </div>

                <Stepper
                  value={row.questions}
                  onDecrement={() =>
                    updateRow(row.id, { questions: Math.max(1, row.questions - 1) })
                  }
                  onIncrement={() => updateRow(row.id, { questions: row.questions + 1 })}
                />

                <Stepper
                  value={row.marks}
                  onDecrement={() => updateRow(row.id, { marks: Math.max(1, row.marks - 1) })}
                  onIncrement={() => updateRow(row.id, { marks: row.marks + 1 })}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestionType}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900">
              <PlusIcon />
            </span>
            Add Question Type
          </button>

          <div className="mt-3 text-right text-sm text-gray-700">
            <p>Total Questions : {totalQuestions}</p>
            <p>Total Marks : {totalMarks}</p>
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="additionalInfo"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Additional Information (For better output)
          </label>
          <div className="relative">
            <textarea
              id="additionalInfo"
              value={additionalInfo}
              onChange={(event) => setAdditionalInfo(event.target.value)}
              rows={4}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
              className="w-full rounded-xl border border-gray-200 bg-white p-4 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 bottom-3">
              <MicIcon />
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className={`text-sm ${
            submitMessage.includes("❌") ? "text-red-600" : "text-green-600"
          }`}>
            {submitMessage}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center rounded-full bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            {isSubmitting ? "Please wait..." : "Next"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function CreateAssignment() {
  return <AssignmentDetailsForm />;
}
