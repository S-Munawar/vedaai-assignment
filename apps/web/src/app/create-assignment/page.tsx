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
import { useAssignmentStore, type QuestionRow } from "@/store/assignment.store";
import { PageHeader } from "@/components/PageHeader";

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
      <span className="w-7 text-center text-sm font-semibold text-gray-700">{value}</span>
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
  const realtimeStatus = useRealtimeStatus();

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
      <section className="flex min-h-screen flex-col">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" aria-hidden="true" />
          <p className="text-base font-bold text-primary">Preparing your assignment...</p>
          <p className="text-lg font-normal text-primary">I am using a LOCAL LLM model so, this may take a while to process.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen flex-col gap-3">
      <div className="mx-auto w-full rounded-xl">
        <PageHeader
          title="Create Assignment"
          subtitle="Set up a new assignment for your students."
          showRealtime
          realtimeStatus={realtimeStatus}
          showHeader
        />
      </div>

      <div className="flex flex-col  gap-8 mx-auto w-full max-w-4xl flex-1 ">
        <div className="flex flex-col gap-8 rounded-2xl bg-white/50 shadow-[0px_36px_48px_rgba(0,0,0,0.1)] p-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-primary">Assignment Details</h2>
            <p className="text-xs text-disabled">Basic information about your assignment</p>
          </div>
          <form
            id="create-assignment-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="mx-auto w-full flex flex-col items-center gap-4 rounded-2xl border-dashed-8 bg-white p-6 text-center">
              <Image src="/icons/Upload.svg" alt="" aria-hidden="true" width={40} height={40} />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-primary">Choose a file or drag &amp; drop it here</p>
                <p className="text-xs text-disabled">JPEG, PNG, PDF, upto 10MB</p>
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
                <p className="mt-2 text-xs text-gray-500">Selected: {selectedFile.name}</p>
              ) : null}
            </div>

            <p className="text-center text-xs text-gray-500">Upload images or PDF of your preferred document</p>
          </div>

          <div className="">
            <div className="grid gap-2 sm:grid-cols-[0.8fr_1fr_1.4fr_auto]">
            <p className="pl-1 text-[16px] font-bold text-primary">Class</p>
            <p className="pl-1 text-[16px] font-bold text-primary">Subject</p>
            <label htmlFor="chapterName" className="pl-1 text-[16px] font-bold text-primary">
              Chapter
            </label>
            <p className="pl-1 text-[16px] font-bold text-primary">Date</p>

            <div className="relative" ref={classDropdownRef}>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen((value) => !value)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-base text-primary"
                aria-expanded={isClassDropdownOpen}
                aria-label="Select class"
              >
                <span>{classLevel ? `Class ${classLevel}` : "Class"}</span>
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
                        classLevel === option ? "bg-gray-100 font-bold text-primary" : "text-muted"
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
                onChange={(event) => setChapterName(event.target.value)}
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
                onChange={(event) => setDueDate(event.target.value)}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker()}
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
                <div key={row.id} className="grid grid-cols-[minmax(0,1.8fr)_max-content_max-content] items-center gap-x-6">
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
                      <Image src="/icons/X.svg" alt="" aria-hidden="true" width={8} height={8} />
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
              className="mt-4 inline-flex items-center font-bold gap-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dark">
                <Image src="/icons/Plus.svg" alt="" aria-hidden="true" width={20} height={20} />
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
                onChange={(event) => setAdditionalInfo(event.target.value)}
                rows={4}
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
                className="w-full rounded-2xl border-dashed-8 bg-white/25 p-4 pr-10 text-sm text-primary placeholder:text-[#30303099] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 bottom-3">
                <Image src="/icons/Mic.svg" alt="" aria-hidden="true" width={11} height={14} />
              </span>
            </div>
          </div>
          {/* <div className="flex items-center justify-between">
            <p className={`text-sm ${
              submitMessage.includes("❌") ? "text-red-600" : "text-green-600"
            }`}>
              {submitMessage}
            </p>
            
          </div> */}
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
  );
}

export default function CreateAssignment() {
  return <AssignmentDetailsForm />;
}
