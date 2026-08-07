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

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavHeaderComponent } from './nav-header.component';
import { PlannerService, PlannerTask } from './planner.service';
import { TimeInputComponent } from './time-input.component';

type ViewMode = 'month' | 'week';

interface DragState {
  taskId: number;
  fromDay: string | null;
  fromTimed: boolean;
}

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [NavHeaderComponent, FormsModule, TimeInputComponent],
  template: `
    <div class="fixed inset-0 bg-gray-900 flex flex-col">
      <app-nav-header [title]="'Planner'" />

      <div class="flex flex-1 overflow-hidden">
        <!-- Left sidebar: general todos -->
        <div
          class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0"
          (dragover)="onSidebarDragOver($event)"
          (drop)="onDropToSidebar($event)"
        >
          <div class="px-4 py-3 border-b border-gray-700">
            <span class="text-gray-300 text-sm font-semibold uppercase tracking-wide"
              >Unscheduled</span
            >
          </div>

          <!-- Add task input -->
          <div class="px-3 py-2 border-b border-gray-700">
            <div class="flex gap-2">
              <input
                [(ngModel)]="newSidebarTitle"
                (keydown.enter)="addSidebarTask()"
                placeholder="Add task..."
                class="flex-1 min-w-0 bg-gray-700 text-gray-100 text-sm px-2 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500"
              />
              <button
                (click)="addSidebarTask()"
                [disabled]="!newSidebarTitle.trim()"
                class="px-2 py-1.5 bg-violet-600 text-white text-sm rounded hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors shrink-0"
              >
                +
              </button>
            </div>
          </div>

          <!-- Sidebar task list -->
          <div class="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            @for (task of sidebarTasks(); track task.id) {
              <div
                class="group flex items-center gap-2 px-2 py-1.5 rounded bg-gray-700/50 hover:bg-gray-700 border border-transparent hover:border-gray-600 cursor-grab active:cursor-grabbing"
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
              >
                <input
                  type="checkbox"
                  [checked]="!!task.completed"
                  (change)="toggleComplete(task)"
                  class="shrink-0 accent-violet-500 cursor-pointer"
                  (click)="$event.stopPropagation()"
                />
                <span
                  class="flex-1 text-sm text-gray-200 truncate cursor-text"
                  [class.line-through]="task.completed"
                  [class.text-gray-500]="task.completed"
                  (click)="openEditModal(task); $event.stopPropagation()"
                  >{{ task.title }}</span
                >
                <button
                  (click)="deleteTask(task)"
                  class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs cursor-pointer transition-opacity"
                >
                  ✕
                </button>
              </div>
            }
            @if (sidebarTasks().length === 0) {
              <p class="text-gray-600 text-xs text-center mt-4">Drag days here to unschedule</p>
            }
          </div>
        </div>

        <!-- Main calendar area -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Toolbar -->
          <div
            class="flex items-center gap-4 px-4 py-2 border-b border-gray-700 bg-gray-800/50 shrink-0"
          >
            <button
              (click)="prevPeriod()"
              class="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg leading-none px-1"
            >
              ‹
            </button>
            <span class="text-gray-200 font-medium min-w-[140px] text-center">{{
              periodLabel()
            }}</span>
            <button
              (click)="nextPeriod()"
              class="text-gray-400 hover:text-white cursor-pointer transition-colors text-lg leading-none px-1"
            >
              ›
            </button>
            <button
              (click)="goToday()"
              class="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors ml-1"
            >
              Today
            </button>

            <div class="ml-auto flex rounded overflow-hidden border border-gray-600">
              <button
                (click)="view.set('month')"
                [class]="
                  view() === 'month'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                "
                class="px-3 py-1 text-xs cursor-pointer transition-colors"
              >
                Month
              </button>
              <button
                (click)="view.set('week')"
                [class]="
                  view() === 'week'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                "
                class="px-3 py-1 text-xs cursor-pointer transition-colors"
              >
                Week
              </button>
            </div>
          </div>

          <!-- Month view -->
          @if (view() === 'month') {
            <div class="flex flex-1 overflow-hidden">
              <!-- Calendar grid -->
              <div class="flex-1 overflow-y-auto p-3" [class.pr-0]="selectedDay()">
                <!-- Day-of-week header -->
                <div class="grid grid-cols-7 gap-1 mb-1">
                  @for (d of dayNames; track d) {
                    <div class="text-center text-xs text-gray-500 py-1 font-medium">{{ d }}</div>
                  }
                </div>
                <!-- Weeks -->
                <div class="grid grid-cols-7 gap-1">
                  @for (cell of monthCells(); track cell.key) {
                    <div
                      class="min-h-[80px] rounded p-1.5 border transition-colors cursor-pointer relative"
                      [class]="monthCellClass(cell)"
                      (click)="selectDay(cell.dateStr)"
                      (dragover)="onDayDragOver($event, cell.dateStr)"
                      (dragleave)="onDayDragLeave(cell.dateStr)"
                      (drop)="onDropToDay($event, cell.dateStr)"
                    >
                      <span class="text-xs" [class]="dayCellNumClass(cell)">{{ cell.day }}</span>
                      @if (taskCountForDay(cell.dateStr) > 0) {
                        <div class="mt-1 space-y-0.5">
                          @for (t of firstTasksForDay(cell.dateStr); track t.id) {
                            <div
                              class="text-[10px] truncate rounded px-1 py-0.5"
                              [class]="
                                t.is_timed
                                  ? 'bg-violet-900/60 text-violet-300'
                                  : 'bg-gray-700 text-gray-300'
                              "
                            >
                              {{ t.title }}
                            </div>
                          }
                          @if (taskCountForDay(cell.dateStr) > 2) {
                            <div class="text-[10px] text-gray-500">
                              +{{ taskCountForDay(cell.dateStr) - 2 }} more
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Day detail panel -->
              @if (selectedDay()) {
                <div
                  class="w-72 border-l border-gray-700 bg-gray-800 flex flex-col shrink-0 overflow-hidden"
                >
                  <div
                    class="flex items-center justify-between px-4 py-2.5 border-b border-gray-700"
                  >
                    <span class="text-gray-200 text-sm font-semibold">{{
                      formatSelectedDay()
                    }}</span>
                    <button
                      (click)="selectedDay.set(null)"
                      class="text-gray-500 hover:text-white cursor-pointer text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <!-- Untimed section -->
                  <div class="flex-1 overflow-y-auto">
                    <div class="px-3 pt-3 pb-1">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-gray-500 uppercase tracking-wide font-semibold"
                          >Untimed</span
                        >
                      </div>
                      <div
                        class="min-h-[40px] rounded border border-dashed transition-colors"
                        [class]="dayDropZoneClass(selectedDay()!, false)"
                        (dragover)="onTimedDragOver($event, selectedDay()!, false)"
                        (dragleave)="clearTimedDrop()"
                        (drop)="onDropToSection($event, selectedDay()!, false)"
                      >
                        @for (task of untimedForDay(selectedDay()!); track task.id) {
                          <div
                            class="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700/50 border border-transparent hover:border-gray-600 cursor-grab active:cursor-grabbing mx-1 my-0.5"
                            draggable="true"
                            (dragstart)="onDragStart($event, task)"
                            (dragend)="onDragEnd()"
                          >
                            <input
                              type="checkbox"
                              [checked]="!!task.completed"
                              (change)="toggleComplete(task)"
                              class="shrink-0 accent-violet-500 cursor-pointer"
                              (click)="$event.stopPropagation()"
                            />
                            <span
                              class="flex-1 text-sm text-gray-200 truncate cursor-text"
                              [class.line-through]="task.completed"
                              [class.text-gray-500]="task.completed"
                              (click)="openEditModal(task); $event.stopPropagation()"
                              >{{ task.title }}</span
                            >
                            <button
                              (click)="deleteTask(task)"
                              class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs cursor-pointer transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        }
                        @if (untimedForDay(selectedDay()!).length === 0) {
                          <p class="text-[11px] text-gray-600 text-center py-3">Drop tasks here</p>
                        }
                      </div>
                      <!-- Add untimed task -->
                      <div class="flex gap-1.5 mt-2">
                        <input
                          [(ngModel)]="newDayTitle"
                          (keydown.enter)="addDayTask(false)"
                          placeholder="Add untimed task..."
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

                    <div class="border-t border-gray-700 mx-3 my-2"></div>

                    <!-- Timed section -->
                    <div class="px-3 pb-3">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-gray-500 uppercase tracking-wide font-semibold"
                          >Timed</span
                        >
                      </div>
                      <div
                        class="min-h-[40px] rounded border border-dashed transition-colors"
                        [class]="dayDropZoneClass(selectedDay()!, true)"
                        (dragover)="onTimedDragOver($event, selectedDay()!, true)"
                        (dragleave)="clearTimedDrop()"
                        (drop)="onDropToSection($event, selectedDay()!, true)"
                      >
                        @for (task of timedForDay(selectedDay()!); track task.id) {
                          <div
                            class="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700/50 border border-transparent hover:border-gray-600 cursor-grab active:cursor-grabbing mx-1 my-0.5"
                            draggable="true"
                            (dragstart)="onDragStart($event, task)"
                            (dragend)="onDragEnd()"
                          >
                            <input
                              type="checkbox"
                              [checked]="!!task.completed"
                              (change)="toggleComplete(task)"
                              class="shrink-0 accent-violet-500 cursor-pointer"
                              (click)="$event.stopPropagation()"
                            />
                            <div
                              class="flex-1 min-w-0 cursor-text"
                              (click)="openEditModal(task); $event.stopPropagation()"
                            >
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
                              (click)="deleteTask(task)"
                              class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs cursor-pointer transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        }
                        @if (timedForDay(selectedDay()!).length === 0) {
                          <p class="text-[11px] text-gray-600 text-center py-3">Drop tasks here</p>
                        }
                      </div>
                      <!-- Add timed task -->
                      <div class="space-y-1.5 mt-2">
                        <input
                          [(ngModel)]="newDayTimedTitle"
                          (keydown.enter)="focusTimedStart()"
                          placeholder="Add timed task..."
                          class="w-full bg-gray-700 text-gray-100 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500"
                        />
                        <div class="flex gap-1.5 items-center">
                          <app-time-input
                            [value]="newDayTimedStart"
                            (valueChange)="
                              newDayTimedStart = $event;
                              autoSetEndTime($event, (t) => (newDayTimedEnd = t))
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
                            [disabled]="
                              !newDayTimedTitle.trim() || !newDayTimedStart || !newDayTimedEnd
                            "
                            class="px-2 py-1 bg-violet-600 text-white text-xs rounded hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Week view -->
          @if (view() === 'week') {
            <div class="flex-1 overflow-auto">
              <div class="flex min-w-0 h-full">
                <!-- Time gutter -->
                <div class="w-14 shrink-0 border-r border-gray-700 pt-[52px]">
                  @for (hour of hours; track hour) {
                    <div
                      class="h-14 flex items-start justify-end pr-2 pt-0.5 border-t border-gray-700/50"
                    >
                      <span class="text-[10px] text-gray-600">{{ formatHour(hour) }}</span>
                    </div>
                  }
                </div>

                <!-- Day columns -->
                @for (dayInfo of weekDays(); track dayInfo.dateStr) {
                  <div
                    class="flex-1 min-w-0 border-r border-gray-700 last:border-r-0 flex flex-col"
                  >
                    <!-- Day header -->
                    <div
                      class="px-2 py-2 border-b border-gray-700 bg-gray-800/50 shrink-0 text-center"
                    >
                      <div class="text-xs text-gray-500">{{ dayInfo.weekday }}</div>
                      <div
                        class="text-sm font-semibold mt-0.5"
                        [class]="dayInfo.isToday ? 'text-violet-400' : 'text-gray-300'"
                      >
                        {{ dayInfo.dayNum }}
                      </div>
                    </div>

                    <!-- Untimed section -->
                    <div
                      class="px-1 py-1 border-b border-gray-700 shrink-0 min-h-[32px]"
                      [class]="weekDropZoneClass(dayInfo.dateStr, false)"
                      (dragover)="onTimedDragOver($event, dayInfo.dateStr, false)"
                      (dragleave)="clearTimedDrop()"
                      (drop)="onDropToSection($event, dayInfo.dateStr, false)"
                    >
                      @for (task of untimedForDay(dayInfo.dateStr); track task.id) {
                        <div
                          class="group flex items-center gap-1 px-1.5 py-1 rounded mb-0.5 bg-gray-700/50 hover:bg-gray-700 text-xs cursor-grab active:cursor-grabbing"
                          draggable="true"
                          (dragstart)="onDragStart($event, task)"
                          (dragend)="onDragEnd()"
                        >
                          <input
                            type="checkbox"
                            [checked]="!!task.completed"
                            (change)="toggleComplete(task)"
                            class="shrink-0 accent-violet-500 cursor-pointer"
                            (click)="$event.stopPropagation()"
                          />
                          <span
                            class="flex-1 truncate text-gray-200 cursor-text"
                            [class.line-through]="task.completed"
                            [class.text-gray-500]="task.completed"
                            (click)="openEditModal(task); $event.stopPropagation()"
                            >{{ task.title }}</span
                          >
                          <button
                            (click)="deleteTask(task)"
                            class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 cursor-pointer transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      }
                      <!-- Quick add -->
                      <button
                        (click)="startWeekAdd(dayInfo.dateStr, false)"
                        class="w-full text-left text-[10px] text-gray-600 hover:text-gray-400 px-1 cursor-pointer transition-colors"
                      >
                        + task
                      </button>
                    </div>

                    <!-- Timed grid -->
                    <div
                      class="relative flex-1"
                      [class]="weekDropZoneClass(dayInfo.dateStr, true)"
                      (dragover)="onTimedDragOver($event, dayInfo.dateStr, true)"
                      (dragleave)="clearTimedDrop()"
                      (drop)="onDropToSection($event, dayInfo.dateStr, true)"
                    >
                      @for (hour of hours; track hour) {
                        <div class="h-14 border-t border-gray-700/50"></div>
                      }
                      <!-- Timed task blocks -->
                      @for (task of timedForDay(dayInfo.dateStr); track task.id) {
                        <div
                          [style]="timedTaskStyle(task)"
                          class="absolute left-0.5 right-0.5 rounded px-1 overflow-hidden bg-violet-800/70 border border-violet-600/50 cursor-grab active:cursor-grabbing group"
                          draggable="true"
                          (dragstart)="onDragStart($event, task)"
                          (dragend)="onDragEnd()"
                        >
                          <div
                            class="cursor-text"
                            (click)="openEditModal(task); $event.stopPropagation()"
                          >
                            <div
                              class="text-[10px] text-violet-200 font-medium truncate leading-tight mt-0.5"
                            >
                              {{ task.title }}
                            </div>
                            <div class="text-[9px] text-violet-400">
                              {{ task.start_time }}–{{ task.end_time }}
                            </div>
                          </div>
                          <button
                            (click)="deleteTask(task)"
                            class="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-violet-400 hover:text-red-400 text-[10px] cursor-pointer transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Time picker modal (when dropping onto timed section) -->
    @if (timePickerOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
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

    <!-- Inline add modal for week view -->
    @if (weekAddOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        (click)="cancelWeekAdd()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-72 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-gray-200 font-semibold mb-4">
            {{ weekAddTimed ? 'Add timed task' : 'Add task' }} — {{ formatDateStr(weekAddDay) }}
          </h3>
          <input
            [(ngModel)]="weekAddTitle"
            (keydown.enter)="weekAddTimed ? null : confirmWeekAdd()"
            placeholder="Task title..."
            class="w-full bg-gray-700 text-gray-100 text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500 mb-3"
          />
          @if (weekAddTimed) {
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1">
                <label class="text-xs text-gray-500 mb-1 block">Start</label>
                <app-time-input
                  [value]="weekAddStart"
                  (valueChange)="
                    weekAddStart = $event; autoSetEndTime($event, (t) => (weekAddEnd = t))
                  "
                />
              </div>
              <span class="text-gray-500 mt-4">–</span>
              <div class="flex-1">
                <label class="text-xs text-gray-500 mb-1 block">End</label>
                <app-time-input [value]="weekAddEnd" (valueChange)="weekAddEnd = $event" />
              </div>
            </div>
          }
          <div class="flex items-center justify-between">
            <button
              (click)="weekAddTimed = !weekAddTimed"
              class="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
            >
              {{ weekAddTimed ? 'Make untimed' : 'Make timed' }}
            </button>
            <div class="flex gap-2">
              <button
                (click)="cancelWeekAdd()"
                class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="confirmWeekAdd()"
                [disabled]="
                  !weekAddTitle.trim() || (weekAddTimed && (!weekAddStart || !weekAddEnd))
                "
                class="px-4 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    }
    <!-- Edit task modal -->
    @if (editModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        (click)="cancelEditModal()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-80 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-gray-200 font-semibold mb-4">Edit task</h3>
          <input
            [(ngModel)]="editModalTitle"
            (keydown.enter)="confirmEditModal()"
            (keydown.escape)="cancelEditModal()"
            placeholder="Task title..."
            class="w-full bg-gray-700 text-gray-100 text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500 mb-3"
          />
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
          <div class="flex gap-2 justify-end">
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
    }
  `,
})
export class PlannerComponent implements OnInit {
  private svc = inject(PlannerService);

