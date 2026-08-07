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

import { Component, ViewChild, signal, OnDestroy } from '@angular/core';
import { NavHeaderComponent } from './nav-header.component';
import { WorkspaceChatComponent } from './workspace-chat.component';
import { WorkspacePlannerComponent } from './workspace-planner.component';
import { WorkspaceLeftComponent } from './workspace-left.component';
import { WorkspaceInnerLeftComponent } from './workspace-inner-left.component';
import { WorkspaceNotesComponent } from './workspace-notes.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    NavHeaderComponent,
    WorkspaceChatComponent,
    WorkspacePlannerComponent,
    WorkspaceLeftComponent,
    WorkspaceInnerLeftComponent,
    WorkspaceNotesComponent,
  ],
  template: `
    <div
      class="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center bg-gray-900 transition-opacity duration-700"
      style="top: 61px"
      [class.opacity-0]="!loadingData()"
      [class.pointer-events-none]="!loadingData()"
    >
      <div
        class="flex flex-col items-center gap-3 transition-opacity duration-300"
        [class.opacity-0]="!loadingData()"
      >
        <svg
          class="animate-spin text-purple-400"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span class="text-gray-500 text-sm">Loading data…</span>
      </div>
    </div>

    <div class="fixed inset-0 bg-gray-900 flex flex-col" [class.cursor-col-resize]="dragging()">
      <app-nav-header [title]="'Workspace'" />

      <div class="flex flex-1 overflow-hidden">
        <!-- FAR LEFT: Constraints & Goals -->
        <app-workspace-left
          class="shrink-0 bg-gray-900"
          [style.width.px]="leftWidth()"
          [conversationOpen]="!!chatPanel?.selectedConversation()"
          (applyConstraints)="chatPanel.applyConstraints()"
          (applyGoals)="chatPanel.applyGoals(undefined, false)"
          (goalsChanged)="chatPanel.loadGoals()"
          (dataLoaded)="onPanelLoaded()"
          #leftPanel
        />

        <div
          class="w-1 shrink-0 cursor-col-resize bg-gray-700 hover:bg-purple-500 transition-colors duration-150"
          (mousedown)="startResize($event, 'left')"
        ></div>

        <!-- INNER LEFT: Seed Bank -->
        <app-workspace-inner-left
          class="shrink-0 bg-gray-900 border-r border-gray-800"
          [style.width.px]="innerLeftWidth()"
          (startConv)="chatPanel.startConvFromSeed($event)"
          (apply)="chatPanel.applySeed($event)"
          (dataLoaded)="onPanelLoaded()"
          #innerLeftPanel
        />

        <div
          class="w-1 shrink-0 cursor-col-resize bg-gray-700 hover:bg-purple-500 transition-colors duration-150"
          (mousedown)="startResize($event, 'innerLeft')"
        ></div>

        <!-- CENTER: Chat -->
        <app-workspace-chat
          class="flex-1 min-w-0"
          (tasksCreated)="plannerPanel.reload()"
          (seedGenerated)="innerLeftPanel.load()"
          (dataLoaded)="onPanelLoaded()"
          (requestGoals)="leftPanel.openGoalsModal()"
          (requestConstraints)="leftPanel.openConstraintsModal()"
          #chatPanel
        />

        <div
          class="w-1 shrink-0 cursor-col-resize bg-gray-700 hover:bg-purple-500 transition-colors duration-150"
          (mousedown)="startResize($event, 'innerRight')"
        ></div>

        <!-- INNER RIGHT: Notes -->
        <app-workspace-notes
          class="shrink-0 bg-gray-900 border-l border-gray-800"
          [style.width.px]="innerRightWidth()"
          (dataLoaded)="onPanelLoaded()"
        />

        <div
          class="w-1 shrink-0 cursor-col-resize bg-gray-700 hover:bg-purple-500 transition-colors duration-150"
          (mousedown)="startResize($event, 'right')"
        ></div>

        <!-- FAR RIGHT: Planner -->
        <app-workspace-planner
          class="shrink-0"
          [style.width.px]="rightWidth()"
          #plannerPanel
          [conversationOpen]="!!chatPanel?.selectedConversation()"
          (applyWeekPlan)="chatPanel.applyPlannerContext()"
          (dataLoaded)="onPanelLoaded()"
        />
      </div>
    </div>
  `,
})
export class WorkspaceComponent implements OnDestroy {
  @ViewChild('plannerPanel') plannerPanel!: WorkspacePlannerComponent;
  @ViewChild('chatPanel') chatPanel!: WorkspaceChatComponent;
  @ViewChild('innerLeftPanel') innerLeftPanel!: WorkspaceInnerLeftComponent;
  @ViewChild('leftPanel') leftPanel!: WorkspaceLeftComponent;

  loadingData = signal(true);

  private readonly PANEL_COUNT = 5;
  private panelsLoaded = 0;
  private minDelayDone = false;

  constructor() {
    setTimeout(() => {
      this.minDelayDone = true;
      this.checkAllLoaded();
    }, 1000);
  }

  onPanelLoaded() {
    this.panelsLoaded++;
    this.checkAllLoaded();
  }

  private checkAllLoaded() {
    if (this.minDelayDone && this.panelsLoaded >= this.PANEL_COUNT) {
      this.loadingData.set(false);
    }
  }

  leftWidth = signal(288);
  innerLeftWidth = signal(280);
  innerRightWidth = signal(280);
  rightWidth = signal(288);
  dragging = signal(false);

  private draggingPanel: 'left' | 'right' | 'innerLeft' | 'innerRight' | null = null;
  private startX = 0;
  private startWidth = 0;

  private onMouseMove = (e: MouseEvent) => {
    if (!this.draggingPanel) return;
    const dx = e.clientX - this.startX;
    if (this.draggingPanel === 'left') {
      this.leftWidth.set(Math.max(160, Math.min(600, this.startWidth + dx)));
    } else if (this.draggingPanel === 'innerLeft') {
      this.innerLeftWidth.set(Math.max(120, Math.min(400, this.startWidth + dx)));
    } else if (this.draggingPanel === 'innerRight') {
      this.innerRightWidth.set(Math.max(120, Math.min(400, this.startWidth - dx)));
    } else {
      this.rightWidth.set(Math.max(160, Math.min(600, this.startWidth - dx)));
    }
  };

  private onMouseUp = () => {
    this.draggingPanel = null;
    this.dragging.set(false);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  startResize(e: MouseEvent, panel: 'left' | 'right' | 'innerLeft' | 'innerRight') {
    e.preventDefault();
    this.draggingPanel = panel;
    this.startX = e.clientX;
    if (panel === 'left') this.startWidth = this.leftWidth();
    else if (panel === 'innerLeft') this.startWidth = this.innerLeftWidth();
    else if (panel === 'innerRight') this.startWidth = this.innerRightWidth();
    else this.startWidth = this.rightWidth();
    this.dragging.set(true);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
}
