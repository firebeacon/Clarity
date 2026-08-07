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
  computed,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlannerService, PlannerTask } from './planner.service';
import { TimeInputComponent } from './time-input.component';

type PlannerView = 'month' | 'week';

interface DragState {
  taskId: number;
  fromDay: string | null;
  fromTimed: boolean;
}

@Component({
  selector: 'app-workspace-planner',
  standalone: true,
  imports: [FormsModule, TimeInputComponent],
  template: `
    <div class="h-full border-l border-gray-700 flex flex-col overflow-hidden">
      <!-- TOP AREA: Unscheduled + Backlog -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Unscheduled tasks -->
        <div
          class="flex-1 flex flex-col bg-gray-800 border-b border-gray-700 overflow-hidden"
          (dragover)="onSidebarDragOver($event)"
          (dragleave)="dragOverUnscheduled.set(false)"
          (drop)="onDropToUnscheduled($event)"
          [class.ring-1]="dragOverUnscheduled()"
          [class.ring-inset]="dragOverUnscheduled()"
          [class.ring-indigo-500]="dragOverUnscheduled()"
        >
          <div
            class="px-3 py-2.5 border-b border-gray-700 shrink-0 bg-indigo-900/30 relative flex items-center justify-center gap-1.5"
          >
            @if (conversationOpen) {
              <button
                (click)="applyWeekPlan.emit()"
                title="Apply week plan to current conversation"
                class="absolute left-3 text-indigo-400 hover:text-indigo-200 cursor-pointer transition-colors"
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
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="11 18 5 12 11 6" />
                </svg>
              </button>
            }
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
              class="text-indigo-400"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span class="text-gray-300 text-xs font-semibold uppercase tracking-wide"
              >Unscheduled</span
            >
            @if (sidebarTasks().length > 0) {
              <span class="absolute right-3 text-[10px] text-indigo-400/70 font-medium">{{
                sidebarTasks().length
              }}</span>
            }
          </div>
          <div class="px-2 py-2 border-b border-gray-700 shrink-0">
            <div class="flex gap-1.5">
              <input
                [(ngModel)]="newSidebarTitle"
                (keydown.enter)="addSidebarTask()"
                placeholder="Add task…"
                class="flex-1 min-w-0 bg-gray-700 text-gray-100 text-xs px-2 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500"
              />
              <button
                (click)="addSidebarTask()"
                [disabled]="!newSidebarTitle.trim()"
                class="px-2 py-1.5 bg-violet-600 text-white text-xs rounded hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors shrink-0"
              >
                +
              </button>
            </div>
          </div>
          <div
            class="flex-1 overflow-y-auto px-2 py-2 space-y-1 select-none"
            style="scrollbar-width: thin; scrollbar-color: #374151 transparent;"
          >
            @for (task of sidebarTasks(); track task.id) {
              <div
                class="group flex flex-col px-2 py-1.5 rounded bg-gray-700/50 hover:bg-gray-700 border border-transparent hover:border-gray-600 cursor-pointer"
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="toggleExpand(task.id)"
              >
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    [checked]="!!task.completed"
                    (change)="toggleComplete(task)"
                    class="shrink-0 accent-violet-500 cursor-pointer"
                    (click)="$event.stopPropagation()"
                  />
                  <span
                    #titleSpan
                    class="flex-1 text-xs text-gray-200 leading-snug"
                    [class.truncate]="expandedTaskId() !== task.id"
                    [class.line-through]="task.completed"
                    [class.text-gray-500]="task.completed"
                    >{{ task.title }}</span
                  >
                  @if (task.comments || titleSpan.scrollWidth > titleSpan.clientWidth) {
                    <span
                      class="shrink-0 text-gray-600 transition-transform duration-150 pointer-events-none"
                      [class.rotate-180]="expandedTaskId() === task.id"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  }
                  <button
                    (click)="openEditModal(task); $event.stopPropagation()"
                    title="Edit"
                    class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 cursor-pointer transition-opacity shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
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
                </div>
                @if (expandedTaskId() === task.id && task.comments) {
                  <p class="mt-1 ml-5 text-[11px] text-gray-500 leading-relaxed">
                    {{ task.comments }}
                  </p>
                }
              </div>
            }
            @if (sidebarTasks().length === 0) {
              <p class="text-gray-600 text-[10px] text-center mt-4">Drag days here to unschedule</p>
            }
          </div>
        </div>

        <!-- Backlog (collapsible) -->
        <div
          class="shrink-0 flex flex-col border-b border-gray-700 overflow-hidden transition-all duration-200"
          [class.flex-1]="!backlogCollapsed()"
          style="background-color: #1a1f2e;"
          (dragover)="onBacklogDragOver($event)"
          (dragleave)="onBacklogDragLeave()"
          (drop)="onDropToBacklog($event)"
          [class.ring-1]="dragOverBacklog()"
          [class.ring-inset]="dragOverBacklog()"
          [class.ring-amber-500]="dragOverBacklog()"
        >
          <!-- Header — always visible, clickable to toggle, droppable when collapsed -->
          <div
            class="px-3 py-2 shrink-0 flex items-center gap-1.5 cursor-pointer select-none"
            style="background-color: rgba(120,80,10,0.18);"
            (click)="backlogCollapsed.set(!backlogCollapsed())"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-amber-500 shrink-0"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span class="flex-1 text-gray-400 text-xs font-semibold uppercase tracking-wide"
              >Backlog</span
            >
            @if (backlogTasks().length > 0) {
              <span class="text-[10px] text-amber-500/70 font-medium">{{
                backlogTasks().length
              }}</span>
            }
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-gray-600 transition-transform duration-200 shrink-0"
              [class.rotate-180]="!backlogCollapsed()"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          @if (!backlogCollapsed()) {
            <div class="px-2 py-2 border-t border-gray-700 shrink-0">
              <div class="flex gap-1.5">
                <input
                  [(ngModel)]="newBacklogTitle"
                  (keydown.enter)="addBacklogTask()"
                  placeholder="Add to backlog…"
                  class="flex-1 min-w-0 bg-gray-700 text-gray-100 text-xs px-2 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-amber-500 placeholder-gray-500"
                />
                <button
                  (click)="addBacklogTask()"
                  [disabled]="!newBacklogTitle.trim()"
                  class="px-2 py-1.5 bg-amber-700 text-white text-xs rounded hover:bg-amber-600 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors shrink-0"
                >
                  +
                </button>
              </div>
            </div>
            <div
              class="flex-1 overflow-y-auto px-2 py-2 space-y-1 select-none"
              style="scrollbar-width: thin; scrollbar-color: #374151 transparent;"
            >
              @for (task of backlogTasks(); track task.id) {
                <div
                  class="group flex flex-col px-2 py-1.5 rounded border border-transparent hover:border-amber-800/50 cursor-pointer"
                  style="background-color: rgba(120,80,10,0.12);"
                  draggable="true"
                  (dragstart)="onDragStart($event, task)"
                  (dragend)="onDragEnd()"
                  (click)="toggleExpand(task.id)"
                >
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      [checked]="!!task.completed"
                      (change)="toggleComplete(task)"
                      class="shrink-0 cursor-pointer"
                      style="accent-color: #d97706;"
                      (click)="$event.stopPropagation()"
                    />
                    <span
                      #backlogTitleSpan
                      class="flex-1 text-xs text-gray-300 leading-snug"
                      [class.truncate]="expandedTaskId() !== task.id"
                      [class.line-through]="task.completed"
                      [class.text-gray-500]="task.completed"
                      >{{ task.title }}</span
                    >
                    @if (
                      task.comments || backlogTitleSpan.scrollWidth > backlogTitleSpan.clientWidth
                    ) {
                      <span
                        class="shrink-0 text-gray-600 transition-transform duration-150 pointer-events-none"
                        [class.rotate-180]="expandedTaskId() === task.id"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    }
                    <button
                      (click)="openEditModal(task); $event.stopPropagation()"
                      title="Edit"
                      class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 cursor-pointer transition-opacity shrink-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="11"
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
                  </div>
                  @if (expandedTaskId() === task.id && task.comments) {
                    <p class="mt-1 ml-5 text-[11px] text-amber-700/70 leading-relaxed">
                      {{ task.comments }}
                    </p>
                  }
                </div>
              }
              @if (backlogTasks().length === 0) {
                <p class="text-gray-600 text-[10px] text-center mt-4">
                  Drag here to add to backlog
                </p>
              }
            </div>
          }
        </div>
      </div>

      <!-- BOTTOM HALF: Next 7 days -->
      <div class="h-1/2 flex flex-col bg-gray-900 overflow-hidden">
        <div
          class="px-3 py-2 border-b border-gray-700 shrink-0 flex items-center gap-1 bg-purple-900/25"
        >
          <button
            (click)="prevPeriod()"
            class="text-gray-400 hover:text-white cursor-pointer transition-colors px-1 text-lg leading-none"
          >
            ‹
          </button>
          <span class="flex-1 text-center text-xs text-gray-300 font-medium">{{
            periodLabel()
          }}</span>
          <button
            (click)="nextPeriod()"
            class="text-gray-400 hover:text-white cursor-pointer transition-colors px-1 text-lg leading-none"
          >
            ›
          </button>
          <button
            (click)="goToday()"
            class="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors ml-1"
          >
            Today
          </button>
        </div>
        <div
          class="flex-1 overflow-y-auto select-none"
          style="scrollbar-width: thin; scrollbar-color: #374151 transparent;"
        >
          @for (dayInfo of weekDays(); track dayInfo.dateStr) {
            <div
              class="border-b border-gray-700/50"
              [class]="dayDragClass(dayInfo.dateStr)"
              (dragover)="onDayDragOver($event, dayInfo.dateStr)"
              (dragleave)="onDayDragLeave(dayInfo.dateStr)"
              (drop)="onDropToDay($event, dayInfo.dateStr)"
            >
              <div
                class="px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-gray-800/40 transition-colors"
                (click)="openDayModal(dayInfo.dateStr)"
              >
                <span
                  class="text-[10px] font-semibold uppercase tracking-wide w-7 shrink-0"
                  [class]="dayInfo.isToday ? 'text-violet-400' : 'text-gray-500'"
                  >{{ dayInfo.weekday }}</span
                >
                <span
                  class="text-sm font-bold"
                  [class]="dayInfo.isToday ? 'text-violet-300' : 'text-gray-400'"
                  >{{ dayInfo.dayNum }}</span
                >
                @if (taskCountForDay(dayInfo.dateStr) > 0) {
                  <span class="ml-auto text-[10px] text-gray-600">{{
                    taskCountForDay(dayInfo.dateStr)
                  }}</span>
                }
              </div>
              <div class="px-2 pb-1.5 space-y-0.5 min-h-[28px]">
                @for (task of timedForDay(dayInfo.dateStr); track task.id) {
                  <div
                    class="group flex flex-col gap-0.5 px-1.5 py-0.5 rounded bg-violet-900/40 hover:bg-violet-900/60 text-[10px] cursor-pointer"
                    draggable="true"
                    (dragstart)="onDragStart($event, task)"
                    (dragend)="onDragEnd()"
                    (click)="toggleExpand(task.id)"
                  >
                    <div class="flex items-center gap-1.5">
                      <span class="text-violet-500 shrink-0">{{ task.start_time }}</span>
                      <span
                        class="truncate flex-1 text-violet-300"
                        [class.line-through]="task.completed"
                        [class.text-violet-500]="task.completed"
                        >{{ task.title }}</span
                      >
                      <button
                        (click)="openEditModal(task); $event.stopPropagation()"
                        title="Edit"
                        class="opacity-0 group-hover:opacity-100 text-violet-500 hover:text-violet-200 cursor-pointer transition-opacity shrink-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
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
                    </div>
                    @if (expandedTaskId() === task.id && task.comments) {
                      <p class="text-[10px] text-violet-400/60 leading-relaxed">
                        {{ task.comments }}
                      </p>
                    }
                  </div>
                }
                @for (task of untimedForDay(dayInfo.dateStr); track task.id) {
                  <div
                    class="group flex flex-col gap-0.5 px-1.5 py-0.5 rounded bg-gray-700/40 hover:bg-gray-700/70 text-[10px] cursor-pointer"
                    draggable="true"
                    (dragstart)="onDragStart($event, task)"
                    (dragend)="onDragEnd()"
                    (click)="toggleExpand(task.id)"
                  >
                    <div class="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        [checked]="!!task.completed"
                        (change)="toggleComplete(task)"
                        class="shrink-0 accent-violet-500 cursor-pointer"
                        (click)="$event.stopPropagation()"
                      />
                      <span
                        class="truncate flex-1 text-gray-300"
                        [class.line-through]="task.completed"
                        [class.text-gray-500]="task.completed"
                        >{{ task.title }}</span
                      >
                      <button
                        (click)="openEditModal(task); $event.stopPropagation()"
                        title="Edit"
                        class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 cursor-pointer transition-opacity shrink-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
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
                    </div>
                    @if (expandedTaskId() === task.id && task.comments) {
                      <p class="text-[10px] text-gray-500 leading-relaxed">{{ task.comments }}</p>
                    }
                  </div>
                }
                @if (tasksForDay(dayInfo.dateStr).length === 0) {
                  <p class="text-[10px] text-gray-700 px-1">—</p>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Day Modal -->
    @if (showDayModal() && selectedDay()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        (click)="closeDayModal()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 w-[400px] max-h-[80vh] flex flex-col shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
            <span class="text-gray-200 text-sm font-semibold">{{ formatSelectedDay() }}</span>
            <button
              (click)="closeDayModal()"
              class="text-gray-500 hover:text-white cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div class="px-3 pt-3 pb-2">
              <span class="text-xs text-gray-500 uppercase tracking-wide font-semibold"
                >Untimed</span
              >
              <div class="mt-2 space-y-0.5 min-h-[32px]">
                @for (task of untimedForDay(selectedDay()!); track task.id) {
                  <div
                    class="group flex flex-col px-2 py-1.5 rounded hover:bg-gray-700/50 border border-transparent hover:border-gray-600 cursor-pointer"
                    draggable="true"
                    (dragstart)="onDragStart($event, task)"
                    (dragend)="onDragEnd()"
                    (click)="toggleExpand(task.id)"
                  >
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        [checked]="!!task.completed"
                        (change)="toggleComplete(task)"
                        class="shrink-0 accent-violet-500 cursor-pointer"
                        (click)="$event.stopPropagation()"
                      />
                      <span
                        class="flex-1 text-sm text-gray-200"
                        [class.truncate]="expandedTaskId() !== task.id"
                        [class.line-through]="task.completed"
                        [class.text-gray-500]="task.completed"
                        >{{ task.title }}</span
                      >
                      <button
                        (click)="openEditModal(task); $event.stopPropagation()"
                        title="Edit"
                        class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 cursor-pointer transition-opacity shrink-0"
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
                    </div>
                    @if (expandedTaskId() === task.id && task.comments) {
                      <p class="mt-1 ml-6 text-xs text-gray-500 leading-relaxed">
                        {{ task.comments }}
                      </p>
                    }
                  </div>
                }
              </div>
              <div class="flex gap-1.5 mt-2">
                <input
                  [(ngModel)]="newDayTitle"
                  (keydown.enter)="addDayTask(false)"
                  placeholder="Add untimed task…"
                  class="flex-1 min-w-0 bg-gray-700 text-gray-100 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500"
                />
                <button
                  (click)="addDayTask(false)"
                  [disabled]="!newDayTitle.trim()"
                  class="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors shrink-0"
                >
                  +
                </button>
              </div>
            </div>
            <div class="border-t border-gray-700 mx-3 my-1"></div>
            <div class="px-3 pb-3">
              <span class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Timed</span>
              <div class="mt-2 space-y-0.5 min-h-[32px]">
                @for (task of timedForDay(selectedDay()!); track task.id) {
                  <div
                    class="group flex flex-col px-2 py-1.5 rounded hover:bg-gray-700/50 border border-transparent hover:border-gray-600 cursor-pointer"
                    draggable="true"
                    (dragstart)="onDragStart($event, task)"
                    (dragend)="onDragEnd()"
                    (click)="toggleExpand(task.id)"
                  >
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        [checked]="!!task.completed"
                        (change)="toggleComplete(task)"
                        class="shrink-0 accent-violet-500 cursor-pointer"
                        (click)="$event.stopPropagation()"
                      />
                      <div class="flex-1 min-w-0">
                        <div
                          class="text-sm text-gray-200 truncate"
                          [class.line-through]="task.completed"
                          [class.text-gray-500]="task.completed"
                        >
                          {{ task.title }}
                        </div>
                        <div class="text-[11px] text-violet-400">
                          {{ task.start_time }} – {{ task.end_time }}
                        </div>
                      </div>
                      <button
                        (click)="openEditModal(task); $event.stopPropagation()"
                        title="Edit"
                        class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 cursor-pointer transition-opacity shrink-0"
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
                    </div>
                    @if (expandedTaskId() === task.id && task.comments) {
                      <p class="mt-1 ml-6 text-xs text-gray-500 leading-relaxed">
                        {{ task.comments }}
                      </p>
                    }
                  </div>
                }
              </div>
              <div class="space-y-1.5 mt-2">
                <input
                  [(ngModel)]="newDayTimedTitle"
                  (keydown.enter)="$event.preventDefault()"
                  placeholder="Add timed task…"
                  class="w-full bg-gray-700 text-gray-100 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500"
                />
                <div class="flex gap-1.5 items-center">
                  <app-time-input
                    [value]="newDayTimedStart"
                    (valueChange)="
                      newDayTimedStart = $event; autoSetEndTime($event, (t) => (newDayTimedEnd = t))
                    "
                    class="flex-1 min-w-0"
                  />
                  <span class="text-gray-500 text-xs">–</span>
                  <app-time-input
                    [value]="newDayTimedEnd"
                    (valueChange)="newDayTimedEnd = $event"
                    class="flex-1 min-w-0"
                  />
                  <button
                    (click)="addDayTask(true)"
                    [disabled]="!newDayTimedTitle.trim() || !newDayTimedStart || !newDayTimedEnd"
                    class="px-2 py-1 bg-violet-600 text-white text-xs rounded hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Time Picker -->
    @if (timePickerOpen()) {
      <div
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
        (click)="cancelTimePicker()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-72 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-gray-200 font-semibold mb-4">Set time</h3>
          <div class="flex items-center gap-3 mb-4">
            <div class="flex-1">
              <label class="text-xs text-gray-500 mb-1 block">Start</label>
              <app-time-input
                [value]="pickerStart"
                (valueChange)="pickerStart = $event; autoSetEndTime($event, (t) => (pickerEnd = t))"
              />
            </div>
            <span class="text-gray-500 mt-4">–</span>
            <div class="flex-1">
              <label class="text-xs text-gray-500 mb-1 block">End</label>
              <app-time-input [value]="pickerEnd" (valueChange)="pickerEnd = $event" />
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button
              (click)="cancelTimePicker()"
              class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmTimePicker()"
              [disabled]="!pickerStart || !pickerEnd"
              class="px-4 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Edit Task -->
    @if (editModalOpen()) {
      <div
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
        (click)="cancelEditModal()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-6 w-[520px] shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-gray-200 font-semibold mb-4">Edit task</h3>
          <input
            [(ngModel)]="editModalTitle"
            (keydown.enter)="confirmEditModal()"
            (keydown.escape)="cancelEditModal()"
            placeholder="Task title…"
            class="w-full bg-gray-700 text-gray-100 text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500 mb-3"
          />
          <textarea
            [(ngModel)]="editModalComments"
            placeholder="Comments (optional)…"
            rows="5"
            class="w-full bg-gray-700 text-gray-100 text-xs px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500 resize-none mb-3 custom-scrollbar"
          ></textarea>
          @if (editModalTimed) {
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1">
                <label class="text-xs text-gray-500 mb-1 block">Start</label>
                <app-time-input
                  [value]="editModalStart"
                  (valueChange)="
                    editModalStart = $event; autoSetEndTime($event, (t) => (editModalEnd = t))
                  "
                />
              </div>
              <span class="text-gray-500 mt-4">–</span>
              <div class="flex-1">
                <label class="text-xs text-gray-500 mb-1 block">End</label>
                <app-time-input [value]="editModalEnd" (valueChange)="editModalEnd = $event" />
              </div>
            </div>
          }
          <div class="flex items-center">
            <button
              (click)="deleteEditModalTask()"
              class="px-4 py-1.5 text-sm text-red-500 hover:text-red-400 cursor-pointer transition-colors"
            >
              Delete
            </button>
            <div class="flex gap-2 ml-auto">
              <button
                (click)="cancelEditModal()"
                class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="confirmEditModal()"
                [disabled]="
                  !editModalTitle.trim() || (editModalTimed && (!editModalStart || !editModalEnd))
                "
                class="px-4 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirm -->
    @if (pendingDeleteTask()) {
      <div
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
        (click)="cancelDelete()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-72 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <p class="text-gray-200 text-sm mb-1">Delete task?</p>
          <p class="text-gray-500 text-xs mb-5 truncate">{{ pendingDeleteTask()!.title }}</p>
          <div class="flex gap-3 justify-end">
            <button
              (click)="cancelDelete()"
              class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmDelete()"
              class="px-4 py-1.5 text-sm bg-red-700 text-white rounded hover:bg-red-600 cursor-pointer transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class WorkspacePlannerComponent implements OnInit {
  private plannerService = inject(PlannerService);

  @Input() conversationOpen = false;
  @Output() applyWeekPlan = new EventEmitter<void>();
  @Output() dataLoaded = new EventEmitter<void>();

  tasks = signal<PlannerTask[]>([]);
  plannerView = signal<PlannerView>('week');
  anchorDate = signal<Date>(new Date());
  selectedDay = signal<string | null>(null);
  showDayModal = signal(false);

  newSidebarTitle = '';
  newBacklogTitle = '';
  newDayTitle = '';
  newDayTimedTitle = '';
  newDayTimedStart = '09:00';
  newDayTimedEnd = '10:00';

  private drag: DragState | null = null;
  private dragOverDay = signal<string | null>(null);
  private dragOverTimed = signal<boolean | null>(null);
  dragOverUnscheduled = signal(false);
  dragOverBacklog = signal(false);
  backlogCollapsed = signal(true);

  timePickerOpen = signal(false);
  pickerStart = '';
  pickerEnd = '';
  private pendingTimedDrop: { day: string; taskId: number } | null = null;

  editModalOpen = signal(false);
  private editModalTask: PlannerTask | null = null;
  editModalTitle = '';
  editModalComments = '';
  editModalStart = '';
  editModalEnd = '';
  editModalTimed = false;

  expandedTaskId = signal<number | null>(null);
  pendingDeleteTask = signal<PlannerTask | null>(null);

  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit() {
    this.reload();
  }

  private initialLoad = true;

  reload() {
    this.plannerService.getTasks().subscribe((tasks) => {
      this.tasks.set(tasks);
      if (this.initialLoad) {
        this.initialLoad = false;
        this.dataLoaded.emit();
      }
    });
  }

  sidebarTasks = computed(() =>
    this.tasks()
      .filter(
        (t) => (t.day === null || t.day === undefined || (t.day as unknown) === '') && !t.backlog,
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  );

  backlogTasks = computed(() =>
    this.tasks()
      .filter((t) => !!t.backlog)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  );

  periodLabel = computed(() => {
    const week = this.weekDays();
    if (!week.length) return '';
    const start = new Date(week[0].dateStr + 'T00:00:00');
    const end = new Date(week[week.length - 1].dateStr + 'T00:00:00');
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  weekDays = computed(() => {
    const anchor = this.anchorDate();
    const today = this.todayStr();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      const ds = this.toDateStr(d);
      return {
        dateStr: ds,
        weekday: this.dayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: ds === today,
      };
    });
  });

  tasksForDay(dateStr: string): PlannerTask[] {
    return this.tasks().filter((t) => t.day === dateStr);
  }

  untimedForDay(dateStr: string): PlannerTask[] {
    return this.tasksForDay(dateStr)
      .filter((t) => !t.is_timed)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  timedForDay(dateStr: string): PlannerTask[] {
    return this.tasksForDay(dateStr)
      .filter((t) => t.is_timed)
      .sort((a, b) => {
        if (!a.start_time || !b.start_time) return 0;
        return a.start_time.localeCompare(b.start_time);
      });
  }

  taskCountForDay(dateStr: string): number {
    return this.tasksForDay(dateStr).length;
  }

  prevPeriod() {
    const d = new Date(this.anchorDate());
    d.setDate(d.getDate() - 7);
    this.anchorDate.set(d);
  }

  nextPeriod() {
    const d = new Date(this.anchorDate());
    d.setDate(d.getDate() + 7);
    this.anchorDate.set(d);
  }

  goToday() {
    this.anchorDate.set(new Date());
  }

  openDayModal(dateStr: string) {
    this.selectedDay.set(dateStr);
    this.newDayTitle = '';
    this.newDayTimedTitle = '';
    this.newDayTimedStart = '09:00';
    this.newDayTimedEnd = '10:00';
    this.showDayModal.set(true);
  }

  closeDayModal() {
    this.showDayModal.set(false);
  }

  formatSelectedDay(): string {
    const d = this.selectedDay();
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  addSidebarTask() {
    const title = this.newSidebarTitle.trim();
    if (!title) return;
    this.plannerService.createTask({ title, day: null }).subscribe((task) => {
      this.tasks.update((ts) => [...ts, task]);
      this.newSidebarTitle = '';
    });
  }

  addBacklogTask() {
    const title = this.newBacklogTitle.trim();
    if (!title) return;
    this.plannerService.createTask({ title, day: null, backlog: true } as any).subscribe((task) => {
      this.tasks.update((ts) => [...ts, task]);
      this.newBacklogTitle = '';
    });
  }

  onDropToUnscheduled(event: DragEvent) {
    event.preventDefault();
    this.dragOverUnscheduled.set(false);
    if (!this.drag) return;
    const task = this.tasks().find((t) => t.id === this.drag!.taskId);
    if (!task) return;
    this.plannerService
      .updateTask(task.id, {
        day: null,
        is_timed: false,
        start_time: null,
        end_time: null,
        backlog: false,
      } as any)
      .subscribe((updated) => {
        this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
      });
    this.drag = null;
  }

  onSidebarDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverUnscheduled.set(true);
  }

  onBacklogDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverBacklog.set(true);
  }

  onBacklogDragLeave() {
    this.dragOverBacklog.set(false);
  }

  onDropToBacklog(event: DragEvent) {
    event.preventDefault();
    this.dragOverBacklog.set(false);
    if (!this.drag) return;
    const task = this.tasks().find((t) => t.id === this.drag!.taskId);
    if (!task) return;
    this.plannerService
      .updateTask(task.id, {
        day: null,
        is_timed: false,
        start_time: null,
        end_time: null,
        backlog: true,
      } as any)
      .subscribe((updated) => {
        this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
      });
    this.drag = null;
  }

  addDayTask(timed: boolean) {
    const day = this.selectedDay();
    if (!day) return;
    if (timed) {
      const title = this.newDayTimedTitle.trim();
      if (!title || !this.newDayTimedStart || !this.newDayTimedEnd) return;
      this.plannerService
        .createTask({
          title,
          day,
          is_timed: true,
          start_time: this.newDayTimedStart,
          end_time: this.newDayTimedEnd,
        })
        .subscribe((task) => {
          this.tasks.update((ts) => [...ts, task]);
          this.newDayTimedTitle = '';
          this.newDayTimedStart = '09:00';
          this.newDayTimedEnd = '10:00';
        });
    } else {
      const title = this.newDayTitle.trim();
      if (!title) return;
      this.plannerService.createTask({ title, day, is_timed: false }).subscribe((task) => {
        this.tasks.update((ts) => [...ts, task]);
        this.newDayTitle = '';
      });
    }
  }

  toggleComplete(task: PlannerTask) {
    this.plannerService.updateTask(task.id, { completed: !task.completed }).subscribe((updated) => {
      this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
    });
  }

  toggleExpand(id: number) {
    this.expandedTaskId.set(this.expandedTaskId() === id ? null : id);
  }

  requestDeleteTask(task: PlannerTask) {
    this.pendingDeleteTask.set(task);
  }

  cancelDelete() {
    this.pendingDeleteTask.set(null);
  }

  confirmDelete() {
    const task = this.pendingDeleteTask();
    if (!task) return;
    this.plannerService.deleteTask(task.id).subscribe(() => {
      this.tasks.update((ts) => ts.filter((t) => t.id !== task.id));
    });
    this.pendingDeleteTask.set(null);
  }

  onDragStart(event: DragEvent, task: PlannerTask) {
    this.drag = { taskId: task.id, fromDay: task.day, fromTimed: !!task.is_timed };
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', String(task.id));
  }

  onDragEnd() {
    this.drag = null;
    this.dragOverDay.set(null);
    this.dragOverTimed.set(null);
    this.dragOverUnscheduled.set(false);
    this.dragOverBacklog.set(false);
  }

  onDayDragOver(event: DragEvent, dateStr: string) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverDay.set(dateStr);
  }

  onDayDragLeave(dateStr: string) {
    if (this.dragOverDay() === dateStr) this.dragOverDay.set(null);
  }

  onDropToDay(event: DragEvent, dateStr: string) {
    event.preventDefault();
    this.dragOverDay.set(null);
    if (!this.drag) return;
    const task = this.tasks().find((t) => t.id === this.drag!.taskId);
    if (!task) return;
    this.plannerService.updateTask(task.id, { day: dateStr }).subscribe((updated) => {
      this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
    });
    this.drag = null;
  }

  confirmTimePicker() {
    if (!this.pendingTimedDrop) return;
    const { taskId, day } = this.pendingTimedDrop;
    this.plannerService
      .updateTask(taskId, {
        day,
        is_timed: true,
        start_time: this.pickerStart,
        end_time: this.pickerEnd,
      })
      .subscribe((updated) => {
        this.tasks.update((ts) => ts.map((t) => (t.id === taskId ? updated : t)));
      });
    this.pendingTimedDrop = null;
    this.timePickerOpen.set(false);
  }

  cancelTimePicker() {
    this.pendingTimedDrop = null;
    this.timePickerOpen.set(false);
  }

  openEditModal(task: PlannerTask) {
    this.editModalTask = task;
    this.editModalTitle = task.title;
    this.editModalComments = task.comments || '';
    this.editModalTimed = !!task.is_timed;
    this.editModalStart = task.start_time || '';
    this.editModalEnd = task.end_time || '';
    this.editModalOpen.set(true);
  }

  confirmEditModal() {
    if (!this.editModalTask || !this.editModalTitle.trim()) return;
    const changes: any = {
      title: this.editModalTitle.trim(),
      comments: this.editModalComments || null,
    };
    if (this.editModalTimed) {
      changes.start_time = this.editModalStart;
      changes.end_time = this.editModalEnd;
    }
    this.plannerService.updateTask(this.editModalTask.id, changes).subscribe((updated) => {
      this.tasks.update((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    });
    this.editModalOpen.set(false);
    this.editModalTask = null;
  }

  cancelEditModal() {
    this.editModalOpen.set(false);
    this.editModalTask = null;
  }

  deleteEditModalTask() {
    const task = this.editModalTask;
    this.editModalOpen.set(false);
    this.editModalTask = null;
    if (task) this.requestDeleteTask(task);
  }

  dayDragClass(dateStr: string): string {
    return this.dragOverDay() === dateStr ? 'bg-violet-900/10' : '';
  }

  autoSetEndTime(start: string, setter: (v: string) => void) {
    if (!start) return;
    const [h, m] = start.split(':').map(Number);
    const end = new Date(2000, 0, 1, h + 1, m);
    setter(
      `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
    );
  }

  private todayStr(): string {
    return this.toDateStr(new Date());
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
