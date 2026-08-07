// Copyright (C) 2026 Gregory Dott
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-900 flex flex-col z-50">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 flex-shrink-0"
      >
        <div>
          <h1 class="text-gray-100 font-semibold">Self Audit</h1>
          @if (forced) {
            <p class="text-gray-500 text-xs mt-0.5">Complete your audit to continue</p>
          }
        </div>
        @if (!forced) {
          <button
            (click)="onCancel.emit()"
            class="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors text-sm"
          >
            Cancel
          </button>
        }
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 max-w-2xl w-full mx-auto">
        @if (loading()) {
          <div class="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading audit...
          </div>
        } @else if (submitted()) {
          <div class="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div class="text-4xl">✓</div>
            <h2 class="text-gray-100 text-lg font-semibold">Audit complete</h2>
            <p class="text-gray-400 text-sm max-w-sm">
              Your responses have been saved and your audit context has been updated.
            </p>
            <button
              (click)="onDone.emit()"
              class="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg cursor-pointer transition-colors text-sm"
            >
              Continue
            </button>
          </div>
        } @else {
          <!-- General questions -->
          @if (generalQuestions().length) {
            <div class="mb-8">
              <h2 class="text-gray-300 text-xs uppercase tracking-widest mb-4">General</h2>
              <div class="space-y-5">
                @for (q of generalQuestions(); track q.id) {
                  <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <p class="text-gray-200 text-sm mb-3">{{ q.text }}</p>
                    @if (q.answer_type === 'scale') {
                      <div class="flex gap-2">
                        @for (n of [1, 2, 3, 4, 5]; track n) {
                          <button
                            (click)="setScale(q.id, null, n)"
                            class="w-10 h-10 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
                            [class.bg-violet-600]="getScale(q.id, null) === n"
                            [class.border-violet-500]="getScale(q.id, null) === n"
                            [class.text-white]="getScale(q.id, null) === n"
                            [class.bg-gray-700]="getScale(q.id, null) !== n"
                            [class.border-gray-600]="getScale(q.id, null) !== n"
                            [class.text-gray-400]="getScale(q.id, null) !== n"
                            [class.hover:border-violet-400]="getScale(q.id, null) !== n"
                          >
                            {{ n }}
                          </button>
                        }
                      </div>
                    } @else {
                      <textarea
                        [value]="getText(q.id, null)"
                        (input)="setText(q.id, null, $any($event.target).value)"
                        rows="3"
                        placeholder="Your answer..."
                        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
                      ></textarea>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Per-goal questions -->
          @if (goalQuestions().length && goals().length) {
            <div class="mb-8">
              <h2 class="text-gray-300 text-xs uppercase tracking-widest mb-4">Per Goal</h2>
              <div class="space-y-6">
                @for (goal of goals(); track goal.id) {
                  <div>
                    <p class="text-violet-400 text-sm font-medium mb-3">{{ goal.content }}</p>
                    <div class="space-y-4 pl-3 border-l border-gray-700">
                      @for (q of goalQuestions(); track q.id) {
                        <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
                          <p class="text-gray-200 text-sm mb-3">{{ q.text }}</p>
                          @if (q.answer_type === 'scale') {
                            <div class="flex gap-2">
                              @for (n of [1, 2, 3, 4, 5]; track n) {
                                <button
                                  (click)="setScale(q.id, goal.id, n)"
                                  class="w-10 h-10 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
                                  [class.bg-violet-600]="getScale(q.id, goal.id) === n"
                                  [class.border-violet-500]="getScale(q.id, goal.id) === n"
                                  [class.text-white]="getScale(q.id, goal.id) === n"
                                  [class.bg-gray-700]="getScale(q.id, goal.id) !== n"
                                  [class.border-gray-600]="getScale(q.id, goal.id) !== n"
                                  [class.text-gray-400]="getScale(q.id, goal.id) !== n"
                                  [class.hover:border-violet-400]="getScale(q.id, goal.id) !== n"
                                >
                                  {{ n }}
                                </button>
                              }
                            </div>
                          } @else {
                            <textarea
                              [value]="getText(q.id, goal.id)"
                              (input)="setText(q.id, goal.id, $any($event.target).value)"
                              rows="2"
                              placeholder="Your answer..."
                              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
                            ></textarea>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Submit -->
          <div class="flex justify-end pt-2 pb-8">
            @if (submitError()) {
              <p class="text-red-400 text-xs mr-4 self-center">{{ submitError() }}</p>
            }
            <button
              (click)="submit()"
              [disabled]="submitting()"
              class="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors"
              [class.cursor-pointer]="!submitting()"
              [class.cursor-default]="submitting()"
              [class.opacity-60]="submitting()"
            >
              {{ submitting() ? 'Saving...' : 'Submit audit' }}
            </button>
          </div>
        }
      </div>
    </div>

    @if (submitting()) {
      <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
        <div class="flex flex-col items-center gap-3">
          <svg
            class="animate-spin w-10 h-10 text-violet-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span class="text-gray-300 text-sm">Saving...</span>
        </div>
      </div>
    }
  `,
})
export class AuditComponent implements OnInit {
  private authService = inject(AuthService);

  @Input() forced = false;
  @Input() prefetchedData: any = null;
  @Output() onDone = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  loading = signal(true);
  submitting = signal(false);
  submitted = signal(false);
  submitError = signal('');

  generalQuestions = signal<any[]>([]);
  goalQuestions = signal<any[]>([]);
  goals = signal<any[]>([]);

  private answers = new Map<string, { text?: string; scale?: number }>();

  ngOnInit() {
    if (this.prefetchedData) {
      this.applyData(this.prefetchedData);
      this.loading.set(false);
    } else {
      this.authService.getAuditDue(!this.forced).subscribe({
        next: (data) => {
          if (data.questions) this.applyData(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  private applyData(data: any) {
    const questions: any[] = data.questions || [];
    this.generalQuestions.set(questions.filter((q: any) => q.type === 'general'));
    this.goalQuestions.set(questions.filter((q: any) => q.type === 'goal'));
    this.goals.set(data.goals || []);
  }

  private key(questionId: number, goalId: number | null) {
    return `${questionId}_${goalId ?? ''}`;
  }

  getText(questionId: number, goalId: number | null): string {
    return this.answers.get(this.key(questionId, goalId))?.text ?? '';
  }

  setText(questionId: number, goalId: number | null, value: string) {
    const k = this.key(questionId, goalId);
    this.answers.set(k, { ...this.answers.get(k), text: value });
  }

  getScale(questionId: number, goalId: number | null): number | undefined {
    return this.answers.get(this.key(questionId, goalId))?.scale;
  }

  setScale(questionId: number, goalId: number | null, value: number) {
    const k = this.key(questionId, goalId);
    this.answers.set(k, { ...this.answers.get(k), scale: value });
  }

  submit() {
    this.submitting.set(true);
    this.submitError.set('');

    const answers: any[] = [];
    for (const q of this.generalQuestions()) {
      const a = this.answers.get(this.key(q.id, null));
      answers.push({
        questionId: q.id,
        goalId: null,
        answerText: q.answer_type === 'text' ? (a?.text ?? '') : null,
        answerScale: q.answer_type === 'scale' ? (a?.scale ?? null) : null,
      });
    }
    for (const goal of this.goals()) {
      for (const q of this.goalQuestions()) {
        const a = this.answers.get(this.key(q.id, goal.id));
        answers.push({
          questionId: q.id,
          goalId: goal.id,
          answerText: q.answer_type === 'text' ? (a?.text ?? '') : null,
          answerScale: q.answer_type === 'scale' ? (a?.scale ?? null) : null,
        });
      }
    }

    this.authService.submitAudit(answers).subscribe({
      next: () => {
        this.authService.auditSubmitted$.next();
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set('Failed to save audit. Please try again.');
      },
    });
  }
}
