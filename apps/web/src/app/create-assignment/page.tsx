"use client";

import { useMemo, useRef } from "react";
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
    chapterName,
    dueDate,
    selectedFile,
    isSubmitting,
    submitMessage,
    updateRow,
    removeRow,
    addQuestionType,
    setAdditionalInfo,
    setChapterName,
    setDueDate,
    setSelectedFile,
    setIsSubmitting,
    setSubmitMessage,
  } = useAssignmentStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage("");

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
          <label htmlFor="chapterName" className="mb-2 block text-sm font-semibold text-gray-700">
            Chapter Name
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="chapterName"
                type="text"
                value={chapterName}
                onChange={(event) => setChapterName(event.target.value)}
                placeholder="Choose a chapter"
                required
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pr-12 pl-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
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
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                aria-label="Due date"
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
