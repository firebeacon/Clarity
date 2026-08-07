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

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

const PHASE_NAMES: Record<number, string> = {
  1: 'New User',
  2: 'Goals Set',
  3: 'Constraints Refined',
  4: 'Clarification in Progress',
  5: 'Clarified',
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #374151;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #6b7280;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #6b7280 #374151;
      }
    `,
  ],
  template: `
    <div class="fixed inset-0 flex flex-col bg-gray-900">
      <!-- Nav bar -->
      <div
        class="flex items-center gap-4 px-6 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0"
      >
        <div class="flex flex-col leading-tight">
          <span class="text-gray-100 font-semibold">Clarity</span>
          <span class="text-gray-500 text-xs">Admin</span>
        </div>
        <div class="ml-auto flex items-center gap-3">
          <button
            (click)="logout()"
            class="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700 text-gray-400 hover:text-red-400 hover:bg-gray-600 transition-all cursor-pointer"
            title="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Body: sidebar + content -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <div class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
          <nav class="p-3 flex flex-col gap-1">
            <button
              (click)="activeTab = 'users'"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              [class.bg-gray-700]="activeTab === 'users'"
              [class.text-gray-100]="activeTab === 'users'"
              [class.text-gray-400]="activeTab !== 'users'"
              [class.hover:bg-gray-700]="activeTab !== 'users'"
            >
              User Management
            </button>
            <button
              (click)="activeTab = 'audit'; loadAuditSets()"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              [class.bg-gray-700]="activeTab === 'audit'"
              [class.text-gray-100]="activeTab === 'audit'"
              [class.text-gray-400]="activeTab !== 'audit'"
              [class.hover:bg-gray-700]="activeTab !== 'audit'"
            >
              Self Audit
            </button>
            <button
              (click)="activeTab = 'tiers'; loadTiers()"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              [class.bg-gray-700]="activeTab === 'tiers'"
              [class.text-gray-100]="activeTab === 'tiers'"
              [class.text-gray-400]="activeTab !== 'tiers'"
              [class.hover:bg-gray-700]="activeTab !== 'tiers'"
            >
              Account Tiers
            </button>
            <button
              (click)="activeTab = 'invites'; loadInviteTokens()"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              [class.bg-gray-700]="activeTab === 'invites'"
              [class.text-gray-100]="activeTab === 'invites'"
              [class.text-gray-400]="activeTab !== 'invites'"
              [class.hover:bg-gray-700]="activeTab !== 'invites'"
            >
              Invite Tokens
            </button>
            <button
              (click)="activeTab = 'account'; pwError.set(''); pwSuccess.set('')"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              [class.bg-gray-700]="activeTab === 'account'"
              [class.text-gray-100]="activeTab === 'account'"
              [class.text-gray-400]="activeTab !== 'account'"
              [class.hover:bg-gray-700]="activeTab !== 'account'"
            >
              Account
            </button>
          </nav>
        </div>

        <!-- Main content -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
          @if (error()) {
            <div
              class="mb-4 px-4 py-2 bg-red-900/40 border border-red-700 rounded text-red-400 text-sm"
            >
              {{ error() }}
            </div>
          }

          <!-- ── Users tab ── -->
          @if (activeTab === 'users') {
            <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr
                    class="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider"
                  >
                    <th class="text-left px-4 py-3">ID</th>
                    <th class="text-left px-4 py-3">Email</th>
                    <th class="text-left px-4 py-3">Phase</th>
                    <th class="text-left px-4 py-3">Tier</th>
                    <th class="text-left px-4 py-3">Remaining</th>
                    <th class="text-left px-4 py-3">Created</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users(); track user.id) {
                    <tr class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td class="px-4 py-3 text-gray-500">{{ user.id }}</td>

                      <!-- Email -->
                      <td class="px-4 py-3 text-gray-100">
                        @if (editingId() === user.id) {
                          <input
                            [(ngModel)]="editEmail"
                            class="bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-blue-500 w-full"
                          />
                        } @else {
                          {{ user.email }}
                        }
                      </td>

                      <!-- Phase -->
                      <td class="px-4 py-3">
                        @if (editingId() === user.id) {
                          <select
                            [(ngModel)]="editPhase"
                            class="bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                          >
                            @for (phase of phases; track phase.value) {
                              <option [value]="phase.value">
                                {{ phase.value }}: {{ phase.label }}
                              </option>
                            }
                          </select>
                        } @else {
                          <span class="text-gray-400"
                            >{{ user.phase }}: {{ phaseName(user.phase) }}</span
                          >
                        }
                      </td>

                      <!-- Tier -->
                      <td class="px-4 py-3">
                        @if (editingId() === user.id) {
                          <select
                            [(ngModel)]="editAccountType"
                            class="bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                          >
                            @for (t of accountTypes; track t) {
                              <option [value]="t">{{ t }}</option>
                            }
                          </select>
                        } @else {
                          <span class="text-gray-400">{{ user.account_type ?? 'free' }}</span>
                        }
                      </td>

                      <!-- Remaining -->
                      <td class="px-4 py-3">
                        @if (editingId() === user.id) {
                          <input
                            type="number"
                            [(ngModel)]="editMessagesRemaining"
                            min="0"
                            class="bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-blue-500 w-20"
                          />
                        } @else {
                          <span class="text-gray-400">{{ user.messages_remaining ?? '—' }}</span>
                        }
                      </td>

                      <td class="px-4 py-3 text-gray-500">{{ formatDate(user.created_at) }}</td>

                      <!-- Actions -->
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2 justify-end">
                          @if (editingId() === user.id) {
                            <button
                              (click)="saveEdit(user.id)"
                              class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                            <button
                              (click)="cancelEdit()"
                              class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          } @else {
                            <button
                              (click)="startEdit(user)"
                              class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              (click)="openAuditConfigModal(user)"
                              class="px-3 py-1 bg-violet-900/60 hover:bg-violet-700 text-violet-400 hover:text-white rounded text-xs cursor-pointer transition-colors"
                            >
                              Audit
                            </button>
                            <button
                              (click)="openResetModal(user)"
                              class="px-3 py-1 bg-orange-900/60 hover:bg-orange-700 text-orange-400 hover:text-white rounded text-xs cursor-pointer transition-colors"
                            >
                              Reset
                            </button>
                            @if (confirmDeleteId() === user.id) {
                              <span class="text-gray-400 text-xs">Delete?</span>
                              <button
                                (click)="confirmDelete(user.id)"
                                class="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs cursor-pointer transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                (click)="cancelDelete()"
                                class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer transition-colors"
                              >
                                No
                              </button>
                            } @else {
                              <button
                                (click)="requestDelete(user.id)"
                                class="px-3 py-1 bg-red-900/60 hover:bg-red-700 text-red-400 hover:text-white rounded text-xs cursor-pointer transition-colors"
                              >
                                Delete
                              </button>
                            }
                          }
                        </div>
                      </td>
                    </tr>
                  }
                  @if (users().length === 0 && !loading()) {
                    <tr>
                      <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  }
                  @if (loading()) {
                    <tr>
                      <td colspan="7" class="px-4 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- ── Self Audit tab ── -->
          @if (activeTab === 'audit') {
            <!-- Create new set -->
            <div class="mb-6 bg-gray-800 rounded-xl border border-gray-700 p-4">
              <h2 class="text-gray-100 text-sm font-semibold mb-3">Create Question Set</h2>
              <div class="flex gap-2">
                <input
                  [(ngModel)]="newSetName"
                  placeholder="Set name..."
                  class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm"
                />
                <button
                  (click)="createSet()"
                  [disabled]="!newSetName.trim()"
                  class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm transition-colors"
                  [class.cursor-pointer]="newSetName.trim()"
                  [class.cursor-default]="!newSetName.trim()"
                  [class.opacity-40]="!newSetName.trim()"
                >
                  Create
                </button>
              </div>
            </div>

            <!-- Existing sets -->
            @if (auditSetsLoading()) {
              <div class="text-gray-500 text-sm text-center py-8">Loading...</div>
            } @else if (auditSets().length === 0) {
              <div class="text-gray-500 text-sm text-center py-8">No question sets yet.</div>
            } @else {
              <div class="space-y-4">
                @for (set of auditSets(); track set.id) {
                  <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <!-- Set header -->
                    <div
                      class="flex items-center justify-between px-4 py-3 border-b border-gray-700"
                    >
                      <span class="text-gray-100 text-sm font-semibold">{{ set.name }}</span>
                      <button
                        (click)="confirmDeleteSet(set.id)"
                        class="text-xs text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                      >
                        Delete set
                      </button>
                    </div>

                    <!-- Questions list -->
                    <div class="p-4">
                      @if (set.questions.length === 0) {
                        <p class="text-gray-600 text-xs mb-3">No questions yet.</p>
                      } @else {
                        <div class="space-y-2 mb-4">
                          @for (q of set.questions; track q.id) {
                            <div class="flex items-start gap-2 bg-gray-700/50 rounded px-3 py-2">
                              <div class="flex-1 min-w-0">
                                <p class="text-gray-200 text-xs">{{ q.text }}</p>
                                <p class="text-gray-500 text-xs mt-0.5">
                                  {{ q.type === 'general' ? 'General' : 'Per goal' }} ·
                                  {{ q.answer_type === 'scale' ? 'Scale 1–5' : 'Free text' }}
                                </p>
                              </div>
                              <button
                                (click)="deleteQuestion(q.id, set.id)"
                                class="text-gray-600 hover:text-red-400 cursor-pointer transition-colors text-xs shrink-0 mt-0.5"
                              >
                                ✕
                              </button>
                            </div>
                          }
                        </div>
                      }

                      <!-- Add question form -->
                      <div class="border border-gray-700 rounded p-3 space-y-2">
                        <p class="text-gray-400 text-xs font-medium mb-2">Add question</p>
                        <textarea
                          [(ngModel)]="newQuestions[set.id].text"
                          placeholder="Question text..."
                          rows="2"
                          class="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 text-xs resize-none"
                        ></textarea>
                        <div class="flex gap-2">
                          <select
                            [(ngModel)]="newQuestions[set.id].type"
                            class="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-gray-300 focus:outline-none focus:border-violet-500 text-xs"
                          >
                            <option value="general">General</option>
                            <option value="goal">Per goal</option>
                          </select>
                          <select
                            [(ngModel)]="newQuestions[set.id].answerType"
                            class="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-gray-300 focus:outline-none focus:border-violet-500 text-xs"
                          >
                            <option value="text">Free text</option>
                            <option value="scale">Scale 1–5</option>
                          </select>
                          <button
                            (click)="addQuestion(set.id)"
                            [disabled]="!newQuestions[set.id]?.text.trim()"
                            class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs transition-colors"
                            [class.cursor-pointer]="newQuestions[set.id]?.text.trim()"
                            [class.cursor-default]="!newQuestions[set.id]?.text.trim()"
                            [class.opacity-40]="!newQuestions[set.id]?.text.trim()"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- ── Invite Tokens tab ── -->
          @if (activeTab === 'invites') {
            <div class="mb-4 flex justify-end">
              <button
                (click)="generateInviteToken()"
                class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm cursor-pointer transition-colors"
              >
                Generate Token
              </button>
            </div>
            <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr
                    class="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider"
                  >
                    <th class="text-left px-4 py-3">Token</th>
                    <th class="text-left px-4 py-3">Created</th>
                    <th class="text-left px-4 py-3">Used by</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of inviteTokens(); track t.id) {
                    <tr class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td class="px-4 py-3 font-mono text-xs text-gray-200">{{ t.token }}</td>
                      <td class="px-4 py-3 text-gray-500 text-xs">
                        {{ formatDate(t.created_at) }}
                      </td>
                      <td class="px-4 py-3 text-xs">
                        @if (t.used_by) {
                          <span class="text-green-400">User #{{ t.used_by }}</span>
                        } @else {
                          <span class="text-gray-600">Unused</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-right">
                        @if (!t.used_by) {
                          <button
                            (click)="removeInviteToken(t.id)"
                            class="text-xs text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                          >
                            Revoke
                          </button>
                        }
                      </td>
                    </tr>
                  }
                  @if (inviteTokens().length === 0) {
                    <tr>
                      <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                        No invite tokens.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- ── Account tab ── -->
          @if (activeTab === 'account') {
            <div class="max-w-sm">
              <h2 class="text-gray-200 font-medium mb-4">Change Password</h2>
              @if (pwError()) {
                <p class="mb-3 text-red-400 text-sm">{{ pwError() }}</p>
              }
              @if (pwSuccess()) {
                <p class="mb-3 text-green-400 text-sm">{{ pwSuccess() }}</p>
              }
              <div class="flex flex-col gap-3">
                <input
                  type="password"
                  [(ngModel)]="pwCurrent"
                  placeholder="Current password"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <input
                  type="password"
                  [(ngModel)]="pwNew"
                  placeholder="New password"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <input
                  type="password"
                  [(ngModel)]="pwConfirm"
                  placeholder="Confirm new password"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  (click)="changePassword()"
                  [disabled]="pwSaving()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                >
                  {{ pwSaving() ? 'Saving…' : 'Update Password' }}
                </button>
              </div>
            </div>
          }

          <!-- ── Tiers tab ── -->
          @if (activeTab === 'tiers') {
            <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr
                    class="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider"
                  >
                    <th class="text-left px-4 py-3">Tier</th>
                    <th class="text-left px-4 py-3">Messages / day</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (tier of tiers(); track tier.type) {
                    <tr class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td class="px-4 py-3 text-gray-100 capitalize">{{ tier.type }}</td>
                      <td class="px-4 py-3">
                        @if (editingTierType() === tier.type) {
                          <input
                            type="number"
                            [(ngModel)]="editTierLimit"
                            min="1"
                            class="bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-blue-500 w-24"
                          />
                        } @else {
                          <span class="text-gray-400">{{ tier.daily_limit }}</span>
                        }
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2 justify-end">
                          @if (editingTierType() === tier.type) {
                            <button
                              (click)="saveTier(tier.type)"
                              class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                            <button
                              (click)="editingTierType.set(null)"
                              class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          } @else {
                            <button
                              (click)="startEditTier(tier)"
                              class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs cursor-pointer transition-colors"
                            >
                              Edit
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Reset data modal -->
    @if (resetModal()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        (click)="closeResetModal()"
      >
        <div
          class="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-red-800/50"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f87171"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-red-400">Reset User Data</h3>
              <p class="text-xs text-gray-500">{{ resetModal()!.email }}</p>
            </div>
          </div>

          <div class="bg-red-950/40 border border-red-800/60 rounded-lg p-4 mb-5">
            <p class="text-sm text-red-300 font-medium mb-2">This action cannot be undone.</p>
            <ul class="text-sm text-red-400/80 space-y-1 list-disc list-inside">
              <li>All conversations and messages will be deleted</li>
              <li>All goals will be deleted</li>
              <li>Phase will be reset to 1 (New User)</li>
            </ul>
          </div>

          <p class="text-sm text-gray-400 mb-2">
            Type <span class="text-gray-200 font-mono">{{ resetModal()!.email }}</span> to confirm:
          </p>
          <input
            [(ngModel)]="resetConfirmEmail"
            placeholder="Type email to confirm"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4 text-sm"
          />

          <div class="flex gap-3 justify-end">
            <button
              (click)="closeResetModal()"
              class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmReset()"
              [disabled]="resetConfirmEmail !== resetModal()!.email || resetting()"
              class="px-4 py-2 bg-red-700 text-white rounded-md text-sm transition-colors"
              [class.cursor-pointer]="resetConfirmEmail === resetModal()!.email && !resetting()"
              [class.hover:bg-red-600]="resetConfirmEmail === resetModal()!.email && !resetting()"
              [class.opacity-40]="resetConfirmEmail !== resetModal()!.email || resetting()"
              [class.cursor-default]="resetConfirmEmail !== resetModal()!.email || resetting()"
            >
              {{ resetting() ? 'Resetting...' : 'Reset Data' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Audit config modal -->
    @if (auditConfigModal()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        (click)="closeAuditConfigModal()"
      >
        <div
          class="bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-gray-700"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-base font-semibold text-gray-100 mb-1">Audit Configuration</h3>
          <p class="text-xs text-gray-500 mb-4">{{ auditConfigModal()!.email }}</p>

          <div class="space-y-3 mb-5">
            <div>
              <label class="block text-xs text-gray-400 mb-1">Question set</label>
              <select
                [(ngModel)]="auditConfigSetId"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none focus:border-violet-500 text-sm"
              >
                <option [value]="0">None (no audit)</option>
                @for (set of auditSets(); track set.id) {
                  <option [value]="set.id">{{ set.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Period (days)</label>
              <input
                type="number"
                [(ngModel)]="auditConfigPeriod"
                min="1"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none focus:border-violet-500 text-sm"
              />
            </div>
          </div>

          <div class="flex gap-3 justify-end">
            <button
              (click)="closeAuditConfigModal()"
              class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="saveAuditConfig()"
              [disabled]="auditConfigSaving()"
              class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm transition-colors"
              [class.cursor-pointer]="!auditConfigSaving()"
              [class.cursor-default]="auditConfigSaving()"
              [class.opacity-40]="auditConfigSaving()"
            >
              {{ auditConfigSaving() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  private auth = inject(AdminAuthService);
  private router = inject(Router);

  users = signal<any[]>([]);
  loading = signal(true);
  error = signal('');
  editingId = signal<number | null>(null);
  editEmail = '';
  editPhase = 1;
  editAccountType = 'free';
  editMessagesRemaining = 0;
  accountTypes = ['free', 'bronze', 'silver', 'gold'];
  confirmDeleteId = signal<number | null>(null);

  tiers = signal<any[]>([]);
  editingTierType = signal<string | null>(null);
  editTierLimit = 0;
  activeTab = 'users';

  resetModal = signal<{ id: number; email: string } | null>(null);
  resetConfirmEmail = '';
  resetting = signal(false);

  // Audit sets
  auditSets = signal<any[]>([]);
  auditSetsLoading = signal(false);
  newSetName = '';
  newQuestions: Record<number, { text: string; type: string; answerType: string }> = {};

  // Audit config modal
  auditConfigModal = signal<{ id: number; email: string } | null>(null);
  auditConfigSetId = 0;
  auditConfigPeriod = 7;
  auditConfigSaving = signal(false);

  phases = Object.entries(PHASE_NAMES).map(([v, label]) => ({ value: Number(v), label }));

  inviteTokens = signal<any[]>([]);

  // Account / password change
  pwCurrent = '';
  pwNew = '';
  pwConfirm = '';
  pwError = signal('');
  pwSuccess = signal('');
  pwSaving = signal(false);

  loadInviteTokens() {
    this.auth.getInviteTokens().subscribe({
      next: (tokens) => this.inviteTokens.set(tokens),
      error: () => this.error.set('Failed to load invite tokens'),
    });
  }

  generateInviteToken() {
    this.auth.createInviteToken().subscribe({
      next: () => this.loadInviteTokens(),
      error: () => this.error.set('Failed to generate invite token'),
    });
  }

  removeInviteToken(id: number) {
    this.auth.deleteInviteToken(id).subscribe({
      next: () => this.inviteTokens.update((tokens) => tokens.filter((t) => t.id !== id)),
      error: () => this.error.set('Failed to revoke invite token'),
    });
  }

  changePassword() {
    this.pwError.set('');
    this.pwSuccess.set('');
    if (!this.pwCurrent) {
      this.pwError.set('Current password is required.');
      return;
    }
    if (this.pwNew.length < 9) {
      this.pwError.set('New password must be at least 9 characters.');
      return;
    }
    if (this.pwNew !== this.pwConfirm) {
      this.pwError.set('Passwords do not match.');
      return;
    }
    this.pwSaving.set(true);
    this.auth.changePassword(this.pwCurrent, this.pwNew).subscribe({
      next: () => {
        this.pwSaving.set(false);
        this.pwCurrent = '';
        this.pwNew = '';
        this.pwConfirm = '';
        this.pwSuccess.set('Password updated successfully.');
      },
      error: (e) => {
        this.pwSaving.set(false);
        this.pwError.set(e?.error?.error || 'Failed to update password.');
      },
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.auth.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users');
        this.loading.set(false);
      },
    });
  }

  loadAuditSets() {
    if (this.auditSetsLoading()) return;
    this.auditSetsLoading.set(true);
    this.auth.getAuditSets().subscribe({
      next: (sets) => {
        this.auditSets.set(sets);
        sets.forEach((s: any) => {
          if (!this.newQuestions[s.id]) {
            this.newQuestions[s.id] = { text: '', type: 'general', answerType: 'text' };
          }
        });
        this.auditSetsLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load audit sets');
        this.auditSetsLoading.set(false);
      },
    });
  }

  createSet() {
    if (!this.newSetName.trim()) return;
    this.auth.createAuditSet(this.newSetName.trim()).subscribe({
      next: (set) => {
        this.newQuestions[set.id] = { text: '', type: 'general', answerType: 'text' };
        this.auditSets.update((sets) => [...sets, set]);
        this.newSetName = '';
      },
      error: () => this.error.set('Failed to create set'),
    });
  }

  confirmDeleteSet(id: number) {
    this.auth.deleteAuditSet(id).subscribe({
      next: () => this.auditSets.update((sets) => sets.filter((s) => s.id !== id)),
      error: () => this.error.set('Failed to delete set'),
    });
  }

  addQuestion(setId: number) {
    const q = this.newQuestions[setId];
    if (!q?.text.trim()) return;
    this.auth.addAuditQuestion(setId, q.type, q.text.trim(), q.answerType).subscribe({
      next: (question) => {
        this.auditSets.update((sets) =>
          sets.map((s) => (s.id === setId ? { ...s, questions: [...s.questions, question] } : s)),
        );
        this.newQuestions[setId] = { text: '', type: 'general', answerType: 'text' };
      },
      error: () => this.error.set('Failed to add question'),
    });
  }

  deleteQuestion(questionId: number, setId: number) {
    this.auth.deleteAuditQuestion(questionId).subscribe({
      next: () => {
        this.auditSets.update((sets) =>
          sets.map((s) =>
            s.id === setId
              ? { ...s, questions: s.questions.filter((q: any) => q.id !== questionId) }
              : s,
          ),
        );
      },
      error: () => this.error.set('Failed to delete question'),
    });
  }

  openAuditConfigModal(user: any) {
    this.auditConfigSetId = 0;
    this.auditConfigPeriod = 7;
    this.auditConfigModal.set({ id: user.id, email: user.email });
    this.editingId.set(null);
    this.confirmDeleteId.set(null);
    if (this.auditSets().length === 0) this.loadAuditSets();
    this.auth.getUserAuditConfig(user.id).subscribe({
      next: (cfg) => {
        if (cfg) {
          this.auditConfigSetId = cfg.set_id ?? 0;
          this.auditConfigPeriod = cfg.period_days ?? 7;
        }
      },
      error: () => {},
    });
  }

  closeAuditConfigModal() {
    this.auditConfigModal.set(null);
  }

  saveAuditConfig() {
    const modal = this.auditConfigModal();
    if (!modal) return;
    this.auditConfigSaving.set(true);
    this.auth
      .setUserAuditConfig(modal.id, this.auditConfigSetId, this.auditConfigPeriod)
      .subscribe({
        next: () => {
          this.auditConfigSaving.set(false);
          this.closeAuditConfigModal();
        },
        error: () => {
          this.error.set('Failed to save audit config');
          this.auditConfigSaving.set(false);
        },
      });
  }

  phaseName(phase: number): string {
    return PHASE_NAMES[phase] ?? 'Unknown';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  startEdit(user: any) {
    this.editingId.set(user.id);
    this.editEmail = user.email;
    this.editPhase = user.phase ?? 1;
    this.editAccountType = user.account_type ?? 'free';
    this.editMessagesRemaining = user.messages_remaining ?? 0;
    this.confirmDeleteId.set(null);
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  saveEdit(id: number) {
    this.auth
      .updateUser(id, {
        email: this.editEmail,
        phase: this.editPhase,
        account_type: this.editAccountType,
        messages_remaining: this.editMessagesRemaining,
      })
      .subscribe({
        next: (updated) => {
          this.users.update((us) => us.map((u) => (u.id === id ? updated : u)));
          this.editingId.set(null);
        },
        error: () => this.error.set('Failed to update user'),
      });
  }

  loadTiers() {
    this.auth.getTiers().subscribe({
      next: (tiers) => this.tiers.set(tiers),
      error: () => this.error.set('Failed to load tiers'),
    });
  }

  startEditTier(tier: any) {
    this.editingTierType.set(tier.type);
    this.editTierLimit = tier.daily_limit;
  }

  saveTier(type: string) {
    this.auth.updateTier(type, this.editTierLimit).subscribe({
      next: (updated) => {
        this.tiers.update((ts) => ts.map((t) => (t.type === type ? updated : t)));
        this.editingTierType.set(null);
      },
      error: () => this.error.set('Failed to update tier'),
    });
  }

  requestDelete(id: number) {
    this.confirmDeleteId.set(id);
    this.editingId.set(null);
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(id: number) {
    this.auth.deleteUser(id).subscribe({
      next: () => {
        this.users.update((us) => us.filter((u) => u.id !== id));
        this.confirmDeleteId.set(null);
      },
      error: () => this.error.set('Failed to delete user'),
    });
  }

  openResetModal(user: any) {
    this.resetConfirmEmail = '';
    this.resetModal.set({ id: user.id, email: user.email });
    this.editingId.set(null);
    this.confirmDeleteId.set(null);
  }

  closeResetModal() {
    this.resetModal.set(null);
    this.resetConfirmEmail = '';
  }

  confirmReset() {
    const modal = this.resetModal();
    if (!modal || this.resetConfirmEmail !== modal.email) return;
    this.resetting.set(true);
    this.auth.resetUserData(modal.id).subscribe({
      next: () => {
        this.users.update((us) => us.map((u) => (u.id === modal.id ? { ...u, phase: 1 } : u)));
        this.resetting.set(false);
        this.closeResetModal();
      },
      error: () => {
        this.error.set('Failed to reset user data');
        this.resetting.set(false);
      },
    });
  }

  logout() {
    localStorage.removeItem('adminToken');
    this.router.navigate(['/admin/login']);
  }
}
