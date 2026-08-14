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
  effect,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from './auth.service';
import { PlannerService } from './planner.service';
import { TimeInputComponent } from './time-input.component';

@Component({
  selector: 'app-workspace-chat',
  standalone: true,
  imports: [FormsModule, TimeInputComponent, DatePipe],
  template: `
    <div class="h-full w-full flex flex-col overflow-hidden border-l border-r border-gray-700">
      <!-- Chat sub-nav -->
      <div class="flex flex-col bg-sky-950/60 border-b border-gray-700 shrink-0">
        <!-- Title row -->
        <div class="px-4 pt-2.5 pb-1 border-b border-gray-700/50 text-center">
          @if (selectedConversation()) {
            <input
              #titleInput
              [(ngModel)]="editTitleValue"
              (keydown.enter)="saveTitle()"
              (keydown.escape)="cancelEditTitle()"
              (blur)="saveTitle()"
              (click)="!editingTitle() && startEditTitle()"
              [readOnly]="!editingTitle()"
              class="w-full text-gray-200 text-sm font-semibold text-center bg-transparent outline-none py-0 leading-normal border-b"
              [class.border-violet-500]="editingTitle()"
              [class.border-transparent]="!editingTitle()"
              [class.cursor-pointer]="!editingTitle()"
              [class.cursor-text]="editingTitle()"
            />
          } @else {
            <p class="text-gray-600 text-sm italic">No conversation selected</p>
          }
        </div>
        <!-- Action buttons (centred) -->
        <div class="flex items-center justify-center gap-0.5 py-1.5 px-3">
          <button
            (click)="openHistory()"
            class="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-700 cursor-pointer transition-colors"
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
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>History</span>
          </button>
          <button
            (click)="newConversation()"
            [disabled]="needsGoals() || needsConstraints()"
            class="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-violet-400 hover:text-violet-300 hover:bg-gray-700 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New</span>
          </button>
          <div class="w-px h-4 bg-gray-700 mx-1"></div>
          @if (selectedConversation()) {
            <button
              (click)="generateSeed()"
              [disabled]="generatingSeed() || isLoading()"
              class="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-green-400 hover:text-green-300 hover:bg-gray-700 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default"
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
                <path d="M2 22 16 8" />
                <path
                  d="M3.5 12.5C2 8 6.5 3.5 12 3.5c2 0 4 .5 5.5 1.5C16 3 13.5 2 11 2 5.5 2 0 7 2 14z"
                />
              </svg>
              <span>Seed</span>
            </button>
          }
        </div>
        @if (selectedConversation() && sessionIntentText(); as intentText) {
          <div class="group relative">
            <div
              class="flex items-center gap-2 px-4 py-2 bg-cyan-900/40 border-t border-cyan-700/40"
            >
              <span class="text-cyan-400 shrink-0">🧭</span>
              <span class="flex-1 text-cyan-200 text-xs font-medium truncate">{{
                intentText
              }}</span>
              <button
                (click)="openChangeIntentModal()"
                title="Update session intent"
                class="text-cyan-500 hover:text-cyan-300 cursor-pointer transition-colors shrink-0"
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
            <div
              class="hidden group-hover:flex absolute top-0 left-0 right-0 z-20 items-start gap-2 px-4 py-2 bg-cyan-950 border-t border-b border-cyan-700/60 shadow-lg"
            >
              <span class="text-cyan-400 shrink-0 mt-0.5">🧭</span>
              <span
                class="flex-1 text-cyan-200 text-xs font-medium whitespace-normal break-words"
                >{{ intentText }}</span
              >
              <button
                (click)="openChangeIntentModal()"
                title="Update session intent"
                class="text-cyan-500 hover:text-cyan-300 cursor-pointer transition-colors shrink-0 mt-0.5"
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
          </div>
        }
      </div>

      @if (needsGoals()) {
        <div
          class="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-gray-900"
        >
          <div class="text-5xl">🎯</div>
          <h2 class="text-xl font-semibold text-gray-100">Set Your Goals First</h2>
          <p class="text-gray-400 max-w-sm text-sm">
            You need at least 3 goals before you can start a session. Goals keep your conversations
            focused and purposeful.
          </p>
          <p class="text-gray-600 text-sm">{{ goals().length }} / 3 goals set</p>
          <button
            (click)="requestGoals.emit()"
            class="mt-2 px-6 py-2 text-white rounded-lg transition-colors cursor-pointer text-sm"
            style="background-color: #127870;"
            onmouseover="this.style.backgroundColor='#158f86'"
            onmouseout="this.style.backgroundColor='#127870'"
          >
            Set Goals
          </button>
        </div>
      } @else if (needsConstraints()) {
        <div
          class="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-gray-900"
        >
          <div class="text-5xl">📋</div>
          <h2 class="text-xl font-semibold text-gray-100">Review Your Constraints</h2>
          <p class="text-gray-400 max-w-sm text-sm">
            Before starting a session, review the default constraints that will guide your
            conversations. Confirm them as-is or customise them to your needs.
          </p>
          <button
            (click)="requestConstraints.emit()"
            class="mt-2 px-6 py-2 text-white rounded-lg transition-colors cursor-pointer text-sm"
            style="background-color: #5a3ba3;"
            onmouseover="this.style.backgroundColor='#6b46c1'"
            onmouseout="this.style.backgroundColor='#5a3ba3'"
          >
            Review Constraints
          </button>
        </div>
      } @else if (!selectedConversation() && !loadingRecent()) {
        <div class="flex-1 flex items-center justify-center bg-gray-900">
          <div class="text-center">
            <p class="text-gray-500 text-sm mb-3">No conversation selected</p>
            <button
              (click)="newConversation()"
              class="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-500 cursor-pointer transition-colors"
            >
              New Conversation
            </button>
          </div>
        </div>
      } @else {
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 relative overflow-hidden">
            <div
              #messagesContainer
              class="absolute inset-0 overflow-y-auto p-4 bg-gray-900"
              style="scrollbar-width: thin; scrollbar-color: #6b7280 #374151;"
            >
              @for (msg of messages(); track msg.id) {
                @if (msg.role === 'user') {
                  <div class="mb-4 text-right ml-8">
                    <div
                      class="inline-block max-w-3xl p-3 rounded-lg text-white"
                      style="background-color: #3b4a6b;"
                    >
                      <div class="whitespace-pre-wrap text-sm">{{ msg.content }}</div>
                    </div>
                  </div>
                } @else if (msg.role === 'assistant') {
                  <div class="mb-4 mr-8">
                    <div class="inline-block max-w-3xl p-3 rounded-lg bg-gray-700 text-gray-100">
                      <div class="whitespace-pre-wrap text-sm">{{ msg.content }}</div>
                    </div>
                  </div>
                } @else if (msg.role === 'seed') {
                  <div
                    class="-mx-4 mb-2 px-6 py-3 bg-green-900/30 border-y border-green-700/40 text-sm"
                  >
                    <div class="flex items-center gap-2 text-green-400 mb-2">
                      <span>🌱</span>
                      <span class="font-medium">Seed generated and saved to bank</span>
                      <span class="ml-auto text-green-600 text-xs">{{
                        formatTime(msg.created_at)
                      }}</span>
                    </div>
                    <div class="text-green-300/70 whitespace-pre-wrap text-xs leading-relaxed">
                      {{ msg.content }}
                    </div>
                  </div>
                } @else if (msg.role === 'constraints') {
                  <div
                    class="-mx-4 mb-2 px-6 py-3 bg-purple-900/30 border-y border-purple-700/40 text-sm"
                    [class.context-fade-in]="animatingIds().has(msg.id)"
                  >
                    <div class="flex items-center gap-2 text-purple-400 mb-2">
                      <span>📋</span>
                      <span class="font-medium">Constraints applied</span>
                      <span class="ml-auto text-purple-600 text-xs">{{
                        formatTime(msg.created_at)
                      }}</span>
                    </div>
                    <div class="text-purple-300/70 whitespace-pre-wrap text-xs leading-relaxed">
                      {{ msg.content }}
                    </div>
                  </div>
                } @else if (msg.role === 'goals') {
                  <div
                    class="-mx-4 mb-2 px-6 py-3 bg-blue-900/30 border-y border-blue-700/40 text-sm"
                    [class.context-fade-in]="animatingIds().has(msg.id)"
                  >
                    <div class="flex items-center gap-2 text-blue-400 mb-2">
                      <span>🎯</span>
                      <span class="font-medium">Goals set</span>
                      <span class="ml-auto text-blue-600 text-xs">{{
                        formatTime(msg.created_at)
                      }}</span>
                    </div>
                    <div class="text-blue-300/70 whitespace-pre-wrap text-xs leading-relaxed">
                      {{ msg.content }}
                    </div>
                  </div>
                } @else if (msg.role === 'seed-context') {
                  <div
                    class="-mx-4 mb-2 px-6 py-3 bg-green-900/30 border-y border-green-700/40 text-sm"
                    [class.context-fade-in]="animatingIds().has(msg.id)"
                  >
                    <div class="flex items-center gap-2 text-green-400 mb-2">
                      <span>🌱</span>
                      <span class="font-medium">Seed Applied</span>
                    </div>
                    <div class="flex flex-col gap-0.5 text-xs mb-2">
                      @if (extractSeedAppliedAt(msg.content); as t) {
                        <span class="text-green-500">Applied: {{ formatSeedTimestamp(t) }}</span>
                      }
                      @if (extractSeedGeneratedAt(msg.content); as t) {
                        <span class="text-green-600/80"
                          >Generated: {{ formatSeedTimestamp(t) }}</span
                        >
                      }
                    </div>
                    <div class="text-green-300/70 whitespace-pre-wrap text-xs leading-relaxed">
                      {{ extractSeedBody(msg.content) }}
                    </div>
                  </div>
                } @else if (msg.role === 'audit-context') {
                  <div
                    class="-mx-4 mb-2 px-6 py-3 bg-yellow-900/30 border-y border-yellow-700/40 text-sm"
                    [class.context-fade-in]="animatingIds().has(msg.id)"
                  >
                    <div class="flex items-center gap-2 text-yellow-400 mb-2">
                      <span>📊</span>
                      <span class="font-medium">Audit Context Applied</span>
                      <span class="ml-auto text-yellow-600 text-xs">{{
                        formatTime(msg.created_at)
                      }}</span>
                    </div>
                    <div class="text-yellow-300/70 whitespace-pre-wrap text-xs leading-relaxed">
                      {{ msg.content }}
                    </div>
                  </div>
                } @else if (msg.role === 'planner-context') {
                  <div
                    class="-mx-4 mb-2 px-6 py-3 bg-teal-900/30 border-y border-teal-700/40 text-sm"
                    [class.context-fade-in]="animatingIds().has(msg.id)"
                  >
                    <div class="flex items-center gap-2 text-teal-400 mb-2">
                      <span>📅</span>
                      <span class="font-medium">Week Plan Applied</span>
                      <span class="ml-auto text-teal-600 text-xs">{{
                        formatTime(msg.created_at)
                      }}</span>
                    </div>
                    <div class="text-teal-300/70 whitespace-pre-wrap text-xs leading-relaxed">
                      {{ msg.content }}
                    </div>
                  </div>
                } @else if (msg.role === 'session-intent') {
                  <div
                    class="-mx-4 mb-2 px-6 py-3 bg-cyan-900/30 border-y border-cyan-700/40 text-sm"
                    [class.context-fade-in]="animatingIds().has(msg.id)"
                  >
                    <div class="flex items-center gap-2 text-cyan-400 mb-2">
                      <span>🧭</span>
                      <span class="font-medium">Session Intent</span>
                      <span class="ml-auto text-cyan-600 text-xs">{{
                        formatTime(msg.created_at)
                      }}</span>
                    </div>
                    <div class="text-cyan-300/70 whitespace-pre-wrap text-xs leading-relaxed">
                      {{ extractIntentText(msg.content) }}
                    </div>
                  </div>
                }
              }
              @if (isLoading() || generatingSeed()) {
                <div class="mb-4">
                  <div class="inline-block p-3 rounded-lg bg-gray-700 text-gray-100">
                    <div class="flex items-center gap-2">
                      <div
                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"
                      ></div>
                      <span class="text-sm">{{
                        generatingSeed() ? 'Generating seed…' : 'Responding…'
                      }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
          <!-- /flex-1 relative messages area -->
          @if (dailyLimitReached()) {
            <div
              class="bg-orange-950/60 border-t border-orange-800/60 px-4 py-2 text-orange-300 text-xs text-center shrink-0"
            >
              Daily message limit reached. Your limit resets at midnight.
            </div>
          }
          <div class="border-t border-gray-700 p-3 shrink-0 bg-gray-800">
            <div class="flex gap-2 items-end">
              <textarea
                #chatTextarea
                [(ngModel)]="inputText"
                (keydown)="onKeyDown($event)"
                (input)="autoResize($event)"
                placeholder="Message…"
                rows="1"
                [disabled]="dailyLimitReached()"
                [title]="
                  dailyLimitReached()
                    ? 'Daily message limit reached. Your limit resets at midnight.'
                    : ''
                "
                class="flex-1 bg-gray-700 text-gray-100 text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500 resize-none overflow-hidden disabled:opacity-50 disabled:cursor-default"
                style="min-height: 38px; max-height: 150px;"
              ></textarea>
              <button
                (click)="sendMessage()"
                [disabled]="
                  !inputText.trim() || isLoading() || generatingSeed() || dailyLimitReached()
                "
                [title]="
                  dailyLimitReached()
                    ? 'Daily message limit reached. Your limit resets at midnight.'
                    : ''
                "
                class="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg enabled:hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- New Conversation -->
    @if (showNewConvModal()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && closeNewConvModal()"
      >
        <div
          class="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700"
          [class.w-80]="!showSeedPicker()"
          [class.w-96]="showSeedPicker()"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-100 font-semibold text-sm">
              @if (showSeedPicker()) {
                Select a Seed
              } @else {
                New Conversation
              }
            </h3>
            <button
              (click)="showNewConvModal.set(false); showSeedPicker.set(false)"
              class="text-gray-500 hover:text-white cursor-pointer text-lg leading-none"
            >
              ✕
            </button>
          </div>
          @if (!showSeedPicker()) {
            <div class="flex flex-col gap-2">
              <button
                (click)="startFromLastSeed()"
                [disabled]="!hasSeeds()"
                class="w-full text-white py-2 px-4 rounded text-sm transition-colors enabled:cursor-pointer enabled:hover:bg-[#4a5a7a] disabled:opacity-40 disabled:cursor-default bg-[#3b4a6b]"
              >
                ⚡ Start from Last Seed
              </button>
              <button
                (click)="openSeedPicker()"
                [disabled]="!hasSeeds()"
                class="w-full text-white py-2 px-4 rounded text-sm transition-colors enabled:cursor-pointer enabled:hover:bg-[#4a5a7a] disabled:opacity-40 disabled:cursor-default bg-[#3b4a6b]"
              >
                🌱 Start from Seed
              </button>
              <button
                (click)="createFresh()"
                class="w-full text-white py-2 px-4 rounded text-sm cursor-pointer transition-colors"
                style="background-color: #3b4a6b;"
                onmouseover="this.style.backgroundColor='#4a5a7a'"
                onmouseout="this.style.backgroundColor='#3b4a6b'"
              >
                ✨ Start Fresh
              </button>
            </div>
          } @else {
            <div class="flex flex-col gap-1 max-h-72 overflow-y-auto">
              @if (modalSeedsLoading()) {
                <p class="text-gray-500 text-xs text-center py-4">Loading…</p>
              } @else if (modalSeeds().length === 0) {
                <p class="text-gray-500 text-xs text-center py-4">No seeds saved yet.</p>
              } @else {
                @for (seed of modalSeeds(); track seed.id) {
                  <button
                    (click)="pickSeedForNewConv(seed)"
                    class="w-full text-left text-gray-200 text-sm py-2 px-3 rounded hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div class="font-medium truncate">{{ seed.title || 'Untitled' }}</div>
                    <div class="text-gray-500 text-xs truncate mt-0.5">
                      {{ seed.created_at | date: 'mediumDate' }}
                    </div>
                  </button>
                }
              }
            </div>
            <button
              (click)="showSeedPicker.set(false)"
              class="mt-3 text-gray-500 hover:text-gray-300 text-xs cursor-pointer"
            >
              ← Back
            </button>
          }
        </div>
      </div>
    }

    <!-- Chat History -->
    @if (showHistoryModal()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && showHistoryModal.set(false)"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 w-[480px] max-h-[70vh] flex flex-col shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 class="text-gray-200 font-semibold text-sm">Conversations</h3>
            <button
              (click)="showHistoryModal.set(false)"
              class="text-gray-500 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div class="flex-1 overflow-y-auto">
            @for (conv of conversations(); track conv.id) {
              <div
                class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/50 cursor-pointer border-b border-gray-700/30"
                (click)="selectConversation(conv)"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-gray-200 truncate">{{ conv.title }}</div>
                  <div class="text-xs text-gray-500">{{ formatTime(conv.updated_at) }}</div>
                </div>
                @if (conv.id === selectedConversation()?.id) {
                  <span class="text-violet-400 text-xs shrink-0">active</span>
                }
              </div>
            }
            @if (conversations().length === 0) {
              <p class="text-gray-500 text-sm text-center py-8">No conversations yet</p>
            }
          </div>
        </div>
      </div>
    }

    <!-- Seed Title Dialog -->
    @if (showSeedTitleDialog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 w-[480px] shadow-xl border border-gray-700">
          <h3 class="text-base font-semibold text-gray-100 mb-1">Seed saved to bank</h3>
          <p class="text-xs text-gray-400 mb-4">Give it a name, or keep the default.</p>
          <input
            [(ngModel)]="pendingSeedTitle"
            #seedTitleInput
            (keydown.enter)="pendingSeedTitle.trim() && saveSeedTitle()"
            class="w-full bg-gray-700 text-gray-100 px-3 py-2 rounded border border-gray-500 focus:outline-none focus:border-teal-500 mb-4"
          />
          <div class="flex justify-end">
            <button
              (click)="saveSeedTitle()"
              [disabled]="!pendingSeedTitle.trim()"
              class="px-4 py-2 text-white text-sm rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors"
              style="background-color: #127870;"
              onmouseover="this.style.backgroundColor='#158f86'"
              onmouseout="this.style.backgroundColor='#127870'"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Proposed Tasks -->
    @if (proposedTasksOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && cancelProposedTasks()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-[480px] max-h-[80vh] flex flex-col shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-gray-200 font-semibold mb-1">Add to planner?</h3>
          <p class="text-xs text-gray-500 mb-4">
            The assistant noticed these items aren't in your task list. Edit, confirm, or discard
            each one.
          </p>
          <div class="flex-1 overflow-y-auto space-y-3 pr-1">
            @for (task of proposedTasks(); track $index) {
              <div class="bg-gray-700/50 rounded-lg border border-gray-600 p-3 space-y-2">
                <div class="flex items-start gap-2">
                  <input
                    [(ngModel)]="task.title"
                    placeholder="Task title"
                    class="flex-1 bg-gray-700 text-gray-100 text-sm px-2 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500"
                  />
                  <button
                    (click)="discardProposedTask($index)"
                    class="text-gray-500 hover:text-red-400 text-sm cursor-pointer transition-colors mt-1 shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    [(ngModel)]="task.day"
                    placeholder="YYYY-MM-DD (optional)"
                    class="w-36 bg-gray-700 text-gray-100 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-violet-500 placeholder-gray-500"
                  />
                  @if (task.day) {
                    <app-time-input
                      [value]="task.start_time || ''"
                      (valueChange)="task.start_time = $event; autoProposedEndTime(task)"
                    />
                    <span class="text-gray-500 text-xs shrink-0">–</span>
                    <app-time-input
                      [value]="task.end_time || ''"
                      (valueChange)="task.end_time = $event"
                    />
                    <button
                      (click)="clearProposedTime(task)"
                      title="Remove time"
                      class="text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer transition-colors shrink-0"
                    >
                      ✕ time
                    </button>
                  }
                </div>
                @if (!task.day) {
                  <p class="text-[11px] text-gray-600">
                    No day set — will be added as unscheduled.
                  </p>
                }
              </div>
            }
            @if (proposedTasks().length === 0) {
              <p class="text-sm text-gray-500 text-center py-4">All tasks discarded.</p>
            }
          </div>
          <div class="flex gap-2 justify-end mt-4 pt-3 border-t border-gray-700">
            <button
              (click)="cancelProposedTasks()"
              class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              Dismiss
            </button>
            <button
              (click)="confirmProposedTasks()"
              [disabled]="proposedTasks().length === 0"
              class="px-4 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
            >
              Add {{ proposedTasks().length }} task{{ proposedTasks().length === 1 ? '' : 's' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Session Intent (new conversation, blocking) -->
    @if (showSessionIntentModal()) {
      <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-xl border border-cyan-700/50 p-5 w-[480px] shadow-xl">
          <h3 class="text-gray-100 font-semibold mb-1">What's the one thing?</h3>
          <p class="text-xs text-gray-400 mb-3">
            What is the one thing you want to resolve or decide in this conversation?
          </p>
          <textarea
            #sessionIntentInput
            [(ngModel)]="sessionIntentDraft"
            rows="3"
            (keydown.enter)="$event.preventDefault(); confirmSessionIntent()"
            class="w-full bg-gray-700 text-gray-200 text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-cyan-500 placeholder-gray-500 resize-none"
            placeholder="e.g. Decide whether to..."
          ></textarea>
          <div class="flex justify-end mt-3">
            <button
              (click)="confirmSessionIntent()"
              [disabled]="!sessionIntentDraft.trim()"
              class="px-4 py-1.5 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
            >
              Set Intent
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Change Session Intent -->
    @if (showChangeIntentModal()) {
      <div
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && showChangeIntentModal.set(false)"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-[480px] shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-gray-100 font-semibold mb-1">Update your session intent</h3>
          <p class="text-xs text-gray-400 mb-3">
            What's the new focus for this conversation? The previous intent stays in the
            conversation history.
          </p>
          <textarea
            [(ngModel)]="changeIntentDraft"
            rows="3"
            class="w-full bg-gray-700 text-gray-200 text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-cyan-500 placeholder-gray-500 resize-none"
            placeholder="e.g. Decide whether to..."
          ></textarea>
          <div class="flex gap-2 justify-end mt-3">
            <button
              (click)="showChangeIntentModal.set(false)"
              class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmChangeIntent()"
              [disabled]="!changeIntentDraft.trim()"
              class="px-4 py-1.5 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Seed Resolution Check -->
    @if (showSeedResolutionModal()) {
      <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-[480px] shadow-xl">
          <h3 class="text-gray-100 font-semibold mb-1">Did you resolve your intent?</h3>
          <p class="text-xs text-cyan-300/80 mb-3 italic">"{{ sessionIntentText() }}"</p>
          @if (seedResolutionAnswer() === null) {
            <div class="flex gap-2 justify-end">
              <button
                (click)="setSeedResolutionAnswer(false)"
                class="px-4 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 cursor-pointer transition-colors"
              >
                No
              </button>
              <button
                (click)="setSeedResolutionAnswer(true)"
                class="px-4 py-1.5 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-500 cursor-pointer transition-colors"
              >
                Yes
              </button>
            </div>
          } @else {
            @if (!seedResolutionAnswer()) {
              <textarea
                [(ngModel)]="seedResolutionReason"
                rows="2"
                class="w-full bg-gray-700 text-gray-200 text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-cyan-500 placeholder-gray-500 resize-none mb-3"
                placeholder="Why not? (optional)"
              ></textarea>
            }
            <div class="flex gap-2 justify-end">
              <button
                (click)="seedResolutionAnswer.set(null)"
                class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                (click)="confirmSeedResolution()"
                class="px-4 py-1.5 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-500 cursor-pointer transition-colors"
              >
                Continue
              </button>
            </div>
          }
        </div>
      </div>
    }

    @if (showSeedSavedToast()) {
      <div class="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
        <div class="bg-green-700 text-white text-sm font-medium px-5 py-3 rounded-lg shadow-lg">
          Seed saved!
        </div>
      </div>
    }
  `,
})
export class WorkspaceChatComponent implements OnInit {
  @Output() tasksCreated = new EventEmitter<void>();
  @Output() seedGenerated = new EventEmitter<void>();
  @Output() dataLoaded = new EventEmitter<void>();
  @Output() requestGoals = new EventEmitter<void>();
  @Output() requestConstraints = new EventEmitter<void>();

