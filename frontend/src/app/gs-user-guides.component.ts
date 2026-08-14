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

import { Component } from '@angular/core';

@Component({
  selector: 'app-gs-user-guides',
  standalone: true,
  template: `
    <div class="p-10 max-w-3xl space-y-6 text-gray-300">
      <h1 class="text-2xl font-bold text-gray-100 mb-6">User Guide</h1>

      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">
          <span class="glow-text">Phase 1 — Set your goals</span>
        </h2>
        <p>Open the Goals panel and add at least three goals. Once you have three, you advance to Phase 2.</p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">
          <span class="glow-text">Phase 2 — Review your constraints</span>
        </h2>
        <p>
          Open the Constraints panel. A default set is provided — read it, edit it if needed, then save.
          Constraints are injected into every conversation to shape how the model responds.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">
          <span class="glow-text">Phase 3 — Start a conversation</span>
        </h2>
        <p>
          Create a conversation from the sidebar. You can start fresh, pick a seed from your bank, or use
          <span class="text-gray-200 font-medium">Start from Last Seed</span> to carry recent context forward.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">Session intent</h2>
        <p>Each conversation requires a brief intent. The model uses it to keep the session on track.</p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">Seeds</h2>
        <p>
          Use the <span class="text-gray-200 font-medium">Seed</span> button to generate a seed from the
          current conversation. Seeds are saved to your bank and can be used to start or enrich future conversations.
          Consolidate older seeds when the bank gets cluttered.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">Goals and constraints</h2>
        <p>
          Both live in the left panel. Edit them at any time and use the apply button to reinject the
          updated values into an open conversation.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">Audit</h2>
        <p>
          Audits trigger periodically and ask a set of questions about your goals and progress. The latest
          audit summary is injected into new conversations as additional context.
        </p>
      </section>
    </div>
  `,
})
export class GsUserGuidesComponent {}