  view = signal<ViewMode>('month');
  tasks = signal<PlannerTask[]>([]);
  selectedDay = signal<string | null>(null);

  // Current period anchor date
  anchorDate = signal<Date>(new Date());

  // Drag state
  private drag: DragState | null = null;
  private dragOverDay = signal<string | null>(null);
  private dragOverTimed = signal<boolean | null>(null);

  // New task inputs
  newSidebarTitle = '';
  newDayTitle = '';
  newDayTimedTitle = '';
  newDayTimedStart = '09:00';
  newDayTimedEnd = '10:00';

  // Time picker modal (for dropping onto timed section)
  timePickerOpen = signal(false);
  pickerStart = '';
  pickerEnd = '';
  private pendingTimedDrop: { day: string; taskId: number } | null = null;

  // Edit modal
  editModalOpen = signal(false);
  private editModalTask: PlannerTask | null = null;
  editModalTitle = '';
  editModalStart = '';
  editModalEnd = '';
  editModalTimed = false;

  // Week view add modal
  weekAddOpen = signal(false);
  weekAddDay = '';
  weekAddTimed = false;
  weekAddTitle = '';
  weekAddStart = '';
  weekAddEnd = '';

  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6am–10pm

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.svc.getTasks().subscribe((tasks) => this.tasks.set(tasks));
  }

  // ─── Computed views ───────────────────────────────────────────────

  sidebarTasks = computed(() =>
    this.tasks().filter((t) => t.day === null || t.day === undefined || (t.day as unknown) === ''),
  );

  periodLabel = computed(() => {
    const d = this.anchorDate();
    if (this.view() === 'month') {
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const week = this.weekDays();
    if (!week.length) return '';
    const first = week[0];
    const last = week[week.length - 1];
    const start = new Date(first.dateStr + 'T00:00:00');
    const end = new Date(last.dateStr + 'T00:00:00');
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  monthCells = computed(() => {
    const d = this.anchorDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells: {
      dateStr: string;
      day: number;
      inMonth: boolean;
      isToday: boolean;
      key: string;
    }[] = [];
    const today = this.todayStr();

    // Leading days from previous month
    for (let i = firstDay.getDay(); i > 0; i--) {
      const dt = new Date(year, month, 1 - i);
      const ds = this.toDateStr(dt);
      cells.push({
        dateStr: ds,
        day: dt.getDate(),
        inMonth: false,
        isToday: ds === today,
        key: ds,
      });
    }
    // Days in month
    for (let d2 = 1; d2 <= lastDay.getDate(); d2++) {
      const dt = new Date(year, month, d2);
      const ds = this.toDateStr(dt);
      cells.push({ dateStr: ds, day: d2, inMonth: true, isToday: ds === today, key: ds });
    }
    // Trailing days
    const rem = 7 - (cells.length % 7);
    if (rem < 7) {
      for (let i = 1; i <= rem; i++) {
        const dt = new Date(year, month + 1, i);
        const ds = this.toDateStr(dt);
        cells.push({
          dateStr: ds,
          day: dt.getDate(),
          inMonth: false,
          isToday: ds === today,
          key: ds,
        });
      }
    }
    return cells;
  });

  weekDays = computed(() => {
    const anchor = this.anchorDate();
    const dow = anchor.getDay();
    const sunday = new Date(anchor);
    sunday.setDate(anchor.getDate() - dow);
    const today = this.todayStr();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const ds = this.toDateStr(d);
      return {
        dateStr: ds,
        weekday: this.dayNames[i],
        dayNum: d.getDate(),
        isToday: ds === today,
      };
    });
  });

  // ─── Task helpers ─────────────────────────────────────────────────

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

  firstTasksForDay(dateStr: string): PlannerTask[] {
    return this.tasksForDay(dateStr).slice(0, 2);
  }

  // ─── Navigation ───────────────────────────────────────────────────

  prevPeriod() {
    const d = new Date(this.anchorDate());
    if (this.view() === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    this.anchorDate.set(d);
  }

  nextPeriod() {
    const d = new Date(this.anchorDate());
    if (this.view() === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    this.anchorDate.set(d);
  }

  goToday() {
    this.anchorDate.set(new Date());
  }

  selectDay(dateStr: string) {
    this.selectedDay.set(this.selectedDay() === dateStr ? null : dateStr);
    this.newDayTitle = '';
    this.newDayTimedTitle = '';
    this.newDayTimedStart = '09:00';
    this.newDayTimedEnd = '10:00';
  }

  formatSelectedDay(): string {
    const d = this.selectedDay();
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateStr(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  // ─── Add tasks ────────────────────────────────────────────────────

  addSidebarTask() {
    const title = this.newSidebarTitle.trim();
    if (!title) return;
    this.svc.createTask({ title, day: null }).subscribe((task) => {
      this.tasks.update((ts) => [...ts, task]);
      this.newSidebarTitle = '';
    });
  }

  addDayTask(timed: boolean) {
    const day = this.selectedDay();
    if (!day) return;
    if (timed) {
      const title = this.newDayTimedTitle.trim();
      if (!title || !this.newDayTimedStart || !this.newDayTimedEnd) return;
      this.svc
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
      this.svc.createTask({ title, day, is_timed: false }).subscribe((task) => {
        this.tasks.update((ts) => [...ts, task]);
        this.newDayTitle = '';
      });
    }
  }

  focusTimedStart() {
    // Just moves focus; real submit is the button
  }

  // ─── Week view add ────────────────────────────────────────────────

  startWeekAdd(dateStr: string, timed: boolean) {
    this.weekAddDay = dateStr;
    this.weekAddTimed = timed;
    this.weekAddTitle = '';
    this.weekAddStart = '';
    this.weekAddEnd = '';
    this.weekAddOpen.set(true);
  }

  confirmWeekAdd() {
    const title = this.weekAddTitle.trim();
    if (!title) return;
    this.svc
      .createTask({
        title,
        day: this.weekAddDay,
        is_timed: this.weekAddTimed,
        start_time: this.weekAddTimed ? this.weekAddStart : null,
        end_time: this.weekAddTimed ? this.weekAddEnd : null,
      })
      .subscribe((task) => {
        this.tasks.update((ts) => [...ts, task]);
        this.weekAddOpen.set(false);
      });
  }

  cancelWeekAdd() {
    this.weekAddOpen.set(false);
  }

  // ─── Task actions ─────────────────────────────────────────────────

  toggleComplete(task: PlannerTask) {
    const completed = !task.completed;
    this.svc.updateTask(task.id, { completed }).subscribe((updated) => {
      this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
    });
  }

  deleteTask(task: PlannerTask) {
    this.svc.deleteTask(task.id).subscribe(() => {
      this.tasks.update((ts) => ts.filter((t) => t.id !== task.id));
    });
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────

  onDragStart(event: DragEvent, task: PlannerTask) {
    this.drag = {
      taskId: task.id,
      fromDay: task.day,
      fromTimed: !!task.is_timed,
    };
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', String(task.id));
  }

  onDragEnd() {
    this.drag = null;
    this.dragOverDay.set(null);
    this.dragOverTimed.set(null);
  }

  // Month view: drop onto a day cell
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
    // Move to this day, preserve timed status
    this.svc.updateTask(task.id, { day: dateStr }).subscribe((updated) => {
      this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
    });
    this.drag = null;
  }

  // Section drop zones (untimed/timed within a day panel or week column)
  onTimedDragOver(event: DragEvent, dateStr: string, timed: boolean) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverDay.set(dateStr);
    this.dragOverTimed.set(timed);
  }

  clearTimedDrop() {
    this.dragOverDay.set(null);
    this.dragOverTimed.set(null);
  }

  onDropToSection(event: DragEvent, dateStr: string, timed: boolean) {
    event.preventDefault();
    this.clearTimedDrop();
    if (!this.drag) return;
    const task = this.tasks().find((t) => t.id === this.drag!.taskId);
    if (!task) return;

    if (timed) {
      // Need time info — open picker. Store taskId now; dragend fires after drop and nulls this.drag.
      this.pendingTimedDrop = { day: dateStr, taskId: task.id };
      this.pickerStart = task.start_time || '09:00';
      this.pickerEnd = task.end_time || '10:00';
      this.timePickerOpen.set(true);
    } else {
      // Move to untimed
      this.svc
        .updateTask(task.id, { day: dateStr, is_timed: false, start_time: null, end_time: null })
        .subscribe((updated) => {
          this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
        });
      this.drag = null;
    }
  }

  confirmTimePicker() {
    if (!this.pendingTimedDrop) return;
    const taskId = this.pendingTimedDrop.taskId;
    const day = this.pendingTimedDrop.day;
    this.svc
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

  onSidebarDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDropToSidebar(event: DragEvent) {
    event.preventDefault();
    if (!this.drag) return;
    const task = this.tasks().find((t) => t.id === this.drag!.taskId);
    if (!task) return;
    this.svc
      .updateTask(task.id, { day: null, is_timed: false, start_time: null, end_time: null })
      .subscribe((updated) => {
        this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
      });
    this.drag = null;
  }

  // ─── CSS helpers ──────────────────────────────────────────────────

  monthCellClass(cell: { dateStr: string; inMonth: boolean; isToday: boolean }): string {
    const selected = cell.dateStr === this.selectedDay();
    const dragTarget = cell.dateStr === this.dragOverDay();
    if (dragTarget) return 'border-violet-500 bg-violet-900/20';
    if (selected) return 'border-violet-600 bg-violet-900/30';
    if (cell.isToday) return 'border-violet-700/50 bg-gray-800/80';
    if (!cell.inMonth) return 'border-gray-700/30 bg-gray-900/30';
    return 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/60';
  }

  dayCellNumClass(cell: { isToday: boolean; inMonth: boolean }): string {
    if (cell.isToday) return 'font-bold text-violet-400';
    if (!cell.inMonth) return 'text-gray-600';
    return 'text-gray-400';
  }

  dayDropZoneClass(dateStr: string, timed: boolean): string {
    if (this.dragOverDay() === dateStr && this.dragOverTimed() === timed) {
      return 'border-violet-500 bg-violet-900/20';
    }
    return timed ? 'border-violet-800/30' : 'border-gray-600/40';
  }

  weekDropZoneClass(dateStr: string, timed: boolean): string {
    if (this.dragOverDay() === dateStr && this.dragOverTimed() === timed) {
      return timed ? 'bg-violet-900/20' : 'bg-violet-900/10';
    }
    return '';
  }

  // ─── Week view time block positioning ─────────────────────────────

  timedTaskStyle(task: PlannerTask): string {
    if (!task.start_time || !task.end_time) return 'display:none';
    const [sh, sm] = task.start_time.split(':').map(Number);
    const [eh, em] = task.end_time.split(':').map(Number);
    const startMin = (sh - 6) * 60 + sm;
    const endMin = (eh - 6) * 60 + em;
    const totalMin = 17 * 60;
    const top = (startMin / totalMin) * 100;
    const height = Math.max(((endMin - startMin) / totalMin) * 100, 3);
    return `top:${top}%;height:${height}%;min-height:20px`;
  }

  openEditModal(task: PlannerTask) {
    this.editModalTask = task;
    this.editModalTitle = task.title;
    this.editModalTimed = !!task.is_timed;
    this.editModalStart = task.start_time || '';
    this.editModalEnd = task.end_time || '';
    this.editModalOpen.set(true);
  }

  confirmEditModal() {
    const task = this.editModalTask;
    if (!task) return;
    const title = this.editModalTitle.trim();
    if (!title) return;
    const changes: any = { title };
    if (this.editModalTimed) {
      changes.start_time = this.editModalStart;
      changes.end_time = this.editModalEnd;
    }
    this.svc.updateTask(task.id, changes).subscribe((updated) => {
      this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? updated : t)));
    });
    this.editModalOpen.set(false);
    this.editModalTask = null;
  }

  cancelEditModal() {
    this.editModalOpen.set(false);
    this.editModalTask = null;
  }

  autoSetEndTime(startTime: string, setEnd: (t: string) => void) {
    if (!startTime) return;
    const [h, m] = startTime.split(':').map(Number);
    const endH = (h + 1) % 24;
    setEnd(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  // ─── Utilities ────────────────────────────────────────────────────

  formatHour(h: number): string {
    if (h === 0) return '12a';
    if (h < 12) return `${h}a`;
    if (h === 12) return '12p';
    return `${h - 12}p`;
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private todayStr(): string {
    return this.toDateStr(new Date());
  }
}