  authService = inject(AuthService);
  private plannerService = inject(PlannerService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('chatTextarea') chatTextarea!: ElementRef;
  @ViewChild('seedTitleInput') seedTitleInput!: ElementRef;
  @ViewChild('titleInput') titleInput!: ElementRef;
  @ViewChild('sessionIntentInput') sessionIntentInput!: ElementRef;

  backdropMousedownTarget: EventTarget | null = null;
  loadingRecent = signal(false);
  conversations = signal<any[]>([]);
  selectedConversation = signal<any | null>(null);
  messages = signal<any[]>([]);
  isLoading = signal(false);
  inputText = '';
  generatingSeed = signal(false);

  animatingIds = signal<Set<number>>(new Set());

  showNewConvModal = signal(false);
  showSeedPicker = signal(false);
  modalSeeds = signal<any[]>([]);
  modalSeedsLoading = signal(false);
  showHistoryModal = signal(false);
  constraintsData = '';
  seedBankSeeds = signal<any[]>([]);
  pendingSeedTitle = '';
  pendingSeedBankId = signal<number | null>(null);
  showSeedTitleDialog = signal(false);
  showSeedSavedToast = signal(false);
  proposedTasksOpen = signal(false);
  proposedTasks = signal<
    { title: string; day: string | null; start_time: string | null; end_time: string | null }[]
  >([]);
  hasSeeds = signal(false);
  dailyLimitReached = signal(false);

  editingTitle = signal(false);
  editTitleValue = '';

  goals = signal<any[]>([]);
  auditSeed = signal<string | null>(null);
  latestAudit = signal<any | null>(null);

  needsGoals = computed(() => this.goals().length < 3);
  needsConstraints = computed(() => !this.needsGoals() && this.authService.userPhase() === 2);

  showSessionIntentModal = signal(false);
  sessionIntentDraft = '';
  private pendingNewConvConv: any = null;
  private pendingNewConvSeed: { content: string; created_at?: string } | null = null;

  showChangeIntentModal = signal(false);
  changeIntentDraft = '';

  showSeedResolutionModal = signal(false);
  seedResolutionAnswer = signal<boolean | null>(null);
  seedResolutionReason = '';

  sessionIntentText = computed(() => {
    const msgs = this.messages();
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'session-intent') return this.extractIntentText(msgs[i].content);
    }
    return null;
  });

  constructor() {
    effect(() => {
      const conv = this.selectedConversation();
      if (!this.editingTitle()) {
        this.editTitleValue = conv?.title ?? '';
      }
    });
    effect(() => {
      if (this.authService.userPhase() === 3) {
        this.loadConstraints();
        this.loadGoals();
      }
    });
  }

  ngOnInit() {
    this.loadConversations();
    this.loadConstraints();
    this.loadGoals();
    this.loadAuditSeed();
    this.loadHasSeeds();
  }

  loadHasSeeds() {
    this.authService.getSeeds().subscribe({
      next: (seeds: any[]) => this.hasSeeds.set(seeds.length > 0),
      error: () => {},
    });
  }

  loadConversations() {
    this.authService.getConversations().subscribe((convs: any[]) => {
      const active = convs.filter((c: any) => !c.archived);
      this.conversations.set(active);
      this.dataLoaded.emit();
      if (active.length > 0 && !this.selectedConversation()) {
        this.loadingRecent.set(true);
        this.selectConversation(active[0]);
        setTimeout(() => {
          this.loadingRecent.set(false);
          setTimeout(() => this.scrollToBottom(), 50);
        }, 1000);
      }
    });
  }

  loadConstraints() {
    this.authService.getConstraints().subscribe((data: any) => {
      this.constraintsData = data.constraints || '';
    });
  }

  loadGoals() {
    this.authService.getGoals().subscribe((goals: any[]) => {
      this.goals.set(goals);
    });
  }

  loadAuditSeed() {
    this.authService.getLatestAudit().subscribe({
      next: (audit: any) => {
        this.latestAudit.set(audit || null);
        this.auditSeed.set(audit?.analytics_seed || null);
      },
      error: () => {},
    });
  }

  selectConversation(conv: any) {
    this.showHistoryModal.set(false);
    if (this.selectedConversation()?.id === conv.id) return;
    this.authService.getConversation(conv.id).subscribe((data: any) => {
      this.selectedConversation.set(data);
      this.messages.set(data.messages || []);
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  newConversation() {
    this.showNewConvModal.set(true);
  }

  closeNewConvModal() {
    this.showNewConvModal.set(false);
    this.showSeedPicker.set(false);
  }

  createFresh() {
    this.showNewConvModal.set(false);
    this.showSeedPicker.set(false);
    this.doCreateConversation(null);
  }

  startFromLastSeed() {
    this.authService.getSeeds().subscribe({
      next: (seeds: any[]) => {
        if (seeds.length > 0) {
          this.showNewConvModal.set(false);
          this.doCreateConversation(seeds[0]);
        }
      },
    });
  }

  openSeedPicker() {
    this.showSeedPicker.set(true);
    this.modalSeedsLoading.set(true);
    this.authService.getSeeds().subscribe({
      next: (seeds: any[]) => {
        this.modalSeeds.set(seeds);
        this.modalSeedsLoading.set(false);
      },
      error: () => this.modalSeedsLoading.set(false),
    });
  }

  pickSeedForNewConv(seed: any) {
    this.showNewConvModal.set(false);
    this.showSeedPicker.set(false);
    this.doCreateConversation(seed);
  }

  startConvFromSeed(seed: any) {
    this.doCreateConversation(seed);
  }

  private doCreateConversation(seed: { content: string; created_at?: string } | null) {
    if (this.needsGoals() || this.needsConstraints()) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const title = `CNV-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    this.authService.createConversation(title).subscribe((conv: any) => {
      this.conversations.update((cs) => [conv, ...cs]);
      this.selectedConversation.set(conv);
      this.messages.set([]);
      this.pendingNewConvConv = conv;
      this.pendingNewConvSeed = seed;
      this.sessionIntentDraft = '';
      this.showSessionIntentModal.set(true);
      setTimeout(() => this.sessionIntentInput?.nativeElement?.focus(), 50);
    });
  }

  confirmSessionIntent() {
    const text = this.sessionIntentDraft.trim();
    if (!text) return;
    const conv = this.pendingNewConvConv;
    const seed = this.pendingNewConvSeed;
    this.showSessionIntentModal.set(false);
    this.sessionIntentDraft = '';
    this.pendingNewConvConv = null;
    this.pendingNewConvSeed = null;
    if (!conv) return;
    this.continueCreateConversation(conv, seed, text);
  }

  private continueCreateConversation(
    conv: any,
    seed: { content: string; created_at?: string } | null,
    intentText: string,
  ) {
    const needsPlanner = this.goals().length > 0;
    const planner$ = needsPlanner ? this.authService.getPlannerWeekContext() : of({ text: null });
    planner$.subscribe(({ text: plannerText }: { text: string | null }) => {
      const blocks: { role: string; content: string; seed_created_at?: string }[] = [];
      blocks.push({ role: 'session-intent', content: intentText });
      if (this.constraintsData.trim()) {
        blocks.push({ role: 'constraints', content: this.constraintsData });
      }
      if (this.goals().length) {
        const goalsText =
          'My goals:\n\n' +
          this.goals()
            .map((g: any, i: number) => {
              const comments = g.comments?.length
                ? '\n' + g.comments.map((c: any) => `   - ${c.content}`).join('\n')
                : '';
              return `${i + 1}. ${g.content}${comments}`;
            })
            .join('\n') +
          '\n\nPlease keep these in mind as context throughout our conversation.';
        blocks.push({ role: 'goals', content: goalsText });
      }
      if (plannerText) {
        blocks.push({ role: 'planner-context', content: plannerText });
      }
      const auditSeed = this.auditSeed();
      if (auditSeed) {
        const audit = this.latestAudit();
        const summaryDate = audit?.completed_at
          ? new Date(audit.completed_at).toLocaleDateString('en-CA')
          : null;
        const todayDate = new Date().toLocaleDateString('en-CA');
        const dateClause = summaryDate
          ? ` It was made on ${summaryDate}. Today's date is ${todayDate}.`
          : '';
        const framed = `The following is a summary providing extra context on the current state of my activities and progress.${dateClause} Use it as background context for this conversation:\n\n${auditSeed}`;
        blocks.push({ role: 'audit-context', content: framed });
      }
      if (seed) {
        blocks.push({
          role: 'seed-context',
          content: seed.content,
          ...(seed.created_at ? { seed_created_at: seed.created_at } : {}),
        });
      }
      if (blocks.length === 0) return;
      this.isLoading.set(true);
      const appliedAt = new Date().toISOString();
      const placeholders = blocks.map((b) => {
        if (b.role === 'seed-context') {
          const generatedLine = b.seed_created_at
            ? `[Seed generated: ${new Date(b.seed_created_at.includes('T') || b.seed_created_at.endsWith('Z') ? b.seed_created_at : b.seed_created_at.replace(' ', 'T') + 'Z').toISOString()}]\n`
            : '';
          const content = `${generatedLine}[Seed applied to conversation: ${appliedAt}]\n[Context: Historical state from sessions prior to the generation date above — not events from today]\n\n${b.content}`;
          return { id: Date.now() + Math.random(), role: b.role, content, created_at: appliedAt };
        }
        return {
          id: Date.now() + Math.random(),
          role: b.role,
          content: b.content,
          created_at: new Date().toISOString(),
        };
      });
      const STAGGER_MS = 350;
      this.messages.set([]);
      placeholders.forEach((p, i) => {
        setTimeout(() => {
          this.messages.update((msgs) => [...msgs, p]);
          this.animatingIds.update((s) => {
            const n = new Set(s);
            n.add(p.id);
            return n;
          });
          setTimeout(() => this.scrollToBottom(), 50);
        }, i * STAGGER_MS);
      });
      this.authService.injectContextBatch(conv.id, blocks).subscribe({
        next: (response: any) => {
          this.animatingIds.set(new Set());
          this.messages.set([...response.messages, response.assistantMessage]);
          this.isLoading.set(false);
          setTimeout(() => this.scrollToBottom(), 100);
          setTimeout(() => this.chatTextarea?.nativeElement?.focus(), 150);
        },
        error: () => {
          this.animatingIds.set(new Set());
          this.messages.set([]);
          this.isLoading.set(false);
        },
      });
    });
  }

  applyConstraints(onComplete?: () => void) {
    const conv = this.selectedConversation();
    if (!conv || this.isLoading()) {
      onComplete?.();
      return;
    }
    this.authService.getConstraints().subscribe((data: any) => {
      this.constraintsData = data.constraints || '';
      if (!this.constraintsData.trim()) {
        onComplete?.();
        return;
      }
      this._doApplyConstraints(conv, onComplete);
    });
  }

  private _doApplyConstraints(conv: any, onComplete?: () => void) {
    this.isLoading.set(true);
    const placeholder = {
      id: Date.now(),
      role: 'constraints',
      content: this.constraintsData,
      created_at: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, placeholder]);
    setTimeout(() => this.scrollToBottom(), 50);
    this.authService.sendMessage(conv.id, this.constraintsData, 'constraints').subscribe({
      next: (response: any) => {
        this.messages.update((msgs) => [
          ...msgs.filter((m) => m.id !== placeholder.id),
          response.userMessage,
          response.assistantMessage,
        ]);
        this.isLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 100);
        onComplete?.();
      },
      error: () => {
        this.messages.update((msgs) => msgs.filter((m) => m.id !== placeholder.id));
        this.isLoading.set(false);
        onComplete?.();
      },
    });
  }

  applyGoals(onComplete?: () => void, chainPlanner = true) {
    const conv = this.selectedConversation();
    if (!conv || this.isLoading() || !this.goals().length) {
      if (chainPlanner) this.applyPlannerContext(onComplete);
      else onComplete?.();
      return;
    }
    const goalsText =
      'My goals:\n\n' +
      this.goals()
        .map((g: any, i: number) => {
          const comments = g.comments?.length
            ? '\n' + g.comments.map((c: any) => `   - ${c.content}`).join('\n')
            : '';
          return `${i + 1}. ${g.content}${comments}`;
        })
        .join('\n') +
      '\n\nPlease keep these in mind as context throughout our conversation.';
    this.isLoading.set(true);
    const placeholder = {
      id: Date.now(),
      role: 'goals',
      content: goalsText,
      created_at: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, placeholder]);
    setTimeout(() => this.scrollToBottom(), 50);
    this.authService.sendMessage(conv.id, goalsText, 'goals').subscribe({
      next: (response: any) => {
        this.messages.update((msgs) => [
          ...msgs.filter((m) => m.id !== placeholder.id),
          response.userMessage,
          response.assistantMessage,
        ]);
        this.isLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 100);
        if (chainPlanner) this.applyPlannerContext(onComplete);
        else onComplete?.();
      },
      error: () => {
        this.messages.update((msgs) => msgs.filter((m) => m.id !== placeholder.id));
        this.isLoading.set(false);
        if (chainPlanner) this.applyPlannerContext(onComplete);
        else onComplete?.();
      },
    });
  }

  openChangeIntentModal() {
    this.changeIntentDraft = '';
    this.showChangeIntentModal.set(true);
  }

  confirmChangeIntent() {
    const text = this.changeIntentDraft.trim();
    if (!text) return;
    this.showChangeIntentModal.set(false);
    this.applySessionIntent(text);
  }

  applySessionIntent(text: string) {
    const conv = this.selectedConversation();
    if (!conv || this.isLoading()) return;
    this.isLoading.set(true);
    const placeholder = {
      id: Date.now(),
      role: 'session-intent',
      content: text,
      created_at: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, placeholder]);
    setTimeout(() => this.scrollToBottom(), 50);
    this.authService.sendMessage(conv.id, text, 'session-intent').subscribe({
      next: (response: any) => {
        this.messages.update((msgs) => [
          ...msgs.filter((m) => m.id !== placeholder.id),
          response.userMessage,
          response.assistantMessage,
        ]);
        this.isLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: () => {
        this.messages.update((msgs) => msgs.filter((m) => m.id !== placeholder.id));
        this.isLoading.set(false);
      },
    });
  }

  applyAuditContext(onComplete?: () => void) {
    const conv = this.selectedConversation();
    const seed = this.auditSeed();
    if (!conv || !seed) {
      onComplete?.();
      return;
    }
    const audit = this.latestAudit();
    const summaryDate = audit?.completed_at
      ? new Date(audit.completed_at).toLocaleDateString('en-CA')
      : null;
    const todayDate = new Date().toLocaleDateString('en-CA');
    const dateClause = summaryDate
      ? ` It was made on ${summaryDate}. Today's date is ${todayDate}.`
      : '';
    const framed = `The following is a summary providing extra context on the current state of my activities and progress.${dateClause} Use it as background context for this conversation:\n\n${seed}`;
    this.isLoading.set(true);
    const placeholder = {
      id: Date.now(),
      role: 'audit-context',
      content: framed,
      created_at: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, placeholder]);
    setTimeout(() => this.scrollToBottom(), 50);
    this.authService.sendMessage(conv.id, framed, 'audit-context').subscribe({
      next: (response: any) => {
        this.messages.update((msgs) => [
          ...msgs.filter((m) => m.id !== placeholder.id),
          response.userMessage,
          response.assistantMessage,
        ]);
        this.isLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 100);
        onComplete?.();
      },
      error: () => {
        this.messages.update((msgs) => msgs.filter((m) => m.id !== placeholder.id));
        this.isLoading.set(false);
        onComplete?.();
      },
    });
  }

  openHistory() {
    this.loadConversations();
    this.showHistoryModal.set(true);
  }

  startEditTitle() {
    const conv = this.selectedConversation();
    if (!conv) return;
    this.editTitleValue = conv.title;
    this.editingTitle.set(true);
    setTimeout(() => this.titleInput?.nativeElement?.select(), 50);
  }

  saveTitle() {
    const conv = this.selectedConversation();
    const newTitle = this.editTitleValue.trim();
    this.editingTitle.set(false);
    if (!conv || !newTitle || newTitle === conv.title) return;
    this.authService.updateConversation(conv.id, newTitle).subscribe(() => {
      this.selectedConversation.set({ ...conv, title: newTitle });
      this.conversations.update((cs) =>
        cs.map((c) => (c.id === conv.id ? { ...c, title: newTitle } : c)),
      );
    });
  }

  cancelEditTitle() {
    this.editingTitle.set(false);
  }

  sendMessage() {
    const content = this.inputText.trim();
    const conv = this.selectedConversation();
    if (!content || !conv || this.isLoading() || this.dailyLimitReached()) return;
    this.inputText = '';
    if (this.chatTextarea?.nativeElement) this.chatTextarea.nativeElement.style.height = 'auto';
    this.isLoading.set(true);
    const optimistic = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, optimistic]);
    setTimeout(() => this.scrollToBottom(), 50);
    this.authService.sendMessage(conv.id, content).subscribe({
      next: (response: any) => {
        this.messages.update((msgs) => [
          ...msgs.filter((m) => m.id !== optimistic.id),
          response.userMessage,
          response.assistantMessage,
        ]);
        this.isLoading.set(false);
        if (response.messagesRemaining !== undefined && response.messagesRemaining <= 0) {
          this.dailyLimitReached.set(true);
        }
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err: any) => {
        this.messages.update((msgs) => msgs.filter((m) => m.id !== optimistic.id));
        this.isLoading.set(false);
        if (err.status === 429) {
          this.dailyLimitReached.set(true);
          this.inputText = content;
        }
      },
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 150);
    el.style.height = next + 'px';
    el.style.overflowY = next >= 150 ? 'auto' : 'hidden';
    this.scrollToBottom();
  }

  scrollToBottom() {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private scrollToBottomAfterRender() {
    requestAnimationFrame(() => requestAnimationFrame(() => this.scrollToBottom()));
  }

  generateSeed() {
    const conv = this.selectedConversation();
    if (!conv || this.isLoading() || this.generatingSeed()) return;
    if (this.sessionIntentText()) {
      this.seedResolutionAnswer.set(null);
      this.seedResolutionReason = '';
      this.showSeedResolutionModal.set(true);
      return;
    }
    this.doGenerateSeed();
  }

  setSeedResolutionAnswer(val: boolean) {
    this.seedResolutionAnswer.set(val);
    if (val) this.confirmSeedResolution();
  }

  confirmSeedResolution() {
    const intentResolved = this.seedResolutionAnswer();
    const resolutionReason = this.seedResolutionReason.trim() || undefined;
    this.showSeedResolutionModal.set(false);
    this.doGenerateSeed(intentResolved ?? undefined, resolutionReason);
  }

  private doGenerateSeed(intentResolved?: boolean, resolutionReason?: string) {
    const conv = this.selectedConversation();
    if (!conv || this.isLoading() || this.generatingSeed()) return;
    this.generatingSeed.set(true);
    this.scrollToBottomAfterRender();
    const body =
      typeof intentResolved === 'boolean' ? { intentResolved, resolutionReason } : undefined;
    this.authService.generateSeed(conv.id, body).subscribe({
      next: (response: any) => {
        this.messages.update((msgs) => [...msgs, response.seedMarker]);
        this.selectedConversation.set({ ...conv, seed: response.seed });
        this.generatingSeed.set(false);
        this.scrollToBottomAfterRender();
        this.proposedTasks.set(response.proposedTasks || []);
        this.pendingSeedTitle = response.autoTitle || 'Untitled Seed';
        this.pendingSeedBankId.set(response.bankSeedId ?? null);
        this.showSeedTitleDialog.set(true);
        setTimeout(() => this.seedTitleInput?.nativeElement?.select(), 50);
      },
      error: () => this.generatingSeed.set(false),
    });
  }

  saveSeedTitle() {
    const id = this.pendingSeedBankId();
    if (!id || !this.pendingSeedTitle.trim()) return;
    this.authService.updateSeed(id, { title: this.pendingSeedTitle.trim() }).subscribe({
      next: (updated: any) => {
        this.seedBankSeeds.update((seeds) => seeds.map((s) => (s.id === id ? updated : s)));
        this.seedGenerated.emit();
      },
    });
    this.showSeedTitleDialog.set(false);
    this.pendingSeedBankId.set(null);
    this.pendingSeedTitle = '';
    this.showSeedSavedToast.set(true);
    setTimeout(() => this.showSeedSavedToast.set(false), 2000);
    if (this.proposedTasks().length > 0) {
      this.proposedTasksOpen.set(true);
    }
  }

  applySeed(seed: any) {
    const conv = this.selectedConversation();
    if (!conv) return;
    this.isLoading.set(true);
    const placeholder = {
      id: Date.now(),
      role: 'seed-context',
      content: seed.content,
      created_at: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, placeholder]);
    setTimeout(() => this.scrollToBottom(), 50);
    this.authService
      .sendMessage(conv.id, seed.content, 'seed-context', { seed_created_at: seed.created_at })
      .subscribe({
        next: (response: any) => {
          this.messages.update((msgs) => [
            ...msgs.filter((m) => m.id !== placeholder.id),
            response.userMessage,
            response.assistantMessage,
          ]);
          this.isLoading.set(false);
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: () => {
          this.messages.update((msgs) => msgs.filter((m) => m.id !== placeholder.id));
          this.isLoading.set(false);
        },
      });
  }

  applyPlannerContext(onComplete?: () => void) {
    const conv = this.selectedConversation();
    if (!conv || this.isLoading()) {
      onComplete?.();
      return;
    }
    this.authService.getPlannerWeekContext().subscribe({
      next: ({ text }: { text: string | null }) => {
        if (!text) {
          onComplete?.();
          return;
        }
        this.isLoading.set(true);
        const placeholder = {
          id: Date.now(),
          role: 'planner-context',
          content: text,
          created_at: new Date().toISOString(),
        };
        this.messages.update((msgs) => [...msgs, placeholder]);
        setTimeout(() => this.scrollToBottom(), 50);
        this.authService.sendMessage(conv.id, text, 'planner-context').subscribe({
          next: (response: any) => {
            this.messages.update((msgs) => [
              ...msgs.filter((m) => m.id !== placeholder.id),
              response.userMessage,
              response.assistantMessage,
            ]);
            this.isLoading.set(false);
            setTimeout(() => this.scrollToBottom(), 100);
            onComplete?.();
          },
          error: () => {
            this.messages.update((msgs) => msgs.filter((m) => m.id !== placeholder.id));
            this.isLoading.set(false);
            onComplete?.();
          },
        });
      },
    });
  }

  discardProposedTask(index: number) {
    this.proposedTasks.update((tasks) => tasks.filter((_, i) => i !== index));
  }

  clearProposedTime(task: { start_time: string | null; end_time: string | null }) {
    task.start_time = null;
    task.end_time = null;
    this.proposedTasks.update((t) => [...t]);
  }

  autoProposedEndTime(task: { start_time: string | null; end_time: string | null }) {
    if (!task.start_time) return;
    const [h, m] = task.start_time.split(':').map(Number);
    const end = new Date(2000, 0, 1, h + 1, m);
    task.end_time = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    this.proposedTasks.update((t) => [...t]);
  }

  confirmProposedTasks() {
    const tasks = this.proposedTasks();
    if (!tasks.length) {
      this.proposedTasksOpen.set(false);
      return;
    }
    let remaining = tasks.length;
    for (const task of tasks) {
      const isTimed = !!(task.day && task.start_time && task.end_time);
      this.plannerService
        .createTask({
          title: task.title.trim(),
          day: task.day || null,
          is_timed: isTimed,
          start_time: isTimed ? task.start_time : null,
          end_time: isTimed ? task.end_time : null,
        })
        .subscribe({
          next: () => {
            if (--remaining === 0) {
              this.proposedTasksOpen.set(false);
              this.tasksCreated.emit();
            }
          },
          error: () => {
            if (--remaining === 0) this.proposedTasksOpen.set(false);
          },
        });
    }
    this.proposedTasks.set([]);
  }

  cancelProposedTasks() {
    this.proposedTasksOpen.set(false);
    this.proposedTasks.set([]);
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(this.toUtcIso(dateStr));
    if (isNaN(date.getTime())) return '';
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  private parseSeed(content: string): {
    appliedAt: string | null;
    generatedAt: string | null;
    body: string;
  } {
    const lines = content.split('\n');
    let appliedAt: string | null = null;
    let generatedAt: string | null = null;
    let i = 0;
    for (; i < lines.length; i++) {
      const am = lines[i].match(/^\[Seed applied to conversation: ([^\]]+)\]/);
      const gm = lines[i].match(/^\[Seed generated: ([^\]]+)\]/);
      if (am) {
        appliedAt = am[1].replace(/\s*\(current date\/time\)\s*$/, '').trim();
        continue;
      }
      if (gm) {
        generatedAt = gm[1].trim();
        continue;
      }
      if (lines[i].trim() === '' && (appliedAt !== null || generatedAt !== null)) continue;
      if (lines[i].match(/^\[.+\]$/) && (appliedAt !== null || generatedAt !== null)) continue;
      break;
    }
    return { appliedAt, generatedAt, body: lines.slice(i).join('\n').trimStart() };
  }

  extractSeedAppliedAt(content: string): string | null {
    return this.parseSeed(content).appliedAt;
  }
  extractSeedGeneratedAt(content: string): string | null {
    return this.parseSeed(content).generatedAt;
  }
  extractSeedBody(content: string): string {
    return this.parseSeed(content).body;
  }

  extractIntentText(content: string): string {
    const m = content.match(/^\[Session Intent\]: ([\s\S]*?)(?:\n\nIf the conversation drifts|$)/);
    return (m ? m[1] : content).trim();
  }

  formatSeedTimestamp(raw: string): string {
    const legacy = raw.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) UTC$/);
    const isoStr = legacy ? `${legacy[1]}T${legacy[2]}Z` : this.toUtcIso(raw);
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return raw;
    return (
      date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }

  private toUtcIso(dateStr: string): string {
    if (dateStr.endsWith('Z') || dateStr.includes('+')) return dateStr;
    return dateStr.replace(' ', 'T') + 'Z';
  }
}
