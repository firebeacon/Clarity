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
  selector: 'app-workspace-notes',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Header -->
      <div
        class="px-3 py-2 flex items-center justify-center gap-1.5 shrink-0 bg-amber-900/20 border-b border-gray-700 relative"
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Notes</span>
        <button
          (click)="openModal(null)"
          title="New note"
          class="absolute right-3 text-gray-600 hover:text-amber-400 cursor-pointer transition-colors"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <!-- Note list -->
      <div class="flex-1 overflow-y-auto">
        @if (notes().length === 0) {
          <p class="text-gray-600 text-xs text-center mt-6 px-4">
            No notes yet.<br />Press + to create one.
          </p>
        }
        @for (note of notes(); track note.id) {
          <div
            class="group border-b border-gray-800 px-3 py-2 cursor-pointer hover:bg-gray-800/60 transition-colors"
            (click)="openModal(note)"
          >
            <div class="flex items-start gap-1">
              <span class="text-xs font-medium text-gray-200 truncate flex-1">{{
                note.title
              }}</span>
            </div>
            <span class="text-[10px] text-gray-600">{{ formatDate(note.updated_at) }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Note modal -->
    @if (modalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        (click)="closeModal()"
      >
        <div
          class="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[560px] max-h-[75vh] flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal header -->
          <div
            class="flex items-center justify-between px-5 py-3 border-b border-gray-700 shrink-0"
          >
            <span class="text-sm font-semibold text-amber-400">Note</span>
            <button
              (click)="closeModal()"
              class="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Modal body -->
          <div class="flex flex-col gap-3 p-5 flex-1 overflow-y-auto min-h-0">
            <input
              [(ngModel)]="editTitle"
              placeholder="Title"
              class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600"
            />
            <textarea
              [(ngModel)]="editBody"
              placeholder="Write your note here…"
              rows="12"
              class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600 resize-none leading-relaxed flex-1"
            ></textarea>
          </div>

          <!-- Modal footer -->
          <div
            class="flex items-center justify-between px-5 py-3 border-t border-gray-700 shrink-0 gap-3"
          >
            @if (confirmingDelete()) {
              <span class="text-xs text-gray-400">Are you sure?</span>
              <div class="flex gap-2">
                <button
                  (click)="confirmingDelete.set(false)"
                  class="px-4 py-1.5 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  (click)="deleteNote()"
                  class="px-4 py-1.5 rounded text-xs font-medium bg-red-800/60 hover:bg-red-700 text-red-100 cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            } @else {
              @if (modalNote()) {
                <button
                  (click)="confirmingDelete.set(true)"
                  class="px-4 py-1.5 rounded text-xs font-medium text-gray-600 hover:text-red-400 cursor-pointer transition-colors"
                >
                  Delete
                </button>
              } @else {
                <span></span>
              }
              <div class="flex gap-2">
                <button
                  (click)="closeModal()"
                  class="px-4 py-1.5 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  (click)="save()"
                  [disabled]="!editTitle.trim()"
                  class="px-4 py-1.5 rounded text-xs font-medium bg-amber-700/60 hover:bg-amber-700 text-amber-100 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default"
                >
                  Save
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class WorkspaceNotesComponent implements OnInit {
  private authService = inject(AuthService);

  @Output() dataLoaded = new EventEmitter<void>();

  notes = signal<any[]>([]);
  modalOpen = signal(false);
  modalNote = signal<any | null>(null);
  confirmingDelete = signal(false);

  editTitle = '';
  editBody = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.authService.getNotes().subscribe({
      next: (n) => {
        this.notes.set(n);
        this.dataLoaded.emit();
      },
      error: () => {
        this.dataLoaded.emit();
      },
    });
  }

  openModal(note: any | null) {
    this.modalNote.set(note);
    this.editTitle = note?.title ?? '';
    this.editBody = note?.body ?? '';
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
    this.modalNote.set(null);
    this.confirmingDelete.set(false);
  }

  save() {
    const title = this.editTitle.trim();
    if (!title) return;
    const note = this.modalNote();
    if (note) {
      this.authService.updateNote(note.id, title, this.editBody).subscribe({
        next: (updated) => {
          this.notes.update((ns) => ns.map((n) => (n.id === updated.id ? updated : n)));
          this.closeModal();
        },
        error: () => {},
      });
    } else {
      this.authService.createNote(title, this.editBody).subscribe({
        next: (created) => {
          this.notes.update((ns) => [created, ...ns]);
          this.closeModal();
        },
        error: () => {},
      });
    }
  }

  deleteNote() {
    const note = this.modalNote();
    if (!note) return;
    this.authService.deleteNote(note.id).subscribe({
      next: () => {
        this.notes.update((ns) => ns.filter((n) => n.id !== note.id));
        this.closeModal();
      },
      error: () => {},
    });
  }

  formatDate(ts: string) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-CA');
  }
}
