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

import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-workspace-inner-left',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Header -->
      <div
        class="px-3 py-2 flex items-center gap-1.5 shrink-0 bg-teal-900/20 border-b border-gray-700 relative"
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
          class="text-teal-400 shrink-0"
        >
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
        <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex-1"
          >Seed Bank</span
        >
        <button
          (click)="openConsolidateModal()"
          title="Consolidate seeds"
          [disabled]="seeds().length < 2"
          class="text-gray-300 hover:text-teal-300 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 4 12 12" />
            <path d="M19 4 12 12" />
            <path d="M12 12 12 20" />
          </svg>
        </button>
      </div>

      <!-- LIST -->
      <div class="flex-1 overflow-y-auto">
        @if (seeds().length === 0) {
          <p class="text-gray-600 text-xs text-center mt-6 px-4">No seeds saved yet.</p>
        }
        @for (seed of seeds(); track seed.id) {
          <div
            class="group border-b border-gray-800 px-3 py-2 hover:bg-gray-800/60 transition-colors cursor-pointer"
            (click)="openDetail(seed)"
          >
            <p class="text-xs font-medium text-gray-200 truncate mb-1">{{ seed.title }}</p>
            <p class="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
              {{ seed.content }}
            </p>
            <div
              class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              (click)="$event.stopPropagation()"
            >
              <button
                (click)="startConvEmit(seed)"
                class="px-2 py-0.5 text-[10px] bg-gray-700 text-gray-300 rounded hover:bg-gray-600 cursor-pointer transition-colors"
              >
                Start Conv
              </button>
              <button
                (click)="apply.emit(seed)"
                class="px-2 py-0.5 text-[10px] bg-teal-800/60 text-teal-200 rounded hover:bg-teal-700 cursor-pointer transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Seed View/Edit Modal -->
    @if (showSeedModal() && selectedSeed()) {
      <div
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && closeSeedModal()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 w-[600px] max-h-[80vh] flex flex-col shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Title row -->
          <div
            class="px-5 pt-4 pb-3 border-b border-gray-700 shrink-0 flex items-start justify-between gap-3"
          >
            <div class="flex-1 min-w-0">
              @if (editingTitle()) {
                <input
                  [(ngModel)]="editTitleText"
                  (keydown.enter)="saveTitle()"
                  (keydown.escape)="cancelTitle()"
                  (blur)="saveTitle()"
                  class="w-full bg-gray-900 border border-teal-600 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none"
                />
              } @else {
                <p
                  class="text-sm font-semibold text-gray-100 cursor-pointer hover:text-teal-300 transition-colors"
                  title="Click to rename"
                  (click)="startEditTitle()"
                >
                  {{ selectedSeed()!.title }}
                </p>
              }
              <p class="text-[11px] text-gray-600 mt-1">
                {{ formatDate(selectedSeed()!.created_at) }}
              </p>
            </div>
            <button
              (click)="closeSeedModal()"
              class="text-gray-500 hover:text-white cursor-pointer text-lg leading-none shrink-0"
            >
              ✕
            </button>
          </div>

          <!-- Content area -->
          <div class="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            @if (editingContent()) {
              <textarea
                [(ngModel)]="editContentText"
                class="w-full h-full min-h-[300px] bg-gray-900 border border-teal-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none resize-none leading-relaxed"
              ></textarea>
            } @else {
              <p class="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {{ selectedSeed()!.content }}
              </p>
            }
          </div>

          <!-- Action bar -->
          <div class="shrink-0 border-t border-gray-700 px-5 py-3 flex flex-col gap-2">
            @if (confirmingDelete()) {
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">Are you sure?</span>
                <div class="flex gap-1.5">
                  <button
                    (click)="confirmingDelete.set(false)"
                    class="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    (click)="deleteSeed()"
                    class="px-3 py-1 rounded text-xs bg-red-800/60 hover:bg-red-700 text-red-100 cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            } @else if (editingContent()) {
              <div class="flex justify-end gap-1.5">
                <button
                  (click)="cancelContent()"
                  class="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  (click)="saveContent()"
                  class="px-3 py-1 rounded text-xs bg-teal-700/60 hover:bg-teal-700 text-teal-100 cursor-pointer transition-colors"
                >
                  Save
                </button>
              </div>
            } @else {
              <div class="flex gap-1.5 flex-wrap">
                <button
                  (click)="startConvEmit(selectedSeed()!)"
                  class="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                >
                  Start Conv
                </button>
                <button
                  (click)="applyEmit(selectedSeed()!)"
                  class="px-3 py-1 rounded text-xs bg-teal-800/60 hover:bg-teal-700 text-teal-200 cursor-pointer transition-colors"
                >
                  Apply
                </button>
                <button
                  (click)="startEditContent()"
                  class="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                >
                  Edit
                </button>
                <button
                  (click)="compress()"
                  [disabled]="compressing()"
                  class="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default"
                >
                  @if (compressing()) {
                    Compressing…
                  } @else {
                    Compress
                  }
                </button>
                <button
                  (click)="confirmingDelete.set(true)"
                  class="px-3 py-1 rounded text-xs text-gray-600 hover:text-red-400 cursor-pointer transition-colors ml-auto"
                >
                  Delete
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Consolidate picker -->
    @if (showConsolidateModal()) {
      <div
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && showConsolidateModal.set(false)"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 w-[420px] max-h-[70vh] flex flex-col shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <div
            class="px-5 pt-4 pb-3 border-b border-gray-700 shrink-0 flex items-center justify-between"
          >
            <h3 class="text-gray-100 font-semibold text-sm">Select seeds to consolidate</h3>
            <button
              (click)="showConsolidateModal.set(false)"
              class="text-gray-500 hover:text-white cursor-pointer text-lg leading-none"
            >
              ✕
            </button>
          </div>
          <div class="px-5 py-2 border-b border-gray-700 shrink-0">
            <button
              (click)="toggleSelectAll()"
              class="text-xs text-teal-300 hover:text-teal-200 cursor-pointer transition-colors"
            >
              {{ selectedIds().size === seeds().length ? 'Deselect All' : 'Select All' }}
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-2">
            @for (seed of seeds(); track seed.id) {
              <label class="flex items-start gap-2 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  [checked]="selectedIds().has(seed.id)"
                  (change)="toggleSeedSelected(seed.id)"
                  class="mt-0.5 shrink-0 accent-teal-500 cursor-pointer"
                />
                <span class="text-xs text-gray-300 truncate">{{ seed.title }}</span>
              </label>
            }
          </div>
          <div
            class="shrink-0 border-t border-gray-700 px-5 py-3 flex items-center justify-between"
          >
            <span class="text-xs text-gray-500">{{ selectedIds().size }} selected</span>
            <div class="flex gap-2">
              <button
                (click)="showConsolidateModal.set(false)"
                class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="requestConsolidate()"
                [disabled]="selectedIds().size < 2"
                class="px-4 py-1.5 text-sm bg-teal-600 text-white rounded enabled:hover:bg-teal-500 enabled:cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default"
              >
                Consolidate
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Consolidate confirmation -->
    @if (confirmingConsolidate()) {
      <div
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && confirmingConsolidate.set(false)"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-[380px] shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-gray-100 font-semibold mb-1">
            Consolidate {{ selectedIds().size }} seeds?
          </h3>
          <p class="text-xs text-gray-400 mb-4">
            The selected seeds will be sent to the assistant and merged into a single compacted
            seed. The originals will be archived, not deleted.
          </p>
          <div class="flex gap-2 justify-end">
            <button
              (click)="confirmingConsolidate.set(false)"
              class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="consolidateSeeds()"
              class="px-4 py-1.5 text-sm bg-teal-600 text-white rounded hover:bg-teal-500 cursor-pointer transition-colors"
            >
              Consolidate
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Consolidating in progress -->
    @if (consolidating()) {
      <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-6 w-[320px] shadow-xl flex flex-col items-center gap-3"
        >
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400"></div>
          <p class="text-sm text-gray-300">Consolidating seeds…</p>
        </div>
      </div>
    }

    <!-- Name consolidated seed -->
    @if (showRenameModal()) {
      <div
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        (mousedown)="backdropMousedownTarget = $event.target"
        (click)="backdropMousedownTarget === $event.currentTarget && skipRename()"
      >
        <div
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 w-[380px] shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-gray-100 font-semibold mb-1">Name your consolidated seed</h3>
          <p class="text-xs text-gray-400 mb-3">
            Keep the default or give it a more descriptive title.
          </p>
          <input
            [(ngModel)]="renameText"
            (keydown.enter)="confirmRename()"
            class="w-full bg-gray-900 border border-teal-600 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none mb-4"
          />
          <div class="flex gap-2 justify-end">
            <button
              (click)="skipRename()"
              class="px-4 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              Keep Default
            </button>
            <button
              (click)="confirmRename()"
              [disabled]="!renameText.trim()"
              class="px-4 py-1.5 text-sm bg-teal-600 text-white rounded enabled:hover:bg-teal-500 enabled:cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class WorkspaceInnerLeftComponent implements OnInit {
  private authService = inject(AuthService);

  @Output() startConv = new EventEmitter<any>();
  @Output() apply = new EventEmitter<any>();
  @Output() dataLoaded = new EventEmitter<void>();

  seeds = signal<any[]>([]);
  showSeedModal = signal(false);
  selectedSeed = signal<any | null>(null);
  confirmingDelete = signal(false);
  compressing = signal(false);
  consolidating = signal(false);
  confirmingConsolidate = signal(false);
  showConsolidateModal = signal(false);
  selectedIds = signal<Set<number>>(new Set());
  showRenameModal = signal(false);
  renameText = '';
  private pendingConsolidatedSeed: any | null = null;

  editingTitle = signal(false);
  editTitleText = '';

  editingContent = signal(false);
  editContentText = '';
  backdropMousedownTarget: EventTarget | null = null;

  ngOnInit() {
    this.load();
  }

  load() {
    this.authService.getSeeds().subscribe({
      next: (s) => {
        this.seeds.set(s);
        this.dataLoaded.emit();
      },
      error: () => {
        this.dataLoaded.emit();
      },
    });
  }

  openDetail(seed: any) {
    this.selectedSeed.set(seed);
    this.showSeedModal.set(true);
    this.confirmingDelete.set(false);
    this.editingTitle.set(false);
    this.editingContent.set(false);
  }

  closeSeedModal() {
    this.showSeedModal.set(false);
    this.selectedSeed.set(null);
    this.confirmingDelete.set(false);
    this.editingTitle.set(false);
    this.editingContent.set(false);
  }

  startEditTitle() {
    this.editTitleText = this.selectedSeed()!.title;
    this.editingTitle.set(true);
  }

  saveTitle() {
    if (!this.editingTitle()) return;
    const title = this.editTitleText.trim();
    if (!title) {
      this.cancelTitle();
      return;
    }
    const seed = this.selectedSeed()!;
    this.authService.updateSeed(seed.id, { title }).subscribe({
      next: (updated) => {
        this.seeds.update((ss) => ss.map((s) => (s.id === updated.id ? updated : s)));
        this.selectedSeed.set(updated);
        this.editingTitle.set(false);
      },
      error: () => this.editingTitle.set(false),
    });
  }

  cancelTitle() {
    this.editingTitle.set(false);
    this.editTitleText = '';
  }

  startEditContent() {
    this.editContentText = this.selectedSeed()!.content;
    this.editingContent.set(true);
  }

  saveContent() {
    const content = this.editContentText.trim();
    if (!content) {
      this.cancelContent();
      return;
    }
    const seed = this.selectedSeed()!;
    this.authService.updateSeed(seed.id, { content }).subscribe({
      next: (updated) => {
        this.seeds.update((ss) => ss.map((s) => (s.id === updated.id ? updated : s)));
        this.selectedSeed.set(updated);
        this.editingContent.set(false);
      },
      error: () => this.editingContent.set(false),
    });
  }

  cancelContent() {
    this.editingContent.set(false);
    this.editContentText = '';
  }

  compress() {
    const seed = this.selectedSeed()!;
    if (this.compressing()) return;
    this.compressing.set(true);
    this.authService.compressSeed(seed.id).subscribe({
      next: (newSeed) => {
        this.seeds.update((ss) => [newSeed, ...ss]);
        this.compressing.set(false);
        this.closeSeedModal();
      },
      error: () => this.compressing.set(false),
    });
  }

  openConsolidateModal() {
    if (this.seeds().length < 2) return;
    this.selectedIds.set(new Set());
    this.showConsolidateModal.set(true);
  }

  toggleSeedSelected(id: number) {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll() {
    this.selectedIds.set(
      this.selectedIds().size === this.seeds().length
        ? new Set()
        : new Set(this.seeds().map((s) => s.id)),
    );
  }

  requestConsolidate() {
    if (this.selectedIds().size < 2) return;
    this.showConsolidateModal.set(false);
    this.confirmingConsolidate.set(true);
  }

  consolidateSeeds() {
    const ids = Array.from(this.selectedIds());
    if (this.consolidating() || ids.length < 2) return;
    this.confirmingConsolidate.set(false);
    this.consolidating.set(true);
    this.authService.consolidateSeeds(ids).subscribe({
      next: (newSeed: any) => {
        const idSet = new Set(ids);
        this.seeds.update((ss) => [newSeed, ...ss.filter((s) => !idSet.has(s.id))]);
        this.selectedIds.set(new Set());
        this.consolidating.set(false);
        this.pendingConsolidatedSeed = newSeed;
        this.renameText = newSeed.title;
        this.showRenameModal.set(true);
      },
      error: () => this.consolidating.set(false),
    });
  }

  skipRename() {
    this.showRenameModal.set(false);
    this.pendingConsolidatedSeed = null;
    this.renameText = '';
  }

  confirmRename() {
    const seed = this.pendingConsolidatedSeed;
    const title = this.renameText.trim();
    if (!seed || !title || title === seed.title) {
      this.skipRename();
      return;
    }
    this.authService.updateSeed(seed.id, { title }).subscribe({
      next: (updated) => {
        this.seeds.update((ss) => ss.map((s) => (s.id === updated.id ? updated : s)));
        this.skipRename();
      },
      error: () => this.skipRename(),
    });
  }

  deleteSeed() {
    const seed = this.selectedSeed()!;
    this.authService.deleteSeed(seed.id).subscribe({
      next: () => {
        this.seeds.update((ss) => ss.filter((s) => s.id !== seed.id));
        this.closeSeedModal();
      },
      error: () => {},
    });
  }

  startConvEmit(seed: any) {
    this.closeSeedModal();
    this.startConv.emit(seed);
  }

  applyEmit(seed: any) {
    this.apply.emit(seed);
  }

  formatDate(ts: string) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-CA');
  }
}
