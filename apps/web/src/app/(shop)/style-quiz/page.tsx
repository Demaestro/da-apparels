"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  id: string;
  question: string;
  multiSelect?: boolean;
  options: { value: string; label: string; description?: string }[];
}

export default function StyleQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const { data: questionsRes, isLoading } = useQuery({
    queryKey: ["quiz-questions"],
    queryFn: () => api.get<QuizQuestion[]>("/style-quiz/questions", { skipAuth: true }),
  });

  const submit = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post("/style-quiz/submit", payload),
    onSuccess: () => router.push("/products?fromQuiz=1"),
  });

  const questions = questionsRes?.data ?? [];
  const current = questions[step];
  const isLast = step === questions.length - 1;

  function selectOption(questionId: string, value: string, multiSelect?: boolean) {
    if (multiSelect) {
      const current = (answers[questionId] as string[] | undefined) ?? [];
      const already = current.includes(value);
      setAnswers((prev) => ({
        ...prev,
        [questionId]: already ? current.filter((v) => v !== value) : [...current, value],
      }));
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
  }

  function next() {
    if (isLast) {
      submit.mutate({
        bodyType: answers["body_type"] as string,
        preferredStyles: (answers["style"] as string[]) ?? [],
        occasions: (answers["occasions"] as string[]) ?? [],
        preferredColors: [],
      });
    } else {
      setStep((s) => s + 1);
    }
  }

  if (isLoading) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 pt-36 pb-24">
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">Style Quiz</p>
      <h1 className="font-display text-4xl text-obsidian mb-2">Discover Your Look</h1>
      <p className="font-sans text-sm text-obsidian-400 mb-12">
        Answer a few questions and we'll match you with pieces made for your body and style.
      </p>

      {/* Progress */}
      <div className="h-px bg-obsidian-100 mb-10 relative">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gold"
          animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <h2 className="font-serif text-2xl text-obsidian">{current.question}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {current.options.map((option) => {
                const selected = current.multiSelect
                  ? ((answers[current.id] as string[]) ?? []).includes(option.value)
                  : answers[current.id] === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => selectOption(current.id, option.value, current.multiSelect)}
                    className={`text-left border p-4 transition-all duration-200 ${
                      selected
                        ? "border-gold bg-gold/5"
                        : "border-obsidian-200 hover:border-obsidian-400"
                    }`}
                  >
                    <p className="font-serif text-sm text-obsidian">{option.label}</p>
                    {option.description && (
                      <p className="font-sans text-xs text-obsidian-400 mt-1 leading-relaxed">
                        {option.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 pt-4">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
              )}
              <Button
                onClick={next}
                loading={submit.isPending}
                disabled={!answers[current.id] || (current.multiSelect && !(answers[current.id] as string[])?.length)}
              >
                {isLast ? "Get My Matches" : "Next"}
              </Button>
              <p className="font-sans text-xs text-obsidian-400">
                {step + 1} / {questions.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
