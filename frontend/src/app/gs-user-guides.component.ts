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
        <p>
          Open the Goals panel from the chat page. Add at least three goals. Concrete things that
          you want to achieve. Once you have at least three (you can add more), you advance to Phase
          2.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">
          <span class="glow-text">Phase 2 — Review your constraints</span>
        </h2>
        <p>
          Open the Constraints panel. You've been given a default constraint set to start with. Read
          it. Edit it if it doesn't fit. When you save, you advance to Phase 3. Constraints are
          applied to every conversation — they shape how the model is allowed to respond.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">
          <span class="glow-text">Phase 3 — Start a conversation</span>
        </h2>
        <p>
          Create a conversation from the sidebar. From the new conversation dialog, use
          <span class="text-gray-200 font-medium">Start from Last Seed</span>
          to carry most recent context forward, pick one from your seed bank or start fresh.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">Seeds</h2>
        <p>
          Use the <span class="text-gray-200 font-medium">Seed</span> button to generate a seed from
          the current conversation. Seeds are saved to your bank with a title. From the left panel,
          apply a seed to the current conversation or start a new one from it. When you get too many
          seeds you can consolidate and compress them as needed.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">Goals and constraints</h2>
        <p>
          Both live in the left panel. Edit them there, then use the apply button to reinject the
          current values into an open conversation. These are automatically injected into every new
          conversation.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">Session intent</h2>
        <p>
          Each session requires the user enter an intent for the current conversation. This helps to
          keep the model (and you) aligned on the task at hand. The model gets prompted to steer you
          back towards your intent if you meander too much.
        </p>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-gray-200 mb-2">Audit</h2>
        <p>
          Audit is there to anchor your progress through time. It triggers automatically once a week
          and requires you to answer a set of questions about your goals and your progress. Once an
          audit has been performed, a summary of the latest audit gets injected into each
          conversation to enrich the context.
        </p>
      </section>
    </div>
  `,
})
export class GsUserGuidesComponent {}
