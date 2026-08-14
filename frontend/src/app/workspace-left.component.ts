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

import {
  Component,
  OnInit,
  inject,
  signal,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-workspace-left',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Goals -->
      <div class="flex flex-col flex-1 basis-0 overflow-hidden">
        <div
          class="px-3 py-2 relative flex items-center justify-center gap-1.5 shrink-0 bg-violet-900/25 border-b border-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-violet-400"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
            >Goals</span
          >
          <!-- Edit button -->
          <button
            (click)="openGoalsModal()"
            title="Edit goals"
            class="absolute left-3 text-gray-300 hover:text-violet-400 cursor-pointer transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          @if (conversationOpen) {
            <button
              (click)="showApplyGoalsConfirm.set(true)"
              title="Apply goals to current conversation"
              class="absolute right-3 text-violet-500 hover:text-violet-300 cursor-pointer transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            </button>
          }
        </div>
        <div class="overflow-y-auto px-3 pb-3 pt-2 custom-scrollbar flex-1">
          @if (loadingGoals()) {
            <p class="text-gray-600 text-xs italic">Loading…</p>
          } @else if (goals().length) {
            <ol class="space-y-2">
              @for (goal of goals(); track goal.id; let i = $index) {
                <li class="flex flex-col gap-1">
                  <div class="flex gap-2">
                    <span class="text-gray-600 text-xs shrink-0 pt-0.5">{{ i + 1 }}.</span>
                    <span class="text-gray-300 text-xs leading-relaxed">{{ goal.content }}</span>
                  </div>
                  @if (goal.comments?.length) {
                    <ul class="ml-5 space-y-0.5">
                      @for (comment of goal.comments; track comment.id) {
                        <li class="text-[11px] text-gray-500 leading-relaxed">
                          — {{ comment.content }}
                        </li>
                      }
                    </ul>
                  }
                </li>
              }
            </ol>
          } @else {
            <p class="text-gray-600 text-xs italic">No goals set.</p>
          }
        </div>
      </div>

      <!-- Constraints -->
      <div class="flex flex-col flex-1 basis-0 border-t border-gray-700 overflow-hidden">
        <div
          class="px-3 py-2 relative flex items-center justify-center gap-1.5 shrink-0 bg-amber-900/25 border-b border-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-amber-400"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400"
            >Constraints</span
          >
          <!-- Edit button -->
          <button
            (click)="openConstraintsModal()"
            title="Edit constraints"
            class="absolute left-3 text-gray-300 hover:text-amber-400 cursor-pointer transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          @if (conversationOpen) {
            <button
              (click)="showApplyConstraintsConfirm.set(true)"
              title="Apply constraints to current conversation"
              class="absolute right-3 text-amber-500 hover:text-amber-300 cursor-pointer transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            </button>
          }
        </div>
        <div class="overflow-y-auto px-3 pb-3 pt-2 custom-scrollbar flex-1">
          @if (loadingConstraints()) {
            <p class="text-gray-600 text-xs italic">Loading…</p>
          } @else if (constraints()) {
            <p class="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
              {{ constraints() }}
            </p>
          } @else {
            <p class="text-gray-600 text-xs italic">No constraints set.</p>
          }
        </div>
      </div>
    </div>

    <!-- Goals Modal -->
    @if (showGoalsModal()) {
      <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && closeGoalsModal()"
      >
        <div
          class="bg-gray-800 rounded-lg p-6 max-w-3xl max-h-[85vh] w-full mx-4 flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <div class="flex justify-between items-center mb-4 shrink-0">
            <h3 class="text-lg font-semibold text-gray-100">Goals</h3>
            <button
              (click)="closeGoalsModal()"
              class="text-gray-400 hover:text-gray-200 text-xl cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-2">
            @for (goal of goals(); track goal.id; let i = $index) {
              <div
                draggable="true"
                (dragstart)="onDragStart(i)"
                (dragenter)="onDragEnter($event, i)"
                (dragover)="$event.preventDefault()"
                (dragend)="onDragEnd()"
                (drop)="onDrop($event, i)"
                class="rounded-lg p-3 transition-colors"
                [class.bg-gray-700]="dragOverIndex !== i"
                [class.bg-blue-900/40]="dragOverIndex === i"
                [class.border]="dragOverIndex === i"
                [class.border-blue-600]="dragOverIndex === i"
              >
                <div class="flex items-start gap-2">
                  <span
                    class="text-gray-500 cursor-grab select-none mt-0.5 shrink-0"
                    title="Drag to reorder"
                    >⠿</span
                  >
                  @if (editingGoalId() === goal.id) {
                    <input
                      [(ngModel)]="editingGoalText"
                      (keydown.enter)="saveGoalEdit(goal.id)"
                      (keydown.escape)="cancelGoalEdit()"
                      (blur)="saveGoalEdit(goal.id)"
                      class="flex-1 bg-gray-600 text-gray-100 text-sm px-2 py-0.5 rounded border border-blue-600 focus:outline-none"
                    />
                  } @else {
                    <span
                      class="flex-1 text-gray-100 text-sm cursor-pointer hover:text-white"
                      (click)="startGoalEdit(goal)"
                      title="Click to edit"
                      >{{ goal.content }}</span
                    >
                  }
                  <button
                    (click)="removeGoal(goal.id)"
                    class="text-gray-500 hover:text-red-400 cursor-pointer px-1 text-sm shrink-0"
                    title="Delete goal"
                  >
                    ✕
                  </button>
                </div>

                <button
                  (click)="toggleGoalComments(goal.id)"
                  class="text-xs text-blue-600/70 hover:text-blue-500 cursor-pointer mt-2"
                >
                  {{ expandedGoalId() === goal.id ? '▾ Hide' : '▸ Comments' }} ({{
                    goal.comments.length
                  }})
                </button>

                @if (expandedGoalId() === goal.id) {
                  <div class="mt-2 pl-2 border-l border-gray-600 space-y-1">
                    @for (comment of goal.comments; track comment.id) {
                      <div class="text-xs text-gray-400">{{ comment.content }}</div>
                    }
                    <div class="flex gap-2 mt-2">
                      <input
                        [(ngModel)]="newCommentTexts[goal.id]"
                        placeholder="Add a comment..."
                        class="flex-1 bg-gray-600 text-gray-100 text-xs px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                        (keydown.enter)="addComment(goal.id)"
                      />
                      <button
                        (click)="addComment(goal.id)"
                        class="text-xs bg-blue-800 hover:bg-blue-700 text-white px-2 py-1 rounded cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
            @if (goals().length === 0) {
              <div class="text-gray-500 text-sm text-center py-6">No goals yet.</div>
            }
          </div>

          <div class="shrink-0 border-t border-gray-700 pt-4">
            <textarea
              #newGoalInput
              [(ngModel)]="newGoalText"
              placeholder="New goal..."
              rows="2"
              class="w-full bg-gray-700 text-gray-100 p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 resize-none custom-scrollbar text-sm"
              (keydown.enter)="$event.preventDefault(); addGoal()"
            ></textarea>
            <div class="flex justify-end mt-2">
              <button
                (click)="addGoal()"
                [disabled]="!newGoalText.trim()"
                class="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-default transition-colors cursor-pointer text-sm"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Constraints Modal -->
    @if (showConstraintsModal()) {
      <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && closeConstraintsModal()"
      >
        <div
          class="bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-100">LLM Constraints</h3>
            <button
              (click)="closeConstraintsModal()"
              class="text-gray-400 hover:text-gray-200 text-xl cursor-pointer"
            >
              &times;
            </button>
          </div>
          <div class="mb-4">
            <textarea
              [(ngModel)]="constraintsText"
              placeholder="Enter your global constraints here..."
              class="w-full h-96 bg-gray-700 text-gray-100 p-4 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 resize-none custom-scrollbar"
            ></textarea>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">
              @if (constraintsWordCount() < 10) {
                At least 10 words required.
              }
            </span>
            <div class="flex gap-2">
              <button
                (click)="closeConstraintsModal()"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                (click)="saveConstraints()"
                [disabled]="constraintsWordCount() < 10"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Apply Goals Confirmation -->
    @if (showApplyGoalsConfirm()) {
      <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && showApplyGoalsConfirm.set(false)"
      >
        <div
          class="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
          (click)="$event.stopPropagation()"
        >
          <p class="text-sm text-gray-200 mb-4">
            Are you sure you would like to reapply your goals to the current conversation?
          </p>
          <div class="flex justify-end gap-2">
            <button
              (click)="showApplyGoalsConfirm.set(false)"
              class="px-3 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmApplyGoals()"
              class="px-3 py-1.5 rounded text-xs bg-violet-700 hover:bg-violet-600 text-white cursor-pointer transition-colors"
            >
              Reapply
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Apply Constraints Confirmation -->
    @if (showApplyConstraintsConfirm()) {
      <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && showApplyConstraintsConfirm.set(false)"
      >
        <div
          class="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
          (click)="$event.stopPropagation()"
        >
          <p class="text-sm text-gray-200 mb-4">
            Are you sure you would like to reapply your constraints to the current conversation?
          </p>
          <div class="flex justify-end gap-2">
            <button
              (click)="showApplyConstraintsConfirm.set(false)"
              class="px-3 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmApplyConstraints()"
              class="px-3 py-1.5 rounded text-xs bg-amber-700 hover:bg-amber-600 text-white cursor-pointer transition-colors"
            >
              Reapply
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class WorkspaceLeftComponent implements OnInit {
  private authService = inject(AuthService);

  @ViewChild('newGoalInput') newGoalInput!: ElementRef<HTMLTextAreaElement>;

  @Input() conversationOpen = false;
  @Output() applyConstraints = new EventEmitter<void>();
  @Output() applyGoals = new EventEmitter<void>();
  @Output() dataLoaded = new EventEmitter<void>();
  @Output() goalsChanged = new EventEmitter<void>();

  private initLoadCount = 0;
  backdropMousedownTarget: EventTarget | null = null;

  constraints = signal<string>('');
  goals = signal<any[]>([]);
  loadingConstraints = signal(true);
  loadingGoals = signal(true);

  // Goals modal
  showGoalsModal = signal(false);
  showApplyGoalsConfirm = signal(false);
  showApplyConstraintsConfirm = signal(false);
  newGoalText = '';
  expandedGoalId = signal<number | null>(null);
  newCommentTexts: Record<number, string> = {};
  draggedIndex = -1;
  dragOverIndex = -1;
  editingGoalId = signal<number | null>(null);
  editingGoalText = '';

  // Constraints modal
  showConstraintsModal = signal(false);
  constraintsText = '';
  defaultConstraints = '';

  constraintsWordCount() {
    return this.constraintsText.trim().split(/\s+/).filter(w => w).length;
  }

  ngOnInit() {
    this.loadConstraints();
    this.loadGoals();
  }

  loadConstraints() {
    this.authService.getConstraints().subscribe({
      next: (data: any) => {
        this.constraints.set(data.constraints || '');
        this.loadingConstraints.set(false);
        this.onInitLoadDone();
      },
      error: () => {
        this.loadingConstraints.set(false);
        this.onInitLoadDone();
      },
    });
  }

  loadGoals() {
    this.authService.getGoals().subscribe({
      next: (goals: any[]) => {
        this.goals.set(goals);
        this.loadingGoals.set(false);
        this.onInitLoadDone();
      },
      error: () => {
        this.loadingGoals.set(false);
        this.onInitLoadDone();
      },
    });
  }

  private onInitLoadDone() {
    this.initLoadCount++;
    if (this.initLoadCount >= 2) this.dataLoaded.emit();
  }

  // --- Goals modal ---

  openGoalsModal() {
    this.loadGoals();
    this.newGoalText = '';
    this.expandedGoalId.set(null);
    this.showGoalsModal.set(true);
    setTimeout(() => this.newGoalInput?.nativeElement?.focus());
  }

  confirmApplyGoals() {
    this.showApplyGoalsConfirm.set(false);
    this.applyGoals.emit();
  }

  confirmApplyConstraints() {
    this.showApplyConstraintsConfirm.set(false);
    this.applyConstraints.emit();
  }

  closeGoalsModal() {
    this.showGoalsModal.set(false);
    this.newGoalText = '';
    this.expandedGoalId.set(null);
  }

  addGoal() {
    if (!this.newGoalText.trim()) return;
    this.authService.addGoal(this.newGoalText.trim()).subscribe({
      next: (goal: any) => {
        this.goals.update((gs) => [...gs, goal]);
        this.newGoalText = '';
        this.goalsChanged.emit();
        setTimeout(() => this.newGoalInput?.nativeElement?.focus());
        if (this.authService.userPhase() === 1 && this.goals().length >= 3) {
          this.authService.updatePhase(2).subscribe({
            next: () => this.authService.setPhase(2),
            error: (err: any) => console.error('Failed to advance phase:', err),
          });
        }
      },
      error: (err: any) => console.error('Failed to add goal:', err),
    });
  }

  removeGoal(id: number) {
    this.authService.deleteGoal(id).subscribe({
      next: () => {
        this.goals.update((gs) => gs.filter((g) => g.id !== id));
        this.goalsChanged.emit();
      },
      error: (err: any) => console.error('Failed to delete goal:', err),
    });
  }

  startGoalEdit(goal: any) {
    this.editingGoalId.set(goal.id);
    this.editingGoalText = goal.content;
  }

  cancelGoalEdit() {
    this.editingGoalId.set(null);
    this.editingGoalText = '';
  }

  saveGoalEdit(id: number) {
    if (this.editingGoalId() !== id) return;
    const text = this.editingGoalText.trim();
    if (!text) {
      this.cancelGoalEdit();
      return;
    }
    this.authService.updateGoal(id, text).subscribe({
      next: (updated: any) => {
        this.goals.update((gs) =>
          gs.map((g) => (g.id === id ? { ...g, content: updated.content } : g)),
        );
        this.cancelGoalEdit();
        this.goalsChanged.emit();
      },
      error: (err: any) => console.error('Failed to update goal:', err),
    });
  }

  onDragStart(index: number) {
    this.draggedIndex = index;
  }

  onDragEnter(event: DragEvent, index: number) {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onDragEnd() {
    this.draggedIndex = -1;
    this.dragOverIndex = -1;
  }

  onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    this.dragOverIndex = -1;
    const from = this.draggedIndex;
    this.draggedIndex = -1;
    if (from === dropIndex || from === -1) return;
    const gs = [...this.goals()];
    const [moved] = gs.splice(from, 1);
    gs.splice(dropIndex, 0, moved);
    const reordered = gs.map((g, i) => ({ ...g, ordinal: i }));
    this.goals.set(reordered);
    this.authService
      .reorderGoals(reordered.map((g) => ({ id: g.id, ordinal: g.ordinal })))
      .subscribe({
        next: () => this.goalsChanged.emit(),
        error: (err: any) => console.error('Failed to reorder goals:', err),
      });
  }

  toggleGoalComments(goalId: number) {
    this.expandedGoalId.set(this.expandedGoalId() === goalId ? null : goalId);
  }

  addComment(goalId: number) {
    const text = (this.newCommentTexts[goalId] || '').trim();
    if (!text) return;
    this.authService.addGoalComment(goalId, text).subscribe({
      next: (comment: any) => {
        this.goals.update((gs) =>
          gs.map((g) => (g.id === goalId ? { ...g, comments: [...g.comments, comment] } : g)),
        );
        this.newCommentTexts[goalId] = '';
        this.goalsChanged.emit();
      },
      error: (err: any) => console.error('Failed to add comment:', err),
    });
  }

  // --- Constraints modal ---

  openConstraintsModal() {
    if (!this.constraints().trim()) {
      this.authService.getDefaultConstraints().subscribe({
        next: (res: any) => {
          this.defaultConstraints = res.constraints || '';
          this.constraintsText = this.defaultConstraints;
          this.showConstraintsModal.set(true);
        },
        error: () => {
          this.constraintsText = this.constraints();
          this.showConstraintsModal.set(true);
        },
      });
      return;
    }
    this.constraintsText = this.constraints();
    this.showConstraintsModal.set(true);
  }

  closeConstraintsModal() {
    this.showConstraintsModal.set(false);
    this.constraintsText = '';
  }

  saveConstraints() {
    if (this.constraintsWordCount() < 10) return;
    this.authService.updateConstraints(this.constraintsText).subscribe({
      next: (response: any) => {
        this.constraints.set(response.constraints || '');
        this.closeConstraintsModal();
        if (this.authService.userPhase() === 2) {
          this.authService.updatePhase(3).subscribe({
            next: () => this.authService.setPhase(3),
            error: (err: any) => console.error('Failed to advance phase:', err),
          });
        }
      },
      error: (err: any) => console.error('Failed to save constraints:', err),
    });
  }
}
