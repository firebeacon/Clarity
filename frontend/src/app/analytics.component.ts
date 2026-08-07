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

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { NavHeaderComponent } from './nav-header.component';
import { AuditComponent } from './audit.component';

interface ConvData {
  id: number;
  created_at: string;
  userWordCount: number;
  exchangeCount: number;
}

interface Analytics {
  total: number;
  perDay: string;
  perWeek: string;
  perMonth: string;
  avgWords: number;
  lengthTrend: string;
  exchangesTrend: string;
  freqTrend: string;
  totalWords: number;
  totalWordsLabel: string;
  wordsPoints: string;
  wordsDots: { cx: number; cy: number }[];
  wordsMax: number;
  wordsXLabels: [string, string];
  exchangesPoints: string;
  exchangesDots: { cx: number; cy: number }[];
  exchangesMax: number;
  exchangesXLabels: [string, string];
  gapsPoints: string;
  gapsDots: { cx: number; cy: number }[];
  gapsMax: number;
  gapsXLabels: [string, string];
  cumulWordsPoints: string;
  cumulWordsDots: { cx: number; cy: number }[];
  cumulWordsMax: number;
  cumulWordsXLabels: [string, string];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, NavHeaderComponent, AuditComponent],
  template: `
    <div class="fixed inset-0 bg-gray-900 flex flex-col">
      <app-nav-header title="Analytics" />
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <div
          class="hidden sm:flex w-80 bg-gray-800 border-r border-gray-700 flex-col items-center pt-8 shrink-0 px-6"
        >
          <img src="Analytics.png" alt="Analytics" class="w-[138px] h-[138px]" />
          <div class="mt-8 text-center">
            <p class="text-gray-500 text-sm mb-2">Don't know what to do?</p>
            <a
              routerLink="/getting-started"
              class="text-violet-400 hover:text-violet-300 text-sm cursor-pointer transition-colors"
              >Check out Getting Started</a
            >
          </div>
        </div>

        <!-- Main content -->
        <div class="flex-1 overflow-y-auto p-8">
          @if (isLoading()) {
            <div class="flex items-center justify-center h-full text-gray-500 text-sm">
              Loading...
            </div>
          } @else if (!stats()) {
            <div class="flex items-center justify-center h-full text-gray-500 text-sm">
              No conversation data yet.
            </div>
          } @else if (stats(); as s) {
            <!-- Stat row -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <!-- Words -->
              <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-gray-400 text-xs uppercase tracking-widest mb-2">Words Typed</div>
                <div class="text-3xl font-bold text-gray-100 mb-2">{{ s.totalWordsLabel }}</div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Avg / conversation</span>
                    <span class="text-gray-200 tabular-nums">{{ s.avgWords }}</span>
                  </div>
                </div>
              </div>

              <!-- Conversations -->
              <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-gray-400 text-xs uppercase tracking-widest mb-2">
                  Conversations
                </div>
                <div class="text-3xl font-bold text-gray-100 mb-2">{{ s.total }}</div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Per day</span>
                    <span class="text-gray-200 tabular-nums">{{ s.perDay }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Per week</span>
                    <span class="text-gray-200 tabular-nums">{{ s.perWeek }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Per month</span>
                    <span class="text-gray-200 tabular-nums">{{ s.perMonth }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paired trend + chart rows -->
            <div class="space-y-4 mb-4">
              <!-- Conversation length -->
              <div
                class="bg-gray-800 rounded-lg border border-gray-700 flex flex-col sm:grid sm:grid-cols-[200px_1fr] overflow-hidden"
              >
                <div
                  class="p-4 border-b sm:border-b-0 sm:border-r border-gray-700 flex flex-col justify-center gap-1"
                >
                  <div class="text-gray-400 text-xs uppercase tracking-widest">
                    Conversation length
                  </div>
                  @if (s.lengthTrend === 'increasing') {
                    <div class="text-red-400 text-sm font-medium">↑ Getting longer</div>
                  } @else if (s.lengthTrend === 'decreasing') {
                    <div class="text-green-400 text-sm font-medium">↓ Getting shorter</div>
                  } @else if (s.lengthTrend === 'neutral') {
                    <div class="text-gray-500 text-sm">— Not enough data</div>
                  } @else {
                    <div class="text-gray-400 text-sm">→ Stable</div>
                  }
                </div>
                <div class="p-3">
                  <svg viewBox="0 0 600 65" class="w-full">
                    <line x1="40" y1="4" x2="40" y2="48" stroke="#374151" stroke-width="1" />
                    <line x1="40" y1="48" x2="590" y2="48" stroke="#374151" stroke-width="1" />
                    <text x="35" y="8" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      {{ s.wordsMax }}
                    </text>
                    <text x="35" y="51" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      0
                    </text>
                    <text x="40" y="62" text-anchor="start" fill="#6b7280" style="font-size: 9px">
                      {{ s.wordsXLabels[0] }}
                    </text>
                    <text x="590" y="62" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      {{ s.wordsXLabels[1] }}
                    </text>
                    @if (s.wordsPoints) {
                      <polyline
                        [attr.points]="s.wordsPoints"
                        fill="none"
                        stroke="#10b981"
                        stroke-width="2"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                      />
                      @for (dot of s.wordsDots; track $index) {
                        <circle [attr.cx]="dot.cx" [attr.cy]="dot.cy" r="3" fill="#10b981" />
                      }
                    }
                  </svg>
                </div>
              </div>

              <!-- Exchanges per conversation -->
              <div
                class="bg-gray-800 rounded-lg border border-gray-700 flex flex-col sm:grid sm:grid-cols-[200px_1fr] overflow-hidden"
              >
                <div
                  class="p-4 border-b sm:border-b-0 sm:border-r border-gray-700 flex flex-col justify-center gap-1"
                >
                  <div class="text-gray-400 text-xs uppercase tracking-widest">
                    Exchanges per conversation
                  </div>
                  @if (s.exchangesTrend === 'increasing') {
                    <div class="text-red-400 text-sm font-medium">↑ Getting longer</div>
                  } @else if (s.exchangesTrend === 'decreasing') {
                    <div class="text-green-400 text-sm font-medium">↓ Getting shorter</div>
                  } @else if (s.exchangesTrend === 'neutral') {
                    <div class="text-gray-500 text-sm">— Not enough data</div>
                  } @else {
                    <div class="text-gray-400 text-sm">→ Stable</div>
                  }
                </div>
                <div class="p-3">
                  <svg viewBox="0 0 600 65" class="w-full">
                    <line x1="40" y1="4" x2="40" y2="48" stroke="#374151" stroke-width="1" />
                    <line x1="40" y1="48" x2="590" y2="48" stroke="#374151" stroke-width="1" />
                    <text x="35" y="8" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      {{ s.exchangesMax }}
                    </text>
                    <text x="35" y="51" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      0
                    </text>
                    <text x="40" y="62" text-anchor="start" fill="#6b7280" style="font-size: 9px">
                      {{ s.exchangesXLabels[0] }}
                    </text>
                    <text x="590" y="62" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      {{ s.exchangesXLabels[1] }}
                    </text>
                    @if (s.exchangesPoints) {
                      <polyline
                        [attr.points]="s.exchangesPoints"
                        fill="none"
                        stroke="#f59e0b"
                        stroke-width="2"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                      />
                      @for (dot of s.exchangesDots; track $index) {
                        <circle [attr.cx]="dot.cx" [attr.cy]="dot.cy" r="3" fill="#f59e0b" />
                      }
                    }
                  </svg>
                </div>
              </div>

              <!-- Conversation frequency -->
              <div
                class="bg-gray-800 rounded-lg border border-gray-700 flex flex-col sm:grid sm:grid-cols-[200px_1fr] overflow-hidden"
              >
                <div
                  class="p-4 border-b sm:border-b-0 sm:border-r border-gray-700 flex flex-col justify-center gap-1"
                >
                  <div class="text-gray-400 text-xs uppercase tracking-widest">
                    Conversation frequency
                  </div>
                  @if (s.freqTrend === 'increasing') {
                    <div class="text-red-400 text-sm font-medium">↑ Frequency rising</div>
                  } @else if (s.freqTrend === 'decreasing') {
                    <div class="text-green-400 text-sm font-medium">↓ Frequency falling</div>
                  } @else if (s.freqTrend === 'neutral') {
                    <div class="text-gray-500 text-sm">— Not enough data</div>
                  } @else {
                    <div class="text-gray-400 text-sm">→ Stable</div>
                  }
                </div>
                <div class="p-3">
                  <svg viewBox="0 0 600 65" class="w-full">
                    <line x1="40" y1="4" x2="40" y2="48" stroke="#374151" stroke-width="1" />
                    <line x1="40" y1="48" x2="590" y2="48" stroke="#374151" stroke-width="1" />
                    <text x="35" y="8" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      {{ s.gapsMax }}
                    </text>
                    <text x="35" y="51" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      0
                    </text>
                    <text x="40" y="62" text-anchor="start" fill="#6b7280" style="font-size: 9px">
                      {{ s.gapsXLabels[0] }}
                    </text>
                    <text x="590" y="62" text-anchor="end" fill="#6b7280" style="font-size: 9px">
                      {{ s.gapsXLabels[1] }}
                    </text>
                    @if (s.gapsPoints) {
                      <polyline
                        [attr.points]="s.gapsPoints"
                        fill="none"
                        stroke="#a78bfa"
                        stroke-width="2"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                      />
                      @for (dot of s.gapsDots; track $index) {
                        <circle [attr.cx]="dot.cx" [attr.cy]="dot.cy" r="3" fill="#a78bfa" />
                      }
                    } @else {
                      <text
                        x="315"
                        y="28"
                        text-anchor="middle"
                        fill="#4b5563"
                        style="font-size: 9px"
                      >
                        Not enough data
                      </text>
                    }
                  </svg>
                </div>
              </div>
            </div>

            <!-- Latest audit results -->
            @if (latestAudit()) {
              <div class="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="text-gray-400 text-xs uppercase tracking-widest">
                    Latest Self Audit
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-gray-600 text-xs">{{
                      formatAuditDate(latestAudit()!.completed_at)
                    }}</span>
                    <button
                      (click)="showVoluntaryAudit.set(true)"
                      class="text-xs text-violet-400 hover:text-violet-300 cursor-pointer transition-colors"
                    >
                      Take new audit
                    </button>
                  </div>
                </div>
                @if (latestAudit()!.analytics_seed) {
                  <p
                    class="text-gray-300 text-sm leading-relaxed mb-4 border-l-2 border-violet-700 pl-3"
                  >
                    {{ latestAudit()!.analytics_seed }}
                  </p>
                }
                @if (groupedAnswers(); as g) {
                  <div class="space-y-2">
                    @if (g.general.length) {
                      <div class="border border-gray-700 rounded-lg overflow-hidden">
                        <button
                          (click)="toggleGroup('general')"
                          class="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-700 cursor-pointer transition-colors text-left"
                        >
                          <span class="text-gray-400 text-xs uppercase tracking-widest"
                            >General</span
                          >
                          <span class="text-gray-600 text-xs">{{
                            isExpanded('general') ? '▲' : '▼'
                          }}</span>
                        </button>
                        @if (isExpanded('general')) {
                          <div class="border-t border-gray-700 divide-y divide-gray-700/50">
                            @for (answer of g.general; track answer.id) {
                              <div class="px-3 py-2.5">
                                <div class="text-gray-500 text-xs mb-1">
                                  {{ answer.question_text }}
                                </div>
                                @if (answer.answer_type === 'scale') {
                                  <div class="text-gray-300 text-sm">
                                    {{ answer.answer_scale }}/5
                                  </div>
                                } @else {
                                  <div class="text-gray-300 text-sm">
                                    {{ answer.answer_text || '—' }}
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                    @for (goalGroup of g.goals; track goalGroup.goalId) {
                      <div class="border border-gray-700 rounded-lg overflow-hidden">
                        <button
                          (click)="toggleGroup('goal_' + goalGroup.goalId)"
                          class="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-700 cursor-pointer transition-colors text-left"
                        >
                          <span class="text-violet-400 text-sm font-medium">{{
                            goalGroup.goalContent
                          }}</span>
                          <span class="text-gray-600 text-xs flex-shrink-0 ml-2">{{
                            isExpanded('goal_' + goalGroup.goalId) ? '▲' : '▼'
                          }}</span>
                        </button>
                        @if (isExpanded('goal_' + goalGroup.goalId)) {
                          <div class="border-t border-gray-700 divide-y divide-gray-700/50">
                            @for (answer of goalGroup.answers; track answer.id) {
                              <div class="px-3 py-2.5">
                                <div class="text-gray-500 text-xs mb-1">
                                  {{ answer.question_text }}
                                </div>
                                @if (answer.answer_type === 'scale') {
                                  <div class="text-gray-300 text-sm">
                                    {{ answer.answer_scale }}/5
                                  </div>
                                } @else {
                                  <div class="text-gray-300 text-sm">
                                    {{ answer.answer_text || '—' }}
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            } @else if (!auditLoading() && auditConfigured()) {
              <div
                class="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4 flex items-center justify-between"
              >
                <div>
                  <div class="text-gray-400 text-xs uppercase tracking-widest mb-1">Self Audit</div>
                  <p class="text-gray-500 text-sm">No audit completed yet.</p>
                </div>
                <button
                  (click)="startVoluntaryAudit()"
                  class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm cursor-pointer transition-colors"
                >
                  Take audit
                </button>
              </div>
            }

            <!-- Total Words Over Time -->
            <!-- <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div class="text-gray-400 text-xs uppercase tracking-widest mb-2">Total Words Over Time</div>
              <svg viewBox="0 0 600 65" class="w-full">
                <line x1="40" y1="4" x2="40" y2="48" stroke="#374151" stroke-width="1"/>
                <line x1="40" y1="48" x2="590" y2="48" stroke="#374151" stroke-width="1"/>
                <text x="35" y="8" text-anchor="end" fill="#6b7280" style="font-size: 9px">{{ s.cumulWordsMax }}</text>
                <text x="35" y="51" text-anchor="end" fill="#6b7280" style="font-size: 9px">0</text>
                <text x="40" y="62" text-anchor="start" fill="#6b7280" style="font-size: 9px">{{ s.cumulWordsXLabels[0] }}</text>
                <text x="590" y="62" text-anchor="end" fill="#6b7280" style="font-size: 9px">{{ s.cumulWordsXLabels[1] }}</text>
                @if (s.cumulWordsPoints) {
                  <polyline [attr.points]="s.cumulWordsPoints" fill="none" stroke="#f87171" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
                  @for (dot of s.cumulWordsDots; track $index) {
                    <circle [attr.cx]="dot.cx" [attr.cy]="dot.cy" r="3" fill="#f87171"/>
                  }
                }
              </svg>
            </div>-->
          }
        </div>
      </div>
    </div>

    @if (showVoluntaryAudit()) {
      <app-audit
        [forced]="false"
        (onDone)="onVoluntaryAuditDone()"
        (onCancel)="showVoluntaryAudit.set(false)"
      />
    }
  `,
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private auditSub?: Subscription;

  isLoading = signal(true);
  stats = signal<Analytics | null>(null);

  latestAudit = signal<any>(null);
  auditLoading = signal(true);
  auditConfigured = signal(false);
  showVoluntaryAudit = signal(false);
  expandedGroups = signal<Set<string>>(new Set());

  groupedAnswers = computed(() => {
    const audit = this.latestAudit();
    if (!audit) return null;
    const answers: any[] = audit.answers || [];
    const general = answers.filter((a: any) => a.question_type === 'general');
    const goalAnswers = answers.filter((a: any) => a.question_type === 'goal');
    const goalMap = new Map<number, { goalId: number; goalContent: string; answers: any[] }>();
    for (const a of goalAnswers) {
      if (!goalMap.has(a.goal_id)) {
        goalMap.set(a.goal_id, {
          goalId: a.goal_id,
          goalContent: a.goal_content || `Goal ${a.goal_id}`,
          answers: [],
        });
      }
      goalMap.get(a.goal_id)!.answers.push(a);
    }
    return { general, goals: Array.from(goalMap.values()) };
  });

  toggleGroup(key: string) {
    const s = new Set(this.expandedGroups());
    if (s.has(key)) s.delete(key);
    else s.add(key);
    this.expandedGroups.set(s);
  }

  isExpanded(key: string): boolean {
    return this.expandedGroups().has(key);
  }

  ngOnInit() {
    this.authService.getAnalytics().subscribe({
      next: (data) => {
        const convs: ConvData[] = (data.conversations || []).sort(
          (a: ConvData, b: ConvData) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        this.stats.set(convs.length ? this.compute(convs) : null);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
    this.loadAudit();
    this.auditSub = this.authService.auditSubmitted$.subscribe(() => this.loadAudit());
  }

  ngOnDestroy() {
    this.auditSub?.unsubscribe();
  }

  loadAudit() {
    this.auditLoading.set(true);
    this.authService.getLatestAudit().subscribe({
      next: (audit) => {
        this.latestAudit.set(audit);
        this.auditLoading.set(false);
      },
      error: () => {
        this.auditLoading.set(false);
      },
    });
    this.authService.getAuditDue().subscribe({
      next: (data) => {
        if (data.due !== undefined) this.auditConfigured.set(true);
      },
      error: () => {},
    });
  }

  startVoluntaryAudit() {
    this.showVoluntaryAudit.set(true);
  }

  onVoluntaryAuditDone() {
    this.showVoluntaryAudit.set(false);
    this.loadAudit();
  }

  formatAuditDate(dateStr: string): string {
    const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private compute(convs: ConvData[]): Analytics {
    const total = convs.length;

    const tz = (s: string) => s + (s.endsWith('Z') ? '' : 'Z');
    const times = convs.map((c) => new Date(tz(c.created_at)).getTime());
    const daySpan =
      total < 2 ? 1 : Math.max((Math.max(...times) - Math.min(...times)) / 86_400_000, 1);

    const fmt = (n: number) => (n < 10 ? n.toFixed(1) : Math.round(n).toString());

    // Avg words per conversation
    const withWords = convs.filter((c) => c.userWordCount > 0);
    const avgWords = withWords.length
      ? Math.round(withWords.reduce((s, c) => s + c.userWordCount, 0) / withWords.length)
      : 0;

    // Total words
    const totalWords = convs.reduce((s, c) => s + c.userWordCount, 0);
    const totalWordsLabel =
      totalWords >= 10000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords.toLocaleString();

    // Daily conversation frequency bins
    const dateCounts = new Map<string, number>();
    convs.forEach((c) => {
      const key = new Date(tz(c.created_at)).toISOString().slice(0, 10);
      dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
    });
    const dateEntries = Array.from(dateCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const freqVals = dateEntries.map(([, n]) => n);
    // Cumulative words
    let cumul = 0;
    const cumulWords = convs.map((c) => {
      cumul += c.userWordCount;
      return cumul;
    });

    // Trend analysis
    const slope = (vals: number[]) => {
      const n = vals.length;
      if (n < 2) return 0;
      const mx = (n - 1) / 2,
        my = vals.reduce((a, b) => a + b, 0) / n;
      let num = 0,
        den = 0;
      vals.forEach((y, x) => {
        num += (x - mx) * (y - my);
        den += (x - mx) ** 2;
      });
      return den === 0 ? 0 : num / den;
    };

    const last3 = convs.slice(-3);
    const prior3 = convs.slice(-6, -3);
    let lengthTrend: string;
    if (convs.length < 4 || prior3.length === 0) {
      lengthTrend = 'neutral';
    } else {
      const avg = (arr: ConvData[]) => arr.reduce((s, c) => s + c.userWordCount, 0) / arr.length;
      const recentAvg = avg(last3);
      const priorAvg = avg(prior3);
      const diff = recentAvg - priorAvg;
      const threshold = Math.max(priorAvg * 0.1, 5);
      lengthTrend = diff > threshold ? 'increasing' : diff < -threshold ? 'decreasing' : 'stable';
    }

    const es = slope(last3.map((c: ConvData) => c.exchangeCount));
    const exchangesTrend =
      last3.length < 3 ? 'neutral' : es > 0.2 ? 'increasing' : es < -0.2 ? 'decreasing' : 'stable';

    const fs = slope(freqVals.slice(-10));
    const freqTrend =
      freqVals.length < 3
        ? 'neutral'
        : fs > 0.1
          ? 'increasing'
          : fs < -0.1
            ? 'decreasing'
            : 'stable';

    // Chart helpers
    const toPolyline = (vals: number[], maxVal: number): string => {
      const n = vals.length,
        max = Math.max(maxVal, 1);
      return vals
        .map((v, i) => {
          const x = 40 + (n === 1 ? 275 : (i / (n - 1)) * 550);
          const y = 48 - (v / max) * 44;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    };
    const toDots = (vals: number[], maxVal: number) => {
      const n = vals.length,
        max = Math.max(maxVal, 1);
      return vals.map((v, i) => ({
        cx: parseFloat((40 + (n === 1 ? 275 : (i / (n - 1)) * 550)).toFixed(1)),
        cy: parseFloat((48 - (v / max) * 44).toFixed(1)),
      }));
    };
    const shortDate = (s: string) =>
      new Date(tz(s)).toLocaleDateString([], { month: 'short', day: 'numeric' });

    const wordsVals = convs.map((c) => c.userWordCount);
    const wordsMax = wordsVals.length ? Math.max(...wordsVals) : 0;
    const exchangesVals = convs.map((c) => c.exchangeCount);
    const exchangesMax = exchangesVals.length ? Math.max(...exchangesVals) : 0;
    const gapsMax = freqVals.length ? Math.max(...freqVals) : 0;
    const cumulWordsMax = cumulWords.length ? Math.max(...cumulWords) : 0;

    return {
      total,
      perDay: fmt(total / daySpan),
      perWeek: fmt(total / Math.max(daySpan / 7, 1)),
      perMonth: fmt(total / Math.max(daySpan / 30, 1)),
      avgWords,
      lengthTrend,
      exchangesTrend,
      freqTrend,
      totalWords,
      totalWordsLabel,
      wordsPoints: convs.length ? toPolyline(wordsVals, wordsMax) : '',
      wordsDots: convs.length ? toDots(wordsVals, wordsMax) : [],
      wordsMax,
      wordsXLabels: convs.length
        ? [shortDate(convs[0].created_at), shortDate(convs[convs.length - 1].created_at)]
        : ['', ''],
      exchangesPoints: convs.length ? toPolyline(exchangesVals, exchangesMax) : '',
      exchangesDots: convs.length ? toDots(exchangesVals, exchangesMax) : [],
      exchangesMax,
      exchangesXLabels: convs.length
        ? [shortDate(convs[0].created_at), shortDate(convs[convs.length - 1].created_at)]
        : ['', ''],
      gapsPoints: freqVals.length > 1 ? toPolyline(freqVals, gapsMax) : '',
      gapsDots: freqVals.length > 1 ? toDots(freqVals, gapsMax) : [],
      gapsMax,
      gapsXLabels:
        dateEntries.length >= 2
          ? [
              shortDate(dateEntries[0][0] + 'T12:00:00'),
              shortDate(dateEntries[dateEntries.length - 1][0] + 'T12:00:00'),
            ]
          : ['', ''],
      cumulWordsPoints: convs.length ? toPolyline(cumulWords, cumulWordsMax) : '',
      cumulWordsDots: convs.length ? toDots(cumulWords, cumulWordsMax) : [],
      cumulWordsMax,
      cumulWordsXLabels: convs.length
        ? [shortDate(convs[0].created_at), shortDate(convs[convs.length - 1].created_at)]
        : ['', ''],
    };
  }
}
